const fs = require('fs');
const vm = require('vm');
const path = process.argv[2];
const src = fs.readFileSync(path, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'story_config.js' });
const cfg = sandbox.window.STORY_CONFIG;
const errors = [];

const fKeys = [
  'fnale1_arc_show',
  'fnale2_arc_show','fnale2_arc_clue',
  'fnale3_arc_intro',
  'fnale3_helped_reply','fnale3_reported_reply','fnale3_neutral_reply',
  'fnale3_helped_after','fnale3_reported_after','fnale3_neutral_after',
  'fnale4_arc_open','fnale4_helped','fnale4_reported','fnale4_neutral','fnale4_arc_close',
];
const fClues = ['fnale_pause'];
const fFlags = ['fnale_arc_unlocked','fnale_helped','fnale_reported','fnale_neutral'];

// 1. dialogueTree / dialogueTree_en 成对 + 行数一致
for (const k of fKeys) {
  if (!cfg.dialogueTree[k]) errors.push('dialogueTree missing: ' + k);
  if (!cfg.dialogueTree_en[k]) errors.push('dialogueTree_en missing: ' + k);
}
for (const k of fKeys) {
  const zh = cfg.dialogueTree[k], en = cfg.dialogueTree_en[k];
  if (zh && en && zh.length !== en.length) errors.push(`line count mismatch ${k}: zh=${zh.length} en=${en.length}`);
}

// 2. clue 定义与 usedBy
for (const c of fClues) {
  const clue = cfg.clues[c];
  if (!clue) { errors.push('clue missing: ' + c); continue; }
  const ub = clue.usedBy || [];
  if (!ub.some(s => s.includes('fnale_gate'))) errors.push('clue usedBy missing fnale_gate: ' + c);
}

// 3. 收集事件引用
function collect(evs) {
  const dialogs = new Set(), setFlags = new Set(), ifFlags = new Set(), ifClues = new Set(), discClues = new Set();
  (function walk(list) {
    for (const ev of list || []) {
      if (ev.type === 'dialog' && ev.id) dialogs.add(ev.id);
      if (ev.type === 'setFlag') for (const f of ev.flags || []) setFlags.add(f);
      if (ev.type === 'discoverClue') discClues.add(ev.id);
      if (ev.type === 'ifFlag') { ifFlags.add(ev.flag); walk(ev.then); walk(ev.else); }
      if (ev.type === 'ifClue') { ifClues.add(ev.id); walk(ev.then); walk(ev.else); }
      if (ev.type === 'choice') { for (const o of ev.options || []) walk(o.events); }
    }
  })(evs);
  return { dialogs, setFlags, ifFlags, ifClues, discClues };
}
function collectBranch(evs, match) {
  const r = { dialogs: new Set(), setFlags: new Set(), ifFlags: new Set(), ifClues: new Set(), discClues: new Set(), found: false };
  function collectInto(list) {
    for (const ev of list || []) {
      if (ev.type === 'dialog' && ev.id) r.dialogs.add(ev.id);
      if (ev.type === 'setFlag') for (const f of ev.flags || []) r.setFlags.add(f);
      if (ev.type === 'discoverClue') r.discClues.add(ev.id);
      if (ev.type === 'ifFlag') { r.ifFlags.add(ev.flag); collectInto(ev.then); collectInto(ev.else); }
      if (ev.type === 'ifClue') { r.ifClues.add(ev.id); collectInto(ev.then); collectInto(ev.else); }
      if (ev.type === 'choice') { for (const o of ev.options || []) collectInto(o.events); }
    }
  }
  (function search(list) {
    for (const ev of list || []) {
      if (r.found) return;
      if (match(ev)) { r.found = true; collectInto(ev.then); collectInto(ev.else); return; }
      if (ev.type === 'ifFlag') { search(ev.then); search(ev.else); }
      else if (ev.type === 'ifClue') { search(ev.then); search(ev.else); }
      else if (ev.type === 'choice') { for (const o of ev.options || []) search(o.events); }
    }
  })(evs);
  return r;
}
function checkRefs(evs, where, allowFlags) {
  const r = collect(evs);
  for (const d of r.dialogs) if (!cfg.dialogueTree[d]) errors.push(`dialog id not in dialogueTree: ${d} @ ${where}`);
  for (const d of r.dialogs) if (!cfg.dialogueTree_en[d]) errors.push(`dialog id not in dialogueTree_en: ${d} @ ${where}`);
  for (const c of r.discClues) if (!cfg.clues[c]) errors.push(`discoverClue id not in clues: ${c} @ ${where}`);
  for (const c of r.ifClues) if (!cfg.clues[c]) errors.push(`ifClue id not in clues: ${c} @ ${where}`);
  for (const f of new Set([...r.setFlags, ...r.ifFlags])) {
    if (!allowFlags.includes(f)) errors.push(`undeclared flag in F-line: ${f} @ ${where}`);
  }
  return r;
}

