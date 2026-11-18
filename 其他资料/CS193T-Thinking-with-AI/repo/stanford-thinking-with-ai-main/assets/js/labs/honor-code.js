// Lab: Write the AI Honor Code (Module 8 / Mission 1 reflection).
import { h, render, injectStyle, chips, copyText, downloadText, callout } from './_kit.js';

const LEVELS = [
  { id: 'spell', label: 'Checks spelling and grammar in my finished entry' },
  { id: 'feedback', label: 'Gives feedback on my draft (clarity, structure) — I make the edits' },
  { id: 'polish', label: 'Rewrites some of my sentences for flow' },
  { id: 'outline', label: 'Drafts the entry from my bullet-point outline of ideas' },
  { id: 'full', label: 'Writes the whole entry from a one-line request' },
];
const RULES = [
  { value: 'ok', label: 'Allowed' },
  { value: 'disclose', label: 'Allowed if disclosed' },
  { value: 'no', label: 'Not allowed' },
];
const DETECT = [
  { value: 'self', label: 'Self-disclosure statement' },
  { value: 'process', label: 'Process evidence (drafts, version history)' },
  { value: 'oral', label: 'Short oral check-in: explain your entry' },
  { value: 'detector', label: 'Automated AI-text detectors' },
];
const CONSEQ = [
  { value: 'redo', label: 'Redo the work' },
  { value: 'nocredit', label: 'No credit for that assignment' },
  { value: 'referral', label: 'Formal honor-code referral' },
];
const CASES = [
  { t: 'A student whose first language isn’t English asks AI to fix grammar and word choice on every sentence, but writes all ideas themselves.', levels: ['spell', 'polish'], group: 'ell' },
  { t: 'A student with dyslexia dictates ideas, then asks AI to draft from that outline.', levels: ['outline'], group: 'dis' },
  { t: 'A student pastes AI feedback into their notes, then revises the draft by hand.', levels: ['feedback'], group: null },
  { t: 'A student asks AI to “write a reflection about using AI to study chemistry” and submits it with light edits.', levels: ['full'], group: null },
];

const DEFAULTS = {
  rules: { spell: 'ok', feedback: 'ok', polish: 'disclose', outline: 'no', full: 'no' },
  ell: 'same', dis: 'same', relaxTo: 'disclose',
  detect: ['self', 'process', 'oral'], warnings: 1, conseq: 'redo', why: '',
};

