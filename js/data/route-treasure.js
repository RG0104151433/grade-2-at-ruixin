/* ============================================================================
 * data/route-treasure.js —— 失重舞厅 · 遗失索引场（treasure）路线数据 · AI-04A
 * ----------------------------------------------------------------------------
 * 34 列 × 30 行（单格 48px）；地面顶线 row26（世界 y=1248）。
 * 地形由 story_config.maps.treasure.skyParkour 的 cfg.platforms **手工固定产出**
 * （位置写死、不随机、不移动）。2026-09-21 重排（三层错落）：
 *   · **相机锁死**（def.cameraFix = 936,864）：视口不随玩家移动，世界↔屏幕为固定映射
 *     （screenX = worldX-296，screenY = worldY-504；可见 col 6.2—32.8 / row 10.5—25.5）；
 *   · 固定扫描台 fixed(col16-18, row17)：必须**双脚站到台面上**才可交互（requiresStanding）；
 *   · 固定悬浮平台 13 块：分三层 row13—row24（上层 13-15 / 中层 17-20 / 下层 22-24），
 *     横向错开、无等距等高段，全部落在界面内（屏幕 x 88~1240 / y 120~696）；
 *   · **单向薄板 oneway 3 块**（静态写死）：低位中继（col13 row22 / col27 row20 /
 *     col29 row17，各 1 格宽），每块下方 2 行内必有实心落脚（构成检查 Ⅰ 不报孤立）；
 *   · **可消融数据块 block 3 块**（静态写死）：中路 col21 的竖向能量阶梯
 *     （row17 → row15 → row13），可选俯瞰支线；按 E 消融后消失，主线不受影响；
 *   · 出生专属平台 = col8-10 row23（spawn 落点 · 屏幕 x88-232 左下角，进场即完整可见）；
 *   · 出口高台 = col30-31 row23，屏幕正中背景图最右侧房门（门 x1140-1364）；
 *   · 掉落即死（def.fallKillY = 1200）：掉出平台区立刻结算，容错为 0；
 *   · 地面毒雾（row25，随机列）+ 网格写死的塌陷坑/断口（row26）。
 * 本文件登记的是**始终存在**的静态几何（地面 + 两块固定落台），手工平台由
 * 生成器按 platforms 列表产出，不在此登记（与 route-oasis 的 compose.generators 同口径）。
 * 坐标约定：from/to/t = 0—1 进度；横向关 t = col/(cols-1)（cols=34）；
 *   top = 面段顶面格行；support = 支撑长度（格），贴地段为 0，
 *   悬空段取「落段底部到舞池地面 row26」的格数。
 * 约束（260917.4 §2.1）：无异步初始化、无 DOM、无网络取数；仅注册 window.ROUTE_DATA。
 * ==========================================================================*/
window.ROUTE_DATA = window.ROUTE_DATA || {};
window.ROUTE_DATA.treasure = Object.freeze({
  version: 1,
  points: [
    { t: 8 / 33, kind: 'spawn' },       // 出生专属平台（col8-10 row23，左下角可见区）
    { t: 16 / 33, kind: 'minigame' },   // 扫描终端（站到台面后按 E 启动遗失索引扫描）
    { t: 30 / 33, kind: 'exit' },       // 出口高台（正中背景房门，按 E 进入迷宫）
  ],
  surfaces: [
    // 舞池地面（row26 顶面，含塌陷坑/断口；视觉来自背景图）
    { from: 0, to: 1, kind: 'deck', top: 26, support: 0 },
    // 固定扫描台（生成器 fixed：col16-18 row17）
    { from: 16 / 33, to: 19 / 33, kind: 'gantry', top: 17, support: 9 },
    // 出口高台（生成器 platforms：col30-31 row23，正中背景房门）
    { from: 30 / 33, to: 32 / 33, kind: 'bridge', top: 23, support: 3 },
  ],
  // 断口：手工平台由生成器产出，本关不登记静态断口（checkStaticGaps 跳过）
  gaps: [],
  // 危险区（列段 ±0.5 格换算 t=col/(cols-1)）：
  //   塌陷坑/断口 → fall；地面毒雾（生成器随机列 6—28）→ lethal_static。
  hazards: [
    { from: 8 / 33, to: 8 / 33, type: 'fall', telegraphMs: 600 },       // 塌陷坑 col8
    { from: 18 / 33, to: 18 / 33, type: 'fall', telegraphMs: 600 },     // 塌陷坑 col18
    { from: 24 / 33, to: 25 / 33, type: 'fall', telegraphMs: 600 },     // 断口（深坑）col24-25
    { from: 6 / 33, to: 28 / 33, type: 'lethal_static', telegraphMs: 600 }, // 地面毒雾带
  ],
  checkpoints: [
    { t: 8 / 33, col: 8, row: 23, w: 3 },     // 出生专属平台（左下角）
    { t: 16 / 33, col: 16, row: 17, w: 3 },   // 扫描台
    { t: 30 / 33, col: 30, row: 23, w: 2 },   // 出口高台（房门前）
  ],
  anchors: {
    spawn: { t: 8 / 33, col: 8, row: 23 },
    clues: [],
    /* 出口锚点 = 出口高台（col30-31 row23，生成器 platforms 固定，正中背景图房门）。
       行走路径：出生平台 → 下层(row22-24) → 中层(row19) → 出口高台 ⇒ BFS 全程可达
       （主路径 spawn → col12_24 → col16_22 → col21_19 → col26_22 → exit，
       逐边跳距余量最紧一段 ratio 0.60）。 */
    exit: { t: 30 / 33, col: 30, row: 23 },
  },
  /* 构成区间边界（E1/AI-04B）：story_config.skyParkour 参数必须落在区间内，
     越界 = 配置错误（verify-geometry 红）。jumpGrade 'double'：二段跳。 */
  compose: {
    jumpGrade: 'double',
    generators: {
      skyParkour: {
        width: [2, 3],           // 平台宽 2—3 格
        gap: [0, 3],             // 相邻可站面空档（二段跳上限×0.85）
        rise: [0, 3],            // 单段向上步长上限（手工布局最大升 3 格）
        rowRange: [13, 24],      // 平台高度包络（三层：13-15 / 17-20 / 22-24）
        extraCount: [0, 8],      // 额外随机平台数量（本关固定为 0）
        anchorEvery: [1, 3],     // 复生锚点周期（每 2 块手工平台）
        hazardDensity: {
          spike: [0, 0],         // 地面不生成地刺（深坑由网格写死）
          poison: [0, 0.5],      // 地面毒雾密度
          solid: [0, 0],
          gold: [0, 0],
          minSafeGap: [0, 4],    // 危险物之间的最小安全间距
        },
      },
    },
  },
});
