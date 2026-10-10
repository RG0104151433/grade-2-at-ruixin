/* ============================================================================
 * engine/game-log.js —— Game 方法组 · 任务日志（优化方案 B2）
 * ----------------------------------------------------------------------------
 * 常驻目标条的可展开版：当前区域 / 当前目标（长文本）/ 三钥进度 / 已发现线索，
 * 以及展开时的冻结与恢复、常驻目标条点击、J 键绑定。
 * ----------------------------------------------------------------------------
 * 由 js/engine/game-progress.js 按职责拆分而来（B2 落地时抽出，原第 336-441 行）。
 * 方法体未作任何改动；因改用对象字面量承载，只在每个方法结束的大括号后补了
 * 成员分隔逗号（原块已带逗号，整段原样搬运）。
 * 加载顺序契约：必须晚于 js/engine/game.js（与其他 game-*.js 相同）。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  /* ------------------------- B2：任务日志 -------------------------
     常驻目标条的可展开版：当前区域 + 当前目标（长文本）+ 三钥进度 + 已发现线索。
     展开时冻结游戏（复用统一暂停入口，但不弹暂停菜单），收起后原样恢复；
     若打开前已处于暂停（Esc / 小游戏自身暂停），收起时不动暂停状态。 */
  isObjectiveLogOpen() {
    const el = document.getElementById('objective-log');
    return !!el && !el.classList.contains('hidden');
  },
  closeObjectiveLog(silent) {
    const el = document.getElementById('objective-log');
    if (!el || el.classList.contains('hidden')) return;
    el.classList.add('hidden');
    const bar = document.getElementById('hud-objective');
    if (bar) bar.setAttribute('aria-expanded', 'false');
    if (this._logPaused) {
      this._logPaused = false;
      if (!silent) this.resumeGame();
    }
    if (!silent && window.Audio2 && Audio2.uiClose) Audio2.uiClose();
  },
  toggleObjectiveLog(force) {
    const el = document.getElementById('objective-log');
    if (!el) return false;
    const open = force != null ? !!force : el.classList.contains('hidden');
    if (!open) { this.closeObjectiveLog(); return false; }
    if (!el.classList.contains('hidden')) return true;   // 已展开：幂等，不动暂停状态
    this.updateObjectiveLog();
    el.classList.remove('hidden');
    const bar = document.getElementById('hud-objective');
    if (bar) bar.setAttribute('aria-expanded', 'true');
    const alreadyPaused = (this.status === 'paused') ||
      !!(this._activeMinigame && this._activeMinigame.paused) || Pause.paused;
    this._logPaused = !alreadyPaused &&
      (this.status === 'running' || this.status === 'busy' || this.status === 'minigame');
    if (this._logPaused) { this.pauseGame(); PauseMenu.hide(true); }
    if (window.Audio2 && Audio2.uiOpen) Audio2.uiOpen();
    return true;
  },
  // 日志内容：区域 + 当前目标 + 三钥进度 + 已发现线索（线索取自 E1 数据）
  updateObjectiveLog() {
    const areaEl = document.getElementById('ol-area');
    if (areaEl) areaEl.textContent = (this.level ? pick(this.level, 'name') : '') || '';
    const nowEl = document.getElementById('ol-now');
    if (nowEl) nowEl.textContent = this.currentObjective();
    const markEl = document.getElementById('ol-now-mark');
    if (markEl) markEl.dataset.kind = this.objectiveKind();
    const keysEl = document.getElementById('ol-keys');
    if (keysEl) {
      keysEl.innerHTML = '';
      for (const m of this.keyMeta()) {
        const has = this.save.has('key' + m.id);
        const li = document.createElement('li');
        li.className = 'ol-item ' + (has ? 'is-done' : 'is-todo');
        const mark = document.createElement('span');
        mark.className = 'ol-mark';
        mark.textContent = has ? '◆' : '◇';   // 形编码：实心=已得 / 空心=未得
        const name = document.createElement('span');
        name.className = 'ol-name';
        name.textContent = I18N.t(m.nameKey);
        const goal = document.createElement('span');
        goal.className = 'ol-goal';
        goal.textContent = I18N.t(m.goalKey);
        li.appendChild(mark); li.appendChild(name); li.appendChild(goal);
        keysEl.appendChild(li);
      }
    }
    const cluesEl = document.getElementById('ol-clues');
    if (cluesEl) {
      cluesEl.innerHTML = '';
      const ids = (this.save.clues || []).map(record => record.id);
      if (!ids.length) {
        const li = document.createElement('li');
        li.className = 'ol-empty';
        li.textContent = I18N.t('log_clues_empty');
        cluesEl.appendChild(li);
      } else {
        /* 2026-09-20：线索正文可复查。
           原实现只渲染 clue.title，玩家在任务日志里只能看到一串标题；
           而终局四协议要求玩家凭「旅途中已经留下的记录」做判断（见 finale_protocol_brief），
           三张年鉴残页、债务与遥测条款等证据却无法回看。此处把正文作为第二行显示，
           并把标题行做成可点击折叠（默认展开），不改变存档与判定逻辑。 */
        for (const id of ids) {
          const clue = this.getClue(id);
          if (!clue) continue;
          const li = document.createElement('li');
          li.className = 'ol-item is-clue has-text';
          const head = document.createElement('div');
          head.className = 'ol-clue-head';
          const mark = document.createElement('span');
          mark.className = 'ol-mark';
          mark.textContent = '●';                // 形编码：圆点=已记录的发现
          const name = document.createElement('span');
          name.className = 'ol-name';
          name.textContent = clue.title;
          head.appendChild(mark); head.appendChild(name);
          li.appendChild(head);
          if (clue.text) {
            const body = document.createElement('div');
            body.className = 'ol-clue-text';
            body.textContent = clue.text;        // textContent：不注入 HTML
            li.appendChild(body);
          }
          cluesEl.appendChild(li);
        }
      }
    }
  },
  // 常驻目标条点击 + J 键（在输入框里打字时不抢键；只在游戏画面内生效）
  bindObjectiveLog() {
    const bar = document.getElementById('hud-objective');
    if (bar) bar.addEventListener('click', () => this.toggleObjectiveLog());
    const close = document.getElementById('objective-log-close');
    if (close) close.addEventListener('click', () => this.toggleObjectiveLog(false));
    addEventListener('keydown', e => {
      if (normKey(e.key) !== 'j' || isEditableTarget(e.target)) return;
      if (window.App && App.currentScreen !== 'screen-game') return;
      if (this.status === 'title' || this.status === 'ending') return;
      e.preventDefault();
      this.toggleObjectiveLog();
    });
  },
});
