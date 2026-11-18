// Lab: Next-token predictor — prediction as probability, and what "temperature" does.
import { h, render, injectStyle, slider, chips, callout, barRow, fmt } from './_kit.js';

const PROMPT = ['Before', 'we', 'start,', 'could', 'you', 'please', 'pass', 'me', 'the'];

// Toy "learned" probabilities at temperature 1 (relative weights, normalized in code).
const CONTEXTS = [
  { id: 'none', label: 'No extra context', scene: 'Just the sentence — no hint about who is speaking or where.',
    p: { salt: 19, water: 16, remote: 18, charger: 17, bread: 9, marker: 9, map: 7, scalpel: 3 } },
  { id: 'dinner', label: '🍽 Dinner table', scene: 'A family has just sat down to eat.',
    p: { salt: 46, bread: 24, water: 14, charger: 4, remote: 4, marker: 2, map: 2, scalpel: 1 } },
  { id: 'surgery', label: '🩺 Operating room', scene: 'A gloved, masked surgeon turns toward a nurse.',
    p: { scalpel: 64, marker: 11, water: 6, charger: 3, salt: 2, bread: 1, map: 1, remote: 1 } },
  { id: 'class', label: '🧑‍🏫 Classroom', scene: 'A teacher is standing at the whiteboard.',
    p: { marker: 52, charger: 12, map: 9, water: 8, remote: 8, bread: 2, salt: 2, scalpel: 1 } },
  { id: 'trail', label: '🥾 Hiking trail', scene: 'Two friends stop where the trail splits in two.',
    p: { map: 44, water: 36, charger: 7, bread: 6, salt: 2, marker: 2, remote: 1, scalpel: 1 } },
  { id: 'couch', label: '🛋 Movie night', scene: 'Friends are on the couch and the film is about to start.',
    p: { remote: 58, charger: 12, water: 9, salt: 8, bread: 4, map: 2, marker: 2, scalpel: 1 } },
];

const CSS = `
.lab-next-token .nt-sentence { display:flex; flex-wrap:wrap; align-items:center; gap:2px; font-size:1.02rem; }
.lab-next-token .nt-blank { display:inline-block; min-width:84px; text-align:center; border:2px dashed var(--accent);
  border-radius:7px; padding:2px 10px; margin:2px; font-family:var(--font-mono); font-weight:700; color:var(--accent); }
.lab-next-token .nt-blank.filled { border-style:solid; background:var(--accent-soft); animation: nt-pop .25s ease; }
@keyframes nt-pop { from { transform: scale(.85); } to { transform: none; } }
.lab-next-token .bar-row.picked > div:first-child { font-weight:700; color:var(--accent-2); }
.lab-next-token .bar-row.picked .bar > span { background: var(--accent-2) !important; }
.lab-next-token .nt-tally { display:flex; flex-wrap:wrap; gap:6px; }
.lab-next-token .nt-tally .tag { font-size:.82rem; }
.lab-next-token .nt-temp-note { min-height: 2.6em; }
`;

function softmax(weights, T) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  const logits = entries.map(([tok, w]) => [tok, Math.log(w / total) / T]);
  const m = Math.max(...logits.map(([, l]) => l));
  const ex = logits.map(([tok, l]) => [tok, Math.exp(l - m)]);
  const z = ex.reduce((s, [, e]) => s + e, 0);
  return ex.map(([tok, e]) => ({ tok, p: e / z })).sort((a, b) => b.p - a.p);
}

function sample(dist) {
  let r = Math.random();
  for (const d of dist) { r -= d.p; if (r <= 0) return d.tok; }
  return dist[dist.length - 1].tok;
}

function tempNote(T) {
  if (T < 0.5) return 'Low temperature: the favorite word wins almost every time. Output becomes predictable — and repetitive.';
  if (T <= 1.3) return 'Around 1.0: the odds roughly match the patterns the model absorbed from its training text.';
  return 'High temperature: the odds flatten out, so unlikely words get a real chance. More surprising — and more likely to be wrong.';
}

