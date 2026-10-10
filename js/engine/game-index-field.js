/* ============================================================================
 * engine/game-index-field.js —— Game 方法组 · 失重舞厅 · 遗失索引场（treasure）
 * ----------------------------------------------------------------------------
 * 把关卡运行时从「随机天空方块」换成可控的三段结构：
 *   A 入口跑酷（col3–22） → B 扫描终端（col25–29，玩家主动按 E）
 *   → C 安全桥（col31–48，**扫描成功后才挂载**） → 出口（col49–51）
 *
 * 本模块只做三件事：
 *   ① 条件几何：安全桥在构造期**预建但不进入碰撞/绘制**；按存档
 *      `sky_minesweeper` 完成标记幂等挂载。这与 level.js 的镜像跑道
 *      （mirrorRunwayTiles → enableMirrorRunway）是同一套「预建 → 用时才挂载」
 *      模式，不复制任何危险物或重力逻辑。出口 col48-51 不摆任何方块，
 *      走到感应区由触发器自动接管（本模块只维护「出口已解锁」状态位）。
 *   ② 每帧对账：读档、复生、数据蛇恢复后回到本关都只看存档标记，因此
 *      「已完成扫描的玩家读档后直接看到安全桥与打开的出口」不需要额外恢复代码。
 *   ③ 收尾钩子：runMinesweeper 通关瞬间调用 indexScanComplete()，立刻挂桥开门。
 *
 * 不承担（各自归位）：
 *   · 坑洞 / 红雾的绘制 → game-tile-art.js（按关卡 hazardArt/pitStyle/fogFrames 配置）
 *   · 安全桥/终端/索引门的画面 → game-index-field-art.js
 *   · 扫雷规则 → minigame-minesweeper.js（原样保留，仅显示文案换术语）
 *   · 对白 / 奖励 / 切图 → story_config 的触发器事件 + game-minigames.js 既有路径
 *
 * 边界：只读存档与关卡配置，仅在 `L.id === 'treasure'` 且 `def.indexField` 存在时
 *   生效；oasis / library_gate / road / maze 的平台、坑洞、毒雾与重力零改动。
 * 加载：class Game（game.js）之后、game-scene.js 之前（与其它 game-*.js 同批）。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  /* 安全桥零件：2 格 / 3 格整件，road（数据道路件）与 gantry（检修桁架件）交替。
     与 game-platform-art.js 的 EXACT_SRC 同名同源，不新增任何图片。 */
  const PIECE_SRC = {
    road2: 'image/platform_oasis_road_2.png',
    road3: 'image/platform_oasis_road_3.png',
    gantry2: 'image/platform_oasis_gantry_2.png',
    gantry3: 'image/platform_oasis_gantry_3.png',
  };
  /* 零件图片只加载一次并缓存（首帧未就绪时由渲染层走结构化回退） */
  const PIECE_IMG = Object.create(null);
  function pieceImage(src) {
    if (typeof Image === 'undefined') return null;
    let rec = PIECE_IMG[src];
    if (!rec) rec = PIECE_IMG[src] = { img: null, ok: false, tried: false };
    if (!rec.tried) {
      rec.tried = true;
      const im = new Image();
      im.onload = function () { if (im.naturalWidth > 0) { rec.img = im; rec.ok = true; } };
      im.onerror = function () { rec.ok = false; };
      im.src = src;
    }
    return rec.ok ? rec.img : null;
  }

  Object.assign(Game.prototype, {
    /* ------------------------------ 配置与状态 ------------------------------ */
    /* 仅本关生效：其它地图返回 null，本模块全部方法随即零开销短路 */
    indexFieldCfg() {
      const L = this.level;
      if (!L || L.id !== 'treasure' || !L.def) return null;
      return L.def.indexField || null;
    },
    indexFieldOn() { return !!this.indexFieldCfg(); },
    /* 完成标记真值：沿用既有 sky_minesweeper（扫雷通关时由 runMinesweeper 写入） */
    indexScanDone() {
      try { return !!(this.save && this.save.has('sky_minesweeper')); } catch (e) { return false; }
    },
    indexGateOpen() {
      const L = this.level;
      return !!(L && L._indexGateOpen);
    },

    /* --------------------- ① 构造期预建（不入碰撞、不绘制） --------------------- */
    /* 幂等：同一关卡实例只预建一次。跨实例（复生 / 读档 / 切关回来）由 Engine 重建
       Level 后重新预建，状态仍只由存档标记决定。 */
    buildIndexField() {
      const L = this.level, cfg = this.indexFieldCfg();
      if (!L || !cfg || L._indexBridgeTiles) return;
      const T = this.tile;
      L._indexBridgeTiles = [];
      L._indexBridgeMounted = false;
      L._indexGateOpen = false;
      for (const seg of (cfg.bridgeSegments || [])) {
        const w = Math.max(1, Math.round(seg.w || 0));
        const art = String(seg.art || '') + w;          // road3 / gantry2 …
        const tile = new Tile(seg.col * T, (cfg.bridgeRow != null ? cfg.bridgeRow : 13) * T,
          w * T, T, 'solid', '', '');
        tile.special = 'index_bridge';
        tile.bridgeArt = PIECE_SRC[art] ? art : null;   // 只认四张 2/3 格整件
        tile.hiddenVisual = true;                      // 渲染层唯一判据：由本模块专属图层绘制
        L._indexBridgeTiles.push(tile);
      }
      /* 出口（col48-51）不再使用可见方块/门体：走到感应区由 trigger:'auto' 自动触发
         （story_config 的 index_gate_locked / index_gate_open）。
         _indexGateTiles 保留为空数组、openIndexGate 保留为幂等状态位——
         「索引门开启」语义 = 出口已解锁（扫描完成），渲染层与测试据此区分两态。 */
      L._indexGateTiles = [];
    },
    /* 挂载安全桥：把预建的桥面瓦片放进碰撞 / 渲染数组（幂等，已挂载直接返回 false） */
    enableIndexBridge() {
      const L = this.level;
      if (!this.indexFieldCfg() || !L) return false;
      this.buildIndexField();
      if (L._indexBridgeMounted) return false;
      L._indexBridgeMounted = true;
      for (const t of L._indexBridgeTiles) {
        if (L.solids.indexOf(t) < 0) L.solids.push(t);
        if (L.allTiles.indexOf(t) < 0) L.allTiles.push(t);
      }
      /* 地形集合被改写 → 主题化「邻接消边」缓存作废（只影响描边，不影响碰撞） */
      this._tileArtOccLevel = null;
      /* 安全挂载：桥面是实心几何（row13 与 row14 地面上下相邻，站立身高 46px > 行距 48px
         的余量），若此刻玩家正好落在这条带子里，把玩家抬到桥面上 —— 正常流程不会发生
         （扫描只能在终端 col25-29 触发），但读档 / 脚本 / 后续改动都可能造成，
         绝不允许新几何把玩家夹在地面与桥面之间。 */
      this.liftPlayerOntoIndexBridge();
      return true;
    },
    /* 把与桥面重叠的玩家抬到桥面顶面（幂等：不重叠时不动） */
    liftPlayerOntoIndexBridge() {
      const L = this.level, p = this.player;
      if (!L || !p || !L._indexBridgeTiles) return false;
      const r = p.rect;
      let top = null;
      for (const t of L._indexBridgeTiles) {
        if (!r.intersects(t.rect)) continue;
        if (top == null || t.y < top) top = t.y;
      }
      if (top == null) return false;
      p.y = top - p.h / 2;
      p.vy = 0; p.remY = 0; p.onGround = false;
      return true;
    },
    /* 开索引门：把关闭态门体移出碰撞 / 绘制（幂等） */
    openIndexGate() {
      const L = this.level;
      if (!this.indexFieldCfg() || !L) return false;
      this.buildIndexField();
      if (L._indexGateOpen) return false;
      L._indexGateOpen = true;
      const set = new Set(L._indexGateTiles || []);
      if (set.size) {
        L.solids = L.solids.filter(t => !set.has(t));
        L.allTiles = L.allTiles.filter(t => !set.has(t));
        this._tileArtOccLevel = null;
      }
      return true;
    },

    /* ---------------- ② 每帧对账：读档 / 复生 / 切关回来的唯一入口 ---------------- */
    indexFieldTick() {
      if (!this.indexFieldCfg()) { this._indexFieldLevel = null; return; }
      this.buildIndexField();
      if (!this.indexScanDone()) return;    // 未完成扫描：桥面与门保持关闭态
      this.enableIndexBridge();
      this.openIndexGate();
    },

    /* -------------- ③ 扫雷通关瞬间（runMinesweeper 唯一调用点） -------------- */
    indexScanComplete() {
      if (!this.indexFieldOn()) return false;
      const a = this.enableIndexBridge();
      this.openIndexGate();
      return a;
    },

    /* --------------------------- 对外只读查询（测试/渲染共用） --------------------------- */
    indexBridgeTiles() {
      const L = this.level;
      return (L && L._indexBridgeTiles) ? L._indexBridgeTiles : [];
    },
    indexBridgeMounted() { const L = this.level; return !!(L && L._indexBridgeMounted); },
    /* 桥面零件表（渲染层用：每段 { col, w, art } 与零件图片路径） */
    indexBridgePlan() {
      const cfg = this.indexFieldCfg();
      if (!cfg) return [];
      return (cfg.bridgeSegments || []).map(seg => {
        const art = String(seg.art || '') + Math.max(1, Math.round(seg.w || 0));
        return { col: seg.col, w: seg.w, art: seg.art, key: art, src: PIECE_SRC[art] || null };
      });
    },
    /* 零件图片（未就绪返回 null，渲染层据此走结构化回退，绝不画纯色方块） */
    indexBridgeImage(key) { return key && PIECE_SRC[key] ? pieceImage(PIECE_SRC[key]) : null; },
  });
})();
