/* ============================================================================
 * engine/level-surfaces.js —— 路线（route）数据的解析、校验与几何查询（AI-04A）
 * ----------------------------------------------------------------------------
 * 唯一职责：把 window.ROUTE_DATA.<key> 解析成可查询的内部结构，并提供：
 *   ① schema 有效性检查（validate，返回 { ok, errors }，不抛异常）；
 *   ② sampleRoute(t) 0—1 进度 → 面段投影（基础版：t 线性映射到关卡世界宽，
 *      AI-20 guided 若需沿曲线投影再在其批次内精确化，不在此引入第二套坐标）；
 *   ③ 支撑与落点判定（supported / landingReasonable）；
 *   ④ 区间查询（nearestSurface / segmentsInRange / nearestCheckpoint）。
 * 不承担（260917.4 §2.2）：输入监听、对白、图片缓存、生成器构成规则、
 *   导航网络查询（属 level-navigation.js）。
 * 数据无效时不抛异常：LevelNavigation 判定「不可用」→ 关卡走旧 tile 回退路径。
 * 加载顺序：level.js → level-surfaces.js → level-navigation.js（verify-boot ⑩A）。
 * ==========================================================================*/
'use strict';

class LevelSurfaces {
  constructor(data, world) {
    this.data = (data && typeof data === 'object') ? data : null;
    this.world = world || null;
    this.errors = [];
    this.ok = false;
    this.segments = [];          // 解析后的 surface（按 from 升序）
    this.points = [];
    this.checkpoints = [];
    this.gaps = [];
    this.hazards = [];
    this.anchors = { spawn: null, clues: [], exit: null };
    if (this.data) this._init();
  }
  /* ------------------------- ① schema 有效性检查 ------------------------- */
  static validate(data) {
    const errors = [];
    if (!data || typeof data !== 'object') return { ok: false, errors: ['数据非对象'] };
    const num01 = (v, label) => {
      if (typeof v !== 'number' || !isFinite(v) || v < 0 || v > 1) errors.push(label + ' 必须为 0—1 数值');
    };
    const arrayOf = (k) => Array.isArray(data[k]);
    for (const k of ['points', 'surfaces', 'gaps', 'hazards', 'checkpoints']) {
      if (!arrayOf(k)) errors.push(k + ' 必须是数组');
    }
    if (!data.anchors || typeof data.anchors !== 'object' || Array.isArray(data.anchors)) {
      errors.push('anchors 必须是对象 { spawn, clues, exit }');
    }
    const KIND = ['road', 'deck', 'roof', 'gantry', 'shelf', 'bridge'];
    for (const s of (data.surfaces || [])) {
      num01(s.from, 'surface.from'); num01(s.to, 'surface.to');
      if (s.from != null && s.to != null && s.from >= s.to) errors.push('surface from 必须小于 to');
      if (!KIND.includes(s.kind)) errors.push(`surface.kind 必须是 ${KIND.join('|')}，收到 ${s.kind}`);
      if (typeof s.top !== 'number' || s.top < 0) errors.push('surface.top 必须为 ≥0 数值（顶面格行）');
      if (typeof s.support !== 'number' || s.support < 0) errors.push('surface.support 必须为 ≥0 数值（格）');
    }
    for (const g of (data.gaps || [])) {
      num01(g.from, 'gap.from'); num01(g.to, 'gap.to');
      if (!['short', 'long'].includes(g.jump)) errors.push(`gap.jump 必须是 short|long，收到 ${g.jump}`);
      if (typeof g.margin !== 'number' || g.margin < 0.15) errors.push('gap.margin 必须 ≥ 0.15（落点容错下限）');
    }
    const HAZARD = ['lethal_static', 'lethal_timed', 'lethal_sweep', 'fall', 'gate'];
    for (const h of (data.hazards || [])) {
      num01(h.from, 'hazard.from'); num01(h.to, 'hazard.to');
      if (!HAZARD.includes(h.type)) errors.push(`hazard.type 必须是 ${HAZARD.join('|')}，收到 ${h.type}`);
      if (typeof h.telegraphMs !== 'number' || h.telegraphMs < 600) errors.push('hazard.telegraphMs 必须 ≥ 600（预警毫秒下限）');
    }
    for (const c of (data.checkpoints || [])) {
      num01(c.t, 'checkpoint.t');
      if (!Number.isInteger(c.col) || c.col < 0) errors.push('checkpoint.col 必须为 ≥0 整数');
      if (!Number.isInteger(c.row) || c.row < 0) errors.push('checkpoint.row 必须为 ≥0 整数');
      if (typeof c.w !== 'number' || c.w < 1) errors.push('checkpoint.w 必须为 ≥1 数值（可站立宽度格）');
    }
    for (const p of (data.points || [])) num01(p.t, 'point.t');
    if (data.anchors && typeof data.anchors === 'object') {
      for (const a of ['spawn', 'exit']) {
        const v = data.anchors[a];
        if (!v || typeof v !== 'object') errors.push(`anchors.${a} 缺失（{ t, col, row } 或格坐标）`);
        else if (v.t != null) num01(v.t, `anchors.${a}.t`);
        else if (!(typeof v.col === 'number' && typeof v.row === 'number')) errors.push(`anchors.${a} 需含 t(0—1) 或 col/row 数值`);
      }
      if (!Array.isArray(data.anchors.clues || [])) errors.push('anchors.clues 必须是数组');
    }
    return { ok: errors.length === 0, errors };
  }
  /* ------------------------------- 解析 ------------------------------- */
  _init() {
    const v = LevelSurfaces.validate(this.data);
    this.errors = v.errors;
    if (!v.ok) { this.ok = false; return; }
    this.segments = this.data.surfaces.slice().sort((a, b) => (a.from - b.from) || (a.to - b.to));
    this.points = this.data.points || [];
    this.checkpoints = this.data.checkpoints.slice().sort((a, b) => a.t - b.t);
    this.gaps = this.data.gaps;
    this.hazards = this.data.hazards;
    this.anchors = {
      spawn: this.data.anchors.spawn || null,
      clues: this.data.anchors.clues || [],
      exit: this.data.anchors.exit || null,
    };
    this.ok = true;
  }
  // 校验失败原因（供调试/诊断，不阻止回退）
  reasons() { return this.errors.slice(); }
  /* --------------------- ④ 区间查询 --------------------- */
  _segAt(t) {
    for (const s of this.segments) if (t >= s.from && t <= s.to) return s;
    return null;
  }
  nearestSurface(t) {
    let best = null, bestD = Infinity;
    for (const s of this.segments) {
      const d = (t < s.from) ? (s.from - t) : (t > s.to ? t - s.to : 0);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best ? { ...best, dist: bestD } : null;
  }
  segmentsInRange(a, b) {
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return this.segments.filter(s => s.to >= lo && s.from <= hi);
  }
  nearestCheckpoint(t) {
    let best = null, bestD = Infinity;
    for (const c of this.checkpoints) {
      const d = Math.abs(c.t - t);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }
  /* ------------------------ ② 投影 ------------------------ */
  // 基础投影：t 线性映射到关卡世界宽（需 world.cols/tile）。无面段或未命中返回 null。
  sampleRoute(t, world) {
    const seg = this._segAt(t);
    if (!seg) return null;
    const w = world || this.world;
    const T = (w && w.tile) || 1;
    const x = (w && typeof w.cols === 'number') ? t * w.cols * T : t;
    const y = (w && typeof w.rows === 'number') ? seg.top * T : null;
    return { t, kind: seg.kind, top: seg.top, support: seg.support, x, y };
  }
  /* ------------------------ ③ 判定 ------------------------ */
  // 支撑判定：显式支撑 / 下方紧邻面段（top 差 1 且落点重叠）视为有支撑
  supported(surface) {
    if (!surface) return false;
    if (surface.support > 0) return true;
    const lo = surface.from, hi = surface.to;
    return this.segments.some(o => o !== surface && o.top === surface.top + 1 &&
      o.to >= lo && o.from <= hi);
  }
  // 落点容错判定：gap.margin 缺省视为 0（不合格），≥0.15 才合格（§AI-04 验收下限）
  landingReasonable(gap) {
    return !!gap && typeof gap.margin === 'number' && gap.margin >= 0.15;
  }
  // 危险区命中：t 是否落在某 hazard 区间（本批 hazards 为空时恒 false）
  inHazard(t) {
    return this.hazards.some(h => t >= h.from && t <= h.to);
  }
}