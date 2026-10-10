/* ============================================================================
 * engine/level.js —— 瓦片与关卡
 * ----------------------------------------------------------------------------
 * 地图字符图例 LEGEND、Tile、Trigger、Level，以及 Level 内的移动平台与
 * 无尽关的平台区块回收（优化方案 C2，见 recordEndlessTile / updateEndlessWindow）。
 * 两套程序化关卡生成（ladderParkour 紫梯 / skyParkour 天空方块与地面危险物）
 * 已拆至 level-gen.js（须在本文件之后加载）。
 * 依赖：core.js 的 Rect、makeRng。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 212-662 行），整段搬运、方法体未作改动。
 * ==========================================================================*/
'use strict';
/* ------------------------------- 瓦片 / 关卡 ------------------------------ */
const LEGEND = {
  '#': 'solid',
  '-': 'oneway',
  'L': 'ladder',
  '^': 'spike',
  '$': 'interact',
  '*': 'poison',   // 毒雾（移植自gry长街）：触碰即死，与尖刺同效但视觉不同
  'G': 'gold',     // 可消融方块·金（移植自gry长街 G 墙：靠近按 E 消融）
  'C': 'cyan',     // 可消融方块·青（同上，青系）
  'P': 'ladderOneway',  // 紫色梯子平台：oneway 可按 S 穿过下落，颜色取梯子色
  'B': 'blueSolid',     // 蓝色实心块：碰撞同实心，蓝色（用于第二关紫梯子下方通道地板）
  'X': 'solid',         // X=隐形墙：碰撞同实心但 hiddenVisual 只碰撞不绘制（road 终点隐形线）
};

class Tile {
  constructor(x, y, w, h, type, color, label, labelEn) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.type = type;
    this.color = color;
    this.label = label;
    this.label_en = labelEn || '';
  }
  get rect() { return new Rect(this.x, this.y, this.w, this.h); }
}

class Trigger {
  constructor(engine, def) {
    const T = engine.tile;
    this.id = def.id || '';
    this.label = def.label || '';
    this.label_en = def.label_en || '';
    this.color = def.color || 'trigger';
    this.rect = new Rect(def.x * T, def.y * T, def.w * T, def.h * T);
    this.trigger = def.trigger || 'interact'; // 'auto' | 'interact'
    this.filter = def.filter || [];
    this.flags = def.flags || [];
    this.events = def.events || [];
    this.npc = !!def.npc;
    this.icon = def.icon || '';   // 静态标记图标：'exclaim' → 绘制感叹号触发点
    // 自定义柔和交互标记（年鉴馆走廊）：'desk' 接待台轮廓 / 'soft' 调查点光环 /
    // 'softHidden' 重访触发器（跳过默认方块但不重复画标记）。由 game-archive-hall.js 绘制。
    this.marker = def.marker || '';
    this.hidden = !!def.hidden;   // 隐藏触发框（如门画在背景图里，只用其交互范围）
    this.jump = !!def.jump;       // 激活时角色自动跳跃（如荒原的树木交互）
    this.showAfter = (def.showAfter != null) ? def.showAfter : null; // 玩家 x 到达该像素后才显现
    /* 已记录某线索后：交互完全失效（不判定、不响应、不绘制提示）。
       用于接待台验证完成后，morrov_gate 不再产生任何交互。 */
    this.hideAfterClue = def.hideAfterClue || '';
    /* 已记录某线索后：保留交互响应（按 E/点击仍有效），但不再显示提示标签。
       用于验证后领取索引册仍可响应、但不显示 "E · 领取访客索引册" 提示条。 */
    this.hideLabelAfterClue = def.hideLabelAfterClue || '';
    this._activated = false;      // 本次进入关卡内是否已激活（防止重复触发）
  }
}

