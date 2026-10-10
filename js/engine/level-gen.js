/* ============================================================================
   level-gen.js —— Level 的程序化关卡生成方法组
   ------------------------------------------------------------
   由 level.js 机械拆出（原第 394-590 行），内容一字未改，仅补对象字面量的分隔逗号。
   承载：天空方块跑酷 / 天空地面障碍 / 单格瓦片生成器 / oasis 随机平台。
   记忆档案井（library）的实体攀爬架生成已拆到 level-gen-archive.js
   （该文件受 verify-lint「js/engine/*.js ≤ 500 行」红线约束）。
   加载顺序：必须在 level.js 之后（Level 是 class，存在 TDZ）、player.js 之前。
   ============================================================================ */
Object.assign(Level.prototype, {
  /* 天空跑酷（数据回廊 · 天空方块）：地面以上随机生成悬浮方块，
     其中一块位置固定（到达即触发扫雷）；地面层随机布置
     地刺/毒雾/突起实心块/可消融方块。参照「前往图书馆」跑酷。 */
  buildSkyParkour() {
    const cfg = this.def.skyParkour || {};

    /* E1/AI-04B：生成器参数若越出 route 数据 compose 区间，控制台告警（越界即配置错误；
       深度 clamp 接管属 AI-20/E3）。game.tileCompose=false 可静默。 */
    if (window.LevelCompose && this.engine.tileCompose !== false) {
      const _cv = LevelCompose.validateCompose(this.id, this.def);
      if (!_cv.ok) console.warn('[compose] ' + this.id + ':', _cv.errors.join('; '));
    }
    const T = this.engine.tile;
    const seed = (cfg.seed != null ? cfg.seed : Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    const rng = makeRng(seed);
    const rand = (a, b) => a + Math.floor(rng() * (b - a + 1));
    const used = new Set();
    /* 网格占用登记：手写关（失重舞厅）的地面/塌陷坑/边框不得被随机块压住。
       逐字符读 def.grid，非空格一律视为已占用（与 buildOasisParkour 同口径）。 */
    for (let r = 0; r < this.rows; r++) {
      const line = this.grid[r] || '';
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch !== '.' && ch !== ' ') used.add(c + ',' + r);
      }
    }
    // 固定块：位置固定，且是唯一带扫雷触发的方块。
    // 先划出「禁生区」(reserved)：随机悬浮块不得在固定块周围生成，
    // 保证固定块醒目、独立、便于辨识与落脚。
    const fixed = cfg.fixed || { col: Math.floor(this.cols / 2), row: 7, w: 3 };
    const fixedMargin = cfg.fixedMargin != null ? cfg.fixedMargin : 1;       // 左右/下方留白
    const fixedTopMargin = cfg.fixedTopMargin != null ? cfg.fixedTopMargin : 2; // 上方留白
    const reserved = new Set();
    for (let r = fixed.row - fixedTopMargin; r <= fixed.row + fixedMargin; r++) {
      for (let c = fixed.col - fixedMargin; c < fixed.col + fixed.w + fixedMargin; c++) {
        if (c >= 1 && c < this.cols - 1 && r >= 1 && r < this.rows - 2) {
          reserved.add(c + ',' + r);
        }
      }
    }
    const overlaps = (c, r, len) => {
      for (let i = 0; i < len; i++) {
        const k = (c + i) + ',' + r;
        if (used.has(k) || reserved.has(k)) return true;   // 已占用 或 位于固定块禁生区
      }
      return false;
    };
    const place = (c, r, len) => {
      c = Math.max(1, Math.min(c, this.cols - 1 - len));
      r = Math.max(1, Math.min(r, this.rows - 3));
      for (let i = 0; i < len; i++) used.add((c + i) + ',' + r);
      return this.addGeneratedSolid(c * T, r * T, len * T);   // 天空方块：实心，不可穿过
    };
    const fixedTile = place(fixed.col, fixed.row, fixed.w);
    /* fixedPlain：固定块也走普通平台整件图（失重舞厅：扫雷台不用专属方块外观） */
    if (fixedTile && !cfg.fixedPlain) fixedTile.special = 'minigame';
    this.minigameBlock = { col: fixed.col, row: fixed.row, w: fixed.w };

    if (Array.isArray(cfg.platforms)) {
      /* 手工固定布局（失重舞厅）：按配置列表逐块放置，位置固定、不随存档变化，
         也不登记为移动平台。主路径与额外随机块都不生成，平台总数与高度包络
         完全由 cfg.platforms 决定（可压缩到 ≤16 行）。每 checkpointEvery 块
         登记一个复生锚点（静止实心块，复生落脚稳定）。 */
      const every = cfg.checkpointEvery || 4;
      let hpIndex = 0;
      for (const p of cfg.platforms) {
        if (!p) continue;
        const len = Math.max(1, Math.round(p.w != null ? p.w : 2));
        place(p.col, p.row, len);
        hpIndex++;
        if (hpIndex % every === 0) this.genAnchorSpots.push({ col: p.col, row: p.row, w: len });
      }
      /* 2026-09-20 地形丰富化：在手工固态平台之外追加两类**静态写死**的平台
         （位置全部来自 story_config，不随机、不移动、不随存档变化）。
         只画/只生成几何，不登记复生锚点（锚点仍只在固态平台上，复生落脚才稳定）。 */
      for (const ow of (cfg.oneways || [])) {
        if (!ow) continue;
        const len = Math.max(1, Math.round(ow.w != null ? ow.w : 2));
        const c = Math.max(1, Math.min(ow.col, this.cols - 1 - len));
        const r = Math.max(1, Math.min(ow.row, this.rows - 3));
        this.addGeneratedPlatform(c * T, r * T, len * T);   // oneway：可跳穿 / 可站立
      }
      for (const bk of (cfg.blocks || [])) {
        if (!bk) continue;
        const len = Math.max(1, Math.round(bk.w != null ? bk.w : 1));
        for (let i = 0; i < len; i++) {
          const c = Math.max(1, Math.min(bk.col + i, this.cols - 2));
          const r = Math.max(1, Math.min(bk.row, this.rows - 3));
          this.addGeneratedTileAt('gold', c, r);            // block：能量墙外观，可按 E 消融
        }
      }
    } else {
      // 主路径（保证固定块可达）：起点 → 固定块左缘 → 固定块右缘 → 终点，分段插值
      const start = { col: cfg.startCol != null ? cfg.startCol : 4, row: cfg.startRow != null ? cfg.startRow : 12 };
      const end = { col: cfg.endCol != null ? cfg.endCol : this.cols - 5, row: cfg.endRow != null ? cfg.endRow : 12 };
      // 仅判断是否落在固定块禁生区（不判 used，避免主路径自重叠时被跳过而产生断点）
      const inReserved = (c, r, len) => {
        for (let i = 0; i < len; i++) if (reserved.has((c + i) + ',' + r)) return true;
        return false;
      };
      // D2：主路径块全局序号（起点→固定块、固定块→终点两段连续计数），
      // 每 checkpointEvery 块登记一个复生锚点（主路径块为静止实心块，复生落脚稳定）。
      let mpIndex = 0;
      const buildPath = (a, b) => {
        const dx = b.col - a.col, dy = b.row - a.row;
        const steps = Math.max(1, Math.ceil(Math.abs(dx) / 3), Math.ceil(Math.abs(dy) / 2));
        for (let s = 1; s < steps; s++) {
          const tx = a.col + Math.round((dx * s) / steps);
          const ty = a.row + Math.round((dy * s) / steps);
          const len = rand(2, 3);
          const nc = Math.max(2, Math.min(tx, this.cols - 2 - len));
          const nr = Math.max(1, Math.min(ty, this.rows - 3));
          if (inReserved(nc, nr, len)) continue;   // 主路径也不侵入固定块周围
          place(nc, nr, len);
          mpIndex++;
          if (mpIndex % (cfg.checkpointEvery || 4) === 0) this.genAnchorSpots.push({ col: nc, row: nr, w: len });
        }
      };
      buildPath(start, { col: fixed.col - fixed.w, row: fixed.row });
      buildPath({ col: fixed.col + fixed.w, row: fixed.row }, end);
      /* endPad：在终点补一块固定落台（主路径只插值到 end 之前，终点本身不生成）。
         失重舞厅的门前高台靠它落地，出口触发点也挂在这块上。 */
      if (cfg.endPad) {
        const w = cfg.endPadW || 3;
        const c = Math.max(2, Math.min(end.col, this.cols - 2 - w));
        const r = Math.max(1, Math.min(end.row, this.rows - 3));
        place(c, r, w);
      }

      // 额外随机悬浮方块：增加数量与随机感，不覆盖主路径
      const extra = cfg.extra != null ? cfg.extra : 14;
      const minRow = cfg.minRow != null ? cfg.minRow : 4;
      const maxRow = cfg.maxRow != null ? cfg.maxRow : 11;
      let added = 0, tries = 0;
      while (added < extra && tries++ < 1000) {
        const len = rand(cfg.minW || 2, cfg.maxW || 4);
        const rc = rand(2, this.cols - 2 - len);
        const rr = rand(minRow, maxRow);
        if (overlaps(rc, rr, len)) continue;
        // 仅随机多余平台登记为移动平台（主路径与固定扫雷块保持不动）
        this.markMover(place(rc, rr, len));
        added++;
      }
    }
    // 地面层障碍
    this.buildSkyGroundHazards(cfg.ground || {}, rng);
    this.skySeed = seed;
  },
  // 天空跑酷地面层障碍：地刺/毒雾/突起实心块/可消融方块，随机分布且留出安全落脚点
  buildSkyGroundHazards(g, rng) {
    const rand = (a, b) => a + Math.floor(rng() * (b - a + 1));
    const startCol = g.startCol != null ? g.startCol : 6;
    const endCol = g.endCol != null ? g.endCol : this.cols - 7;
    const minGap = g.minGap != null ? g.minGap : 2;
    // 地面层上方一格（缺省 rows=18 → row 13；可由 cfg.ground.row 显式指定）
    const row = g.row != null ? g.row : this.rows - 5;
    const pSpike = g.spikeChance || 0;
    const pPoison = g.poisonChance || 0;
    const pSolid = g.solidChance || 0;
    const pGold = g.goldChance || 0;
    let lastEnd = startCol - minGap;
    for (let c = startCol; c <= endCol; c++) {
      if (c - lastEnd < minGap) continue;
      const roll = rng();
      let kind = null;
      if (roll < pSpike) kind = 'spike';
      else if (roll < pSpike + pPoison) kind = 'poison';
      else if (roll < pSpike + pPoison + pSolid) kind = 'solid';
      else if (roll < pSpike + pPoison + pSolid + pGold) kind = 'gold';
      if (!kind) continue;
      let w = 1, h = 1;
      if (kind === 'spike' || kind === 'poison') w = Math.min(rand(1, 2), endCol - c + 1);
      else h = rand(1, 2);   // 突起实心块/可消融块：高 1~2 格
      for (let i = 0; i < w; i++) {
        for (let j = 0; j < h; j++) this.addGeneratedTileAt(kind, c + i, row - j);
      }
      lastEnd = c + w - 1;
      c = c + w - 1;
    }
  },
  // 按类型在指定格子生成单个瓦片（天空跑酷地面障碍用）
  addGeneratedTileAt(kind, col, row) {
    const T = this.engine.tile;
    const A = this.engine.cfg.assetsMap;
    const x = col * T, y = row * T;
    let tile = null;
    if (kind === 'spike') {
      tile = new Tile(x, y, T, T, 'spike', A.spike.color, A.spike.label || '');
      this.spikes.push(tile);
    } else if (kind === 'poison') {
      tile = new Tile(x, y, T, T, 'poison', (A.poison && A.poison.color) || '#6ee796', A.poison && A.poison.label, A.poison && A.poison.label_en);
      this.poisons.push(tile);
    } else if (kind === 'solid') {
      const color = (this.def.tileColors && this.def.tileColors.solid) || A.solid.color;
      tile = new Tile(x, y, T, T, 'solid', color, '');
      this.solids.push(tile);
    } else if (kind === 'gold') {
      const color = (A.gold && A.gold.color) || '#f0c869';
      tile = new Tile(x, y, T, T, 'block', color, '');
      this.solids.push(tile);   // 未消融前按实心墙处理
      this.blocks.push({ x, y, col, row, color: 'G', tile });
    }
    if (tile) this.allTiles.push(tile);
    return tile;
  },
  // oasis 随机平台（打破金字塔单调）：左右两侧各固定 N 块 + 中部 N 块中等偏大，
  // 位置/高度在区域内随机，且每块都必须「单跳可达」（从已有平台或地面起跳）。
  // 种子走 A4 存档（save.seeds.oasis），读档/刷新同一布局。
  buildOasisParkour() {
    const cfg = this.def.oasisParkour || {};

    /* E1/AI-04B：生成器参数若越出 route 数据 compose 区间，控制台告警（越界即配置错误；
       深度 clamp 接管属 AI-20/E3）。game.tileCompose=false 可静默。 */
    if (window.LevelCompose && this.engine.tileCompose !== false) {
      const _cv = LevelCompose.validateCompose(this.id, this.def);
      if (!_cv.ok) console.warn('[compose] ' + this.id + ':', _cv.errors.join('; '));
    }
    const T = this.engine.tile;
    const save = this.engine && this.engine.save;
    // 与 A4 的 seedFor 同口径：有存档时只认 save.seeds.oasis（缺则生成并落盘），
    // 无存档（无头测试）才回退 cfg.seed，保证「新档/清档换布局、读档复用」。
    let seed;
    if (save && save.seeds) {
      seed = save.seeds.oasis;
      if (seed == null) {
        seed = Math.floor(Math.random() * 0x7fffffff);
        save.seeds.oasis = seed;
        if (typeof save.persist === 'function') save.persist();
      }
    } else {
      seed = cfg.seed != null ? cfg.seed : Math.floor(Math.random() * 0x7fffffff);
    }
    cfg.seed = seed;
    const rng = makeRng(seed >>> 0);
    const rand = (a, b) => a + Math.floor(rng() * (b - a + 1));
    // 占用表（所有非空格，含原悬空平台/金墙/地刺/毒雾/边框/地面）+ 可跳达来源段
    const used = new Set();
    const platforms = [{ row: this.rows - 4, c0: 1, c1: this.cols - 2 }];   // 地面层（oasis row14）
    for (let r = 0; r < this.rows; r++) {
      const line = this.grid[r] || '';
      let c = 0;
      while (c < line.length) {
        const ch = line[c];
        if (ch === '-') {                        // 悬空平台段：既占用、也作为跳达来源
          const s = c;
          while (c < line.length && line[c] === '-') { used.add(c + ',' + r); c++; }
          platforms.push({ row: r, c0: s, c1: c - 1 });
        } else {
          if (ch !== '.' && ch !== ' ') used.add(c + ',' + r);
          c++;
        }
      }
    }
    const free = (c, r, len) => {
      if (c < 2 || c + len > this.cols - 2 || r < 4 || r > 12) return false;
      for (let i = -1; i <= len; i++) {
        if (used.has((c + i) + ',' + r) ||
            used.has((c + i) + ',' + (r - 1)) ||
            used.has((c + i) + ',' + (r + 1))) return false;
      }
      return true;
    };
    // 单跳可达（保守）：从某已有平台 p 起跳，升 ≤2 行且横向空档随高度收紧；
    // 同高或下落放宽到 3 格空档。
    const reachable = (c, r, len) => {
      const cLast = c + len - 1;
      for (const p of platforms) {
        let gap;
        if (cLast < p.c0) gap = p.c0 - cLast - 1;
        else if (c > p.c1) gap = c - p.c1 - 1;
        else gap = 0;                            // 列重叠 = 正上/正下
        const rise = p.row - r;                  // >0：新块更高
        if (rise <= 0) { if (gap <= 3) return true; }
        else if (rise === 1) { if (gap <= 2) return true; }
        else if (rise === 2) { if (gap <= 1) return true; }
      }
      return false;
    };
    const place = (c, r, len) => {
      for (let i = 0; i < len; i++) used.add((c + i) + ',' + r);
      const t = this.addGeneratedSolid(c * T, r * T, len * T);
      if (t) t.special = 'oasis_random';
      platforms.push({ row: r, c0: c, c1: c + len - 1 });   // 新块成为后续可达来源
      return t;
    };
    const range = (v, d) => (Array.isArray(v) && v.length === 2 ? v : d);
    const sideW = range(cfg.sideW, [2, 3]);
    const midW = range(cfg.middleW, [4, 5]);
    const spawnChance = cfg.spawnChance != null ? cfg.spawnChance : 1;
    const tryPlace = (region, count, w) => {
      for (let n = 0; n < count; n++) {
        if (rng() > spawnChance) continue;       // 是否生成（默认必生成）
        for (let t = 0; t < 80; t++) {
          const len = rand(w[0], w[1]);
          const hi = Math.max(region.c0, region.c1 - len);
          const c = rand(region.c0, hi);
          const r = rand(region.r0, region.r1);
          if (!free(c, r, len) || !reachable(c, r, len)) continue;
          place(c, r, len);
          break;
        }
      }
    };
    const R = cfg.regions || {};
    const sideCount = cfg.sideCount != null ? cfg.sideCount : 2;
    const midCount = cfg.middleCount != null ? cfg.middleCount : 2;
    tryPlace(R.left || { c0: 3, c1: 14, r0: 5, r1: 12 }, sideCount, sideW);
    tryPlace(R.right || { c0: 36, c1: 49, r0: 5, r1: 12 }, sideCount, sideW);
    tryPlace(R.middle || { c0: 15, c1: 35, r0: 6, r1: 11 }, midCount, midW);
  },
});
