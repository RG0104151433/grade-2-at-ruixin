/* ============================================================
   core/registry.js —— 注册中心（改造方案 §1.6.2 契约接口）
   实现接口: IRegistry              // register / get / health
   注册名: 自身不注册；另模块经 Svc.register("name", impl) 接入
   依赖: 无（最先加载，先于一切新模块；index.html 将该脚本置于最前）
   数据真值: 无持久化；仅保存模块接口引用，不存业务状态
   ============================================================ */
(function (global) {
  const registry = Object.create(null);

  function register(name, impl) {
    if (!name || !impl) return false;
    if (registry[name]) { console.warn("Svc: 重复注册被忽略:", name); return false; }
    registry[name] = impl;
    return true;
  }

  function get(name) { return registry[name] || null; }

  function health() {
    return Object.keys(registry).map(name => ({ name, registered: true }));
  }

  global.Svc = { register, get, health };
})(typeof globalThis !== "undefined" ? globalThis : window);