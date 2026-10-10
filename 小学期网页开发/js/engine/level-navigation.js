/* ============================================================================
 * engine/level-navigation.js —— 路线 / 导航数据的取得、解析、可用性与导航查询
 * ----------------------------------------------------------------------------
 * 职责（AI-02 骨架 → AI-04A 实装）：
 *   ① 把 STORY_CONFIG 上的 route: / navigation: 键解析成全局数据对象；
 *   ② 用 LevelSurfaces 对 route 做 schema 有效性检查；对 nav 做轻量校验
 *      （node id 唯一、edge 引用存在、anchors 齐全）；
 *   ③ 给出「本关是否有可用空间数据」的判定（available()）；
 *   ④ 投影采样（sample(t) 委托 LevelSurfaces）与导航网查询
 *      （neighbors / navPath / anchorOf）。
 * 数据无效 / 脚本缺失 / 键缺失 ⇒ 判定「不可用」，关卡走旧 tile 回退路径，
 *   不抛异常、不白屏（四类回退见 AI-02 批注）。
 * 禁止承担（260917.4 §2.2 职责表）：输入监听、对白、图片缓存、生成器构成规则。
 * 加载顺序：level.js → level-surfaces.js → level-navigation.js → level-gen.js。
 *   依赖 LevelSurfaces：本文件用 typeof 守卫，脚本缺失时自身退化（仍可测深）。
 * ==========================================================================*/
'use strict';

