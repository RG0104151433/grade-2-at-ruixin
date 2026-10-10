/* ============================================================================
 * engine/minigame-minesweeper.js —— 小游戏 · 扫雷
 * ----------------------------------------------------------------------------
 * 过程之钥的扫雷挑战：布雷（首点安全）、翻开、三态标记、鼠标与键盘双操作。
 * 依赖：core.js 的 clamp、normKey。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 1429-1657 行）。方法体未作任何改动；
 * 整段搬运，未作任何改动。
 * ==========================================================================*/
'use strict';
/* ------------------------------- 扫雷小游戏 -------------------------------- */
/* ------------------------------ 扫雷界面配色 -------------------------------
   可读性优先：整体提亮，未翻开 = 亮蓝凸起方格（上/左高光、下/右阴影），
   已翻开 = 浅底深字，标记 = 琥珀色 + 深色旗标。
   三种状态彼此反差明显，不再出现「一片黑、看不清哪些已翻开」。 */
const MS_UI = {
  bgTop: '#132445',            // 背景渐变：上
  bgBottom: '#070d1c',         // 背景渐变：下
  grid: 'rgba(96,168,240,0.10)',
  panel: 'rgba(12,26,50,0.90)',// 顶栏 / 状态栏底板
  panelEdge: '#3b7ec4',
  accent: '#39c6ff',           // 底板左侧强调条
  frame: '#39c6ff',            // 棋盘外框
  frameGlow: 'rgba(57,198,255,0.30)',
  boardBack: 'rgba(6,14,30,0.92)',
  covered: '#2f5590',          // 未翻开
  coveredB: '#345f9e',         // 未翻开（交错色，帮助辨认格子边界）
  coveredHi: 'rgba(198,229,255,0.55)',
  coveredLo: 'rgba(3,10,24,0.70)',
  coveredEdge: 'rgba(160,212,255,0.40)',
  openA: '#eaf1fa',            // 已翻开（浅底）
  openB: '#dbe6f4',
  openEdge: '#a9bed6',
  mine: '#f3c6cc',             // 失败后被揭示的雷：浅底 + 小小一枚深红雷点，不制造噪点
  mineDot: '#8e1b1b',
  mineBoom: '#ff8a80',         // 踩中的雷
  mineEdge: '#c62828',         // 踩中雷的边框
  mineBoomGlyph: '#6d1010',    // 踩中雷的图标
  flag: '#ffd76a',             // 已标记
  flagGlyph: '#7a3b00',
  ask: '#9fd8ff',              // 问号标记
  askGlyph: '#0d3f66',
  cursor: '#ffe082',           // 键盘光标
  title: '#7df9ff',
  help: '#c2d6f2',
  mines: '#ffd54f',
  goal: '#7cffb2',
  // 数字在浅底上用高饱和深色（1→8 依次区分，对比度均 >= 5.8:1）
  number: ['', '#0d47a1', '#0f6b2b', '#a5251a', '#5b1585', '#8a4a00', '#00606b', '#1b2a33', '#4a5b6b'],
};