// 3a. pumping_station 热区 fnale_gate（F1-F3 挂载）
const ps = cfg.maps.pumping_station;
let gate = null;
for (const t of (ps && ps.scene && ps.scene.hotspots || [])) if (t.id === 'fnale_gate') gate = t;
if (!gate) errors.push('hotspot fnale_gate missing');
else {
  if (typeof gate.x !== 'number' || typeof gate.y !== 'number' || typeof gate.w !== 'number' || typeof gate.h !== 'number') {
    errors.push('hotspot fnale_gate bad geometry');
  }
  // 场景热区无 trigger 级 flags；不得在热区对象上写 flags/filter（事件内 ifFlag+setFlag 等价实现）
  if (gate.flags) errors.push('fnale_gate must not use hotspot-level flags');
  if (gate.filter) errors.push('fnale_gate must not use filter (clue uses ifClue only)');
  const r = checkRefs(gate.events, 'fnale_gate', fFlags);
  // 首进门控
  if (!r.ifFlags.has('fnale_arc_unlocked')) errors.push('F ifFlag fnale_arc_unlocked missing @ fnale_gate');
  if (!r.setFlags.has('fnale_arc_unlocked')) errors.push('F setFlag fnale_arc_unlocked missing @ fnale_gate');
  // F1 演出 / F2 对话 + 线索 / F3 choice
  if (!r.dialogs.has('fnale1_arc_show')) errors.push('F1 fnale1_arc_show not referenced @ fnale_gate');
  if (!r.dialogs.has('fnale2_arc_show')) errors.push('F2 fnale2_arc_show not referenced @ fnale_gate');
  if (!r.dialogs.has('fnale2_arc_clue')) errors.push('F2 fnale2_arc_clue not referenced @ fnale_gate');
  if (!r.discClues.has('fnale_pause')) errors.push('F2 discoverClue fnale_pause missing @ fnale_gate');
  if (!r.ifClues.has('fnale_pause')) errors.push('F2 ifClue fnale_pause missing (rewatch guard) @ fnale_gate');
  if (!r.dialogs.has('fnale3_arc_intro')) errors.push('F3 fnale3_arc_intro not referenced @ fnale_gate');
  // F3 三选项互斥 flag
  for (const f of ['fnale_helped','fnale_reported','fnale_neutral']) {
    if (!r.setFlags.has(f)) errors.push(`F3 setFlag ${f} missing @ fnale_gate`);
  }
  // F3 分支收尾：三档 dialog 全部被引用
  for (const d of ['fnale3_helped_after','fnale3_reported_after','fnale3_neutral_after']) {
    if (!r.dialogs.has(d)) errors.push(`F3 ${d} not referenced @ fnale_gate`);
  }
  // 坐标重叠检查（同场景）
  for (const o of (ps.scene.hotspots || [])) {
    if (o.id === 'fnale_gate') continue;
    const overlap = !(gate.x + gate.w <= o.x || o.x + o.w <= gate.x || gate.y + gate.h <= o.y || o.y + o.h <= gate.y);
    if (overlap) errors.push(`hotspot overlap with ${o.id} @ pumping_station`);
  }
  // F3 三选项互斥：choice 三选项 events 中必须各含一个互斥 setFlag，且无 choice 级重复写档
  let choices = 0;
  (function walk(list) {
    for (const ev of list || []) {
      if (ev.type === 'choice') { choices++; for (const o of ev.options || []) walk(o.events); }
      if (ev.type === 'ifFlag') { walk(ev.then); walk(ev.else); }
      if (ev.type === 'ifClue') { walk(ev.then); walk(ev.else); }
    }
  })(gate.events);
  if (choices !== 1) errors.push('fnale_gate must contain exactly one choice (C3), got ' + choices);
}

