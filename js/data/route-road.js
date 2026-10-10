/* ============================================================================
 * data/route-road.js —— 无尽道路（road）路线数据 · 双阶段镜像跑酷谜题
 * ----------------------------------------------------------------------------
 * 二阶段跑酷谜题（AI-06，自 library_gate 转移）：
 *   阶段一（前进跑酷）：54 列 × 18 行，街景底（bg_street_road），地面 row14。
 *     出发平台 + 9 段固定障碍平台（全部 2/3 格宽 → 对应 platform_oasis_road_2/3、
 *     platform_oasis_gantry_2/3 四张整件；起伏较大：上升 ≤3 格、下落可达 5 格，
 *     二段跳可通），地面规划稀疏坑洞（1/2 格）与红雾；两个按 E 触发的提示交互；
 *     末端 col47-51 死路墙（封闭）。
 *   阶段二（镜像通关）：启动镜像（gate_mirrored）后世界上下翻转（重力不反转），
 *     角色倒立、脚踩在 row3 镜像跑道上表面；翻转渲染后屏幕上看是吊在跑道下方、
 *     朝屏幕下跳跃，沿跑道跨过 2 处坑 + 1 处红雾，抵达 col49-51 真正出口
 *     （转场至 treasure，写入 key2）。
 * 数据 = story_config.maps.road 的**静态几何登记**（grid 即真源）：
 *   - surfaces：地面（row14 顶面）+ 出发平台 + 9 段前进障碍平台。镜像跑道/门/雾
 *     不登记在 surfaces（镜像前不参与碰撞），详见 story_config.def.mirror 与
 *     engine/game-gate-mirror.js；
 *   - gaps：前进相邻断口（横向 2 格，跳级 double）；
 *   - hazards：前进地面坑/雾 + 镜像坑/雾（红色清除雾复用 OASIS 三帧素材）；
 *   - checkpoints：平台4（col23 row7，检查点1）与平台7（col36 row6，检查点2），
 *     死路前不设第三个检查点。
 * 未登记进 surfaces 的镜像几何（跑道/坑/雾/门/出口）——只读摘要放在 anchors.mirror，
 * 供校验/测试引用；运行期真源以 story_config.maps.road.mirror 为准。
 * 坐标约定：from/to/t = 0—1 路线进度；横向关 t = col/(cols-1)（cols=54）；
 *   top = 面段顶面格行；support = 支撑长度（格），贴地段为 0。
 * 约束（260917.4 §2.1）：无异步初始化、无 DOM、无网络取数；仅注册 window.ROUTE_DATA。
 * ==========================================================================*/
