/* ============================================================================
 * engine/game.js —— 游戏主类 · 生命周期与关卡装载
 * ----------------------------------------------------------------------------
 * class Game 的构造与生命周期：画布缩放、boot、暂停菜单接线、Esc 暂停、
 * 新游戏 / 继续旅程、loadLevel（含程序化关卡的种子固定）、章节过渡卡、
 * 相机边界计算。
 * 其余方法按职责分散在 game-*.js 中，通过 Object.assign 挂到本类的
 * prototype 上，加载顺序：本文件必须排在所有 game-*.js 之前。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 1930-2275 行）。方法体未作任何改动；
 * 整段搬运，未作任何改动。
 * ==========================================================================*/
'use strict';
/* ------------------------------- 游戏主类 -------------------------------- */
class Game {
  constructor(cfg) {
    this.cfg = cfg;
    this.viewW = cfg.meta.viewW || 1280;
    this.viewH = cfg.meta.viewH || 720;
    this.tile = cfg.meta.tile || 48;
    this.canvas = document.getElementById('canvas');
    this.gameEl = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.fadeEl = document.getElementById('fade');
    this.titleEl = document.getElementById('title');
    this.endingEl = document.getElementById('ending');
    this.hudEl = document.getElementById('hud');
    this.input = new Input();
    this.save = new Save(cfg.meta.storageKey || 'the-oasis-save');
    this.camera = new Camera(this);
    this.dialog = new Dialog(this);
    this.player = new Player(this);
    this.level = null;
    this.status = 'title'; // title | running | busy | minigame | ending
    this.acc = 0; this.last = 0;
    this.pendingEvents = [];
    // 旅程令牌：每次开始/继续一局自增；旧异步结果凭它作废，避免污染新流程
    this._runToken = 0;
    // 场景模式（mode:'scene'）运行时状态
    this.sceneImages = {};
    this.bgImages = {};   // 跑酷背景图缓存（移植自gry长街 bgScroll）
    this.parkourDeaths = 0;   // 跑酷死亡计数（3次→结束界面）
    this.checkpoint = null;   // D2 当局复生锚点：最近经过的关卡锚点 {col,row,facing}（无则回关卡出生点）
    this._snakeReturn = null; // 迷失→数据蛇流程的返回点（源跑酷关 + 存档快照）
    this._respawnShown = false; // 复生面板是否已弹出（阻止事件链把状态误置回 running）
    this.poisonGrace = 0;     // 毒雾无敌帧：复生/进场后短暂免疫毒雾，避免重生即死
    this.sceneHover = -1;
    this._scenePanelOpen = false;
    this._sceneMove = e => this.sceneMouseMove(e);
    this._sceneClick = e => this.sceneMouseClick(e);
    this.canvas.addEventListener('mousemove', this._sceneMove);
    this.canvas.addEventListener('click', this._sceneClick);
    this.platformCount = 0; this.genRightX = 0; this.hintX = null;
    this.enemies = [];
    this.enemyTimer = 0;
    this.jumpHint = null;   // 引导段跳跃箭头状态
    this.book = null;       // 引导段掉落书本状态
    // 角色 / 小怪物精灵图：使用已抠好的透明 PNG，加载就绪前回退为原色块绘制
    this.sprites = {
      player: this.mkSprite('image/player.png'),
      monster: this.mkSprite('image/monster.png'),
    };
    this.scaleCanvas();
    addEventListener('resize', () => this.scaleCanvas());
  }
  setParkourDeaths(value, mapId) {
    const count = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    this.parkourDeaths = count;
    this.save.parkourDeaths = count;
    this.save.parkourLevel = count > 0 ? (mapId || this.mapId || this.save.level || null) : null;
  }
  scaleCanvas() {
    // 视口四周预留的边距（px）：保证游戏画面居中且四边留白
    const M = Math.min(48, Math.max(16, Math.round(window.innerHeight * 0.035)));
    const availW = Math.max(320, window.innerWidth - M * 2);
    const availH = Math.max(180, window.innerHeight - M * 2);
    // 以画布逻辑尺寸为基准计算等比缩放因子（contain，保留四周边距）
    const s = Math.min(availW / this.viewW, availH / this.viewH);
    // 整体缩放 #game（画布 + HUD/对话/菜单等覆盖层一起等比缩放并居中），
    // 而不是单独把 canvas 拉伸到满屏——那会把画面挤到右下角并被裁切。
    // 写入 CSS 变量，实际 transform 由 style.css 的 #game 规则应用，
    // 这样屏幕震动动画也能读取同一 scale，不会丢失缩放比例。
    if (this.gameEl) this.gameEl.style.setProperty('--game-scale', String(s));
    // 画布 CSS 尺寸复位为逻辑尺寸，与 #game 容器及覆盖层坐标保持一致
    this.canvas.style.width = this.viewW + 'px';
    this.canvas.style.height = this.viewH + 'px';
  }
  /* 屏幕震动：给 #game 加一次性 CSS 动画，受「屏幕震动」设置门控。
     死亡、硬降、消行、爆炸等事件调用；小游戏内也可用（引擎方法）。 */
  shake(magnitude) {
    if (!this.gameEl) return;
    if (window.SettingsUI && typeof SettingsUI.current === 'function' && SettingsUI.current().shake === false) return;
    try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    this.gameEl.style.setProperty('--shake-mag', String(magnitude != null ? magnitude : 5));
    this.gameEl.classList.remove('shake');
    void this.gameEl.offsetWidth;   // 强制重排，保证连续触发能重新播放动画
    this.gameEl.classList.add('shake');
    clearTimeout(this._shakeTimer);
    this._shakeTimer = setTimeout(() => this.gameEl.classList.remove('shake'), 340);
  }
  boot() {
    const btnNew = document.getElementById('btn-new');
    if (btnNew) btnNew.addEventListener('click', () => this.newGame());
    const btnContinue = document.getElementById('btn-continue');
    if (btnContinue) {
      btnContinue.addEventListener('click', () => this.continueGame());
      if (this.save.load()) btnContinue.classList.remove('hidden');
    }
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.addEventListener('click', () => this.newGame());
    this.bindOverlayButtons();
    this.bindEscPause();
    this.bindObjectiveLog();   // B2：常驻目标条点击 + J 键（定义在 game-log.js）
    this.last = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }
  // 绑定暂停菜单 / 复生面板 / 结局重看 等覆盖层按钮
  bindOverlayButtons() {
    const mg = () => this._activeMinigame;
    // 暂停菜单
    const resume = document.getElementById('pause-resume');
    if (resume) resume.addEventListener('click', () => {
      this.resumeGame();
    });
    const restart = document.getElementById('pause-restart');
    if (restart) restart.addEventListener('click', () => {
      if (mg()) { this.resumeGame(); if (typeof mg().reset === 'function') mg().reset(); }
      else { this.togglePause(false); if (this.mapId) this.loadLevel(this.mapId); }
    });
    const pSettings = document.getElementById('pause-settings');
    if (pSettings) pSettings.addEventListener('click', () => {
      // 保持暂停现场（小游戏维持 paused、引擎维持 paused）：只隐藏菜单后前往设置，
      // 返回时由 resumeAfterSettings 重新进入暂停，而不是解除暂停或回主菜单。
      this._resumeFromSettings = true;
      PauseMenu.hide();
      if (window.App && typeof App.go === 'function') App.go('screen-settings');
    });
    const quit = document.getElementById('pause-quit');
    if (quit) quit.addEventListener('click', () => {
      // 统一退出：abort 小游戏 + 取消对白/过场 + 落盘 + 回菜单
      this.leaveGame('screen-menu');
    });
    // 复生面板
    const again = document.getElementById('respawn-again');
    if (again) again.addEventListener('click', () => {
      this.respawnFromCheckpoint();
      // 跑酷关：复生后刷新死亡计数 HUD
      if (this.level && this.level.def.deathCounter) this.updateHud();
    });
    const rMenu = document.getElementById('respawn-menu');
    if (rMenu) rMenu.addEventListener('click', () => {
      const panel = document.getElementById('respawn-panel');
      if (panel) { panel.classList.remove('show'); panel.classList.add('hidden'); }
      this.leaveGame('screen-menu');
    });
    // 跑酷 3 次死亡结语按钮的接线归数据蛇流程模块（game-minigames.js），
    // 因为它的唯一去向是「迷失在数据流」→ 数据蛇恢复流程。
    this.bindParkourDeathButton();
  }
  // Esc 暂停 / 继续
  bindEscPause() {
    addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      // B2：任务日志打开时，Esc 先收起日志（与场景面板同一优先级规则）
      if (this.isObjectiveLogOpen && this.isObjectiveLogOpen()) { this.closeObjectiveLog(); return; }
      // 场景检视面板打开时，Esc 先关闭面板而不是进暂停菜单
      if (this._scenePanelOpen) { this.closeScenePanel(); return; }
      // 仅在游戏运行或忙碌（非结局/标题）时可暂停
      if (this.status === 'running' || this.status === 'busy') {
        this.togglePause();
      } else if (this.status === 'paused') {
        this.togglePause(false);
      }
    });
  }
  togglePause(force) {
    if (!PauseMenu.el()) return;
    const show = force != null ? force : (this.status !== 'paused');
    if (show) {
      // 仅在从“非暂停”进入时记录现场，避免从设置返回时把 paused 覆盖成现场
      if (this.status !== 'paused') this._statusBeforePause = this.status;
      this.status = 'paused';
      PauseMenu.show();
      if (window.Audio2 && Audio2.uiOpen) Audio2.uiOpen();
    } else {
      PauseMenu.hide();
      this.status = this._statusBeforePause || 'running';
      this.input.clear();
      if (window.Audio2 && Audio2.uiClose) Audio2.uiClose();
    }
    Pause.set(this.status === 'paused');
  }
  // 统一暂停 / 继续入口：小游戏走自身的 paused，引擎走 togglePause。
  // 供暂停菜单按钮、小游戏的 Esc 处理，以及设置返回时复用。
  pauseGame() {
    const mg = this._activeMinigame;
    if (mg) { mg.paused = true; PauseMenu.show(); Pause.set(true); return; }
    this.togglePause(true);
  }
  resumeGame() {
    const mg = this._activeMinigame;
    if (mg) { mg.paused = false; PauseMenu.hide(); Pause.set(false); return; }
    this.togglePause(false);
  }
  // 从“设置”返回：重新进入暂停现场（小游戏 / 引擎均保持暂停）
  resumeAfterSettings() {
    this._resumeFromSettings = false;
    if (this._activeMinigame) { this._activeMinigame.paused = true; PauseMenu.show(); Pause.set(true); return; }
    this.status = 'paused';
    PauseMenu.show();
    Pause.set(true);
  }
  /* 统一退出入口：任何「离开游戏」的按钮都走这里。
     ① 终止小游戏与对白；② 丢弃进行中的事件链与各类计时；
     ③ 递增旅程令牌，使旧异步结果作废；④ 落盘、解除暂停后回目标界面。 */
  leaveGame(screen) {
    if (this._activeMinigame && typeof this._activeMinigame.abort === 'function') this._activeMinigame.abort();
    this._activeMinigame = null;
    if (this.dialog && typeof this.dialog.cancel === 'function') this.dialog.cancel();
    this.pendingEvents = [];
    this._runToken++;
    this._jumpWait = null;
    this._retrySpawn = null;
    this.checkpoint = null;   // D2：离开游戏即丢弃当局复生锚点（存档落点仍保留）
    this._snakeReturn = null;
    this._respawnShown = false;
    this._resumeFromSettings = false;
    ['_chapterTimer', '_skillHintTimer', '_skillHintHideTimer', '_gateHintTimer', '_gateHintHideTimer', '_goalHintTimer', '_goalHintHideTimer'].forEach(k => {
      if (this[k]) { clearTimeout(this[k]); this[k] = null; }
    });
    PauseMenu.hide(true);
    if (this._scenePanelOpen) this.closeScenePanel();
    if (this.closeObjectiveLog) this.closeObjectiveLog(true);   // B2：静默收起日志，不触发恢复
    if (this.fadeEl) this.fadeEl.style.opacity = 0;
    if (this.save && typeof this.save.persist === 'function') this.save.persist();
    Pause.set(false);
    this.status = 'title';
    if (window.App && typeof App.go === 'function') App.go(screen || 'screen-menu');
  }
  /* 「新游戏 / 继续旅程」前的统一界面清理：清掉上一局可能残留的结局层、
     跑酷死亡层、复生面板、暂停菜单与黑色淡出层，避免遮挡新画面。 */
  clearGameOverlays() {
    this.titleEl.classList.add('hidden');
    this.endingEl.classList.add('hidden');
    const parkourEl = document.getElementById('parkour-death');
    if (parkourEl) { parkourEl.classList.remove('show'); parkourEl.classList.add('hidden'); }
    const respawnEl = document.getElementById('respawn-panel');
    if (respawnEl) { respawnEl.classList.remove('show'); respawnEl.classList.add('hidden'); }
    this._respawnShown = false;
    PauseMenu.hide(true);
    if (this._scenePanelOpen) this.closeScenePanel();
    if (this.closeObjectiveLog) this.closeObjectiveLog(true);   // B2：清掉上一局可能残留的日志
    if (this.fadeEl) this.fadeEl.style.opacity = 0;
    this._snakeReturn = null;
    this._retrySpawn = null;
    this.checkpoint = null;   // D2：开新局/继续前清掉上一局的复生锚点（随后由 loadLevel 按存档恢复）
    // 注意：这里【不】重置 parkourDeaths。
    // 该计数属于「当前跑酷关的一次尝试」：玩家退出再继续、或从复生面板返回时
    // 不应被清空（否则三死机制可被「回主菜单→继续旅程」绕过）。
    // 只在 beginRun()（新一局）与 loadLevel 进入不同 deathCounter 关时归零。
    this._resumeFromSettings = false;
    Pause.set(false);
  }
  /* 开始一局：清界面 + 从起始关加载，但【不】清空进度。
     用于开场背景信读完/跳过后开始游戏（此时需保留 introRead=true）。 */
  beginRun() {
    this._runToken++;
    this.clearGameOverlays();
    this.setParkourDeaths(0);   // 新一局：死亡计数归零
    this._announcedKeys = new Set(this.keysOwned());
    this.hudEl.classList.remove('hidden');
    this.status = 'running';
    this.loadLevel(this.cfg.meta.startLevel || 'home');
  }
  // 新游戏：清空本账号进度，从起始关卡从头开始
  newGame() {
    this.save.reset();
    this.beginRun();
  }
  // 继续旅程：从同一账号的上次退出点恢复；无存档则等同于新游戏
  continueGame() {
    this._runToken++;
    if (this.save.load() && this.save.level) {
      this.clearGameOverlays();
      // 失败计数属于账号存档；只在计数所属关卡与续玩关卡一致时恢复。
      if (this.save.parkourLevel === this.save.level) {
        this.parkourDeaths = this.save.parkourDeaths;
      } else {
        this.setParkourDeaths(0);
      }
      this._announcedKeys = new Set(this.keysOwned());  // 已有钥匙不重复提示
      this.hudEl.classList.remove('hidden');
      this.status = 'running';
      this.loadLevel(this.save.level);   // 从本关开头续玩（保留死亡次数；不回到中途锚点）
    } else {
      this.newGame();
    }
  }
  loadLevel(mapId, spawn, facing) {
    // 老档恢复（优化方案 A1）：存档已持有本关「通行标志」却仍停在本关时，重定向到下一节点，
    // 消除历史遗留的「已拿钥匙、出口被 filter 过滤」硬锁（adv.map 自身不再重定向，防自跳）。
    const adv = this.cfg.maps[mapId] && this.cfg.maps[mapId].advanceIf;
    if (adv && adv.map && adv.map !== mapId && this.save.has(adv.flag)) {
      mapId = adv.map;
      spawn = adv.spawn || null;
      facing = adv.spawn ? (adv.spawn.facing || facing) : facing;
    }
    if (this.gateMirrorReset) this.gateMirrorReset(); const def = this.cfg.maps[mapId]; // AI-06：切载先复位镜像态（tick 按存档重挂）
    if (!def) return;
    const isNewEntry = mapId !== this.mapId;
    // 死亡计数按「账号 + 跑酷关」归属：同关复生/继续时恢复，换关时归零。
    if (def.deathCounter) {
      if (isNewEntry || this.save.parkourLevel !== mapId) this.setParkourDeaths(0);
      else this.parkourDeaths = this.save.parkourDeaths;
    } else if (isNewEntry && this.parkourDeaths) {
      this.setParkourDeaths(0);
    }
    // 程序生成关（梯子/天空）的随机种子：写入存档，使读档/刷新/复生都用同一套布局。
    // 仅当存档尚无该种子时生成一次；「新游戏」经 save.reset() 清空 seeds 后会重新生成。
    const seedFor = (key, cfgObj) => {
      if (!cfgObj) return;
      let seed = this.save.seeds[key];
      if (seed == null) {
        seed = Math.floor(Math.random() * 0x7fffffff);
        this.save.seeds[key] = seed;
        this.save.persist();   // 立刻落盘，避免退出后丢失种子
      }
      cfgObj.seed = seed;
    };
    seedFor('ladder', def.ladderParkour);
    seedFor('sky', def.skyParkour);
    this.mapId = mapId;
    // 切换关卡 BGM 氛围（振荡器频率 / 滤波 / 风噪层；仅绿洲世界生效）
    if (window.Audio2 && Audio2.bgmSetMood) Audio2.bgmSetMood(this.moodForMap(mapId));
    this.pendingEvents = []; // 切图时丢弃上个地图残留的排队剧情
    this.level = new Level(this, def);
    this._seen = new Set();
    this.computeBounds(this.level);
    const s = spawn || this.level.spawn;
    this.player.spawn(s.col, s.row, (spawn ? (facing || s.facing || 1) : (s.facing || 1)), this.level.mode);
    // D2：区分「关卡出生点」与「当局复生锚点」。显式带 spawn 进入（读档/切图/
    // 小游戏重试/锚点复生）= 延续本关进度，复生锚点跟随本次落点；未带 spawn
    // （新进关卡、暂停菜单「重新开始本关」）= 从头开始，清空复生锚点。
    // 锚点落点同时写入 save.spawn（见 game-interact 锚点激活处），
    // 刷新 / 重开浏览器后 continueGame 仍从最近锚点继续。
    if (isNewEntry || !spawn) this.checkpoint = null;
    else this.checkpoint = { col: s.col, row: s.row, facing: this.player.facing };
    const pScale = (this.level.mazeCfg && this.level.mazeCfg.playerScale) || 1;
    this.player.w = this.player.baseW * pScale;
    this.player.h = this.player.baseH * pScale;
    this.camera.snap(this.player.x, this.player.y);
    // 复生/进入关卡后给 0.8s 毒雾无敌，避免在毒雾区附近重生时被瞬间连续判定
    this.poisonGrace = 48;
    this.enemies = [];
    this.enemyTimer = 0;
    this.enemiesSpawned = 0;
    this.trapKills = 0;
    this.hunterDone = false;
    this.platformCount = 0;
    this.hintX = null;
    this.hint2X = null;
    // 引导段（如黄金图书馆前廊）：重置跳跃箭头与掉落书本
    this.book = null;
    if (def.hintArrow) {
      const after = (def.hintArrow.afterCols != null ? def.hintArrow.afterCols : 1.5) * this.tile;
      this.jumpHint = { active: false, done: false, startX: this.player.x + after };
    } else {
      this.jumpHint = null;
    }
    // 走廊技能引导小字：向前行走一定距离后显示一次
    this._gateHintShown = false;
    this.gateHintX = def.gateSkillHint
      ? this.player.x + (def.gateSkillHint.afterCols != null ? def.gateSkillHint.afterCols : 2.5) * this.tile
      : null;
    this.genRightX = this.level.endless ? (this.level.endlessCfg.startCol || 0) * this.tile : 0;
    if (this.level.endless) {
      // 整关只建一次随机源：同一 seed 生成同一条道路，便于复现与排查难度
      const seed = this.level.endlessCfg.seed != null ? this.level.endlessCfg.seed : 7;
      this.level.endlessRng = makeRng(seed);
    }
    this.ensurePlatforms();
    this.computeMazePath();
    // 过渡演出页（数据涡流/数据蛇）不写入存档：存档点始终留在源跑酷关
    if (mapId !== 'data_vortex' && mapId !== 'data_snake') {
      this.save.level = mapId;
      this.save.spawn = { col: s.col, row: s.row };
      this.save.facing = this.player.facing;
    }
    this.sceneHover = -1;
    this.updateHud();
    this.showChapterCard(mapId);
    // 场景模式隐藏键盘交互提示条（无 A/D 跑跳、无 E 感叹号）
    if (def.mode === 'scene') {
      const cp = document.getElementById('context-prompt');
      if (cp) { cp.classList.remove('show'); cp.classList.add('hidden'); }
    }
    // 场景模式入口自动演出（仅首次，用 entryFilter 门控；flag 由 entryFlags 末尾写入）
    if (def.mode === 'scene' && def.entryEvents && def.entryEvents.length) {
      if (this.save.checkFilter(def.entryFilter || ['!__never__'])) {
        const evs = def.entryEvents.slice();
        if (def.entryFlags && def.entryFlags.length) evs.push({ type: 'setFlag', flags: def.entryFlags });
        this.pendingEvents.push(evs);
      }
    }
  }
  // 章节过渡卡：进入新地图时显示章节名 + 存档提示
  // （眉标 ord 恒为英文；标题/副标题提供 _en 兄弟字段供英文界面取词）
  chapterInfo(mapId) {
    const map = {
      home:     { ord: 'PROLOGUE', title: '叠楼区 · 家', title_en: 'Stack District · Home', sub: '2135 年 · 现实正在熄灭', sub_en: '2135 · Reality is going dark' },
      oasis:    { ord: 'OASIS ENTRY', title: '绿洲入口 · 数据空间', title_en: 'OASIS Entry · Data Space', sub: '沿长街跑酷前往图书馆', sub_en: 'Parkour along the long street to the library' },
      data_vortex: { ord: 'DATA RECOVERY', title: '数据修复区', title_en: 'Data Recovery Zone', sub: '收集损坏的数据，重建连接', sub_en: 'Collect damaged data and rebuild the connection' },
      data_snake:  { ord: 'DATA SNAKE', title: '数据蛇 · 数据收集', title_en: 'Data Snake · Data Recovery', sub: '收集零散的数据，恢复存在', sub_en: 'Collect the scattered data and restore your presence' },
      library_gate: { ord: 'KEY I · WISDOM', title: '哈里迪年鉴馆 · 接待前厅', title_en: 'Halliday Journals · Reception Hall', sub: '前往接待台，验证邀请', sub_en: 'Proceed to the reception desk and verify the invitation' },
      library:  { ord: 'KEY I · COPPER', title: '智慧之钥（铜钥）', title_en: 'Key of Wisdom (Copper Key)', sub: '沿金廊梯子攀上右上的门', sub_en: 'Climb the ladder in the golden corridor up to the door at the top right' },
      corridor: { ord: 'TRANSITION', title: '荒原 · 生态模拟区', title_en: 'The Wasteland · Ecological Simulation', sub: '没有屋顶的绿色，也会让人想起现实', sub_en: 'Greenery without a roof can still recall reality' },
      road:     { ord: 'KEY II · JADE', title: '过程之钥（玉钥）', title_en: 'Key of Process (Jade Key)', sub: '沿高架跑到尽头，再回到起点重读这条路', sub_en: 'Run the elevated route to its end, then return to the start to read the road anew' },
      treasure: { ord: 'TRANSITION', title: '失重舞厅 · 遗失索引场', title_en: 'Zero-G Ballroom · Lost Index Field', sub: '主动启动扫描，连通一条安全记录', sub_en: 'Start the scan yourself and connect one safe record' },
      maze:     { ord: 'KEY III · CRYSTAL', title: '勇气之钥（水晶钥）', title_en: 'Key of Courage (Crystal Key)', sub: '在未知与恐惧中寻找出口', sub_en: 'Find the exit amid the unknown and fear' },
      finale_transition: { ord: 'TRANSITION', title: '终焉 · 前奏', title_en: 'Finale · Prelude', sub: '从虚拟走向真实的门槛', sub_en: 'The threshold from the virtual to the real' },
      palace:   { ord: 'FINAL GATE', title: '终焉之门', title_en: 'Gate of Finale', sub: '三把钥匙齐聚，做出抉择', sub_en: 'All three keys gathered. Make your choice.' },
    };
    return map[mapId] || { ord: 'CHAPTER', title: this.level ? pick(this.level, 'name') : mapId, sub: '' };
  }
  showChapterCard(mapId) {
    const el = document.getElementById('chapter-card');
    if (!el) return;
    // 场景模式（家/阳台/童年房间）不弹章节卡：按请求 mapId 判定
    if (this.cfg && this.cfg.maps && this.cfg.maps[mapId] && this.cfg.maps[mapId].mode === 'scene') return;
    const info = this.chapterInfo(mapId);
    const ordEl = document.getElementById('chapter-ordinal');
    const titleEl = document.getElementById('chapter-title');
    const subEl = document.getElementById('chapter-subtitle');
    if (ordEl) ordEl.textContent = info.ord;
    if (titleEl) titleEl.textContent = pick(info, 'title');
    if (subEl) subEl.textContent = pick(info, 'sub');
    // 章节入场音：KEY I/II/III 用递增根音的数据脉冲
    if (window.Audio2 && Audio2.chapter) {
      const mk = /KEY (I{1,3})/.exec(info.ord || '');
      Audio2.chapter(mk ? mk[1].length : 0);
    }
    // 卡片底部的保存状态：按最近一次真实写入结果显示，不再无条件宣称「已保存」
    const saveOk = this.save.lastPersistOk !== false;
    const saveHintEl = document.getElementById('chapter-save-hint');
    const saveTextEl = document.getElementById('chapter-save-text');
    if (saveHintEl) saveHintEl.classList.toggle('save-failed-state', !saveOk);
    if (saveTextEl) saveTextEl.textContent = I18N.t(saveOk ? 'chapter_saved' : 'chapter_save_failed');
    if (window.Audio2) {
      if (saveOk) { if (Audio2.checkpoint) Audio2.checkpoint(); }
      else if (Audio2.error) Audio2.error();
    }
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this._chapterTimer);
    this._chapterTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.classList.add('hidden'), 420);
    }, 1500);
  }
  // 关卡 → BGM 氛围（供 loadLevel 调用；未知关卡用 default）
  moodForMap(mapId) {
    return ({
      corridor: 'wasteland',
      library: 'library', library_gate: 'library',
      road: 'road',
      maze: 'maze',
      data_vortex: 'vortex', data_snake: 'vortex',
      palace: 'palace', finale_transition: 'palace',
    })[mapId] || 'default';
  }
  computeBounds(level) {
    const worldW = level.cols * this.tile;
    const worldH = level.rows * this.tile;
    let minX, maxX, minY, maxY;
    // 锁定水平相机：界面不做任何左右移动（如纵向攀爬的图书馆）。
    // 相机中心固定在视口中心，世界 x=0 恰好对齐屏幕 x=0，背景图与梯子同处一套坐标。
    /* cameraFix（失重舞厅 2026-09-20）：视口横纵全部锁死，相机不随玩家移动 ——
       平台与背景图的视觉关系恒定（需求②）。值为视口中心的世界坐标。 */
    if (level.def.cameraFix) {
      const fx = level.def.cameraFix;
      minX = maxX = (fx.x != null) ? fx.x : this.viewW / 2;
      minY = maxY = (fx.y != null) ? fx.y : this.viewH / 2;
      level.cameraBound = [minX, maxX, minY, maxY];
      return;
    }
    if (level.def.lockCameraX) { minX = maxX = (typeof level.def.lockCameraX === 'number') ? level.def.lockCameraX : this.viewW / 2; }
    else if (worldW <= this.viewW) { minX = maxX = worldW / 2; }
    else { minX = this.viewW / 2; maxX = worldW - this.viewW / 2; }
    if (worldH <= this.viewH) { minY = maxY = worldH / 2; }
    else { minY = this.viewH / 2; maxY = worldH - this.viewH / 2; }
    if (level.endless) maxX = Infinity;
    level.cameraBound = [minX, maxX, minY, maxY];
  }
  /* ===================== 场景模式（mode:'scene'）=====================
     家/阳台等静态画面：渲染大图铺底 + 鼠标热区悬停/点击；
     复用 dialog / fade / changeMap / setFlag 事件系统。 */
}
