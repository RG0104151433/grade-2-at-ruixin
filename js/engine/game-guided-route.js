/* ============================================================================
 * engine/game-guided-route.js —— Game 方法组 · guided 路线参数骨架（E3 / AI-20 试点）
 * ----------------------------------------------------------------------------
 * 唯一职责：给引擎/上层一个**稳定的路线参数 routeT**（0—1 归一化，安全域
 * 0.02—0.96）与最近路径投影 / 路线提示，数据全部来自既有 route/nav/compose
 * （window.ROUTE_DATA / NAV_DATA → LevelNavigation 实例），本模块零数据。
 *
 * 三种模式（按关自动判定，缺数据返回 null → 调用方走旧路径）：
 *   route  横向平台关（有 route surfaces）：rawT = playerX / 世界宽；
 *   climb  纵向攀爬关（library，行数远大于列数）：rawT = (rows-1-feetRow)/(rows-1)；
 *   nav    俯视迷宫（maze，nav 网络）：玩家投影到 spawn→exit 节点路径的折线上。
 *
 * 安全契约：
 *   - routeT() 恒在 [0.02, 0.96]；rawT() 才是未截断值；
 *   - 只读：不改碰撞、不改跳跃参数、不改剧情逻辑、不写存档；
 *   - 缺 route/nav / 校验失败 / 玩家或关卡缺失 → attach 返回 null，关卡照旧运行；
 *   - 本模块未加载时消费方（game-loop 的存在性守卫钩子）零开销跳过。
 * 加载顺序：game.js 之后（tick 挂在 update 上，运行期才消费）、game-scene.js 之前
 *   （verify-boot ⑩A 顺序三元组守卫）。
 * ==========================================================================*/
