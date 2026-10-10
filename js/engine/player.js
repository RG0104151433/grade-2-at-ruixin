/* ============================================================================
 * engine/player.js —— 玩家与敌人
 * ----------------------------------------------------------------------------
 * Player 的平台跳跃物理（水平加速、冲刺、土狼时间、多段跳、单向平台穿越、
 * 穿透分离）与 Enemy 的迷宫追逐 AI。
 * 依赖：core.js 的 Rect。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 663-962 行）。方法体未作任何改动；
 * 整段搬运，未作任何改动。
 * ==========================================================================*/
'use strict';
/* ------------------------------- 玩家控制 -------------------------------- */
class Player {
  constructor(engine) {
    this.engine = engine;
    const p = engine.cfg.physics || {};
    this.runSpeed = p.runSpeed != null ? p.runSpeed : 5;
    this.dashSpeed = p.dashSpeed != null ? p.dashSpeed : 10;
    this.jumpSpeed = p.jumpSpeed != null ? p.jumpSpeed : -17;
    this.gravity = p.gravity != null ? p.gravity : 1.4;
    this.fallSpeed = p.fallSpeed != null ? p.fallSpeed : 13;
    this.fastFallMul = p.fastFallMul != null ? p.fastFallMul : 1.6;
    this.jumpHBoost = p.jumpHBoost != null ? p.jumpHBoost : 3;
    this.coyoteTime = p.coyote != null ? p.coyote : 8;
    this.dashTime = p.dashTime != null ? p.dashTime : 18;
    this.dashCooldown = p.dashCooldown != null ? p.dashCooldown : 30;
    this.jumpBuffer = p.jumpBuffer != null ? p.jumpBuffer : 4;
    this.dropThroughFrames = p.dropThroughFrames != null ? p.dropThroughFrames : 10;
    this.w = p.width != null ? p.width : 30;
    this.h = p.height != null ? p.height : 46;
    this.baseW = this.w;
    this.baseH = this.h;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.remX = 0; this.remY = 0;
    this.facing = 1;
    this.coyote = 0;
    this.jumps = 1;
    this.dash = 1;
    this.dashT = 0;
    this.dashCd = 0;
    this.dropTimer = 0;
    this.onGround = false;
    this.canInteract = false;
    this.interactLabel = null;
    /* AI-06 镜像模式：由引擎 mirrorSign 驱动（正常 +1 / 镜像 -1）。
       true 时重力方向反转、站在平台底面、「S/↓」为跳跃键、「W/↑」不再跳跃。
       AI-06 翻转跑酷（引擎 mirrorFlip，重力不变）：世界渲染上下颠倒，
       「W/↑」与「S/↓」的方向互换——W/↑ = 屏幕向上（朝跑道下落），S/↓ = 屏幕向下（起跳）。 */
    this.mirror = false;
    this.flip = false;
  }
  get rect() { return new Rect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h); }
  get bottom() { return this.y + this.h / 2; }
  spawn(col, row, facing, mode) {
    const T = this.engine.tile;
    this.x = col * T + T / 2;
    this.y = (mode === 'topdown') ? (row * T + T / 2) : (row * T - this.h / 2);
    this.vx = 0; this.vy = 0; this.remX = 0; this.remY = 0;
    this.facing = (facing || 1);
    this.coyote = 0; this.jumps = 1; this.dropTimer = 0;
    this.dashT = 0; this.dashCd = 0;
    this.onGround = false; this.canInteract = false;
  }
  update(input, level, blocked) {
    if (blocked) { this.vx = 0; this.vy = 0; return; }
    const wasGround = this.onGround;
    if (level.mode === 'topdown') { this.updateTopdown(input, level); return; }
    this.updatePlatformer(input, level);
    // 落地音：仅在「空中 → 着地」的状态翻转沿触发，避免每帧发声
    if (!wasGround && this.onGround && window.Audio2 && Audio2.land) Audio2.land();
  }
  updateTopdown(input, level) {
    const B = KEYBINDS;
    const left = input.isDown(...B.left);
    const right = input.isDown(...B.right);
    const up = input.isDown(...B.up);
    const down = input.isDown(...B.down);
    let mx = (right ? 1 : 0) - (left ? 1 : 0);
    let my = (down ? 1 : 0) - (up ? 1 : 0);
    if (mx !== 0) this.facing = mx;
    this.vx = mx * this.runSpeed;
    this.vy = my * this.runSpeed;
    this.moveAndCollide(level);
  }
  updatePlatformer(input, level) {
    const B = KEYBINDS;
    // AI-06 镜像模式：重力/跳跃/站立面/按键全部上下反转
    this.mirror = !!(this.engine && this.engine.mirrorSign < 0);
    /* AI-06 翻转跑酷（mirrorFlip）：世界上下颠倒但重力仍向下 ——
       W/↑ 与 S/↓ 的方向互换：W/↑ = 屏幕向上（朝跑道的下落/加速），
       S/↓ = 屏幕向下（真正的向下 = 起跳远离跑道）；空格仍为跳跃。 */
    this.flip = !!(this.engine && this.engine.mirrorFlip);
    const gs = this.mirror ? -1 : 1;
    const left = input.isDown(...B.left);
    const right = input.isDown(...B.right);
    const down = input.isDown(...B.down);
    const up = input.isDown(...B.up);
    /* 镜像（重力反转）：唯一跳跃键 = S/↓；翻转（重力不变）：跳跃键 = 空格 + S/↓，
       W/↑ 改为快速下落（朝屏幕上方 = 朝跑道）。 */
    const jumpKeys = this.mirror ? B.down
      : (this.flip ? [' '].concat(B.down) : B.jump);
    const jumpPressed = input.recent(this.jumpBuffer, ...jumpKeys);  // 地面跳（含输入缓冲）
    const jumpFresh = input.wasPressed(...jumpKeys);                  // 二段跳（新按下）
    const dashPressed = input.wasPressed(...B.dash);                // Shift 冲刺（新按下）
    const canDoubleJump = this.engine.save.has('doubleJump') ||
                           (level.def.maxJumps != null && level.def.maxJumps >= 2);
    const maxJumps = level.def.maxJumps || (canDoubleJump ? 2 : 1);
    const solids = level.solids;
    // 关卡级物理覆盖（如图书馆纵向攀爬：单独把跳跃高度调回参考手感）
    const phy = level.def.physics || {};
    const jumpSpeed = (phy.jumpSpeed != null ? phy.jumpSpeed : this.jumpSpeed) * gs;
    const gravity = (phy.gravity != null ? phy.gravity : this.gravity) * gs;
    let moveX = (right ? 1 : 0) - (left ? 1 : 0);
    // 翻转跑酷：快速下落/穿板改由 W/↑ 触发（S/↓ 已是跳跃键）
    const downKey = this.mirror ? false : (this.flip ? up : down);
    let moveY = downKey ? 1 : 0;

    // 水平移动
    if (moveX !== 0) {
      this.facing = moveX;
      if (Math.abs(this.vx) <= this.runSpeed) {
        this.vx = moveX * Math.min(Math.sqrt(this.vx * this.vx + 6), this.runSpeed);
      } else if (this.onGround) {
        this.vx -= (this.vx - this.runSpeed * moveX) * 0.05;
      } else {
        this.vx = Math.max(this.vx * moveX - 0.06, this.runSpeed) * moveX;
      }
    } else {
      this.vx *= Math.exp(-1.57);
      if (Math.abs(this.vx) < 0.05 * this.runSpeed) this.vx = 0;
    }

    // Shift 冲刺：按 Shift 让小人短暂水平加速（首次使用时提示「新技能」）
    if (this.dashCd > 0) this.dashCd--;
    if (dashPressed && this.dashCd <= 0) {
      if (moveX !== 0) this.facing = moveX;
      this.dashT = this.dashTime;
      this.dashCd = this.dashCooldown;
      this.engine._dashTriggered = true;
      if (window.Audio2 && Audio2.dash) Audio2.dash();
    }
    if (this.dashT > 0) {
      this.dashT--;
      this.vx = this.facing * this.dashSpeed;
    }

    // 土狼时间 + 跳跃次数重置（maxJumps 由地图配置或 save flag 决定）
    // 计次模型：onGround 重置为 maxJumps-1（起跳后空中剩余跳数）；地面起跳不额外扣减，
    // 否则 maxJumps=2 时二段跳永远无法触发（修正旧实现）。
    if (this.onGround) { this.coyote = this.coyoteTime; this.jumps = maxJumps - 1; }
    if (jumpPressed && this.coyote > 0) {
      this.coyote = 0;
      this.vy = jumpSpeed;
      this.vx += this.jumpHBoost * moveX;
      if (window.Audio2 && Audio2.jump) Audio2.jump();
    } else if (jumpFresh && !this.onGround && this.jumps > 0) {
      // 二段/多段跳：空中再按空格
      this.jumps--;
      this.vy = jumpSpeed;
      this.vx += this.jumpHBoost * moveX;
      if (window.Audio2 && Audio2.jump) Audio2.jump();
    }

    // 重力 / 快速下落（镜像下重力为负：角色向世界上方加速，视觉是世界翻转后的下方）
    if (!this.onGround || this.dropTimer > 0) {
      this.coyote = Math.max(this.coyote - 1, 0);
      const g = gravity;
      let fs = this.fallSpeed;
      if (moveY === 1) fs *= this.fastFallMul;
      this.vy = this.mirror ? Math.max(this.vy + g, -fs) : Math.min(this.vy + g, fs);
    }

    // 穿过单向平台（悬空薄板 / 隐藏梯子）：常规/翻转下为 S/↓、翻转跑酷下为 W/↑；
    // 镜像（重力反转）下该键是跳跃键，穿板禁用
    if (!this.mirror && moveY === 1 && this.standingOnOneway(level)) {
      this.dropTimer = this.dropThroughFrames;
    }
    if (this.dropTimer > 0) this.dropTimer--;

    this.moveAndCollide(level);
  }
  /* ---------------- 移动平台载人 ----------------
     顺序（见 Game.update）：trackMover（平台移动前记录脚下平台）
     → Level.updateMovers（平台移动）→ applyMoverCarry（把位移并入玩家本帧增量）。 */
  // 记录本帧「脚下的移动平台」；仅在地面上时记录，避免起跳后仍被带走
  trackMover(level) {
    this._support = this.onGround ? this.supportingMover(level) : null;
  }
  supportingMover(level) {
    const movers = level.movers;
    if (!movers || !movers.length) return null;
    const r = this.rect.clone(); r.y += 1;
    for (const t of movers) if (r.intersects(t.rect)) return t;
    return null;
  }
  // 把所站平台的位移并入本帧位置增量；碰撞仍由 moveAndCollide 统一处理
  applyMoverCarry(level) {
    const p = this._support;
    this._support = null;
    if (!p) return;
    this.remX += p._dx || 0;
    this.remY += p._dy || 0;
  }
  moveAndCollide(level) {
    // 单帧位移上限（安全网）：上限接近一格，正常速度（含快速下落）不受影响，
    // 仅防止异常速度导致一帧跨过整块墙。
    const maxStep = Math.max(2, Math.floor(this.engine.tile * 0.9));
    this.remX += this.vx;
    let dx = clamp(Math.round(this.remX), -maxStep, maxStep); this.remX -= dx;
    if (dx !== 0 && this.moveH(dx, level.solids)) this.vx = 0;

    this.remY += this.vy;
    let dy = clamp(Math.round(this.remY), -maxStep, maxStep); this.remY -= dy;
    if (dy !== 0 && this.moveV(dy, level.solids, level.oneways)) this.vy = 0;

    // 兜底：若因任何原因与实心块重叠（生成/挤压/浮点误差），按最小位移轴分离，
    // 保证角色绝不穿墙、不卡墙。
    const separated = this.resolvePenetration(level.solids);

    // 被夹死：分离失败说明角色被两块实心块夹在中间（如移动平台把人推向墙/天花板）
    if (!separated && level.mode === 'platformer') {
      this.engine.die(pickText('被两块数据方块挤压', 'Crushed between two blocks'));
      return;
    }

    this.onGround = (level.mode === 'platformer') && this.isOnGround(level.solids, level.oneways);
  }
  // 穿透分离：把角色推离与其重叠的实心瓦片（最多迭代 3 次处理多重重叠）。
  // 返回 true 表示已完全分离；返回 false 表示仍被实心块夹住（被挤压）。
  resolvePenetration(solids) {
    for (let pass = 0; pass < 3; pass++) {
      const r = this.rect;
      let hit = null;
      for (const t of solids) if (r.intersects(t.rect)) { hit = t; break; }
      if (!hit) return true;
      const tr = hit.rect;
      const oL = (this.x + this.w / 2) - tr.x;                 // 向左推出所需位移
      const oR = (tr.x + tr.w) - (this.x - this.w / 2);        // 向右
      const oU = (this.y + this.h / 2) - tr.y;                 // 向上
      const oD = (tr.y + tr.h) - (this.y - this.h / 2);        // 向下
      const minX = Math.min(oL, oR);
      const minY = Math.min(oU, oD);
      if (minX < minY) {
        if (oL < oR) { this.x -= minX; if (this.vx > 0) this.vx = 0; }
        else { this.x += minX; if (this.vx < 0) this.vx = 0; }
      } else {
        if (oU < oD) { this.y -= minY; if (this.vy > 0) this.vy = 0; }
        else { this.y += minY; if (this.vy < 0) this.vy = 0; }
      }
    }
    const r = this.rect;
    for (const t of solids) if (r.intersects(t.rect)) return false;
    return true;
  }
  moveH(d, solids) {
    const dir = Math.sign(d);
    for (let i = 0; i < Math.abs(d); i++) {
      this.x += dir;
      if (this.collidesSolids(solids)) { this.x -= dir; return true; }
    }
    return false;
  }
  moveV(d, solids, oneways) {
    const dir = Math.sign(d);
    for (let i = 0; i < Math.abs(d); i++) {
      const prevBottom = this.bottom;
      this.y += dir;
      if (this.collidesSolids(solids)) { this.y -= dir; return true; }
      if (dir > 0 && this.dropTimer <= 0) {
        if (this.collidesOnewayFromAbove(oneways, prevBottom)) { this.y -= dir; return true; }
      }
    }
    return false;
  }
  collidesSolids(solids) {
    const r = this.rect;
    for (const t of solids) if (r.intersects(t.rect)) return true;
    return false;
  }
  collidesOnewayFromAbove(oneways, prevBottom) {
    const r = this.rect;
    for (const t of oneways) {
      if (prevBottom <= t.y + 0.01 && r.intersects(t.rect)) return true;
    }
    return false;
  }
  isOnGround(solids, oneways) {
    // 镜像下「地面」在头顶：站在平台/天花板底面，探测方向改为上方
    const r = this.rect.clone(); r.y += (this.mirror ? -1 : 1);
    for (const t of solids) if (r.intersects(t.rect)) return true;
    for (const t of oneways) if (r.intersects(t.rect)) return true;
    return false;
  }
  standingOnOneway(level) {
    const r = this.rect.clone(); r.y += 1;
    let onOne = false;
    for (const t of level.oneways) if (r.intersects(t.rect)) { onOne = true; break; }
    if (!onOne) return false;
    for (const t of level.solids) if (r.intersects(t.rect)) return false;
    return true;
  }
  // 地刺/塌陷坑碰撞：OASIS 坑洞的死亡线正好是跑道线（坑瓦片顶），
  // 其它关卡仍保留原地刺下半部判定。
  touchesSpike(level) {
    const r = this.rect;
    for (const t of level.spikes) {
      // 先做粗筛
      if (!r.intersects(t.rect)) continue;
      const deadlyY = t.hazardKind === 'pit'
        ? t.y                         // 坑洞：跨过道路顶面即已开始掉落
        : t.y + t.h * 0.55;           // 原地刺：只在下半部致死
      if (this.bottom > deadlyY) return true;
    }
    return false;
  }
  // 毒雾碰撞：基于玩家碰撞体积检测；判定体四边各内缩 3px，
  // 避免擦边/贴边被误判（"碰撞体积边缘不能过大"），只有确实踏入毒雾下半部才致死。
  touchesPoison(level) {
    const r = this.rect;
    const INSET = 3;
    const hb = new Rect(r.x + INSET, r.y + INSET, r.w - INSET * 2, r.h - INSET * 2);
    for (const t of level.poisons) {
      if (!hb.intersects(t.rect)) continue;
      const deadlyY = t.y + t.h * 0.45;
      if (hb.y + hb.h > deadlyY) return true;
    }
    return false;
  }
}

