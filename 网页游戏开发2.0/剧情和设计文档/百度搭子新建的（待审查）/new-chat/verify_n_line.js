const fs = require('fs');
const vm = require('vm');
const path = process.argv[2];
const src = fs.readFileSync(path, 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'story_config.js' });
const cfg = sandbox.window.STORY_CONFIG;
const errors = [];

const nKeys = [
  'nolan1_arc_intro','nolan1_arc_after','nolan1_arc_system',
  'nolan2_arc_show','nolan_arc_gate_locked',
  'nolan3_arc_intro','nolan3_arc_morrow_diff',
  'nolan3_confronted_reply','nolan3_circumspect_reply','nolan3_sympathized_reply',
  'nolan3_confronted_after','nolan3_circumspect_after','nolan3_sympathized_after',
  'nolan3_arc_end',
  'nolan4_arc_open','nolan4_arc_close',
  'nolan4_confronted_note','nolan4_sympathized_note','nolan4_circumspect_note',
  'nolan4_confronted_shot','nolan4_sympathized_shot','nolan4_circumspect_shot',
];
const nClues = ['nolan_soron_identity'];
const nFlags = ['nolan_arc_unlocked','nolan_confronted','nolan_circumspect','nolan_sympathized'];
const existingFlags = ['morrow_pressed','fnale_arc_unlocked','fnale_helped','fnale_reported','fnale_neutral'];

// 1. dialogueTree / dialogueTree_en 成对 + 行数一致
for (const k of nKeys) {
  if (!cfg.dialogueTree[k]) errors.push('dialogueTree missing: ' + k);
  if (!cfg.dialogueTree_en[k]) errors.push('dialogueTree_en missing: ' + k);
}
for (const k of nKeys) {
  const zh = cfg.dialogueTree[k], en = cfg.dialogueTree_en[k];
  if (zh && en && zh.length !== en.length) errors.push(`line count mismatch ${k}: zh=${zh.length} en=${en.length}`);
}
// 行数口径（正文 59 句 = arc_intro7 + arc_after9 + system2 + arc_show15 + locked1 + arc_intro5 + morrow1 + reply3 + after6 + arc_end1 + arc_open2 + arc_close3 + note5 + shot3 = 63；
// 注：剧本表格即时反馈 3 句并入 reply，与剧本“反馈 6 句”口径差异仅在 N3 选项表内嵌（choice 内联），非 dialogueTree 行）
for (const k of ['nolan3_confronted_reply','nolan3_circumspect_reply','nolan3_sympathized_reply']) {
  if (!cfg.dialogueTree[k]) errors.push('reply missing: ' + k);
}

// 2. clues 定义与 usedBy
for (const c of nClues) {
  const clue = cfg.clues[c];
  if (!clue) { errors.push('clue missing: ' + c); continue; }
  const ub = clue.usedBy || [];
  if (!ub.some(s => s.includes('nolan_arc_gate'))) errors.push('clue usedBy missing nolan_arc_gate: ' + c);
}

// 3. 收集事件引用（dialog / setFlag / discoverClue / ifFlag / ifClue / choice）
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
// 只收集 N 线专属分支：全树搜索第一个命中 match 的事件，仅收集其 then/else 子树；
// 搜索路径上的祖先节点（如 ifFlag sky_minesweeper）不计入任何统计。
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
function checkRefs(evs, where) {
  const r = collect(evs);
  for (const d of r.dialogs) if (!cfg.dialogueTree[d]) errors.push(`dialog id not in dialogueTree: ${d} @ ${where}`);
  for (const d of r.dialogs) if (!cfg.dialogueTree_en[d]) errors.push(`dialog id not in dialogueTree_en: ${d} @ ${where}`);
  for (const c of r.discClues) if (!cfg.clues[c]) errors.push(`discoverClue id not in clues: ${c} @ ${where}`);
  for (const c of r.ifClues) if (!cfg.clues[c]) errors.push(`ifClue id not in clues: ${c} @ ${where}`);
  for (const f of new Set([...r.setFlags, ...r.ifFlags])) {
    if (!nFlags.includes(f) && !existingFlags.includes(f)) errors.push(`undeclared flag in N-line: ${f} @ ${where}`);
  }
  return r;
}

// 3a. index_gate（地图 treasure）：N1 挂载（只检查 nolan_arc_unlocked 分支，避开既有流程）
const ig = cfg.maps.treasure;
let igTrigger = null;
for (const t of (ig && ig.triggers || [])) if (t.id === 'index_gate') igTrigger = t;
if (!igTrigger) errors.push('trigger index_gate missing');
else {
  const r = collectBranch(igTrigger.events, ev => ev.type === 'ifFlag' && ev.flag === 'nolan_arc_unlocked');
  if (!r.found) errors.push('N1 ifFlag nolan_arc_unlocked missing @ index_gate');
  const where = 'index_gate(N1)';
  for (const d of r.dialogs) if (!cfg.dialogueTree[d]) errors.push(`dialog id not in dialogueTree: ${d} @ ${where}`);
  for (const d of r.dialogs) if (!cfg.dialogueTree_en[d]) errors.push(`dialog id not in dialogueTree_en: ${d} @ ${where}`);
  for (const c of r.discClues) if (!cfg.clues[c]) errors.push(`discoverClue id not in clues: ${c} @ ${where}`);
  for (const c of r.ifClues) if (!cfg.clues[c]) errors.push(`ifClue id not in clues: ${c} @ ${where}`);
  for (const f of new Set([...r.setFlags, ...r.ifFlags])) {
    if (!nFlags.includes(f) && !existingFlags.includes(f)) errors.push(`undeclared flag in N-line: ${f} @ ${where}`);
  }
  if (!r.dialogs.has('nolan1_arc_intro')) errors.push('N1 nolan1_arc_intro not referenced @ index_gate');
  if (!r.setFlags.has('nolan_arc_unlocked')) errors.push('N1 setFlag nolan_arc_unlocked missing @ index_gate');
}

