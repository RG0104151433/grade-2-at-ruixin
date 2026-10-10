/* ============================================================================
 * engine/minigame-session.js —— 小游戏公共契约 · 会话生命周期（D0）
 * ----------------------------------------------------------------------------
 * 所有剧情玩法（既有三游戏 + 后续旁路接线 / 档案方块 / 扫雷 / 三中继）
 * 统一经由本模块收口，只对外返回中性结果对象：
 *
 *   { outcome, checkpoint, assistUsed, payload }
 *     · outcome     只能是 'won' | 'lost' | 'quit'
 *     · checkpoint  纯进度（行数 / 已接线路 / 已记录数），不承载剧情语义
 *     · assistUsed  本次是否用过辅助
 *     · payload     只放非剧情数据（分数 / 用时 / 统计），禁止写 flag
 *
 * 本模块只回答「玩法如何运行」，不决定「剧情最终写入什么状态」：
 * 不调用 save.addFlags / save.persist，不引用 story_config、i18n、route/nav。
 *
 * 统一边界：
 *   · 暂停（Pause 全局信号）与窗口失焦 / 页面不可见时，tick() 返回 0，
 *     调用方据此冻结限时、下落、扫描与防守计时；恢复后不跳时、不丢时。
 *   · 奖励幂等：commitReward(key, fn) 同一 key 在一次会话内只执行一次，
 *     重试 / 重进 / 刷新重放都不重复发奖。
 *   · 检查点：setCheckpoint / restoreCheckpoint，重试从检查点恢复。
 *
 * 依赖：core.js 的 Pause（可选，缺失时暂停冻结降级为仅手动 pause）。
 * 加载顺序：core.js 之后；游戏模块（含 game-minigames.js）之前。
 * file:// 兼容：无 fetch / 动态 import / ESM。
 * ==========================================================================*/
'use strict';

/* 中性结果唯一合法取值 */
const MINIGAME_OUTCOMES = ['won', 'lost', 'quit'];

/* 旧写法 / 自然语义 → 契约取值（仅做归一，不产生新结果类型） */
const MINIGAME_OUTCOME_ALIASES = {
  win: 'won', success: 'won', clear: 'won', complete: 'won',
  lose: 'lost', failure: 'lost', fail: 'lost', dead: 'lost',
  abort: 'quit', exit: 'quit', cancel: 'quit', leave: 'quit',
};

function normalizeMinigameOutcome(outcome) {
  if (MINIGAME_OUTCOMES.indexOf(outcome) !== -1) return outcome;
  return MINIGAME_OUTCOME_ALIASES[outcome] || null;
}

/* 构造中性结果对象；非法 outcome 直接抛错（防止静默产生第四种状态） */
function makeMinigameResult(outcome, extra) {
  const normalized = normalizeMinigameOutcome(outcome);
  if (!normalized) throw new Error('MinigameSession: invalid outcome "' + outcome + '"');
  const e = extra || {};
  return {
    outcome: normalized,
    checkpoint: e.checkpoint === undefined ? null : e.checkpoint,
    assistUsed: !!e.assistUsed,
    payload: (e.payload && typeof e.payload === 'object') ? e.payload : {},
  };
}

class MinigameSession {
  constructor(opts) {
    opts = opts || {};
    this.id = opts.id || 'minigame';
    this.state = 'idle';                 // idle → intro → playing → paused → success/failure/quit
    this.outcome = null;
    this.checkpoint = opts.checkpoint === undefined ? null : opts.checkpoint;
    this.assist = !!opts.assist;
    this.assistUsed = !!opts.assist;
    this.attempts = 0;
    this.payload = {};
    this.freezeOnPause = opts.freezeOnPause !== false;
    this.freezeOnBlur = opts.freezeOnBlur !== false;
    this._rewarded = Object.create(null);
    this._blurred = false;
    this._beforePause = 'playing';
    this._offPause = null;
    this._onBlur = null;
    this._onFocus = null;
    this._onVisibility = null;
    this._bound = false;
    if (opts.autoBind !== false) this.bind();
  }

