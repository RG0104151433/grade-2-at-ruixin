/* ============================================================================
 * engine/game-race-start.js —— Game 方法组 · 发车演出（Home 戴 VR → OASIS）
 * ----------------------------------------------------------------------------
 * 玩家在 Home 首次戴上 VR 进入 OASIS 前，插入约 4.4s 的开场演出：
 *   Home 淡出 → 三张红灯图（1.2 / 1.3 / 1.2s，相邻约 120ms 交叉淡切，图下配文）
 *   → 淡到黑 → 加载 oasis → 中央显示「红灯熄灭——比赛开始。」0.6s → 交还控制。
 * 演出期间 status 维持 busy（update 不跑）：不移动、不判危险、Home 热点不可再点。
 *
 * 插入点：story_config 中 VR 分支的 `raceStart` 事件（替代原 fade+changeMap+fade）。
 * 只播一次：save flag `race_start_seen`（开演前幂等写入；newGame 会 reset）。
 * 缺图/无容器：纯文字或直接按原路径进关，绝不卡屏；图片全部预加载。
 * reduced-motion：无长淡入淡出，三图仍按序，总时长约 2s。
 * 静音：仅复用 Audio2（音量 0 时自身静默），不新增音频依赖。
 * 只读约束：不改 Home 解锁条件、OASIS 几何/危险物/物理/出口/存档字段语义。
 * 加载顺序：game.js 之后（与其它 Game 方法组一致）。
 * ==========================================================================*/
