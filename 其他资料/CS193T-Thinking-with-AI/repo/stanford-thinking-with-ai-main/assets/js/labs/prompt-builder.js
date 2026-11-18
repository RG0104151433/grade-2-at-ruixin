// Lab: Scope-of-Work Prompt Builder (Module 2 — Core prompting)
import { h, render, injectStyle, copyText, estTokens, callout, debounce } from './_kit.js';

const FIELDS = [
  { key: 'what', label: 'What — the task', hint: 'State the deliverable plainly. Specific beats clever.', rows: 2 },
  { key: 'who', label: 'Who — your role and the audience', hint: 'Who are you, and who will read or use the result?', rows: 2 },
  { key: 'why', label: 'Why — the occasion or purpose', hint: 'What prompted this? What should the result accomplish?', rows: 2 },
  { key: 'how', label: 'How — constraints, sources, format', hint: 'Limits (budget, length, tone), what to ground in ("use only…"), and the output shape.', rows: 3 },
  { key: 'rubric', label: 'Rubric — what excellent looks like', hint: 'Checkable criteria you would use to accept or reject the work.', rows: 2 },
];

const PRESETS = [
  {
    name: 'Club welcome mixer',
    thin: 'Plan a club mixer.',
    role: 'an experienced student-organization events coordinator',
    what: 'Plan a 2-hour welcome mixer for new members of our robotics club, held in the third week of term.',
    who: "I'm the club's events lead. The plan is for our 6-person officer team, who will run the event.",
    why: 'Last year few first-years came and most left early. This year we want newcomers to meet each other and sign up for a project team before they go.',
    how: 'Budget $400, room holds 60, no alcohol, fully wheelchair accessible. Use only the room-booking rules and last year\'s attendance notes I paste below. Output: a one-page run-of-show table (time, activity, owner) plus an itemized shopping list.',
    rubric: 'Every 15-minute block has a named owner; costs are itemized and total under $400; at least one activity pairs people who don\'t know each other; nothing needs equipment we don\'t own.',
  },
  {
    name: 'Midterm study plan',
    thin: 'Make me a stats study plan.',
    role: 'a patient learning coach who favors practice over passive rereading',
    what: 'Build a 4-week study plan for my intro statistics midterm.',
    who: "I'm a second-year history major taking stats as a requirement. The plan is just for me.",
    why: 'I did fine on homework but froze on the first timed quiz. I want to practice under realistic conditions instead of memorizing formulas.',
    how: 'I can study 5 hours a week in 45-minute blocks. Base the plan on the syllabus topic list and past quiz I attach. Do not solve practice problems for me — tell me which ones to do. Output: a week-by-week table (topics, practice type, self-check).',
    rubric: 'Each week mixes retrieval practice with timed problems; every topic maps to the syllabus; includes at least one closed-notes checkpoint per week.',
  },
  {
    name: 'Volunteer update in my voice',
    thin: 'Write an email asking volunteers to sign up for shifts.',
    role: 'a seasoned nonprofit communications editor',
    what: "Draft this week's update email to my food-pantry volunteer team.",
    who: 'I coordinate the team. Readers are about 25 volunteers of all ages; most read on their phones.',
    why: "We're short on Saturday shifts. I want people to sign up without the email sounding guilt-trippy.",
    how: 'Match the tone of the three past updates I paste below (grounding in my own writing). Use only facts from my notes — no invented numbers or names. Under 200 words, one clear call to action with the placeholder [LINK].',
    rubric: 'Sounds like my past emails; the ask appears in the first three lines; zero invented facts; readable in under a minute.',
  },
];

const DEFAULT = {
  role: '', what: '', who: '', why: '', how: '', rubric: '', thin: '',
  useRole: true, interview: false, interviewN: 10, clarify: true, clarifyN: 3,
  echo: true, evidence: true, postmortem: false, teach: false,
};