/* ------------------------------- 迷宫怪兽 -------------------------------- */
class Enemy {
  constructor(engine, x, y) {
    this.engine = engine;
    this.x = x; this.y = y;
    this.w = 28; this.h = 28;
    // 速度取自 meta.monsterSpeed（此前误读顶层 cfg.monsterSpeed，取到 undefined 恒为 1.1）；
    // 保留对旧字段的兜底。
    const meta = (engine.cfg && engine.cfg.meta) || {};
    this.speed = meta.monsterSpeed != null ? meta.monsterSpeed
              : (engine.cfg && engine.cfg.monsterSpeed != null ? engine.cfg.monsterSpeed : 1.1);
    // 小数位移的余量累积：让 speed=1.1 平均每帧走 1.1px，
    // 而不是被整数循环放大成每帧 2px。
    this._rx = 0; this._ry = 0;
  }
  get rect() { return new Rect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h); }
  update(player, level) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    // 优先沿较大轴移动，撞墙后尝试另一轴，形成简单的追逐与绕行
    if (Math.abs(dx) >= Math.abs(dy)) {
      if (!this.step(Math.sign(dx) * this.speed, 0, level)) this.step(0, Math.sign(dy) * this.speed, level);
    } else {
      if (!this.step(0, Math.sign(dy) * this.speed, level)) this.step(Math.sign(dx) * this.speed, 0, level);
    }
  }
  /* 沿单轴按小数速度移动：用余量累积把不足 1px 的部分留到后续帧，
     保证平均速度等于 this.speed；撞墙则回退该轴本帧位移并返回 false。 */
  step(mx, my, level) {
    if (mx !== 0) {
      const dir = Math.sign(mx);
      this._rx += Math.abs(mx);
      let whole = Math.floor(this._rx);
      this._rx -= whole;
      for (let i = 0; i < whole; i++) {
        this.x += dir;
        if (this.hitsWall(level)) { this.x -= dir; this._rx = 0; return false; }
      }
    }
    if (my !== 0) {
      const dir = Math.sign(my);
      this._ry += Math.abs(my);
      let whole = Math.floor(this._ry);
      this._ry -= whole;
      for (let i = 0; i < whole; i++) {
        this.y += dir;
        if (this.hitsWall(level)) { this.y -= dir; this._ry = 0; return false; }
      }
    }
    return true;
  }
  hitsWall(level) {
    const r = this.rect;
    for (const t of level.solids) if (r.intersects(t.rect)) return true;
    return false;
  }
}