'use strict';
(function () {
  const SRC = [
    'image/bg_race_start_light1.png',
    'image/bg_race_start_light2.png',
    'image/bg_race_start_light3.png',
  ];
  const LINES = ['race_start_line1', 'race_start_line2', 'race_start_line3'];
  const DUR = [1200, 1300, 1200];          // 每张图显示时长（含交叉淡切），合计 3.7s
  const DUR_REDUCED = [500, 500, 500];     // 减少动态效果：总时长约 2s
  const SKIP_LOCK_MS = 300;                // 开演前 0.3s 不接受跳过
  const CROSS_MS = 120;                    // 相邻图交叉淡切
  const BLACK_MS = 150;                    // 第三张图后淡到黑
  const FINAL_MS = 600;                    // OASIS 上「红灯熄灭」停留
  const FINAL_MS_REDUCED = 450;
  const PRELOAD_CAP_MS = 1000;             // 缺图/慢图上限：最迟 1s 继续

  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  Object.assign(Game.prototype, {
    // 演出参数（测试用纯数据）
    _racePlan(reduced) {
      const r = !!reduced;
      return {
        srcs: SRC.slice(),
        lines: LINES.slice(),
        durs: (r ? DUR_REDUCED : DUR).slice(),
        crossMs: r ? 0 : CROSS_MS,
        blackMs: r ? 60 : BLACK_MS,
        finalMs: r ? FINAL_MS_REDUCED : FINAL_MS,
        skipLockMs: SKIP_LOCK_MS,
      };
    },
    _raceReduced() {
      try {
        if (window.SettingsUI && typeof SettingsUI.current === 'function' && SettingsUI.current().motionFx === false) return true;
      } catch (e) { /* ignore */ }
      try {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
      } catch (e) { /* ignore */ }
      return false;
    },
    _raceEl() {
      if (typeof document === 'undefined' || !document.getElementById) return null;
      const box = document.getElementById('race-start');
      if (!box) return null;
      const imgs = ['race-img-0', 'race-img-1', 'race-img-2'].map(id => document.getElementById(id)).filter(Boolean);
      const text = document.getElementById('race-text');
      return { box, imgs, text };
    },
    _raceSetText(el, t) {
      if (el && el.text && el.text.textContent !== t) el.text.textContent = t;
    },
    /* 显示第 idx 张图：
     keepOthers=true（切图时）：只让新图淡入，旧图保持全显 —— 新图从旧图上
     覆盖上过渡，交叉中点不会两张同时半透明透出黑底；之后由 _raceHideOthers
     等新图完全显现后再瞬间隐藏旧图，实现「连续出现、不闪黑」。
     旧图在过渡期间保持 inactive 会被瞬间隐藏，故切图阶段不触碰旧图。 */
    _raceShowImage(el, idx, fadeMs, keepOthers) {
      if (!el) return;
      for (let j = 0; j < el.imgs.length; j++) {
        const img = el.imgs[j];
        try {
          // 图片已在预加载阶段下载；这里同步 src 并做交叉淡切（已缓存不闪烁）
          if (SRC[j] && img.getAttribute('src') !== SRC[j]) img.setAttribute('src', SRC[j]);
          // 仅新图参与过渡；其他图即时切换，避免隐藏瞬间再露半透明中间态
          img.style.transition = (fadeMs > 0 && j === idx) ? ('opacity ' + fadeMs + 'ms ease') : 'none';
        } catch (e) { /* ignore */ }
        if (j === idx) img.classList.add('active');
        else if (!keepOthers) img.classList.remove('active');
      }
    },
    /* 隐藏除 idx 外的所有图（无过渡；此时新图已完全覆盖，视觉无跳变） */
    _raceHideOthers(el, idx) {
      if (!el) return;
      for (let j = 0; j < el.imgs.length; j++) {
        if (j !== idx) { try { el.imgs[j].classList.remove('active'); } catch (e) { /* ignore */ } }
      }
    },
    // 可跳过等待：skip 置位或到时即返回（40ms 轮询，对暂停/后台安全）
    _raceWait(ms) {
      return new Promise(resolve => {
        const t0 = now();
        const tick = () => {
          const c = this._raceCutscene;
          if (!c || c.skip || (now() - t0) >= ms) { resolve(); return; }
          this._raceTimer = setTimeout(tick, 40);
        };
        tick();
      });
    },
    // 三图预加载：onload/onerror + 1s 上限（缺图返回 false，不阻塞）
    _racePreload() {
      if (typeof Image === 'undefined') return Promise.resolve([false, false, false]);
      const load = src => new Promise(resolve => {
        const img = new Image();
        let done = false;
        const fin = ok => { if (!done) { done = true; resolve(ok); } };
        img.onload = () => fin(true);
        img.onerror = () => { console.warn('[race-start] 缺图：' + src + '，本张改为纯文字演出'); fin(false); };
        setTimeout(() => fin(false), PRELOAD_CAP_MS);
        img.src = src;
      });
      return Promise.all(SRC.map(load));
    },
    _raceHideChapterCard() {
      if (typeof document === 'undefined' || !document.getElementById) return;
      const cc = document.getElementById('chapter-card');
      if (cc) { cc.classList.remove('show'); cc.classList.add('hidden'); }
      clearTimeout(this._chapterTimer);
    },
    _raceHideOverlay(el) {
      if (!el) return;
      el.box.classList.remove('show');
      el.box.classList.remove('rs-oasis');
      setTimeout(() => { if (el.box) el.box.classList.add('hidden'); }, 260);
      for (const img of el.imgs) { try { img.classList.remove('active'); } catch (e) { /* ignore */ } }
    },
    _raceCleanup() {
      if (this._raceTimer) { clearTimeout(this._raceTimer); this._raceTimer = null; }
      this._raceCutscene = null;
    },
    // 跳过输入：Esc/Enter/空格/点击。capture 阶段 stopPropagation，避免触发 Esc 暂停。
    _raceBindInput(el) {
      if (this._raceInputBound) return;
      this._raceInputBound = true;
      const onKey = e => {
        const c = this._raceCutscene;
        if (!c) return;
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          if (c.canSkip) c.skip = true;
        }
      };
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('keydown', onKey, true);
      }
      if (el && el.box && typeof el.box.addEventListener === 'function') {
        el.box.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (this._raceCutscene && this._raceCutscene.canSkip) this._raceCutscene.skip = true;
        });
      }
    },
    /* 事件入口：完整演出（首次）或直接进关（已看过/无容器）。 */
    async playRaceStart(ev) {
      const map = (ev && ev.map) || 'oasis';
      const spawn = (ev && ev.spawn) || { col: 3, row: 14, facing: 1 };
      const el = this._raceEl();
      const already = this.save.has('race_start_seen');
      if (!already) {
        // 开演前幂等写入：刷新/死亡/复生/从其它场景返回都不再重播（新游戏 reset 会清空）
        this.save.addFlags(['race_start_seen']);
        this.save.persist();
      }
      // 已看过或没有演出容器 → 原路径进关（保留一次短淡变）
      if (already || !el) {
        await this.fadeOut();
        this.loadLevel(map, spawn, spawn.facing);
        await this.fadeIn();
        return;
      }

      const reduced = this._raceReduced();
      const plan = this._racePlan(reduced);
      const okFlags = await this._racePreload();   // 先全部预加载，避免白屏/闪烁
      this._raceCutscene = { skip: false, canSkip: false };
      this._raceBindInput(el);
      setTimeout(() => { if (this._raceCutscene) this._raceCutscene.canSkip = true; }, plan.skipLockMs);

      el.box.classList.remove('hidden');
      el.box.classList.toggle('rs-reduced', reduced);
      el.box.classList.remove('rs-oasis');
      void el.box.offsetWidth;
      el.box.classList.add('show');
      for (const img of el.imgs) img.classList.remove('active');

      // 三张图 + 文案 + 三次逐渐升高的短提示音
      for (let i = 0; i < 3; i++) {
        // 图0 黑底淡入；图1/2 从上一张上淡入覆盖（旧图保持全显 → 完全覆盖后再瞬间隐藏，
        // 中间不再出现两张同时半透明露黑底的「闪一下黑」）
        if (okFlags[i]) this._raceShowImage(el, i, plan.crossMs, i > 0);
        this._raceSetText(el, I18N.t(plan.lines[i]));
        if (window.Audio2 && Audio2.reveal) Audio2.reveal(i + 1);
        if (i > 0 && plan.crossMs > 0) {
          await this._raceWait(plan.crossMs);             // 等新图完全淡入
          if (okFlags[i]) this._raceHideOthers(el, i);    // 再瞬间隐藏上一张
        }
        await this._raceWait(plan.durs[i]);
        if (this._raceCutscene.skip) break;
      }

      if (this._raceCutscene.skip) {
        // 跳过：直接安全进入 OASIS 并恢复控制（由 startEvents 收尾置 running）
        this.loadLevel(map, spawn, spawn.facing);
        this._raceHideChapterCard();
        this._raceHideOverlay(el);
        this._raceCleanup();
        return;
      }

      // 第三张淡出到黑 → 加载 OASIS（不先露 OASIS 旧画面/物理）
      this._raceShowImage(el, -1, 0);
      await this._raceWait(plan.blackMs);
      this.loadLevel(map, spawn, spawn.facing);
      this._raceHideChapterCard();

      // 在 OASIS 画面上显示「红灯熄灭——比赛开始。」，随后交还控制
      for (const img of el.imgs) { img.style.transition = 'none'; img.classList.remove('active'); }
      el.box.classList.add('rs-oasis');
      this._raceSetText(el, I18N.t('race_start_go'));
      if (window.Audio2 && Audio2.chapter) Audio2.chapter(0);   // 低沉发车音
      await this._raceWait(plan.finalMs);

      this._raceSetText(el, '');
      this._raceHideOverlay(el);
      this._raceCleanup();
    },
  });
})();
