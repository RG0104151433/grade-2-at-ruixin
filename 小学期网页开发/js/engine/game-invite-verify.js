/* ============================================================================
 * engine/game-invite-verify.js —— Game 方法组 · 莫罗接待台 · 邀请验证（阶段4）
 * ----------------------------------------------------------------------------
 * 玩家在接待台按 E（「E · 验证邀请」）后由 morrov_gate 的 inviteVerify 事件驱动：
 *   ① 扫描台待机 + 莫罗第一句对白；
 *   ② 扫描中：其余对白逐行播放（扫描台由渲染层按 _inviteScan 状态程序绘制，
 *      不画进图片）；
 *   ③ 验证通过：程序 UI 结果面板（三行读取结果，等待 E / Enter / 空格 / Esc /
 *      点击确认），面板文案不在图片里；
 *   ④ 维修支线回应：save 里有 maint.flag（oasis_maintenance_seen）时追加莫罗一句
 *      ——只提供回应，不发钥匙、不改变技能和难度；
 *   ⑤ 证据由事件链后续的 discoverClue 写入（Game.discoverClue / Save.discoverClue
 *      按 id 去重，天然幂等，不会创建重复证据）。
 *
 * 约束：
 *   · 交互触发（不自动开始）；对白期间 status=busy（update 不跑）⇒ 玩家停止移动、
 *     重复按 E 不会重启扫描；
 *   · 已验证（clue 已存在）时走 ifClue then 短句分支，不重播扫描；
 *   · 无 DOM（无头/测试环境）时结果面板直接继续，绝不卡流程；
 *   · 暂停期间挂起推进（waitWhilePaused），过期旅程令牌立即中断并收起扫描台。
 * 加载顺序：game.js 之后（与其它 Game 方法组一致）。
 * ===========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  Object.assign(Game.prototype, {
    /* 扫描台状态（game-archive-hall 渲染层读取）：null=收起 / {state, t0} */
    _inviteScanState(state) {
      if (!this._inviteScan || this._inviteScan.state !== state) {
        this._inviteScan = { state: state, t0: now() };
      }
    },
    /* 结果面板 DOM（缺失 = 无头环境，直接继续） */
    _inviteResultEl() {
      if (typeof document === 'undefined' || !document.getElementById) return null;
      const box = document.getElementById('invite-result');
      if (!box) return null;
      return {
        box,
        title: document.getElementById('invite-result-title'),
        lines: document.getElementById('invite-result-lines'),
        btn: document.getElementById('invite-result-btn'),
      };
    },
    _inviteResultHide() {
      if (typeof document === 'undefined') return;
      const box = document.getElementById('invite-result');
      if (box) { box.classList.remove('show'); box.classList.add('hidden'); }
    },
    /* 程序 UI 结果面板：E / Enter / 空格 / Esc / 点击确认后继续（暂停期间不响应） */
    _inviteResultShow(res) {
      return new Promise(resolve => {
        if (typeof document === 'undefined') { resolve(); return; }
        const box = document.getElementById('invite-result');
        const title = document.getElementById('invite-result-title');
        const list = document.getElementById('invite-result-lines');
        const btn = document.getElementById('invite-result-btn');
        if (!box || !list) { resolve(); return; }
        const zh = !(typeof isEn === 'function' && isEn());
        const rows = (zh ? res.lines : (res.lines_en || res.lines)) || [];
        if (title) title.textContent = pickText(res.title, res.title_en);
        list.innerHTML = '';
        for (const r of rows) {
          const li = document.createElement('li');
          li.textContent = r;
          list.appendChild(li);
        }
        if (btn) btn.textContent = (window.I18N && I18N.t) ? I18N.t('invite_result_continue') : '继续';
        box.classList.remove('hidden');
        void box.offsetWidth;
        box.classList.add('show');
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          document.removeEventListener('keydown', onKey, true);
          if (btn) btn.removeEventListener('click', finish);
          box.removeEventListener('pointerdown', finish);
          box.classList.remove('show');
          setTimeout(() => { if (box) box.classList.add('hidden'); }, 240);
          resolve();
        };
        const onKey = (e) => {
          if (window.Pause && Pause.paused) return;
          if (e.code === 'Enter' || e.code === 'Escape' || e.code === 'Space' || e.code === 'KeyE') {
            e.preventDefault();
            finish();
          }
        };
        box.addEventListener('pointerdown', finish);
        if (btn) btn.addEventListener('click', finish);
        document.addEventListener('keydown', onKey, true);
      });
    },
    /* 事件入口：完整验证演出（对白 + 扫描台 + 结果面板 + 支线回应）。
       证据写入不在本方法内 —— 由事件链后续 discoverClue 完成（幂等）。 */
    async playInviteVerify(ev, token) {
      ev = ev || {};
      const lines = Array.isArray(ev.lines) ? ev.lines : [];
      const alive = () => (token == null || token === this._runToken);
      // 莫罗切换到「抬手说明」姿态（对白期间）
      this._moroPose = 'speak';
      try {
        // ① 待机：莫罗第一行（把邀请放上读取台）
        this._inviteScanState('idle');
        await this.waitWhilePaused();
        if (!alive()) return;
        if (lines[0]) await this.dialog.show([pickText(lines[0].text, lines[0].text_en)]);
        await this.waitWhilePaused();
        if (!alive()) return;
        // ② 扫描：其余对白在扫描中进行
        this._inviteScanState('scanning');
        await this.waitWhilePaused();
        if (!alive()) return;
        for (const l of lines.slice(1)) {
          await this.dialog.show([pickText(l.text, l.text_en)]);
          await this.waitWhilePaused();
          if (!alive()) return;
        }
        // ③ 验证通过：程序 UI 面板（三行结果，确认后继续）
        this._inviteScanState('verified');
        await this.waitWhilePaused();
        if (!alive()) return;
        await this._inviteResultShow(ev.result || {});
        if (!alive()) return;
        // ④ 维修支线回应（只读已完成三条维护记录的唯一状态；不发钥匙、不改技能/难度）
        const m = ev.maint;
        if (m && m.flag && this.save.has(m.flag)) {
          await this.dialog.show([pickText(m.text, m.text_en)]);
        }
      } finally {
        this._inviteScan = null;      // 演出结束/中断都收起扫描台
        this._inviteResultHide();     // 面板兜底隐藏（中断不残留）
        this._moroPose = 'idle';      // 恢复静立姿态（若大门已开由 _moroCurrentPose 强制 point）
      }
    },
  });
})();