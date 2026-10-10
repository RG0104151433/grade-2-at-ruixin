/* ============================================================================
 * engine/game-tile-shapes.js —— Game 方法组 · 构成件渲染（E2 / AI-05「去方块化」）
 * ----------------------------------------------------------------------------
 * 为什么：[058]/[061] 只解决了材质与纯色，「绘制轮廓 = 碰撞矩形」才是方块感真身。
 * 本模块把可见方块关的绘制从「逐格矩形」换成「构成件」：
 *   ① 成片顶面：只给外露顶边画亮缘条（明度分层），不再整格描边；
 *   ② 成片侧壁：按「行内连通段 + 邻接判据」只画外露左右侧条，整片读作一堵墙；
 *   ③ 支撑结构：悬空段按 route 数据 support（缺省按主题）画桁架/立柱，
 *      「每个悬空面都有可见的结构理由」（§6.3 / §6.5 负面词：无支撑悬空块）；
 *   ④ 六种语义外观（kind → 顶面色/缘/支撑样式）：road|deck|roof|gantry|shelf|bridge，
 *      kind 优先取 route surfaces（按 t 覆盖），生成段按主题缺省；
 *   ⑤ maze(topdown) 走 nav.polygons 墙轮廓成片，不逐格（polygons 由 AI-05 填充）；
 *     [099] maze 已退出登记表（俯视成片曾漏相机转换画错位置），回归原版逐瓦路径。
 * 覆盖与回退（三态）：
 *   - 按图启用：TILE_SHAPE_THEMES 里登记了的地图才生效（逐张切换验收）；
 *   - `game.tileShapes = false`（全局）/ 关卡 `def.tileShapes = false`（单关）；
 *   - 本文件未加载 → drawTiles 的存在性判断自动回退 drawTileArt / drawBox，
 *     碰撞 / 瓦片数据 / 玩家物理零改动。
 * 边界：只画不改——不碰碰撞数组、不改机制、不接正式图（正式图属 AI-21/AI-90B—E）；
 *   渲染层零文字（i18n 约定）；确定性纹理（格坐标哈希），逐帧稳定不闪。
 * 加载：class Game 之后（方法组）；依赖 window.ROUTE_DATA / NAV_DATA（可选，
 *   缺数据时按主题缺省绘制并自动回退）。
 * ==========================================================================*/
'use strict';

/* ------------------------- 主题表（逐张切换的开关） -------------------------
   每关验收通过后才在表内登记；未登记地图自动走旧路径（drawTileArt/drawBox）。 */
const TILE_SHAPE_THEMES = {
  oasis: {
    token: 'OASIS',
    fallbackKind: 'gantry',        // 生成段（oasisParkour）缺省：检修桁架
    groundKind: 'deck',
    supportDefault: 2,             // route 未覆盖的生成段支撑缺省（格）
    palette: {
      base: '#173540', baseLit: '#1d4350', top: '#2f6f68',
      topHi: 'rgba(196,242,230,0.55)', side: '#0f242c',
      sideLit: 'rgba(130,205,195,0.28)', seam: 'rgba(4,14,18,0.35)',
      support: '#4a3b28', supportLit: '#6d5738', shadow: 'rgba(2,10,12,0.45)',
    },
  },
  treasure: {
    token: 'OASIS',
    fallbackKind: 'gantry',
    groundKind: 'deck',
    supportDefault: 2,
    palette: {
      /* 失重舞厅 · 遗失索引场：紫蓝舞池色板（与 bg_lost_index_globe 的霓虹紫同级） */
      base: '#241a4a', baseLit: '#2e2159', top: '#6e50d6',
      topHi: 'rgba(216,198,255,0.55)', side: '#140e2c',
      sideLit: 'rgba(168,142,255,0.28)', seam: 'rgba(10,6,22,0.38)',
      support: '#3a2f5c', supportLit: '#5a4b8c', shadow: 'rgba(6,3,16,0.5)',
    },
  },
  road: {
    token: 'OASIS',
    fallbackKind: 'gantry',   // road 无生成段；fallback 只服务镜像跑道（走 2/3 格整件零件图）
    groundKind: 'road',
    supportDefault: 3,
    palette: {
      base: '#241f31', baseLit: '#2d2740', top: '#584a80',
      topHi: 'rgba(216,200,255,0.45)', side: '#171322',
      sideLit: 'rgba(180,160,230,0.22)', seam: 'rgba(8,5,14,0.4)',
      support: '#332c48', supportLit: '#4c4270', shadow: 'rgba(6,3,12,0.5)',
    },
  },
  library_gate: {
    token: 'ARCHIVE',
    fallbackKind: 'deck',
    groundKind: 'road',
    supportDefault: 2,
    palette: {
      base: '#33281a', baseLit: '#3f3222', top: '#7a5f2e',
      topHi: 'rgba(240,214,150,0.5)', side: '#211910',
      sideLit: 'rgba(220,190,130,0.25)', seam: 'rgba(14,10,4,0.35)',
      support: '#3c3223', supportLit: '#574832', shadow: 'rgba(10,7,2,0.45)',
    },
  },
  /* [099] maze（俯视迷宫）已移出登记表：AI-05 的俯视成片渲染漏了 camera.toScreen
     转换（世界坐标直接当屏幕坐标用），墙体整体画偏、与碰撞完全错位（玩家眼中
     「图形与机制都坏了」）。按用户要求回复原版：迷宫回到逐瓦 drawBox 路径
     （与「oasis-game-draft - 副本」一致），_tsDrawTopdown 的坐标缺陷已修正，
     未来若重新登记将按相机正确对位。 */
};

