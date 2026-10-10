/* ============================================================================
 * data/route-oasis.js —— 绿洲入口（oasis）路线数据 · 固定主路线版（单跳可通关）
 * ----------------------------------------------------------------------------
 * 数据 = story_config.maps.oasis 的**静态几何登记**：
 *   - surfaces：地面（row14）+ 12 段固定悬空平台（row10-13，solidPlatforms 实心）；
 *   - gaps：主路线相邻断口（全部 jump 'short'，单跳可过；空档 ≤2 格）；
 *   - hazards：跑道塌陷坑（^，row14）/ 红色清除雾（*，row13）→ fall / lethal_static；金墙（G col19-20 /
 *     col44-45，row11-13，按 E 消融）→ gate；区间 = 列段 ±0.5 格换算 t=col/(cols-1)；
 *   - anchors/checkpoints：spawn(3,14)、4 个复生锚点（落在固定平台上）、
 *     出口 trigger oasis_exit(50,12)；
 *   - points：关键进度锚点（spawn / checkpoint / gate / exit）。
 * 随机平台（oasisParkour）已在 story_config 中 spawnChance=0 关闭，不再生成；
 *   主路线完全固定，刷新/读档布局不变。
 * 坐标约定：
 *   - from/to/t = 0—1 路线进度；横向关 t = col/(cols-1)（col 为格列，cols=54）；
 *   - top = 面段顶面格行（玩家站立行）；地面顶面 row14，1层高=row13，2层=row12，3层=row11；
 *   - support = 支撑结构长度（格）= 14 - top。
 * 约束（260917.4 §2.1）：无异步初始化、无 DOM、无网络取数；仅注册 window.ROUTE_DATA。
 * ==========================================================================*/