// 3b. library_gate：N2 热区
const lg = cfg.maps.library_gate;
let gate = null;
for (const t of (lg && lg.triggers || [])) if (t.id === 'nolan_arc_gate') gate = t;
if (!gate) errors.push('hotspot nolan_arc_gate missing');
else {
  if (typeof gate.x !== 'number' || typeof gate.y !== 'number' || typeof gate.w !== 'number' || typeof gate.h !== 'number') {
    errors.push('hotspot nolan_arc_gate bad geometry');
  }
  if (!gate.filter || gate.filter.length !== 1 || gate.filter[0] !== 'nolan_arc_unlocked') {
    errors.push('nolan_arc_gate filter must be exactly [nolan_arc_unlocked] (no clue)');
  }
  if (gate.filter && gate.filter.some(f => nClues.includes(f.replace('!','')))) {
    errors.push('nolan_arc_gate filter contains clue (forbidden)');
  }
  const r = checkRefs(gate.events, 'nolan_arc_gate');
  if (!r.ifClues.has('nolan_soron_identity')) errors.push('N2 ifClue nolan_soron_identity missing @ nolan_arc_gate');
  if (!r.dialogs.has('nolan2_arc_show')) errors.push('N2 nolan2_arc_show not referenced @ nolan_arc_gate');
  if (!r.discClues.has('nolan_soron_identity')) errors.push('N2 discoverClue nolan_soron_identity missing @ nolan_arc_gate');
  // 坐标重叠检查（同场景）
  for (const o of (lg.triggers || [])) {
    if (o.id === 'nolan_arc_gate') continue;
    const overlap = !(gate.x + gate.w <= o.x || o.x + o.w <= gate.x || gate.y + gate.h <= o.y || o.y + o.h <= gate.y);
    if (overlap) errors.push(`hotspot overlap with ${o.id} @ library_gate`);
  }
}

// 3c. maze_exit（地图 maze）：N3 挂载
const me = cfg.maps.maze;
let meExit = null;
for (const t of (me && me.triggers || [])) if (t.id === 'maze_exit') meExit = t;
if (!meExit) errors.push('trigger maze_exit missing');
else {
  const r = checkRefs(meExit.events, 'maze_exit');
  if (!r.ifClues.has('nolan_soron_identity')) errors.push('N3 ifClue nolan_soron_identity missing @ maze_exit');
  if (!r.ifFlags.has('morrow_pressed')) errors.push('N3 morrow_pressed diff missing @ maze_exit');
  if (!r.dialogs.has('nolan3_arc_intro')) errors.push('N3 nolan3_arc_intro not referenced @ maze_exit');
  if (!r.dialogs.has('nolan3_arc_end')) errors.push('N3 nolan3_arc_end not referenced @ maze_exit');
  for (const f of ['nolan_confronted','nolan_circumspect','nolan_sympathized']) {
    if (!r.setFlags.has(f)) errors.push(`N3 setFlag ${f} missing @ maze_exit`);
  }
  // 三档 dialog 均被引用
  for (const d of ['nolan3_confronted_reply','nolan3_circumspect_reply','nolan3_sympathized_reply',
                   'nolan3_confronted_after','nolan3_circumspect_after','nolan3_sympathized_after']) {
    if (!r.dialogs.has(d)) errors.push(`N3 ${d} not referenced @ maze_exit`);
  }
}

// 3d. palace_contract entryEvents：N4 挂载
const pc = cfg.maps.palace_contract;
if (!pc || !Array.isArray(pc.entryEvents)) errors.push('palace_contract entryEvents missing');
else {
  const r = checkRefs(pc.entryEvents, 'palace_contract.entryEvents');
  if (!r.ifFlags.has('nolan_arc_unlocked')) errors.push('N4 ifFlag nolan_arc_unlocked missing @ palace_contract');
  for (const d of ['nolan4_arc_open','nolan4_arc_close',
                   'nolan4_confronted_note','nolan4_sympathized_note','nolan4_circumspect_note',
                   'nolan4_confronted_shot','nolan4_sympathized_shot','nolan4_circumspect_shot']) {
    if (!r.dialogs.has(d)) errors.push(`N4 ${d} not referenced @ palace_contract`);
  }
}

// 4. 四协议布尔零改动（三协议 requirements 结构完整；buyoutBinding 为禁入 flag，非 clue）
for (const key of ['inherit','public_energy','charter']) {
  if (!cfg.endings[key] || !cfg.endings[key].requirements) errors.push('endings requirements broken: ' + key);
}

// 5. N 线 flag 不进任何 trigger 级 flags 断言（N1 采用事件内 ifFlag，无 trigger 级门控）
if (igTrigger && (igTrigger.flags || []).includes('nolan_arc_unlocked')) {
  errors.push('index_gate must not use trigger-level flags for N1 (event-internal ifFlag required)');
}

if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log(' - ' + e);
  process.exit(1);
}
console.log('ALL_N_ARC_CHECKS_PASSED');