/* ============================================================================
 * engine/level-compose.js —— 区间受控构成：物理上限、compose 校验、几何检查、
 *                            灰盒叠加层（E1 / AI-04B+04C 核心库）
 * ----------------------------------------------------------------------------
 * 唯一职责（260917.4 AI-04 卡 + 260918 并行方案 AI-A/E1）：
 *   ① capabilities()：从 player.js 物理真值（runSpeed / jumpSpeed / gravity /
 *      fallSpeed / jumpHBoost，tile=48）**帧模拟**推导跳跃能力上限——不手算公式；
 *   ② validateCompose()：route 数据 compose 段（生成器构成区间）与 story_config
 *      生成器参数一致性校验，越界即配置错误（返回 errors，不抛异常）；
 *   ③ checkLevel()：对真实 Level 实例做六项构成检查——
 *      Ⅰ 无孤立 1 格平台（w<2 必须属 shelf 且带 support）；
 *      Ⅱ 跳距 ≤ 物理上限 × 0.85（沿 BFS 路径逐边）；
 *      Ⅲ 落点台宽 ≥ 2 格（落点容错 ≥15% 的几何等价）；
 *      Ⅳ 危险物语义覆盖：spike/poison ⊆ lethal_* 区间、gold ⊆ gate 区间、
 *         telegraphMs ≥ 600（周期/清扫类必须有预警字段）；
 *      Ⅴ 锚点周期：compose.anchorEvery 包络含 cfg.checkpointEvery，且 ≤ 6；
 *      Ⅵ BFS：从 anchors.spawn 到 anchors.exit 全可达，失败报出具体区段；
 *   ④ drawDebug()：game.tileDebug = true 时的灰盒叠加层（顶面线/断口/危险区/
 *      锚点/支撑轮廓）。本批不接任何正式图。
 * 边界：不承担输入监听、对白、图片缓存（§2.2）；不改碰撞——本模块只读几何。
 * 回退：本文件缺失时消费方必须原样走旧路径（挂钩用存在性判断）；
 *   game.tileCompose = false 仅作为「运行期 clamp 钩子」的开关位（钩子属热点补丁）。
 * 加载顺序：level.js 之后（需要 Level 实例传入，不在加载期依赖）、
 *   level-surfaces.js 之后（复用其 schema 常量语义）、level-gen.js 之前。
 * ==========================================================================*/