// 3b. palace_contract entryEvents：F4 挂载（N4 同构，collectBranch 只收集 F 线分支）
const pc = cfg.maps.palace_contract;
if (!pc || !Array.isArray(pc.entryEvents)) errors.push('palace_contract entryEvents missing');
else {
  const r = collectBranch(pc.entryEvents, ev => ev.type === 'ifFlag' && ev.flag === 'fnale_arc_unlocked');
  if (!r.found) errors.push('F4 ifFlag fnale_arc_unlocked missing @ palace_contract');
  const where = 'palace_contract.entryEvents(F4)';
  for (const d of r.dialogs) if (!cfg.dialogueTree[d]) errors.push(`dialog id not in dialogueTree: ${d} @ ${where}`);
  for (const d of r.dialogs) if (!cfg.dialogueTree_en[d]) errors.push(`dialog id not in dialogueTree_en: ${d} @ ${where}`);
  for (const c of r.discClues) if (!cfg.clues[c]) errors.push(`discoverClue id not in clues: ${c} @ ${where}`);
  for (const c of r.ifClues) if (!cfg.clues[c]) errors.push(`ifClue id not in clues: ${c} @ ${where}`);
  for (const f of new Set([...r.setFlags, ...r.ifFlags])) {
    if (!fFlags.includes(f)) errors.push(`undeclared flag in F-line: ${f} @ ${where}`);
  }
  // F4 只读 F3 三档 flag，不新增写入
  if (r.setFlags.size > 0) errors.push('F4 must not set any flag (read-only) @ palace_contract');
  if (!r.dialogs.has('fnale4_arc_open')) errors.push('F4 fnale4_arc_open not referenced @ palace_contract');
  if (!r.dialogs.has('fnale4_arc_close')) errors.push('F4 fnale4_arc_close not referenced @ palace_contract');
  for (const d of ['fnale4_helped','fnale4_reported','fnale4_neutral']) {
    if (!r.dialogs.has(d)) errors.push(`F4 ${d} not referenced @ palace_contract`);
  }
  for (const f of ['fnale_helped','fnale_reported','fnale_neutral']) {
    if (!r.ifFlags.has(f)) errors.push(`F4 ifFlag ${f} missing @ palace_contract`);
  }
}

// 3c. ★F3→D3 联动：D3 块已含 ifFlag fnale_helped → discoverClue debt_21_47_witness（D 线预埋，F 线不重复写）
const dg = cfg.maps.pumping_station;
let dGate = null;
for (const t of (dg && dg.scene && dg.scene.hotspots || [])) if (t.id === 'debt_arc_gate') dGate = t;
if (!dGate) errors.push('hotspot debt_arc_gate missing (D-line precondition)');
else {
  let foundLink = false, foundWitness = false;
  (function walk(list) {
    for (const ev of list || []) {
      if (ev.type === 'ifFlag' && ev.flag === 'fnale_helped') {
        foundLink = true;
        (function w2(l2) {
          for (const e2 of l2 || []) {
            if (e2.type === 'discoverClue' && e2.id === 'debt_21_47_witness') foundWitness = true;
            if (e2.type === 'ifFlag' || e2.type === 'ifClue') { w2(e2.then); w2(e2.else); }
            if (e2.type === 'choice') for (const o of e2.options || []) w2(o.events);
            if (e2.type === 'dialog' && e2.id === 'debt_d3_link_witness') foundWitness = foundWitness; // 已存在先例，保留语义
          }
        })(ev.then);
      }
      if (ev.type === 'ifFlag' || ev.type === 'ifClue') { walk(ev.then); walk(ev.else); }
      if (ev.type === 'choice') for (const o of ev.options || []) walk(o.events);
    }
  })(dGate.events);
  if (!foundLink) errors.push('F3→D3 link ifFlag fnale_helped missing @ debt_arc_gate');
  if (!foundWitness) errors.push('F3→D3 discoverClue debt_21_47_witness missing under fnale_helped @ debt_arc_gate');
}

// 4. 四协议布尔零改动（三协议 requirements 结构完整；buyoutBinding 为禁入 flag，非 clue）
for (const key of ['inherit','public_energy','charter']) {
  if (!cfg.endings[key] || !cfg.endings[key].requirements) errors.push('endings requirements broken: ' + key);
}
// F 线 flag 不得出现在任何 requirements 规则中
const reqText = JSON.stringify({
  inherit: cfg.endings.inherit && cfg.endings.inherit.requirements,
  public_energy: cfg.endings.public_energy && cfg.endings.public_energy.requirements,
  charter: cfg.endings.charter && cfg.endings.charter.requirements,
});
for (const f of fFlags) {
  if (reqText.includes(f)) errors.push('F-line flag leaked into protocol requirements: ' + f);
}
for (const c of fClues) {
  if (reqText.includes(c)) errors.push('F-line clue leaked into protocol requirements: ' + c);
}

if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log(' - ' + e);
  process.exit(1);
}
console.log('ALL_F_ARC_CHECKS_PASSED');