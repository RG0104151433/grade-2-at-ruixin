/* ============================================================================
 * data/route-library.js —— 图书馆 · 智慧之钥（library）路线数据 · AI-04A
 * ----------------------------------------------------------------------------
 * 27 列 × 47 行纵向攀爬关：网格全空，边界不可见碰撞；梯子由 ladderParkour
 * 程序生成（起点 (1,45) → 门平台 (20,8)，stepRows 3、extra 4）——**本批不登记
 * 随机梯子段**（其构成参数在 AI-04B 转入生成边界），只登记确定性锚点：
 *   - spawn(3,45)：出生点；
 *   - exit：library_door 门平台（col20-24/row8，随机种子无关、确定性生成），
 *     中心 col22,row8。
 * 纵向进度约定：t = (rows-1-row)/(rows-1)（rows=47，起点汇总为 0、门汇总为 1）。
 * gaps/hazards：梯段全部由 ladderParkour 生成（stepCols/stepRows 受 compose 区间
 *   约束），静态层无确定性断口与危险物，均留空。
 * checkpoints 由生成器按 checkpointEvery 登记到 genAnchorSpots（运行时），
 *   数据层不预写随机复生锚点。
 * 约束（260917.4 §2.1）：无异步初始化、无 DOM、无网络取数；仅注册 window.ROUTE_DATA。
 * ==========================================================================*/
window.ROUTE_DATA = window.ROUTE_DATA || {};
window.ROUTE_DATA.library = Object.freeze({
  version: 1,
  points: [
    { t: 1 / 46, kind: 'spawn' },
    { t: 38 / 46, kind: 'exit' },
  ],
  // 可走面全部由 ladderParkour 生成，无固定可登记面段；surface 数组为空即表示
  // 「本关几何由生成器构成」——消费方必须回退（LevelNavigation 判定不可用/半可用）。
  surfaces: [],
  gaps: [],
  hazards: [],
  checkpoints: [],
  anchors: {
    spawn: { t: 1 / 46, col: 3, row: 45 },
    clues: [],
    exit: { t: 38 / 46, col: 22, row: 8 },
  },
  /* 构成区间边界（E1/AI-04B）：story_config.ladderParkour 参数必须落在区间内。
     jumpGrade 'double'：stepRows 3 单跳不可达，依赖二段跳（前廊拾书后习得）；
     物理覆盖 physics.jumpSpeed=-15.5（verify-geometry 按 def.physics 推导上限）。 */
  compose: {
    jumpGrade: 'double',
    generators: {
      ladderParkour: {
        width: [2, 5],          // 主路径段 rand(2,3) + 随机平台 rand(2,4) + 起点/门平台
        gap: [0, 3],            // stepCols 缺省 3（横向步长包络）
        rise: [1, 3],           // stepRows=3（竖向步长，二段跳上限 ≈3.5 格）
        rowRange: [2, 45],
        countPerSegment: null,  // extra 4 块为装饰层
        extraCount: [0, 8],     // extra 包络（cfg.extra=4）
        anchorEvery: [1, 6],    // cfg.checkpointEvery 缺省 4
        hazardDensity: null,
      },
    },
  },
});