Object.assign(Game.prototype, {
  /* ------------------------------ 入口 ------------------------------
     drawTiles 在原逐瓦循环之前调用本方法；返回 true = 本帧瓦片已全部由
     构成件路径绘制，逐瓦循环跳过。任何不满足（未登记 / 已关闭 / 缺数据）
     返回 false → 原路径逐瓦渲染，行为与改造前一致。 */
  drawTileShapes(hideFrom) {
    const L = this.level;
    if (!L || !L.allTiles || !L.id) return false;
    if (this.tileShapes === false || L.def.tileShapes === false) return false;
    const theme = TILE_SHAPE_THEMES[L.id];
    if (!theme) return false;
    if (theme.topdown) return this._tsDrawTopdown(theme);
    const shape = [], rest = [];
    for (const t of L.allTiles) {
      /* F5·隐藏地面砖块：hideGroundFromRow 以下的 solid 只保留碰撞不绘制
         （由 drawTiles 计算 hideFrom=def.hideGroundFromRow×tile 传入；
         未传 undefined 时行为与改造前完全一致） */
      if (this._tileHidden ? this._tileHidden(t)
                          : (hideFrom != null && t.type === 'solid' && t.y >= hideFrom)) continue;
      /* 构成件只接管「无特殊身份」的 solid / oneway；其余走原逐瓦路径 */
      const passthrough =
        t.type === 'poison' || t.special === 'minigame' ||
        (t.type === 'oneway' && L.def.ladderStyle) ||
        (t.type === 'solid' && L.def.hideSolids) ||
        t.type === 'spike' || t.type === 'gold' || t.type === 'cyan' ||
        t.type === 'blueSolid' || !!pick(t, 'label');
      (passthrough ? rest : shape).push(t);
    }
    this._tsDrawSegments(shape, theme);
    this._tsPassthrough(rest);
    return true;
  },

  /* --------------------- 行内连通段 → 构成件绘制 --------------------- */
  _tsDrawSegments(tiles, theme) {
    const T = this.tile, L = this.level, ctx = this.ctx, P = theme.palette;
    /* 行 → 列集合（移动平台取实时坐标，逐帧重建，成本 O(瓦片数)） */
    const rows = new Map();
    for (const t of tiles) {
      const r = Math.round(t.y / T);
      const n = Math.max(1, Math.round(t.w / T));
      const c0 = Math.round(t.x / T);
      let m = rows.get(r);
      if (!m) { m = new Map(); rows.set(r, m); }
      for (let i = 0; i < n; i++) m.set(c0 + i, t);
    }
    if (!rows.size) return;
    const hasCell = (r, c) => { const m = rows.get(r); return !!(m && m.has(c)); };
    /* 行内极大连通段（deckBreak 标记的瓦片不与邻段合并：镜像跑道按 2/3 格整件
       分段，每段独立绘制零件图，杜绝整段纯色方块） */
    const runs = [];
    for (const [r, m] of rows) {
      const cols = Array.from(m.keys()).sort((a, b) => a - b);
      let s = cols[0], prev = cols[0], prevT = m.get(cols[0]);
      for (let i = 1; i <= cols.length; i++) {
        const c = cols[i];
        const t = (c != null) ? m.get(c) : null;
        const split = (c !== prev + 1) ||
          (t !== prevT && !!(t && t.deckBreak || prevT && prevT.deckBreak));
        if (split) { runs.push({ row: r, c0: s, c1: prev }); s = c; }
        prev = c; prevT = t;
      }
    }
    runs.sort((a, b) => (a.row - b.row) || (a.c0 - b.c0));
    /* kind 与 support 真值：route surfaces 按「top 行精确匹配 + t 区间重叠」优先
       （全宽地面段 to=1 会与一切重叠，必须先按 top 行过滤），生成段用主题缺省 */
    const route = (typeof window !== 'undefined' && window.ROUTE_DATA) ? ROUTE_DATA[L.id] : null;
    const cols1 = L.cols - 1;
    const kindOf = run => {
      if (route && Array.isArray(route.surfaces)) {
        const t0 = run.c0 / cols1, t1 = run.c1 / cols1;
        const hit = route.surfaces.find(sf => sf.top === run.row && sf.from <= t1 && sf.to >= t0);
        if (hit) return hit;
      }
      return null;
    };
    /* 相机视野（世界 px）；支撑画在段下方，向下多留一屏余量 */
    const vx0 = this.camera.x - this.viewW / 2 - 40, vx1 = this.camera.x + this.viewW / 2 + 40;
    const vy0 = this.camera.y - this.viewH / 2 - 40, vy1 = this.camera.y + this.viewH / 2 + 160;
    for (const run of runs) {
      const wx = run.c0 * T, wy = run.row * T, w = (run.c1 - run.c0 + 1) * T;
      if (wx + w < vx0 || wx > vx1 || wy + T < vy0 || wy > vy1) continue;
      const _o = this.camera.toScreen(wx, wy), x = _o.x, y = _o.y; /* world->screen */
      const sf = kindOf(run);
      const kind = (sf && sf.kind) || (run.row >= (L.rows || 0) - 4 ? theme.groundKind : theme.fallbackKind);
      /* ① 本体：优先用平台零件图（左端头＋中段×N＋右端头，见 game-platform-art.js）。
         图片未加载 / 模块缺失 / 本关未开启 → false，走下方原程序化路径：
         回退外观仍是「成片顶面 + 侧壁 + 支撑」的非方块化结构，绝不回退逐格纯色方块。 */
      const arted = !!(this.drawPlatformDeck && this.drawPlatformDeck(x, y, w, T, run, kind));
      if (!arted) {
        /* ①b 本体：整段平涂（无格边）；行间错位暗缝按 3 格周期（非格对齐） */
        ctx.fillStyle = (run.row % 2) ? P.baseLit : P.base;
        ctx.fillRect(x, y, w, T);
        ctx.fillStyle = P.seam;
        const period = 3 * T, off = x + ((run.row % 2) ? period * 0.5 : period * 0.25);
        for (let sx = off; sx < x + w - 1; sx += period) {
          if (sx > x + 2) ctx.fillRect(sx, y + 4, 1.5, T - 8);
        }
        /* ② 外露顶边：亮缘条（逐列判邻接，得到连续暴露 span） */
        let c = run.c0;
        while (c <= run.c1) {
          if (!hasCell(run.row - 1, c)) {
            let c2 = c;
            while (c2 + 1 <= run.c1 && !hasCell(run.row - 1, c2 + 1)) c2++;
            const sx = x + (c - run.c0) * T, sw = (c2 - c + 1) * T;
            ctx.fillStyle = P.top;
            ctx.fillRect(sx, y, sw, Math.min(7, T * 0.16));
            ctx.fillStyle = P.topHi;
            ctx.fillRect(sx, y, sw, 1.5);
            c = c2 + 1;
          } else c++;
        }
        /* ③ 外露左右侧条（邻接判据：同行相邻格不存在） */
        if (!hasCell(run.row, run.c0 - 1)) {
          ctx.fillStyle = P.side;
          ctx.fillRect(x, y, Math.min(4, T * 0.09), T);
          ctx.fillStyle = P.sideLit;
          ctx.fillRect(x, y, 1.2, T);
        }
        if (!hasCell(run.row, run.c1 + 1)) {
          ctx.fillStyle = P.side;
          ctx.fillRect(x + w - Math.min(4, T * 0.09), y, Math.min(4, T * 0.09), T);
        }
      }
      /* ④ 底缘（悬空段的外露底边压暗，读出厚度） */
      let bottomFree = true;
      for (let cc = run.c0; cc <= run.c1; cc++) if (hasCell(run.row + 1, cc)) { bottomFree = false; break; }
      if (bottomFree) {
        ctx.fillStyle = P.shadow;
        ctx.fillRect(x, y + T - 3, w, 3);
        /* ⑤ 支撑结构：route.support（格）优先，缺省按主题；视觉件，不进碰撞。
           绘制异常静默吞掉（该段缺支撑装饰），绝不打断整帧渲染。 */
        const supCells = (sf && typeof sf.support === 'number' && sf.support > 0)
          ? sf.support : theme.supportDefault;
        if (supCells > 0 && run.row + 1 + supCells < (L.rows || 0) + 8) {
          try { this._tsDrawSupport(x, y + T, w, Math.min(supCells, 6) * T, kind, theme); }
          catch (e) { /* 支撑绘制失败 → 该段无支撑装饰，其余照常 */ }
        }
      }
    }
  },

  /* 支撑样式：gantry/bridge → 桁架（斜撑 + 上下弦）；deck/roof/shelf/road → 双立柱 */
  _tsDrawSupport(x, y, w, h, kind, theme) {
    const ctx = this.ctx, P = theme.palette;
    /* 顶部桁架带优先用零件图（game-platform-art.js），返回其占用高度；
       取不到图时 bandH=0，整段走程序化结构，绝不画方块。 */
    let bandH = 0;
    if (this.drawPlatformSupport) {
      try { bandH = this.drawPlatformSupport(x, y, w, h, kind) || 0; }
      catch (e) { bandH = 0; }
    }
    const yy = y + bandH, hh = h - bandH;
    if (hh < 5) return;
    const truss = (kind === 'gantry' || kind === 'bridge');
    ctx.save();
    ctx.fillStyle = P.support;
    if (truss) {
      /* 上下弦 + 两端立柱 + 交叉斜撑 */
      const legW = 4;
      ctx.fillRect(x + 2, yy, legW, hh);
      ctx.fillRect(x + w - 2 - legW, yy, legW, hh);
      ctx.fillRect(x, yy, w, 2.5);
      ctx.strokeStyle = P.supportLit;
      ctx.lineWidth = 1.5;
      const n = Math.max(1, Math.round(w / (this.tile * 1.5)));
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x0 = x + (w * i) / n, x1 = x + (w * (i + 1)) / n;
        ctx.moveTo(x0, yy + 2.5); ctx.lineTo(x1, yy + hh - 1);
        ctx.moveTo(x1, yy + 2.5); ctx.lineTo(x0, yy + hh - 1);
      }
      ctx.stroke();
    } else {
      /* 双立柱 + 柱头，柱身留 1px 亮缘 */
      const legW = Math.max(5, w * 0.06);
      ctx.fillRect(x + w * 0.14, yy, legW, hh);
      ctx.fillRect(x + w * 0.86 - legW, yy, legW, hh);
      ctx.fillStyle = P.supportLit;
      ctx.fillRect(x + w * 0.14, yy, 1.2, hh);
      ctx.fillRect(x + w * 0.86 - legW, yy, 1.2, hh);
      ctx.fillStyle = P.support;
      ctx.fillRect(x + w * 0.14 - 2, yy, legW + 4, 3);
      ctx.fillRect(x + w * 0.86 - legW - 2, yy, legW + 4, 3);
    }
    ctx.restore();
  },

  /* ------------- 余下瓦片：与 game-render-tiles 逐瓦路径同序 ------------- */
  _tsPassthrough(rest) {
    const ctx = this.ctx, L = this.level;
    for (const t of rest) {
      if (this._tileHidden && this._tileHidden(t)) continue;
      const p = this.camera.toScreen(t.x, t.y);
      if (p.x + t.w < -40 || p.x > this.viewW + 40 || p.y + t.h < -40 || p.y > this.viewH + 40) continue;
      if (t.type === 'poison') {
        if (!(this.drawPoisonArt && this.drawPoisonArt(p.x, p.y, t.w, t.h, t.color))) {
          this.drawPoison(p.x, p.y, t.w, t.h, t.color);
        }
        continue;
      }
      if (t.special === 'minigame') { this.drawMinigameBlock(p.x, p.y, t.w, t.h); continue; }
      if (t.type === 'oneway' && L.def.ladderStyle) { this.drawLadder(p.x, p.y, t.w, t.h); continue; }
      if (this.drawTileArt && !pick(t, 'label') && this.drawTileArt(p.x, p.y, t.w, t.h, t)) continue;
      this.drawBox(p.x, p.y, t.w, t.h, t.color, pick(t, 'label'), t.type === 'spike');
    }
  },

  /* ------------- maze(topdown)：nav.polygons 墙轮廓成片 -------------
     [099] 修正：原实现把世界坐标当屏幕坐标直接 fillRect（漏 camera.toScreen），
     墙体整体画偏、与碰撞错位 —— 本函数已按相机对位修正；maze 当前未登记进
     TILE_SHAPE_THEMES（回复原版逐瓦路径），此处仅供未来重新启用时使用。 */
  _tsDrawTopdown(theme) {
    const L = this.level, ctx = this.ctx, T = this.tile, P = theme.palette;
    const nav = (typeof window !== 'undefined' && window.NAV_DATA && L.def.navigation)
      ? NAV_DATA[L.def.navigation] : null;
    const polys = nav && Array.isArray(nav.polygons) ? nav.polygons : null;
    if (!polys || !polys.length) return false;      // 缺轮廓 → 逐瓦回退
    /* 世界→屏幕平移量（相机无缩放，屏幕格宽 = T 不变） */
    const _o = this.camera.toScreen(0, 0), ox = _o.x, oy = _o.y;
    const vx0 = this.camera.x - this.viewW / 2 - T, vx1 = this.camera.x + this.viewW / 2 + T;
    const vy0 = this.camera.y - this.viewH / 2 - T, vy1 = this.camera.y + this.viewH / 2 + T;
    for (const pl of polys) {
      const wx = pl.col * T, wy = pl.row * T, w = pl.w * T, h = pl.h * T;
      if (wx + w < vx0 || wx > vx1 || wy + h < vy0 || wy > vy1) continue;
      const x = wx + ox, y = wy + oy;               // 世界 → 屏幕
      /* 本体平涂（行列错位微差）+ 面向走廊一侧的受光缘：
         上/左外露边画亮缘（顶光假设），底/右压暗，读作「体块」而非格阵 */
      ctx.fillStyle = ((pl.col + pl.row) % 2) ? P.baseLit : P.base;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = P.seam;
      ctx.fillRect(x, y, w, 1.2);
      ctx.fillRect(x, y, 1.2, h);
      /* 外露顶边（上方不是墙）→ 亮缘；用格子邻接而非多边形并集（够用且稳） */
      const isWall = (c, r) => polys.some(q => r >= q.row && r < q.row + q.h &&
        c >= q.col && c < q.col + q.w);
      for (let c = pl.col; c < pl.col + pl.w; c++) {
        if (!isWall(c, pl.row - 1)) {
          ctx.fillStyle = P.top;
          ctx.fillRect(c * T + ox, y, T, Math.min(5, T * 0.3));
          ctx.fillStyle = P.topHi;
          ctx.fillRect(c * T + ox, y, T, 1.2);
        }
        if (!isWall(c, pl.row + pl.h)) {
          ctx.fillStyle = P.edge;
          ctx.fillRect(c * T + ox, y + h - 2, T, 2);
        }
      }
      for (let r = pl.row; r < pl.row + pl.h; r++) {
        if (!isWall(pl.col - 1, r)) {
          ctx.fillStyle = P.topHi;
          ctx.fillRect(x, r * T + oy, 1.2, T);
        }
        if (!isWall(pl.col + pl.w, r)) {
          ctx.fillStyle = P.edge;
          ctx.fillRect(x + w - 1.5, r * T + oy, 1.5, T);
        }
      }
    }
    return true;
  },
});