export function mount(el, ctx) {
  injectStyle('lab-next-token', CSS);
  let ctxId = ctx.store.get('context', 'none');
  if (!CONTEXTS.find((c) => c.id === ctxId)) ctxId = 'none';
  let temp = ctx.store.get('temp', 1);
  let picked = null;
  let tally = null;

  const sceneEl = h('p', { class: 'muted small', style: 'margin:0 0 8px' });
  const sentenceEl = h('div', { class: 'nt-sentence', 'aria-live': 'polite' });
  const barsEl = h('div', { class: 'stack', style: 'gap:8px' });
  const noteEl = h('div', { class: 'hint nt-temp-note' });
  const tallyEl = h('div', { 'aria-live': 'polite' });

  const current = () => CONTEXTS.find((c) => c.id === ctxId);
  const dist = () => softmax(current().p, temp);

  function drawSentence() {
    render(sentenceEl,
      PROMPT.map((w) => h('span', { class: 'token' }, w)),
      h('span', { class: 'nt-blank' + (picked ? ' filled' : '') }, picked || '?'));
  }

  function drawBars() {
    const d = dist();
    const max = Math.max(d[0].p, 0.0001);
    render(barsEl, d.map(({ tok, p }) => {
      const row = barRow(tok, p, max, { valueText: fmt(p * 100, 1) + '%' });
      if (tok === picked) row.classList.add('picked');
      return row;
    }));
    noteEl.textContent = tempNote(temp);
  }

  function drawTally() {
    if (!tally) {
      render(tallyEl, h('p', { class: 'hint', style: 'margin:0' }, 'Sample 20 times to see how often each word shows up when you ask the same question repeatedly.'));
      return;
    }
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const distinct = sorted.length;
    render(tallyEl,
      h('div', { class: 'label', style: 'margin-bottom:6px' }, `20 samples at temperature ${temp.toFixed(1)} → ${distinct} different word${distinct === 1 ? '' : 's'}`),
      h('div', { class: 'nt-tally' }, sorted.map(([tok, n], i) =>
        h('span', { class: 'tag ' + (i === 0 ? 'accent' : '') }, `${tok} × ${n}`))));
  }

  function redraw() { drawSentence(); drawBars(); drawTally(); sceneEl.textContent = 'Scene: ' + current().scene; }

  const chipRow = chips(CONTEXTS.map((c) => ({ value: c.id, label: c.label })), ctxId, (v) => {
    ctxId = v; picked = null; tally = null; ctx.store.set('context', v); redraw();
  });

  const tempSlider = slider({
    label: 'Temperature', min: 0.1, max: 2, step: 0.1, value: temp,
    format: (v) => Number(v).toFixed(1),
    onInput: (v) => { temp = v; tally = null; ctx.store.set('temp', v); drawBars(); drawTally(); },
  });

  const btnOnce = h('button', { type: 'button', class: 'btn primary' }, '🎲 Sample once');
  btnOnce.addEventListener('click', () => { picked = sample(dist()); drawSentence(); drawBars(); });
  const btnMany = h('button', { type: 'button', class: 'btn' }, 'Sample 20×');
  btnMany.addEventListener('click', () => {
    const d = dist();
    tally = {};
    let last = null;
    for (let i = 0; i < 20; i++) { last = sample(d); tally[last] = (tally[last] || 0) + 1; }
    picked = last;
    drawSentence(); drawBars(); drawTally();
  });

  render(el,
    h('div', { class: 'stack' },
      h('p', { style: 'margin:0' }, 'A language model never "knows" the next word. It assigns a probability to every word it could write next, then picks one. Change the setting and the temperature and watch the odds move.'),
      h('div', { class: 'panel tint' }, sceneEl, sentenceEl),
      h('div', null, h('div', { class: 'label', style: 'margin-bottom:6px' }, 'Who is talking, and where?'), chipRow),
      h('div', { class: 'lab-grid' },
        h('div', { class: 'stack' },
          tempSlider, noteEl,
          h('div', { class: 'row' }, btnOnce, btnMany),
          h('div', { class: 'panel flat' }, tallyEl)),
        h('div', { class: 'panel flat' },
          h('div', { class: 'label', style: 'margin-bottom:8px' }, 'Probability of each next word'),
          barsEl)),
      callout('think', 'What this shows',
        h('span', null, 'The same model gives different odds depending on everything that came before it (context), and the same prompt can produce different words on different runs because the model samples from those odds. That variability is a feature for creative writing and a hazard when you need one correct answer. Real models choose among tens of thousands of tokens, not eight.'))));

  redraw();
}
