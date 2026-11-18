import { h, render, injectStyle, callout } from './_kit.js';

// sev / lik: 1 = low, 2 = medium, 3 = high.  rev: reversible | partial | irreversible
const OUTCOMES = [
  { id: 'tax', short: 'Tax docs deleted', agent: 'Downloads cleanup', rev: 'irreversible', ref: [3, 2],
    text: 'Permanently deletes the only copy of last year’s tax return, which you hadn’t opened in 8 months.',
    fix: 'Move to Trash instead of permanent delete; show a list for approval first; exclude PDFs and documents.' },
  { id: 'installer', short: 'Old installer removed', agent: 'Downloads cleanup', rev: 'reversible', ref: [1, 3],
    text: 'Deletes a 2 GB app installer you could re-download in a minute.',
    fix: 'Accept the risk — this is the intended behavior.' },
  { id: 'sync', short: 'Synced folder wiped', agent: 'Downloads cleanup', rev: 'partial', ref: [3, 1],
    text: 'Treats a cloud-synced folder as “Downloads” and the deletions propagate to every device you own.',
    fix: 'Scope permissions to one folder path only; dry run that reports total size and paths before acting.' },
  { id: 'scam', short: 'Phone # to a scammer', agent: 'Recruiter replies', rev: 'irreversible', ref: [2, 2],
    text: 'Replies warmly to a fake recruiter and includes your phone number to “set up a call.”',
    fix: 'Never include contact details automatically; verify the company domain; draft-then-approve replies.' },
  { id: 'inject', short: 'Injected instructions', agent: 'Recruiter replies', rev: 'irreversible', ref: [3, 2],
    text: 'A message contains hidden text telling the AI to forward your résumé and references to an unknown address — and it complies.',
    fix: 'Treat incoming messages as untrusted data; block sending attachments or to new recipients without approval.' },
  { id: 'interview', short: 'Double-booked interview', agent: 'Recruiter replies', rev: 'reversible', ref: [2, 2],
    text: 'Accepts an interview slot on a day you’ll be traveling.',
    fix: 'Give read access to your calendar and require it to propose times, not accept them.' },
  { id: 'generic', short: 'Bland reply to dream job', agent: 'Recruiter replies', rev: 'partial', ref: [2, 3],
    text: 'Sends a generic, obviously automated reply to the one company you really care about.',
    fix: 'Flag priority companies for a human-written reply; cap automation to low-stakes messages.' },
  { id: 'roommate', short: 'Roommate in photo', agent: 'Dorm-leak report', rev: 'irreversible', ref: [2, 2],
    text: 'Attaches a photo that also shows your roommate’s face and belongings to the maintenance email.',
    fix: 'Show selected photos for approval; restrict the connector to an album you create for the report.' },
  { id: 'spam', short: '40 duplicate emails', agent: 'Dorm-leak report', rev: 'partial', ref: [1, 2],
    text: 'While “monitoring for a response,” it re-sends the report every hour overnight.',
    fix: 'Rate-limit sends (max 1 follow-up per day); stopping condition after N attempts.' },
];

const LEVEL = ['', 'Low', 'Medium', 'High'];
const REV_CLS = { reversible: 'ok', partial: 'warn', irreversible: 'bad' };
const REV_LABEL = { reversible: 'Reversible', partial: 'Partly reversible', irreversible: 'Irreversible' };

