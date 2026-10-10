/* ============================================================================
 * engine/game-minigames.js —— Game 方法组 · 小游戏宿主
 * ----------------------------------------------------------------------------
 * 三个小游戏的启动/收尾编排（俄罗斯方块 / 扫雷 / 数据蛇），以及
 * 「迷失在数据流」流程的进出。
 *
 * 宿主只负责：切状态、淡入淡出、按结果分发奖励或失败。
 * 小游戏自身的规则、暂停、放弃分别由各自的类负责。
 *
 * finishMinigame() 是三者唯一收尾出口，返回三态：
 *   · 'quit' —— 玩家从暂停菜单放弃并返回主菜单：不奖励、不弹失败面板
 *   · 'won'  —— 成功：宿主执行奖励与转场
 *   · 'lost' —— 失败：宿主弹出复生面板
 *     （数据蛇同走复生面板，但隐藏「回到这关开头」，只留「返回主菜单」，见 runDataSnake）
 *
 * 由原 js/engine/game-events.js 拆出（小游戏宿主部分）。加载顺序：
 * 必须在 class Game（game.js）之后；与 game-events.js 同为 Object.assign
 * 挂载到同一 prototype，二者先后无依赖。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  // 扫雷奖励「数据护盾」层数（D3）：配置在 story_config meta，缺省 3
  mazeShieldCharges() {
    return (this.cfg.meta && this.cfg.meta.mazeShieldCharges) || 3;
  },
  /* 小游戏唯一收尾出口：清空现场并返回三态结果 */
  finishMinigame(won) {
    this._activeMinigame = null;
    this.input.clear();
    // 玩家已从暂停菜单放弃并回到主菜单：既不奖励，也不判失败
    if (this.status === 'title') return 'quit';
    return won ? 'won' : 'lost';
  },
  async runTetris(ev, token) {
    this.status = 'minigame';
    await this.fadeOut();
    if (token != null && token !== this._runToken) return;   // 旧旅程：中止
    const t = new Tetris(this, {
      lines: ev.lines || 4,
      milestoneLines: ev.milestoneLines || 0,
      timeLimit: ev.timeLimit || 90,
    });
    this._activeMinigame = t;
    const game = t.start();
    await this.fadeIn();
    const won = await game;
    if (token != null && token !== this._runToken) return;   // 旧旅程：不结算、不写奖励
    const result = this.finishMinigame(won);
    if (result === 'quit') return;
    if (result === 'lost') {
      // 挑战失败 → 复生面板；记住触发点附近的重试点，避免重爬整段；
      // 失败原因由小游戏回报（超时 / 堆顶），据此给出准确提示
      this._retrySpawn = ev.retrySpawn ? { map: this.mapId, spawn: ev.retrySpawn } : null;
      const reasonKey = t.failReason === 'time' ? 'death_reason_time' : 'death_reason_blocks';
      this.showRespawnPanel(I18N.t('death_msg_failed'), reasonKey);
      return;
    }
    this.status = 'busy';
  },
  async runMinesweeper(opts, token) {
    this.status = 'minigame';
    await this.fadeOut();
    if (token != null && token !== this._runToken) return;
    const m = new Minesweeper(this, opts);
    this._activeMinigame = m;
    const game = m.start();
    await this.fadeIn();
    const won = await game;
    if (token != null && token !== this._runToken) return;
    const result = this.finishMinigame(won);
    if (result === 'quit') return;
    this.status = 'busy';
    if (result === 'won') {
      // D3：奖励由「永久免疫」改为有限次「数据护盾」——保留 magic-potion 奖励标记
      // 与成就获取路径，但免疫次数落在 save.shields，用尽后怪兽重新致命。
      // 幂等（验收 5）：完成标记已存在时不再补盾 —— 奖励唯一入口＝首次通关。
      // 奖励与触发器完成标志同笔保存：奖励对白期间退出也不会重新开放挑战、重复补盾。
      const already = !!(opts.completionFlag && this.save.has(opts.completionFlag));
      if (!already) {
        const rewardFlags = ['magic-potion'];
        if (opts.completionFlag) rewardFlags.push(opts.completionFlag);
        this.save.addFlags(rewardFlags);
        this.save.shields = this.mazeShieldCharges();
        this.save.persist();
        if (window.App && typeof App.unlockAchievement === 'function') App.unlockAchievement('magic-potion');
        // 关卡特有后置（遗失索引场）：通关瞬间挂载安全桥 / 开启索引门（幂等）
        if (typeof this.indexScanComplete === 'function') this.indexScanComplete(opts);
      }
      // 通关文案可按关卡声明（opts.winDialogue 指向对白树 id）；缺省沿用数据护盾对白
      await this.dialog.show(this.resolveLines(opts.winDialogue ? { id: opts.winDialogue } : { id: 'magic_potion' }));
    } else {
      // 失败 → 先播本轮冲突文案（opts.failLines），再弹复生面板；
      // 复生面板的「再来一次」回到 retrySpawn（扫描终端旁），不必重跑入口跑酷。
      if (opts.failLines) {
        await this.dialog.show(this.resolveLines({ text: opts.failLines, text_en: opts.failLines_en }));
      }
      this._retrySpawn = opts.retrySpawn ? { map: this.mapId, spawn: opts.retrySpawn } : null;
      this.showRespawnPanel(I18N.t('death_msg_minesweeper'), 'death_reason_mine');
    }
  },
  /* ---- V4 §8.4：三中继掩护（30 秒防守） ---- */
  async runRelayDefense(ev, token) {
    this.status = 'minigame';
    await this.fadeOut();
    if (token != null && token !== this._runToken) return;
    const d = new RelayDefense(this, ev || {});
    this._activeMinigame = d;
    const game = d.start();
    await this.fadeIn();
    const won = await game;
    if (token != null && token !== this._runToken) return;
    const result = this.finishMinigame(won);
    if (result === 'quit') return;
    if (result === 'lost') {
      // 失败：回到关系选择前的检查点重试，绝不自动写成「离开」
      this._retrySpawn = ev && ev.retrySpawn ? { map: this.mapId, spawn: ev.retrySpawn } : null;
      this.showRespawnPanel(I18N.t('death_msg_relay'), 'death_reason_monster');
      return;
    }
    this.status = 'busy';
  },
  /* 跑酷 3 次死亡结语面板按钮的接线（由 game.js bindOverlayButtons 调用）。
     涡流跑酷关（绿洲入口 oasis / 失重舞厅 treasure）：按钮「进入数据恢复区」→
     「迷失在数据流」→ 数据蛇恢复流程；其余关卡（含 library / road）作为
     「死亡信息界面」：按钮「返回主菜单」→ 回初始菜单（leaveParkourDeathToMenu）。
     旧「road → 回到本关开头」分支已删除，这里不接 respawnFromCheckpoint。 */
  bindParkourDeathButton() {
    const btn = document.getElementById('parkour-death-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (this.level && (this.level.id === 'oasis' || this.level.id === 'treasure')) {
        this.startDataVortexFlow();
      } else {
        // 其余关卡：死亡信息界面的「返回主菜单」出口
        this.leaveParkourDeathToMenu();
      }
    });
  },
  /* ---- 迷失在数据流中 · 数据蛇（贪吃蛇）收集数据恢复意识 ---- */
  // 进入数据涡流页（data_vortex 背景），记录返回点。
  // 唯一调用点：本文件 bindParkourDeathButton 里绑定的「进入数据恢复区」按钮，
  // 且仅当关卡是涡流跑酷关（绿洲入口 oasis / 失重舞厅 treasure）时该按钮才会点亮。
  // 其余关卡三次死亡不改走这里，直接回初始菜单。
  startDataVortexFlow() {
    const el = document.getElementById('parkour-death');
    if (el) { el.classList.remove('show'); el.classList.add('hidden'); }
    const src = (this.level && this.level.id) || this.save.level || 'oasis';
    this._snakeReturn = {
      map: src,
      level: this.save.level || src,
      spawn: this.save.spawn ? { col: this.save.spawn.col, row: this.save.spawn.row } : null,
      facing: this.save.facing != null ? this.save.facing : 1,
    };
    this.setParkourDeaths(0);
    this.save.persist();
    this.status = 'running';
    this.loadLevel('data_vortex');   // 场景入口自动演出：对白 → 切到数据蛇页面
    this.updateHud();
  },
  // 数据收集完成：回到源跑酷关复生点继续（死亡计数由 loadLevel 换图重置）
  finishDataVortexFlow() {
    const ret = this._snakeReturn;
    this._snakeReturn = null;
    const map = (ret && ret.map && this.cfg.maps[ret.map]) ? ret.map : 'oasis';
    this.setParkourDeaths(0);
    this.status = 'busy';
    this.loadLevel(map);
    this.status = 'running';
    this.save.persist();
  },
  async runDataSnake(ev, token) {
    // 蛇局为「死亡后恢复」的过渡演出：存档点固定在源跑酷关，暂停/退出不污染进度
    if (this._snakeReturn) {
      this.save.level = this._snakeReturn.map;
      this.save.spawn = this._snakeReturn.spawn ? { col: this._snakeReturn.spawn.col, row: this._snakeReturn.spawn.row } : null;
      this.save.facing = this._snakeReturn.facing != null ? this._snakeReturn.facing : 1;
      this.save.persist();
    }
    this.status = 'minigame';
    await this.fadeOut();
    if (token != null && token !== this._runToken) return;
    const s = new DataSnake(this, ev);
    this._activeMinigame = s;
    const game = s.start();
    await this.fadeIn();
    const won = await game;
    if (token != null && token !== this._runToken) return;
    const result = this.finishMinigame(won);
    if (result === 'quit') {
      // 玩家在暂停菜单中放弃本局：保持主菜单现场（存档已指向源跑酷关）
      this._snakeReturn = null;
      this.save.persist();
      return;
    }
    if (result === 'lost') {
      // 数据蛇内死亡（规则2）：小游戏本身不画任何提示（见 DataSnake._endLost），
      // 由宿主弹出失败对话框 —— 复用复生面板样式，隐藏「回到这关开头」，
      // 唯一出口「返回主菜单」；点击后由 #respawn-menu 绑定回初始菜单。
      this.showRespawnPanel(I18N.t('death_msg_snake'), 'death_reason_snake',
        { hideRetry: true, quoteKey: 'respawn_quote_snake' });
      return;
    }
    // 数据收集完成：意识重聚 → 成就 + 台词 → 回到源跑酷关继续
    this.status = 'busy';
    if (window.App && typeof App.unlockAchievement === 'function') App.unlockAchievement('data-restored');
    await this.dialog.show(this.resolveLines({ id: 'data_restored' }));
    await this.fadeOut();
    this.finishDataVortexFlow();
    await this.fadeIn();
  },
});