window.ROUTE_DATA = window.ROUTE_DATA || {};
window.ROUTE_DATA.oasis = Object.freeze({
  version: 1,
  // 0—1 进度锚点 [{ t, kind }]：spawn / checkpoint / gate / exit
  points: [
    { t: 3 / 53, kind: 'spawn' },
    { t: 17 / 53, kind: 'checkpoint' },   // 平台4（col16-17, row12）
    { t: 20 / 53, kind: 'gate' },         // 第一面金墙 col19-20
    { t: 22 / 53, kind: 'checkpoint' },   // 平台5（col21-23, row12）
    { t: 33 / 53, kind: 'checkpoint' },   // 平台8（col32-34, row11）
    { t: 40 / 53, kind: 'checkpoint' },   // 平台10（col39-41, row11）
    { t: 45 / 53, kind: 'gate' },         // 第二面金墙 col44-45
    { t: 50 / 53, kind: 'exit' },         // 出口 col50
  ],
  // 可走面段 [{ from, to, kind, top, support }]
  // kind: road | deck | roof | gantry | shelf | bridge（§2.1 唯一 schema）
  surfaces: [
    // 地面：全宽封闭跑道（grid row14-17 实心，顶面可站）
    { from: 0, to: 1, kind: 'deck', top: 14, support: 0 },
    // 12 段固定悬空平台：只用 2/3 格整件，相邻上升不超过 1 行。
    { from: 5 / 53,  to: 7 / 53,  kind: 'gantry', top: 13, support: 1 },
    { from: 9 / 53,  to: 10 / 53, kind: 'bridge', top: 12, support: 2 },
    { from: 12 / 53, to: 14 / 53, kind: 'gantry', top: 11, support: 3 },
    { from: 16 / 53, to: 17 / 53, kind: 'bridge', top: 12, support: 2 },
    { from: 21 / 53, to: 23 / 53, kind: 'gantry', top: 12, support: 2 },
    { from: 25 / 53, to: 27 / 53, kind: 'bridge', top: 11, support: 3 },
    { from: 29 / 53, to: 30 / 53, kind: 'gantry', top: 10, support: 4 },
    { from: 32 / 53, to: 34 / 53, kind: 'bridge', top: 11, support: 3 },
    { from: 36 / 53, to: 37 / 53, kind: 'gantry', top: 12, support: 2 },
    { from: 39 / 53, to: 41 / 53, kind: 'bridge', top: 11, support: 3 },
    { from: 46 / 53, to: 48 / 53, kind: 'gantry', top: 12, support: 2 },
    { from: 50 / 53, to: 52 / 53, kind: 'bridge', top: 12, support: 2 },
  ],
  // 断口 [{ from, to, jump, margin }]：主路线相邻断口。
  // jump 'short' = 单跳可过；金墙段在消融后也只留下 2 格空档。
  gaps: [
    { from: 7.5 / 53,  to: 8.5 / 53,  jump: 'short', margin: 0.5 },
    { from: 10.5 / 53, to: 11.5 / 53, jump: 'short', margin: 0.6667 },
    { from: 14.5 / 53, to: 15.5 / 53, jump: 'short', margin: 0.5 },
    { from: 23.5 / 53, to: 24.5 / 53, jump: 'short', margin: 0.6667 },
    { from: 27.5 / 53, to: 28.5 / 53, jump: 'short', margin: 0.5 },
    { from: 30.5 / 53, to: 31.5 / 53, jump: 'short', margin: 0.6667 },
    { from: 34.5 / 53, to: 35.5 / 53, jump: 'short', margin: 0.5 },
    { from: 37.5 / 53, to: 38.5 / 53, jump: 'short', margin: 0.6667 },
    { from: 48.5 / 53, to: 49.5 / 53, jump: 'short', margin: 0.6667 },
  ],
  // 危险区 [{ from, to, type, telegraphMs }]：塌陷坑 → fall；红色清除雾 → lethal_static；金墙 → gate。
  // 区间 = 危险列段 ±0.5 格换算。telegraphMs 为静态可读性下限（E1 契约）。
  hazards: [
    { from: 9.5 / 53, to: 10.5 / 53, type: 'fall', telegraphMs: 600 },            // 小坑 col10
    { from: 13.5 / 53, to: 15.5 / 53, type: 'fall', telegraphMs: 600 },           // 大坑 col14-15（避开平台3）
    { from: 18.5 / 53, to: 20.5 / 53, type: 'gate', telegraphMs: 600 },           // 第一面金墙 col19-20
    { from: 21.5 / 53, to: 22.5 / 53, type: 'lethal_static', telegraphMs: 600 },  // 毒雾 col22
    { from: 26.5 / 53, to: 28.5 / 53, type: 'lethal_static', telegraphMs: 600 },  // 毒雾 col27-28
    { from: 29.5 / 53, to: 31.5 / 53, type: 'fall', telegraphMs: 600 },           // 大坑 col30-31
    { from: 34.5 / 53, to: 36.5 / 53, type: 'fall', telegraphMs: 600 },           // 大坑 col35-36
    { from: 37.5 / 53, to: 38.5 / 53, type: 'lethal_static', telegraphMs: 600 },  // 红雾 col38
    { from: 38.5 / 53, to: 40.5 / 53, type: 'fall', telegraphMs: 600 },            // 大坑 col39-40（避开平台8）
    { from: 43.5 / 53, to: 45.5 / 53, type: 'gate', telegraphMs: 600 },           // 第二面金墙 col44-45
    { from: 46.5 / 53, to: 48.5 / 53, type: 'lethal_static', telegraphMs: 600 },  // 毒雾 col47-48
  ],
  // 复生锚点 [{ t, col, row, w }]：col/row 为复生站立格（落在固定平台顶面上）；
  // w = 该处可站立宽度（格）。感应区在 story_config.checkpoints 中定义。
  checkpoints: [
    { t: 17 / 53, col: 17, row: 12, w: 2 },
    { t: 22 / 53, col: 22, row: 12, w: 3 },
    { t: 33 / 53, col: 33, row: 11, w: 3 },
    { t: 40 / 53, col: 40, row: 11, w: 3 },
  ],
  // 关卡锚点 { spawn, clues, exit }（对象均含 t: 0—1 进度、col/row 佐证格坐标）
  anchors: {
    spawn: { t: 3 / 53, col: 3, row: 14 },
    clues: [],
    exit: { t: 50 / 53, col: 50, row: 12 },
  },
  /* 逆流档案调查点（oasis_reverse_notes）几何锚点（改造自 E3·S1 维护点）。
     全部落在 row14 全封闭跑道地面（surface from0 to1 top14），col 均取自
     grid row13 无 ^ 尖刺 / * 毒雾 / G 金墙 的安全列（脚本核验）。
     主路触发：routeT ≥ triggerT（GuidedRoute.routeT，x/(cols-1)/tile）。
     三点按 points 顺序 1→2→3（玩家回退方向）；逐点揭开，按 E/点击查看；
     三点齐备后 lift（传送机）把玩家送回目标主路点（接近终点）。
     这是只读锚点，不改变既有 surfaces/gaps/hazards/points/碰撞。 */
  maintenance: {
    version: 1,
    // 「越过主路 45%」：身后档案信号首次亮起，提示玩家回退查看三处档案。
    triggerT: 0.45,
    radiusPx: 72,            // 交互半径（世界像素，设计稿口径）
    points: [
      { id: 'mr1', t: 12 / 53, col: 12, row: 14 },   // F6：避开尖刺 col14-15，落在安全列12
      { id: 'mr2', t: 6 / 53,  col: 6,  row: 14 },   // 安全列 6（t≈0.113）
      { id: 'mr3', t: 1 / 53,  col: 1,  row: 14 },   // 安全列 1（t≈0.019，回到起点）
    ],
    lift: {
      t: 3 / 53, col: 3, row: 14,        // 升降台锚点（出生点附近）
      targetT: 0.70,                     // 返回主路约 70%
      // 传送到「当前目标列正上方的平台」：col37 的固定平台在 row12（cols36-37），
      // 同一竖列、比地面高 2 格；落点安全（row12 col37 非尖刺/毒雾/金墙）。
      target: { col: 37, row: 12 },
    },
  },
  /* 构成区间边界（E1/AI-04B）：story_config 对应生成器参数必须落在区间内，
     越界 = 配置错误（verify-geometry 红；运行期 LevelCompose 可选 clamp）。
     jumpGrade 'single'：B1 本关不开放二段跳，跳距上限按单跳物理真值推导。
     随机平台已关闭（spawnChance=0），countPerSegment=[0,0]，主路线完全固定。 */
  compose: {
    jumpGrade: 'single',
    generators: {
      oasisParkour: {
        width: [2, 5],          // sideW [2,3] + middleW [4,5] 的总包络（保留供未来启用）
        gap: [0, 3],            // 相邻可站面空档（同层/下降；物理上限×0.85 ≈ 2.2）
        rise: [0, 2],           // 单段向上步长上限（物理上限：单跳 ≈2.1 格）
        rowRange: [4, 12],
        countPerSegment: [0, 0],// 随机平台已关闭：左右/中部均不生成
        anchorEvery: [0, 0],    // 随机平台不设复生锚点（复生走固定平台 checkpoints）
        hazardDensity: null,
      },
    },
  },
});
