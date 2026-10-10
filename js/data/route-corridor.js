/* ============================================================================
 * data/route-corridor.js —— 荒原 · 生态模拟区（corridor）路线数据 · AI-04A
 * ----------------------------------------------------------------------------
 * 静态关：无程序生成。数据 = story_config.maps.corridor 的静态几何登记：
 *   - 30 列 × 15 行，网格内无平台；地面 row9-14 实心封闭（hideSolids 不绘制，
 *     仅作碰撞，顶面 row9 可站）；
 *   - spawn(3,9)，出口 trigger corridor_exit(27,1)（跳转 gold_approach）。
 * 坐标约定：from/to/t = 0—1 进度；横向关 t = col/(cols-1)（cols=30）；
 *   top = 面段顶面格行；support = 支撑长度（格），贴地段为 0。
 * 本批不登记 gaps/hazards（AI-04B）。
 * 约束（260917.4 §2.1）：无异步初始化、无 DOM、无网络取数；仅注册 window.ROUTE_DATA。
 * ==========================================================================*/
window.ROUTE_DATA = window.ROUTE_DATA || {};
window.ROUTE_DATA.corridor = Object.freeze({
  version: 1,
  points: [
    { t: 3 / 29, kind: 'spawn' },
    { t: 27 / 29, kind: 'exit' },
  ],
  surfaces: [
    { from: 0, to: 1, kind: 'deck', top: 9, support: 0 },   // 全宽地面（row9 顶面可站）
  ],
  gaps: [],
  hazards: [],
  checkpoints: [],
  anchors: {
    spawn: { t: 3 / 29, col: 3, row: 9 },
    clues: [],
    exit: { t: 27 / 29, col: 27, row: 1 },
  },
  /* 构成区间边界（E1）：本关无程序生成器（全宽静态地面），仅登记跳级契约。 */
  compose: {
    jumpGrade: 'single',
    generators: {},
  },
});
