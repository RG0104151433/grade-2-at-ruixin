/* ============================================================================
 * engine/game-archive-frame-art.js —— 记忆档案井「黄铜攀爬架」外观 + 档案调查点标记
 * ----------------------------------------------------------------------------
 * 把 library 关程序生成的实体攀爬架（Level.addGeneratedFrame 产出的
 * special:'archive_frame' 瓦片）画成真实素材拼装：
 *       archive_frame_1/2/3.png  分别对应 1 / 2 / 3 格宽的单件；
 *       4 格 = 2+2，5 格 = 3+2（左右拼接，顶面连续）。
 * 素材为透明 PNG，裁剪框按 alpha>40 的实测对象范围给出（见 STORY_CONFIG.meta
 *   .archiveFrames.crop）。单件按「裁剪宽 → 目标格宽」等比缩放，顶边严格对齐
 *   碰撞顶面；同平台多件用同一高度（取较高件），保证顶面与底面都连续。
 * 接缝：相邻两件之间只画一条黄铜机械连接板（覆盖两侧端头），不出现黑缝、
 *   上下错位或重复端头。
 * 回退（三态）：模块未加载 / 图片没加载好 → 返回 false，由本文件的程序化
 *   黄铜实体架兜底绘制；绝不回退成普通棕色梯子或纯色方块。
 * 边界：只画不改——不碰碰撞数组、玩家物理、危险判定、检查点、出口、存档。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  var DEFAULT_META = {
    src: [
      'image/archive_frame_1.png',
      'image/archive_frame_2.png',
      'image/archive_frame_3.png',
    ],
    // [sx, sy, sw, sh]（alpha>40 实测对象框）
    crop: [
      [86, 343, 852, 341],
      [144, 174, 1245, 467],
      [220, 58, 1862, 652],
    ],
  };

  /* 图片只加载一次并缓存：连续重进档案井不会重复加载 */
  var SHEETS = [{}, {}, {}];   // index 0..2 → { img, ok }
  var tried = [false, false, false];

  function meta() {
    var m = (typeof window !== 'undefined' && window.STORY_CONFIG &&
      STORY_CONFIG.meta && STORY_CONFIG.meta.archiveFrames);
    return (m && m.src && m.crop) ? m : DEFAULT_META;
  }

  function ensure(len) {
    var i = len - 1;
    if (i < 0 || i > 2) return null;
    var rec = SHEETS[i];
    if (rec.ok) return rec;
    if (!tried[i]) {
      tried[i] = true;
      var m = meta();
      var im = new Image();
      im.onload = function () { if (im.naturalWidth > 0) { rec.img = im; rec.ok = true; } };
      im.onerror = function () {
        rec.ok = false;
        console.warn('[archive-frame] 素材缺失或无法加载：' + m.src[i] +
          ' —— 已回退为程序绘制的黄铜实体架（碰撞与玩法不受影响）');
      };
      im.src = m.src[i];
    }
    return rec.ok ? rec : null;
  }

  /* 单件高度（像素）：由裁剪框宽高比 × 目标格宽换算（与碰撞高度同一公式） */
  function heightFor(len, T) {
    var m = meta();
    var c = m.crop[len - 1] || m.crop[0];
    return Math.max(8, Math.round(len * T * (c[3] / c[2])));
  }

  /* 程序化黄铜实体架（素材不可用时的兜底，仍为实体观感） */
  function drawBrass(ctx, x, y, w, h, len) {
    var deckH = Math.min(Math.max(h * 0.42, 8), 20);
    // 主体：暗金属
    ctx.fillStyle = '#4a4a52';
    ctx.fillRect(x, y, w, h);
    // 木面踏台
    var g = ctx.createLinearGradient(0, y, 0, y + deckH);
    g.addColorStop(0, '#8a5a2c');
    g.addColorStop(1, '#5a3717');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, deckH);
    // 金色顶梁
    ctx.fillStyle = '#e8b24a';
    ctx.fillRect(x, y, w, Math.max(3, deckH * 0.22));
    ctx.fillStyle = 'rgba(255,232,160,0.7)';
    ctx.fillRect(x, y, w, 1.2);
    // 两端黄铜端头
    var cap = Math.min(7, Math.max(4, w * 0.12));
    ctx.fillStyle = '#c9922f';
    ctx.fillRect(x, y, cap, h);
    ctx.fillRect(x + w - cap, y, cap, h);
    // 每格 X 斜撑
    var cell = w / Math.max(1, len);
    ctx.strokeStyle = 'rgba(232,178,74,0.9)';
    ctx.lineWidth = Math.max(1.2, Math.min(2.4, cell * 0.08));
    var by0 = y + deckH + 2, by1 = y + h - 4;
    for (var i = 0; i < len; i++) {
      var x0 = x + i * cell, x1 = x0 + cell;
      ctx.beginPath();
      ctx.moveTo(x0 + 3, by0); ctx.lineTo(x1 - 3, by1);
      ctx.moveTo(x1 - 3, by0); ctx.lineTo(x0 + 3, by1);
      ctx.stroke();
    }
    // 青色指示灯
    ctx.fillStyle = '#3ff0d0';
    ctx.fillRect(x + w * 0.16, y + h - 6, 5, 3);
    ctx.fillRect(x + w * 0.84 - 5, y + h - 6, 5, 3);
    // 外框
    ctx.strokeStyle = 'rgba(24,12,4,0.85)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  }

  /* 黄铜机械连接板：盖住相邻两件的端头，读作合理连接点 */
  function drawJoint(ctx, cx, y, h) {
    var jw = Math.min(14, Math.max(8, h * 0.3));
    var x = cx - jw / 2;
    ctx.save();
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#f0c869');
    g.addColorStop(0.5, '#c9922f');
    g.addColorStop(1, '#8a5c18');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, jw, h);
    ctx.strokeStyle = 'rgba(40,20,4,0.85)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 0.6, y + 0.6, jw - 1.2, h - 1.2);
    // 铆钉
    ctx.fillStyle = 'rgba(60,34,8,0.9)';
    ctx.beginPath(); ctx.arc(cx, y + h * 0.28, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, y + h * 0.72, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  Object.assign(Game.prototype, {
    /* 实体攀爬架瓦片绘制入口：返回 true 表示已绘制（含程序化回退）。 */
    drawArchiveFrameTile(x, y, w, h, t) {
      var ctx = this.ctx, T = this.tile;
      var pieces = (t && t.framePieces && t.framePieces.length) ? t.framePieces : null;
      if (!pieces) {
        var n = Math.max(1, Math.min(3, Math.round(w / T)));
        pieces = [n];
      }
      var total = 0;
      for (var i = 0; i < pieces.length; i++) total += pieces[i];
      if (!(total > 0)) { drawBrass(ctx, x, y, w, h, Math.max(1, Math.round(w / T))); return true; }

      // 逐件绘制：任一件图未就绪 → 整块走程序化回退，避免半图半块
      var ok = true, px = x;
      for (var j = 0; j < pieces.length; j++) {
        var len = pieces[j];
        var pw = w * (len / total);
        var s = ensure(len);
        if (!s) { ok = false; break; }
        var c = meta().crop[len - 1];
        ctx.drawImage(s.img, c[0], c[1], c[2], c[3], px, y, pw, h);
        px += pw;
      }
      if (!ok) { drawBrass(ctx, x, y, w, h, Math.max(1, Math.round(w / T))); return true; }

      // 件间接缝：只画黄铜连接板
      px = x;
      for (var k = 0; k < pieces.length - 1; k++) {
        px += w * (pieces[k] / total);
        drawJoint(ctx, px, y, h);
      }
      return true;
    },
  });

  /* 图书馆攀爬：三处档案调查点（Level.ladderNotes，见 level-gen-archive.js）的可见标记。
     标记绑定在进关时选出的触发架上：仅当玩家**双脚站上该架**、且尚未读档时，在架子上方
     画一枚悬浮感叹号（复用 drawExclaim 的既有样式）——不再绘制横向高光带 / 中心光环 /
     「调查档案」小字；空中掠过不显示，已读（flag 落存档）不再显示。无 ladderNotes 的关卡零开销。
     边界：只画不改——不碰碰撞、玩家物理、触发判定与存档。 */
  Object.assign(Game.prototype, {
    drawLadderNotes() {
      const L = this.level;
      if (!L || !L.ladderNotes || !L.ladderNotes.length) return;
      if (!this.save || typeof this.save.has !== 'function') return;
      const T = this.tile;
      for (const n of L.ladderNotes) {
        if (this.save.has(n.flag)) continue;       // 已看过的调查点不再标记
        // 未站上该触发架不显示（含空中掠过、贴边、站在别的平台上）
        if (!this.standingOnPlatform({ col: n.col, row: n.row, w: n.len })) continue;
        // 架子顶面中心（世界）→ 屏幕；感叹号画在顶面上方约 70px（角色头顶之上）
        const p = this.camera.toScreen((n.col + n.len / 2) * T, n.row * T);
        if (p.x < -80 || p.x > this.viewW + 80 || p.y < -120 || p.y > this.viewH + 80) continue;
        this.drawExclaim(p.x - 16, p.y - 86, 32, 32);
      }
    },
  });

  /* 供生成器/调试读取的几何工具（不依赖 DOM，可在无头环境使用） */
  if (typeof window !== 'undefined') {
    window.ArchiveFrameArt = {
      heightFor: heightFor,
      meta: meta,
    };
  }
})();
