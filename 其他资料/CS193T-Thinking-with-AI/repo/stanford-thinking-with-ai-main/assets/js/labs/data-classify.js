import { h, render, injectStyle, callout, sorter, shuffle, rng } from './_kit.js';

const BINS = [
  { id: 'high', label: '🔴 High risk', hint: 'Serious harm if exposed; often legally protected' },
  { id: 'moderate', label: '🟠 Moderate risk', hint: 'Internal or private; not for public release' },
  { id: 'low', label: '🟢 Low risk', hint: 'Already public or meant to be' },
];

const ITEMS = [
  { id: 'health', text: 'A patient’s visit notes from a campus clinic', answer: 'high', why: 'Health information (including protected health information) is high risk.' },
  { id: 'ssn', text: 'A Social Security number', answer: 'high', why: 'Government identifiers enable identity theft — high risk.' },
  { id: 'card', text: 'A credit card number', answer: 'high', why: 'Payment card numbers are high risk.' },
  { id: 'passport', text: 'A passport or visa number', answer: 'high', why: 'Travel documents are high-risk identifiers.' },
  { id: 'bank', text: 'A bank account number for direct deposit', answer: 'high', why: 'Financial account numbers are high risk.' },
  { id: 'grades', text: 'A student’s grades and transcript', answer: 'moderate', why: 'Student records are private (and protected by education privacy law) — moderate in this scheme.' },
  { id: 'research', text: 'Unpublished research data', answer: 'moderate', why: 'Generally moderate, at the data owner’s discretion — some research data is low or high.' },
  { id: 'budget', text: 'An internal email about next year’s department budget', answer: 'moderate', why: 'Internal memos, budgets, and plans are not public — moderate.' },
  { id: 'salary', text: 'A staff member’s salary and home address', answer: 'moderate', why: 'Personnel files and personal contact info are moderate risk.' },
  { id: 'univid', text: 'A university ID number', answer: 'moderate', why: 'University and employee ID numbers are moderate risk.' },
  { id: 'job', text: 'A job posting for a lab assistant', answer: 'low', why: 'Job postings are meant to be public.' },
  { id: 'map', text: 'The public campus map', answer: 'low', why: 'Publicly available maps are low risk.' },
  { id: 'web', text: 'Event details published on the university’s public website', answer: 'low', why: 'Information already available without logging in is low risk.' },
  { id: 'policy', text: 'A policy manual the owner has designated as public', answer: 'low', why: 'Public policies are low risk.' },
  { id: 'pd', text: 'The text of a public-domain novel', answer: 'low', why: 'Public-domain information is low risk.' },
];

const SCENARIOS = [
  { id: 's1', text: 'A tutor pastes your essay — with your name on it — into an AI tool to draft feedback for you.',
    discuss: 'Many people are fine with this if the tool is institution-licensed (so inputs aren’t used for training) — but removing your name costs nothing and the feedback is just as good. That’s data minimization.' },
  { id: 's2', text: 'A teammate uploads your group chat, including your messages, and asks AI who is “slacking.”',
    discuss: 'Most people would feel judged without consent. The AI only sees text, not context (illness, offline work), and its summary may carry false authority. Ask the group first, or don’t.' },
  { id: 's3', text: 'A club officer uploads the member spreadsheet, phone numbers included, to draft a welcome email.',
    discuss: 'The task needs names at most — not phone numbers. Strip columns the task doesn’t use before uploading. Least privilege applies to data, too.' },
  { id: 's4', text: 'A professor has AI write your recommendation letter from your résumé.',
    discuss: 'This one is less about privacy and more about trust: the letter’s value comes from the writer’s own judgment. Would you want to know? The golden rule applies beyond data.' },
];

