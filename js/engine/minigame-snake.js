/* ============================================================================
 * engine/minigame-snake.js —— 小游戏 · 数据蛇
 * ----------------------------------------------------------------------------
 * 迷失在数据流中的恢复流程：贪吃蛇收集数据包、粒子、碰撞判定。
 * 依赖：core.js 的 clamp、normKey。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 1658-1929 行）。方法体未作任何改动；
 * 整段搬运，未作任何改动。
 * ==========================================================================*/
'use strict';
/* ------------------------------- 数据蛇小游戏 -------------------------------- */
/* 移植自 gry js/levels/level-mg-snake.js（长街「残响街机 · 数据蛇」）：
   - 玩法与原版一致：方向键 / WASD 控制蛇，吃信息包（+1），撞墙 / 撞自己 = 死亡；
   - 吃到 10 个信息包 = 数据收集完成，意识在绿洲中重新凝聚（过关）；
   - 死亡即结束本局（over + 未胜出），**画布上不画任何提示层、不给重试入口**：
     本局判负后由宿主 runDataSnake 弹出失败对话框（只留「返回主菜单」，见 _endLost）。
     原「叠层提示 R 重试」的失败态已随该需求移除；Esc 暂停仍然保留；
   - 背景使用 image/data_vortex.png（意识重聚的狭小区域 · 数据涡流）；
   - 接口对齐 draft 小游戏规范：start() 返回 Promise(won)，含 reset/togglePause/draw。 */
