// Lab: Research Brief Studio (Module 4 — Research with AI)
// (a) deep-research prompt builder, (b) claim tracer worksheet, (c) facts-vs-values sorter
import { h, render, injectStyle, copyText, downloadText, sorter, callout, debounce } from './_kit.js';

const RB_FIELDS = [
  { key: 'goal', label: 'Goal — what decision or project this serves', ph: "I'm deciding whether my small bakery should switch to compostable packaging next year." },
  { key: 'question', label: 'Research question', ph: 'What do compostable packaging options cost, how do they perform for baked goods, and do local facilities actually compost them?' },
  { key: 'context', label: 'My context and constraints', ph: 'Two locations in a mid-sized US city; ~3,000 boxes and bags a month; tight margins; customers often ask about sustainability.' },
  { key: 'sources', label: 'Sources to prioritize (and avoid)', ph: 'Municipal composting rules, supplier spec sheets, peer-reviewed life-cycle studies, trade-group data — flag anything sponsored by a vendor. Last 5 years.' },
  { key: 'output', label: 'Output shape and length', ph: 'A brief of ~700 words: options compared in a table, cost range per unit, local composting reality, strongest arguments for and against, 5 questions to ask suppliers.' },
];
const RULES = [
  { key: 'cite', text: 'Cite a source for every key factual claim.' },
  { key: 'separate', text: 'Clearly separate what the evidence shows from your own inferences.' },
  { key: 'gaps', text: 'Flag gaps, weak evidence, and places where credible sources disagree.' },
  { key: 'sides', text: 'Present the strongest case on more than one side.' },
  { key: 'length', text: 'Stay within the requested length — no padding.' },
];
const TYPES = ['Peer-reviewed study', 'Government / official', 'News report', 'Organization report', 'Company / vendor', 'Blog / opinion', 'Unknown'];
const SUPPORTS = ['Yes', 'Partly', 'No', "Couldn't find it"];

const EXAMPLE_ROWS = [
  { claim: 'Compostable clamshells cost 2–3× conventional plastic per unit.', source: 'supplier-pricing.example.com/catalog', type: 'Company / vendor', supports: 'Partly', conf: 3, note: 'Range is for one supplier only.' },
  { claim: 'Our city\'s facility accepts certified compostable food packaging.', source: 'City solid-waste FAQ (example.gov.test)', type: 'Government / official', supports: 'No', conf: 2, note: 'FAQ says "food scraps only" — packaging excluded.' },
  { claim: 'A 2022 life-cycle study found compostables have lower emissions overall.', source: 'Journal citation in the brief', type: 'Peer-reviewed study', supports: "Couldn't find it", conf: 4, note: 'Link 404s; title not found in a search.' },
];

const DISPUTES = [
  { id: 'd1', text: 'Did a city\'s new protected bike lanes reduce traffic injuries in their first two years?', answer: 'fact', why: 'Injury records before and after (with a comparison area) could settle this.' },
  { id: 'd2', text: 'Is a two-minute-faster commute worth losing street parking in front of small shops?', answer: 'value', why: 'Even with perfect data on time saved and sales lost, people weigh those differently.' },
  { id: 'd3', text: 'How much water would a proposed data center draw per day at full load?', answer: 'fact', why: 'Engineering specs and metered use from similar sites can answer it.' },
  { id: 'd4', text: 'Should a town accept higher water use in exchange for new tax revenue and jobs?', answer: 'value', why: 'A trade-off between goods; the facts inform it but don\'t decide it.' },
  { id: 'd5', text: 'Do students who study with an AI tutor score higher on a later exam taken without AI?', answer: 'fact', why: 'A well-designed study (randomized, delayed test) could measure this.' },
  { id: 'd6', text: 'Should a writing course permit AI assistance on graded essays at all?', answer: 'value', why: 'Depends on what you think the course is for — skills, product, fairness.' },
  { id: 'd7', text: 'Does a medication\'s side-effect rate differ between older and younger patients?', answer: 'fact', why: 'Clinical trial and post-market data by age group can answer it.' },
  { id: 'd8', text: 'Should an app\'s convenience features outweigh users\' location privacy?', answer: 'value', why: 'People rank privacy and convenience differently even when they agree on what the app does.' },
];