export function mount(el, ctx) {
  injectStyle('lab-data-classify', `
    .lab-data-classify .dc-scen { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; background: var(--surface); }
    .lab-data-classify .dc-scen + .dc-scen { margin-top: 10px; }
    .lab-data-classify .dc-scen p { margin: 0 0 8px; }
    .lab-data-classify .dc-why li { margin: 5px 0; font-size: .9rem; }
    .lab-data-classify .dc-rule { font-family: var(--font-serif); font-size: 1.12rem; }
  `);

  let placements = ctx.store.get('placements', {});
  let votes = ctx.store.get('votes', {});
  const result = h('div', { 'aria-live': 'polite' });
  const s = sorter({ items: shuffle(ITEMS, rng(5)), bins: BINS, placements,
    onChange: (p) => { placements = p; ctx.store.set('placements', p); render(result, null); } });

  function check() {
    const { correct, total, placed } = s.check();
    const label = Object.fromEntries(BINS.map((b) => [b.id, b.label]));
    const wrong = ITEMS.filter((it) => placements[it.id] && placements[it.id] !== it.answer);
    render(result, h('div', { class: 'stack' },
      callout(correct === total ? 'ok' : 'warn', `${correct} of ${total} match the classification${placed < total ? ` (${total - placed} not placed)` : ''}`,
        correct === total ? 'You have a good feel for the categories.' : 'Red-outlined items belong elsewhere:'),
      wrong.length ? h('ul', { class: 'dc-why' }, wrong.map((it) => h('li', null, h('strong', null, it.text), ' → ', label[it.answer], '. ', it.why))) : null));
  }

  const scenBox = h('div');
  function drawScen() {
    render(scenBox, SCENARIOS.map((sc) => {
      const v = votes[sc.id];
      const opt = (val, label) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(v === val),
        onclick: () => { votes[sc.id] = val; ctx.store.set('votes', votes); drawScen(); } }, label);
      return h('div', { class: 'dc-scen' },
        h('p', null, sc.text),
        h('div', { class: 'row', role: 'group', 'aria-label': 'Would you be comfortable?' },
          h('span', { class: 'small muted' }, 'If it were about you:'), opt('yes', '👍 Comfortable'), opt('depends', '🤔 Depends'), opt('no', '👎 Not comfortable')),
        v ? h('div', { class: 'callout think', style: 'margin-top:10px', 'aria-live': 'polite' }, sc.discuss) : null);
    }));
  }

  render(el, h('div', { class: 'stack' },
    h('div', { class: 'row between' },
      h('h4', { style: 'margin:0' }, 'Part 1 · How risky is this data?'),
      h('span', { class: 'tag warn' }, 'Check your own institution’s policy')),
    h('p', { class: 'muted small', style: 'margin:0' },
      'Based on Stanford UIT’s data risk classifications (High / Moderate / Low). Other universities and employers use similar but not identical tiers. ',
      h('a', { href: 'https://uit.stanford.edu/security/responsibleai', target: '_blank', rel: 'noopener' }, 'Responsible AI at Stanford'), '.'),
    s.el,
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'btn primary', onclick: check }, 'Check'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { s.reset(); render(result, null); } }, '↺ Reset')),
    result,
    h('hr', { style: 'margin:10px 0' }),
    h('h4', { style: 'margin:0' }, 'Part 2 · The golden rule check'),
    h('div', { class: 'panel tint' },
      h('div', { class: 'dc-rule' }, 'Don’t put data about other people into an AI tool that you wouldn’t want them putting in about you.'),
      h('div', { class: 'hint', style: 'margin-top:4px' }, 'Paraphrasing the personal-data guidance on Stanford’s Responsible AI page.')),
    h('p', { class: 'muted small', style: 'margin:0' }, 'No answer key here — the rule works precisely because it makes you reflect. Pick a reaction to see a discussion note.'),
    scenBox,
    callout('think', 'What this shows',
      'Before pasting anything into AI, ask two questions: how sensitive is this data, and whose is it? Classifications tell you which tools are permitted; the golden rule covers the gray areas no classification can.')));

  drawScen();
}