const CHECKS = [
  { sec: 'what', label: 'Task is stated', test: (s) => s.what.trim().length >= 15 },
  { sec: 'what', label: 'Task is specific (details, numbers, scope)', test: (s) => s.what.trim().length >= 50 || /\d/.test(s.what) },
  { sec: 'who', label: 'Your role is stated', test: (s) => /\b(i|i'm|i am|my|we|our)\b/i.test(s.who) },
  { sec: 'who', label: 'Audience is named', test: (s) => /(audience|reader|team|students|members|volunteers|for |manager|client|customers|me\b|myself|officers|staff)/i.test(s.who) },
  { sec: 'why', label: 'Purpose or occasion is given', test: (s) => s.why.trim().length >= 25 },
  { sec: 'how', label: 'Constraints are listed', test: (s) => s.how.trim().length >= 25 },
  { sec: 'how', label: 'Grounding sources named ("use only…", attached files)', test: (s) => /(use only|based on|base the|ground|attach|paste|source|notes|samples|data|syllabus|document)/i.test(s.how) },
  { sec: 'how', label: 'Output format specified', test: (s) => /(format|table|list|words|page|bullet|email|outline|paragraph|slides|output)/i.test(s.how) },
  { sec: 'rubric', label: 'Rubric is present', test: (s) => s.rubric.trim().length >= 20 },
  { sec: 'rubric', label: 'Rubric is checkable (numbers, "every", "no", "under"…)', test: (s) => /(\d|each|every|\bno\b|zero|under|at least|must|never|only)/i.test(s.rubric) },
];

function assemble(s) {
  const parts = [];
  if (s.useRole && s.role.trim()) parts.push(`Act as ${s.role.trim().replace(/\.$/, '')}.`);
  const sec = [
    ['TASK', s.what], ['WHO', s.who], ['WHY', s.why], ['HOW (constraints, sources, format)', s.how], ['WHAT EXCELLENT LOOKS LIKE', s.rubric],
  ].filter(([, v]) => v.trim());
  if (sec.length) parts.push(sec.map(([k, v]) => `${k}: ${v.trim()}`).join('\n\n'));
  const extra = [];
  if (s.interview) extra.push(`Before doing any work, interview me with at least ${s.interviewN} questions — a few at a time — to uncover requirements I haven't thought of yet.`);
  else if (s.clarify) extra.push(`Before you begin, ask me ${s.clarifyN} clarifying questions about anything ambiguous.`);
  if (s.echo) extra.push('Then echo back a short scope of work summarizing the requirements, and wait for my approval before you continue.');
  if (s.evidence) extra.push("Show your reasoning for key decisions and cite any sources so I can check them myself. If you're unsure about something, say so instead of guessing.");
  if (s.postmortem) extra.push('When we finish, write a standalone, reusable prompt that would produce this exact result on the first try next time.');
  if (s.teach) extra.push('Afterward, explain in a few steps how I could do this task myself without AI, so I keep the skill.');
  if (extra.length) parts.push(extra.join('\n'));
  return parts.join('\n\n');
}

function thinVersion(s) {
  if (s.thin) return s.thin;
  const first = (s.what.split(/[.!?]/)[0] || '').trim().split(/\s+/).slice(0, 8).join(' ');
  return first ? first + '.' : '(Fill in the task to see the one-line version.)';
}

export function mount(el, ctx) {
  injectStyle('lab-prompt-builder', `
    .lab-prompt-builder .pb-preview { white-space: pre-wrap; font-family: var(--font-mono); font-size: .84rem; line-height: 1.55;
      background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; max-height: 460px; overflow: auto; margin: 0; }
    .lab-prompt-builder .pb-thin { font-family: var(--font-mono); font-size: .9rem; background: var(--bad-soft); border-radius: var(--radius-sm); padding: 12px; }
    .lab-prompt-builder .pb-checks { list-style: none; padding: 0; margin: 0; font-size: .88rem; }
    .lab-prompt-builder .pb-checks li { display: flex; gap: 8px; align-items: baseline; margin: 3px 0; }
    .lab-prompt-builder .pb-checks .mk { width: 1.1em; flex: none; font-weight: 700; }
    .lab-prompt-builder .pb-checks .on .mk { color: var(--ok); }
    .lab-prompt-builder .pb-checks .off { color: var(--muted); }
    .lab-prompt-builder .pb-opt { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; }
    .lab-prompt-builder .pb-opt input[type=number] { width: 70px; padding: 5px 8px; }
    .lab-prompt-builder .pb-sticky { position: sticky; top: calc(var(--nav-h, 60px) + 12px); }
    @media (max-width: 860px) { .lab-prompt-builder .pb-sticky { position: static; } }
  `);

  const s = { ...DEFAULT, ...ctx.store.get('state', {}) };
  const save = debounce(() => ctx.store.set('state', s), 250);
  const inputs = {};

  // ---- Left: form ----
  const presetRow = h('div', { class: 'row' }, h('span', { class: 'label' }, 'Try a preset:'),
    PRESETS.map((p) => h('button', { type: 'button', class: 'chip', onclick: () => loadPreset(p) }, p.name)),
    h('button', { type: 'button', class: 'btn ghost small', onclick: () => loadPreset(null) }, 'Clear'));

  const roleInput = h('input', { type: 'text', id: 'pb-role', placeholder: 'e.g. a demanding but supportive editor' });
  const useRole = h('input', { type: 'checkbox', id: 'pb-userole' });
  inputs.role = roleInput;

  const form = h('div', { class: 'stack' },
    h('div', { class: 'field' },
      h('label', { class: 'check', for: 'pb-userole' }, useRole, h('span', null, 'Start with a role ("Act as …") to spotlight a style of expertise')),
      roleInput,
      h('div', { class: 'hint' }, 'A role narrows focus and tone; it cannot add knowledge the model never learned.')),
    FIELDS.map((f) => {
      const ta = h('textarea', { id: 'pb-' + f.key, rows: f.rows, style: { minHeight: f.rows * 30 + 'px' } });
      inputs[f.key] = ta;
      return h('div', { class: 'field' }, h('label', { for: 'pb-' + f.key }, f.label), ta, h('div', { class: 'hint' }, f.hint));
    }));

  // options
  const opt = (key, label, hint, numKey) => {
    const cb = h('input', { type: 'checkbox', id: 'pb-o-' + key });
    cb.checked = !!s[key];
    cb.addEventListener('change', () => { s[key] = cb.checked; if (key === 'interview' && cb.checked) { s.clarify = false; optEls.clarify.checked = false; } if (key === 'clarify' && cb.checked) { s.interview = false; optEls.interview.checked = false; } update(); });
    optEls[key] = cb;
    let num = null;
    if (numKey) {
      num = h('input', { type: 'number', min: 1, max: 30, value: s[numKey], 'aria-label': label + ' — number of questions' });
      num.addEventListener('input', () => { s[numKey] = Math.max(1, Math.min(30, Number(num.value) || 1)); update(); });
    }
    return h('div', { class: 'pb-opt' },
      h('label', { class: 'check', for: 'pb-o-' + key }, cb, h('span', null, h('strong', null, label), h('br'), h('span', { class: 'hint' }, hint))), num);
  };
  const optEls = {};
  const options = h('div', { class: 'panel tint stack' },
    h('h4', null, 'Power-ups'),
    opt('interview', 'Interview me first', 'For fuzzy tasks: let the AI draw the requirements out of you.', 'interviewN'),
    opt('clarify', 'Ask clarifying questions', 'Lighter-weight than a full interview.', 'clarifyN'),
    opt('echo', 'Echo back a scope of work for approval', 'Observability: see its understanding before it works.'),
    opt('evidence', 'Show your work and cite checkable sources', 'Ask for evidence, not assertions — and permission to say "not sure".'),
    opt('postmortem', 'Prompt postmortem', 'End with a reusable prompt so next time is one try (fewer tokens, too).'),
    opt('teach', 'Teach me to do it myself', 'Guards your own skills against quiet atrophy.'));

  // ---- Right: preview ----
  const preview = h('pre', { class: 'pb-preview', 'aria-live': 'polite', 'aria-label': 'Assembled prompt' });
  const meterFill = h('div', { class: 'meter-fill' });
  const meterLabel = h('strong', null, '0%');
  const checklist = h('ul', { class: 'pb-checks' });
  const thinBox = h('div', { class: 'pb-thin' });
  const tokenNote = h('p', { class: 'hint' });

  const right = h('div', { class: 'stack pb-sticky' },
    h('div', { class: 'panel flat stack' },
      h('div', { class: 'row between' }, h('h4', { style: { margin: 0 } }, 'Your prompt'),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn primary small', onclick: () => copyText(assemble(s), 'Prompt copied') }, 'Copy prompt'))),
      preview),
    h('div', { class: 'panel flat stack' },
      h('div', { class: 'row between' }, h('h4', { style: { margin: 0 } }, 'Scope-of-work completeness'), meterLabel),
      h('div', { class: 'meter' }, meterFill),
      checklist),
    h('div', { class: 'panel flat stack' },
      h('h4', { style: { margin: 0 } }, 'Contrast: the one-liner'),
      thinBox,
      tokenNote));

  function update() {
    for (const k of ['role', ...FIELDS.map((f) => f.key)]) s[k] = inputs[k].value;
    s.useRole = useRole.checked;
    roleInput.disabled = !s.useRole;
    const full = assemble(s);
    preview.textContent = full || 'Start typing — your structured prompt assembles here.';
    const passed = CHECKS.map((c) => c.test(s));
    const pct = Math.round((passed.filter(Boolean).length / CHECKS.length) * 100);
    meterFill.style.width = pct + '%';
    meterFill.className = 'meter-fill ' + (pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : 'bad');
    meterLabel.textContent = pct + '%';
    render(checklist, CHECKS.map((c, i) => h('li', { class: passed[i] ? 'on' : 'off' },
      h('span', { class: 'mk', 'aria-hidden': 'true' }, passed[i] ? '✓' : '○'),
      h('span', null, h('span', { class: 'tag' }, c.sec), ' ', c.label, h('span', { class: 'sr-only' }, passed[i] ? ' (done)' : ' (missing)')))));
    const thin = thinVersion(s);
    thinBox.textContent = thin;
    const a = estTokens(thin), b = estTokens(full);
    tokenNote.textContent = full
      ? `≈${a} tokens vs ≈${b} tokens. The longer prompt costs a little more once — but it pushes the model off the most generic path and usually saves several rounds of "no, not like that."`
      : 'A bare one-liner leaves every choice to the model, which drifts toward the most average answer in its training data.';
    save();
  }

  function loadPreset(p, quiet = false) {
    const src = p || { ...DEFAULT };
    for (const k of ['role', 'what', 'who', 'why', 'how', 'rubric']) inputs[k].value = src[k] || '';
    s.thin = p ? p.thin : '';
    useRole.checked = true;
    update();
    if (p && !quiet) ctx.toast(`Loaded preset: ${p.name}`);
  }

  // init values
  for (const k of ['role', ...FIELDS.map((f) => f.key)]) {
    inputs[k].value = s[k] || '';
    inputs[k].addEventListener('input', () => { s.thin = ''; update(); });
  }
  useRole.checked = s.useRole;
  useRole.addEventListener('change', update);

  render(el,
    h('div', { class: 'stack-lg' },
      presetRow,
      h('div', { class: 'lab-grid' }, h('div', { class: 'stack' }, form, options), right),
      callout('think', 'What this shows',
        h('p', null, 'Prompting is delegation. The same habits that help a new hire — a clear task, who it\'s for, why it matters, the constraints, and how you\'ll judge it — help an AI. When you can\'t fill the template yet, flip it around and have the AI interview you. Save what worked as a reusable prompt, and ask to learn the skill yourself so you stay the one steering.'))));
  if (!Object.values(ctx.store.get('state', {})).some((v) => typeof v === 'string' && v)) loadPreset(PRESETS[0], true);
  else update();
}
