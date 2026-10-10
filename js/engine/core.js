/* ============================================================================
 * engine/core.js —— 核心基础设施
 * ----------------------------------------------------------------------------
 * 基础工具函数（clamp / delay / makeRng / GameClock）、几何 Vector 与 Rect、
 * 按键归一化 normKey、输入管理 Input、存档适配层 Save、相机 Camera。
 * 依赖：无。必须最先加载。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 10-211 行）。方法体未作任何改动；
 * 整段搬运，未作任何改动。
 * ==========================================================================*/
'use strict';
/* ----------------------------- 基础工具函数 ------------------------------- */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
/* --------------------------- 全局暂停信号 --------------------------------
   引擎暂停/恢复时广播；对白、过场（delay）等据此冻结计时，恢复后补足剩余时间。
   与 GameClock 分工：GameClock 管「限时」，Pause 管「暂停」。 */
const Pause = (function () {
  let paused = false;
  const listeners = new Set();
  const now = () => (typeof performance !== 'undefined' && performance.now)
    ? performance.now() : Date.now();
  function set(p) {
    p = !!p;
    if (p === paused) return;
    paused = p;
    for (const fn of Array.from(listeners)) { try { fn(paused); } catch (e) { /* ignore */ } }
  }
  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  /* 暂停感知延时：暂停时挂起计时，恢复后补足剩余时间（不跳时、不丢时）。 */
  function after(ms) {
    ms = Math.max(0, ms || 0);
    return new Promise(resolve => {
      let remaining = ms, started = 0, handle = null, off = null;
      const finish = () => { if (off) off(); resolve(); };
      const arm = () => { started = now(); handle = setTimeout(finish, remaining); };
      const onPause = (p) => {
        if (p) { clearTimeout(handle); remaining -= now() - started; if (remaining < 0) remaining = 0; }
        else arm();
      };
      off = onChange(onPause);
      if (!paused) arm();
    });
  }
  return { set, onChange, after, get paused() { return paused; } };
})();
function delay(ms) { return Pause.after(ms); }
function makeRng(seed) {
  let s = (seed >>> 0) || 1;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/* ------------------------------- 游戏时钟 --------------------------------
   只统计「运行中」的时间：由调用方在非暂停帧调用 tick(dt)。
   与挂钟（performance.now）解耦后，暂停不会消耗限时，恢复也不会跳时。 */
class GameClock {
  constructor(limitMs) { this.limitMs = limitMs; this.elapsedMs = 0; }
  tick(dt) { this.elapsedMs += dt; }
  get remainingMs() { return Math.max(0, this.limitMs - this.elapsedMs); }
  reset() { this.elapsedMs = 0; }
}

/* -------------------------- 双语取词（i18n 约定） --------------------------
   引擎层**禁止**直接输出中文字面量。四种情形各走各的路：
     ① 长叙事文本（对白 / 场景叙述 / 结局）→ 数据文件加 `_en` 兄弟字段，
        渲染层用 pick(obj, 'name') / pickList(map, 'interactTexts') 取词
     ② 短 UI 字符串（HUD / 提示 / 面板）    → 走 I18N.t(key) 字典
     ③ canvas 的 fillText                   → 必须包 I18N.t(...) 或 pickText(...)
     ④ 对话说话者名                          → 走 dialog.js 的 SPEAKER_EN 映射表
   英文缺失时一律回退中文，保证任何一条漏译都不会让界面变空。
   （对应 oasis-game-review 技能「i18n 双语规则」硬约束） */
function isEn() {
  try { return !!(window.I18N && I18N.lang === 'en'); } catch (e) { return false; }
}
/* 数据对象取词：英文模式优先 _en 兄弟字段，缺失回退中文 */
function pick(obj, field) {
  if (!obj) return '';
  if (isEn()) {
    const en = obj[field + '_en'];
    if (en) return en;
  }
  const cn = obj[field];
  return cn == null ? '' : cn;
}
/* 内联字面量取词 */
function pickText(cn, en) { return (isEn() && en) ? en : cn; }
/* 字符串数组取词：英文数组缺失或更短时逐项回退中文 */
function pickList(src, field) {
  const cn = (src && src[field]) || [];
  if (!isEn()) return cn;
  const en = src && src[field + '_en'];
  if (!en || !en.length) return cn;
  return cn.map((v, i) => (en[i] != null && en[i] !== '' ? en[i] : v));
}

class Vector {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(x, y) { return new Vector(this.x + x, this.y + y); }
}

class Rect {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; }
  // 严格 AABB 重叠判定（用于触发器、敌人、地刺）
  intersects(r) {
    return this.x < r.x + r.w && r.x < this.x + this.w &&
           this.y < r.y + r.h && r.y < this.y + this.h;
  }
  clone() { return new Rect(this.x, this.y, this.w, this.h); }
}

