/* ============================================================================
 * engine/game-tile-art.js —— Game 方法组 · 主题化瓦片美术（F5「去方块感」）
 * ----------------------------------------------------------------------------
 * 目标：把「地面 / 两侧墙体 / 平台 / 金墙 / 尖刺 / 毒雾」从**纯色方块**改为
 *       **程序化材质**绘制，配色与造型按「三套美术规范」逐关落到
 *       现实（real）/ 绿洲公共（oasis）/ 复古档案（archive）。
 *
 * 为什么是程序化而不是贴图：第九节的出图任务（IMG-006 地表件 / IMG-007 平台件 /
 *   IMG-008 危险物）尚未产出。按《场景立绘重规划》「未出图前用占位/回退，代码
 *   不等待美术」的约定，本文件提供**零外部素材依赖**的材质化渲染：既立刻消除
 *   纯色方块，又充当贴图到位前的正式回退（出图后在本表挂 `image` 字段即可）。
 *
 * 消除「方块感」的三件事：
 *   1) **邻接消边**：同族瓦片相邻的一侧不再描边，只给外露边画高光/暗部，整片
 *      地形读作「连续地形」而非「一格一格的色块」；两侧墙体（col 0 / 末列）
 *      由此读作「一堵墙」而不是一摞方块。
 *   2) **材质语言**：面板 / 砖砌 / 石柱 / 晶体 / 金铜 / 俯视墙 / 电路，各有底纹、
 *      倒角与暗部；统一只用 4 色调板 base / edge / accent / shade。
 *   3) **确定性纹理**：噪点与裂纹用「格坐标哈希」而非 Math.random，逐帧稳定不闪。
 *
 * 覆盖与回退：solid / oneway / block（金墙·青墙）/ spike 走 drawTileArt()，
 *   poison 走 drawPoisonArt()；带文字标签的瓦片仍走 drawBox（避免标签与材质打架）。
 *   本文件未加载、或 Game.tileArt === false、或关卡 def.tileArt === false 时，
 *   全部回退 game-render-tiles.js 原实现，观感与改动前完全一致。
 * 性能：底色渐变按「高度 + 色板」缓存复用（配合 translate 到瓦片局部坐标），
 *   发光用叠层半透明矩形模拟，不用 shadowBlur。
 * 加载：需在 class Game（game.js）之后；与其它 game-*.js 方法组无先后依赖。
 * ==========================================================================*/
'use strict';

/* ---------- 调色板工具（hex / rgb / rgba 均可解析） ---------- */
function tileArtParse(color) {
  if (typeof color !== 'string') return [40, 48, 64];
  let s = color.trim();
  const m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const p = m[1].split(',').map(v => parseFloat(v));
    return [p[0] | 0 || 0, p[1] | 0 || 0, p[2] | 0 || 0];
  }
  if (s[0] === '#') s = s.slice(1);
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const n = parseInt(s.slice(0, 6), 16);
  if (isNaN(n)) return [40, 48, 64];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// amt > 0 提亮（朝白），amt < 0 压暗（朝黑）