class Level {
  constructor(engine, def) {
    this.engine = engine;
    this.def = def;
    this.name = def.name || def.id;
    this.name_en = def.name_en || '';
    this.id = def.id;
    this.grid = def.grid || [];
    this.rows = this.grid.length;
    this.cols = this.rows ? this.grid[0].length : 0;
    this.mode = def.mode || 'platformer'; // 'platformer' | 'topdown'
    this.fog = !!def.fog;
    this.endless = !!def.endless;
    this.endlessCfg = def.endless || {};
    this.mazeCfg = def.maze || null;
    /* AI-02：路线/导航数据探测位。脚本缺失（typeof 守卫，不会触发 TDZ）、
       全局数据缺失或数组为空时 routeAvailable=false —— 关卡继续走旧 tile 路径，
       行为与改造前逐帧一致。真正的空间数据消费从 AI-04A（构成契约）开始。
       AI-04A：构造函数传入 tile，供 LevelSurfaces 做世界坐标投影。 */
    this.navigation = (typeof LevelNavigation === 'function') ? new LevelNavigation(def, engine.tile) : null;
    this.routeAvailable = this.navigation ? this.navigation.available() : false;
    // 未配置关卡死因时保持为空，由复生面板回落到本地化的中性状态标题。
    this.deathMessage = def.deathMessage || '';
    this.deathMessage_en = def.deathMessage_en || '';
    this.killY = def.killY != null ? def.killY : this.rows * engine.tile + 400;
    /* fallKillY（失重舞厅 2026-09-20）：掉出平台区即判死的高度线；null = 不启用。 */
    this.fallKillY = def.fallKillY != null ? def.fallKillY : null;
    // 掉落专属死因（失重舞厅）：与 deathMessage 同口径映射到实例，供 pick(L, ...) 取用。
    this.fallMessage = def.fallMessage || '';
    this.fallMessage_en = def.fallMessage_en || '';
    this.spawn = def.spawn || { col: 1, row: 1, facing: 1 };
    this.anchors = [];           // D2 通用复生锚点（buildAnchors 填充）
    this.anchorIdx = 0;          // 本次进关已激活的最远锚点序号（复生后重建关卡时归零）
    this.genAnchorSpots = [];    // 程序生成关的主路径锚点候选（level-gen 登记）
    this.solids = [];
    this.oneways = [];
    this.spikes = [];
    this.poisons = [];   // 毒雾瓦片（移植自gry长街）
    this.blocks = [];    // 可消融方块（G/C，移植自gry长街）
    this.allTiles = [];
    this.triggers = [];
    this.traps = [];
    this.potion = null;
    this.interactCells = [];
    this.floorCells = [];
    this.minigameBlock = null;   // 天空跑酷：固定方块（触发扫雷）
    this.movers = [];            // 移动平台（由 movingPlatforms 配置驱动）
    // 无尽关区块回收（C2）：区块表存几何真源，运行时数组只留相机活动窗口内的瓦片。
    if (this.endless) {
      this.endlessChunks = new Map();   // idx → { platforms: [Tile], spikes: [Tile] }
      this.endlessActive = new Set();   // 当前已挂载到运行时数组的区块
      this.endlessChunkPx = (this.endlessCfg.chunkCols != null ? this.endlessCfg.chunkCols : 32) * engine.tile;
      this.endlessKeepBehindCols = (this.endlessCfg.keepBehindCols != null ? this.endlessCfg.keepBehindCols : 8);
    }
    this.buildTiles();
    if (this.def.oasisPitStyle || this.def.pitStyle) this.mergeOasisPits();
    if (this.def.ladderParkour) this.buildLadderParkour();
    if (this.def.skyParkour) this.buildSkyParkour();
    if (this.def.oasisParkour) this.buildOasisParkour();
    if (this.def.mirror) this.buildMirrorZone(); // AI-06：镜像跑道/门构造期预建不入碰撞，镜像启动时挂载
    this.buildTriggers();
    this.buildAnchors();
    this.buildTraps();
    this.buildPotion();
    this.buildInteract();
    if (this.mode === 'scene') this.buildScene();
  }
  buildTiles() {
    const T = this.engine.tile;
    const A = this.engine.cfg.assetsMap;
    // 关卡可覆盖瓦片颜色（如黄金图书馆前廊：压暗地板以衬托背景图）
    const tint = this.def.tileColors || {};
    const solidColor = tint.solid || A.solid.color;
    const onewayColor = tint.oneway || A.oneway.color;
    for (let r = 0; r < this.rows; r++) {
      const line = this.grid[r] || '';
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        const type = LEGEND[ch];
        if (!type) {
          if (ch === '.' || ch === ' ') this.floorCells.push({ col: c, row: r });
          continue;
        }
        if (type === 'interact') {
          this.interactCells.push({ col: c, row: r });
          continue;
        }
        const x = c * T, y = r * T;
        let tile = null;
        if (type === 'solid') {
          tile = new Tile(x, y, T, T, 'solid', solidColor, '');
          if (ch === 'X') tile.hiddenVisual = true; // X 隐形墙：只碰撞不绘制（road 终点隐形线）
          this.solids.push(tile);
        } else if (type === 'blueSolid') {
          // 蓝色实心块：碰撞同实心，蓝色（用于第二关紫梯子下方通道地板）
          tile = new Tile(x, y, T, T, 'solid', '#2fd6c8', '');
          this.solids.push(tile);
        } else if (type === 'ladderOneway') {
          // 紫色梯子平台：oneway 可按 S 穿过下落，颜色取梯子色（无文字标签）
          tile = new Tile(x, y, T, T, 'oneway', A.ladder.color, '');
          this.oneways.push(tile);
        } else if (type === 'oneway') {
          if (this.def.solidPlatforms) {
            // 实心悬空平台（如绿洲入口跑酷）：与天空跑酷共用 addGeneratedSolid（四面阻挡
            // 不可穿过、杜绝穿模；配置 movingPlatforms 时上下左右移动）。
            this.markMover(this.addGeneratedSolid(x, y, T));
          } else {
            tile = new Tile(x, y, T, T, 'oneway', onewayColor, '');   // 平台不绘制文字标签
            this.oneways.push(tile);
          }
        } else if (type === 'ladder') {
          tile = new Tile(x, y, T, T, 'oneway', A.ladder.color, A.ladder.label, A.ladder.label_en);
          this.oneways.push(tile);
        } else if (type === 'spike') {
          tile = new Tile(x, y, T, T, 'spike', A.spike.color, A.spike.label || '');
          // OASIS 的 ^ 位于跑道线（row14）时表示塌陷坑，不是向上长出的尖刺。
          // 保持 spike 数组接口兼容现有路线校验，但渲染/死亡判定走 pit 语义。键名兼容：pitStyle/pitRow ≡ oasisPitStyle/oasisPitRow。
          if ((this.def.pitStyle || this.def.oasisPitStyle) && r === (this.def.pitRow != null ? this.def.pitRow : this.def.oasisPitRow)) tile.hazardKind = 'pit';
          this.spikes.push(tile);
        } else if (type === 'poison') {
          tile = new Tile(x, y, T, T, 'poison', (A.poison && A.poison.color) || '#b388ff', A.poison && A.poison.label, A.poison && A.poison.label_en);
          this.poisons.push(tile);
        } else if (type === 'gold' || type === 'cyan') {
          const isGold = type === 'gold';
          const color = isGold ? ((A.gold && A.gold.color) || '#f0c869')
                               : ((A.cyan && A.cyan.color) || '#00e5ff');
          tile = new Tile(x, y, T, T, 'block', color, '');
          this.solids.push(tile);   // 未消融前按实心墙处理（阻挡通行）
          this.blocks.push({ x, y, col: c, row: r, color: isGold ? 'G' : 'C', tile });
        }
        if (tile) this.allTiles.push(tile);
      }
    }
  }
  /* 将连续的 OASIS 坑洞瓦片合成 1 个宽 48/96px 的危险区：
     这样 2 格坑会一次绘制一张完整图片，也只有一个连续的坠落判定。 */
  mergeOasisPits() {
    const pits = this.spikes.filter(t => t.hazardKind === 'pit').sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const remove = new Set();
    for (let i = 0; i < pits.length;) {
      const group = [pits[i++]];
      while (i < pits.length && pits[i].y === group[0].y && pits[i].x === group[group.length - 1].x + group[group.length - 1].w) {
        group.push(pits[i++]);
      }
      if (group.length < 2) continue;
      const lead = group[0];
      lead.w = group.reduce((sum, t) => sum + t.w, 0);
      lead.pitSpan = group.length;
      for (let g = 1; g < group.length; g++) remove.add(group[g]);
    }
    if (remove.size) {
      this.spikes = this.spikes.filter(t => !remove.has(t));
      this.allTiles = this.allTiles.filter(t => !remove.has(t));
    }
  }
  buildTriggers() {
    for (const d of (this.def.triggers || [])) this.triggers.push(new Trigger(this.engine, d));
  }
  /* ---------------- D2 通用复生锚点 ----------------
     锚点 = 途中可站立的「复生点」：经过感应区即推进当局复生锚点（game-interact），
     死亡回最近锚点而非关卡起点。静态关用 def.checkpoints [{col,row,x,y,w,h}]；
     生成关由 level-gen 登记进 genAnchorSpots（感应区自动取平台整行 × 上方 3 格）。 */
  buildAnchors() {
    const T = this.engine.tile;
    const add = (col, row, facing, rx, ry, rw, rh) => {
      this.anchors.push({
        col, row, facing: facing || 1, idx: this.anchors.length + 1,
        rect: new Rect(rx * T, ry * T, rw * T, rh * T),
      });
    };
    for (const c of (this.def.checkpoints || [])) add(c.col, c.row, c.facing, c.x, c.y, c.w, c.h);
    for (const s of this.genAnchorSpots) add(s.col, s.row, 1, s.col, s.row - 3, s.w, 3);
  }
  buildTraps() {
    const T = this.engine.tile;
    for (const t of (this.def.traps || [])) {
      this.traps.push({ col: t.col, row: t.row, rect: new Rect(t.col * T, t.row * T, T, T) });
    }
  }
  /* ---------------- AI-06 镜像谜题：镜像跑道/出口门（预建不入碰撞，启动时挂载） ----------------
     跑道 = 世界上方 row3 平板（缺口=坑洞）；镜像启动 enableMirrorRunway/openMirrorDoor 才挂载/开放。 */
  buildMirrorZone() {
    const T = this.engine.tile, M = this.def.mirror;
    this.mirrorRunwayTiles = []; this.mirrorDoorTiles = [];
    if (!M) return;
    const baseRow = (M.runwayRow != null ? M.runwayRow : 3);
    /* 2026-09-20 起伏：runway.spans = [[起始列, 结束列, 行], ...] 逐段指定行，
       使跑道不再是同一平面。无 spans 时回退旧写法 runway.cols（整段同一行）。 */
    let spans;
    if (M.runway && Array.isArray(M.runway.spans) && M.runway.spans.length) {
      spans = M.runway.spans.filter(s => Array.isArray(s) && s.length >= 2)
        .map(s => [s[0], s[1], (s[2] != null ? s[2] : baseRow)]);
    } else if (M.runway && Array.isArray(M.runway.cols)) {
      spans = M.runway.cols.filter(s => Array.isArray(s) && s.length >= 2)
        .map(s => [s[0], s[1], baseRow]);
    } else {
      spans = [];
    }
    /* 坑洞 / 毒雾所在列 = 路面缺口（不生成实心块）：踩空即坠落，由 killFallRow 判定；
       图片仅作外观（game-gate-mirror.js 的 _gmDrawRunwayHazards）。 */
    const holes = new Set();
    for (const hz of [].concat(Array.isArray(M.pits) ? M.pits : [], Array.isArray(M.fogs) ? M.fogs : [])) {
      if (!hz || hz.col == null) continue;
      for (let c = hz.col; c < hz.col + (hz.w || 1); c++) holes.add(c);
    }
    {
      for (const span of spans) {
        const runRow = span[2] * T;
        /* 逐段生成，遇到缺口列就断开（保证不生成跨越缺口的实心块） */
        for (let c0 = span[0]; c0 <= span[1]; c0++) {
          if (holes.has(c0)) continue;
          let c1 = c0;
          while (c1 + 1 <= span[1] && !holes.has(c1 + 1)) c1++;
          for (let c = c0; c <= c1;) {
            const remain = c1 - c + 1;
            const w = remain >= 5 ? 3 : (remain === 4 ? 2 : remain);
            const tile = new Tile(c * T, runRow, w * T, T, 'solid', '', '');
            tile.gateMirrorRunway = true; tile.deckBreak = true;
            this.mirrorRunwayTiles.push(tile);
            c += w;
          }
          c0 = c1;
        }
      }
    }
    const doorKeys = new Set((Array.isArray(M.doorCells) ? M.doorCells : []).map(c => (c[0] * T) + ':' + (c[1] * T))); // 出口门实心格坐标
    for (const t of (this.solids || [])) if (doorKeys.has(t.x + ':' + t.y)) this.mirrorDoorTiles.push(t);
  }
  enableMirrorRunway() { // 镜像启动：跑道入碰撞/渲染；门打开。幂等。
    if (!this.mirrorRunwayTiles) return;
    for (const t of this.mirrorRunwayTiles) {
      if (this.solids.includes(t)) continue;
      this.solids.push(t); this.allTiles.push(t);
    }
  }
  openMirrorDoor() {
    if (!this.mirrorDoorTiles) return;
    this.solids = this.solids.filter(t => !this.mirrorDoorTiles.includes(t));
    this.allTiles = this.allTiles.filter(t => !this.mirrorDoorTiles.includes(t));
  }
  buildPotion() {
    if (!this.def.potion) return;
    const T = this.engine.tile;
    this.potion = {
      col: this.def.potion.col, row: this.def.potion.row,
      rect: new Rect(this.def.potion.col * T, this.def.potion.row * T, T, T),
    };
  }
  buildInteract() {
    if (!this.interactCells.length) return;
    const grid = this.grid;
    const visited = new Set();
    const regions = [];
    // 用洪泛法把相邻的 $ 合并成同一个交互区域
    for (const cell of this.interactCells) {
      const key = cell.col + ',' + cell.row;
      if (visited.has(key)) continue;
      const region = [];
      const stack = [cell];
      visited.add(key);
      while (stack.length) {
        const cur = stack.pop();
        region.push(cur);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = cur.col + dc, nr = cur.row + dr;
          const k2 = nc + ',' + nr;
          if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[nr].length && grid[nr][nc] === '$' && !visited.has(k2)) {
            visited.add(k2);
            stack.push({ col: nc, row: nr });
          }
        }
      }
      regions.push(region);
    }
    // 区域按扫描顺序（从上到下、从左到右）出现，无需再排序
    const texts = pickList(this.def, 'interactTexts');
    regions.forEach((region, i) => {
      let minC = Infinity, minR = Infinity, maxC = -Infinity, maxR = -Infinity;
      for (const c of region) {
        minC = Math.min(minC, c.col); minR = Math.min(minR, c.row);
        maxC = Math.max(maxC, c.col); maxR = Math.max(maxR, c.row);
      }
      const text = (texts[i] != null && texts[i] !== '') ? texts[i] : pickText('这里好像有什么东西……', 'There seems to be something here...');
      this.triggers.push(new Trigger(this.engine, {
        id: 'interact_' + this.id + '_' + i,
        label: '交互点',
        label_en: 'Interact point',
        color: 'interact',
        trigger: 'interact',
        x: minC, y: minR, w: maxC - minC + 1, h: maxR - minR + 1,
        events: [{ type: 'dialog', text: [text] }],
      }));
    });
  }
  // 场景模式（mode:'scene'）：把 cfg.scene.hotspots 的格子坐标换算成画布像素热区
  buildScene() {
    const cfg = this.def.scene || {};
    const W = cfg.W || 70, H = cfg.H || 30;
    const T = 32; // 场景热区格子边长（与 gry 一致）
    const scale = Math.min(this.engine.viewW / (W * T), this.engine.viewH / (H * T));
    const offX = (this.engine.viewW - W * T * scale) / 2;
    const offY = (this.engine.viewH - H * T * scale) / 2;
    const spots = [];
    (cfg.hotspots || []).forEach(h => {
      spots.push({
        id: h.id || '',
        title: h.title || '',
        title_en: h.title_en || '',
        context: h.context || '',
        context_en: h.context_en || '',
        actions: h.actions || [],
        events: h.events || [],
        rect: {
          x: offX + h.x * T * scale,
          y: offY + h.y * T * scale,
          w: (h.w || 1) * T * scale,
          h: (h.h || 1) * T * scale,
        },
      });
    });
    this.sceneSpots = spots;
  }
  addGeneratedPlatform(x, y, w) {
    const A = this.engine.cfg.assetsMap;
    const tint = this.def.tileColors || {};
    const tile = new Tile(x, y, w, this.engine.tile, 'oneway', tint.oneway || A.oneway.color, '');
    this.oneways.push(tile);
    this.allTiles.push(tile);
    return tile;
  }
  // 实心块生成：四面阻挡、不可穿过（沿用原平台配色，观感不变）。
  // 天空跑酷(buildSkyParkour) 与绿洲入口(solidPlatforms 的 - 平台) 共用此逻辑，
  // 确保两处跑酷碰撞一致，小人不会穿模进方块。
  addGeneratedSolid(x, y, w) {
    const A = this.engine.cfg.assetsMap;
    const tint = this.def.tileColors || {};
    const tile = new Tile(x, y, w, this.engine.tile, 'solid', tint.oneway || A.oneway.color, '');
    this.solids.push(tile);
    this.allTiles.push(tile);
    return tile;
  }
  /* 记忆档案井：实体黄铜攀爬架（四面阻挡、不可从下方穿过）。
     h 由素材裁剪框宽高比推导（1/2/3 格单件高度不同），与美术绘制同源；
     framePieces 记录该平台由哪些格宽单件拼成（如 [3,2] = 5 格门平台）。 */
  addGeneratedFrame(x, y, w, h, pieces) {
    const A = this.engine.cfg.assetsMap;
    const tint = this.def.tileColors || {};
    const tile = new Tile(x, y, w, h, 'solid', tint.oneway || A.oneway.color, '');
    tile.special = 'archive_frame';
    tile.framePieces = (pieces && pieces.length) ? pieces.slice() : null;
    this.solids.push(tile);
    this.allTiles.push(tile);
    return tile;
  }
  /* 登记「移动平台」：仅当关卡配置了 movingPlatforms 时生效。 */
  markMover(tile) {
    if (!tile || !this.def.movingPlatforms) return;
    tile.mover = true;
    this.movers.push(tile);
  }
  /* 移动平台：在基准点附近做有界的上下左右随机移动。
     方向由 makeRng(seed) 决定（可复现）；每帧把实际位移写入 tile._dx/_dy，
     玩家载人逻辑（Player.applyMoverCarry）据此把人一并带走。 */
  updateMovers() {
    const cfg = this.def.movingPlatforms;
    if (!cfg || !this.movers.length) return;
    const T = this.engine.tile;
    const speed = cfg.speed != null ? cfg.speed : 0.7;          // 像素 / 帧
    const rangeX = (cfg.rangeX != null ? cfg.rangeX : 2) * T;   // 水平幅度（格）
    const rangeY = (cfg.rangeY != null ? cfg.rangeY : 1) * T;   // 垂直幅度（格）
    const minMs = cfg.dirMinMs != null ? cfg.dirMinMs : 1500;
    const maxMs = cfg.dirMaxMs != null ? cfg.dirMaxMs : 3000;
    const rng = this.moverRng || (this.moverRng = makeRng(cfg.seed != null ? cfg.seed : 7));
    const dt = 1000 / 60;   // 固定步长主循环：每帧一次
    for (const t of this.movers) {
      if (t._bx == null) {   // 首次：记录基准点并随机一个初始方向
        t._bx = t.x; t._by = t.y;
        t._vx = (rng() < 0.5 ? -1 : 1) * speed; t._vy = 0;
        t._timer = minMs + rng() * (maxMs - minMs);
      }
      t._timer -= dt;
      if (t._timer <= 0) {   // 到点换向：上 / 下 / 左 / 右 随机其一
        const dir = Math.floor(rng() * 4);
        t._vx = dir === 0 ? -speed : (dir === 1 ? speed : 0);
        t._vy = dir === 2 ? -speed : (dir === 3 ? speed : 0);
        if (t._vx === 0 && t._vy === 0) t._vx = speed;
        t._timer = minMs + rng() * (maxMs - minMs);
      }
      let nx = t.x + t._vx, ny = t.y + t._vy;
      if (nx < t._bx - rangeX || nx > t._bx + rangeX) { t._vx = -t._vx; nx = t.x + t._vx; }
      if (ny < t._by - rangeY || ny > t._by + rangeY) { t._vy = -t._vy; ny = t.y + t._vy; }
      t._dx = nx - t.x; t._dy = ny - t.y;
      t.x = nx; t.y = ny;
    }
  }
  // 无尽跑酷：在生成平台正下方生成等宽尖刺（尖刺无限扩展）
  addGeneratedSpike(x, y, w) {
    const A = this.engine.cfg.assetsMap;
    const tile = new Tile(x, y, w, this.engine.tile, 'spike', A.spike.color, A.spike.label || '');
    this.spikes.push(tile);
    this.allTiles.push(tile);
    return tile;
  }
  /* ---------------- 无尽关区块回收（优化方案 C2） ----------------
     addGeneratedSolid / addGeneratedSpike 已把瓦片放进运行时数组，
     这里只把它登记进所属区块，并把该区块标记为「活动」。
     瓦片本身带 _attached 标记，保证「挂载 / 摘除」幂等、绝不重复挂载。 */
  recordEndlessTile(kind, tile) {
    if (!this.endlessChunks || !this.endlessChunkPx || !tile) return;
    tile._attached = true;
    const idx = Math.floor(tile.x / this.endlessChunkPx);
    let rec = this.endlessChunks.get(idx);
    if (!rec) { rec = { platforms: [], spikes: [] }; this.endlessChunks.set(idx, rec); }
    (kind === 'spike' ? rec.spikes : rec.platforms).push(tile);
    this.markEndlessChunkActive(idx);
  }
  /* 区块挂载：把该区块的瓦片放回碰撞 / 渲染 / 移动数组（已挂载的跳过）。 */
  markEndlessChunkActive(idx) {
    if (!this.endlessChunks || this.endlessActive.has(idx)) return;
    const rec = this.endlessChunks.get(idx);
    if (!rec) return;
    for (const t of rec.platforms) {
      if (t._attached) continue;
      t._attached = true;
      this.solids.push(t);
      this.allTiles.push(t);
      if (t.mover) this.movers.push(t);
    }
    for (const t of rec.spikes) {
      if (t._attached) continue;
      t._attached = true;
      this.spikes.push(t);
      this.allTiles.push(t);
    }
    this.endlessActive.add(idx);
  }
  /* 区块回收：把该区块的瓦片从运行时数组摘除（几何仍留在区块表里，回头可原样重建）。 */
  markEndlessChunkInactive(idx) {
    if (!this.endlessChunks || !this.endlessActive.has(idx)) return;
    const rec = this.endlessChunks.get(idx);
    this.endlessActive.delete(idx);
    if (!rec) return;
    const set = new Set(rec.platforms.concat(rec.spikes));
    for (const t of set) t._attached = false;
    this.solids = this.solids.filter(t => !set.has(t));
    this.movers = this.movers.filter(t => !set.has(t));
    this.spikes = this.spikes.filter(t => !set.has(t));
    this.allTiles = this.allTiles.filter(t => !set.has(t));
  }
  /* 活动窗口：以相机为中心，激活进入窗口的区块、回收离开窗口的区块。
     每帧只处理边界区块，成本与「活动对象数」同阶，与已跑距离无关。
     前瞻与世界生成保持一致（viewW/2 + 6 格）；身后多保留 keepBehindCols 格。 */
  updateEndlessWindow(engine) {
    if (!this.endless || !this.endlessChunks || !this.endlessChunkPx) return;
    const camLeft = engine.camera.x - engine.viewW / 2;
    const camRight = engine.camera.x + engine.viewW / 2 + engine.tile * 6;
    const behind = engine.tile * this.endlessKeepBehindCols;
    let c0 = Math.floor((camLeft - behind) / this.endlessChunkPx);
    const c1 = Math.floor(camRight / this.endlessChunkPx);
    if (c0 < 0) c0 = 0;
    for (const idx of Array.from(this.endlessActive)) {
      if (idx < c0 || idx > c1) this.markEndlessChunkInactive(idx);
    }
    for (let i = c0; i <= c1; i++) this.markEndlessChunkActive(i);
  }
}