class DataSnake {
  constructor(engine, opts) {
    opts = opts || {};
    this.engine = engine;
    this.ctx = engine.ctx;
    this.cols = opts.cols || 32;            // 棋盘 32×18（TILE 24 → 768×432）
    this.rows = opts.rows || 18;
    this.tile = opts.tile || 24;
    this.boardX = Math.floor((engine.viewW - this.cols * this.tile) / 2);  // 1280 下居中
    this.boardY = Math.floor((engine.viewH - this.rows * this.tile) / 2);
    this.winCount = opts.winCount || 10;    // 吃到 10 个信息包即收集完成
    this.stepIv = opts.stepIv || 130;       // 蛇每步间隔(ms)
    this.over = false; this.won = false; this.paused = false;
    this._done = false;
    this._keys = {};
    this._edges = [];
    this._last = 0;
    /* 背景图回退链：新图（化身重组）缺失时逐级回退到 data_vortex.png，再失败走渐变 */
    this._bgChain = ['image/mg_data_reassembly.png', 'image/data_vortex.png'];
    this._bg = this._loadBg();
    this.reset();
  }
  /* 依序尝试背景链；全部失败由 draw() 的渐变兜底 */
  _loadBg() {
    const img = new Image();
    img.onerror = () => {
      if (this._bgChain.length > 1) {
        this._bgChain.shift();
        this._bg = this._loadBg();
      }
    };
    img.src = this._bgChain[0];
    return img;
  }
  reset() {
    this.snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];  // 头在右侧
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.eaten = 0;
    this.over = false; this.won = false;
    this.particles = []; this.stepT = 0; this.t0 = 0; this._last = 0;
    this.placeFood();
  }
  placeFood() {
    const occ = new Set(this.snake.map(s => s.x + ',' + s.y));
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
      tries++;
    } while (occ.has(x + ',' + y) && tries < 300);
    this.food = { x, y, t: 0 };
  }
  setDir(dx, dy) {
    /* 不能直接反向（占有越多越难回头） */
    if (this.snake.length > 1 && dx === -this.dir.x && dy === -this.dir.y) return;
    if (this.nextDir && this.nextDir.x === dx && this.nextDir.y === dy) return;  // 同向不重复出声
    this.nextDir = { x: dx, y: dy };
    if (window.Audio2 && Audio2.turn) Audio2.turn();
  }
  /* 死亡收尾：撞墙 / 撞自己都走这里。立即结束本局并判负，语义等价于 abort()
     （over + !won），但画布上不画任何死亡文字、不留重试入口 —— start() 的 Promise
     就此以 false 解出，宿主据此弹出失败对话框（唯一出口「返回主菜单」）。 */
  _endLost() {
    this.over = true;
    this.won = false;
    if (window.Audio2 && typeof Audio2.error === 'function') Audio2.error();
    this.engine.shake(5);
  }
  /* 核心逻辑：前进一格 */
  step() {
    this.dir = this.nextDir;
    const head = this.snake[0];
    const nh = { x: head.x + this.dir.x, y: head.y + this.dir.y };
    /* 撞墙 = 死亡（直接结束本局） */
    if (nh.x < 0 || nh.x >= this.cols || nh.y < 0 || nh.y >= this.rows) {
      this._endLost();
      return;
    }
    const willGrow = (nh.x === this.food.x && nh.y === this.food.y);
    /* 撞自己 = 死亡（将要长大的话尾巴不移动，否则尾巴会让位） */
    const body = willGrow ? this.snake : this.snake.slice(0, this.snake.length - 1);
    if (body.some(s => s.x === nh.x && s.y === nh.y)) {
      this._endLost();
      return;
    }
    this.snake.unshift(nh);
    if (willGrow) {
      this.eaten++;
      if (window.Audio2 && typeof Audio2.coin === 'function') Audio2.coin();
      this.spawnBurst(this.boardX + this.food.x * this.tile + this.tile / 2, this.boardY + this.food.y * this.tile + this.tile / 2);
      if (this.eaten >= this.winCount) {
        this.won = true; this.over = true;
        if (window.Audio2 && typeof Audio2.success === 'function') Audio2.success();
        return;
      }
      this.placeFood();
    } else {
      this.snake.pop();
    }
  }
  spawnBurst(x, y) {
    for (let i = 0; i < 14; i++) this.particles.push({
      x, y, vx: (Math.random() - 0.5) * 170, vy: (Math.random() - 0.5) * 170,
      life: 0.6, t: 0, s: 2 + Math.random() * 3,
    });
  }
  stepFrame(dt) {
    if (this.over) return;
    this.t0 += dt * 1000;
    if (this.paused) return;
    const edges = this._edges.slice(); this._edges.length = 0;
    if (edges.includes('ArrowLeft') || edges.includes('a') || edges.includes('A')) this.setDir(-1, 0);
    if (edges.includes('ArrowRight') || edges.includes('d') || edges.includes('D')) this.setDir(1, 0);
    if (edges.includes('ArrowUp') || edges.includes('w') || edges.includes('W')) this.setDir(0, -1);
    if (edges.includes('ArrowDown') || edges.includes('s') || edges.includes('S')) this.setDir(0, 1);
    this.stepT += dt * 1000;
    while (this.stepT >= this.stepIv) {
      this.stepT -= this.stepIv;
      this.step();
      if (this.over) break;   // 胜出或死亡都立即停步，交由 loop() 收尾
    }
    this.updateParticles(dt);
    if (this.food) this.food.t += dt;
  }
  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt;
      if (p.t >= p.life) this.particles.splice(i, 1);
    }
  }
  _bindInput() {
    this._onKey = e => {
      const k = e.key;
      if ([' ', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(k) >= 0) e.preventDefault();
      if (k === 'Escape') { this.togglePause(); return; }
      if (this.paused) return;
      // 死亡不再有重试键：本局已由 _endLost() 判定结束并解出 Promise
      if (!this._keys[k]) this._edges.push(k);
      this._keys[k] = true;
    };
    this._onKeyUp = e => { this._keys[e.key] = false; };
    document.addEventListener('keydown', this._onKey);
    document.addEventListener('keyup', this._onKeyUp);
  }
  _unbindInput() {
    document.removeEventListener('keydown', this._onKey);
    document.removeEventListener('keyup', this._onKeyUp);
  }
  togglePause() {
    // 显隐暂停菜单与 paused 状态统一交给引擎，避免各处重复操作 DOM
    if (this.paused) this.engine.resumeGame();
    else this.engine.pauseGame();
  }
  /* 放弃本局：由宿主 / 暂停菜单调用，统一出口，外部不再直接改 over/won。 */
  abort() {
    this.paused = false;
    this.over = true;
    this.won = false;
  }
  start() {
    this._bindInput();
    this._last = performance.now();
    return new Promise(resolve => {
      this._resolve = resolve;
      this._loop = requestAnimationFrame(this.loop.bind(this));
    });
  }
  _finish() {
    if (this._done) return;
    this._done = true;
    this._unbindInput();
    cancelAnimationFrame(this._loop);
    if (this._resolve) this._resolve(this.won);
  }
  loop(now) {
    this._loop = requestAnimationFrame(this.loop.bind(this));
    // 先按真实时间推进基准，再判断暂停：暂停期间基准持续推进，
    // 恢复后 dt 不会突然变大（避免“暂停结束时跳一格”）。
    const dt = clamp((now - this._last) / 1000 || 0.016, 0, 0.05);
    this._last = now;
    if (this.paused) { this.draw(); return; }
    this.stepFrame(dt);
    this.draw();
    if (this.over) { this._finish(); return; }
  }
  draw() {
    const ctx = this.ctx;
    const W = this.engine.viewW, H = this.engine.viewH;
    const bx = this.boardX, by = this.boardY;
    /* 背景：等比铺满（cover 居中裁切，不拉伸变形）+ 压暗，保证棋盘可读 */
    if (this._bg.complete && this._bg.naturalWidth > 0) {
      const iw = this._bg.naturalWidth, ih = this._bg.naturalHeight;
      const s = Math.max(W / iw, H / ih);
      const sw = W / s, sh = H / s;
      ctx.drawImage(this._bg, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, W, H);
      ctx.fillStyle = 'rgba(8,6,20,0.55)';
      ctx.fillRect(0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#3a1a6e'); g.addColorStop(0.5, '#1e1042'); g.addColorStop(1, '#08061a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    /* 数据流光斑（自底向上漂浮的短线） */
    for (let i = 0; i < 26; i++) {
      const x = (i * 173 + 41 + this.t0 * 0.02) % W;
      const y = (i * 97 + 13 + Math.sin(this.t0 / 1400 + i) * 12 + H) % H;
      ctx.fillStyle = 'rgba(232,193,90,' + (0.05 + 0.08 * Math.abs(Math.sin(this.t0 / 900 + i))) + ')';
      ctx.fillRect(x, y, 22, 3);
    }
    /* 顶部 HUD：标题 + 目标 + 进度（y≥80 避开外壳 HUD 玻璃条） */
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
    ctx.fillText(I18N.t('mg_snake_title'), 36, 80);
    ctx.fillStyle = '#cfd8ff';
    ctx.font = '15px "Microsoft YaHei", sans-serif';
    ctx.fillText(I18N.t('mg_snake_desc'), 36, 118);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 18px Consolas,"Microsoft YaHei",sans-serif';
    ctx.fillText(I18N.t('mg_snake_progress', { n: this.eaten, total: this.winCount, len: this.snake.length }), W - 36, 84);
    /* 数据墙边框 + 棋盘 */
    ctx.strokeStyle = 'rgba(240,200,105,0.6)'; ctx.lineWidth = 3;
    ctx.strokeRect(bx - 4, by - 4, this.cols * this.tile + 8, this.rows * this.tile + 8);
    ctx.fillStyle = 'rgba(20,12,4,0.45)';
    ctx.fillRect(bx, by, this.cols * this.tile, this.rows * this.tile);
    ctx.strokeStyle = 'rgba(240,200,105,0.05)'; ctx.lineWidth = 1;
    for (let c = 1; c < this.cols; c++) { ctx.beginPath(); ctx.moveTo(bx + c * this.tile, by); ctx.lineTo(bx + c * this.tile, by + this.rows * this.tile); ctx.stroke(); }
    for (let r = 1; r < this.rows; r++) { ctx.beginPath(); ctx.moveTo(bx, by + r * this.tile); ctx.lineTo(bx + this.cols * this.tile, by + r * this.tile); ctx.stroke(); }
    /* 信息包（金色菱形，脉冲发光） */
    if (this.food) {
      const fx = bx + this.food.x * this.tile + this.tile / 2, fy = by + this.food.y * this.tile + this.tile / 2;
      const pulse = 0.7 + 0.3 * Math.sin(this.t0 / 200);
      ctx.save();
      ctx.translate(fx, fy); ctx.rotate(Math.PI / 4);
      ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 16 * pulse;
      ctx.fillStyle = '#ffd76a';
      const s = (this.tile - 8) / 2 * (0.8 + 0.2 * pulse);
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-s, -s, s * 2, 3);
      ctx.restore();
      ctx.shadowBlur = 0;
    }
    /* 蛇身 */
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i];
      const x = bx + seg.x * this.tile, y = by + seg.y * this.tile;
      const isHead = i === 0;
      ctx.fillStyle = isHead ? '#ffe48a' : '#e8c15a';
      if (isHead) { ctx.shadowColor = '#ffd76a'; ctx.shadowBlur = 12; }
      ctx.fillRect(x + 2, y + 2, this.tile - 4, this.tile - 4);
      ctx.shadowBlur = 0;
      ctx.fillStyle = isHead ? '#a67c28' : '#7a5520';
      ctx.fillRect(x + 2, y + this.tile / 2 - 1, this.tile - 4, 2);  // 节段分割
    }
    /* 蛇头眼睛 */
    if (this.snake.length) {
      const h = this.snake[0];
      const hx = bx + h.x * this.tile + this.tile / 2, hy = by + h.y * this.tile + this.tile / 2;
      const ex = this.dir.x * 4, ey = this.dir.y * 4;
      ctx.fillStyle = '#1c1008';
      ctx.beginPath(); ctx.arc(hx + ex - this.dir.y * 3, hy + ey + this.dir.x * 3, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(hx + ex + this.dir.y * 3, hy + ey - this.dir.x * 3, 2, 0, Math.PI * 2); ctx.fill();
    }
    /* 粒子 */
    this.particles.forEach(p => {
      ctx.fillStyle = 'rgba(255,220,140,' + (0.8 * (1 - p.t / p.life)) + ')';
      ctx.fillRect(p.x, p.y, p.s, p.s);
    });
    /* 死亡不再有任何画布提示层：_endLost() 已在同一帧解出 Promise，
       宿主随即弹出失败对话框，此处刻意不画任何文字 / 遮罩。 */
    /* 底部操作提示 */
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(207,216,255,0.7)';
    ctx.font = '15px "Microsoft YaHei", sans-serif';
    ctx.fillText(I18N.t('mg_snake_help'), W / 2, H - 14);
  }
}