function tileArtShade(color, amt) {
  const p = tileArtParse(color);
  const f = v => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return 'rgb(' + f(p[0]) + ',' + f(p[1]) + ',' + f(p[2]) + ')';
}
// 把 base 朝 tint 混 t（0~1）：保留关卡自定义 tint 的作者意图，同时叠加材质
function tileArtBlend(base, tint, t) {
  const a = tileArtParse(base), b = tileArtParse(tint);
  const f = i => Math.round(a[i] + (b[i] - a[i]) * t);
  return 'rgb(' + f(0) + ',' + f(1) + ',' + f(2) + ')';
}
function tileArtAlpha(color, a) {
  const p = tileArtParse(color);
  return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')';
}
// 格坐标哈希：确定性 0~1（替代 Math.random，逐帧稳定）
function tileArtHash(x, y, salt) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(salt | 0, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* OASIS 危险物正式图。资源特意使用项目根目录相对路径：这些文件由美术流程
 * 直接交付在根目录，不能擅自复制/移动。失败时本文件的程序化回退仍可用。 */
const OASIS_HAZARD_IMAGES = Object.create(null);
function oasisHazardImage(src) {
  if (OASIS_HAZARD_IMAGES[src]) return OASIS_HAZARD_IMAGES[src];
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.src = src;
  OASIS_HAZARD_IMAGES[src] = img;
  return img;
}

/* ---------- 主题表：mapId -> 材质 / 色板（三套美术规范） ----------
 * mat  材质语言：panel 金属面板 | brick 混凝土砖砌 | stone 石柱段 |
 *                crystal 数据晶体 | gold 金铜饰面 | wall 俯视墙 | circuit 霓虹电路
 * base 底色（材质主体，会被 def.tileColors 的 tint 轻度混合）
 * edge 外露边线色（假高光用）  accent 发光点缀色（铆钉/电路/扫描线）
 * 说明：这里只写「配色与材质」，不改任何关卡数据；出图到位后可在此表加
 *       `image: 'image/floor_xxx.png'` 改走贴图（预留字段，本版未启用）。 */
const TILE_ART_THEMES = {
  // —— 现实（real）：混凝土 / 砖砌，冷灰、低饱和 ——
  home: { mat: 'brick', base: '#3b3f48', edge: '#6d747f', accent: '#7fd0ff' },
  balcony: { mat: 'brick', base: '#3b3f48', edge: '#6d747f', accent: '#9fe08a' },
  // —— 绿洲公共（oasis）：数据面板，深青金属 + 青光 ——
  oasis: { mat: 'panel', base: '#16202e', edge: '#3a5a6b', accent: '#2fd6c8' },
  treasure: { mat: 'crystal', base: '#123048', edge: '#57c9e0', accent: '#9fe9ff' },
  /* [099] maze 已移出（回复原版）：配合 maps.maze.def.tileArt=false，迷宫墙体
     回到原版 drawBox（#2b3354 + 白描边），与「oasis-game-draft - 副本」一致。 */
  data_vortex: { mat: 'circuit', base: '#160f2e', edge: '#7a52e8', accent: '#c9a8ff' },
  data_snake: { mat: 'circuit', base: '#160f2e', edge: '#7a52e8', accent: '#c9a8ff' },
  finale_transition: { mat: 'circuit', base: '#160f2e', edge: '#7a52e8', accent: '#c9a8ff' },
  // —— 复古档案（archive）：金铜饰面 / 石柱 ——
  library_gate: { mat: 'gold', base: '#3d2c12', edge: '#c9a24a', accent: '#ffe9a8' },
  library: { mat: 'gold', base: '#3d2c12', edge: '#c9a24a', accent: '#ffe9a8' },
  gold_approach: { mat: 'gold', base: '#3d2c12', edge: '#c9a24a', accent: '#ffe9a8' },
  palace: { mat: 'gold', base: '#3d2c12', edge: '#c9a24a', accent: '#ffe9a8' },
  // —— 绿洲·生态模拟 / 破败神殿：石柱段 ——
  corridor: { mat: 'stone', base: '#2d2b23', edge: '#6b5f45', accent: '#9fd07f' },
  road: { mat: 'stone', base: '#302a1e', edge: '#8a6a33', accent: '#7fe6a0' },
};
const TILE_ART_FALLBACK = { mat: 'panel', base: '#1b2436', edge: '#3a5a6b', accent: '#2fd6c8' };

Object.assign(Game.prototype, {
  /* 当前关卡的主题（按 mapId 缓存；mapId 变化时重取） */
  tileArtTheme() {
    if (this._tileArtMap === this.mapId && this._tileArtTheme) return this._tileArtTheme;
    const th = Object.assign({}, TILE_ART_THEMES[this.mapId] || TILE_ART_FALLBACK);
    // 关卡 def.tileColors 的 tint 轻度混入（保留作者对单关的压暗/提亮意图）
    const tint = (this.level && this.level.def && this.level.def.tileColors) || null;
    const tintColor = tint && (tint.solid || tint.oneway);
    if (tintColor) th.base = tileArtBlend(th.base, tintColor, 0.4);
    this._tileArtMap = this.mapId; this._tileArtTheme = th;
    return th;
  },
  /* 总开关：Game.tileArt === false（全局）或 level.def.tileArt === false（单关）时关闭 */
  tileArtOn() {
    if (this.tileArt === false) return false;
    if (this.level && this.level.def && this.level.def.tileArt === false) return false;
    return true;
  },
  /* 同族占据格集合：用于「邻接消边」。宽瓦片（程序生成平台）覆盖到的每一格都登记 */
  tileArtOccupancy() {
    const L = this.level;
    if (this._tileArtOccLevel === L && this._tileArtOcc) return this._tileArtOcc;
    const T = this.tile;
    const set = new Set();
    if (L && L.allTiles) {
      for (const t of L.allTiles) {
        if (t.type === 'poison') continue;   // 毒雾不算地形，不参与消边
        const c0 = Math.round(t.x / T), r0 = Math.round(t.y / T);
        const c1 = Math.round((t.x + t.w) / T), r1 = Math.round((t.y + t.h) / T);
        for (let c = c0; c < c1; c++) for (let r = r0; r < r1; r++) set.add(c + ',' + r);
      }
    }
    this._tileArtOccLevel = L; this._tileArtOcc = set;
    return set;
  },
  /* 底色渐变缓存：键「高度|顶色」，在瓦片局部坐标(0,0..h)下创建，可跨瓦片复用 */
  tileArtGrad(h, top, mid, bottom) {
    if (!this._tileArtGrads) this._tileArtGrads = new Map();
    const key = h + '|' + top + '|' + mid + '|' + bottom;
    let g = this._tileArtGrads.get(key);
    if (g) return g;
    g = this.ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top); g.addColorStop(0.52, mid); g.addColorStop(1, bottom);
    if (this._tileArtGrads.size > 120) this._tileArtGrads.clear();   // 保险：不无限增长
    this._tileArtGrads.set(key, g);
    return g;
  },
  /* 入口：返回 true 表示已接管绘制；false 表示请上层回退 drawBox */
  drawTileArt(x, y, w, h, t) {
    if (t.hazardKind === 'pit' && this.indexHazardArtOn()) {
      // 正式坑洞图（1/2 格件）→ 失败时程序化黑色裂缝 + 红色数据粒子。
      // 两种情况都返回 true：坑洞绝不再回退成「红色三角」地刺外观，物理不变。
      if (this.drawOasisPitArt(x, y, w, h)) return true;
      this.drawPitFallbackArt(x, y, w, h);
      return true;
    }
    if (!this.tileArtOn()) return false;
    const th = this.tileArtTheme();
    const occ = this.tileArtOccupancy();
    const T = this.tile;
    const cc = Math.round(t.x / T), rr = Math.round(t.y / T);
    const nb = {
      up: occ.has(cc + ',' + (rr - 1)),
      down: occ.has(cc + ',' + (rr + 1)),
      left: occ.has((cc - 1) + ',' + rr),
      right: occ.has((cc + 1) + ',' + rr),
    };
    // 金墙 / 青墙（可消融块）：不按地形材质画，走「能量墙」造型（保留原色语义）
    if (t.type === 'block') { this.tileArtEnergyBlock(x, y, w, h, t.color, nb); return true; }
    if (t.type === 'spike') { this.tileArtSpike(x, y, w, h, th); return true; }
    this.tileArtTerrain(x, y, w, h, th, nb, t.type);
    return true;
  },
  /* 危险物正式图总开关（关卡配置驱动）：
       def.hazardArt（如 'data-ruin'）= 新写法；历史上的 oasis / def.oasisHazardArt
       等价保留 —— oasis 与年鉴馆前廊的现有行为逐像素不变。 */
  indexHazardArtOn() {
    const L = this.level;
    if (!L || !L.def) return false;
    if (L.def.hazardArt) return true;
    return L.id === 'oasis' || !!L.def.oasisHazardArt;
  },
  /* 红雾帧表：关卡 def.fogFrames 可覆盖；缺省为 image/ 下的现成交付三帧（≈220ms/帧） */
  hazardFogFrames() {
    const f = this.level && this.level.def && this.level.def.fogFrames;
    if (Array.isArray(f) && f.length) return f;
    return ['image/hazard_red_fog_1_a.png', 'image/hazard_red_fog_1_b.png', 'image/hazard_red_fog_1_c.png'];
  },
  /* 1 格/2 格塌陷坑：图片的坑口对齐逻辑跑道线，坑口向下展开。
     未加载成功时返回 false，交给 drawPitFallbackArt（程序化裂缝），游戏不会白屏。 */
  drawOasisPitArt(x, y, w, h) {
    const src = w > this.tile * 1.5 ? 'image/hazard_oasis_pit_2.png' : 'image/hazard_oasis_pit_1.png';
    const img = oasisHazardImage(src);
    if (!img || !img.complete || !img.naturalWidth) return false;
    const ctx = this.ctx;
    // 原图坑口约在源图 32% 高处；按 4/3 缩放后向上提约 42% 格高，
    // 使坑口而非图片边缘精确落在 y（跑道线）。
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y - h * 0.42, w, h * 4 / 3);
    return true;
  },
  /* 塌陷坑图片缺失时的程序化回退：黑色裂缝（顶边 = 跑道线 y）+ 红色数据粒子。
     只画不判：死亡线仍是瓦片顶边（player.js touchesSpike 的 pit 语义），物理零改动。 */
  drawPitFallbackArt(x, y, w, h) {
    const ctx = this.ctx, now = performance.now();
    ctx.save();
    ctx.fillStyle = '#05030a';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w * 0.86, y + h * 0.62);
    ctx.lineTo(x + w * 0.5, y + h);
    ctx.lineTo(x + w * 0.14, y + h * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(217,45,61,0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ff5a7a';
    for (let i = 0; i < 4; i++) {
      const px = x + ((i + 0.5) * w) / 4 + Math.sin(now / 460 + i * 1.7) * 2;
      const py = y - ((now / 12 + i * 29) % 26);
      ctx.globalAlpha = 0.75 - i * 0.12;
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.restore();
  },
  /* 红雾图片缺失时的程序化回退：红色底 + 暗紫崩坏切片 + 上升数据碎块。
     刻意不使用旧绿色毒雾配色（危险物关的视觉语义 = 红色清除雾）。 */
  drawHazardFogFallback(x, y, w, h) {
    const ctx = this.ctx, now = performance.now();
    ctx.save();
    ctx.globalAlpha = 0.46 + 0.12 * Math.sin(now / 380);
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#7a1e3c'); g.addColorStop(0.5, '#d92d3d'); g.addColorStop(1, '#3a1030');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      const sy = y + tileArtHash(Math.round(x), Math.round(y), 700 + i) * (h - 5);
      ctx.fillStyle = i % 2 ? 'rgba(150,80,220,0.35)' : 'rgba(255,110,150,0.30)';
      ctx.fillRect(x, sy, w, 3 + (i % 2) * 2);
    }
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#e879ff';
    for (let i = 0; i < 3; i++) {
      const bx = x + ((i + 0.5) * w) / 3 + Math.sin(now / 520 + i * 2) * 2.5;
      const by = y + h - ((now / 16 + i * 41) % h);
      ctx.fillRect(bx, by, 2, 2);
    }
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = 'rgba(255,140,180,0.6)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2);
    ctx.restore();
  },

  /* 地形瓦片（solid / oneway）：材质底纹 + 邻接消边 */
  tileArtTerrain(x, y, w, h, th, nb, type) {
    const ctx = this.ctx;
    const mat = (type === 'oneway') ? 'panel' : th.mat;   // 悬空平台统一走面板，保证可读性
    const top = tileArtShade(th.base, 0.2);
    const mid = th.base;
    const bottom = tileArtShade(th.base, -0.3);
    ctx.save();
    ctx.translate(x, y);
    // ① 底色（竖向三段渐变）
    ctx.fillStyle = this.tileArtGrad(h, top, mid, bottom);
    ctx.fillRect(0, 0, w, h);
    // ② 材质底纹
    if (mat === 'brick') this.tileArtTexBrick(w, h, th, x, y);
    else if (mat === 'stone') this.tileArtTexStone(w, h, th, x, y);
    else if (mat === 'crystal') this.tileArtTexCrystal(w, h, th, x, y);
    else if (mat === 'gold') this.tileArtTexGold(w, h, th);
    else if (mat === 'wall') this.tileArtTexWall(w, h, th, nb, x, y);
    else if (mat === 'circuit') this.tileArtTexCircuit(w, h, th, x, y);
    else this.tileArtTexPanel(w, h, th, mat, x, y);
    // ③ 邻接消边 + 外露边高光/暗部（「连续地形」的关键）
    const lit = tileArtShade(th.edge, 0.3);
    const dark = tileArtShade(th.base, -0.55);
    if (!nb.up) {                                  // 外露顶面：亮边 + 细高光
      ctx.fillStyle = tileArtAlpha(th.accent, 0.75);
      ctx.fillRect(0, 0, w, 2);
      ctx.fillStyle = tileArtAlpha(th.accent, 0.16);
      ctx.fillRect(0, 2, w, 4);
    }
    if (!nb.down) {                                // 外露底面：暗边 + 落影
      ctx.fillStyle = dark;
      ctx.fillRect(0, h - 3, w, 3);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, h, w, 3);
    }
    if (!nb.left) { ctx.fillStyle = lit; ctx.fillRect(0, 0, 2, h); }
    else { ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(0, 0, 1, h); }
    if (!nb.right) { ctx.fillStyle = dark; ctx.fillRect(w - 2, 0, 2, h); }
    else { ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(w - 1, 0, 1, h); }
    ctx.restore();
  },


  /* 金墙 / 青墙（可消融块）：能量墙 —— 六边形格栅 + 呼吸边光 */
  tileArtEnergyBlock(x, y, w, h, color, nb) {
    const ctx = this.ctx;
    const now = performance.now();
    const pulse = 0.55 + 0.35 * Math.sin(now / 460);
    const top = tileArtShade(color, 0.3);
    const bottom = tileArtShade(color, -0.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = this.tileArtGrad(h, top, color, bottom);
    ctx.globalAlpha = 0.92;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    // 六边格栅
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    const step = Math.max(10, Math.round(w / 3));
    for (let gx = step; gx < w; gx += step) {
      ctx.beginPath(); ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, h); ctx.stroke();
    }
    for (let gy = step; gy < h; gy += step) {
      ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(w, gy + 0.5); ctx.stroke();
    }
    // 呼吸边光
    ctx.strokeStyle = tileArtAlpha('#ffffff', pulse * 0.7);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    // 外露顶/底边加强
    if (!nb.up) { ctx.fillStyle = tileArtAlpha(color, 0.9); ctx.fillRect(0, 0, w, 3); }
    if (!nb.down) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, h - 3, w, 3); }
    ctx.restore();
  },

  /* 尖刺 —— F2 主题化：IOI 安全扫描 / 数据崩坏光刃
   * 造型仍是三角形（碰撞判定不变），但由「纯色三角」改为
   * 基座警示带 + 外刃暗红渐变 + 内刃亮芯 + 横向扫描线。 */
  tileArtSpike(x, y, w, h, th) {
    const ctx = this.ctx;
    const now = performance.now();
    const pulse = 0.6 + 0.4 * Math.sin(now / 300);
    const n = Math.max(2, Math.floor(w / 14));
    const sw = w / n;
    ctx.save();
    ctx.translate(x, y);
    // 基座警示带（IOI 封锁线）
    ctx.fillStyle = 'rgba(12,6,10,0.85)';
    ctx.fillRect(0, h - 5, w, 5);
    ctx.fillStyle = 'rgba(255,90,120,0.55)';
    for (let i = 0; i < n * 2; i++) {
      if (i % 2) continue;
      ctx.fillRect((i * w) / (n * 2), h - 4, w / (n * 2), 3);
    }
    for (let i = 0; i < n; i++) {
      const tx = i * sw;
      const cx = tx + sw / 2;
      // 外刃（暗红→亮红渐变）
      const g = ctx.createLinearGradient(0, h - 5, 0, 0);
      g.addColorStop(0, 'rgba(90,10,30,0.95)');
      g.addColorStop(0.55, 'rgba(226,42,86,0.95)');
      g.addColorStop(1, 'rgba(255,150,190,0.95)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(tx + 0.6, h - 5);
      ctx.lineTo(cx, 0);
      ctx.lineTo(tx + sw - 0.6, h - 5);
      ctx.closePath(); ctx.fill();
      // 亮芯（细长三角，随呼吸闪烁）
      ctx.fillStyle = 'rgba(255,228,240,' + (0.35 + 0.35 * pulse) + ')';
      ctx.beginPath();
      ctx.moveTo(tx + sw * 0.3, h - 6);
      ctx.lineTo(cx, h * 0.22);
      ctx.lineTo(tx + sw * 0.7, h - 6);
      ctx.closePath(); ctx.fill();
    }
    // 横向扫描线（自下而上扫过）
    const sy = h - ((now / 40) % (h + 12)) + 6;
    if (sy > 0 && sy < h) {
      ctx.fillStyle = 'rgba(255,120,160,0.22)';
      ctx.fillRect(0, sy, w, 2);
    }
    ctx.restore();
  },

  /* 毒雾 —— F2 主题化：IOI 数据崩坏区
   * 由「绿色矩形 + 气泡」改为：底色保留关卡配置色相，叠加崩坏切片（glitch）、
   * 六边格栅与上升数据碎块，读作「被入侵的数据区块」而非「一滩绿水」。
   * 返回 true 表示已接管；关闭主题化时返回 false，由 drawPoison 回退原实现。 */
  drawPoisonArt(x, y, w, h, color) {
    // 危险物关卡（oasis / 年鉴馆前廊 / 失重舞厅·遗失索引场）使用根目录现成交付的
    // 三帧红色清除雾，帧表由关卡 def.fogFrames 声明；按时间轮换（≈220ms/帧）。
    // 每格独立绘制，连续雾区仍保持完整碰撞范围。
    if (this.indexHazardArtOn()) {
      const frames = this.hazardFogFrames();
      const img = frames.length
        ? oasisHazardImage(frames[Math.floor(performance.now() / 220) % frames.length]) : null;
      if (img && img.complete && img.naturalWidth) {
        this.ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, w, h);
        return true;
      }
      // 图片缺失：红色 + 暗紫程序化数据烟雾（绝不回退旧绿色毒雾）
      this.drawHazardFogFallback(x, y, w, h);
      return true;
    }
    if (!this.tileArtOn()) return false;
    const ctx = this.ctx;
    const now = performance.now();
    const th = this.tileArtTheme();
    const tint = color || th.base;
    ctx.save();
    // ① 底色：呼吸式脉冲
    ctx.globalAlpha = 0.40 + 0.12 * Math.sin(now / 420);
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, tileArtShade(tint, 0.25));
    g.addColorStop(1, tileArtShade(tint, -0.45));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // ② 崩坏切片：若干条横向 glitch 位移带
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      const seed = tileArtHash(Math.round(x), Math.round(y), 300 + i);
      const sy = y + tileArtHash(i, i * 7, 400) * (h - 6);
      const sh = 3 + (i % 2) * 3;
      ctx.fillStyle = i % 2 ? 'rgba(255,90,220,0.30)' : 'rgba(120,255,235,0.24)';
      ctx.fillRect(x - 3 + seed * 6, sy, w + 6, sh);
    }
    // ③ 六边格栅（数据区块的边界感）
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = tileArtShade(tint, 0.45);
    ctx.lineWidth = 1;
    const step = Math.max(9, Math.round(h / 3));
    for (let gy = y + step; gy < y + h; gy += step) {
      ctx.beginPath(); ctx.moveTo(x, gy + 0.5); ctx.lineTo(x + w, gy + 0.5); ctx.stroke();
    }
    for (let gx = x + step; gx < x + w; gx += step) {
      ctx.beginPath(); ctx.moveTo(gx + 0.5, y); ctx.lineTo(gx + 0.5, y + h); ctx.stroke();
    }
    // ④ 上升数据碎块（小方块而非圆点，更「数字」）
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = tileArtShade(tint, 0.55);
    for (let i = 0; i < 4; i++) {
      const bx = x + ((i + 0.5) * w) / 4 + Math.sin(now / 500 + i * 2) * 3;
      const by = y + h - ((now / 14 + i * 37) % h);
      const bs = 2 + (i % 2);
      ctx.fillRect(bx, by, bs, bs);
    }
    // ⑤ 警示描边（数据区块被封锁）
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = tileArtShade(tint, 0.6);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    ctx.restore();
    return true;
  },
});