export function mount(el, ctx) {
  injectStyle('lab-risk-matrix', `
    .lab-risk-matrix .rm-grid { display: grid; grid-template-columns: 28px repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(96px, auto)) 28px; gap: 6px; }
    .lab-risk-matrix .rm-ylab { writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-size: .72rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; align-self: center; }
    .lab-risk-matrix .rm-xlab { text-align: center; font-size: .72rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
    .lab-risk-matrix .rm-cell { border: 1px solid var(--border); border-radius: 8px; padding: 6px; display: flex; flex-wrap: wrap; gap: 4px; align-content: flex-start; cursor: pointer; text-align: left; font: inherit; color: inherit; min-width: 0; }
    .lab-risk-matrix .rm-cell:hover { outline: 2px solid var(--accent); }
    .lab-risk-matrix .rm-cell.p1 { background: var(--ok-soft); }
    .lab-risk-matrix .rm-cell.p2 { background: var(--warn-soft); }
    .lab-risk-matrix .rm-cell.p3 { background: var(--bad-soft); }
    .lab-risk-matrix .rm-chip { font-size: .74rem; line-height: 1.25; padding: 3px 6px; border-radius: 6px; background: var(--surface); border: 1px solid var(--border-strong); cursor: pointer; font-family: inherit; color: var(--text); max-width: 100%; text-align: left; }
    .lab-risk-matrix .rm-chip.sel { outline: 2px solid var(--accent); }
    .lab-risk-matrix .rm-chip.rev-ok { border-left: 4px solid var(--ok); }
    .lab-risk-matrix .rm-chip.rev-warn { border-left: 4px solid var(--warn); }
    .lab-risk-matrix .rm-chip.rev-bad { border-left: 4px solid var(--bad); }
    .lab-risk-matrix .rm-deck { display: flex; flex-direction: column; gap: 8px; }
    .lab-risk-matrix .rm-card { text-align: left; font: inherit; color: inherit; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 9px; padding: 9px 11px; cursor: pointer; }
    .lab-risk-matrix .rm-card.sel { outline: 3px solid var(--accent); }
    .lab-risk-matrix .rm-card .a { font-size: .74rem; color: var(--muted); font-weight: 650; text-transform: uppercase; letter-spacing: .05em; }
    .lab-risk-matrix .rm-card .t { font-size: .9rem; }
    .lab-risk-matrix .rm-rank li { margin: 8px 0; }
    .lab-risk-matrix .rm-ref { font-size: .8rem; margin-left: 6px; }
  `);

  let placed = ctx.store.get('placed', {}); // id -> [sev, lik]
  let selected = null;
  let colorRev = false;
  let showRef = false;

  const deckBox = h('div', { class: 'rm-deck' });
  const gridBox = h('div', { class: 'rm-grid', role: 'grid', 'aria-label': 'Risk matrix: severity by likelihood' });
  const rankBox = h('div', { 'aria-live': 'polite' });
  const selInfo = h('div', { class: 'hint', 'aria-live': 'polite' });

  const save = () => ctx.store.set('placed', placed);
  const byId = Object.fromEntries(OUTCOMES.map((o) => [o.id, o]));

  function select(id) { selected = selected === id ? null : id; draw(); }

  function place(sev, lik) {
    if (!selected) { selInfo.textContent = 'Select an outcome first, then choose a cell.'; return; }
    placed[selected] = [sev, lik];
    const next = OUTCOMES.find((o) => !placed[o.id]);
    selected = next ? next.id : null;
    save(); draw();
  }

  function chipCls(o) { return 'rm-chip' + (selected === o.id ? ' sel' : '') + (colorRev ? ` rev-${REV_CLS[o.rev]}` : ''); }

  function draw() {
    const unplaced = OUTCOMES.filter((o) => !placed[o.id]);
    render(deckBox,
      unplaced.length ? unplaced.map((o) => h('button', {
        type: 'button', class: 'rm-card' + (selected === o.id ? ' sel' : ''), 'aria-pressed': String(selected === o.id), onclick: () => { selected = o.id; draw(); },
      }, h('div', { class: 'a' }, o.agent), h('div', { class: 't' }, o.text),
        colorRev ? h('span', { class: `tag ${REV_CLS[o.rev]}`, style: 'margin-top:6px' }, REV_LABEL[o.rev]) : null))
        : h('div', { class: 'callout ok' }, 'All outcomes placed. Click a chip in the grid to move it.'));

    const cells = [];
    for (let sev = 3; sev >= 1; sev--) {
      cells.push(h('div', { class: 'rm-ylab' }, sev === 2 ? 'Severity →' : ''));
      for (let lik = 1; lik <= 3; lik++) {
        const here = OUTCOMES.filter((o) => placed[o.id] && placed[o.id][0] === sev && placed[o.id][1] === lik);
        const score = sev * lik;
        const cell = h('div', {
          class: `rm-cell p${score >= 6 ? 3 : score >= 3 ? 2 : 1}`, role: 'gridcell', tabindex: '0',
          'aria-label': `${LEVEL[sev]} severity, ${LEVEL[lik]} likelihood. ${here.length} items.`,
        });
        cell.addEventListener('click', () => place(sev, lik));
        cell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); place(sev, lik); } });
        for (const o of here) {
          const ref = o.ref[0] === sev && o.ref[1] === lik;
          const chip = h('button', { type: 'button', class: chipCls(o), title: o.text },
            o.short, showRef ? h('span', { class: 'rm-ref', 'aria-label': ref ? 'matches reference' : 'differs from reference' }, ref ? '✓' : '↕') : null);
          chip.addEventListener('click', (e) => { e.stopPropagation(); select(o.id); });
          cell.appendChild(chip);
        }
        cells.push(cell);
      }
    }
    cells.push(h('div'));
    for (let lik = 1; lik <= 3; lik++) cells.push(h('div', { class: 'rm-xlab' }, LEVEL[lik], lik === 2 ? ' · likelihood →' : ''));
    render(gridBox, cells);
    // label rows (top = High severity)
    [...gridBox.querySelectorAll('.rm-ylab')].forEach((y, i) => { y.textContent = `${LEVEL[3 - i]} sev.`; });

    selInfo.textContent = selected ? `Selected: “${byId[selected].short}” — now click a cell to place it.` : 'Select an outcome card, then click a cell in the grid.';

    const ranked = OUTCOMES.filter((o) => placed[o.id])
      .map((o) => ({ o, score: placed[o.id][0] * placed[o.id][1] }))
      .sort((a, b) => b.score - a.score || (a.o.rev === 'irreversible' ? -1 : 1));
    if (!ranked.length) { render(rankBox, null); return; }
    const diffs = ranked.filter(({ o }) => placed[o.id][0] !== o.ref[0] || placed[o.id][1] !== o.ref[1]).length;
    render(rankBox, h('div', { class: 'panel tint stack' },
      h('h4', null, 'Your mitigation priorities'),
      h('ol', { class: 'rm-rank' }, ranked.slice(0, 4).map(({ o, score }) => h('li', null,
        h('strong', null, o.short), ' ', h('span', { class: 'tag' }, `score ${score}`), ' ',
        h('span', { class: `tag ${REV_CLS[o.rev]}` }, REV_LABEL[o.rev]),
        h('div', { class: 'small', style: 'color:var(--text-2)' }, '→ ', o.fix)))),
      showRef ? callout('info', `Reference comparison: ${ranked.length - diffs} of ${ranked.length} match`,
        'The reference is one reasonable placement, not an answer key. Reasonable people differ — and for a technology this new, with little historical data, likelihood is an educated guess at best. Where you differ, ask: was it the severity or the likelihood you judged differently, and did reversibility drive it?') : null));
  }

  const toggle = (label, get, set) => {
    const id = 'rm-' + label.replace(/\W+/g, '').toLowerCase();
    const cb = h('input', { type: 'checkbox', id });
    cb.checked = get();
    cb.addEventListener('change', () => { set(cb.checked); draw(); });
    return h('label', { class: 'check', for: id }, cb, h('span', null, label));
  };

  render(el, h('div', { class: 'stack' },
    h('p', { class: 'muted', style: 'margin:0' },
      'Here are nine ways three agents could go wrong. Put each one on the grid: how bad would it be (severity), and how likely is it (likelihood)?'),
    h('div', { class: 'row' },
      toggle('Color by reversibility', () => colorRev, (v) => { colorRev = v; }),
      toggle('Compare with a reference placement', () => showRef, (v) => { showRef = v; }),
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => { placed = {}; selected = OUTCOMES[0].id; save(); draw(); } }, '↺ Clear grid')),
    h('div', { class: 'lab-grid' },
      h('div', { class: 'stack' }, h('div', { class: 'label' }, 'Outcome deck'), deckBox),
      h('div', { class: 'stack' }, selInfo, gridBox, rankBox)),
    callout('think', 'What this shows',
      'A risk matrix puts your mitigation effort where it matters most: things that are both likely and severe. Reversibility often decides severity — a deleted file in the Trash is an inconvenience, while a sent email or a permanently erased document can’t be taken back. Many top risks share one fix: narrower permissions and a human checkpoint before irreversible actions.')));

  selected = OUTCOMES.find((o) => !placed[o.id])?.id || null;
  draw();
}
