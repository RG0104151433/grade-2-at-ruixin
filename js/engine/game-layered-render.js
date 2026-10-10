/* ============================================================================
 * engine/game-layered-render.js —— Game 方法组 · 分层资源生命周期 + 资源账本
 *                              （E3 / AI-90A：BG / ROUTE / HAZ / FG）
 * ----------------------------------------------------------------------------
 * 唯一职责：按「关卡 × 层」管理正式图资源的加载 / 引用计数 / 释放，并在
 * 缺图、404、加载超时时**安全回退旧画面**（drawUnder 返回 false → 调用方
 * 走原 drawBackground 路径，游戏表现与改造前一致）。
 *
 * 数据驱动：资源清单 = window.LAYER_MANIFEST（mapId → { BG|ROUTE|HAZ|FG: src }）。
 *   清单**不存在或条目缺失** → 不请求任何资源、全部回退——美术文件名一律
 *   不进本文件（AI-C 交付时只提交清单键值，由主控/AI-B 合并清单）。
 *
 * 生命周期：
 *   sync(game)   关卡变化时：对旧关全部条目 release（引用计数 -1，归零即销毁），
 *                对新关按清单 request（已存在的条目——如 preload 预载——不重复计数）；
 *   preload(id)  转场前预载下一场景（引用入账，进关后 sync 复用同一 entry）；
 *   状态机       loading → ready（onload）/ error（onerror）/ timeout（超时守卫）；
 *   drawUnder    只绘制 state==='ready' 的层；没有一张就绪 → false（全回退）。
 *
 * 资源账本（AI-90A）：
 *   - entry.bytes = naturalWidth × naturalHeight × 4（RGBA 解码预算，onload 时记账）；
 *   - liveBytes / peakBytes 实时维护（对照预算：稳态大图 ≤6 张、峰值 ≤96 MiB）；
 *   - stats() 汇总状态计数 + bigImages（>16 MiB）计数 + liveBytes/peakBytes。
 *
 * 安全契约：
 *   - 只读引擎：不改碰撞 / 关卡数据 / 存档；本模块未加载时消费方零开销跳过；
 *   - release 幂等；double-request 同键只增引用；销毁即解除全部引擎侧引用
 *     （丢 img 引用交 GC，不主动置 src='' 以免触发 onerror 噪音）；
 *   - 超时（缺省 8s）视为 error，同样回退，不阻塞游戏。
 * 加载顺序：game.js 之后、game-scene.js 之前（verify-boot ⑩A 顺序三元组守卫）。
 * ==========================================================================*/
