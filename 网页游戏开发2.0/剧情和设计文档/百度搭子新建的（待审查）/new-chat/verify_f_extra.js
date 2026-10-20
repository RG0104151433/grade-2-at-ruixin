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

// 1. 对白 id 中英定义唯一性（dialogueTree 与 dialogueTree_en 中各恰 1 处定义）
for (const k of fKeys) {
  const zhDefs = Object.keys(cfg.dialogueTree).filter(x => x === k).length;
  const enDefs = Object.keys(cfg.dialogueTree_en).filter(x => x === k).length;
  if (zhDefs !== 1) errors.push(`dialogueTree definition count for ${k}: ${zhDefs}`);
  if (enDefs !== 1) errors.push(`dialogueTree_en definition count for ${k}: ${enDefs}`);
}

// 2. clue 定义唯一性 + usedBy 指向
const clue = cfg.clues.fnale_pause;
if (!clue) errors.push('clue fnale_pause missing');
else {
  if (!clue.usedBy || clue.usedBy.length !== 1 || clue.usedBy[0] !== 'maps.pumping_station.scene.hotspots.fnale_gate.events') {
    errors.push('clue usedBy mismatch: ' + JSON.stringify(clue.usedBy));
  }
}

// 3. F 线 5 项状态标识在四协议 requirements 中零出现（硬约束 4 复核）
const reqText = JSON.stringify({
  inherit: cfg.endings.inherit && cfg.endings.inherit.requirements,
  public_energy: cfg.endings.public_energy && cfg.endings.public_energy.requirements,
  charter: cfg.endings.charter && cfg.endings.charter.requirements,
});
for (const s of ['fnale_arc_unlocked','fnale_helped','fnale_reported','fnale_neutral','fnale_pause']) {
  if (reqText.includes(s)) errors.push('F-line state leaked into requirements: ' + s);
}

// 4. F3 三选项互斥：fnale_gate 热区内 choice 选项 id 不重复、每个选项恰写一个互斥 flag
const ps = cfg.maps.pumping_station;
let gate = null;
for (const t of (ps && ps.scene && ps.scene.hotspots || [])) if (t.id === 'fnale_gate') gate = t;
if (gate) {
  let choiceCount = 0;
  (function walk(list) {
    for (const ev of list || []) {
      if (ev.type === 'choice') {
        choiceCount++;
        const flagsPerOption = ev.options.map(o => {
          const farr = [];
          (function w2(l2) {
            for (const e2 of l2 || []) {
              if (e2.type === 'setFlag') for (const f of e2.flags || []) farr.push(f);
              if (e2.type === 'ifFlag' || e2.type === 'ifClue') { w2(e2.then); w2(e2.else); }
              if (e2.type === 'choice') for (const o2 of e2.options || []) w2(o2.events);
            }
          })(o.events);
          return farr;
        });
        const allFlags = flagsPerOption.flat();
        if (new Set(allFlags).size !== allFlags.length) errors.push('F3 choice option flags not mutually exclusive');
        for (const f of ['fnale_helped','fnale_reported','fnale_neutral']) {
          if (!allFlags.includes(f)) errors.push('F3 choice missing option flag: ' + f);
        }
        // 选项内不得同时写多个互斥 flag
        for (const ff of flagsPerOption) {
          const inter = ff.filter(x => ['fnale_helped','fnale_reported','fnale_neutral'].includes(x));
          if (inter.length > 1) errors.push('F3 option writes multiple exclusive flags: ' + inter.join(','));
        }
      }
      if (ev.type === 'ifFlag' || ev.type === 'ifClue') { walk(ev.then); walk(ev.else); }
    }
  })(gate.events);
  if (choiceCount !== 1) errors.push('fnale_gate choice count = ' + choiceCount);
}

// 5. 剧本口核对白行数（6.4b）：F1 14 句 / F2 19 句（12+7）/ F3 前导 10 + 反馈 3 + 收尾 6 / F4 open 4 + helped 4 + reported 3 + neutral 1 + close 1
const expect = {
  fnale1_arc_show: 14,
  fnale2_arc_show: 12, fnale2_arc_clue: 7,
  fnale3_arc_intro: 10,
  fnale3_helped_reply: 1, fnale3_reported_reply: 1, fnale3_neutral_reply: 1,
  fnale3_helped_after: 3, fnale3_reported_after: 2, fnale3_neutral_after: 2,
  fnale4_arc_open: 4, fnale4_helped: 4, fnale4_reported: 3, fnale4_neutral: 1, fnale4_arc_close: 1,
};
for (const k of fKeys) {
  const zh = cfg.dialogueTree[k], en = cfg.dialogueTree_en[k];
  if (!zh) continue;
  if (zh.length !== expect[k]) errors.push(`zh line count ${k}: got ${zh.length}, expect ${expect[k]}`);
  if (en && en.length !== expect[k]) errors.push(`en line count ${k}: got ${en.length}, expect ${expect[k]}`);
}

if (errors.length) {
  console.log('ERRORS:');
  for (const e of errors) console.log(' - ' + e);
  process.exit(1);
}
console.log('F_EXTRA_CHECKS_PASSED');