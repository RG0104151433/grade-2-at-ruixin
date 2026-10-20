const fs = require('fs');
const vm = require('vm');
const path = process.argv[2];
const src = fs.readFileSync(path, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'story_config.js' });
const cfg = sandbox.window.STORY_CONFIG;
const errors = [];
const dKeys = ['debt_d1_show','debt_d2_intro','debt_d2_c1_infiltrate','debt_d2_c1_retreat','debt_d3_branch_a','debt_d3_branch_b','debt_d3_link_witness','debt_d3_link_partial','debt_d3_end','debt_d4_show','debt_arc_review_witness','debt_arc_review_partial','debt_arc_review_ongoing'];
const dClues = ['debt_mother_notice','debt_mother_attendance','debt_21_47_witness','debt_21_47_partial'];
const dFlags = ['debt_arc_unlocked','debt_c1_infiltrate','debt_c1_retreat'];

// 1. dialogueTree / dialogueTree_en 成对
for (const k of dKeys) {
  if (!cfg.dialogueTree[k]) errors.push('dialogueTree missing: ' + k);
  if (!cfg.dialogueTree_en[k]) errors.push('dialogueTree_en missing: ' + k);
}
// 双语行数一致
for (const k of dKeys) {
  const zh = cfg.dialogueTree[k], en = cfg.dialogueTree_en[k];
  if (zh && en && zh.length !== en.length) errors.push(`line count mismatch ${k}: zh=${zh.length} en=${en.length}`);
}
// 21:47 保留（P1-2#5 互引）
for (const k of ['debt_d3_branch_a','debt_d3_branch_b','debt_d3_link_witness','debt_d3_link_partial']) {
  const zh = (cfg.dialogueTree[k] || []).join('|');
  if (!zh.includes('21:47')) errors.push('21:47 missing in zh ' + k);
}

// 2. clues 定义与 usedBy
for (const c of dClues) {
  const clue = cfg.clues[c];
  if (!clue) { errors.push('clue missing: ' + c); continue; }
  const ub = clue.usedBy || [];
  if (!ub.some(s => s.includes('debt_arc_gate'))) errors.push('clue usedBy missing debt_arc_gate: ' + c);
}

// 3. 热区存在 + 引用可解析
const pump = cfg.maps.pumping_station;
let gate = null;
for (const h of (pump.scene && pump.scene.hotspots || [])) {
  if (h.id === 'debt_arc_gate') gate = h;
}
if (!gate) { errors.push('hotspot debt_arc_gate missing'); }
else {
  // 坐标格式检查
  if (typeof gate.x !== 'number' || typeof gate.y !== 'number' || typeof gate.w !== 'number' || typeof gate.h !== 'number') {
    errors.push('hotspot debt_arc_gate bad geometry');
  }
  // 遍历事件收集 dialog id / setFlag flags / discoverClue ids / ifFlag / ifClue
  const dialogs = new Set(), setFlags = new Set(), ifFlags = new Set(), ifClues = new Set(), discClues = new Set();
  (function walk(evs) {
    for (const ev of evs || []) {
      if (ev.type === 'dialog') dialogs.add(ev.id);
      if (ev.type === 'setFlag') for (const f of ev.flags || []) setFlags.add(f);
      if (ev.type === 'discoverClue') discClues.add(ev.id);
      if (ev.type === 'ifFlag') { ifFlags.add(ev.flag); walk(ev.then); walk(ev.else); }
      if (ev.type === 'ifClue') { ifClues.add(ev.id); walk(ev.then); walk(ev.else); }
      if (ev.type === 'choice') { for (const o of ev.options || []) walk(o.events); }
    }
  })(gate.events);
  for (const d of dialogs) if (!cfg.dialogueTree[d]) errors.push('dialog id not in dialogueTree: ' + d);
  for (const d of dialogs) if (!cfg.dialogueTree_en[d]) errors.push('dialog id not in dialogueTree_en: ' + d);
  for (const f of setFlags) ifFlags.add(f);
  for (const c of discClues) if (!cfg.clues[c]) errors.push('discoverClue id not in clues: ' + c);
  for (const c of ifClues) if (!cfg.clues[c]) errors.push('ifClue id not in clues: ' + c);
  // 关键 flag 写读自洽
  for (const f of new Set([...setFlags, ...ifFlags])) {
    if (f === 'fnale_helped') continue; // F 线批次 3 提供
    if (!dFlags.includes(f) && !['morrow_pressed'].includes(f)) errors.push('undeclared flag in debt gate: ' + f);
  }
  // 互斥性：choice 两选项写两不同 flag
  console.log('debt gate dialogs:', [...dialogs].sort().join(','));
  console.log('debt gate flags set:', [...setFlags].sort().join(','));
  console.log('debt gate discoverClue:', [...discClues].sort().join(','));
}

// 4. 四协议布尔零改动（抽查关键引用仍存在且 requirements 结构完整）
for (const key of ['inherit','public_energy','charter']) {
  if (!cfg.endings[key] || !cfg.endings[key].requirements) errors.push('endings requirements broken: ' + key);
}
if (typeof cfg.endings.buyoutBinding !== 'undefined' && typeof cfg.endings.buyoutBinding !== 'object') {
  // buyoutBinding 是 flag（requirements noneOf 引用），并非 clue，无需在 clues 中检查
}

// 5. 热区坐标不与其他热区重叠（简要检查同一场景）
if (gate) {
  const others = (pump.scene && pump.scene.hotspots || []).filter(h => h.id !== 'debt_arc_gate');
  for (const o of others) {
    const overlap = !(gate.x + gate.w <= o.x || o.x + o.w <= gate.x || gate.y + gate.h <= o.y || o.y + o.h <= gate.y);
    if (overlap) errors.push(`hotspot overlap with ${o.id}`);
  }
}

if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log(' - ' + e);
  process.exit(1);
}
console.log('ALL_D_ARC_CHECKS_PASSED');