class LevelNavigation {
  constructor(def, tile) {
    this.def = def || null;
    this.tile = tile || 32;
    this.routeKey = '';
    this.navKey = '';
    this.route = null;
    this.nav = null;
    this.surfaces = null;     // LevelSurfaces 实例（route 数据有效时）
    this.navNodes = new Map(); // id → { id, col, row }
    this.navEdges = [];
    this.navOk = false;
    this.ok = false;
    this.attach(def);
  }
  /* 全局命名空间容器；无 window 时退回 globalThis，仍无则空对象（隔离测试用）。
     只读，不新增自造全局。 */
  static bag(name) {
    const g = (typeof window !== 'undefined' && window) ? window
      : (typeof globalThis !== 'undefined' && globalThis) ? globalThis : null;
    const v = g ? g[name] : null;
    return (v && typeof v === 'object') ? v : {};
  }
  static pick(kind, key) {
    if (!key || typeof key !== 'string') return null;
    const v = LevelNavigation.bag(kind)[key];
    return (v && typeof v === 'object') ? v : null;
  }
  static route(key) { return LevelNavigation.pick('ROUTE_DATA', key); }
  static nav(key) { return LevelNavigation.pick('NAV_DATA', key); }
  /* 空间数据量：surfaces / points / nodes 任一非空即视为「有空间数据」（兼容探测） */
  static countOf(data) {
    if (!data || typeof data !== 'object') return 0;
    for (const k of ['surfaces', 'points', 'nodes']) {
      if (Array.isArray(data[k]) && data[k].length) return data[k].length;
    }
    return 0;
  }
  /* 导航数据轻量校验：nodes 存在且 id 唯一、edges 引用存在、anchors 齐全 */
  static validateNav(data) {
    const errors = [];
    if (!data || typeof data !== 'object') return { ok: false, errors: ['导航数据非对象'] };
    if (!Array.isArray(data.nodes) || !data.nodes.length) errors.push('nav.nodes 必须为非空数组');
    if (!Array.isArray(data.edges)) errors.push('nav.edges 必须是数组');
    if (!Array.isArray(data.polygons)) errors.push('nav.polygons 必须是数组');
    const ids = new Set();
    for (const n of (data.nodes || [])) {
      if (!n || typeof n.id !== 'string') { errors.push('nav.node.id 必须为字符串'); continue; }
      if (ids.has(n.id)) { errors.push(`nav.node.id 重复：${n.id}`); continue; }
      if (typeof n.col !== 'number' || typeof n.row !== 'number') errors.push(`nav.node ${n.id} 缺 col/row`);
      ids.add(n.id);
    }
    for (const e of (data.edges || [])) {
      if (!e || !ids.has(e.a) || !ids.has(e.b)) errors.push(`nav.edge 引用了不存在的节点：${e && e.a}—${e && e.b}`);
      if (e && (typeof e.w !== 'number' || e.w < 0)) errors.push('nav.edge.w 必须为 ≥0 数值');
    }
    const A = (data.anchors && typeof data.anchors === 'object') ? data.anchors : {};
    for (const a of ['spawn', 'exit']) {
      const v = A[a];
      if (!v || typeof v === 'number' || typeof v !== 'object') errors.push(`nav.anchors.${a} 缺失（{ col, row }）`);
      else if (typeof v.col !== 'number' || typeof v.row !== 'number') errors.push(`nav.anchors.${a} 需含 col/row 数值`);
    }
    return { ok: errors.length === 0, errors };
  }
  /* 重新绑定关卡定义并刷新可用性；返回是否可用 */
  attach(def) {
    if (def) {
      this.def = def;
      this.routeKey = def.route || '';
      this.navKey = def.navigation || '';
    }
    this.route = LevelNavigation.route(this.routeKey);
    this.nav = LevelNavigation.nav(this.navKey);
    const world = (this.def && this.def.grid && typeof this.def.grid === 'object')
      ? { cols: this.def.grid[0] ? this.def.grid[0].length : 0,
          rows: this.def.grid.length, tile: this.tile } : null;
    this.surfaces = (this.route && typeof LevelSurfaces === 'function')
      ? new LevelSurfaces(this.route, world) : null;
    this.navNodes = new Map();
    this.navEdges = [];
    this.navOk = false;
    if (this.nav) {
      const v = LevelNavigation.validateNav(this.nav);
      if (v.ok) {
        for (const n of this.nav.nodes) this.navNodes.set(n.id, n);
        this.navEdges = this.nav.edges;
        this.navOk = true;
      }
    }
    this.ok = !!(this.surfaces && this.surfaces.ok) || this.navOk;
    return this.ok;
  }
  available() { return !!this.ok; }
  // route 数据校验的诊断信息（数据无效时可定位原因；不阻塞回退）
  reasons() { return this.surfaces ? this.surfaces.reasons() : (this.route ? ['route 数据未解析（LevelSurfaces 缺失）'] : ['route 数据缺失']); }
  /* 0—1 进度 → 面段投影（委托 LevelSurfaces）；无面段 / 未命中返回 null，调用方自行回退 */
  sample(t) { return (this.surfaces && this.surfaces.ok) ? this.surfaces.sampleRoute(t, this.surfaces.world) : null; }
  /* ---------- 导航网查询（nav） ---------- */
  neighbors(id) {
    const adj = [];
    for (const e of this.navEdges) {
      if (e.a === id) adj.push(e.b);
      else if (e.b === id) adj.push(e.a);
    }
    return adj;
  }
  nodeOf(id) { return this.navNodes.get(id) || null; }
  anchorOf(kind) {
    if (!this.nav || !this.nav.anchors) return null;
    return this.nav.anchors[kind] || null;
  }
  // 无权 BFS：返回 a→b 的节点 id 路径（不可达返回 null）；仅供可达性/最短距离查询
  navPath(a, b) {
    if (!this.navOk || !this.navNodes.has(a) || !this.navNodes.has(b)) return null;
    const prev = new Map([[a, null]]);
    const q = [a];
    while (q.length) {
      const u = q.shift();
      if (u === b) break;
      for (const v of this.neighbors(u)) {
        if (!prev.has(v)) { prev.set(v, u); q.push(v); }
      }
    }
    if (!prev.has(b)) return null;
    const path = [];
    for (let x = b; x != null; x = prev.get(x)) path.push(x);
    return path.reverse();
  }
}