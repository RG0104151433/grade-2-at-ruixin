/* ============================================================================
 * data/route-library-gate.js —— 黄金图书馆前廊（library_gate）路线数据 · AI-04A
 * ----------------------------------------------------------------------------
 * 静态关：无程序生成。数据 = story_config.maps.library_gate 的静态几何登记：
 *   - 40 列 × 15 行，网格内无平台（grid 全空），地面 row13-14 实心封闭；
 *   - spawn(3,13)，出口 trigger libgate_exit(36,10)（跳转 library）。
 * 坐标约定：from/to/t = 0—1 进度；横向关 t = col/(cols-1)（cols=40）；
 *   top = 面段顶面格行；support = 支撑长度（格），贴地段为 0。
 * 本批不登记 gaps/hazards（AI-04B）。
 * 约束（260917.4 §2.1）：无异步初始化、无 DOM、无网络取数；仅注册 window.ROUTE_DATA。
 * ==========================================================================*/
window.ROUTE_DATA = window.ROUTE_DATA || {};
window.ROUTE_DATA.library_gate = Object.freeze({
  version: 1,
  points: [
    { t: 3 / 39, kind: 'spawn' },
    { t: 36 / 39, kind: 'exit' },
  ],
  surfaces: [
    { from: 0, to: 1, kind: 'deck', top: 13, support: 0 },   // 全宽地面（row13 顶面可站）
  ],
  gaps: [],
  hazards: [],
  checkpoints: [],
  anchors: {
    spawn: { t: 3 / 39, col: 3, row: 13 },
    clues: [],
    exit: { t: 36 / 39, col: 36, row: 10 },
  },
  /* 构成区间边界（E1）：本关无程序生成器（全宽静态地面），仅登记跳级契约。 */
  compose: {
    jumpGrade: 'single',
    generators: {},
  },
});
