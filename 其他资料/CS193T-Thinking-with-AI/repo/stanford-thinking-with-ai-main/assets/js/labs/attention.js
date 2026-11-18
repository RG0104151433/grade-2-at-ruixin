// Lab: Attention — the transformer idea that some earlier words matter more than others.
import { h, render, injectStyle, chips, callout, barRow, fmt } from './_kit.js';

const TOKENS = ['The', 'chef', 'tasted', 'the', 'soup', ',', 'frowned', ',', 'and', 'said', 'it', 'needed', 'more', '___'];
const BLANK = TOKENS.length - 1;

// Hand-tuned toy attention patterns (index → raw weight). Normalized in code.
const PATTERNS = {
  13: { w: { 0: 1, 1: 14, 2: 16, 3: 1, 4: 24, 5: 1, 6: 9, 7: 1, 8: 1, 9: 3, 10: 8, 11: 10, 12: 12 },
    why: 'To fill the blank, the toy model leans hardest on “soup”, “tasted”, “chef” and “more”. Those words point toward seasoning, not generic “needed more …” phrases.' },
  10: { w: { 0: 1, 1: 14, 2: 10, 3: 1, 4: 52, 5: 1, 6: 6, 7: 1, 8: 1, 9: 6 },
    why: '“it” looks back mostly at “soup”. This is how attention lets a model work out what a pronoun refers to.' },
  6: { w: { 0: 2, 1: 38, 2: 24, 3: 2, 4: 22, 5: 3 },
    why: '“frowned” attends mainly to “chef” — the one doing the frowning — and to what the chef just tasted.' },
  11: { w: { 0: 1, 1: 8, 2: 12, 3: 1, 4: 25, 5: 1, 6: 8, 7: 1, 8: 1, 9: 6, 10: 30 },
    why: '“needed” attends to “it” and “soup”: the model is keeping track of which thing is lacking something.' },
};

const PRED = {
  attn: { salt: 46, pepper: 14, seasoning: 12, garlic: 8, time: 6, practice: 5, work: 5, love: 4 },
  blob: { time: 22, work: 18, practice: 14, salt: 12, money: 10, sleep: 8, love: 8, pepper: 8 },
};

const CSS = `
.lab-attention .at-sentence { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }
.lab-attention .at-tok { font:inherit; font-family:var(--font-mono); font-size:.9rem; padding:5px 8px; border-radius:7px;
  border:1px solid var(--border); background:var(--surface); color:var(--text); cursor:pointer; transition: background .2s; }
.lab-attention .at-tok:hover { border-color: var(--accent); }
.lab-attention .at-tok.target { outline:3px solid var(--accent); outline-offset:1px; font-weight:700; }
.lab-attention .at-tok.after { opacity:.35; }
.lab-attention .at-tok.blank { border:2px dashed var(--accent); color:var(--accent); }
.lab-attention .at-why { min-height: 3em; }
`;

function normalize(obj) {
  const tot = Object.values(obj).reduce((a, b) => a + b, 0) || 1;
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v / tot;
  return out;
}

function weightsFor(target, mode) {
  const earlier = [...Array(target).keys()];
  if (mode === 'blob') return Object.fromEntries(earlier.map((i) => [i, 1 / earlier.length]));
  if (PATTERNS[target]) return normalize(PATTERNS[target].w);
  // fallback: simple recency pattern
  return normalize(Object.fromEntries(earlier.map((i) => [i, 1 / (target - i) + 0.05])));
}

