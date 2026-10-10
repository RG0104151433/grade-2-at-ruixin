/* ============================================================================
 * engine/game-tile-art-tex.js —— Game 方法组 · 主题化瓦片材质底纹（F5，自 game-tile-art.js 拆出）
 * ----------------------------------------------------------------------------
 * 只含 tileArtTex* 材质底纹方法（panel / brick / stone / crystal / gold /
 * wall / circuit）。主题表 TILE_ART_THEMES 与调色板工具仍在 game-tile-art.js；
 * 二者同处全局词法作用域，加载顺序无先后依赖，但都需晚于 class Game（game.js）。
 * 拆出原因：game-tile-art.js 已达 499 行逼近 500 行红线，无法继续加材质（F5 续做）。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  /* —— 材质底纹（都在「已 translate 到瓦片左上角」的局部坐标下绘制） —— */
  // 金属/数据面板：内倒角 + 四角铆钉 + 电路刻线
  tileArtTexPanel(w, h, th, mat, gx, gy) {
    const ctx = this.ctx;
    // 内侧倒角（上亮下暗，制造凸起感）
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(3, 3, w - 6, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(3, h - 4, w - 6, 1);
    // 电路刻线：一根横向 + 一根纵向短线（位置由格哈希决定，稳定不闪）
    ctx.strokeStyle = tileArtAlpha(th.edge, 0.32);
    ctx.lineWidth = 1;
    const hy = Math.round(10 + tileArtHash(gx, gy, 11) * (h - 24)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(6, hy); ctx.lineTo(w - 6, hy);
    ctx.stroke();
    const vx = Math.round(10 + tileArtHash(gx, gy, 23) * (w - 20)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(vx, 6); ctx.lineTo(vx, Math.min(h - 6, hy));
    ctx.stroke();
    // 端口节点
    ctx.fillStyle = tileArtAlpha(th.accent, 0.55);
    ctx.fillRect(vx - 1.5, hy - 1.5, 3, 3);
    // 四角铆钉
    ctx.fillStyle = tileArtAlpha(th.edge, 0.55);
    const r = 1.5, pad = 4;
    ctx.fillRect(pad, pad, r, r); ctx.fillRect(w - pad - r, pad, r, r);
    ctx.fillRect(pad, h - pad - r, r, r); ctx.fillRect(w - pad - r, h - pad - r, r, r);
  },
  // 混凝土砖砌：错缝砖纹 + 碎石噪点
  tileArtTexBrick(w, h, th, gx, gy) {
    const ctx = this.ctx;
    const rows = 2, bw = Math.round(w / 2), bh = Math.round(h / rows);
    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.lineWidth = 1;
    for (let r = 1; r < rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * bh + 0.5); ctx.lineTo(w, r * bh + 0.5); ctx.stroke();
    }
    for (let r = 0; r < rows; r++) {
      // 奇偶行错缝
      const off = (r % 2) ? Math.round(bw / 2) : 0;
      for (let bx = off; bx < w; bx += bw) {
        if (bx <= 0) continue;
        ctx.beginPath(); ctx.moveTo(bx + 0.5, r * bh); ctx.lineTo(bx + 0.5, r * bh + bh); ctx.stroke();
      }
    }
    // 噪点（每格 3 粒，确定性）
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 3; i++) {
      const nx = Math.round(tileArtHash(gx, gy, 101 + i) * (w - 4)) + 2;
      const ny = Math.round(tileArtHash(gx, gy, 201 + i) * (h - 4)) + 2;
      ctx.fillRect(nx, ny, 2, 2);
    }
  },
  // 石柱段：竖向凿痕 + 上下勒边 + 一道裂缝
  tileArtTexStone(w, h, th, gx, gy) {
    const ctx = this.ctx;
    // 上下勒边（柱段分节）
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 6, w, 2);
    ctx.fillRect(0, h - 8, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, 4, w, 2);
    ctx.fillRect(0, h - 10, w, 2);
    // 竖向凿痕
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const vx = Math.round((i * w) / 4) + 0.5;
      ctx.beginPath(); ctx.moveTo(vx, 6); ctx.lineTo(vx, h - 8); ctx.stroke();
    }
    // 裂缝（位置由格哈希决定）
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    const cx = Math.round(6 + tileArtHash(gx, gy, 31) * (w - 12));
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, 8); ctx.lineTo(cx - 2.5, Math.round(h / 2)); ctx.lineTo(cx + 2.5, h - 10);
    ctx.stroke();
  },
  // 数据晶体：斜向内高光 + 内部线路 + 发光外沿
  tileArtTexCrystal(w, h, th, gx, gy) {
    const ctx = this.ctx;
    // 内部斜向棱面
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
    ctx.fillStyle = tileArtAlpha(th.accent, 0.10);
    ctx.beginPath();
    ctx.moveTo(0, h); ctx.lineTo(w * 0.62, 0); ctx.lineTo(w, 0); ctx.lineTo(w * 0.38, h);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7); ctx.lineTo(w * 0.3, 0); ctx.lineTo(w * 0.42, 0); ctx.lineTo(w * 0.12, h * 0.7);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // 内部线路
    ctx.strokeStyle = tileArtAlpha(th.edge, 0.5);
    ctx.lineWidth = 1;
    const ly = Math.round(h * (0.3 + tileArtHash(gx, gy, 41) * 0.4)) + 0.5;
    ctx.beginPath(); ctx.moveTo(8, ly); ctx.lineTo(w - 8, ly); ctx.stroke();
    ctx.fillStyle = tileArtAlpha(th.accent, 0.75);
    ctx.fillRect(w - 11, ly - 1.5, 3, 3);
  },
  // 金铜饰面：铜线分格 + 上下金沿
  tileArtTexGold(w, h, th) {
    const ctx = this.ctx;
    ctx.strokeStyle = tileArtAlpha(th.edge, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 7.5); ctx.lineTo(w, 7.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h - 7.5); ctx.lineTo(w, h - 7.5); ctx.stroke();
    ctx.fillStyle = tileArtAlpha(th.accent, 0.20);
    ctx.fillRect(2, 2, w - 4, 3);
    // 中央铜饰
    ctx.fillStyle = tileArtAlpha(th.edge, 0.30);
    ctx.fillRect(w / 2 - 3, h / 2 - 3, 6, 6);
    ctx.fillStyle = tileArtAlpha(th.accent, 0.35);
    ctx.fillRect(w / 2 - 1, h / 2 - 1, 2, 2);
  },
  // 俯视墙（迷宫）：顶面亮 + 左侧亮 / 右侧暗，伪 2.5D；相邻处压平
  tileArtTexWall(w, h, th, nb, gx, gy) {
    const ctx = this.ctx;
    // 顶面高光带（未与上方相连时更亮，读作「墙的顶棱」）
    ctx.fillStyle = tileArtAlpha(th.accent, nb.up ? 0.16 : 0.42);
    ctx.fillRect(0, 0, w, Math.max(3, Math.round(h * 0.14)));
    // 面板分格
    ctx.strokeStyle = tileArtAlpha(th.edge, 0.28);
    ctx.lineWidth = 1;
    ctx.strokeRect(4.5, 4.5, w - 9, h - 9);
    // 电路节点
    ctx.fillStyle = tileArtAlpha(th.accent, 0.5);
    ctx.fillRect(w * 0.5 - 1.5, h * 0.5 - 1.5, 3, 3);
    // 竖向数据流（确定性位置）
    const sx = Math.round(8 + tileArtHash(gx, gy, 53) * (w - 16));
    ctx.fillStyle = tileArtAlpha(th.edge, 0.22);
    ctx.fillRect(sx, 6, 1, h - 12);
  },
  // 霓虹电路（数据空间）：紫光走线 + 亮点
  tileArtTexCircuit(w, h, th, gx, gy) {
    const ctx = this.ctx;
    ctx.strokeStyle = tileArtAlpha(th.edge, 0.42);
    ctx.lineWidth = 1;
    const my = Math.round(h / 2) + 0.5, hy2 = Math.round(h * 0.28) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, my); ctx.lineTo(w * 0.35, my); ctx.lineTo(w * 0.5, hy2); ctx.lineTo(w, hy2);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.35, my); ctx.lineTo(w * 0.35, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.5, hy2); ctx.lineTo(w * 0.5, 0); ctx.stroke();
    ctx.fillStyle = tileArtAlpha(th.accent, 0.8);
    ctx.fillRect(Math.round(w * 0.35) - 1.5, my - 1.5, 3, 3);
    ctx.fillRect(Math.round(w * 0.5) - 1.5, hy2 - 1.5, 3, 3);
    // 涟漪点
    ctx.fillStyle = tileArtAlpha(th.accent, 0.25);
    const dx = Math.round(tileArtHash(gx, gy, 67) * (w - 10)) + 5;
    ctx.fillRect(dx, Math.round(tileArtHash(gx, gy, 71) * (h - 10)) + 5, 2, 2);
  },
});
