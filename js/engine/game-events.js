/* ============================================================================
 * engine/game-events.js —— Game 方法组 · 事件解释器与失败流程
 * ----------------------------------------------------------------------------
 * 声明式事件链的执行（dialog / delay / fade / changeMap / setFlag /
 * achievement / tetris / minesweeper / snake / choice / ending）、
 * 对话行解析、复生面板、失败与死亡、跑酷三次死亡的结束界面、淡入淡出。
 *
 * 小游戏的启动与收尾（runTetris / runMinesweeper / runDataSnake 及
 * 迷失数据流流程）已拆到 game-minigames.js，本文件只做事件分派，
 * runEvent 中按 type 调用它们。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 2859-3124 行）。方法体未作任何改动；
 * 因改用对象字面量承载，仅在每个方法结束的大括号后补了成员分隔逗号。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  startEvents(events, flags) {
    if (this.status !== 'running') return;
    const token = this._runToken;
    this.status = 'busy';
    this.input.clear();
    const keysBefore = this.keysOwned();
    this.runEvents(events, token).then(() => {
      // 旅程已切换（退出/重开）：丢弃旧结果，不提交 flag / 不恢复运行
      if (token !== this._runToken) return;
      // 事件链中若已弹出复生面板（如俄罗斯方块失败），不得继续写入 flag / 恢复运行，
      // 否则会出现「失败仍判定成功」并让面板后的角色继续移动。
      if (this.status === 'ending' || this.status === 'title' || this._respawnShown) return;
      this.save.addFlags(flags);
      this.save.persist();
      this.toastKeysGained(keysBefore);
      this.updateHud();   // 终焉之地等切关提示在 loadLevel 时刷新过，写入 key flag 后需再刷新
      this.input.clear();
      this.status = 'running';
    });
  },
  /* 暂停期间挂起事件链推进：恢复后继续（不跳步）。 */
  waitWhilePaused() {
    if (!Pause.paused) return Promise.resolve();
    return new Promise(res => {
      const off = Pause.onChange(p => { if (!p) { off(); res(); } });
    });
  },
  async runEvents(events, token) {
    for (const ev of events) {
      await this.waitWhilePaused();
      if (token != null && token !== this._runToken) return;
      await this.runEvent(ev, token);
      if (token != null && token !== this._runToken) return;
      // 事件链中若已弹出复生面板（如俄罗斯方块失败），停止后续事件，
      // 避免「失败仍发放奖励」。
      if (this.status === 'ending' || this.status === 'title' || this._respawnShown) return;
    }
  },
  resolveLines(ev) {
    if (ev.id) {
      if (isEn()) {
        const enTree = this.cfg.dialogueTree_en;
        if (enTree && enTree[ev.id]) return enTree[ev.id];
      }
      return this.cfg.dialogueTree[ev.id] || [];
    }
    if (ev.text) {
      // 内联对白：英文界面优先 text_en，缺失回退中文
      if (isEn() && ev.text_en) return Array.isArray(ev.text_en) ? ev.text_en : [ev.text_en];
      return Array.isArray(ev.text) ? ev.text : [ev.text];
    }
    return [];
  },
  async runEvent(ev, token) {
    switch (ev.type) {
      case 'mazeVerification': {
        if (this.mapId !== 'maze' || (token != null && token !== this._runToken)) return;
        const cfg = this.cfg.maps.maze.verification;
        const definition = this.cfg.clues[cfg.clue];
        await this.dialog.show([pick(definition, 'title') + '\n' + pick(definition, 'text')]);
        await this.waitWhilePaused();
        if (token != null && token !== this._runToken) return;
        this.discoverClue(cfg.clue);
        const answer = await this.dialog.choose(pick(cfg, 'prompt'), cfg.options.map(o => pick(o, 'label')));
        await this.waitWhilePaused();
        if (token != null && token !== this._runToken) return;
        if (answer < 0) return;
        if (!cfg.options[answer] || !cfg.options[answer].correct) {
          await this.dialog.show([pick(cfg, 'rejected')]);
          return;
        }
        await this.dialog.show([pick(cfg, 'verified')]);
        await this.waitWhilePaused();
        if (token != null && token !== this._runToken) return;
        // Only the verified branch reaches A1's reward/checkpoint commit.
        await this.runEvents(ev.events, token);
        break;
      }
      case 'roadEvidence': {
        if (this.mapId !== 'road' || (token != null && token !== this._runToken)) return;
        this.discoverClue(ev.id);
        const clue = this.getClue(ev.id);
        if (clue) await this.dialog.show([clue.title + '\n' + clue.text]);
        break;
      }
      case 'roadExit': {
        if (this.mapId !== 'road' || (token != null && token !== this._runToken)) return;
        const cfg = this.cfg.maps.road.evidence;
        const ready = this.save.has('key2') || cfg.required.every(id => this.hasClue(id));
        await this.runEvents(ready ? ev.then : ev.else, token);
        break;
      }
      case 'roadHint':
        await this.requestRoadHint(token);
        break;
      case 'discoverClue': {
        if (token != null && token !== this._runToken) return;
        const result = this.discoverClue(ev.id);
        const clue = this.getClue(ev.id);
        if (result.saved && window.App && typeof App.toast === 'function') {
          App.toast(I18N.t(result.discovered ? 'toast_clue_recorded' : 'toast_clue_already_recorded', {
            title: clue ? clue.title : ev.id,
          }));
        }
        // 序章：线索写入后立即刷新动态目标，并在最下方以金色小字重述 3 秒
        if (this.mapId === 'home' && typeof this.updateHud === 'function') this.updateHud();
        return result;
      }
      case 'goalHint':
        if (token != null && token !== this._runToken) return;
        // ev.time 可选：走廊主目标提示用 2500ms（默认仍为 3000ms）
        this.showGoalHint(pickText(ev.text, ev.text_en), ev.time);
        break;
      case 'ifClue':
        if (token != null && token !== this._runToken) return;
        await this.runEvents(this.hasClue(ev.id) ? (ev.then || []) : (ev.else || []), token);
        break;
      // flag 条件分支（镜像 ifClue）：数据涡流首次进入完整说明 / 复次简短提示用
      case 'ifFlag':
        if (token != null && token !== this._runToken) return;
        await this.runEvents(this.save.flags.has(ev.flag) ? (ev.then || []) : (ev.else || []), token);
        break;
      case 'dialog': await this.dialog.show(this.resolveLines(ev), { autoAdvance: ev.autoAdvance }); break;
      // 阶段4：莫罗接待台 · 邀请验证演出（扫描台 + 程序 UI 结果面板 + 支线回应）
      case 'inviteVerify': if (this.playInviteVerify) await this.playInviteVerify(ev, token); break;
      // 阶段5：访客索引册 · 领取即解锁二段跳（数据页面展开 + 技能提示 + 原地尝试提示）
      case 'indexBook': if (this.playIndexBook) await this.playIndexBook(ev, token); break;
      // 阶段6：主档案门 · 开门演出（扫描光 → 门开 → 记忆档案井 → 对白；不自动切图）
      case 'archiveDoor': if (this.playArchiveDoor) await this.playArchiveDoor(ev, token); break;
      /* 阶段6：切图前预加载目标关卡背景（淡出前完成，避免「先黑屏再等图」）。
         ev.map 取该关 def.bg.image，ev.image 可显式指定；ev.time 为等待上限。 */
      case 'preload': {
        const pdef = this.cfg.maps[ev.map] || {};
        const url = ev.image || (pdef.bg && pdef.bg.image);
        if (typeof this.waitImageReady === 'function') {
          await this.waitImageReady(url, ev.time != null ? ev.time : 1200);
        } else if (typeof this.preloadImages === 'function') {
          this.preloadImages([url]);
        }
        break;
      }
      // 发车演出：Home 戴 VR 首次进入 OASIS 前播放，结束后直接加载目标地图
      case 'raceStart': if (this.playRaceStart) await this.playRaceStart(ev); break;
      // 赛道尽头 → 年鉴馆接待前厅转场：结束后加载目标地图（模块缺失时无操作）
      case 'archiveTransition': if (this.playArchiveTransition) await this.playArchiveTransition(ev); break;
      case 'delay': await delay(ev.time || 0); break;
      case 'fade': if (ev.out) await this.fadeOut(); else await this.fadeIn(); break;
      /* 关卡切换与奖励的「原子提交点」（优化方案 A1）：
         ev.flags 在切图前写入、切图后只 persist 一次 —— 不存在「钥匙已写入但尚未切图」
         的中间态，出口触发器自身的门控 filter 因此不会被提前锁死。
         （此前 library_door / maze_exit 在对白之前单独 setFlag，中途刷新即硬锁。） */
      case 'changeMap': {
        const gainFlags = ev.flags || [];
        const keysBefore = gainFlags.length ? this.keysOwned() : null;
        /* 2026-09-20：F4 原创转场已整条删除（game-transitions.js / #transition / 相关 CSS）。
           原先「转场遮蔽 → 切图 → 揭开」三步不再存在，切图遮蔽一律由事件链里的
           fade 事件承担（与其他切图点一致）；本处不再有任何额外动效。 */
        if (gainFlags.length) this.save.addFlags(gainFlags);
        this.loadLevel(ev.map, ev.spawn, ev.facing);
        this.save.persist();
        if (keysBefore) this.toastKeysGained(keysBefore);
        break;
      }
      case 'setFlag': {
        const keysBefore = this.keysOwned();
        this.save.addFlags(ev.flags);
        this.save.persist();
        this.toastKeysGained(keysBefore);
        break;
      }
      case 'save': this.save.persist(); break;
      case 'unlockDoubleJump': this.save.addFlags(['doubleJump']); this.save.persist(); break;
      case 'skillHint':
        // 学会新技能：下方弹出黑色小字，停留片刻后继续后续事件（如对白）
        this.showSkillHint(ev.key);
        await delay(ev.time || 2200);
        break;
      case 'achievement':
        if (window.App && typeof App.unlockAchievement === 'function') App.unlockAchievement(ev.id);
        break;
      // 小游戏宿主实现在 game-minigames.js
      case 'tetris': await this.runTetris(ev, token); break;
      case 'minesweeper': await this.runMinesweeper(ev, token); break;
      case 'relayDefense': await this.runRelayDefense(ev, token); break;
      case 'snake': await this.runDataSnake(ev, token); break;
      case 'choice': await this.runChoice(ev, token); break;
      case 'finaleChoice': await this.runFinaleChoice(token); break;
      case 'ending': this.showEnding(ev.id); break;
    }
  },
  async runChoice(ev, token) {
    const idx = await this.dialog.choose(pick(ev, 'prompt'), ev.options.map(o => pick(o, 'label')));
    if (idx >= 0 && ev.options[idx] && ev.options[idx].events) {
      await this.runEvents(ev.options[idx].events, token);
    }
  },
  // 失败 → 检查点复生面板（替代 1.6s 硬切回主菜单）
  // msg 为已本地化的死亡信息；reasonKey 为可选的明确死因 i18n 键（缺失时按 msg 推断）
  // opts（可选）：
  //   hideRetry: true —— 隐藏「回到这关开头」，只留「返回主菜单」（数据蛇终局失败，规则2）
  //   quoteKey:  i18n 键 —— 覆盖面板底部的引语（缺省沿用 respawn_quote）
  showRespawnPanel(msg, reasonKey, opts) {
    this.status = 'busy';
    this._respawnShown = true;
    this.input.clear();
    this.markDeath();
    this.shake(6);
    if (window.Audio2 && Audio2.die) Audio2.die();
    const panel = document.getElementById('respawn-panel');
    const titleEl = document.getElementById('respawn-title');
    const reasonEl = document.getElementById('respawn-reason');
    const quoteEl = document.getElementById('respawn-quote');
    const againEl = document.getElementById('respawn-again');
    if (titleEl) titleEl.textContent = msg || I18N.t('respawn_title');
    if (reasonEl) reasonEl.textContent = reasonKey ? I18N.t(reasonKey) : I18N.t(this.deathReasonFor(msg));
    // 复生按钮显隐：默认显示；数据蛇终局失败（hideRetry）时隐藏，只留「返回主菜单」
    if (againEl) againEl.classList.toggle('hidden', !!(opts && opts.hideRetry));
    if (quoteEl) quoteEl.textContent = I18N.t((opts && opts.quoteKey) || 'respawn_quote');
    if (panel) {
      panel.classList.remove('hidden');
      // 强制重排以触发动画
      void panel.offsetWidth;
      panel.classList.add('show');
    }
  },
  // 根据死亡信息推断失败原因（返回 i18n 键；中英文信息都能匹配）
  deathReasonFor(msg) {
    const m = (msg || '').toString().toLowerCase();
    if (/残骸|debris|毒|poison|触碰|touch/.test(m)) return 'death_reason_debris';
    if (/摔|坠落|fell|fall/.test(m)) return 'death_reason_ladder';
    if (/刺|深渊|坑|abyss|spike|failed/.test(m)) return 'death_reason_abyss';
    if (/怪兽|抓住|monster|caught/.test(m)) return 'death_reason_monster';
    // 注意：挤压信息里也含"方块"，需先于下方的方块正则判断
    if (/挤压|夹住|crush|squeeze/i.test(m)) return 'death_reason_crush';
    if (/方块|顶|block|top/.test(m)) return 'death_reason_blocks';
    if (/时间|超时|time/.test(m)) return 'death_reason_time';
    if (/扫雷|地雷|mine/.test(m)) return 'death_reason_mine';
    if (/迷失|maze|lost/.test(m)) return 'death_reason_maze';
    return 'respawn_reason_default';
  },
  // 死亡复生：回到「当前关卡开头」；若失败来自带 retrySpawn 的小游戏（如记忆档案井
  // 俄罗斯方块），则回到声明的重试点（门平台），不必重爬整关。
  respawnFromCheckpoint() {
    const panel = document.getElementById('respawn-panel');
    if (panel) { panel.classList.remove('show'); setTimeout(() => panel.classList.add('hidden'), 350); }
    this._respawnShown = false;
    this.status = 'running';
    this.input.clear();
    const retry = (this._retrySpawn && this._retrySpawn.map === this.mapId)
      ? this._retrySpawn.spawn : null;
    this._retrySpawn = null;
    if (!this.mapId) return;
    // 临时摘除 advanceIf 标记：死亡复生必须回到「本关」，不能被重定向到下一节点
    const adv = this.cfg.maps[this.mapId] && this.cfg.maps[this.mapId].advanceIf;
    const hadAdv = !!(adv && adv.flag && typeof this.save.has === 'function' && this.save.has(adv.flag));
    if (hadAdv) this.save.flags.delete(adv.flag);
    // 关卡声明 checkpointRespawn（如记忆档案井）：坠落回最近经过的锚点，不重爬整关
    const def = this.cfg.maps[this.mapId] || {};
    const cp = (def.checkpointRespawn && this.checkpoint) ? this.checkpoint : null;
    this.loadLevel(this.mapId, retry || cp || undefined);
    if (hadAdv) this.save.flags.add(adv.flag);
    if (this.save && typeof this.save.persist === 'function') this.save.persist();
  },
  showLostAndExit() {
    // 兼容旧调用：统一走复生面板
    this.showRespawnPanel(pick(this.level, 'deathMessage') || I18N.t('respawn_title'));
  },
  fail(msg) {
    if (this.status !== 'running' && this.status !== 'minigame') return;
    // 跑酷死亡计数（移植自gry长街：3次死亡→结束界面）
    if (this.level && this.level.def.deathCounter) {
      this.setParkourDeaths(this.parkourDeaths + 1, this.mapId);
      // 立即保存，保证刷新或切换账号后恢复各自的真实计数。
      this.save.persist();
      this.updateHud();
      if (this.parkourDeaths >= 3) {
        // 迷失者：在绿洲入口连续坠亡三次时点亮
        if (this.mapId === 'oasis' && window.App && typeof App.unlockAchievement === 'function') {
          App.unlockAchievement('lost-one');
        }
        this.showParkourDeathEnding();
        return;
      }
    }
    this.showRespawnPanel(msg);
  },
  die(msg) {
    this.fail(msg);
  },
  /* 跑酷 3 次死亡 → 死亡结语（打字机逐字显示）→ 分两条出口：
       · 涡流关（绿洲入口 oasis / 失重舞厅 treasure）：面板保留唯一按钮「进入数据恢复区」，
         点它进入「迷失在数据流」→ 数据蛇（贪吃蛇）恢复流程；本函数不自动跳转，等玩家操作；
       · 其余关卡（含 library / road）：作为「死亡信息界面」，结语播完后点亮唯一按钮
         「返回主菜单」，停留等待玩家点击，点击后回初始菜单（见 leaveParkourDeathToMenu）。
     两种出口都不提供「重来本关」；结语文案（def.deathEnding）与面板视觉原样保留。 */
  showParkourDeathEnding() {
    this.status = 'ending';
    this.input.clear();
    this.markDeath();
    this.shake(8);
    if (window.Audio2 && Audio2.lostEnding) Audio2.lostEnding();
    const el = document.getElementById('parkour-death');
    const def = (this.level && this.level.def) || {};
    const fullText = def.deathEnding
      ? pickText(def.deathEnding, def.deathEnding_en)
      : I18N.t('parkour_death_default');
    // 涡流关判定：只有这两个跑酷关的三次死亡会接到数据蛇恢复流程
    const vortex = !!(this.level && (this.level.id === 'oasis' || this.level.id === 'treasure'));
    const token = this._runToken;
    /* 兜底出口：结语层 / 文案层缺失时无法呈现提示，也不能把玩家卡在 ending 态，
       只能直接回初始菜单。计数归零是必须的：否则「继续旅程」会带着 3 次死亡记录进场，
       一死就再弹结语。先用 token 拦截：玩家若已从别的路径离开本局，这里不得重复触发。 */
    const backToMenu = () => {
      if (token !== this._runToken) return;
      const host = document.getElementById('parkour-death');
      if (host) { host.classList.remove('show'); host.classList.add('hidden'); }
      this.setParkourDeaths(0);
      this.save.persist();
      this.leaveGame('screen-menu');
    };
    /* 按钮：涡流关点亮（唯一入口＝进数据蛇）；其余关卡作为「死亡信息界面」，
       按钮文字改为「返回主菜单」，先隐藏，等结语播完后点亮（见 typeNext 末尾）。 */
    const btn = document.getElementById('parkour-death-btn');
    if (btn) {
      btn.textContent = vortex ? I18N.t('parkour_death_continue') : I18N.t('respawn_back_menu');
      btn.classList.remove('show');
      if (vortex) { void btn.offsetWidth; btn.classList.add('show'); btn.classList.remove('hidden'); }
      else btn.classList.add('hidden');
    }
    // 结语层缺失＝无法呈现提示，也不能把玩家卡在 ending 态：直接回菜单
    if (!el) { backToMenu(); return; }
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('show');
    const textEl = document.getElementById('parkour-death-text');
    if (!textEl) { backToMenu(); return; }
    textEl.textContent = '';
    // 打字速度跟随设置（与对白一致），而非固定 120ms/字
    const speed = (this.dialog && typeof this.dialog.getSpeed === 'function') ? this.dialog.getSpeed() : 55;
    let i = 0;
    const typeNext = () => {
      // 面板已关闭或已离开本局 → 停止，避免离开后继续写入 / 延迟回菜单
      if (token !== this._runToken || !el.classList.contains('show')) return;
      if (i >= fullText.length) {
        // 结语播完：涡流关停在面板上等「进入数据恢复区」；
        // 其余关卡作为「死亡信息界面」点亮「返回主菜单」，停留等待点击（规则3/4）。
        // 按钮元素缺失时无法停留等待，退回自动出口，避免把玩家卡在结语页。
        if (!vortex) {
          if (btn) { btn.classList.remove('hidden'); void btn.offsetWidth; btn.classList.add('show'); }
          else backToMenu();
        }
        return;
      }
      textEl.textContent += fullText[i];
      i++;
      setTimeout(typeNext, speed);
    };
    setTimeout(typeNext, 300);
  },
  /* 「死亡信息界面」唯一出口（非涡流关，由结语面板的「返回主菜单」按钮触发）：
     隐藏结语层 → 死亡计数归零 → 回初始菜单。计数归零是必须的：否则「继续旅程」
     会带着 3 次死亡记录进场，一死就再弹结语。status 守卫避免离开本局后重复触发。 */
  leaveParkourDeathToMenu() {
    if (this.status !== 'ending') return;
    const host = document.getElementById('parkour-death');
    if (host) { host.classList.remove('show'); host.classList.add('hidden'); }
    const btn = document.getElementById('parkour-death-btn');
    if (btn) { btn.classList.remove('show'); btn.classList.add('hidden'); }
    this.setParkourDeaths(0);
    this.save.persist();
    this.leaveGame('screen-menu');
  },
  async fadeOut() { for (let i = 0; i <= 10; i++) { this.fadeEl.style.opacity = (i / 10); await delay(26); } },
  async fadeIn() { for (let i = 10; i >= 0; i--) { this.fadeEl.style.opacity = (i / 10); await delay(26); } },
});
