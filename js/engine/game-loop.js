/* ============================================================================
 * engine/game-loop.js —— Game 方法组 · 帧循环与关卡运行时
 * ----------------------------------------------------------------------------
 * 固定步长主循环、update 分派、树木交互的跳跃等待、迷宫怪兽的生成与
 * 追逐结算、狩猎成就、迷宫寻路、空格随机取点、无尽道路的平台生成与区块回收。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 2469-2681 行）。方法体未作任何改动；
 * 因改用对象字面量承载，仅在每个方法结束的大括号后补了成员分隔逗号。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  loop(now) {
    requestAnimationFrame(this.loop.bind(this));
    const dt = clamp(now - this.last, 0, 100); this.last = now;
    this.acc += dt;
    const STEP = 1000 / 60;
    while (this.acc >= STEP) {
      this.input.tick();
      if (this.status === 'running') this.update();
      this.input.endFrame();
      this.acc -= STEP;
    }
    if (this.status === 'minigame') return; // 小游戏自己绘制
    if (this.status === 'running' || this.status === 'busy' || this.status === 'paused') this.render();
  },
  update() {
    const L = this.level;
    if (!L) return;

    // 处理排队中的剧情（如迷宫怪兽第一次出现）
    if (this.pendingEvents.length > 0) {
      const evs = this.pendingEvents.shift();
      this.startEvents(evs, []);
      return;
    }

    // 场景模式（家/阳台）：无平台物理，鼠标/键盘热区交互已由 DOM 事件处理
    if (L.mode === 'scene') { this.updateScene(); return; }

    // 移动平台载人：先记录脚下平台（平台移动前）→ 移动平台 → 把位移并入玩家本帧增量
    if (L.movers && L.movers.length) {
      this.player.trackMover(L);
      L.updateMovers();
      this.player.applyMoverCarry(L);
    }

    this.player.update(this.input, L, false);
    if (this._dashTriggered) { this._dashTriggered = false; this.showSkillHint('shift'); }
    if (this._jumpWait) this.updateJumpWait();
    this.checkTriggers();
    // 图书馆档案调查点（站上进关选中的触发架才触发；逐帧重试，见 game-interact.js）
    if (this.ladderNoteTick) this.ladderNoteTick();
    // AI-06：图书馆前廊镜像谜题状态机（提示对白 / 死路 / 校验台 / 镜像同步）
    if (this.gateMirrorTick) this.gateMirrorTick();
    // 遗失索引场（treasure）：按存档完成标记幂等挂载安全桥 / 开启索引门（只读存档）
    if (this.indexFieldTick) this.indexFieldTick();
    // E3·S1：oasis 可选逆流维护点（触发提示 / 扫描 / 升降台；仅在 oasis 生效）
    if (this.oasisMaintenanceTick) this.oasisMaintenanceTick();
    // 阶段5：访客索引册「原地试试」监听（只读玩家状态；非 library_gate 立即返回）
    if (this.indexBookTick) this.indexBookTick();
    // 阶段6：主档案门开门条件监听（四项条件齐备且确认小字消失后开演；只读玩家状态）
    if (this.archiveDoorTick) this.archiveDoorTick();
    // 共同校验廊：老档终端状态恢复（只读/一次性写 flag，不碰物理）
    if (this.archiveExchangeTick) this.archiveExchangeTick();
    this.updateContextPrompt();
    this.updateGuideCues();

    if (this.poisonGrace > 0) this.poisonGrace--;

    if (L.mode === 'platformer') {
      // 毒雾：接触即死；复生/进场后的短暂无敌帧内不判毒雾（公平性）
      const inPoison = this.poisonGrace <= 0 && this.player.touchesPoison(L);
      // AI-06 镜像坑洞：翻转后仍用正常重力（世界向下），角色站在镜像跑道上表面。
      // 掉出跑道即世界向下坠落，顶部越过 killFallRow 判定掉进街景（死亡线与跑道下方 N 行一致）。
      const mirrorKill = this.mirrorFlip && L.def.mirror
        ? this.player.rect.y > (L.def.mirror.killFallRow != null ? L.def.mirror.killFallRow
            : ((L.def.mirror.runway && L.def.mirror.runway.row != null ? L.def.mirror.runway.row : 3) + 6)) * this.tile
        : false;
      /* fallKillY（失重舞厅 2026-09-20，需求③）：本关容错为 0 —— 玩家一离开平台下落
         就立刻结算，不必等到 killY。与其它跑酷关「掉下去还能爬回来」明确区分。 */
      const fellOff = (L.fallKillY != null) && (this.player.bottom > L.fallKillY);
      if (this.player.touchesSpike(L) || inPoison || mirrorKill || fellOff || this.player.bottom > L.killY) {
        /* 掉落死亡用专属文案（fallMessage 取不到时回退 deathMessage） */
        const hasFallMsg = fellOff && L.fallMessage;
        this.die(hasFallMsg ? pick(L, 'fallMessage') : pick(L, 'deathMessage'));
        return;
      }
    }

    // 无尽道路：只维护生成/回收；D5 提示由证据点主动请求，不按距离剧透。
    if (L.endless) {
      this.ensurePlatforms();
      L.updateEndlessWindow(this);   // 按相机激活/回收区块（优化方案 C2）
    }

    // 迷宫：生成怪兽 + 怪兽追逐 + 碰撞死亡
    if (L.mazeCfg) this.updateMaze();

    // E3/AI-20+90A：guided 路线参数与分层资源生命周期（存在性守卫，
    // 模块缺失时零开销；只读引擎，不改碰撞/跳跃/剧情）
    if (window.GuidedRoute) GuidedRoute.tick(this);
    if (window.GuidedLayers) GuidedLayers.sync(this);

    this.camera.follow(this.player.x, this.player.y, L.cameraBound);
  },
  // 树木交互：等待角色完成自动跳跃并落地后，再弹出对白
  updateJumpWait() {
    const w = this._jumpWait;
    if (!w || this.level !== w.level) { this._jumpWait = null; return; }
    w.timer++;
    if (!w.left) {
      if (!this.player.onGround) w.left = true;
      return;
    }
    // 已离地后重新落地（留几帧缓冲，避免起跳瞬间误判）
    if ((this.player.onGround && w.timer > 4) || w.timer > 150) {
      this._jumpWait = null;
      this.startEvents(w.t.events, w.t.flags);
    }
  },
  updateMaze() {
    const cfg = this.level.mazeCfg;
    const total = cfg.total || 7;
    const maxAlive = cfg.maxAlive || 3;
    this.enemyTimer++;
    // 随机刷新：总共 total 只，场上同时最多 maxAlive 只
    if (this.enemiesSpawned < total && this.enemies.length < maxAlive && this.enemyTimer >= (cfg.spawnInterval || 140)) {
      this.enemyTimer = 0;
      const cell = this.randomFloorAway(cfg.minSpawnDist || 5);
      if (cell) {
        this.enemies.push(new Enemy(this, cell.col * this.tile + this.tile / 2, cell.row * this.tile + this.tile / 2));
        this.enemiesSpawned++;
      }
    }

    // 数据护盾拾取（扫雷奖励，D3）：与药水重叠即获得有限层护盾
    if (this.level.potion && !this.save.has('magic-potion')) {
      if (this.player.rect.intersects(this.level.potion.rect)) {
        this.save.addFlags(['magic-potion']);
        this.save.shields = this.mazeShieldCharges();
        this.save.persist();
        if (window.App && typeof App.unlockAchievement === 'function') App.unlockAchievement('magic-potion');
        this.pendingEvents.push([{ type: 'dialog', id: 'magic_potion' }]);
      }
    }

    // 怪兽移动 + 陷阱击杀（怪兽进入陷阱即消失，玩家踩陷阱无影响）
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(this.player, this.level);
      let trapped = false;
      for (const t of this.level.traps) {
        if (e.rect.intersects(t.rect)) { trapped = true; break; }
      }
      if (trapped) {
        this.enemies.splice(i, 1);
        this.trapKills++;
        if (window.Audio2) Audio2.hurt();
        this.checkHunterAchievement();
      }
    }

    // 玩家正面遭遇怪兽：首次触发交互剧情（游戏短暂暂停）
    if (!this.save.has('maze_monster_intro')) {
      const d = cfg.encounterDist || 2.2;
      for (const e of this.enemies) {
        const dx = (e.x - this.player.x) / this.tile;
        const dy = (e.y - this.player.y) / this.tile;
        if (Math.hypot(dx, dy) <= d) {
          this.save.addFlags(['maze_monster_intro']);
          this.pendingEvents.push([{ type: 'dialog', id: 'maze_monster' }]);
          break;
        }
      }
    }

    // 怪兽碰到玩家：有数据护盾则消耗一层并击毁该怪兽，无护盾则失败（D3）
    if ((this.save.shields || 0) > 0) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        if (this.enemies[i].rect.intersects(this.player.rect)) {
          this.save.shields -= 1;
          this.save.persist();
          this.enemies.splice(i, 1);
          this.shake(4);
          if (window.Audio2 && Audio2.hurt) Audio2.hurt();
          if (window.App && typeof App.toast === 'function') {
            App.toast(I18N.t('toast_shield_used', { n: this.save.shields }));
          }
          this.updateHud();
          break;
        }
      }
    } else {
      for (const e of this.enemies) {
        if (e.rect.intersects(this.player.rect)) { this.die(pick(this.level, 'deathMessage')); return; }
      }
    }

    const killsEl = document.getElementById('hud-kills');
    if (killsEl) killsEl.textContent = I18N.t('hud_hunt', { n: this.trapKills, total });
  },
  checkHunterAchievement() {
    if (this.hunterDone) return;
    const total = this.level.mazeCfg ? (this.level.mazeCfg.total || 7) : 7;
    if (this.trapKills >= total) {
      this.hunterDone = true;
      if (window.App && typeof App.unlockAchievement === 'function') App.unlockAchievement('hunter');
    }
  },
  computeMazePath() {
    const L = this.level;
    if (!L || !L.mazeCfg) { if (L) L.mazePath = []; return; }
    const grid = L.grid;
    const start = L.spawn;
    let exit = { col: Math.max(1, L.cols - 2), row: Math.max(1, L.rows - 2) };
    const ext = L.triggers.find(t => t.id === 'maze_exit');
    if (ext) exit = { col: Math.round(ext.rect.x / this.tile), row: Math.round(ext.rect.y / this.tile) };
    const walkable = (c, r) => r >= 0 && r < grid.length && c >= 0 && c < grid[r].length && grid[r][c] === '.';
    const queue = [{ c: start.col, r: start.row, path: [] }];
    const seen = new Set([start.col + ',' + start.row]);
    L.mazePath = [];
    while (queue.length) {
      const cur = queue.shift();
      if (cur.c === exit.col && cur.r === exit.row) {
        L.mazePath = [...cur.path, { col: cur.c, row: cur.r }];
        return;
      }
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = cur.c + dc, nr = cur.r + dr;
        const k = nc + ',' + nr;
        if (walkable(nc, nr) && !seen.has(k)) {
          seen.add(k);
          queue.push({ c: nc, r: nr, path: [...cur.path, { col: cur.c, row: cur.r }] });
        }
      }
    }
  },
  randomFloorAway(minDist) {
    const L = this.level;
    const isTrap = (col, row) => (L.traps || []).some(t => t.col === col && t.row === row);
    // 迷宫优先在“起点→终点必经路径”上刷新怪兽，保证必经之路上有怪兽
    const pool = (L.mazePath && L.mazePath.length) ? L.mazePath : L.floorCells;
    const cells = pool.filter(c => {
      if (isTrap(c.col, c.row)) return false;
      const dx = c.col - (this.player.x / this.tile - 0.5);
      const dy = c.row - (this.player.y / this.tile - 0.5);
      return Math.hypot(dx, dy) >= minDist;
    });
    if (!cells.length) return null;
    return cells[Math.floor(Math.random() * cells.length)];
  },
  ensurePlatforms() {
    const L = this.level;
    if (!L || !L.endless) return;
    const cfg = L.endlessCfg;
    // 随机源在 loadLevel 进入本关时创建一次（同 seed → 同一条道路）；
    // 兜底：若在别处直接调用，则按配置 seed 现场创建。
    const rng = L.endlessRng || (L.endlessRng = makeRng(cfg.seed != null ? cfg.seed : 7));
    const num = (v, d) => (v != null ? v : d);
    const rand = (a, b) => a + Math.floor(rng() * (b - a + 1));
    const startX = (cfg.startCol || 0) * this.tile;
    const camRight = this.camera.x + this.viewW / 2 + this.tile * 6;
    const spikeY = (L.rows - 1) * this.tile;
    // 上下两层：各自独立的生成游标与随机范围（未配置 layers 时退化为单层）
    const layers = cfg.layers || [{
      minY: cfg.minY, maxY: cfg.maxY, minGap: cfg.minGap, maxGap: cfg.maxGap,
      minW: cfg.minW, maxW: cfg.maxW, countHint: true,
    }];
    if (!L.genCursors) {
      L.genCursors = layers.map(() => startX);
      L.spikeRight = startX;   // 底部尖刺的连续右边界（只跟最下层）
    }
    let guard = 0;
    for (let li = 0; li < layers.length; li++) {
      const ly = layers[li];
      while (L.genCursors[li] < camRight && guard++ < 500) {
        const gap = rand(num(ly.minGap, 1), num(ly.maxGap, 3)) * this.tile;
        const w = rand(num(ly.minW, 2), num(ly.maxW, 4)) * this.tile;
        const y = rand(num(ly.minY, 5), num(ly.maxY, 9)) * this.tile;
        const x = L.genCursors[li] + gap;
        // 实心方块 + 登记为移动平台（移植 oasis/treasure 的移动 + 载人 + 挤压）
        const blk = L.addGeneratedSolid(x, y, w);
        // D2：下层每 checkpointEvery 块登记一个复生锚点；锚点方块不注册为
        // 移动平台，保证复生落脚位置稳定（其余悬浮块仍随机移动）。
        const isAnchor = !!ly.countHint && ((this.platformCount + 1) % (cfg.checkpointEvery || 5) === 0);
        if (isAnchor) {
          L.genAnchorSpots.push({ col: Math.round(x / this.tile), row: Math.round(y / this.tile), w: Math.round(w / this.tile) });
        } else {
          L.markMover(blk);
        }
        L.recordEndlessTile('platform', blk);   // 区块表登记（优化方案 C2）
        L.genCursors[li] = x + w;
        if (ly.countHint) {
          // 最下层负责铺满底部尖刺（含平台间空隙），并累计「回头」提示进度
          const sw = x + w - L.spikeRight;
          if (sw > 0) L.recordEndlessTile('spike', L.addGeneratedSpike(L.spikeRight, spikeY, sw));
          if (x + w > L.spikeRight) L.spikeRight = x + w;
          this.platformCount++;
          const hintAfter = cfg.hintAfterPlatforms || 10;
          if (!this.hintX && this.platformCount >= hintAfter) this.hintX = x + w;
          if (!this.hint2X && this.platformCount >= hintAfter * 2) this.hint2X = x + w;
        }
      }
    }
    this.genRightX = L.genCursors[0];
  },
});
