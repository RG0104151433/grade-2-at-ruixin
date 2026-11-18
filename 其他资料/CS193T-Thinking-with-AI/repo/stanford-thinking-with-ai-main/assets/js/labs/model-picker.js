// Lab: Right-size the models in a multi-agent pipeline (Module 7)
import { h, render, injectStyle, chips, callout, fmt } from './_kit.js';

// Illustrative numbers only — not real vendor prices or speeds.
const SIZES = {
  small:  { label: 'Small',  cap: 1, latency: 0.6, inPrice: 0.25, outPrice: 1.25 },
  medium: { label: 'Medium', cap: 2, latency: 1.8, inPrice: 3,    outPrice: 15 },
  large:  { label: 'Large',  cap: 3, latency: 4.5, inPrice: 15,   outPrice: 75 },
};
const THINK = { cap: 0.75, latencyMult: 3, hiddenOut: 1500 };

const PIPELINES = [
  {
    id: 'tutor', name: 'A · Course AI tutor',
    blurb: 'A student asks a question; three agents run in sequence before they see a reply.',
    steps: [
      { id: 'in', name: 'Input guardrail', job: 'Screens each message for blatant "just give me the answer" requests. Fine → pass along; otherwise reply with a study-strategy nudge.', need: 1, inTok: 600, outTok: 20,
        fb: { under: '', fit: 'A yes/no screen on a short message is simple classification — a small model handles it and keeps the first hop fast.', over: 'This step only sorts messages into two buckets. A bigger model adds seconds to every single message for little gain.' } },
      { id: 'gen', name: 'Response generator', job: 'Writes a thoughtful, Socratic reply grounded in course materials, with an engaging example and a question back.', need: 2.2, inTok: 3000, outTok: 500,
        fb: { under: 'Nuanced teaching — knowing what to withhold, choosing a good example — is where small models visibly struggle. Students will feel it.', fit: 'This is the step students actually read. Spending capability here is money well spent.', over: 'Capable, but you may be paying top price for a reply a strong mid-size model (perhaps with thinking) writes just as well.' } },
      { id: 'out', name: 'Output guardrail', job: 'Checks the reply doesn\'t paste more than a few lines of solution code; if it does, asks for a rewrite.', need: 1, inTok: 800, outTok: 20,
        fb: { under: '', fit: 'Spotting long code blocks is close to a pattern check. Small is plenty — some teams even use plain code here instead of an LLM.', over: 'A large model for "is there a long code block?" mostly adds latency. Could ordinary code do this check?' } },
    ],
    suggest: { in: ['small', false], gen: ['medium', true], out: ['small', false] },
    why: 'Cheap, fast guardrails on both ends; capability concentrated in the one step students read. Large for the generator is defensible if quality testing shows a real difference.',
  },
  {
    id: 'policy', name: 'B · Company policy Q&A',
    blurb: 'An employee asks about PTO, safety, or compliance. Both agents search the handbook (RAG).',
    steps: [
      { id: 'rag', name: 'RAG answerer', job: 'Retrieves handbook passages and drafts an answer with citations.', need: 1.8, inTok: 4000, outTok: 400,
        fb: { under: 'Retrieval does the heavy lifting, but synthesizing several passages into a correct, cited answer still needs some reasoning — small models often misread exceptions.', fit: 'With good retrieval, a mid-size model can read the passages and answer clearly.', over: 'Retrieval already put the facts in front of the model; a large one is rarely needed to restate them.' } },
      { id: 'judge', name: 'Citation judge (LLM-as-judge)', job: 'Reads the draft and its cited passages; checks the citations are relevant and interpreted correctly. On a mismatch, requests a new answer.', need: 2.6, inTok: 4500, outTok: 150,
        fb: { under: 'The judge is your hallucination safety net. A weak judge waves bad answers through — or rejects good ones — and you won\'t know which.', fit: 'Careful reading and comparison is exactly where extra capability or thinking pays off. A judge should generally be at least as strong as what it grades.', over: 'Strong, which is good for a judge — but check whether a mid-size model with thinking reaches the same verdicts for less.' } },
    ],
    suggest: { rag: ['medium', false], judge: ['medium', true] },
    why: 'A solid mid-size answerer, and a judge with thinking turned on because careful comparison is its whole job.',
  },
];

