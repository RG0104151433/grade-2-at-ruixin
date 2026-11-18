// Lab: Skill Smoke Detector — design early warnings for skill atrophy (Module 8 / Missions 1–2).
import { h, render, injectStyle, chips, slider, copyText, downloadText, callout, clamp } from './_kit.js';

const SKILLS = [
  'Writing a first draft', 'Reading dense papers closely', 'Mental math & estimation', 'Debugging code',
  'Summarizing a meeting', 'Speaking a second language', 'Structuring an argument', 'Navigating without GPS',
];

const DETECTORS = [
  { id: 'reps', label: 'Scheduled no-AI reps', strength: 3, desc: 'Do the task unaided on a regular schedule.' },
  { id: 'baseline', label: 'Timed benchmark vs. my baseline', strength: 3, desc: 'Record time/quality now; re-test and compare.' },
  { id: 'firstpass', label: '“Me first, then AI” rule', strength: 2, desc: 'Attempt it yourself before asking for help.' },
  { id: 'explain', label: 'Explain it back', strength: 2, desc: 'After AI does it, explain how you’d do it yourself.' },
  { id: 'log', label: 'Mini-lessons log', strength: 1, desc: 'Keep a file of “how to do this myself” notes and review it.' },
  { id: 'compare', label: 'Compare with my past work', strength: 2, desc: 'Put today’s unaided work next to work from months ago.' },
  { id: 'teach', label: 'Teach someone', strength: 2, desc: 'Teaching exposes gaps fast.' },
  { id: 'buddy', label: 'A trusted person who’ll tell me', strength: 1, desc: 'Ask someone to flag when your work starts sounding generic.' },
];

const FREQ = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Every 2 weeks' },
  { value: 'MONTHLY', label: 'Monthly' },
];

