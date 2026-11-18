import { h, render, injectStyle, callout, sorter, shuffle, rng } from './_kit.js';

const FUNCS = [
  { id: 'govern', label: 'Govern', icon: '🏛️', hint: 'Culture, policy, accountability',
    body: 'The cross-cutting function: build a culture where people actually care about AI risk, with clear policies, roles, and accountability. Without it, the other three become paperwork in a drawer.' },
  { id: 'map', label: 'Map', icon: '🗺️', hint: 'Context & impacts',
    body: 'Understand the context: what the system is for, who it affects (including people who never use it), where its data comes from, and what could go wrong.' },
  { id: 'measure', label: 'Measure', icon: '📏', hint: 'Track the risks you mapped',
    body: 'Find ways to quantify or monitor each risk the Map step surfaced — often creatively, since black-box models resist neat measurement.' },
  { id: 'manage', label: 'Manage', icon: '🛠️', hint: 'Act on risks',
    body: 'Prioritize and act: mitigate, respond to incidents, and decide when a system should be changed, paused, or retired.' },
];

const ITEMS = [
  { id: 'owner', text: 'Name one person accountable for the AI system’s risks', answer: 'govern',
    why: 'Assigning responsibility is an organizational structure decision — Govern.' },
  { id: 'policy', text: 'Write a company policy on when AI may inform hiring decisions', answer: 'govern',
    why: 'Organization-wide rules and norms live in Govern.' },
  { id: 'blame', text: 'Make it safe for staff to report AI problems without blame', answer: 'govern',
    why: 'This is culture — the hardest and most important part of Govern.' },
  { id: 'affected', text: 'List everyone the system could affect, including non-users', answer: 'map',
    why: 'Identifying stakeholders and impacts is the heart of Map.' },
  { id: 'data', text: 'Document where the training data came from and what it leaves out', answer: 'map',
    why: 'Understanding data provenance and gaps is part of mapping the context.' },
  { id: 'worst', text: 'Brainstorm worst-case outcomes for each intended use', answer: 'map',
    why: 'The “what’s the worst that could happen?” exercise is Map.' },
  { id: 'unsupported', text: 'Test how often the chatbot makes claims its sources don’t support', answer: 'measure',
    why: 'Quantifying hallucination rate is a measurement (an eval).' },
  { id: 'groups', text: 'Compare error rates across demographic groups', answer: 'measure',
    why: 'Disaggregated evaluation is Measure.' },
  { id: 'weekly', text: 'Track tool-call accuracy every week after launch', answer: 'measure',
    why: 'Ongoing monitoring metrics belong to Measure.' },
  { id: 'approval', text: 'Add a human approval step before the agent sends email', answer: 'manage',
    why: 'A mitigation that reduces a mapped risk is Manage.' },
  { id: 'rollback', text: 'Roll back to the previous model when error rates spike', answer: 'manage',
    why: 'Incident response is Manage.' },
  { id: 'retire', text: 'Retire the system when its risks outweigh its benefits', answer: 'manage',
    why: 'Decommissioning decisions are part of managing risk across the whole life cycle.' },
];

const LIFECYCLE = [
  { id: 'design', label: 'Design', body: 'Decide what the system is for and whether AI is appropriate at all. Map stakeholders and harms before anything is built.' },
  { id: 'build', label: 'Build & test', body: 'Train, prompt, or assemble the system; evaluate it on data it hasn’t seen. Pre-deployment testing can only use the past.' },
  { id: 'deploy', label: 'Deploy', body: 'Release to real users — the moment many teams treat as the finish line. It isn’t: this is where new risks start.' },
  { id: 'monitor', label: 'Monitor', body: 'Watch for problems that testing couldn’t reveal (see the post-deployment risks below), and keep measuring.', risks: true },
  { id: 'retire', label: 'Decommission', body: 'Plan how the system ends: data retention, user migration, and what replaces it. The framework asks you to think about this too.' },
];

const RISKS = [
  { t: 'Distribution shift', b: 'Models predict from past data. When the present stops resembling the past — new users, new slang, a new season — errors appear that testing never saw.' },
  { t: 'Adversarial users', b: 'Historical test data came from people with no reason to game an AI. Once the AI decides something that matters, some people will try to manipulate it.' },
  { t: 'Systems that keep changing', b: 'Tools that keep fine-tuning or adapting themselves in deployment can drift into behavior no one tested — which is why some experts argue high-stakes systems should never self-modify.' },
];