  /* ---------------- 环境绑定：全局暂停信号 + 失焦 / 可见性 ---------------- */
  bind() {
    if (this._bound) return this;
    const win = (typeof window !== 'undefined') ? window : null;
    if (this.freezeOnBlur && win && typeof win.addEventListener === 'function') {
      this._onBlur = () => { this._blurred = true; };
      this._onFocus = () => { this._blurred = false; };
      win.addEventListener('blur', this._onBlur);
      win.addEventListener('focus', this._onFocus);
      if (typeof document !== 'undefined' && document && typeof document.addEventListener === 'function') {
        this._onVisibility = () => { this._blurred = !!(document.hidden); };
        document.addEventListener('visibilitychange', this._onVisibility);
      }
    }
    if (this.freezeOnPause && typeof Pause !== 'undefined' && Pause && typeof Pause.onChange === 'function') {
      this._offPause = Pause.onChange(paused => { if (paused) this.pause(); else this.resume(); });
    }
    this._bound = true;
    return this;
  }
  unbind() {
    if (!this._bound) return this;
    const win = (typeof window !== 'undefined') ? window : null;
    if (win && typeof win.removeEventListener === 'function') {
      if (this._onBlur) win.removeEventListener('blur', this._onBlur);
      if (this._onFocus) win.removeEventListener('focus', this._onFocus);
    }
    if (this._onVisibility && typeof document !== 'undefined' && document && typeof document.removeEventListener === 'function') {
      document.removeEventListener('visibilitychange', this._onVisibility);
    }
    if (this._offPause) { this._offPause(); this._offPause = null; }
    this._bound = false;
    return this;
  }
  dispose() { this.unbind(); return this; }

  /* ---------------- 冻结与计时 ---------------- */
  get frozen() { return this._blurred || this.state === 'paused'; }
  /* 唯一计时入口：冻结时返回 0，调用方不得据此推进任何计时 / 进度 */
  tick(dt) { return this.frozen ? 0 : (dt || 0); }

  /* ---------------- 状态机 ---------------- */
  intro() { if (this.state === 'idle') this.state = 'intro'; return this.state; }
  begin() { this.state = 'playing'; this.outcome = null; this.payload = {}; return this.state; }
  pause() {
    if (this.state === 'playing' || this.state === 'intro') {
      this._beforePause = this.state;
      this.state = 'paused';
    }
    return this.state;
  }
  resume() { if (this.state === 'paused') this.state = this._beforePause === 'intro' ? 'intro' : 'playing'; return this.state; }
  isActive() { return this.state === 'intro' || this.state === 'playing' || this.state === 'paused'; }

  /* ---------------- 辅助 / 检查点 ---------------- */
  setAssist(on) { this.assist = !!on; if (this.assist) this.assistUsed = true; return this.assist; }
  setCheckpoint(value) { this.checkpoint = value; return this.checkpoint; }
  restoreCheckpoint() { return this.checkpoint; }

  /* 重试：次数 +1、清空本次结果，但保留检查点与已发奖励（幂等） */
  retry() {
    this.attempts += 1;
    this.outcome = null;
    this.payload = {};
    this.state = 'playing';
    return { attempts: this.attempts, checkpoint: this.checkpoint };
  }

  /* ---------------- 收尾：产出中性结果（不写任何剧情状态） ---------------- */
  finish(outcome, extra) {
    const e = extra || {};
    const result = makeMinigameResult(outcome, {
      checkpoint: e.checkpoint === undefined ? this.checkpoint : e.checkpoint,
      assistUsed: e.assistUsed === undefined ? this.assistUsed : e.assistUsed,
      payload: e.payload || this.payload,
    });
    this.outcome = result.outcome;
    this.state = result.outcome === 'won' ? 'success'
      : (result.outcome === 'lost' ? 'failure' : 'quit');
    return result;
  }
  /* 已收尾则返回当前中性结果，否则返回 null */
  result() {
    if (!this.outcome) return null;
    return makeMinigameResult(this.outcome, {
      checkpoint: this.checkpoint, assistUsed: this.assistUsed, payload: this.payload,
    });
  }

  /* ---------------- 奖励幂等：同一 key 只执行一次 ---------------- */
  commitReward(key, fn) {
    if (this._rewarded[key]) return false;
    this._rewarded[key] = true;
    if (typeof fn === 'function') fn();
    return true;
  }
  hasReward(key) { return !!this._rewarded[key]; }
}
