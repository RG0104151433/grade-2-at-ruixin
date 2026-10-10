/* ============================================================================
 * engine/image-gate.js —— Game 方法组 · 图片加载门控（工程 G8）
 * ----------------------------------------------------------------------------
 * 统一预载 + 失败可重试：
 *   · preloadImages(urls)           —— 去重、缓存、记录失败（不改变既有按需 Image 路径）
 *   · maybePreloadLevelImages()     —— 每关仅一次：当前关背景 + 紧邻里程碑背景 + 角色立绘
 *   · retryImages()                 —— 重试所有失败的图片，返回重试数量
 * 失败时通过外壳 #toast 提示一次；重试入口由 UI/调用方调 game.retryImages()。
 * 需在 class Game（game.js）之后加载；与其它 game-*.js 方法组无先后依赖。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  // 当前关 → 下一里程碑（用于「分章预载」的背景图）
  // 2026-09-20：补 pumping_station（现实间场，位于 finale_transition 与 palace_contract 之间），
  // 并把 finale_transition 的下一站从 palace 改为 pumping_station —— 原表在终局段缺 3 个节点，
  // 导致签约厅 / 宫殿 / 童年房间之间完全没有背景预载。
  _milestoneNext: {
    home: 'oasis', oasis: 'library_gate', library_gate: 'library', library: 'corridor',
    corridor: 'gold_approach', gold_approach: 'road', road: 'treasure', treasure: 'maze',
    maze: 'finale_transition', finale_transition: 'pumping_station', pumping_station: 'palace_contract',
    palace_contract: 'palace', palace: 'palace_memory', palace_memory: 'palace',
    data_vortex: 'data_snake', data_snake: 'oasis', balcony: 'home',
  },
  preloadImages(urls) {
    if (typeof Image === 'undefined') return;
    if (!this._imgCache) this._imgCache = new Map();
    const list = Array.isArray(urls) ? urls : [urls];
    for (const url of list) {
      if (!url) continue;
      const prev = this._imgCache.get(url);
      if (prev && (prev.ok || prev.loading)) continue;
      const rec = { ok: false, loading: true, err: false };
      this._imgCache.set(url, rec);
      const img = new Image();
      img.onload = () => { rec.ok = true; rec.loading = false; this._clearImageError(url); };
      img.onerror = () => { rec.ok = false; rec.loading = false; rec.err = true; this._onImageError(url); };
      img.src = url;
    }
  },
  // 每关仅预载一次（由 updateHud 在 loadLevel 后首次调用触发）
  maybePreloadLevelImages() {
    if (!this.level || this.mapId === this._preloadedMap) return;
    this._preloadedMap = this.mapId;
    const urls = [];
    const def = this.level.def || {};
    if (def.bg && def.bg.image) urls.push(def.bg.image);
    const nid = this._milestoneNext[this.mapId];
    const ndef = nid && this.cfg.maps[nid];
    if (ndef && ndef.bg && ndef.bg.image) urls.push(ndef.bg.image);
    // 赛道尽头 → 年鉴馆转场图：进入 oasis 时提前加载，避免转场「先黑屏再等图」。
    const at = (this.cfg.meta && this.cfg.meta.archiveTransition) || null;
    if (at && at.image && this.mapId === 'oasis') urls.push(at.image);
    // 对话框立绘头像提前解码（与 dialog.js 的 SPEAKERS.portrait 一致）：
    // 埃尔 player_front_id.png、阿尔忒弥斯 art3mis_pixel.png，
    // 以及哈里迪 / 诺兰。player.png / monster.png 是世界内精灵图，非头像。
    urls.push('image/player.png', 'image/player_front_id.png', 'image/halliday.png',
              'image/art3mis_pixel.png', 'image/nolan.png', 'image/monster.png');
    this.preloadImages(urls);
  },
  _onImageError(url) {
    if (!this._imgErrors) this._imgErrors = new Set();
    this._imgErrors.add(url);
    if (this._imgErrorToasted) return;
    this._imgErrorToasted = true;
    if (window.App && typeof App.toast === 'function' && window.I18N && typeof I18N.t === 'function') {
      App.toast(I18N.t('toast_image_failed'));
    }
  },
  _clearImageError(url) {
    if (!this._imgErrors) return;
    this._imgErrors.delete(url);
    if (this._imgErrors.size === 0) this._imgErrorToasted = false;
  },
  retryImages() {
    const urls = this._imgErrors ? Array.from(this._imgErrors) : [];
    if (!urls.length) return 0;
    if (this._imgCache) for (const u of urls) this._imgCache.delete(u);
    this._imgErrors = new Set();
    this._imgErrorToasted = false;
    this.preloadImages(urls);
    return urls.length;
  },
  /* 等待某张已排队预载的图片就绪（供 preload 事件在切图前「先加载后展示」）。
     ok → true；加载失败 → false；超过 capMs 仍未好 → false（不阻塞流程）。
     未在缓存里时先登记一次预载，避免调用方顺序依赖。 */
  waitImageReady(url, capMs) {
    if (!url || typeof Image === 'undefined') return Promise.resolve(false);
    if (!this._imgCache) this._imgCache = new Map();
    if (!this._imgCache.has(url)) this.preloadImages([url]);
    const cap = capMs != null ? capMs : 1200;
    return new Promise(resolve => {
      let done = false;
      const fin = v => { if (!done) { done = true; resolve(v); } };
      const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const step = () => {
        const rec = this._imgCache.get(url);
        if (rec && rec.ok) { fin(true); return; }
        if (rec && rec.err) { fin(false); return; }
        const t = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        if (t - t0 >= cap) { fin(false); return; }
        setTimeout(step, 60);
      };
      step();
    });
  },
});