'use strict';
window.LevelCompose = (function () {

  /* ------------------------- ① 物理真值 → 能力上限 ------------------------- */
  /* 从配置读物理参数（与 Player 构造同缺省值；level.def.physics 可按关覆盖） */
  function physicsOf(cfg) {
    const p = (cfg && cfg.physics) || {};
    return {
      runSpeed: p.runSpeed != null ? p.runSpeed : 5,
      jumpSpeed: p.jumpSpeed != null ? p.jumpSpeed : -17,
      gravity: p.gravity != null ? p.gravity : 1.4,
      fallSpeed: p.fallSpeed != null ? p.fallSpeed : 13,
      jumpHBoost: p.jumpHBoost != null ? p.jumpHBoost : 3,
    };
  }
  /* 帧模拟一次「最多 maxJumps 段跳」的弧线（后续跳在到达本段最高点的下一帧触发，
     与 player.js 的 vy 重置时机同口径），返回落到 riseRows 行（>0 更高、<0 更低、
     0 同层）时的水平距离（格）。坐标取屏幕系（竖直向下为正，与 vy/gravity 同号），
     上升 = 位移为负。不可达返回 null。 */
  function jumpDistanceTiles(phy, riseRows, maxJumps, tile) {
    const target = -riseRows * tile;          // 目标层屏幕位移（更高 = 负）
    /* 理论最大爬升高度（全部跳跃都取满）：jumpSpeed²/(2g) × 段数 */
    const apexPerJump = (phy.jumpSpeed * phy.jumpSpeed) / (2 * phy.gravity);
    const maxApex = apexPerJump * maxJumps;
    if (riseRows > 0 && riseRows * tile > maxApex - 0.001) return null;
    let h = 0, vy = phy.jumpSpeed, x = phy.jumpHBoost, jumpsUsed = 1;
    for (let f = 1; f <= 1200; f++) {
      h += vy;
      vy = Math.min(vy + phy.gravity, phy.fallSpeed);
      x += phy.runSpeed;
      /* 下一帧进入下落 = 本帧是最高点；还有剩余段数则在最高点再跳 */
      if (vy >= 0 && jumpsUsed < maxJumps) { vy = phy.jumpSpeed; jumpsUsed++; continue; }
      if (vy > 0 && h >= target) return x / tile;   // 下落穿过目标高度 = 落地
    }
    return null;
  }
  /* 能力表：caps[rise] = 该升umprow 下的最大跳距（格）；allowed = cap × 0.85 */
  const SAFETY = 0.85;   // §AI-04 检查 2：跳距 ≤ 上限 × 0.85
  function capabilities(phy, maxJumps, tile) {
    phy = physicsOf({ physics: phy });
    const caps = {};
    let maxRise = 0;
    for (let rise = 0; rise <= 24; rise++) {
      const d = jumpDistanceTiles(phy, rise, maxJumps, tile);
      if (d == null) break;
      caps[rise] = d;
      maxRise = rise;
    }
    for (let drop = 1; drop <= 10; drop++) {
      const d = jumpDistanceTiles(phy, -drop, maxJumps, tile);
      if (d == null) break;
      caps[-drop] = d;
    }
    return { caps, maxRise, SAFETY, allowed(rise) {
      const c = caps[rise];
      return c == null ? -1 : c * SAFETY;
    } };
  }

  /* --------------------- ② compose 段校验（配置层） --------------------- */
  const within = (v, iv) => Array.isArray(iv) && v >= iv[0] && v <= iv[1];
  function validateCompose(mapId, def) {
    const errors = [];
    const data = (typeof window !== 'undefined' && window.ROUTE_DATA) ? window.ROUTE_DATA[mapId] : null;
    const compose = data && data.compose;
    if (!compose) return { ok: false, errors: [`ROUTE_DATA.${mapId} 缺 compose 段`], compose: null };
    const gens = compose.generators || {};
    const g = def || {};
    /* ladderParkour：横向步长 / 竖向步长 / 平台宽 / extra / 锚点周期 */
    if (gens.ladderParkour) {
      const b = gens.ladderParkour, c = g.ladderParkour || {};
      if (!(c.stepCols || 3) || !within(c.stepCols || 3, b.gap)) errors.push(`ladderParkour.stepCols=${c.stepCols || 3} 越出 compose.gap [${b.gap}]`);
      if (!within(c.stepRows || 2, b.rise)) errors.push(`ladderParkour.stepRows=${c.stepRows || 2} 越出 compose.rise [${b.rise}]`);
      if (!within(c.extra != null ? c.extra : 18, b.extraCount || [0, 99])) errors.push(`ladderParkour.extra=${c.extra} 越出 compose.extraCount [${b.extraCount}]`);
      if (!within(c.checkpointEvery || 4, b.anchorEvery)) errors.push(`ladderParkour.checkpointEvery 越出 compose.anchorEvery [${b.anchorEvery}]`);
      if (c.startLen && !within(c.startLen, b.width)) errors.push(`ladderParkour.startLen=${c.startLen} 越出 compose.width [${b.width}]`);
    }
    /* skyParkour：宽/行距/步长/extra/锚点周期 + 地面危险密度 */
    if (gens.skyParkour) {
      const b = gens.skyParkour, c = g.skyParkour || {};
      if (!within(c.minW != null ? c.minW : 2, b.width) || !within(c.maxW != null ? c.maxW : 4, b.width)) {
        errors.push(`skyParkour.minW/maxW=${c.minW}/${c.maxW} 越出 compose.width [${b.width}]`);
      }
      if (!within(c.minRow != null ? c.minRow : 4, b.rowRange) || !within(c.maxRow != null ? c.maxRow : 11, b.rowRange)) {
        errors.push(`skyParkour.minRow/maxRow=${c.minRow}/${c.maxRow} 越出 compose.rowRange [${b.rowRange}]`);
      }
      if (!within(c.extra != null ? c.extra : 14, b.extraCount || [0, 99])) errors.push(`skyParkour.extra=${c.extra} 越出 compose.extraCount [${b.extraCount}]`);
      if (!within(c.checkpointEvery || 4, b.anchorEvery)) errors.push(`skyParkour.checkpointEvery 越出 compose.anchorEvery [${b.anchorEvery}]`);
      const d = b.hazardDensity, gc = c.ground || {};
      if (d) {
        for (const k of ['spike', 'poison', 'solid', 'gold']) {
          if (gc[k + 'Chance'] != null && !within(gc[k + 'Chance'], d[k])) {
            errors.push(`skyParkour.ground.${k}Chance=${gc[k + 'Chance']} 越出 compose.hazardDensity.${k} [${d[k]}]`);
          }
        }
        if (gc.minGap != null && !within(gc.minGap, d.minSafeGap)) errors.push(`skyParkour.ground.minGap=${gc.minGap} 越出 [${d.minSafeGap}]`);
      }
    }
    /* oasisParkour：区域行包络 / 平台宽 / 段内块数 */
    if (gens.oasisParkour) {
      const b = gens.oasisParkour, c = g.oasisParkour || {};
      if (!within(c.sideW ? c.sideW[0] : 2, b.width) || !within(c.middleW ? c.middleW[1] : 5, b.width)) {
        errors.push(`oasisParkour.sideW/middleW=${JSON.stringify(c.sideW)}/${JSON.stringify(c.middleW)} 越出 compose.width [${b.width}]`);
      }
      if (!within(c.sideCount != null ? c.sideCount : 2, b.countPerSegment) ||
          !within(c.middleCount != null ? c.middleCount : 2, b.countPerSegment)) {
        errors.push(`oasisParkour.sideCount/middleCount 越出 compose.countPerSegment [${b.countPerSegment}]`);
      }
      const R = c.regions || {};
      for (const k of Object.keys(R)) {
        if (!within(R[k].r0, b.rowRange) || !within(R[k].r1, b.rowRange)) {
          errors.push(`oasisParkour.regions.${k} 行包络越出 compose.rowRange [${b.rowRange}]`);
        }
      }
    }
    /* endless：层参数（宽/间距/行包络）+ 锚点周期 */
    if (gens.endless) {
      const b = gens.endless, c = g.endless || {};
      const layers = c.layers || [];
      for (let i = 0; i < layers.length; i++) {
        const ly = layers[i];
        if (!within(ly.minW != null ? ly.minW : 2, b.width) || !within(ly.maxW != null ? ly.maxW : 4, b.width)) {
          errors.push(`endless.layers[${i}] minW/maxW 越出 compose.width [${b.width}]`);
        }
        if (!within(ly.minGap != null ? ly.minGap : 1, b.gap) || !within(ly.maxGap != null ? ly.maxGap : 3, b.gap)) {
          errors.push(`endless.layers[${i}] minGap/maxGap 越出 compose.gap [${b.gap}]`);
        }
        if (!within(ly.minY != null ? ly.minY : 5, b.rowRange) || !within(ly.maxY != null ? ly.maxY : 9, b.rowRange)) {
          errors.push(`endless.layers[${i}] minY/maxY 越出 compose.rowRange [${b.rowRange}]`);
        }
      }
      if (!within(c.checkpointEvery || 5, b.anchorEvery)) errors.push(`endless.checkpointEvery 越出 compose.anchorEvery [${b.anchorEvery}]`);
    }
    return { ok: errors.length === 0, errors, compose };
  }

  /* ------------------- ③ 段提取（真实 Level 实例 → 几何段） ------------------- */
  /* 把 solids + oneways 折叠成「可站面段」[{ row, c0, c1, width, solid }]。
     grid 静态瓦片与生成瓦片在 buildTiles / addGenerated* 里都已进入这两组数组，
     因此这里读到的 = 运行期真实碰撞面。移动平台取基准位（构造期坐标）。 */
  function segmentsFromLevel(level) {
    const T = level.engine.tile;
    const cells = new Map();   // row → Set(col)
    const collect = (tiles) => {
      for (const t of (tiles || [])) {
        const row = Math.round(t.y / T);
        const c0 = Math.round(t.x / T);
        const c1 = Math.round((t.x + t.w) / T) - 1;
        if (!cells.has(row)) cells.set(row, new Set());
        const set = cells.get(row);
        for (let c = c0; c <= c1; c++) set.add(c);
      }
    };
    collect(level.solids);
    collect(level.oneways);
    const segs = [];
    for (const [row, set] of cells) {
      const cols = Array.from(set).sort((a, b) => a - b);
      let s = cols[0], prev = cols[0];
      for (let i = 1; i <= cols.length; i++) {
        const c = cols[i];
        if (c !== prev + 1) {
          segs.push({ row, c0: s, c1: prev, width: prev - s + 1 });
          s = c;
        }
        prev = c;
      }
    }
    segs.sort((a, b) => (a.row - b.row) || (a.c0 - b.c0));
    return segs;
  }
  /* 危险物格坐标（spike/poison/gold） */
  function hazardsFromLevel(level) {
    const T = level.engine.tile;
    const of = t => ({ col: Math.round(t.x / T), row: Math.round(t.y / T), w: Math.round(t.w / T) });
    return {
      spikes: (level.spikes || []).map(of),
      poisons: (level.poisons || []).map(of),
      golds: (level.blocks || []).filter(b => b.color === 'G').map(b => ({ col: b.col, row: b.row, w: 1 })),
    };
  }

  /* ------------------------ ④ 六项构成检查（核心） ------------------------ */
  /* opts: { routeData, def, maxJumps, kindShelfOk }；返回 { ok, checks, report } */
  function checkLevel(level, opts) {
    opts = opts || {};
    const T = level.engine.tile;
    const mapId = level.id;
    const def = level.def;
    const route = opts.routeData || ((typeof window !== 'undefined' && window.ROUTE_DATA) ? window.ROUTE_DATA[mapId] : null);
    const checks = {};
    const details = { gaps: [], pathLen: 0, minLanding: Infinity, capRatioMax: 0 };

    const segs = segmentsFromLevel(level);
    const haz = hazardsFromLevel(level);
    const jumpGrade = (route && route.compose && route.compose.jumpGrade) || 'single';
    const maxJumps = opts.maxJumps != null ? opts.maxJumps
      : (def.maxJumps != null ? def.maxJumps : (jumpGrade === 'double' ? 2 : 1));
    const caps = capabilities(def.physics, maxJumps, T);

    /* 检查 Ⅰ：无孤立 1 格平台（w<2 且无支撑才违规——贴地凸块/边界墙柱/
       世界底行角块下方有支撑（紧邻可站面、下一行或地图底边），不算孤立；
       与 LevelSurfaces.supported 的「下方紧邻面段」同一口径。
       悬空平台 w<2 必须属 shelf 且带 support（route 数据层判定）。 */
    const segAt = (r, c) => segs.some(s => s.row === r && c >= s.c0 && c <= s.c1);
    const bottomRow = (level.rows || 0) - 1;
    const orphans = segs.filter(s => {
      if (s.width >= 2) return false;
      if (s.row >= bottomRow) return false;               // 世界底边即支撑
      for (let c = s.c0; c <= s.c1; c++) {
        if (segAt(s.row + 1, c) || segAt(s.row + 2, c)) return false;   // 下方 2 行内有支撑
      }
      return true;
    });
    checks.isolated = { ok: orphans.length === 0, orphans };

    /* 检查 Ⅵ（含 Ⅱ/Ⅲ）：BFS spawn → exit，逐边校验跳距与落点台宽 */
    const findSeg = (col, row, atOrBelow) => {
      let best = null;
      for (const s of segs) {
        if (col < s.c0 || col > s.c1) continue;
        if (atOrBelow ? s.row >= row : s.row === row) {
          if (!best || s.row < best.row) best = s;   // 最高可站面
        }
      }
      return best;
    };
    const sp = def.spawn || {};
    const start = findSeg(sp.col, sp.row, false) || findSeg(sp.col, sp.row, true);
    /* 出口锚点：route.anchors.exit 优先（trigger 行可能高于站立面，取其下方最高可站面） */
    const ex = (route && route.anchors && route.anchors.exit) || null;
    const goal = ex ? findSeg(ex.col, ex.row != null ? ex.row : sp.row, true) : null;
    const key = s => `${s.row}:${s.c0}`;
    const prev = new Map();
    const seen = new Set(start ? [key(start)] : []);
    const queue = start ? [start] : [];
    let reached = null;
    while (queue.length && !reached) {
      const cur = queue.shift();
      if (goal && cur === goal) { reached = cur; break; }
      for (const nxt of segs) {
        if (nxt === cur || seen.has(key(nxt))) continue;
        /* 有向：空档按列区间计算（左右皆可） */
        const gap = nxt.c0 > cur.c1 ? nxt.c0 - cur.c1 - 1
          : (cur.c0 > nxt.c1 ? cur.c0 - nxt.c1 - 1 : 0);
        const rise = cur.row - nxt.row;            // >0 = 目标更高
        if (rise > caps.maxRise) continue;
        const allowed = caps.allowed(rise);
        if (gap > allowed) continue;
        if (nxt.width < 2) continue;               // 检查 Ⅲ：落点台宽 ≥2
        seen.add(key(nxt));
        prev.set(key(nxt), { from: cur, gap, rise, allowed });
        queue.push(nxt);
      }
      if (!goal && queue.length) reached = queue[queue.length - 1]; // 无 exit 锚点时不强求
    }
    const path = [];
    if (reached) {
      let k = reached;
      while (k) {
        const p = prev.get(key(k));
        path.unshift(k);
        if (p) {
          details.gaps.push({ gap: p.gap, rise: p.rise, cap: caps.caps[p.rise], allowed: p.allowed });
          details.capRatioMax = Math.max(details.capRatioMax, p.gap / (p.allowed > 0 ? p.allowed : 1));
        }
        k = p ? p.from : null;
      }
    }
    details.pathLen = path.length;
    /* 最短落点台宽：沿路径相邻段 */
    let minLanding = Infinity;
    for (let i = 1; i < path.length; i++) minLanding = Math.min(minLanding, path[i].width);
    if (path.length) details.minLanding = minLanding;
    checks.reachable = {
      ok: !!reached && !!goal,
      reached: !!reached,
      start: start ? { row: start.row, c0: start.c0, c1: start.c1 } : null,
      goal: goal ? { row: goal.row, c0: goal.c0, c1: goal.c1 } : null,
      pathLen: path.length,
    };
    /* 检查 Ⅱ/Ⅲ 断言：路径逐边 gap ≤ allowed、台宽 ≥2（BFS 边条件即保证） */
    const overGap = details.gaps.filter(g => g.gap > g.allowed);
    checks.gapCaps = { ok: overGap.length === 0, over: overGap };
    checks.landing = { ok: !isFinite(minLanding) || minLanding >= 2, minLanding };

    /* 检查 Ⅳ：危险物语义覆盖。gold 块：地图存在 gate 区间时按 gate 检查
       （金墙闸门），否则按可消融地障接受 lethal_* 覆盖。
       区间端点 to≈1 / from≈0 视为 ±∞（endless 无尽区向右无限延伸）。 */
    const hz = (route && route.hazards) || [];
    const hasGate = hz.some(h => h.type === 'gate');
    const covered = (col, types) => hz.some(h => types.includes(h.type) &&
      col >= (h.from <= 0 ? -Infinity : h.from * (level.cols - 1) - 0.5) &&
      col <= (h.to >= 1 - 1e-9 ? Infinity : h.to * (level.cols - 1) + 0.5));
    const unCov = [];
    for (const s of haz.spikes) if (!covered(s.col, ['lethal_static', 'lethal_timed', 'lethal_sweep', 'fall'])) unCov.push({ kind: 'spike', ...s });
    for (const s of haz.poisons) if (!covered(s.col, ['lethal_static', 'lethal_timed', 'lethal_sweep', 'fall'])) unCov.push({ kind: 'poison', ...s });
    for (const s of haz.golds) if (!covered(s.col, hasGate ? ['gate'] : ['gate', 'lethal_static', 'lethal_timed', 'lethal_sweep'])) unCov.push({ kind: 'gold', ...s });
    const badTele = hz.filter(h => typeof h.telegraphMs !== 'number' || h.telegraphMs < 600);
    const needTele = hz.filter(h => (h.type === 'lethal_timed' || h.type === 'lethal_sweep') && h.telegraphMs == null);
    checks.hazards = { ok: unCov.length === 0 && badTele.length === 0 && needTele.length === 0,
      uncovered: unCov, badTele, needTele, count: haz.spikes.length + haz.poisons.length + haz.golds.length };

    /* 检查 Ⅴ：锚点周期（compose 层 + 运行层） */
    const composeV = validateCompose(mapId, def);
    checks.compose = composeV;
    const ae = [];
    const gens = (route && route.compose && route.compose.generators) || {};
    for (const k of Object.keys(gens)) if (gens[k] && gens[k].anchorEvery) ae.push({ gen: k, iv: gens[k].anchorEvery });
    const anchorBad = ae.filter(e => e.iv[1] > 6);
    const runtimeAnchors = (level.genAnchorSpots || []);
    const needRuntime = ae.some(e => e.iv[1] > 0);
    checks.anchors = {
      ok: anchorBad.length === 0 && (!needRuntime || runtimeAnchors.length > 0) && composeV.ok,
      anchorEvery: ae, anchorBad, runtimeAnchorCount: runtimeAnchors.length, composeErrors: composeV.errors,
    };

    const ok = Object.keys(checks).every(k => checks[k].ok !== false);
    return { ok, checks, details: { ...details, minLanding }, segments: segs, caps, maxJumps, jumpGrade };
  }

  /* 静态断口跳距检查（检查 Ⅱ 的数据层）：route.gaps 逐个换算格数
     （(to-from)×(cols-1) 四舍五入），要求 ≤ allowed(0)（同层上限最保守）；
     jump 'long' 按双跳上限。返回 { skip, over, n }。 */
  function checkStaticGaps(mapId) {
    const data = (typeof window !== 'undefined' && window.ROUTE_DATA) ? window.ROUTE_DATA[mapId] : null;
    if (!data || !Array.isArray(data.gaps) || !data.gaps.length) return { skip: true, over: [], n: 0 };
    const grade = (data.compose && data.compose.jumpGrade === 'double') ? 2 : 1;
    const cfg = (typeof window !== 'undefined' && window.STORY_CONFIG) || {};
    const cols = (cfg.maps && cfg.maps[mapId] && cfg.maps[mapId].grid[0].length - 1) || 1;
    const caps = capabilities(cfg.physics, grade, (cfg.meta && cfg.meta.tile) || 48);
    const over = [];
    data.gaps.forEach((g, i) => {
      const tiles = Math.round((g.to - g.from) * cols);
      const allowed = caps.allowed(0);
      if (tiles > allowed) over.push({ i, tiles, allowed: +allowed.toFixed(2) });
    });
    return { skip: false, over, n: data.gaps.length };
  }

  /* ------------------------ ⑤ 灰盒叠加层（game.tileDebug） ------------------------ */
  /* 顶面线（绿）/ 断口（黄）/ 危险区（红）/ 锚点（蓝）/ 支撑轮廓（紫）。
     挂钩（热点补丁，1 行，由主控合并进渲染路径）：
       if (this.tileDebug && window.LevelCompose) LevelCompose.drawDebug(ctx, this); */
  function drawDebug(ctx, engine) {
    const L = engine.level;
    if (!L || !L.id) return;
    const T = engine.tile;
    const segs = segmentsFromLevel(L);
    ctx.save();
    /* 支撑轮廓（紫）：悬空段向下画支撑参考线 */
    ctx.strokeStyle = 'rgba(170,120,255,0.5)';
    ctx.lineWidth = 1;
    const route = (window.ROUTE_DATA && ROUTE_DATA[L.id]) || null;
    for (const s of segs) {
      const below = segs.find(o => o !== s && o.row > s.row && o.c0 <= s.c1 && o.c1 >= s.c0);
      if (below) {
        ctx.beginPath();
        ctx.moveTo((s.c0 + 0.5) * T, (s.row + 1) * T);
        ctx.lineTo((s.c0 + 0.5) * T, (below.row) * T);
        ctx.stroke();
      }
    }
    /* 顶面线（绿） */
    ctx.strokeStyle = 'rgba(80,240,140,0.9)';
    ctx.lineWidth = 2;
    for (const s of segs) {
      ctx.beginPath();
      ctx.moveTo(s.c0 * T, s.row * T);
      ctx.lineTo((s.c1 + 1) * T, s.row * T);
      ctx.stroke();
    }
    /* 危险区（红）/ 断口（黄）：来自 route 数据（数据即真值） */
    if (route) {
      const cols = L.cols - 1;
      ctx.fillStyle = 'rgba(255,80,80,0.25)';
      for (const h of (route.hazards || [])) {
        ctx.fillRect(h.from * cols * T, 0, (h.to - h.from) * cols * T, L.rows * T);
      }
      ctx.fillStyle = 'rgba(255,220,60,0.35)';
      for (const g of (route.gaps || [])) {
        ctx.fillRect(g.from * cols * T, 0, Math.max(T * 0.3, (g.to - g.from) * cols * T), L.rows * T);
      }
    }
    /* 锚点（蓝）：复生锚点 + spawn/exit */
    ctx.fillStyle = 'rgba(90,160,255,0.9)';
    for (const a of (L.genAnchorSpots || [])) {
      ctx.fillRect(a.col * T + T * 0.25, a.row * T - T * 0.5, T * 0.5, T * 0.5);
    }
    if (route && route.anchors) {
      for (const k of ['spawn', 'exit']) {
        const a = route.anchors[k];
        if (a && a.col != null) {
          ctx.strokeStyle = 'rgba(90,160,255,0.9)';
          ctx.strokeRect(a.col * T, a.row * T - T, T, T * 2);
        }
      }
    }
    ctx.restore();
  }

  return {
    physicsOf, jumpDistanceTiles, capabilities,
    validateCompose, checkStaticGaps, segmentsFromLevel, hazardsFromLevel,
    checkLevel, drawDebug, SAFETY,
  };
})();
