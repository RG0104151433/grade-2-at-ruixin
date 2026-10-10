/* ============================================================================
 * engine/minigame-tetris.js —— 小游戏 · 俄罗斯方块
 * ----------------------------------------------------------------------------
 * 智慧之钥的方块挑战：形状表、旋转表、消行、时间限制、金库背景。
 * 依赖：core.js 的 clamp、normKey。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 1139-1428 行）。方法体未作任何改动；
 * 整段搬运，未作任何改动。
 * ==========================================================================*/
'use strict';
/* ----------------------------- 俄罗斯方块 -------------------------------- */
const TETRIS_SHAPES = {
  I: [[0,0],[1,0],[2,0],[3,0]],
  O: [[0,0],[1,0],[0,1],[1,1]],
  T: [[0,0],[1,0],[2,0],[1,1]],
  S: [[1,0],[2,0],[0,1],[1,1]],
  Z: [[0,0],[1,0],[1,1],[2,1]],
  J: [[0,0],[0,1],[1,1],[2,1]],
  L: [[2,0],[0,1],[1,1],[2,1]],
};
const TETRIS_COLORS = ['#00e5ff','#e040fb','#ffe082','#69f0ae','#ff6e40','#40c4ff','#ff5252'];

// 档案校验室背景；新图失败时回退旧金库图，任何资源问题都不阻塞玩法。
let TETRIS_BG_IMG = null;
function getTetrisBg() {
  if (!TETRIS_BG_IMG) {
    TETRIS_BG_IMG = new Image();
    TETRIS_BG_IMG.onerror = function () {
      if (!TETRIS_BG_IMG || /mg_gold_room/.test(TETRIS_BG_IMG.src || '')) return;
      TETRIS_BG_IMG.src = 'image/mg_gold_room.png';
    };
    TETRIS_BG_IMG.src = 'image/mg_archive_validation_room.png';
  }
  return TETRIS_BG_IMG;
}

function makeRotations(cells) {
  let cur = cells.map(c => [c[0], c[1]]);
  const out = [];
  for (let r = 0; r < 4; r++) {
    const minx = Math.min(...cur.map(c => c[0]));
    const miny = Math.min(...cur.map(c => c[1]));
    out.push(cur.map(c => [c[0] - minx, c[1] - miny]));
    cur = cur.map(([x, y]) => [-y, x]);
  }
  return out;
}

/* 规则（与原版一致，仅结算阈值不同）：
   · 过关只看限时结算：120 秒到时 lines >= winLines（5）即过关，否则失败；
   · 同一结算时刻 lines >= blockMasterLines（10）→ 额外点亮成就「方块大师」；
   · 方块堆到顶端（或新方块出生即碰撞）立即判失败，与已消除行数无关；
   · 没有「达标后 Enter 提前过关」，也没有 5 行停表阶段卡。 */