class Minesweeper {
  constructor(engine, opts) {
    opts = opts || {};
    this.engine = engine;
    this.ctx = engine.ctx;
    this.rows = opts.rows || 10;
    this.cols = opts.cols || 10;
    this.mines = opts.mines || 15;
    this.cell = 42;
    this.grid = [];
    this.over = false;
    this.won = false;
    this.first = true;
    this.cursorR = 0; this.cursorC = 0;
    this._done = false;
    this.reset();
  }
  reset() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) row.push({ mine: false, revealed: false, mark: 0, adj: 0 });
      this.grid.push(row);
    }
    this.over = false; this.won = false; this.first = true;
    this.cursorR = 0; this.cursorC = 0;
  }
  inBounds(r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; }
  boardPos() {
    const bw = this.cols * this.cell, bh = this.rows * this.cell;
    return { x: Math.floor((this.engine.viewW - bw) / 2), y: Math.floor((this.engine.viewH - bh) / 2) - 14, w: bw, h: bh };
  }
  placeMines(safeR, safeC) {
    let placed = 0;
    let guard = 0;
    // 第一遍：尽量避开首次点击位置及其周围 3x3 安全区，保证第一步永远安全。
    while (placed < this.mines && guard++ < 1000) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if (this.grid[r][c].mine) continue;
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      this.grid[r][c].mine = true;
      placed++;
    }
    // 兜底：极小棋盘等极端情况下若仍未布满，则避开首次点击的格子补齐，避免雷数不一致。
    for (let r = 0; r < this.rows && placed < this.mines; r++) {
      for (let c = 0; c < this.cols && placed < this.mines; c++) {
        if (r === safeR && c === safeC) continue;
        if (this.grid[r][c].mine) continue;
        this.grid[r][c].mine = true;
        placed++;
      }
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c].mine) continue;
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (this.inBounds(nr, nc) && this.grid[nr][nc].mine) n++;
        }
        this.grid[r][c].adj = n;
      }
    }
  }
  reveal(r, c) {
    if (!this.inBounds(r, c) || this.over) return;
    const cell = this.grid[r][c];
    if (cell.revealed || cell.mark !== 0) return;
    if (this.first) {
      this.first = false;
      this.placeMines(r, c);
    }
    if (cell.mine) { cell.revealed = true; this.over = true; this.won = false; if (window.Audio2 && Audio2.explode) Audio2.explode(); this.engine.shake(8); return; }
    if (window.Audio2 && Audio2.reveal) Audio2.reveal(cell.adj);
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      const cur = this.grid[cr][cc];
      if (cur.revealed || cur.mark !== 0) continue;
      cur.revealed = true;
      if (cur.adj === 0) {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = cr + dr, nc = cc + dc;
          if (this.inBounds(nr, nc) && !this.grid[nr][nc].revealed && this.grid[nr][nc].mark === 0) stack.push([nr, nc]);
        }
      }
    }
    this.checkWin();
  }
  cycleMark(r, c) {
    if (!this.inBounds(r, c) || this.over) return;
    const cell = this.grid[r][c];
    if (cell.revealed) return;
    cell.mark = (cell.mark + 1) % 3;
    if (window.Audio2 && Audio2.flag) Audio2.flag();
  }
  checkWin() {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (!this.grid[r][c].mine && !this.grid[r][c].revealed) return;
    }
    this.over = true; this.won = true;
  }
  _bindInput() {
    this._onKey = e => {
      const k = normKey(e.key);
      if (k === 'Escape') { this.togglePause(); return; }
      if (this.paused) return;
      if (k === 'ArrowUp' || k === 'w') { e.preventDefault(); this.cursorR = Math.max(0, this.cursorR - 1); }
      else if (k === 'ArrowDown' || k === 's') { e.preventDefault(); this.cursorR = Math.min(this.rows - 1, this.cursorR + 1); }
      else if (k === 'ArrowLeft' || k === 'a') { e.preventDefault(); this.cursorC = Math.max(0, this.cursorC - 1); }
      else if (k === 'ArrowRight' || k === 'd') { e.preventDefault(); this.cursorC = Math.min(this.cols - 1, this.cursorC + 1); }
      else if (k === ' ' || k === 'Enter') { e.preventDefault(); this.reveal(this.cursorR, this.cursorC); }
      else if (k === 'f') { e.preventDefault(); this.cycleMark(this.cursorR, this.cursorC); }
    };
    this._cellAt = (clientX, clientY) => {
      const rect = this.engine.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return { r: -1, c: -1 };
      const mx = (clientX - rect.left) * (this.engine.viewW / rect.width);
      const my = (clientY - rect.top) * (this.engine.viewH / rect.height);
      const b = this.boardPos();
      const c = Math.floor((mx - b.x) / this.cell);
      const r = Math.floor((my - b.y) / this.cell);
      return { r, c };
    };
    this._onMouse = e => {
      if (this.paused) return;
      if (e.type === 'contextmenu') {
        e.preventDefault();
        const { r, c } = this._cellAt(e.clientX, e.clientY);
        if (!this.inBounds(r, c)) return;
        this.cursorR = r; this.cursorC = c;
        this.cycleMark(r, c);
        return;
      }
      // 仅左键翻开；右键交给 contextmenu 做三态标记循环。
      if (e.button !== 0) return;
      const { r, c } = this._cellAt(e.clientX, e.clientY);
      if (!this.inBounds(r, c)) return;
      this.cursorR = r; this.cursorC = c;
      this.reveal(r, c);
    };
    document.addEventListener('keydown', this._onKey);
    this.engine.canvas.addEventListener('mousedown', this._onMouse);
    this.engine.canvas.addEventListener('contextmenu', this._onMouse);
  }
  _unbindInput() {
    document.removeEventListener('keydown', this._onKey);
    this.engine.canvas.removeEventListener('mousedown', this._onMouse);
    this.engine.canvas.removeEventListener('contextmenu', this._onMouse);
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
    if (this.won && window.Audio2 && Audio2.success) Audio2.success();
    if (this._resolve) this._resolve(this.won);
  }
  loop() {
    this._loop = requestAnimationFrame(this.loop.bind(this));
    this.draw();
    if (this.over) this._finish();
  }
  /* 顶栏 / 状态栏底板：带边框与左侧强调条，保证文字在任何画面上都清晰 */
  drawPanel(x, y, w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = MS_UI.panel;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = MS_UI.panelEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = MS_UI.accent;
    ctx.fillRect(x, y, 6, h);
  }
  /* 单个格子：未翻开＝凸起亮块，已翻开＝浅底深字，再叠加数字 / 雷 / 标记 */
  drawCell(cell, r, c, b, showMine) {
    const ctx = this.ctx;
    const s = this.cell - 2;
    const px = b.x + c * this.cell + 1, py = b.y + r * this.cell + 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (!cell.revealed) {
      // 底色：普通未翻开＝亮蓝（交错两色）；已标记＝琥珀；问号＝浅蓝；失败后揭示的雷＝浅红
      let base = (r + c) % 2 === 0 ? MS_UI.covered : MS_UI.coveredB;
      if (cell.mark === 1) base = MS_UI.flag;
      else if (cell.mark === 2) base = MS_UI.ask;
      else if (showMine) base = MS_UI.mine;
      ctx.fillStyle = base;
      ctx.fillRect(px, py, s, s);
      // 凸起：上/左高光、下/右阴影——一眼区分「没翻开」
      ctx.fillStyle = MS_UI.coveredHi;
      ctx.fillRect(px, py, s, 3);
      ctx.fillRect(px, py, 3, s);
      ctx.fillStyle = MS_UI.coveredLo;
      ctx.fillRect(px, py + s - 3, s, 3);
      ctx.fillRect(px + s - 3, py, 3, s);
      ctx.strokeStyle = MS_UI.coveredEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
      if (cell.mark === 1) {
        ctx.fillStyle = MS_UI.flagGlyph; ctx.font = 'bold 21px sans-serif';
        ctx.fillText('⚑', px + s / 2, py + s / 2 + 1);
      } else if (cell.mark === 2) {
        ctx.fillStyle = MS_UI.askGlyph; ctx.font = 'bold 21px sans-serif';
        ctx.fillText('?', px + s / 2, py + s / 2 + 1);
      } else if (showMine) {
        // 只有一小枚雷点：看得见雷在哪，又不至于让整屏变成噪点
        ctx.beginPath();
        ctx.arc(px + s / 2, py + s / 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = MS_UI.mineDot;
        ctx.fill();
      }
    } else {
      // 已翻开：浅底 + 细边，数字/雷在浅底上高对比
      ctx.fillStyle = cell.mine ? MS_UI.mineBoom : ((r + c) % 2 === 0 ? MS_UI.openA : MS_UI.openB);
      ctx.fillRect(px, py, s, s);
      ctx.strokeStyle = cell.mine ? MS_UI.mineEdge : MS_UI.openEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
      if (cell.mine) {
        ctx.fillStyle = MS_UI.mineBoomGlyph; ctx.font = 'bold 23px sans-serif';
        ctx.fillText('✸', px + s / 2, py + s / 2 + 1);
      } else if (cell.adj > 0) {
        ctx.fillStyle = MS_UI.number[cell.adj] || '#263238';
        ctx.font = 'bold 23px "Microsoft YaHei",sans-serif';
        ctx.fillText(String(cell.adj), px + s / 2, py + s / 2 + 1);
      }
    }
    // 键盘光标画在最上层，边框加粗以突出当前位置
    if (r === this.cursorR && c === this.cursorC && !this.over) {
      ctx.strokeStyle = MS_UI.cursor; ctx.lineWidth = 3;
      ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);
    }
  }
  draw() {
    const ctx = this.ctx;
    const W = this.engine.viewW, H = this.engine.viewH;
    // 背景：深蓝渐变 + 稀疏数据网格；不再是整屏纯黑，格子和背景不会再糊在一起
    if (!this._bgGrad || this._bgW !== W || this._bgH !== H) {
      this._bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      this._bgGrad.addColorStop(0, MS_UI.bgTop);
      this._bgGrad.addColorStop(1, MS_UI.bgBottom);
      this._bgW = W; this._bgH = H;
    }
    ctx.fillStyle = this._bgGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = MS_UI.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 48) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }

    const b = this.boardPos();
    // 顶栏：标题 + 操作说明（左）／目标（右），底板保证文字始终可读
    this.drawPanel(36, 20, W - 72, 76);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = MS_UI.title; ctx.font = 'bold 26px "Microsoft YaHei",sans-serif';
    ctx.fillText(I18N.t('mg_ms_title'), 58, 30);
    ctx.fillStyle = MS_UI.help; ctx.font = '15px "Microsoft YaHei",sans-serif';
    ctx.fillText(I18N.t('mg_ms_help'), 58, 68);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = MS_UI.goal; ctx.font = '16px "Microsoft YaHei",sans-serif';
    ctx.fillText(I18N.t('mg_ms_goal'), W - 58, 47);

    // 棋盘：深底 + 发光外框，与背景明确分层
    ctx.fillStyle = MS_UI.boardBack;
    ctx.fillRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20);
    ctx.strokeStyle = MS_UI.frameGlow; ctx.lineWidth = 6;
    ctx.strokeRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20);
    ctx.strokeStyle = MS_UI.frame; ctx.lineWidth = 2;
    ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12);

    // 失败后把未翻开的雷一并揭示：玩家能看清自己踩在哪、其余雷分布如何
    const showMines = this.over && !this.won;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) this.drawCell(this.grid[r][c], r, c, b, showMines);
    }

    // 状态栏：雷数与已标记数（等宽底板 + 强调条，不再贴在黑底上）
    let flags = 0;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.grid[r][c].mark === 1) flags++;
    const sy = b.y + b.h + 14, sh = 42;
    this.drawPanel(b.x, sy, b.w, sh);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = MS_UI.mines; ctx.font = 'bold 18px "Microsoft YaHei",sans-serif';
    ctx.fillText(I18N.t('mg_ms_mines', { n: this.mines, f: flags }), b.x + 20, sy + sh / 2 + 1);
    ctx.textAlign = 'right';
    ctx.fillStyle = MS_UI.goal; ctx.font = 'bold 18px "Microsoft YaHei",sans-serif';
    ctx.fillText(flags + ' / ' + this.mines, b.x + b.w - 18, sy + sh / 2 + 1);
  }
}