export function mount(el, ctx) {
  injectStyle('lab-skill-guard', `
    .lab-skill-guard .sg-det { display:flex; gap:10px; align-items:flex-start; padding:9px 10px; border:1px solid var(--border); border-radius: var(--radius-sm); cursor:pointer; background: var(--surface); }
    .lab-skill-guard .sg-det:has(input:checked) { border-color: var(--accent); background: var(--accent-soft); }
    .lab-skill-guard .sg-det input { margin-top:4px; flex:none; }
    .lab-skill-guard .sg-dets { display:grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap:8px; }
    .lab-skill-guard .sg-plan { border:2px solid var(--accent); border-radius: var(--radius); padding:16px 18px; background: var(--surface); }
    .lab-skill-guard .sg-plan h4 { margin:0 0 6px; font-family: var(--font-serif); font-size:1.15rem; }
    .lab-skill-guard .sg-alarm { font-weight:600; }
  `);

  const s = Object.assign({
    skill: SKILLS[0], custom: '', delegate: 60, why: '', dets: ['reps', 'firstpass'], freq: 'BIWEEKLY', threshold: 30, action: 'go AI-free for this skill for two weeks',
  }, ctx.store.get('state', {}));
  const save = () => ctx.store.set('state', s);
  const skillName = () => (s.skill === '__custom' ? (s.custom.trim() || 'my skill') : s.skill);

  const riskBox = h('div', { 'aria-live': 'polite' });
  const planBox = h('div', { 'aria-live': 'polite' });

  // Step 1: skill
  const customIn = h('input', { type: 'text', placeholder: 'Or name your own skill…', 'aria-label': 'Custom skill', value: s.custom });
  customIn.addEventListener('input', () => { s.custom = customIn.value; s.skill = '__custom'; skillChips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false')); update(); });
  const skillChips = chips(SKILLS, s.skill, (v) => { s.skill = v; update(); });

  const whyTa = h('textarea', { rows: 2, placeholder: 'Why does keeping this skill matter to you?' });
  whyTa.value = s.why;
  whyTa.addEventListener('input', () => { s.why = whyTa.value; update(); });

  // Step 3: detectors
  const detList = h('div', { class: 'sg-dets' }, DETECTORS.map((d) => {
    const cb = h('input', { type: 'checkbox', checked: s.dets.includes(d.id) ? true : null });
    cb.addEventListener('change', () => {
      const set = new Set(s.dets);
      cb.checked ? set.add(d.id) : set.delete(d.id);
      s.dets = [...set];
      update();
    });
    return h('label', { class: 'sg-det' }, cb, h('span', null, h('strong', null, d.label), h('div', { class: 'hint' }, d.desc)));
  }));

  const actionIn = h('input', { type: 'text', value: s.action, 'aria-label': 'What you will do if the alarm goes off' });
  actionIn.addEventListener('input', () => { s.action = actionIn.value; update(); });

  function risk() {
    const protection = s.dets.reduce((n, id) => n + (DETECTORS.find((d) => d.id === id)?.strength || 0), 0);
    const freqBoost = { WEEKLY: 1.2, BIWEEKLY: 1, MONTHLY: 0.75 }[s.freq];
    const hasMeasure = s.dets.includes('reps') || s.dets.includes('baseline') || s.dets.includes('compare');
    const score = clamp(s.delegate - protection * 7 * freqBoost + (hasMeasure ? 0 : 15), 0, 100);
    return { score: Math.round(score), hasMeasure };
  }

  function planText() {
    const dets = DETECTORS.filter((d) => s.dets.includes(d.id));
    const freq = FREQ.find((f) => f.value === s.freq).label.toLowerCase();
    return [
      `SKILL SMOKE DETECTOR — ${skillName()}`,
      s.why.trim() ? `Why it matters: ${s.why.trim()}` : null,
      `Current AI delegation: about ${s.delegate}% of the time.`,
      `Detectors (${freq}): ${dets.length ? dets.map((d) => d.label).join('; ') : 'none yet'}.`,
      `Alarm: if my unaided attempt is ${s.threshold}% slower or noticeably worse than my baseline, or I can't explain how I'd do it, I will ${s.action.trim() || '…'}.`,
    ].filter(Boolean).join('\n');
  }

  function ics() {
    const rule = s.freq === 'BIWEEKLY' ? 'FREQ=WEEKLY;INTERVAL=2' : `FREQ=${s.freq}`;
    const d = new Date(); d.setDate(d.getDate() + 7);
    const pad = (n) => String(n).padStart(2, '0');
    const dt = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const esc = (t) => t.replace(/[,;\\]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Thinking with AI companion//Skill smoke detector//EN',
      'BEGIN:VEVENT', `UID:skill-${Date.now()}@thinking-with-ai.local`, `DTSTAMP:${dt}T090000Z`,
      `DTSTART;VALUE=DATE:${dt}`, `RRULE:${rule}`,
      `SUMMARY:${esc('No-AI rep: ' + skillName())}`,
      `DESCRIPTION:${esc(planText())}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
  }

  function update() {
    save();
    const r = risk();
    const cls = r.score >= 60 ? 'bad' : r.score >= 35 ? 'warn' : 'ok';
    const word = r.score >= 60 ? 'High' : r.score >= 35 ? 'Moderate' : 'Low';
    render(riskBox,
      h('div', { class: 'row between' }, h('span', { class: 'label' }, 'Atrophy risk (rough heuristic)'), h('span', { class: `tag ${cls}` }, `${word} · ${r.score}`)),
      h('div', { class: 'meter', style: { marginTop: '6px' } }, h('div', { class: `meter-fill ${cls}`, style: { width: r.score + '%' } })),
      !r.hasMeasure ? h('p', { class: 'hint', style: { marginTop: '6px' } }, 'No detector here actually measures the skill. Habits help, but add a no-AI rep, a benchmark, or a comparison with past work to get a real signal.') : null);

    const dets = DETECTORS.filter((d) => s.dets.includes(d.id));
    render(planBox, h('div', { class: 'sg-plan' },
      h('h4', null, `🚨 ${skillName()}`),
      s.why.trim() ? h('p', { class: 'muted', style: { margin: '0 0 8px' } }, s.why.trim()) : null,
      h('div', { class: 'label' }, `Checks · ${FREQ.find((f) => f.value === s.freq).label}`),
      dets.length ? h('ul', null, dets.map((d) => h('li', null, d.label))) : h('p', { class: 'muted' }, 'Pick at least one detector.'),
      h('p', { class: 'sg-alarm', style: { margin: 0 } }, `Alarm → if I’m ${s.threshold}% slower or worse than baseline, I’ll ${s.action.trim() || '…'}.`)));
  }

  render(el,
    h('div', { class: 'lab-grid' },
      h('div', { class: 'stack' },
        h('div', { class: 'field' }, h('label', null, '1 · A skill you want to keep sharp'), skillChips, customIn),
        whyTa,
        slider({ label: '2 · How often do you hand this skill to AI now?', min: 0, max: 100, step: 5, value: s.delegate, format: (v) => v + '%', onInput: (v) => { s.delegate = v; update(); } }),
        h('div', { class: 'field' }, h('label', null, '3 · Choose your smoke detectors'), detList),
        h('div', { class: 'field' }, h('label', null, 'How often?'), chips(FREQ, s.freq, (v) => { s.freq = v; update(); })),
        slider({ label: '4 · Alarm threshold: slower or worse than baseline by', min: 10, max: 60, step: 5, value: s.threshold, format: (v) => v + '%', onInput: (v) => { s.threshold = v; update(); } }),
        h('div', { class: 'field' }, h('label', null, 'When the alarm goes off, I will…'), actionIn)),
      h('div', { class: 'stack' },
        riskBox,
        planBox,
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => downloadText('skill-smoke-detector.ics', ics(), 'text/calendar') }, 'Add reminder to calendar (.ics)'),
          h('button', { class: 'btn', type: 'button', onclick: () => copyText(planText()) }, 'Copy plan')),
        h('p', { class: 'hint' }, 'The calendar file creates a recurring “no-AI rep” starting a week from today. Nothing leaves your browser.'))),
    callout('think', 'What this shows', 'Skill atrophy is quiet — you rarely notice it happening. A real smoke detector measures the skill itself, unaided, on a schedule, against a baseline; habits like “me first, then AI” lower the risk, but only measurement tells you when it’s rising.'));

  update();
}