class Tetris {
  constructor(engine, opts) {
    opts = opts || {};
    this.engine = engine;
    this.ctx = engine.ctx;
    this.cols = 10; this.rows = 20; this.cell = 28;
    this.winLines = opts.lines || 4;                  // 过关需要消除的行数
    this.milestoneLines = opts.milestoneLines || 0;   // 正文恢复节点（library=5）：仅用于进度文案切换
    this.timeLimit = (opts.timeLimit || 90) * 1000;   // 限时（毫秒）
    this.blockMasterLines = 10;                       // 方块大师成就所需行数
    this.board = [];
    this.over = false; this.won = false; this.lines = 0;
    this.failReason = null;     // 失败原因：'time' 超时 / 'blocks' 堆顶（供宿主选提示文案）
    this.acc = 0; this.last = 0; this.fallDelay = 30; this.fallTimer = 0;
    this.bag = [];
    this.nextType = null;
    this.clock = new GameClock(this.timeLimit);   // 只在运行帧推进，暂停不消耗限时
    this._done = false;
    this.blockMasterDone = false;
    this.reset();
  }
  reset() {
    this.board = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));
    this.over = false; this.won = false; this.lines = 0; this.fallTimer = 0;
    this.failReason = null;
    this.bag = [];
    this.clock.reset();
    this.nextType = this.randType();
    this.current = this.spawnPiece(this.takeNext());
  }
  randType() {
    if (this.bag.length === 0) {
      this.bag = ['I','O','T','S','Z','J','L'];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }
  takeNext() {
    const t = this.nextType;
    this.nextType = this.randType();
    return t;
  }
  spawnPiece(type) {
    const rots = makeRotations(TETRIS_SHAPES[type]);
    const w = Math.max(...rots[0].map(c => c[0])) + 1;
    return { type, rots, rot: 0, x: Math.floor((this.cols - w) / 2), y: 0, color: TETRIS_COLORS[Object.keys(TETRIS_SHAPES).indexOf(type)] };
  }
  cells(piece) {
    const rot = piece ? piece.rots[piece.rot] : this.current.rots[this.current.rot];
    const x = piece ? piece.x : this.current.x;
    const y = piece ? piece.y : this.current.y;
    return rot.map(c => [x + c[0], y + c[1]]);
  }
  collide(piece) {
    for (const [x, y] of this.cells(piece)) {
      if (x < 0 || x >= this.cols || y >= this.rows) return true;
      if (y >= 0 && this.board[y][x] !== 0) return true;
    }
    return false;
  }
  move(dx, dy) {
    this.current.x += dx; this.current.y += dy;
    if (this.collide()) { this.current.x -= dx; this.current.y -= dy; return false; }
    return true;
  }
  rotate() {
    const old = this.current.rot;
    this.current.rot = (this.current.rot + 1) % 4;
    if (this.collide()) this.current.rot = old;
  }
  softDrop() {
    if (!this.move(0, 1)) this.lock();
  }
  hardDrop() {
    while (this.move(0, 1)) { /* fall */ }
    this.lock();
  }
  lock() {
    for (const [x, y] of this.cells()) {
      // 堆到顶：无论已消多少行都判失败（过关只看限时结算）
      if (y < 0) { this.over = true; this.won = false; this.failReason = 'blocks'; this.engine.shake(5); return; }
      this.board[y][x] = this.current.color;
    }
    this.clearLines();
    this.current = this.spawnPiece(this.takeNext());
    if (this.collide()) { this.over = true; this.won = false; this.failReason = 'blocks'; this.engine.shake(5); return; }
  }
  clearLines() {
    const before = this.lines;
    for (let y = this.rows - 1; y >= 0; y--) {
      if (this.board[y].every(c => c !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(new Array(this.cols).fill(0));
        this.lines++;
        y++;
      }
    }
    const cleared = this.lines - before;
    if (cleared > 0 && window.Audio2 && Audio2.lineClear) Audio2.lineClear(cleared);
  }
  /* 限时结算时的成就判定：只有「120 秒结束时已消除 10 行」才点亮方块大师，
     途中达到 10 行但中途堆顶失败的不算（条件口径与文案一致）。幂等。 */
  settleBlockMaster() {
    if (this.lines < this.blockMasterLines || this.blockMasterDone) return;
    this.blockMasterDone = true;
    if (window.App && typeof App.unlockAchievement === 'function') App.unlockAchievement('block-master');
  }
  remainingTime() {
    return Math.ceil(this.clock.remainingMs / 1000);
  }
  _bindInput() {
    this._onKey = e => {
      const k = normKey(e.key);
      if (k === 'Escape') { this.togglePause(); return; }
      if (this.paused) return;
      if (k === 'a' || k === 'ArrowLeft') { e.preventDefault(); if (this.move(-1, 0) && window.Audio2 && Audio2.move) Audio2.move(); }
      else if (k === 'd' || k === 'ArrowRight') { e.preventDefault(); if (this.move(1, 0) && window.Audio2 && Audio2.move) Audio2.move(); }
      else if (k === 's' || k === 'ArrowDown') { e.preventDefault(); this.softDrop(); }
      else if (k === ' ') { e.preventDefault(); this.hardDrop(); if (window.Audio2 && Audio2.hardDrop) Audio2.hardDrop(); }
      else if (k === 'w' || k === 'ArrowUp' || k === 'x') { e.preventDefault(); this.rotate(); if (window.Audio2 && Audio2.rotate) Audio2.rotate(); }
      else if (k === 'r') { this.reset(); }
    };
    document.addEventListener('keydown', this._onKey);
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
  _unbindInput() { document.removeEventListener('keydown', this._onKey); }
  start() {
    this._bindInput();
    this.last = performance.now();
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
    if (window.Audio2) {
      if (this.won && Audio2.success) Audio2.success();
      else if (!this.won && Audio2.gameOver) Audio2.gameOver();
    }
    this._resolve(this.won);
  }
  loop(now) {
    if (this.over) { this._finish(); return; }
    this._loop = requestAnimationFrame(this.loop.bind(this));
    // 先更新 last，保证恢复后 dt 不跳；暂停时仅重绘，不推进时钟与方块
    const dt = clamp(now - this.last, 0, 100); this.last = now;
    if (this.paused) { this.draw(); return; }
    this.clock.tick(dt);
    this.acc += dt;
    const STEP = 1000 / 60;
    while (this.acc >= STEP) {
      this.fallTimer++;
      if (this.fallTimer >= this.fallDelay) { this.fallTimer = 0; this.softDrop(); }
      this.acc -= STEP;
      if (this.over) break;
    }
    if (!this.over && this.remainingTime() <= 0) {
      this.over = true;
      this.won = this.lines >= this.winLines;
      this.failReason = 'time';
      this.settleBlockMaster();   // 120 秒结束时达 10 行 → 方块大师
    }
    this.draw();
    if (this.over) this._finish();
  }
  boardPos() {
    const bw = this.cols * this.cell, bh = this.rows * this.cell;
    return { x: Math.floor((this.engine.viewW - bw) / 2), y: Math.floor((this.engine.viewH - bh) / 2), w: bw, h: bh };
  }
  drawBlock(x, y, color, cell) {
    cell = cell || this.cell;
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + 1, y + 1, cell - 2, 3);
  }
  draw() {
    const ctx = this.ctx;
    // 背景：金库图 + 暗色遮罩（移植自 gry level-mg-gold）
    const bg = getTetrisBg();
    if (bg.complete && bg.naturalWidth > 0) {
      ctx.drawImage(bg, 0, 0, this.engine.viewW, this.engine.viewH);
      ctx.fillStyle = 'rgba(20,12,4,0.45)';
      ctx.fillRect(0, 0, this.engine.viewW, this.engine.viewH);
    } else {
      ctx.fillStyle = '#05060d';
      ctx.fillRect(0, 0, this.engine.viewW, this.engine.viewH);
    }
    const b = this.boardPos();
    // 棋盘外框
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
    ctx.fillStyle = 'rgba(8,12,24,0.72)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // 网格
    ctx.strokeStyle = 'rgba(0,229,255,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.cols; x++) { ctx.beginPath(); ctx.moveTo(b.x + x * this.cell, b.y); ctx.lineTo(b.x + x * this.cell, b.y + b.h); ctx.stroke(); }
    for (let y = 0; y <= this.rows; y++) { ctx.beginPath(); ctx.moveTo(b.x, b.y + y * this.cell); ctx.lineTo(b.x + b.w, b.y + y * this.cell); ctx.stroke(); }
    // 已落方块
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.board[y][x]) this.drawBlock(b.x + x * this.cell, b.y + y * this.cell, this.board[y][x]);
      }
    }
    // 落点投影（ghost）：半透明金色标出方块落位（移植自 gry level-mg-gold）
    if (!this.over && this.current) {
      let ghostY = this.current.y;
      while (!this.collide({ ...this.current, y: ghostY + 1 })) ghostY++;
      ctx.fillStyle = 'rgba(240,200,105,0.18)';
      for (const [x, y] of this.cells({ ...this.current, y: ghostY })) {
        if (y >= 0) ctx.fillRect(b.x + x * this.cell + 1, b.y + y * this.cell + 1, this.cell - 2, this.cell - 2);
      }
    }
    // 当前方块
    for (const [x, y] of this.cells()) {
      if (y >= 0) this.drawBlock(b.x + x * this.cell, b.y + y * this.cell, this.current.color);
    }
    // 右侧信息面板
    const px = b.x + b.w + 48;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 28px "Microsoft YaHei",sans-serif';
    ctx.fillText(I18N.t('mg_tetris_title'), px, b.y);
    // 下一个方块预览
    ctx.fillStyle = '#eaf6ff';
    ctx.font = '16px "Microsoft YaHei",sans-serif';
    ctx.fillText(I18N.t('mg_tetris_next'), px, b.y + 50);
    const pv = makeRotations(TETRIS_SHAPES[this.nextType])[0];
    const pcolor = TETRIS_COLORS[Object.keys(TETRIS_SHAPES).indexOf(this.nextType)];
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(px, b.y + 74, 5 * 24, 5 * 24);
    for (const [cx, cy] of pv) this.drawBlock(px + cx * 24, b.y + 74 + cy * 24, pcolor, 24);
    // 进度 / 时间
    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 20px "Microsoft YaHei",sans-serif';
    const progressKey = (this.milestoneLines > 0 && this.lines < this.milestoneLines)
      ? 'mg_tetris_body_progress' : 'mg_tetris_credit_progress';
    const progressTotal = (progressKey === 'mg_tetris_body_progress') ? this.milestoneLines : this.blockMasterLines;
    ctx.fillText(I18N.t(progressKey, { n: this.lines, total: progressTotal }), px, b.y + 214);
    const remain = this.remainingTime();
    ctx.fillStyle = remain <= 15 ? '#ff5252' : '#69f0ae';
    ctx.fillText(I18N.t('mg_tetris_time', { n: remain }), px, b.y + 244);
    // 操作说明（与需求一致）
    ctx.fillStyle = '#cfd8ff';
    ctx.font = '16px "Microsoft YaHei",sans-serif';
    const ops = ['mg_tetris_op_a', 'mg_tetris_op_d', 'mg_tetris_op_s', 'mg_tetris_op_space', 'mg_tetris_op_w'];
    for (let i = 0; i < ops.length; i++) ctx.fillText(I18N.t(ops[i]), px, b.y + 302 + i * 30);
    ctx.fillStyle = '#00e5ff';
    ctx.font = '14px "Microsoft YaHei",sans-serif';
    ctx.fillText(I18N.t('mg_tetris_goal', { t: Math.ceil(this.timeLimit / 1000), n: this.winLines }), px, b.y + 470);
  }
}