function normKey(k) {
  if (!k) return '';
  if (k === ' ') return ' ';
  if (k.length === 1) return k.toLowerCase();
  return k;
}

/* ------------------------- 动作 → 按键绑定表（B1） -------------------------
   全项目唯一真值：输入层（player.js / game-interact.js / game-scene.js）
   与帮助/HUD 文案（i18n.js、index.html）均以此为准；改键只改这里。
   normKey 会把单字符转小写，故这里写小写字母。 */
const KEYBINDS = {
  left:     ['a', 'ArrowLeft'],
  right:    ['d', 'ArrowRight'],
  up:       ['w', 'ArrowUp'],
  down:     ['s', 'ArrowDown'],
  jump:     [' ', 'w', 'ArrowUp'],   // 跳跃：空格 / W / ↑（B1 统一）
  dash:     ['Shift'],
  interact: ['e'],
};
if (typeof window !== 'undefined') window.Keybinds = KEYBINDS;

/* 焦点是否在可编辑控件上（输入框 / 文本域 / 下拉 / contenteditable）：
   是则不要拦截按键的默认行为，否则表单里打不出空格、方向键无法移动光标。 */
function isEditableTarget(el) {
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;
}
/* 焦点是否在可交互控件上（可编辑控件 + 按钮/链接）：
   这些控件上不要拦截空格，保证键盘也能激活按钮。 */
function isInteractiveTarget(el) {
  if (!el || !el.tagName) return false;
  if (isEditableTarget(el)) return true;
  const tag = el.tagName.toLowerCase();
  return tag === 'button' || tag === 'a' || (el.getAttribute && el.getAttribute('role') === 'button');
}

/* ------------------------------- 输入管理 -------------------------------- */
class Input {
  constructor() {
    this.down = new Set();
    this.pressed = new Set();
    this.pressFrame = new Map();
    this.frame = 0;
    this._bind();
  }
  _bind() {
    addEventListener('keydown', e => {
      const k = normKey(e.key);
      // 只拦截游戏会用到的「空格 / 方向键」的默认行为（防止页面滚动），
      // 且焦点在输入框 / 按钮等控件上时不拦截，保证表单输入与键盘激活正常；
      // Tab 一律不拦截，让焦点可在界面与控件间正常移动。
      if ((k === ' ' || k.indexOf('Arrow') === 0) && !isInteractiveTarget(e.target)) e.preventDefault();
      if (!this.down.has(k)) {
        this.pressed.add(k);
        this.pressFrame.set(k, this.frame);
      }
      this.down.add(k);
    });
    addEventListener('keyup', e => { this.down.delete(normKey(e.key)); });
    addEventListener('blur', () => { this.down.clear(); this.pressed.clear(); });
  }
  tick() { this.frame++; }
  endFrame() { this.pressed.clear(); }
  isDown(...keys) { return keys.some(k => this.down.has(k)); }
  wasPressed(...keys) { return keys.some(k => this.pressed.has(k)); }
  recent(within, ...keys) {
    return keys.some(k => this.pressFrame.has(k) && (this.frame - this.pressFrame.get(k)) <= within);
  }
  clear() { this.down.clear(); this.pressed.clear(); this.pressFrame.clear(); }
}