'use strict';
window.GuidedRoute = (function () {
  /* routeT 安全域：两端各留 2%——出生/出口附近的锚定抖动不外泄给消费方 */
  const T_MIN = 0.02, T_MAX = 0.96;
  const clampT = v => Math.min(T_MAX, Math.max(T_MIN, v));

  /* 轴向判定：纵向攀爬关（行数 > 列数 × 1.5，如 library 27×47）按行推进 */
  function axisOf(L) {
    if (!L || !L.cols || !L.rows) return 'x';
    return L.rows > L.cols * 1.5 ? 'y' : 'x';
  }

  /* nav 模式：spawn→exit 折线（世界坐标），供投影 */
  function navPolyline(nav) {
    if (!nav || !nav.navOk || !nav.nav || !nav.nav.anchors) return null;
    const a = nav.nav.anchors.spawn, b = nav.nav.anchors.exit;
    if (!a || !b || a.col == null) return null;
    const nearNode = p => {
      let best = null, bd = Infinity;
      for (const n of nav.navNodes.values()) {
        const d = (n.col - p.col) * (n.col - p.col) + (n.row - p.row) * (n.row - p.row);
        if (d < bd) { bd = d; best = n; }
      }
      return best;
    };
    const na = nearNode(a), nb = nearNode(b);
    if (!na || !nb) return null;
    const ids = nav.navPath(na.id, nb.id);
    if (!ids || ids.length < 2) return null;
    const T = nav.tile || 48;
    return ids.map(id => {
      const n = nav.nodeOf(id);
      return { x: n.col * T + T / 2, y: n.row * T + T / 2 };
    });
  }

  /* 折线最近点：返回 { index, frac, x, y, dist }（index 为段序，frac 为段内比例） */
  function nearestOnPolyline(pts, x, y) {
    let best = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const ax = pts[i].x, ay = pts[i].y, bx = pts[i + 1].x, by = pts[i + 1].y;
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      let f = len2 ? ((x - ax) * dx + (y - ay) * dy) / len2 : 0;
      f = Math.max(0, Math.min(1, f));
      const px = ax + dx * f, py = ay + dy * f;
      const d = Math.hypot(x - px, y - py);
      if (!best || d < best.dist) best = { index: i, frac: f, x: px, y: py, dist: d };
    }
    return best;
  }

  function makeController(game) {
    const L = game.level;
    const nav = L.navigation;
    if (!nav || !nav.available()) return null;
    const T = game.tile;
    const axis = axisOf(L);
    const worldSpan = (axis === 'x' ? (L.cols - 1) : (L.rows - 1)) * T;
    if (!(worldSpan > 0)) return null;

    /* nav 模式折线（仅 maze）；构建失败则该关退化为 null（旧路径） */
    const poly = (L.mode === 'topdown') ? navPolyline(nav) : null;
    if (L.mode === 'topdown' && !poly) return null;

    const feet = () => ({ x: game.player.x, y: game.player.y + game.player.h / 2 });
    const rawT = () => {
      if (poly) {
        const f = feet();
        const n = nearestOnPolyline(poly, f.x, f.y);
        if (!n) return 0;
        return (n.index + n.frac) / (poly.length - 1);
      }
      const f = feet();
      return axis === 'x'
        ? f.x / worldSpan
        : 1 - f.y / worldSpan;                 // 纵向：向上 = 进度增加
    };

    const ctl = {
      levelId: L.id,
      mode: poly ? 'nav' : (axis === 'y' ? 'climb' : 'route'),
      T_MIN, T_MAX,
      /* 稳定路线参数：安全域内的 0—1 进度 */
      routeT() { return clampT(rawT()); },
      rawT,
      /* 0—1 进度 → 路线点（route/climb 用 surfaces 投影；nav 用折线插值）。
         x 统一用 t×(cols-1)×T（与 route 数据 t=col/(cols-1) 同口径，修正
         LevelSurfaces.sampleRoute 的 t×cols 差一 tile 偏差）。 */
      project(t) {
        t = clampT(t);
        if (poly) {
          const f = t * (poly.length - 1);
          const i = Math.min(poly.length - 2, Math.floor(f));
          const fr = f - i;
          return {
            x: poly[i].x + (poly[i + 1].x - poly[i].x) * fr,
            y: poly[i].y + (poly[i + 1].y - poly[i].y) * fr,
            top: null, kind: 'nav',
          };
        }
        const s = nav.sample(t);
        if (!s) return null;
        return axis === 'x'
          ? { x: t * worldSpan, y: s.top * T, top: s.top, kind: s.kind }
          : { x: s.top * T, y: (1 - t) * worldSpan, top: s.top, kind: s.kind };
      },
      /* 玩家当前位置 → 路线最近锚点（rawT 投影点 + 偏离距离 px） */
      nearest() {
        const f = feet();
        if (poly) {
          const n = nearestOnPolyline(poly, f.x, f.y);
          return n ? { t: clampT((n.index + n.frac) / (poly.length - 1)),
            x: n.x, y: n.y, dist: Math.round(n.dist) } : null;
        }
        const t = rawT();
        const p = this.project(t);
        if (!p) return null;
        return { t: clampT(t), x: p.x, y: p.y,
          dist: Math.round(Math.hypot(f.x - p.x, f.y - p.y)) };
      },
      /* 路线提示（纯数据，渲染与文案由上层决定）：
         偏离量 + 前方 2 格内最近断口（jump 语义） */
      hint() {
        const n = this.nearest();
        if (!n) return null;
        let gapAhead = null;
        const route = (typeof window !== 'undefined' && window.ROUTE_DATA) ? ROUTE_DATA[L.id] : null;
        const gaps = route && route.gaps;
        if (gaps && gaps.length) {
          const t = this.routeT();
          const ahead = gaps.filter(g => g.from >= t && g.from <= t + 0.08)
            .sort((a, b) => a.from - b.from)[0];
          if (ahead) gapAhead = { t: +ahead.from.toFixed(3), jump: ahead.jump };
        }
        return { offRoutePx: n.dist, gapAhead };
      },
    };
    return ctl;
  }

  /* tick：关卡变化时重建控制器；挂在 game-loop update 的存在性守卫钩子上 */
  let cur = null, curLevel = null;
  function tick(game) {
    const L = game && game.level;
    if (!L || !game.player) { cur = null; curLevel = null; return null; }
    if (curLevel !== L || !cur) {
      cur = makeController(game);
      curLevel = cur ? L : null;
      if (L) L.guided = cur;      // 挂在关卡实例上，随关卡一起回收
    }
    return cur;
  }
  /* 显式取当前控制器（测试与调试用） */
  function current() { return cur; }
  /* 释放（关卡退出 / 测试） */
  function reset() { cur = null; curLevel = null; }

  /* ------------ 视觉引导叠加层（OASIS guided 试点，AI-20） ------------
     game.guidedDebug = true 时由渲染路径挂钩调用（存在性守卫，缺模块跳过）。
     绘制：① 路线投影锚点（青点 + 偏离连线）；② 前方 2 格内最近断口（黄色竖带）；
     ③ 当前 routeT 读数条（左上角）。纯提示，不参与碰撞与逻辑。 */
  function drawHint(ctx, engine) {
    if (!engine || engine.guidedDebug !== true || !engine.level) return;
    const ctl = tick(engine);
    if (!ctl) return;
    const L = engine.level, T = engine.tile;
    const toScreen = (wx, wy) => engine.camera.toScreen(wx, wy);
    ctx.save();
    /* ① 投影锚点 + 偏离连线 */
    const n = ctl.nearest();
    if (n) {
      const p = toScreen(n.x, n.y);
      const f = toScreen(engine.player.x, engine.player.y + engine.player.h / 2);
      ctx.strokeStyle = 'rgba(120,220,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.fillStyle = 'rgba(120,220,255,0.9)';
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    /* ② 前方断口（黄色竖带） */
    const h = ctl.hint();
    if (h && h.gapAhead) {
      const route = (typeof window !== 'undefined' && window.ROUTE_DATA) ? ROUTE_DATA[L.id] : null;
      const g = (route && route.gaps || []).find(x => Math.abs(x.from - h.gapAhead.t) < 1e-6);
      if (g) {
        const W = (L.cols - 1) * T;
        const x0 = toScreen(g.from * W, 0).x, x1 = toScreen(g.to * W, 0).x;
        ctx.fillStyle = 'rgba(255,220,60,0.25)';
        ctx.fillRect(x0, 0, Math.max(6, x1 - x0), engine.viewH);
      }
    }
    /* ③ routeT 读数条（左上角，屏幕空间） */
    const t = ctl.routeT();
    ctx.fillStyle = 'rgba(10,20,26,0.55)';
    ctx.fillRect(12, 84, 120, 6);
    ctx.fillStyle = 'rgba(120,220,255,0.9)';
    ctx.fillRect(12, 84, 120 * (t - ctl.T_MIN) / (ctl.T_MAX - ctl.T_MIN), 6);
    ctx.restore();
  }

  return { tick, current, reset, makeController, nearestOnPolyline, clampT, drawHint, T_MIN, T_MAX };
})();