export function mount(el, ctx) {
  injectStyle('lab-honor-code', `
    .lab-honor-code .hc-row { display:grid; grid-template-columns: minmax(0,1fr) auto; gap:10px; align-items:center; padding:10px 0; border-bottom:1px solid var(--border); }
    .lab-honor-code .hc-row:last-child { border-bottom:0; }
    .lab-honor-code .hc-row .chip { font-size:.8rem; padding:4px 9px; }
    .lab-honor-code .hc-policy { background: var(--surface-2); border:1px solid var(--border); border-radius: var(--radius-sm); padding:16px 18px; font-family: var(--font-serif); line-height:1.65; }
    .lab-honor-code .hc-policy h4 { font-family: var(--font-serif); font-size:1.08rem; margin:0 0 8px; }
    .lab-honor-code .hc-policy ul { margin: 6px 0 10px; }
    .lab-honor-code .hc-case { border:1px solid var(--border); border-radius: var(--radius-sm); padding:10px 12px; }
    .lab-honor-code .hc-verdict { font-weight:700; font-size:.85rem; }
    @media (max-width: 640px) { .lab-honor-code .hc-row { grid-template-columns: 1fr; } }
  `);

  const s = Object.assign({}, DEFAULTS, ctx.store.get('state', {}));
  s.rules = Object.assign({}, DEFAULTS.rules, s.rules || {});
  const save = () => ctx.store.set('state', s);

  const policyBox = h('div', { class: 'hc-policy', 'aria-live': 'polite' });
  const casesBox = h('div', { class: 'stack' });

  // --- Levels of use
  const levelRows = LEVELS.map((lv) =>
    h('div', { class: 'hc-row' },
      h('div', null, lv.label),
      chips(RULES, s.rules[lv.id], (v) => { s.rules[lv.id] = v; update(); })));

  // --- Special cases
  const special = h('div', { class: 'stack' },
    h('div', { class: 'field' }, h('label', null, 'English-language learners'),
      chips([{ value: 'same', label: 'Same rules' }, { value: 'relax', label: 'More latitude on language polish' }], s.ell, (v) => { s.ell = v; update(); })),
    h('div', { class: 'field' }, h('label', null, 'Students with documented writing disabilities (e.g., dyslexia)'),
      chips([{ value: 'same', label: 'Same rules' }, { value: 'relax', label: 'More latitude, per accommodation' }], s.dis, (v) => { s.dis = v; update(); })),
    h('div', { class: 'field' }, h('label', null, 'Where latitude applies, “Not allowed” levels become…'),
      chips([{ value: 'disclose', label: 'Allowed if disclosed' }, { value: 'ok', label: 'Allowed' }], s.relaxTo, (v) => { s.relaxTo = v; update(); })));

  // --- Enforcement
  const detectorWarn = h('div');
  const warnSel = h('select', { 'aria-label': 'Number of warnings before consequences' },
    [0, 1, 2].map((n) => h('option', { value: n, selected: s.warnings === n ? true : null }, n === 0 ? 'No warning' : `${n} warning${n > 1 ? 's' : ''}`)));
  warnSel.addEventListener('change', () => { s.warnings = Number(warnSel.value); update(); });
  const whyTa = h('textarea', { rows: 3, placeholder: 'e.g., The point of the journal is to notice how AI changed my own learning — so the noticing has to be mine.' });
  whyTa.value = s.why;
  whyTa.addEventListener('input', () => { s.why = whyTa.value; update(); });

  const enforcement = h('div', { class: 'stack' },
    h('div', { class: 'field' }, h('label', null, 'How would violations be noticed? (choose any)'),
      chips(DETECT, s.detect, (v) => { s.detect = v; update(); }, { multi: true })),
    detectorWarn,
    h('div', { class: 'grid-2' },
      h('div', { class: 'field' }, h('label', null, 'Warnings first?'), warnSel),
      h('div', { class: 'field' }, h('label', null, 'Then the consequence is'), chips(CONSEQ, s.conseq, (v) => { s.conseq = v; update(); }))),
    h('div', { class: 'field' }, h('label', null, 'In one or two sentences: why this policy?'), whyTa));

  const ruleFor = (levelId, group) => {
    let r = s.rules[levelId];
    const relaxed = (group === 'ell' && s.ell === 'relax' && (levelId === 'polish' || levelId === 'spell')) ||
      (group === 'dis' && s.dis === 'relax');
    if (relaxed && r === 'no') r = s.relaxTo;
    return r;
  };
  const label = (r) => RULES.find((x) => x.value === r).label;

  function policyText() {
    const by = (r) => LEVELS.filter((l) => s.rules[l.id] === r).map((l) => l.label.toLowerCase());
    const lines = [];
    lines.push('AI USE POLICY — REFLECTIVE JOURNAL ENTRIES');
    lines.push('');
    if (s.why.trim()) { lines.push('Purpose: ' + s.why.trim()); lines.push(''); }
    const ok = by('ok'), dis = by('disclose'), no = by('no');
    if (ok.length) lines.push('Allowed without disclosure: AI that ' + ok.join('; ') + '.');
    if (dis.length) lines.push('Allowed with a one-line disclosure of what the AI did: AI that ' + dis.join('; ') + '.');
    if (no.length) lines.push('Not allowed: AI that ' + no.join('; ') + '.');
    lines.push('');
    if (s.ell === 'relax') lines.push(`English-language learners may use AI for language polish (spelling, grammar, sentence flow) — ${label(s.relaxTo).toLowerCase()} — provided the ideas and reflections are their own.`);
    if (s.dis === 'relax') lines.push(`Students with a documented writing disability may, consistent with their accommodation, use otherwise-restricted levels — ${label(s.relaxTo).toLowerCase()}.`);
    if (s.ell !== 'relax' && s.dis !== 'relax') lines.push('These rules apply equally to all students; individual accommodations are handled through the usual accessibility process.');
    lines.push('');
    const d = DETECT.filter((x) => (s.detect || []).includes(x.value)).map((x) => x.label.toLowerCase());
    lines.push('How we’ll check: ' + (d.length ? d.join('; ') : 'trust alone (no checks)') + '.');
    const c = CONSEQ.find((x) => x.value === s.conseq).label.toLowerCase();
    lines.push(s.warnings ? `Consequences: ${s.warnings} warning${s.warnings > 1 ? 's' : ''} with a conversation first; after that, ${c}.` : `Consequences: ${c}, starting with the first violation.`);
    return lines.join('\n');
  }

  function update() {
    save();
    // detector caution
    render(detectorWarn, (s.detect || []).includes('detector')
      ? callout('warn', 'Careful with detectors', 'Automated AI-text detectors produce false positives, and research has found they disproportionately flag writing by non-native English speakers (Liang et al., Patterns, 2023). Treat a detector score as a reason to talk, never as proof.')
      : null);
    if (!(s.detect || []).length) render(detectorWarn, callout('info', 'Pure honor system', 'That can work in a community with strong norms — but say so explicitly, so students know trust is the mechanism.'));

    const txt = policyText();
    render(policyBox, h('h4', null, 'Your draft policy'), ...txt.split('\n').slice(2).map((ln) => (ln ? h('p', { style: { margin: '0 0 6px' } }, ln) : null)));

    render(casesBox, CASES.map((cs) => {
      const verdicts = cs.levels.map((lv) => ruleFor(lv, cs.group));
      const worst = verdicts.includes('no') ? 'no' : verdicts.includes('disclose') ? 'disclose' : 'ok';
      const tag = worst === 'no' ? 'bad' : worst === 'disclose' ? 'warn' : 'ok';
      return h('div', { class: 'hc-case' },
        h('div', { class: 'row between nowrap', style: { alignItems: 'flex-start' } },
          h('div', null, cs.t),
          h('span', { class: `tag ${tag} hc-verdict`, style: { flex: 'none' } }, label(worst))));
    }));
  }

  const out = h('div', { class: 'stack' },
    policyBox,
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => copyText(policyText()) }, 'Copy policy'),
      h('button', { class: 'btn', type: 'button', onclick: () => downloadText('ai-honor-code.md', '# ' + policyText().replace(/\n/, '\n')) }, 'Download'),
      h('button', { class: 'btn ghost', type: 'button', onclick: () => { Object.assign(s, JSON.parse(JSON.stringify(DEFAULTS))); ctx.store.set('state', s); el.replaceChildren(); mount(el, ctx); } }, 'Reset')),
    h('h4', { style: { marginTop: '8px' } }, 'Stress-test it'),
    h('p', { class: 'hint', style: { marginTop: '-6px' } }, 'How does your policy rule on these edge cases? If a verdict feels wrong, adjust the rules.'),
    casesBox);

  render(el,
    h('p', { class: 'muted' }, 'Scenario: an instructor asks you to journal about using AI to study a topic, reflecting on whether it helped or hurt your learning. What AI help is fair on that journal entry? (The course opened by asking students to write exactly this policy.)'),
    h('div', { class: 'lab-grid' },
      h('div', { class: 'stack' },
        h('div', { class: 'panel flat' }, h('h4', null, '1 · Levels of use'), levelRows),
        h('div', { class: 'panel flat' }, h('h4', null, '2 · Special cases'), special),
        h('div', { class: 'panel flat' }, h('h4', null, '3 · Enforcement'), enforcement)),
      out),
    callout('think', 'What this shows', 'Writing a policy forces you to decide what an assignment is for. If the journal’s purpose is your own noticing, the line falls where AI starts doing the noticing — and fair enforcement leans on evidence of process and conversation rather than unreliable detectors.'));

  update();
}