/* ------------------------------- 暂停菜单 --------------------------------
   暂停菜单的唯一显隐入口：引擎与小游戏共用，集中管理 #pause-menu 的
   class 与退场动画，避免各处重复操作 DOM。 */
const PauseMenu = {
  el() { return document.getElementById('pause-menu'); },
  show() {
    const menu = this.el();
    if (!menu) return;
    menu.classList.remove('hidden');
    void menu.offsetWidth;
    menu.classList.add('show');
  },
  hide(immediate) {
    const menu = this.el();
    if (!menu) return;
    menu.classList.remove('show');
    if (immediate) menu.classList.add('hidden');
    else setTimeout(() => menu.classList.add('hidden'), 260);
  },
};

/* ------------------------------- 存档管理 --------------------------------
   Save 只负责「旅程进度」这一件事，数据真值统一由 store.js 托管：
     load()    → Store.getProgress(当前账号)（返回值恒为 normalizeProgress
                 规范化产物：白名单 / 默认值 / 版本升级 / 旧 ID 映射）
     persist() → Store.setProgress(当前账号, …)
     reset()   → 清内存态 → Store.resetProgress(当前账号) → 删旧键
   Save 不再自行决定旧数据（旧版本字段、旧线索 ID、护盾补值）应变成什么，
   只消费 normalizeProgress 的结果与迁移报告（__migration）。
   对外接口（has / addFlags / checkFilter / load / persist / reset 及
   flags / level / spawn / facing）保持不变，引擎内各处调用点无需改动。

   旧版遗留：本类曾自己往 localStorage 写 the-oasis-save-v1 键。该键只被
   读取一次用于迁移，迁移后立即删除；若 Store 不可用（脱离外壳/无头测试），
   本类退回直接读写下这个键，保证引擎仍能独立运行。 */
/* 旅程进度格式版本：旧档缺省视为 1；用于字段兜底与后续迁移。
   3：新增 shields（扫雷奖励「数据护盾」剩余层数，D3）。旧档缺省 0，向下兼容。
   4：新增 clues 发现记录；双语正文仍由剧情配置管理。
   5：新增 parkourDeaths / parkourLevel，使失败计数按账号与关卡持久化。
   6：进度规范化与旧线索 ID 映射上收 Store 层（AI-03，narrative2609174）；
      版本真值 = Store.PROGRESS_VERSION，此处仅保留兼容别名（Store 缺失时兜底 6）。 */
const SAVE_VERSION = (typeof window !== 'undefined' && window.Store &&
  typeof Store.PROGRESS_VERSION === 'number') ? Store.PROGRESS_VERSION : 6;
