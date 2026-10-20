// 批次 2（D/N/F 线）第 1 层静态校验：事件类型白名单 + 四协议 requirements 零泄漏
// 用法：node verify_batch2_l1.js <story_config.js>
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(process.argv[2], 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: 'story_config.js' });
const cfg = sandbox.window.STORY_CONFIG;
const errors = [];

const WHITELIST = new Set([
  'dialog','setFlag','discoverClue','ifClue','ifFlag','finaleChoice','changeMap','preload',
  'goalHint','archiveTransition','inviteVerify','indexBook','fade','choice'
]);

function scanCollect(list, label, types) {
  for (const ev of list || []) {
    if (!ev || !ev.type) { errors.push('event missing type @ ' + label); continue; }
    types.add(ev.type);
    if (ev.type === 'ifFlag' || ev.type === 'ifClue') { scanCollect(ev.then, label, types); scanCollect(ev.else, label, types); }
    if (ev.type === 'choice') for (const o of ev.options || []) scanCollect(o.events, label, types);
  }
}
function collectBranch(evs, match) {
  const types = new Set();
  let found = false;
  function into(list) { scanCollect(list, 'branch', types); }
  (function search(list) {
    for (const ev of list || []) {
      if (found) return;
      if (match(ev)) { found = true; into(ev.then); into(ev.else); return; }
      if (ev.type === 'ifFlag' || ev.type === 'ifClue') { search(ev.then); search(ev.else); }
      else if (ev.type === 'choice') for (const o of ev.options || []) search(o.events);
    }
  })(evs);
  return { types, found };
}
function assertWhitelist(types, label) {
  for (const t of types) if (!WHITELIST.has(t)) errors.push('event type not whitelisted: ' + t + ' @ ' + label);
}
function collectRoot(list, label) { const s = new Set(); scanCollect(list, label, s); return s; }

// 1. 事件类型白名单（本批新增/修改事件序列）
const pump = cfg.maps.pumping_station;
const dgate = (pump.scene && pump.scene.hotspots || []).find(h => h.id === 'debt_arc_gate');
const fgate = (pump.scene && pump.scene.hotspots || []).find(h => h.id === 'fnale_gate');
if (!dgate) errors.push('debt_arc_gate missing'); else assertWhitelist(collectRoot(dgate.events, 'D debt_arc_gate'), 'D debt_arc_gate');

const ig = cfg.maps.treasure;
const igT = (ig && ig.triggers || []).find(t => t.id === 'index_gate');
if (!igT) errors.push('index_gate missing');
else {
  const r = collectBranch(igT.events, ev => ev.type === 'ifFlag' && ev.flag === 'nolan_arc_unlocked');
  if (!r.found) errors.push('N1 branch missing @ index_gate'); else assertWhitelist(r.types, 'N1 index_gate');
}
const lg = cfg.maps.library_gate;
const ngate = (lg && lg.triggers || []).find(t => t.id === 'nolan_arc_gate');
if (!ngate) errors.push('nolan_arc_gate missing'); else assertWhitelist(collectRoot(ngate.events, 'N2 nolan_arc_gate'), 'N2 nolan_arc_gate');
const maze = cfg.maps.maze;
const me = (maze && maze.triggers || []).find(t => t.id === 'maze_exit');
if (!me) errors.push('maze_exit missing');
else {
  const r = collectBranch(me.events, ev => ev.type === 'ifClue' && ev.id === 'nolan_soron_identity');
  if (!r.found) errors.push('N3 branch missing @ maze_exit'); else assertWhitelist(r.types, 'N3 maze_exit');
}
const pc = cfg.maps.palace_contract;
if (!pc || !Array.isArray(pc.entryEvents)) errors.push('palace_contract.entryEvents missing');
else {
  const r4 = collectBranch(pc.entryEvents, ev => ev.type === 'ifFlag' && ev.flag === 'nolan_arc_unlocked');
  if (!r4.found) errors.push('N4 branch missing @ palace_contract'); else assertWhitelist(r4.types, 'N4 palace_contract');
  const rf = collectBranch(pc.entryEvents, ev => ev.type === 'ifFlag' && ev.flag === 'fnale_arc_unlocked');
  if (!rf.found) errors.push('F4 branch missing @ palace_contract'); else assertWhitelist(rf.types, 'F4 palace_contract');
}
if (!fgate) errors.push('fnale_gate missing'); else assertWhitelist(collectRoot(fgate.events, 'F fnale_gate'), 'F fnale_gate');

// 2. 四协议 requirements 零泄漏（20 个批次 2 运行期标识）
const anchors = [
  'debt_arc_gate','debt_arc_unlocked','debt_21_47_witness','debt_21_47_partial','debt_mother_notice','debt_mother_attendance','debt_c1_infiltrate','debt_c1_retreat',
  'nolan_arc_gate','nolan_arc_unlocked','nolan_confronted','nolan_circumspect','nolan_sympathized','nolan_soron_identity',
  'fnale_gate','fnale_arc_unlocked','fnale_helped','fnale_reported','fnale_neutral','fnale_pause'
];
const reqKeys = ['inherit', 'public_energy', 'charter'];
function reqText(k) { return JSON.stringify(cfg.endings[k] && cfg.endings[k].requirements || null); }
for (const k of reqKeys) {
  if (!cfg.endings[k] || !cfg.endings[k].requirements) errors.push('endings requirements broken: ' + k);
}
for (const a of anchors) {
  for (const k of reqKeys) {
    if (reqText(k).includes(a)) errors.push('batch2 state leaked into ' + k + ' requirements: ' + a);
  }
}

// 3. buyoutBinding 语义零改动：三协议 requirements 的 noneOf 闸门引用保留（buyoutBinding 为 flag，非 endings 顶层属性）
for (const k of reqKeys) {
  if (!reqText(k).includes('buyoutBinding')) errors.push('buyoutBinding gate missing in ' + k + ' requirements');
}

if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log(' - ' + e);
  process.exit(1);
}

console.log('L1_WHITELIST_AND_LEAK_CHECKS_PASSED');
console.log('--- requirements snapshot ---');
for (const k of reqKeys) console.log(k + '=' + reqText(k));
const der = ['inherit','public_energy','charter'].map(k => reqText(k)).join('');
console.log('derivedCheck=' + (der.includes('allAlmanac') ? 'allAlmanac-present' : 'allAlmanac-absent') + ',' + (der.includes('art3misOnline') ? 'art3misOnline-present' : 'art3misOnline-absent'));