window.ROUTE_DATA = window.ROUTE_DATA || {};
window.ROUTE_DATA.road = Object.freeze({
  version: 1,
  // 0—1 进度锚点 [{ t, kind }]：spawn / checkpoint / dead_end / exit
  points: [
    { t: 3 / 53, kind: 'spawn' },          // 起点 col3（地面 row14；校验台区）
    { t: 23 / 53, kind: 'checkpoint' },    // 检查点1：平台4（col22-24, row7）
    { t: 36 / 53, kind: 'checkpoint' },    // 检查点2：平台7（col36-37, row6）
    { t: 45 / 53, kind: 'dead_end' },      // 死路墙前（col44-45 平台9）
    { t: 50 / 53, kind: 'exit' },          // 镜像真正出口（col49-51, 行2-4）
  ],
  // 可走面段 [{ from, to, kind, top, support }]
  surfaces: [
    // 地面：全封闭跑道（grid row14-17 实心，顶面可站；col47-51 被死路墙替换，
    // col52 镂空出深渊；坑/雾在 row13-14 以危险物登记）
    { from: 0, to: 1, kind: 'deck', top: 14, support: 0 },
    // 前进障碍平台：全部 2/3 格宽（road/gantry 整件），相邻上升 ≤3 格、下落可达 5 格，
    // 二段跳可通；纵向大起伏（13→10→13→10→7→12→9→6→11→8）。
    { from: 4 / 53,  to: 6 / 53,  kind: 'gantry', top: 13, support: 1 },   // 出发平台（3 格，地面起 1 层）
    { from: 9 / 53,  to: 10 / 53, kind: 'bridge', top: 10, support: 4 },   // 平台1（升3·提示点一）
    { from: 13 / 53, to: 15 / 53, kind: 'gantry', top: 13, support: 1 },   // 平台2（落回地面高度）
    { from: 18 / 53, to: 19 / 53, kind: 'bridge', top: 10, support: 4 },   // 平台3（升3）
    { from: 22 / 53, to: 24 / 53, kind: 'gantry', top: 7,  support: 7 },   // 平台4（升3·检查点1·前半最高点）
    { from: 27 / 53, to: 28 / 53, kind: 'bridge', top: 12, support: 2 },   // 平台5（大落差下落）
    { from: 31 / 53, to: 33 / 53, kind: 'gantry', top: 9,  support: 5 },   // 平台6（升3）
    { from: 36 / 53, to: 37 / 53, kind: 'bridge', top: 6,  support: 8 },   // 平台7（升3·检查点2·提示点二·后半最高点）
    { from: 40 / 53, to: 42 / 53, kind: 'gantry', top: 11, support: 3 },   // 平台8（大落差下落）
    { from: 44 / 53, to: 45 / 53, kind: 'bridge', top: 8,  support: 6 },   // 平台9（升3·死路前缓冲）
  ],
  // 断口 [{ from, to, jump, margin }]：前进主路线相邻断口（横向 2 格）。
  // jump 'long' = 该段依赖二段跳（升幅 3 格）；'short' = 同层/大幅下降单跳即可。
  gaps: [
    { from: 7.5 / 53,  to: 8.5 / 53,  jump: 'long',  margin: 0.5 },    // 出发→平台1（升3）
    { from: 11.5 / 53, to: 12.5 / 53, jump: 'short', margin: 0.6667 }, // 平台1→平台2（降3）
    { from: 16.5 / 53, to: 17.5 / 53, jump: 'long',  margin: 0.5 },    // 平台2→平台3（升3）
    { from: 20.5 / 53, to: 21.5 / 53, jump: 'long',  margin: 0.5 },    // 平台3→平台4（升3）
    { from: 25.5 / 53, to: 26.5 / 53, jump: 'short', margin: 0.6667 }, // 平台4→平台5（降5）
    { from: 29.5 / 53, to: 30.5 / 53, jump: 'long',  margin: 0.5 },    // 平台5→平台6（升3）
    { from: 34.5 / 53, to: 35.5 / 53, jump: 'long',  margin: 0.5 },    // 平台6→平台7（升3）
    { from: 38.5 / 53, to: 39.5 / 53, jump: 'short', margin: 0.6667 }, // 平台7→平台8（降5）
    { from: 42.5 / 53, to: 43.5 / 53, jump: 'long',  margin: 0.5 },    // 平台8→平台9（升3）
  ],
  // 危险区 [{ from, to, type, telegraphMs }]：前进地面坑（fall）/ 红雾（lethal_static）
  // + 镜像跑道坑（fall）/ 镜像红雾（lethal_static）。区间 = 危险列段 ±0.5 格换算。
  hazards: [
    { from: 7.5 / 53,  to: 8.5 / 53,  type: 'fall', telegraphMs: 600 },             // 前进坑 col8（1 格）
    { from: 15.5 / 53, to: 17.5 / 53, type: 'fall', telegraphMs: 600 },             // 前进坑 col16-17（2 格）
    { from: 24.5 / 53, to: 26.5 / 53, type: 'lethal_static', telegraphMs: 600 },    // 前进红雾 col25-26（row13）
    { from: 33.5 / 53, to: 35.5 / 53, type: 'fall', telegraphMs: 600 },             // 前进坑 col34-35（2 格）
    { from: 41.5 / 53, to: 43.5 / 53, type: 'lethal_static', telegraphMs: 600 },    // 前进红雾 col42-43（row13）
    { from: 12.5 / 53, to: 13.5 / 53, type: 'fall', telegraphMs: 600 },             // 镜像跑道坑 col13（1 格）
    { from: 33.5 / 53, to: 35.5 / 53, type: 'fall', telegraphMs: 600 },             // 镜像跑道坑 col34-35（2 格）
  ],
  // 复生锚点 [{ t, col, row, w }]：col/row 为复生站立格（落在固定平台顶面上）。
  // 检查点1：平台4（col22-24 row7）；检查点2：平台7（col36-37 row6）。死路前不设第三检查点。
  checkpoints: [
    { t: 23 / 53, col: 23, row: 7, w: 3 },
    { t: 36 / 53, col: 36, row: 6, w: 2 },
  ],
  // 关卡锚点 { spawn, clues, exit }
  anchors: {
    spawn: { t: 3 / 53, col: 3, row: 14 },
    clues: [],
    // 前向 BFS 可达的「表面出口」= 死路墙前的跑道地面（col46, row14）；
    // 真正的通关出口是镜像出口（anchors.mirror.exit：col49-51 行2-4），
    // 但它在镜像前不可达，不参与前向构成检查。
    exit: { t: 46 / 53, col: 46, row: 14 },
    /* 镜像阶段只读摘要（运行期真源 = story_config.maps.road.mirror）：
       runway 跑道行3（世界上方）；pits 跑道缺口的绝对列；
       doorCells/exit 真正出口门（终点已无方块，仅作出口触发参考）。 */
    mirror: {
      runwayRow: 3,
      runwayCols: [[3, 12], [14, 33], [36, 48]],
      pits: [{ col: 13, w: 1 }, { col: 34, w: 2 }],
      doorCells: [[49, 2], [49, 3], [49, 4], [50, 2], [50, 3], [50, 4], [51, 2], [51, 3], [51, 4]],
      exit: { t: 50 / 53, col: 50, row: 3 },
      killFallRow: 9,
      station: { x: 1, y: 11, w: 3, h: 5 },
    },
  },
  /* 构成区间边界（E1）：本关为静态关（grid 即真源），无程序生成器。
     jumpGrade 'double'：前进路线开双跳（升幅 3 格段依赖二段跳，索引册拾取后获得）。 */
  compose: {
    jumpGrade: 'double',
    generators: {},
  },
});