function stepStats(step, choice) {
  const s = SIZES[choice.size];
  const cap = s.cap + (choice.think ? THINK.cap : 0);
  const latency = s.latency * (choice.think ? THINK.latencyMult : 1);
  const out = step.outTok + (choice.think ? THINK.hiddenOut : 0);
  const cost1k = ((step.inTok * s.inPrice + out * s.outPrice) / 1e6) * 1000;
  const gap = cap - step.need;
  const fit = gap < -0.25 ? 'under' : gap > 0.9 ? 'over' : 'fit';
  const score = fit === 'fit' ? 100 : fit === 'over' ? Math.max(55, Math.round(100 - gap * 18)) : Math.max(15, Math.round(100 + gap * 45));
  return { latency, cost1k, fit, score };
}

export function mount(el, ctx) {
  injectStyle('lab-model-picker', `
    .lab-model-picker .mp-flow { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; }
    .lab-model-picker .mp-step { flex: 1 1 220px; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; background: var(--surface); display: flex; flex-direction: column; gap: 8px; }
    .lab-model-picker .mp-arrow { align-self: center; color: var(--muted); font-size: 1.3rem; }
    @media (max-width: 700px) { .lab-model-picker .mp-arrow { transform: rotate(90deg); width: 100%; text-align: center; } }
    .lab-model-picker .mp-step.under { border-color: var(--bad); }
    .lab-model-picker .mp-step.over { border-color: var(--warn); }
    .lab-model-picker .mp-step.fit { border-color: var(--ok); }
    .lab-model-picker .mp-stack { display: flex; height: 26px; border-radius: 6px; overflow: hidden; background: var(--surface-2); }
    .lab-model-picker .mp-stack span { display: grid; place-items: center; font-size: .72rem; font-weight: 700; color: var(--surface); white-space: nowrap; overflow: hidden; transition: width .3s ease; }
    .lab-model-picker .mp-c0 { background: var(--accent); } .lab-model-picker .mp-c1 { background: var(--violet); } .lab-model-picker .mp-c2 { background: var(--teal); }
    .lab-model-picker .mp-job { font-size: .86rem; color: var(--text-2); margin: 0; }
  `);
  const saved = ctx.store.get('choices', {});
  const choices = {};
  for (const pl of PIPELINES) {
    choices[pl.id] = {};
    for (const st of pl.steps) choices[pl.id][st.id] = saved[pl.id]?.[st.id] || { size: 'large', think: false };
  }
  const save = () => ctx.store.set('choices', choices);
  let current = ctx.store.get('pipeline', 'tutor');
  const body = h('div', { class: 'stack' });

  function draw() {
    const pl = PIPELINES.find((p) => p.id === current);
    const ch = choices[pl.id];
    const stats = pl.steps.map((st) => stepStats(st, ch[st.id]));
    const totalLat = stats.reduce((a, s) => a + s.latency, 0);
    const totalCost = stats.reduce((a, s) => a + s.cost1k, 0);
    const weakest = Math.min(...stats.map((s) => s.score));
    const results = h('div', { class: 'stack', 'aria-live': 'polite' });

    const flow = h('div', { class: 'mp-flow' });
    pl.steps.forEach((st, i) => {
      if (i) flow.appendChild(h('div', { class: 'mp-arrow', 'aria-hidden': 'true' }, '→'));
      const s = stats[i];
      const thinkCb = h('input', { type: 'checkbox', id: `mp-${pl.id}-${st.id}-think` });
      thinkCb.checked = ch[st.id].think;
      thinkCb.addEventListener('change', () => { ch[st.id].think = thinkCb.checked; save(); draw(); });
      flow.appendChild(h('div', { class: 'mp-step ' + s.fit },
        h('div', { class: 'row between' }, h('strong', null, `${i + 1}. ${st.name}`),
          h('span', { class: 'tag ' + (s.fit === 'fit' ? 'ok' : s.fit === 'over' ? 'warn' : 'bad') }, s.fit === 'fit' ? 'Good fit' : s.fit === 'over' ? 'Overkill?' : 'Under-powered')),
        h('p', { class: 'mp-job' }, st.job),
        h('div', { role: 'group', 'aria-label': `Model size for ${st.name}` },
          chips(Object.entries(SIZES).map(([value, z]) => ({ value, label: z.label })), ch[st.id].size, (v) => { ch[st.id].size = v; save(); draw(); })),
        h('label', { class: 'check small', for: thinkCb.id }, thinkCb, h('span', null, 'Thinking mode')),
        h('div', { class: 'hint' }, `${fmt(s.latency, 1)} s · $${fmt(s.cost1k, 2)} per 1,000 requests`),
        h('p', { class: 'small', style: { margin: 0 } }, st.fb[s.fit] || st.fb.fit)));
    });

    const stack = h('div', { class: 'mp-stack', role: 'img', 'aria-label': `End-to-end latency ${fmt(totalLat, 1)} seconds` },
      stats.map((s, i) => h('span', { class: 'mp-c' + i, style: { width: (s.latency / totalLat) * 100 + '%' }, title: `${pl.steps[i].name}: ${fmt(s.latency, 1)} s` }, `${fmt(s.latency, 1)}s`)));

    render(results,
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Wait per question'), h('span', { class: 'v' }, fmt(totalLat, 1) + ' s'), h('span', { class: 's' }, 'steps run one after another')),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Cost / 1,000 questions'), h('span', { class: 'v' }, '$' + fmt(totalCost, 2)), h('span', { class: 's' }, 'illustrative prices')),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Weakest-link fit'), h('span', { class: 'v' }, weakest + '/100'), h('span', { class: 's' }, 'quality is capped by the weakest step'))),
      h('div', null, h('div', { class: 'label', style: { marginBottom: '4px' } }, 'Where the waiting comes from'), stack),
      totalLat > 12 ? callout('warn', 'Latency compounds', `Each step waits for the one before it, so ${fmt(totalLat, 1)} s feels slow for a chat. Shrinking the simple steps is usually the cheapest speed-up.`) : null);

    const suggestBox = h('div', { 'aria-live': 'polite' });
    const suggestBtn = h('button', { type: 'button', class: 'btn small' }, 'Show a suggested setup');
    suggestBtn.addEventListener('click', () => {
      const lines = pl.steps.map((st) => { const [sz, th] = pl.suggest[st.id]; return `${st.name}: ${SIZES[sz].label}${th ? ' + thinking' : ''}`; });
      const sim = pl.steps.map((st) => { const [size, think] = pl.suggest[st.id]; return stepStats(st, { size, think }); });
      render(suggestBox, callout('info', 'One reasonable answer (not the only one)', h('div', null,
        h('ul', { class: 'small', style: { margin: '4px 0 6px' } }, lines.map((l) => h('li', null, l))),
        h('p', { class: 'small', style: { margin: 0 } }, `${pl.why} → about ${fmt(sim.reduce((a, s) => a + s.latency, 0), 1)} s and $${fmt(sim.reduce((a, s) => a + s.cost1k, 0), 2)} per 1,000 questions.`),
        h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { type: 'button', class: 'btn small primary', onclick: () => { for (const st of pl.steps) { const [size, think] = pl.suggest[st.id]; ch[st.id] = { size, think }; } save(); draw(); } }, 'Apply it')))));
    });

    render(body,
      h('p', { class: 'muted', style: { margin: 0 } }, pl.blurb),
      flow, results,
      h('div', { class: 'row' }, suggestBtn,
        h('button', { type: 'button', class: 'btn ghost small', onclick: () => { for (const st of pl.steps) ch[st.id] = { size: 'large', think: false }; save(); draw(); } }, 'Reset to all-large')),
      suggestBox);
  }

  render(el, h('div', { class: 'stack-lg' },
    h('div', { class: 'row' }, h('span', { class: 'label' }, 'Pipeline:'),
      chips(PIPELINES.map((p) => ({ value: p.id, label: p.name })), current, (v) => { current = v; ctx.store.set('pipeline', v); draw(); })),
    callout('info', null, 'Everything starts on the biggest model. Pick a size for each agent and watch latency, cost, and fit. Numbers are illustrative — real prices and speeds vary by vendor and change often.'),
    body,
    callout('think', 'What this shows', h('p', null, 'Bigger isn\'t automatically better. Smaller models are cheaper, faster, and lighter on energy, and in a multi-step workflow their speed adds up across every step. Match each agent to the difficulty of its job: simple screening can be small, while the steps where nuance or careful judgment matter deserve the capability.'))));
  draw();
}