class Save {
  constructor(baseKey) {
    this.baseKey = baseKey;
    this.clues = [];
    this.flags = new Set();
    this.level = null;
    this.spawn = null;
    this.facing = 1;
    // 数据护盾剩余层数（扫雷奖励，D3）：>0 时被怪兽撞到消耗一层而非死亡
    this.shields = 0;
    // 当前跑酷关的连续死亡计数；与关卡 id 一起保存，避免刷新绕过或账号串号
    this.parkourDeaths = 0;
    this.parkourLevel = null;
    // 最近一次落盘是否成功（供章节卡等 UI 判断，避免无条件显示「已保存」）
    this.lastPersistOk = true;
    // 程序生成关（梯子/天空）的随机种子：纳入存档，使读档/刷新后布局可复现
    this.seeds = {};
    this.version = SAVE_VERSION;
  }
  /* 当前登录账号；未登录时退回访客档。
     这样「新游戏」只重置本账号的关卡进度，不会波及账号成就或其他账号。 */
  currentUser() {
    try {
      if (window.App && typeof App.user === 'function') return App.user();
      if (window.Store && typeof Store.currentUser === 'function') return Store.currentUser();
    } catch (e) { /* ignore */ }
    return null;
  }
  /* Store 是否可用：可用时它是唯一真值，本类不再碰 localStorage */
  _hasStore() {
    return !!(window.Store &&
      typeof Store.getProgress === 'function' &&
      typeof Store.setProgress === 'function' &&
      typeof Store.resetProgress === 'function');
  }
  _legacyKey(user) { return this.baseKey + '::' + (user || '__guest__'); }
  /* 直接读取原始存档键（迁移用；或 Store 缺失时的兜底存储） */
  _readRaw(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return null;
      const d = JSON.parse(raw);
      if (!d || typeof d !== 'object') return null;
      return {
        flags: Array.isArray(d.flags) ? d.flags : [],
        clues: this.normalizeClues(d.clues),
        level: d.level || null,
        spawn: d.spawn || null,
        facing: d.facing || 1,
        shields: (typeof d.shields === 'number') ? d.shields : 0,
        parkourDeaths: (typeof d.parkourDeaths === 'number' && d.parkourDeaths >= 0) ? Math.floor(d.parkourDeaths) : 0,
        parkourLevel: (typeof d.parkourLevel === 'string' && d.parkourLevel) ? d.parkourLevel : null,
        seeds: (d.seeds && typeof d.seeds === 'object') ? d.seeds : {},
        version: d.version || 1,
      };
    } catch (e) { return null; }
  }
  /* 删除旧键：不清掉的话，reset() 之后的 load() 会把旧进度重新迁移回来 */
  _dropLegacy(user) {
    try {
      localStorage.removeItem(this._legacyKey(user));
      if (user) localStorage.removeItem(this.baseKey);   // 更早版本的全局键
    } catch (e) { /* ignore */ }
  }
  hasClue(id) { return this.clues.some(record => record.id === id); }
  discoverClue(id, source) {
    if (typeof id !== 'string' || !id.trim() || typeof source !== 'string' || !source.trim()) return false;
    if (this.hasClue(id)) return false;
    this.clues.push({ id, source });
    return true;
  }
  normalizeClues(records) {
    const result = [];
    const seen = new Set();
    if (!Array.isArray(records)) return result;
    for (const record of records) {
      if (!record || typeof record.id !== 'string' || !record.id.trim() ||
          typeof record.source !== 'string' || !record.source.trim() || seen.has(record.id)) continue;
      seen.add(record.id);
      result.push({ id: record.id, source: record.source });
    }
    return result;
  }
  has(flag) { return this.flags.has(flag); }
  addFlags(flags) { if (flags) for (const f of flags) this.flags.add(f); }
  checkFilter(filter) {
    if (!filter) return true;
    for (const f of filter) {
      if (f[0] === '!') { if (this.flags.has(f.slice(1))) return false; }
      else { if (!this.flags.has(f)) return false; }
    }
    return true;
  }
  load() {
    const user = this.currentUser();
    let p = null;
    if (this._hasStore()) {
      try { p = Store.getProgress(user) || null; } catch (e) { p = null; }
      // 进度为空 → 尝试迁移旧键（只会成功一次：迁移后旧键即被删除）
      if (!p || !p.level) {
        const legacy = this._readRaw(this._legacyKey(user)) ||
                       (user ? this._readRaw(this.baseKey) : null);
        if (legacy) {
          // 旧键与 Store 存档同形状：同样交给 Store 层规范化后再落盘
          p = (typeof Store.normalizeProgress === 'function')
            ? Store.normalizeProgress(legacy) : legacy;
          // 只有新容器明确写入成功后才能删除旧键。配额满时 removeItem 往往仍会
          // 成功，若忽略 setProgress(false) 会把唯一可恢复副本永久删掉。
          let migrated = false;
          try { migrated = Store.setProgress(user, p) !== false; } catch (e) { migrated = false; }
          this.lastPersistOk = migrated;
          if (migrated) this._dropLegacy(user);
        }
      }
    } else {
      // 兜底：Store 不可用时直接读原始键，保证脱离外壳也能独立运行
      p = this._readRaw(this._legacyKey(user)) || (user ? this._readRaw(this.baseKey) : null);
    }
    this.flags = new Set((p && p.flags) || []);
    this.clues = this.normalizeClues(p && p.clues);
    this.level = (p && p.level) || null;
    this.spawn = (p && p.spawn) || null;
    this.facing = (p && p.facing) || 1;
    this.shields = (p && typeof p.shields === 'number') ? p.shields : 0;
    this.parkourDeaths = (p && typeof p.parkourDeaths === 'number' && p.parkourDeaths >= 0)
      ? Math.floor(p.parkourDeaths) : 0;
    this.parkourLevel = (p && typeof p.parkourLevel === 'string' && p.parkourLevel)
      ? p.parkourLevel : null;
    this.seeds = (p && p.seeds && typeof p.seeds === 'object') ? p.seeds : {};
    this.version = (p && p.version) || SAVE_VERSION;
    // 版本迁移（含 v<3 护盾补值 / 旧线索 ID 映射）由 Store.normalizeProgress 完成，
    // Save 只消费其迁移报告：读到的记录确为旧版本时，立即 persist 把规范化结果
    // 固化回 Store，保证迁移幂等——固化后再读 fromVersion 即为当前版本，不会
    // 重复迁移；写入失败时磁盘仍是旧版，下次读档会重新规范化（纯函数，结果一致）。
    this.shieldsMigrated = false;
    const mig = p && p.__migration;
    if (mig && typeof mig.fromVersion === 'number' && mig.fromVersion < SAVE_VERSION) {
      this.shieldsMigrated = !!mig.shieldsBackfilled;
      this.persist();
    }
    return !!this.level;
  }
  persist() {
    const data = {
      version: SAVE_VERSION,
      flags: Array.from(this.flags),
      clues: this.normalizeClues(this.clues),
      level: this.level, spawn: this.spawn, facing: this.facing,
      shields: this.shields,
      parkourDeaths: this.parkourDeaths,
      parkourLevel: this.parkourLevel,
      seeds: this.seeds,
    };
    const user = this.currentUser();
    let ok;
    if (this._hasStore()) {
      try { ok = Store.setProgress(user, data) !== false; }
      catch (e) { ok = this._persistLegacy(user, data); } // Store 抛错时退回旧键
    } else {
      ok = this._persistLegacy(user, data);
    }
    this.lastPersistOk = ok;
    return ok;
  }
  /* 兜底：直接写旧键（Store 不可用或抛错时） */
  _persistLegacy(user, data) {
    try {
      localStorage.setItem(this._legacyKey(user), JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  }
  /* 「新游戏」：顺序不能换 ——
     ① 先清内存态，否则后续 persist() 会把旧 flags 写进刚清空的档；
     ② 再清数据真值（Store.resetProgress 只动 story / introRead）；
     ③ 最后删旧键，否则下次 load() 会把旧进度重新迁移回来。
     注意：此处不调用 persist()。 */
  reset() {
    this.clues = [];
    this.flags = new Set();
    this.level = null; this.spawn = null; this.facing = 1;
    this.shields = 0;
    this.parkourDeaths = 0;
    this.parkourLevel = null;
    this.seeds = {};
    this.version = SAVE_VERSION;
    const user = this.currentUser();
    let ok = true;
    if (this._hasStore()) {
      try { ok = Store.resetProgress(user) !== false; } catch (e) { ok = false; }
    }
    this.lastPersistOk = ok;
    this._dropLegacy(user);
  }
}

/* ------------------------------- 相机管理 -------------------------------- */
class Camera {
  constructor(engine) { this.engine = engine; this.x = 0; this.y = 0; }
  snap(x, y) { this.x = x; this.y = y; }
  follow(px, py, bound) {
    this.x += (px - this.x) * 0.1;
    if (Math.abs(px - this.x) < 0.5) this.x = px;
    this.y = py;
    if (bound) {
      this.x = clamp(this.x, bound[0], bound[1]);
      this.y = clamp(this.y, bound[2], bound[3]);
    }
  }
  toScreen(wx, wy) {
    return new Vector(wx - this.x + this.engine.viewW / 2, wy - this.y + this.engine.viewH / 2);
  }
}
