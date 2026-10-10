/* ============================================================
   scoreboard.js —— 排行榜接口 / 占位（工程 G9）
   ------------------------------------------------------------
   决策 D9：**完整常驻 HUD 暂缓**。本模块只提供数据与接口，
   不渲染任何界面（show/hide 为占位），待主线稳定后由 HUD 层接入。

   用法（未来）：
     Scoreboard.set([{ id:'el', name:'你', score:120, self:true },
                     { id:'art3mis', name:'阿尔忒弥斯', score:180 }]);
     Scoreboard.rankOf('el');   // → 2
     Scoreboard.leader();       // → { id:'art3mis', ... }
     Scoreboard.snapshot();     // → 排序后的浅拷贝数组
     Scoreboard.onChange(fn);   // 订阅变更（供 HUD 刷新）
   ============================================================ */
window.Scoreboard = (function () {
  let entries = [];
  const listeners = [];

  function emit() { for (const fn of listeners) { try { fn(snapshot()); } catch (e) { /* ignore */ } } }
  function set(list) {
    entries = (Array.isArray(list) ? list : []).map((e, i) => ({
      id: (e && e.id != null) ? String(e.id) : ('p' + i),
      name: (e && e.name) || '',
      score: Number(e && e.score) || 0,
      self: !!(e && e.self),
    })).sort((a, b) => b.score - a.score);
    emit();
    return snapshot();
  }
  function snapshot() { return entries.map(e => Object.assign({}, e)); }
  function rankOf(id) { const i = entries.findIndex(e => e.id === String(id)); return i < 0 ? -1 : i + 1; }
  function leader() { return entries.length ? Object.assign({}, entries[0]) : null; }
  function reset() { entries = []; emit(); }
  function onChange(fn) { if (typeof fn === 'function') listeners.push(fn); }

  // 展示层预留：完整 HUD 暂缓（D9），此处仅占位、不产生可见元素。
  function show() {}
  function hide() {}
  function mount(/* el */) {}

  return { set, snapshot, rankOf, leader, reset, onChange, show, hide, mount };
})();