function tabs(names, onSelect) {
  const bar = h('div', { class: 'row rb-tabs', role: 'tablist' });
  const btns = names.map((n, i) => {
    const b = h('button', { type: 'button', role: 'tab', class: 'chip', 'aria-selected': 'false', 'aria-pressed': 'false', id: 'rb-tab-' + i }, n);
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const j = (i + (e.key === 'ArrowRight' ? 1 : names.length - 1)) % names.length;
        select(j); btns[j].focus();
      }
    });
    return b;
  });
  bar.append(...btns);
  function select(i) {
    btns.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.setAttribute('aria-pressed', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
    onSelect(i);
  }
  return { bar, select };
}

export function mount(el, ctx) {
  injectStyle('lab-research-brief', `
    .lab-research-brief .rb-out { white-space: pre-wrap; font-family: var(--font-mono); font-size: .84rem; background: var(--surface-2);
      border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; margin: 0; max-height: 420px; overflow: auto; }
    .lab-research-brief .rb-form-grid { display: grid; grid-template-columns: 2fr 1.2fr; gap: 10px; }
    .lab-research-brief .rb-form-grid .wide { grid-column: 1 / -1; }
    @media (max-width: 700px) { .lab-research-brief .rb-form-grid { grid-template-columns: 1fr; } }
    .lab-research-brief td .tag { white-space: nowrap; }
    .lab-research-brief .rb-explain li { margin: 6px 0; }
  `);
  const state = ctx.store.get('state', { fields: {}, rules: ['cite', 'separate', 'gaps', 'sides'], rows: null, placements: {} });
  if (!state.rows) state.rows = [];
  const save = debounce(() => ctx.store.set('state', state), 200);
  const pane = h('div', { role: 'tabpanel', 'aria-live': 'polite' });
  const panes = [builderPane(), tracerPane(), sorterPane()];
  const t = tabs(['1 · Brief the researcher', '2 · Trace the claims', '3 · Facts or values?'], (i) => { render(pane, panes[i]); ctx.store.set('tab', i); });

  // ---------- (a) builder ----------
  function builderPane() {
    const out = h('pre', { class: 'rb-out', 'aria-label': 'Assembled research prompt' });
    const inputs = {};
    const assemble = () => {
      const f = state.fields;
      const lines = [];
      const add = (k, label) => { if ((f[k] || '').trim()) lines.push(`${label}: ${f[k].trim()}`); };
      add('goal', 'GOAL'); add('question', 'RESEARCH QUESTION'); add('context', 'MY CONTEXT'); add('sources', 'SOURCES'); add('output', 'OUTPUT');
      const rules = RULES.filter((r) => state.rules.includes(r.key));
      if (rules.length) lines.push('RULES:\n' + rules.map((r) => '- ' + r.text).join('\n'));
      return lines.join('\n\n');
    };
    const update = () => { out.textContent = assemble() || 'Fill in the fields (or load the example) to assemble your research brief.'; save(); };
    const fields = RB_FIELDS.map((f) => {
      const ta = h('textarea', { id: 'rb-' + f.key, rows: 2, placeholder: f.ph });
      ta.value = state.fields[f.key] || '';
      ta.addEventListener('input', () => { state.fields[f.key] = ta.value; update(); });
      inputs[f.key] = ta;
      return h('div', { class: 'field' }, h('label', { for: 'rb-' + f.key }, f.label), ta);
    });
    const rules = h('div', { class: 'stack', style: { gap: '6px' } }, h('div', { class: 'label' }, 'Rules for the researcher'),
      RULES.map((r) => {
        const cb = h('input', { type: 'checkbox', id: 'rb-r-' + r.key });
        cb.checked = state.rules.includes(r.key);
        cb.addEventListener('change', () => { state.rules = RULES.filter((x) => x.key === r.key ? cb.checked : state.rules.includes(x.key)).map((x) => x.key); update(); });
        return h('label', { class: 'check', for: 'rb-r-' + r.key }, cb, h('span', null, r.text));
      }));
    const loadEx = () => { for (const f of RB_FIELDS) { state.fields[f.key] = f.ph; inputs[f.key].value = f.ph; } update(); };
    update();
    return h('div', { class: 'stack' },
      h('p', { class: 'muted' }, 'Deep-research tools run many searches and write long reports on their own. Your leverage is up front: a precise brief and rules about evidence.'),
      h('div', { class: 'lab-grid' },
        h('div', { class: 'stack' }, fields, rules, h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn small', onclick: loadEx }, 'Load bakery example'))),
        h('div', { class: 'stack' },
          h('div', { class: 'row between' }, h('h4', { style: { margin: 0 } }, 'Research prompt'),
            h('button', { type: 'button', class: 'btn primary small', onclick: () => copyText(assemble(), 'Research prompt copied') }, 'Copy')),
          out,
          callout('info', 'Tip', 'Reports tend to run long. Asking for a word limit and a table up front makes the result much easier to verify.'))));
  }

  // ---------- (b) claim tracer ----------
  function tracerPane() {
    const tableBody = h('tbody');
    const stats = h('div', { class: 'stats', 'aria-live': 'polite' });
    const insight = h('div');
    const f = {
      claim: h('input', { type: 'text', id: 'ct-claim', placeholder: 'The report says…' }),
      source: h('input', { type: 'text', id: 'ct-source', placeholder: 'Link or short name' }),
      type: h('select', { id: 'ct-type' }, TYPES.map((x) => h('option', null, x))),
      supports: h('select', { id: 'ct-sup' }, SUPPORTS.map((x) => h('option', null, x))),
      conf: h('input', { type: 'range', min: 1, max: 5, step: 1, value: 3, id: 'ct-conf' }),
      note: h('input', { type: 'text', id: 'ct-note', placeholder: 'What you found when you opened it' }),
    };
    const confOut = h('span', { class: 'mono small' }, '3');
    f.conf.addEventListener('input', () => { confOut.textContent = f.conf.value; });
    const supTag = (v) => h('span', { class: 'tag ' + ({ Yes: 'ok', Partly: 'warn', No: 'bad' }[v] || 'bad') }, v);
    const draw = () => {
      render(tableBody, state.rows.length ? state.rows.map((r, i) => h('tr', null,
        h('td', null, r.claim, r.note ? h('div', { class: 'hint' }, r.note) : null),
        h('td', { class: 'small' }, r.source, h('div', { class: 'hint' }, r.type)),
        h('td', null, supTag(r.supports)),
        h('td', { class: 'mono' }, r.conf + '/5'),
        h('td', null, h('button', { type: 'button', class: 'btn ghost small', 'aria-label': 'Remove claim ' + (i + 1), onclick: () => { state.rows.splice(i, 1); save(); draw(); } }, '✕'))))
        : h('tr', null, h('td', { colspan: 5, class: 'muted center' }, 'No claims yet — add one above, or load examples.')));
      const n = state.rows.length;
      const yes = state.rows.filter((r) => r.supports === 'Yes').length;
      const bad = state.rows.filter((r) => r.supports === 'No' || r.supports === "Couldn't find it").length;
      const avg = n ? (state.rows.reduce((a, r) => a + Number(r.conf), 0) / n).toFixed(1) : '–';
      render(stats,
        stat('Claims traced', n), stat('Fully supported', n ? Math.round((yes / n) * 100) + '%' : '–'),
        stat('Unsupported / not found', bad), stat('Avg. confidence', avg));
      const overconf = state.rows.filter((r) => (r.supports === 'No' || r.supports === "Couldn't find it") && r.conf >= 4);
      render(insight,
        overconf.length ? callout('warn', 'Check your confidence', `${overconf.length} claim(s) rated 4–5/5 even though the source didn't back them up. Fluent writing is not evidence.`)
          : n >= 3 && bad === 0 ? callout('ok', 'Nicely traced', 'Every claim you checked held up. Remember you checked a sample — the rest of the report is still unverified.') : null);
    };
    const add = () => {
      if (!f.claim.value.trim()) { ctx.toast('Write the claim first'); f.claim.focus(); return; }
      state.rows.push({ claim: f.claim.value.trim(), source: f.source.value.trim() || '(no source given)', type: f.type.value, supports: f.supports.value, conf: Number(f.conf.value), note: f.note.value.trim() });
      f.claim.value = ''; f.source.value = ''; f.note.value = '';
      save(); draw(); f.claim.focus();
    };
    const exportMd = () => {
      const lines = ['# Claim tracer', '', '| Claim | Source | Type | Source supports it? | Confidence | Notes |', '|---|---|---|---|---|---|',
        ...state.rows.map((r) => `| ${r.claim} | ${r.source} | ${r.type} | ${r.supports} | ${r.conf}/5 | ${r.note || ''} |`.replace(/\n/g, ' '))];
      downloadText('claim-tracer.md', lines.join('\n') + '\n');
    };
    draw();
    return h('div', { class: 'stack' },
      h('p', { class: 'muted' }, 'Step away from the AI. Pick the claims the report leans on hardest, open each source yourself, and record whether it really says that. Asking the AI "is this right?" is not an independent check.'),
      h('div', { class: 'panel tint rb-form-grid' },
        h('div', { class: 'field wide' }, h('label', { for: 'ct-claim' }, 'Claim from the report'), f.claim),
        h('div', { class: 'field' }, h('label', { for: 'ct-source' }, 'Cited source'), f.source),
        h('div', { class: 'field' }, h('label', { for: 'ct-type' }, 'Source type'), f.type),
        h('div', { class: 'field' }, h('label', { for: 'ct-sup' }, 'Does the source actually say this?'), f.supports),
        h('div', { class: 'field' }, h('div', { class: 'row between' }, h('label', { for: 'ct-conf' }, 'Your confidence in the claim'), confOut), f.conf),
        h('div', { class: 'field wide' }, h('label', { for: 'ct-note' }, 'Notes'), f.note),
        h('div', { class: 'row wide' },
          h('button', { type: 'button', class: 'btn primary', onclick: add }, 'Add claim'),
          h('button', { type: 'button', class: 'btn small', onclick: () => { state.rows.push(...EXAMPLE_ROWS.map((r) => ({ ...r }))); save(); draw(); } }, 'Load examples'),
          h('button', { type: 'button', class: 'btn small', onclick: exportMd }, 'Export Markdown'),
          h('button', { type: 'button', class: 'btn ghost small', onclick: () => { if (confirm('Clear all traced claims?')) { state.rows = []; save(); draw(); } } }, 'Clear'))),
      stats, insight,
      h('div', { class: 'table-wrap' }, h('table', null,
        h('thead', null, h('tr', null, h('th', null, 'Claim'), h('th', null, 'Source'), h('th', null, 'Supports?'), h('th', null, 'Conf.'), h('th', null, h('span', { class: 'sr-only' }, 'Remove')))),
        tableBody)));
  }

  // ---------- (c) facts vs values ----------
  function sorterPane() {
    const result = h('div', { 'aria-live': 'polite' });
    const s = sorter({
      items: DISPUTES.map((d) => ({ id: d.id, text: d.text, answer: d.answer })),
      bins: [
        { id: 'fact', label: 'Factual dispute', hint: 'Better evidence could settle it' },
        { id: 'value', label: 'Values disagreement', hint: 'Persists even with perfect evidence' },
      ],
      placements: state.placements,
      onChange: (p) => { state.placements = p; save(); render(result); },
    });
    const check = () => {
      const r = s.check();
      render(result, h('div', { class: 'stack' },
        callout(r.correct === r.total ? 'ok' : 'info', `${r.correct} of ${r.total} sorted as we would`, r.placed < r.total ? `You've placed ${r.placed} so far.` : 'Read the reasoning below — some real disputes mix both kinds.'),
        h('ul', { class: 'rb-explain small' }, DISPUTES.map((d) => h('li', null, h('span', { class: 'tag ' + (d.answer === 'fact' ? 'teal' : 'violet') }, d.answer === 'fact' ? 'Fact' : 'Values'), ' ', h('strong', null, d.text), ' — ', d.why)))));
    };
    return h('div', { class: 'stack' },
      h('p', { class: 'muted' }, 'Research briefs are much better at resolving one kind of disagreement than the other. Sort these.'),
      s.el,
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary', onclick: check }, 'Check'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => { s.reset(); render(result); } }, 'Reset')),
      result);
  }

  function stat(k, v) { return h('div', { class: 'stat' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, String(v))); }

  render(el, h('div', { class: 'stack-lg' },
    t.bar, pane,
    callout('think', 'What this shows', h('p', null, 'An AI researcher can gather and summarize far faster than you, but it can\'t decide what question matters, which evidence you should trust, or how to weigh values. Brief it precisely, trace the claims you\'ll rely on back to their sources, and notice when a disagreement is about facts (go get evidence) versus values (that part is yours).'))));
  t.select(Math.min(2, Math.max(0, Number(ctx.store.get('tab', 0)) || 0)));
}