export function mount(el, ctx) {
  injectStyle('lab-nist-rmf', `
    .lab-nist-rmf .nr-funcs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    @media (max-width: 760px) { .lab-nist-rmf .nr-funcs { grid-template-columns: 1fr 1fr; } }
    .lab-nist-rmf .nr-func { background: var(--surface-2); border-radius: 10px; padding: 10px 12px; font-size: .86rem; }
    .lab-nist-rmf .nr-func.govern { grid-column: 1 / -1; background: var(--accent-soft); }
    .lab-nist-rmf .nr-func h4 { margin: 0 0 3px; }
    .lab-nist-rmf .nr-life { display: flex; gap: 0; overflow-x: auto; padding-bottom: 4px; }
    .lab-nist-rmf .nr-stage { flex: 1 1 0; min-width: 96px; font: inherit; font-size: .85rem; font-weight: 650; color: var(--text-2); background: var(--surface-2);
      border: 1px solid var(--border); padding: 10px 6px; cursor: pointer; position: relative; }
    .lab-nist-rmf .nr-stage:first-child { border-radius: 9px 0 0 9px; }
    .lab-nist-rmf .nr-stage:last-child { border-radius: 0 9px 9px 0; }
    .lab-nist-rmf .nr-stage[aria-pressed="true"] { background: var(--accent); color: #fff; border-color: var(--accent); }
    :root[data-theme="dark"] .lab-nist-rmf .nr-stage[aria-pressed="true"] { color: #0d1220; }
    .lab-nist-rmf .nr-stage .ph { display: block; font-size: .68rem; font-weight: 600; opacity: .75; text-transform: uppercase; letter-spacing: .05em; }
    .lab-nist-rmf .nr-why li { margin: 5px 0; font-size: .9rem; }
  `);

  let placements = ctx.store.get('placements', {});
  let stage = 'monitor';
  const result = h('div', { 'aria-live': 'polite' });
  const s = sorter({ items: shuffle(ITEMS, rng(11)), bins: FUNCS.map((f) => ({ id: f.id, label: `${f.icon} ${f.label}`, hint: f.hint })), placements,
    onChange: (p) => { placements = p; ctx.store.set('placements', p); render(result, null); } });

  function check() {
    const { correct, total, placed } = s.check();
    const wrong = ITEMS.filter((it) => placements[it.id] && placements[it.id] !== it.answer);
    const label = Object.fromEntries(FUNCS.map((f) => [f.id, f.label]));
    render(result, h('div', { class: 'stack' },
      callout(correct === total ? 'ok' : placed < total ? 'info' : 'warn', `${correct} of ${total} correct${placed < total ? ` (${total - placed} not placed yet)` : ''}`,
        correct === total ? 'Nicely done. Notice how Govern is what keeps the other three alive over time.' : 'Items outlined in red are in a different function than the framework suggests. Explanations below.'),
      wrong.length ? h('ul', { class: 'nr-why' }, wrong.map((it) => h('li', null, h('strong', null, it.text), ' → ', h('span', { class: 'tag accent' }, label[it.answer]), ' ', it.why))) : null,
      h('details', { class: 'acc' }, h('summary', null, 'All explanations'),
        h('div', { class: 'acc-body' }, h('ul', { class: 'nr-why' }, ITEMS.map((it) => h('li', null, h('span', { class: 'tag' }, label[it.answer]), ' ', it.text, ' — ', it.why)))))));
  }

  const lifeBox = h('div');
  const lifeDetail = h('div', { 'aria-live': 'polite' });
  function drawLife() {
    render(lifeBox, h('div', { class: 'nr-life', role: 'group', 'aria-label': 'AI life cycle stages' },
      LIFECYCLE.map((st, i) => h('button', { type: 'button', class: 'nr-stage', 'aria-pressed': String(stage === st.id), onclick: () => { stage = st.id; drawLife(); } },
        h('span', { class: 'ph' }, i < 2 ? 'pre-deployment' : 'post-deployment'), st.label))));
    const st = LIFECYCLE.find((x) => x.id === stage);
    render(lifeDetail, h('div', { class: 'stack' }, h('p', { style: 'margin:0' }, st.body),
      st.risks ? h('div', { class: 'grid-3' }, RISKS.map((r) => h('div', { class: 'panel flat', style: 'padding:12px' }, h('h4', null, r.t), h('p', { class: 'small', style: 'margin:0;color:var(--text-2)' }, r.b)))) : null));
  }

  render(el, h('div', { class: 'stack' },
    h('p', { class: 'muted', style: 'margin:0' },
      'The NIST AI Risk Management Framework (2023) is less a single yardstick than a structured set of questions organizations ask to build their own. It has four functions:'),
    h('div', { class: 'nr-funcs' }, FUNCS.map((f) => h('div', { class: `nr-func ${f.id}` }, h('h4', null, `${f.icon} ${f.label}`), f.body))),
    h('h4', { style: 'margin-top:8px' }, 'Sort the activities'),
    s.el,
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'btn primary', onclick: check }, 'Check'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { s.reset(); render(result, null); } }, '↺ Reset')),
    result,
    h('h4', { style: 'margin-top:8px' }, 'Across the whole life cycle'),
    lifeBox, lifeDetail,
    h('p', { class: 'small muted', style: 'margin:0' }, 'Paraphrased from the framework. Read the source: ',
      h('a', { href: 'https://www.nist.gov/itl/ai-risk-management-framework', target: '_blank', rel: 'noopener' }, 'NIST AI RMF'), '.'),
    callout('think', 'What this shows',
      'Responsible AI isn’t a one-time test before launch. Map what could go wrong, measure it, manage it — and govern so that those habits survive deadlines and staff turnover, all the way to the day the system is retired.')));

  drawLife();
}