'use strict';
window.GuidedLayers = (function () {
  const LAYER_KEYS = ['BG', 'ROUTE', 'HAZ', 'FG'];
  const DEFAULT_TIMEOUT_MS = 8000;
  const BIG_IMAGE_BYTES = 16 * 1024 * 1024;    // §2.5：4096×1024 RGBA ≈ 16 MiB 记「大图」
  /* key = mapId + '#' + layer → entry */
  const entries = new Map();
  let activeMap = null;
  let liveBytes = 0;                           // 存活条目解码字节合计
  let peakBytes = 0;                           // 历史峰值（对照 96 MiB 预算）

  const manifest = () => (typeof window !== 'undefined' && window.LAYER_MANIFEST) || null;

  function makeImage(src) {
    if (typeof Image === 'undefined') return null;
    const img = new Image();
    img.src = src;
    return img;
  }

  /* 解码字节记账：ready 时 +，销毁时 −（条目无 img 即无账） */
  function settleBytes(e, delta) {
    const b = (e && e.bytes) || 0;
    liveBytes = Math.max(0, liveBytes + delta * b);
    if (liveBytes > peakBytes) peakBytes = liveBytes;
  }

  /* 请求一张分层资源；同键重复请求只增引用。返回 entry（含状态机）。 */
  function request(mapId, layer, src, opts) {
    const key = mapId + '#' + layer;
    let e = entries.get(key);
    if (e) { e.refs++; return e; }
    const img = makeImage(src);
    e = {
      key, mapId, layer, src, img, refs: 1,
      state: 'loading', error: null, loadedAt: 0, bytes: 0,
    };
    const timeoutMs = (opts && opts.timeoutMs) || DEFAULT_TIMEOUT_MS;
    if (img) {
      img.onload = () => {
        if (e.timer) { clearTimeout(e.timer); e.timer = null; }
        e.state = 'ready';
        e.loadedAt = Date.now();
        /* 解码账本：naturalWidth/Height 就绪后按 RGBA 记账 */
        e.bytes = (e.img.naturalWidth || 0) * (e.img.naturalHeight || 0) * 4;
        settleBytes(e, +1);
      };
      img.onerror = () => {
        if (e.timer) { clearTimeout(e.timer); e.timer = null; }
        e.state = 'error';
        e.error = 'load-error';
      };
      e.timer = setTimeout(() => {
        if (e.state === 'loading') { e.state = 'timeout'; e.error = 'timeout ' + timeoutMs + 'ms'; }
      }, timeoutMs);
    } else {
      e.state = 'error';
      e.error = 'no Image';
    }
    entries.set(key, e);
    return e;
  }

  /* 释放某关全部条目（引用计数 -1，归零销毁）；幂等 */
  function release(mapId) {
    for (const [key, e] of Array.from(entries)) {
      if (e.mapId !== mapId) continue;
      e.refs--;
      if (e.timer) { clearTimeout(e.timer); e.timer = null; }
      if (e.refs <= 0) {
        settleBytes(e, -1);
        e.img = null;               // 解除引擎侧引用（GC 回收解码内存）
        entries.delete(key);
      }
    }
  }

  /* 关卡变化侦测：进新关按清单请求（已有条目——含 preload——复用不重复计数），
     退旧关整体释放。返回当前 mapId。 */
  function sync(game) {
    const id = (game && game.level && game.level.id) || null;
    if (id === activeMap) return id;
    if (activeMap) release(activeMap);
    activeMap = id;
    const mf = manifest();
    if (id && mf && mf[id]) {
      for (const layer of LAYER_KEYS) {
        const src = mf[id][layer];
        if (typeof src === 'string' && src && !entries.has(id + '#' + layer)) {
          request(id, layer, src);
        }
      }
    }
    return id;
  }

  /* 转场前预载下一场景：与 sync 同账本，进关后复用同一 entry（refs 不重复） */
  function preload(mapId) {
    const mf = manifest();
    if (!mf || !mf[mapId]) return 0;
    let n = 0;
    for (const layer of LAYER_KEYS) {
      const src = mf[mapId][layer];
      if (typeof src === 'string' && src && !entries.has(mapId + '#' + layer)) {
        request(mapId, layer, src);
        n++;
      }
    }
    return n;
  }

  /* 分层绘制：只画 ready 的层（BG → ROUTE → HAZ；FG 由调用方按需在最上层调
     drawOver）。画法（骨架版）：BG/ROUTE/HAZ 各按「世界宽 × 视口高」铺满——
     精确视差与分段加载属 AI-21/V2 批次。没有任何 ready 层 → false（全回退）。 */
  function drawUnder(ctx, engine) {
    const id = activeMap || (engine && engine.level && engine.level.id) || null;
    if (!id) return false;
    let drew = 0;
    for (const layer of ['BG', 'ROUTE', 'HAZ']) {
      const e = entries.get(id + '#' + layer);
      if (!e || e.state !== 'ready' || !e.img) continue;
      try {
        ctx.drawImage(e.img, 0, 0, e.img.naturalWidth || 1, e.img.naturalHeight || 1,
          0, 0, engine.viewW, engine.viewH);
        drew++;
      } catch (err) { /* 绘制异常按缺图处理 */ }
    }
    return drew > 0;
  }
  function drawOver(ctx, engine) {
    const id = activeMap || (engine && engine.level && engine.level.id) || null;
    if (!id) return false;
    const e = entries.get(id + '#FG');
    if (!e || e.state !== 'ready' || !e.img) return false;
    try {
      ctx.drawImage(e.img, 0, 0, e.img.naturalWidth || 1, e.img.naturalHeight || 1,
        0, 0, engine.viewW, engine.viewH);
      return true;
    } catch (err) { return false; }
  }

  /* 资源账本：状态计数 + 大图计数 + liveBytes/peakBytes（对照 ≤6 大图 / ≤96 MiB） */
  function stats() {
    const s = {
      total: 0, loading: 0, ready: 0, error: 0, timeout: 0,
      bigImages: 0, liveBytes, peakBytes, activeMap,
      BUDGET_BIG: 6, BUDGET_PEAK_BYTES: 96 * 1024 * 1024,
    };
    for (const e of entries.values()) {
      s.total++;
      s[e.state] = (s[e.state] || 0) + 1;
      if (e.bytes > BIG_IMAGE_BYTES) s.bigImages++;
    }
    return s;
  }
  function entry(mapId, layer) { return entries.get(mapId + '#' + layer) || null; }
  /* 测试与调试：清空全部（不走引用计数） */
  function reset() {
    for (const e of entries.values()) if (e.timer) clearTimeout(e.timer);
    entries.clear();
    activeMap = null;
    liveBytes = 0;
    /* peakBytes 保留（历史峰值是账本语义）；测试需要归零时再置 */
  }
  function resetAll() { reset(); peakBytes = 0; }

  return {
    LAYER_KEYS, request, release, sync, preload,
    drawUnder, drawOver, stats, entry, reset, resetAll,
    BIG_IMAGE_BYTES,
  };
})();