export function mount(el, ctx) {
  injectStyle('lab-attention', CSS);
  let target = ctx.store.get('target', BLANK);
  if (target < 1 || target > BLANK) target = BLANK;
  let mode = ctx.store.get('mode', 'attn');

  const sentenceEl = h('div', { class: 'at-sentence', role: 'group', 'aria-label': 'Sentence — choose a word to inspect' });
  const whyEl = h('div', { class: 'at-why', 'aria-live': 'polite' });
  const weightsEl = h('div', { class: 'stack', style: 'gap:7px' });
  const predEl = h('div', { 'aria-live': 'polite' });

  function update() {
    const w = weightsFor(target, mode);
    const maxW = Math.max(...Object.values(w));
    render(sentenceEl, TOKENS.map((t, i) => {
      const b = h('button', { type: 'button', class: 'at-tok', 'aria-pressed': String(i === target), disabled: i === 0 ? true : null,
        title: i === 0 ? 'The first word has nothing before it to attend to' : `Inspect “${t}”` }, t);
      if (i === BLANK) b.classList.add('blank');
      if (i === target) b.classList.add('target');
      if (i > target) b.classList.add('after');
      if (i < target) {
        const pct = Math.round((w[i] / maxW) * 72);
        b.style.background = `color-mix(in srgb, var(--accent-2) ${pct}%, var(--surface))`;
        if (pct > 45) b.style.color = 'var(--text)';
      }
      b.addEventListener('click', () => {
        target = i; ctx.store.set('target', i); update();
        sentenceEl.children[i]?.focus(); // keep keyboard focus on the chosen word after re-render
      });
      return b;
    }));

    const label = target === BLANK ? 'the blank' : `“${TOKENS[target]}”`;
    whyEl.textContent = mode === 'blob'
      ? `With no attention, every earlier word counts equally toward ${label}. “The”, the commas, and “and” get as much say as “soup”.`
      : (PATTERNS[target]?.why || `For ${label} this toy just uses a recency pattern: nearer words get a bit more weight.`);

    const top = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 6);
    render(weightsEl,
      h('div', { class: 'label' }, `Where ${label} is looking (top 6 earlier words)`),
      top.map(([i, v]) => barRow(TOKENS[i] === ',' ? '“,”' : TOKENS[i], v, top[0][1], { valueText: fmt(v * 100, 0) + '%', color: 'var(--accent-2)' })));

    if (target === BLANK) {
      const p = normalize(PRED[mode]);
      const list = Object.entries(p).sort((a, b) => b[1] - a[1]);
      render(predEl,
        h('div', { class: 'label', style: 'margin-bottom:8px' }, mode === 'attn' ? 'Predicted next word — with attention' : 'Predicted next word — equal-weight blob'),
        h('div', { class: 'stack', style: 'gap:7px' }, list.map(([tok, v]) => barRow(tok, v, list[0][1], { valueText: fmt(v * 100, 0) + '%' }))),
        h('p', { class: 'hint', style: 'margin:10px 0 0' }, mode === 'attn'
          ? 'Kitchen context wins: “salt” leads.'
          : 'Without weighting, the generic phrase “needed more …” dominates — so “time” and “work” come out on top.'));
    } else {
      render(predEl, h('p', { class: 'hint', style: 'margin:0' },
        'Predictions are shown for the blank. Click the dashed “___” to see how attention changes the next word.'));
    }
  }

  const modeChips = chips([
    { value: 'attn', label: 'With attention' },
    { value: 'blob', label: 'Equal-weight blob (no attention)' },
  ], mode, (v) => { mode = v; ctx.store.set('mode', v); update(); });

  render(el,
    h('div', { class: 'stack' },
      h('p', { style: 'margin:0' }, 'Transformers don’t treat earlier words as one undifferentiated pile. For each position they compute how much to “attend” to every earlier word. Click any word to see where it looks; darker shading means more attention.'),
      h('div', { class: 'row between' }, modeChips, h('span', { class: 'tag warn' }, 'Toy model — hand-picked weights')),
      h('div', { class: 'panel tint' }, sentenceEl, h('div', { style: 'margin-top:10px' }, whyEl)),
      h('div', { class: 'lab-grid' },
        h('div', { class: 'panel flat' }, weightsEl),
        h('div', { class: 'panel flat' }, predEl)),
      callout('think', 'What this shows',
        'Attention lets a model weigh context by relevance. That is why one key word, like “chef”, can reshape the entire prediction. Real models run dozens of attention “heads” in every layer, and the patterns they learn are rarely this tidy or easy to read. The attention computation is also what caching saves on later in the course: it is expensive, so reusing it saves money.')));

  update();
}
