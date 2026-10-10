/* ============================================================================
 * engine/game-platform-art.js —— 悬空平台「零件图」外观（E2 / AI-05 续 · 去方块化）
 * ----------------------------------------------------------------------------
 * 把 game-tile-shapes.js 里「成片平涂」的悬空平台，换成真实零件图拼装：
 *      左端头  ＋  中段 × N（按平台长度重复）  ＋  右端头
 *      板底再接一条桁架带，下面交回程序化立柱/斜撑
 * 图集：image/platform_tileset_oasis_2048x1024.png
 *   2 行 × 4 列，每格 512×512，透明背景；顶面固定在格内 y=200，路面板厚 72px。
 *   行0：左端头 / 标准中段 / 破损中段 / 右端头
 *   行1：桁架   / 立柱     / 吊索     / 护栏
 * 拼接规则（与图集设计一致）：
 *   - 端头只画一次，取零件最外缘（含断裂断面），左右端各一；
 *   - 中段按 1.2 格为周期重复，接缝周期 ≠ 游戏格宽 48px，读不出格子感；
 *   - 源窗口宽高比 = 目标宽高比 ⇒ 等比缩放，图像不拉伸变形；
 *   - 顶面 = 瓦片顶边，玩家脚底与图顶面重合（误差 0px）。
 * 三态回退：模块未加载 / game.platformArt===false / 关卡 def.platformArt===false /
 *   图片没加载好 → 返回 false，由 game-tile-shapes.js 走原有非方块化结构绘制；
 *   任何情况下都不会回退成逐格纯色方块。
 * 边界：只画不改 —— 不碰碰撞数组、玩家物理、危险判定、检查点、出口、存档。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  var SHEET_SRC = 'image/platform_tileset_oasis_2048x1024.png';
  /* F6：OASIS 固定主路线改用四张完整零件，而不是把端头/中段反复拼接。
     2/3 格在逻辑画布中分别是 96/144px；图片保持高分辨率源文件，由 canvas
     一次缩放到碰撞段宽度。选择只取 run 坐标哈希，读档/重进不闪变。 */
  var EXACT_SRC = {
    road2: 'image/platform_oasis_road_2.png',
    road3: 'image/platform_oasis_road_3.png',
    gantry2: 'image/platform_oasis_gantry_2.png',
    gantry3: 'image/platform_oasis_gantry_3.png'
  };
  var CELL = 512, SURFACE_Y = 200, DECK_H = 72;
  var P_LEFT = [0, 0], P_MID = [1, 0], P_MID_BROKEN = [2, 0], P_RIGHT = [3, 0];
  var P_TRUSS = [0, 1], P_TRUSS_Y = 219, P_TRUSS_H = 74;

  /* 图片只加载一次并缓存：连续重进 OASIS 不会重复加载 */
  var S = { img: null, ok: false, tried: false };
  var E = {};

  function exact(key) {
    var e = E[key];
    if (!e) e = E[key] = { img: null, ok: false, tried: false };
    if (!e.tried) {
      e.tried = true;
      var im = new Image();
      im.onload = function () { if (im.naturalWidth > 0) { e.img = im; e.ok = true; } };
      im.onerror = function () {
        e.ok = false;
        console.warn('[platform-art] 完整平台零件无法加载：' + EXACT_SRC[key] +
          ' —— 已回退为原零件图/程序化结构（碰撞不受影响）');
      };
      im.src = EXACT_SRC[key];
    }
    return e.ok ? e.img : null;
  }

  function ensure() {
    if (S.ok) return true;
    if (!S.tried) {
      S.tried = true;
      var im = new Image();
      im.onload = function () { if (im.naturalWidth > 0) { S.img = im; S.ok = true; } };
      im.onerror = function () {
        S.ok = false;
        console.warn('[platform-art] 平台零件图缺失或无法加载：' + SHEET_SRC +
          ' —— 已回退为程序化结构绘制（碰撞与玩法不受影响）');
      };
      im.src = SHEET_SRC;
    }
    return S.ok;
  }

  Object.assign(Game.prototype, {
    /* 本关是否启用零件图外观（默认只在 oasis 生效，可用 def.platformArt 覆盖） */
    _paOn() {
      var L = this.level;
      if (!L || !L.def) return false;
      if (this.platformArt === false) return false;
      if (L.def.platformArt === false) return false;
      return (L.def.platformArt === true) || L.id === 'oasis';
    },

    /* 平台本体：左端头 + 中段×N + 右端头。返回 true = 本段已由零件图绘制 */
    drawPlatformDeck(x, y, w, h, run, kind) {
      if (!this._paOn()) return false;
      if (kind === 'deck' || kind === 'road') return false;   // 整行地面不套零件图
      if (!(w > 6) || !(h > 6)) return false;
      var ctx = this.ctx, T = this.tile;

      /* 新主路线只使用 2/3 格整件。道路残片与数据桁架按位置稳定交错；
         一张图覆盖整段，不存在中段重复接缝。 */
      var cells = Math.round(w / T);
      if ((cells === 2 || cells === 3) && Math.abs(w - cells * T) < 1) {
        var family = ((run.row * 37 + run.c0 * 13) & 1) ? 'road' : 'gantry';
        var im = exact(family + cells);
        if (im) {
          ctx.drawImage(im, x, y, w, h);
          this._paLastExact = { x: x, y: y + h, w: w };
          return true;
        }
      }

      if (!ensure()) return false;
      var img = S.img;

      /* 端头占 1.2 格；中段按 1.2 格为周期重复 */
      var capW = Math.min(1.2 * T, w * 0.36);
      var midW = w - capW * 2;
      if (midW < 0.35 * T) {
        capW = Math.max(0.8 * T, (w - 0.35 * T) / 2);
        midW = w - capW * 2;
      }
      var n = Math.max(1, Math.round(midW / (1.2 * T)));
      var segW = midW / n;

      /* 源窗口宽 = 源高 × 目标宽高比 ⇒ 等比缩放，图像不拉伸 */
      var srcCap = DECK_H * (capW / h);
      var srcMid = DECK_H * (segW / h);
      var midPart = (run.row % 2) ? P_MID_BROKEN : P_MID;

      var blit = function (p, sx, sw, dx, dw) {
        ctx.drawImage(img, p[0] * CELL + sx, p[1] * CELL + SURFACE_Y, sw, DECK_H,
          dx, y, dw, h);
      };
      blit(P_LEFT, 0, srcCap, x, capW);                              /* 左端头：断裂断面 */
      var midX0 = (CELL - srcMid) * 0.5;
      for (var i = 0; i < n; i++) {
        blit(midPart, midX0, srcMid, x + capW + i * segW, segW);     /* 中段重复 */
      }
      blit(P_RIGHT, CELL - srcCap, srcCap, x + w - capW, capW);      /* 右端头：断裂断面 */
      return true;
    },

    /* 支撑顶部桁架带（零件图 row1 col0），返回它占用的高度；0 = 未使用图片 */
    drawPlatformSupport(x, y, w, h, kind) {
      if (!this._paOn()) return 0;
      if (!(w > 6) || !(h > 6)) return 0;
      /* 完整零件自身已包含下部结构；吞掉这一段额外程序支撑，避免双重桁架。 */
      var q = this._paLastExact;
      if (q && Math.abs(q.x - x) < 1 && Math.abs(q.y - y) < 1 && Math.abs(q.w - w) < 1) {
        this._paLastExact = null;
        return h;
      }
      if (!ensure()) return 0;
      var img = S.img, ctx = this.ctx;
      var bh = Math.min(h, Math.max(0.7 * this.tile, 24));
      var scale = bh / P_TRUSS_H;
      var tw = CELL * scale;                     /* 等比缩放后的桁架单元宽 */
      var n = Math.max(1, Math.ceil(w / tw));
      ctx.save();
      for (var i = 0; i < n; i++) {
        var dx = x + i * tw;
        var dw = Math.min(tw, x + w - dx);
        if (dw <= 0.5) break;
        ctx.drawImage(img, P_TRUSS[0] * CELL, P_TRUSS[1] * CELL + P_TRUSS_Y,
          dw / scale, P_TRUSS_H, dx, y, dw, bh);
      }
      ctx.restore();
      return bh;
    }
  });
})();
