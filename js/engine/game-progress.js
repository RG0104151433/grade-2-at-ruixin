/* ============================================================================
 * engine/game-progress.js —— Game 方法组 · 结局、钥匙与 HUD
 * ----------------------------------------------------------------------------
 * 结局屏与成就写入、钥匙元数据与持有判定、死亡标记、钥匙获得提示、
 * 技能提示文案与首次学会的浮字、走廊引导小字、当前目标（长/短双份）、HUD 刷新、
 * 底部交互提示条。任务日志（B2）在 game-log.js 中。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 3125-3359 行）。方法体未作任何改动；
 * 因改用对象字面量承载，仅在每个方法结束的大括号后补了成员分隔逗号。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  // E1: definitions live in cfg.clues; the save stores discovery IDs and sources only.
  hasClue(id) { return this.save.hasClue(id); },
  getClue(id) {
    const definitions = this.cfg.clues || {};
    if (!this.hasClue(id) || !Object.prototype.hasOwnProperty.call(definitions, id)) return null;
    const clue = definitions[id];
    const record = this.save.clues.find(item => item.id === id);
    return {
      id, source: record.source,
      title: pick(clue, 'title'), text: pick(clue, 'text'),
      usedBy: (clue.usedBy || []).slice(),
    };
  },
  discoverClue(id) {
    const definitions = this.cfg.clues || {};
    if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(definitions, id)) {
      return { discovered: false, saved: false };
    }
    const clue = definitions[id];
    if (!clue || clue.id !== id || typeof clue.source !== 'string' || !clue.source.trim()) {
      return { discovered: false, saved: false };
    }
    const discovered = this.save.discoverClue(id, clue.source);
    // Retry persistence even for a repeated discovery; an earlier write may have failed.
    const saved = this.save.persist();
    return { discovered, saved };
  },
  // V4 §15.1：结局条件统一入口——线索 id 或派生状态（不新增存档字段）。
  hasState(id) {
    const h = c => this.hasClue(c);
    const s = { debtCleared: h('deal_nolan_accept1'), telemetryActive: h('deal_nolan_accept1') && !h('deal_nolan_void2'), buyoutBinding: (h('deal_nolan_accept2') || h('deal_nolan_honor2')) && !h('deal_nolan_void2'), art3misOnline: h('ally_maze_cover') || h('ally_rescued_maze'), art3misOffline: h('ally_maze_leave') || h('ally_abandoned_maze'), allAlmanac: h('almanac_01') && h('almanac_02') && h('almanac_03') };
    return Object.prototype.hasOwnProperty.call(s, id) ? s[id] : h(id);
  },
  // S1: evaluate declarative finale rules against discoveries from this journey.
  finaleRuleMet(rule) {
    const all = (rule && rule.allOf) || [], any = (rule && rule.anyOf) || [], none = (rule && rule.noneOf) || [], miss = (rule && rule.missingAnyOf) || [];
    return all.every(id => this.hasState(id)) && (!any.length || any.some(id => this.hasState(id))) && none.every(id => !this.hasState(id)) && (!miss.length || miss.some(id => !this.hasState(id)));
  },
  finaleRequirementState(ending) {
    const req = (ending && ending.requirements) || { mode: 'all', rules: [] };
    const rules = req.rules || [];
    const results = rules.map(rule => this.finaleRuleMet(rule));
    const available = req.mode === 'any' ? results.some(Boolean) : results.every(Boolean);
    const gaps = available ? [] : (req.mode === 'any'
      ? [pick(req, 'gap')].filter(Boolean)
      : rules.filter((rule, i) => !results[i]).map(rule => pick(rule, 'gap')).filter(Boolean));
    return { available, gaps };
  },
  async runFinaleChoice(token) {
    const endings = Object.entries(this.cfg.endings || {});
    if (!endings.length) return;
    while (token == null || token === this._runToken) {
      const states = endings.map(([, ending]) => this.finaleRequirementState(ending));
      const labels = endings.map(([, ending], i) => {
        const mark = states[i].available
          ? (I18N.lang === 'en' ? '[SIGNABLE] ' : '【可签署】')
          : (I18N.lang === 'en' ? '[LOCKED] ' : '【缺少条件】');
        return mark + pick(ending, 'label') + '\n' + pick(ending, 'cost');
      });
      const prompt = I18N.lang === 'en'
        ? 'Choose a protocol. Locked protocols will list the exact missing record.'
        : '选择一份协议。未满足的协议会列出具体缺口。';
      const idx = await this.dialog.choose(prompt, labels);
      if (token != null && token !== this._runToken) return;
      if (idx < 0 || !endings[idx]) return;
      if (!states[idx].available) {
        await this.dialog.show(states[idx].gaps);
        continue;
      }
      await this.fadeOut();
      if (token != null && token !== this._runToken) return;
      this.showEnding(endings[idx][0]);
      return;
    }
  },
  finaleReviewLines(ending) {
    return ((ending && ending.reviews) || [])
      .filter(rule => this.finaleRuleMet(rule))
      .map(rule => pick(rule, 'text'))
      .filter(Boolean);
  },
  // D5: spending an analysis credit never removes an E1 discovery record.
  async requestRoadHint(token) {
    if (this.mapId !== 'road' || (token != null && token !== this._runToken)) return false;
    const cfg = this.cfg.maps.road.evidence;
    const stage = cfg.hints.findIndex((id, i) => !this.save.has('road_analysis_' + i));
    if (stage < 0) {
      await this.dialog.show(this.resolveLines({ id: cfg.hints[cfg.hints.length - 1] }));
      return false;
    }
    const credit = cfg.clues.find(id => this.hasClue(id) && !this.save.has('road_spent_' + id));
    if (!credit) {
      await this.dialog.show(this.resolveLines({ id: cfg.noCredit }));
      return false;
    }
    this.save.addFlags(['road_spent_' + credit, 'road_analysis_' + stage]);
    this.save.persist();
    await this.dialog.show(this.resolveLines({ id: cfg.hints[stage] }));
    return true;
  },
  showEnding(id) {
    this.status = 'ending';
    if (window.Audio2 && Audio2.ending) Audio2.ending(id);
    const e = this.cfg.endings[id] || {};
    const el = this.endingEl;
    // Four protocols share the two existing visual themes until V21 supplies dedicated art.
    el.classList.remove('ending-inherit', 'ending-reality');
    el.classList.add(id === 'inherit' || id === 'dome' ? 'ending-inherit' : 'ending-reality');
    const badge = document.getElementById('ending-badge');
    if (badge) badge.textContent = pick(e, 'badge') || I18N.t('ending_default_title');
    document.getElementById('ending-title').textContent = pick(e, 'title') || I18N.t('ending_default_title');
    const review = this.finaleReviewLines(e);
    const lines = [pick(e, 'text'), ...review];
    // V4 §11.2：穹顶托管必须区分「履行旧绑定合同」与「终局新授权」
    if (id === 'dome') lines.push(I18N.t(this.hasState('buyoutBinding') ? 'dome_source_honor' : 'dome_source_new'));
    document.getElementById('ending-text').innerText = lines.filter(Boolean).join('\n\n');
    // 统计数据
    const meta = this.keyMeta();
    const keysGot = meta.filter(m => this.save.has('key' + m.id)).length;
    const keysEl = document.getElementById('ending-keys');
    if (keysEl) keysEl.textContent = keysGot + '/3';
    const achEl = document.getElementById('ending-ach');
    if (achEl) {
      let count = 0;
      try {
        if (window.App && typeof App.getUnlockedAchievements === 'function') {
          count = App.getUnlockedAchievements().length;
        } else if (window.Store) {
          const save = Store.getSave(App.user());
          count = (save && save.achievements) ? save.achievements.length : 0;
        }
      } catch (err) {}
      achEl.textContent = count;
    }
    const nameEl = document.getElementById('ending-name');
    if (nameEl) nameEl.textContent = pick(e, 'name') || pick(e, 'title') || id;
    /* 2026-09-21：结局结算回顾（renderEndingRecap / #ending-recap「旅程复盘」）已整块移除。
       该面板与结局氛围不符，结局页现在直接呈现徽标 / 标题 / 正文 / 统计 / 按钮。
       相关 i18n 键 recap_* 保留为零引用（按本项目「保留定义、勿删文案」惯例）。 */
    const replayBtn = document.getElementById('btn-ending-replay');
    if (replayBtn) replayBtn.onclick = () => { if (window.App && App.go) App.go('screen-achievements'); };
    el.classList.remove('hidden');
    // Each protocol owns its achievement mapping in story_config.
    if (window.App && typeof App.unlockAchievement === 'function') {
      if (e.achievement) App.unlockAchievement(e.achievement);
      // 无伤通行：整局未失败/死亡，且顺利抵达结局
      if (!this.save.has('died')) App.unlockAchievement('runner-flawless');
    }
    if (window.App && typeof App.toast === 'function') {
      App.toast(I18N.t('toast_ending_written'));
    }
  },
  /* [已移除] renderEndingRecap() —— 结局结算回顾面板（#ending-recap「旅程复盘」）。
     2026-09-21 删除：该面板在每个结局出现，与结局画面氛围不符，现结局页直接呈现
     徽标/标题/正文/统计/按钮。i18n 键 recap_* 保留为零引用，勿删文案定义。 */
  // 钥匙元数据：编号 → { 名称, 目标一句话 }（显示走 i18n 键，中文为回退真值）
  keyMeta() {
    return [
      { id: 1, name: '智慧', nameKey: 'hud_key_wisdom', short: '智慧', short_en: 'Wisdom', goal: '登顶图书馆，完成俄罗斯方块挑战', goalKey: 'obj_library' },
      { id: 2, name: '过程', nameKey: 'hud_key_process', short: '过程', short_en: 'Process', goal: '穿越翻转道路，记得回望起点', goalKey: 'obj_road' },
      { id: 3, name: '勇气', nameKey: 'hud_key_courage', short: '勇气', short_en: 'Courage', goal: '在迷雾迷宫中找到出口', goalKey: 'obj_maze' },
    ];
  },
  // 已持有的钥匙编号（用于检测“新获得”并触发提示）
  keysOwned() {
    return [1, 2, 3].filter(i => this.save.has('key' + i));
  },
  // 集齐三钥成就：key1/key2/key3 全部持有即点亮
  checkThreeKeys() {
    if (this.save.has('key1') && this.save.has('key2') && this.save.has('key3')) {
      if (window.App && typeof App.unlockAchievement === 'function') App.unlockAchievement('three-keys');
    }
  },
  // 记录本局曾失败/死亡（供「无伤通行」判定：整局零死亡才点亮）
  markDeath() {
    if (this.save.has('died')) return;
    this.save.addFlags(['died']);
    this.save.persist();
  },
  // 钥匙获得提示：比较前后持有集合，对新增钥匙弹出提示（复用外壳 #toast）
  toastKeysGained(prevOwned) {
    this.checkThreeKeys();
    if (!this._announcedKeys) this._announcedKeys = new Set();
    const gained = this.keysOwned().filter(i => !this._announcedKeys.has(i));
    if (!gained.length) return;
    for (const id of gained) this._announcedKeys.add(id);  // 立即标记，避免事件链结束再次弹出
    // 钥匙获得音：逐把升高；集齐三把再叠一层和弦
    if (window.Audio2) {
      for (const id of gained) { if (Audio2.keyGain) Audio2.keyGain(id); }
      if (this.keysOwned().length === 3 && Audio2.threeKeys) Audio2.threeKeys();
    }
    if (!window.App || typeof App.toast !== 'function') return;
    for (const id of gained) {
      const m = this.keyMeta().find(x => x.id === id);
      const name = m ? I18N.t(m.nameKey) : ('Key ' + id);
      const msg = (window.I18N && typeof I18N.t === 'function')
        ? I18N.t('toast_key_gained', { name })
        : ('已获得钥匙 · ' + name);
      App.toast(msg);
    }
  },
  // 技能提示文案（首次学会时在画面下方显示一行黑色小字；走 i18n 键）
  skillHintText(key) {
    const map = {
      shift: 'skill_hint_shift',
      dissolve: 'skill_hint_dissolve',
      doubleJump: 'skill_hint_doubleJump',
    };
    const k = map[key];
    return k ? I18N.t(k) : '';
  },
  // 学习者成就：学会二段跳 / E键消融 / shift 三个技能后点亮
  checkLearnerAchievement() {
    if (this.save.has('skill_doubleJump') && this.save.has('skill_dissolve') && this.save.has('skill_shift')) {
      if (window.App && typeof App.unlockAchievement === 'function') App.unlockAchievement('learner');
    }
  },
  // 首次学会技能：写入一次性 flag，并在画面下方弹出黑色小字。
  // bodyText（可选）：第二行文案（已按当前语言取好的字符串，如「访客移动协议已更新」）；
  //   缺省时保持旧行为（单行）。两行以换行分隔，由 #skill-hint 的 pre-line 生效。
  // 幂等：已写过 flag 时直接返回（不重播提示、不重复发放）。
  showSkillHint(key, bodyText) {
    const text = this.skillHintText(key);
    if (!text) return;
    const flag = 'skill_' + key;
    if (this.save.has(flag)) return;
    this.save.addFlags([flag]);
    this.save.persist();
    this.checkLearnerAchievement();
    if (window.Audio2 && Audio2.skill) Audio2.skill(key);
    const el = document.getElementById('skill-hint');
    if (!el) return;
    const body = (typeof bodyText === 'string') ? bodyText : '';
    el.textContent = body ? (text + '\n' + body) : text;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this._skillHintTimer);
    this._skillHintTimer = setTimeout(() => {
      el.classList.remove('show');
      this._skillHintHideTimer = setTimeout(() => el.classList.add('hidden'), 420);
    }, 4200);
  },
  // 走廊引导：显示一行深色小字（告知玩家可学习技能），停留片刻后淡出
  showGateHint(text) {
    if (!text) return;
    const el = document.getElementById('gate-hint');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this._gateHintTimer);
    this._gateHintTimer = setTimeout(() => {
      el.classList.remove('show');
      this._gateHintHideTimer = setTimeout(() => el.classList.add('hidden'), 420);
    }, 4200);
  },
  // 序章目标/下一步提示：画面最下方金色小字，停留 3 秒（默认）后淡出。
  // ms === 0 表示「常驻」：不设自动淡出定时器，直到 hideGoalHint() 收起或被下一次
  // showGoalHint 覆盖（阶段5 的「原地试试…」操作提示用）。
  showGoalHint(text, ms) {
    if (!text) return;
    const el = document.getElementById('goal-hint');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this._goalHintTimer);
    clearTimeout(this._goalHintHideTimer);
    if (ms === 0) return;                 // 常驻：无自动淡出
    this._goalHintTimer = setTimeout(() => {
      el.classList.remove('show');
      this._goalHintHideTimer = setTimeout(() => el.classList.add('hidden'), 420);
    }, ms != null ? ms : 3000);
  },
  // 立即收起目标提示（连同待执行的淡出定时器一起清掉）：用于「提示已达成 → 收掉」
  hideGoalHint() {
    const el = document.getElementById('goal-hint');
    clearTimeout(this._goalHintTimer);
    clearTimeout(this._goalHintHideTimer);
    if (!el) return;
    el.classList.remove('show');
    el.classList.add('hidden');
  },
  /* B2：目标分级表 —— 同一张表同时供「常驻短目标」「日志长目标」与色形编码取词，
     两处文案不会走偏；新增地图只在这里加一行。kind 是 HUD 的稳定色形编码：
     danger = 危险（橙红三角）· reward = 奖励（金色菱形）· interact = 交互（青色圆点）。 */
  objectiveTable() {
    const meta = this.keyMeta();
    return {
      // 序章 · 家：目标随调查进度动态推进（见 objectiveId）
      home_investigate:   { long: 'obj_home_investigate',   short: 'obj_home_investigate',   kind: 'interact' },
      home_find_evidence: { long: 'obj_home_find_evidence', short: 'obj_home_find_evidence', kind: 'interact' },
      home_check_wiring:  { long: 'obj_home_check_wiring',  short: 'obj_home_check_wiring',  kind: 'interact' },
      home_read_log:      { long: 'obj_home_read_log',      short: 'obj_home_read_log',      kind: 'reward' },
      home_enter_vr:      { long: 'obj_home_enter_vr',      short: 'obj_home_enter_vr',      kind: 'reward' },
      balcony:      { long: 'obj_balcony',      short: 'obj_short_balcony',      kind: 'interact' },
      library:      { long: meta[0].goalKey,    short: 'obj_short_library',      kind: 'reward' },
      library_gate: { long: 'obj_library_gate', short: 'obj_short_library_gate', kind: 'interact' },
      road:         { long: meta[1].goalKey,    short: 'obj_short_road',         kind: 'danger' },
      treasure:     { long: 'obj_treasure',     short: 'obj_short_treasure',     kind: 'danger' },
      maze:         { long: meta[2].goalKey,    short: 'obj_short_maze',         kind: 'danger' },
      palace:       { long: 'obj_palace',       short: 'obj_short_palace',       kind: 'reward' },
      keys_all:     { long: 'obj_keys_all',     short: 'obj_short_keys_all',     kind: 'reward' },
      default:      { long: 'obj_default',      short: 'obj_short_default',      kind: 'interact' },
    };
  },
  // 当前目标条目 id（由地图/场景与三钥持有状态推断）
  objectiveId() {
    const mapId = this.mapId;
    // 场景模式（家/阳台）：以鼠标点选为主
    if (this.level && this.level.mode === 'scene') {
      if (mapId === 'home') {
        // 序章动态目标：邀请 → 日志 → 双线索 → 单线索 → 起始调查
        if (this.hasClue('home_invitation')) return 'home_enter_vr';
        if (this.hasClue('home_mother_log')) return 'home_read_log';
        const hasWatch = this.hasClue('home_watch');
        const hasManual = this.hasClue('home_manual');
        if (hasWatch && hasManual) return 'home_check_wiring';
        if (hasWatch || hasManual) return 'home_find_evidence';
        return 'home_investigate';
      }
      if (mapId === 'balcony') return 'balcony';
    }
    const meta = this.keyMeta();
    // 已取得全部钥匙 → 终焉之门
    if (meta.every(m => this.save.has('key' + m.id))) return 'keys_all';
    if (mapId === 'library') return 'library';
    if (mapId === 'library_gate') return 'library_gate';
    if (mapId === 'road') return 'road';
    if (mapId === 'treasure') return 'treasure';
    if (mapId === 'maze') return 'maze';
    if (mapId === 'palace') return 'palace';
    return 'default';
  },
  objectiveKind() { return this.objectiveTable()[this.objectiveId()].kind; },
  // 长文本目标：任务日志「当前目标」与常驻目标条的悬停提示用
  currentObjective() {
    const id = this.objectiveId();
    if (id !== 'default') return I18N.t(this.objectiveTable()[id].long);
    if (this.level && this.level.name) return pick(this.level, 'name');
    return I18N.t('obj_default');
  },
  // 短文本目标：常驻 HUD 用（与长文本同表取词）
  currentObjectiveShort() { return I18N.t(this.objectiveTable()[this.objectiveId()].short); },
  updateHud() {
    if (typeof this.maybePreloadLevelImages === 'function') this.maybePreloadLevelImages();
    const meta = this.keyMeta();
    const keysEl = document.getElementById('hud-keys');
    keysEl.innerHTML = '';
    for (const m of meta) {
      const s = document.createElement('span');
      const has = this.save.has('key' + m.id);
      s.className = 'key-slot' + (has ? ' has' : '');
      s.dataset.key = m.id;
      s.textContent = has ? '🔑' : '·';
      const lbl = document.createElement('span');
      lbl.className = 'key-label';
      lbl.textContent = (window.I18N && I18N.lang === 'en') ? (m.short_en || m.short) : m.short;
      s.appendChild(lbl);
      keysEl.appendChild(s);
    }
    // 关卡行：顶部小字英文眉标（KEY I · WISDOM…）+ 关卡名（对齐 gry level-hud 的 lh-en/lh-title）
    const lvlEl = document.getElementById('hud-level');
    if (lvlEl) {
      const info = this.chapterInfo(this.mapId);
      const name = this.level ? pick(this.level, 'name') : '';
      lvlEl.textContent = '';
      if (name) {
        if (info && info.ord && info.ord !== 'CHAPTER') {
          const en = document.createElement('span');
          en.className = 'lvl-eyebrow';
          en.textContent = info.ord;
          lvlEl.appendChild(en);
        }
        const cn = document.createElement('span');
        cn.className = 'lvl-cn';
        cn.textContent = name;
        lvlEl.appendChild(cn);
      }
    }
    /* B2：当前目标常驻 —— HUD 只显示短目标，长目标与三钥进度进任务日志；
       目标变化时闪一下（pulse），此后一直留在画面上，不再 3.2 秒后消失。 */
    const objEl = document.getElementById('hud-objective');
    if (objEl) {
      const id = this.objectiveId();
      const isScene = !!(this.level && this.level.mode === 'scene');
      objEl.textContent = I18N.t('hud_objective_prefix') + this.currentObjectiveShort();
      objEl.title = this.currentObjective() + ' · ' + I18N.t('log_hint');
      objEl.dataset.kind = this.objectiveTable()[id].kind;
      objEl.setAttribute('aria-expanded', this.isObjectiveLogOpen() ? 'true' : 'false');
      // 场景模式：画布上的热区需要鼠标移动，目标条不占指针事件（仍可用 J 展开）
      objEl.classList.toggle('scene-mode', isScene);
      if (id !== this._objId) {
        this._objId = id;
        objEl.classList.remove('pulse');
        void objEl.offsetWidth;
        objEl.classList.add('pulse');
        // 序章动态目标变化时，在画面最下方以金色小字重述 3 秒
        if (this.mapId === 'home') {
          this.showGoalHint(I18N.t('hud_objective_prefix') + this.currentObjectiveShort());
        }
      }
      if (this.isObjectiveLogOpen()) this.updateObjectiveLog();   // 日志开着时同步刷新
    }
    // 狩猎计数（仅迷宫）
    const killsEl = document.getElementById('hud-kills');
    if (killsEl) {
      if (this.level && this.level.mazeCfg) {
        killsEl.classList.remove('hidden');
        killsEl.textContent = I18N.t('hud_hunt', { n: 0, total: this.level.mazeCfg.total || 7 });
      } else if (this.level && this.level.def.deathCounter) {
        // 跑酷死亡计数（移植自gry长街毒雾机制：3次→结束）
        killsEl.classList.remove('hidden');
        killsEl.textContent = I18N.t('hud_deaths', { n: this.parkourDeaths });
      } else {
        killsEl.classList.add('hidden');
        killsEl.textContent = '';
      }
    }
    // 数据护盾剩余层数（仅迷宫且有护盾时显示，D3）
    const shieldEl = document.getElementById('hud-shield');
    if (shieldEl) {
      const n = this.save.shields || 0;
      if (this.level && this.level.mazeCfg && n > 0) {
        shieldEl.classList.remove('hidden');
        shieldEl.textContent = I18N.t('hud_shield', { n });
      } else {
        shieldEl.classList.add('hidden');
        shieldEl.textContent = '';
      }
    }
    // 场景模式无 A/D 跑跳，隐藏底部键位说明
    const ctrlEl = document.getElementById('hud-controls');
    if (ctrlEl) {
      ctrlEl.style.display = (this.level && this.level.mode === 'scene') ? 'none' : '';
    }
  },
  /* 底部可交互提示条：进入交互范围时显示 [E] 对象名。
     C1：记录上一次的显示内容，只在「翻转」时写 DOM 与安排退场动画 ——
     旧实现每个非交互帧都会 classList.remove 并新建一个 setTimeout。 */
  updateContextPrompt() {
    const el = document.getElementById('context-prompt');
    const lblEl = document.getElementById('cp-label');
    if (!el || !lblEl) return;
    const can = this.player.canInteract && this.status === 'running';
    const label = (can && this.player.interactLabel) ? this.player.interactLabel : '';
    if (label === this._ctxShown) return;   // 状态未翻转：不碰 DOM、不建定时器
    this._ctxShown = label;
    if (label) {
      if (lblEl.textContent !== label) lblEl.textContent = label;
      clearTimeout(this._ctxHideTimer);
      this._ctxHideTimer = null;
      el.classList.remove('hidden');
      el.classList.add('show');
    } else {
      el.classList.remove('show');
      // 离场动画后隐藏：同一个退场只安排一次
      if (this._ctxHideTimer) return;
      this._ctxHideTimer = setTimeout(() => {
        this._ctxHideTimer = null;
        if (!el.classList.contains('show')) el.classList.add('hidden');
      }, 200);
    }
  },
});
