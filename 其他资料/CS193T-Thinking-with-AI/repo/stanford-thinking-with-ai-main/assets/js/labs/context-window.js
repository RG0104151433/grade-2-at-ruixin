// Lab: Context window — a model can only use the tokens that fit in its window.
import { h, render, injectStyle, slider, callout, barRow, fmt } from './_kit.js';

const BASE = ['The', 'pilot', 'grabbed', 'her', 'coffee', ',', 'said', 'goodbye', ',', 'and', 'walked', 'out', 'to', 'the'];
const FILLER = [',', 'yawning', 'after', 'a', 'night', 'shift', ','];
const KEY = 'pilot';
const HINT = 'coffee';

const DISTS = {
  key: { title: 'The model can see “pilot”', p: { runway: 38, plane: 30, hangar: 12, gate: 8, car: 5, street: 4, door: 3 } },
  hint: { title: '“pilot” is gone, but “coffee” is still visible', p: { car: 30, street: 22, bus: 16, door: 14, garden: 8, porch: 6, runway: 2 } },
  none: { title: 'Only generic words are left', p: { street: 26, door: 20, car: 18, garden: 14, porch: 12, beach: 8, runway: 2 } },
};

const CSS = `
.lab-context-window .cw-passage { display:flex; flex-wrap:wrap; align-items:flex-end; gap:0; line-height:1; }
.lab-context-window .cw-tok { position:relative; padding-top:10px; }
.lab-context-window .cw-tok.in::before { content:""; position:absolute; left:0; right:0; top:2px; height:4px; background:var(--accent); }
.lab-context-window .cw-tok.in.first::before { border-top-left-radius:4px; border-bottom-left-radius:4px; left:2px; }
.lab-context-window .cw-tok.in.last::before { border-top-right-radius:4px; border-bottom-right-radius:4px; right:2px; }
.lab-context-window .cw-blank { display:inline-block; min-width:64px; border:2px dashed var(--accent); border-radius:6px; padding:3px 8px; margin:2px;
  font-family:var(--font-mono); font-size:.86rem; color:var(--accent); text-align:center; font-weight:700; }
.lab-context-window .cw-legend { display:flex; gap:14px; flex-wrap:wrap; font-size:.8rem; color:var(--muted); }
.lab-context-window .cw-legend i { display:inline-block; width:18px; height:4px; background:var(--accent); vertical-align:middle; margin-right:5px; border-radius:2px; }
`;

function norm(p) {
  const tot = Object.values(p).reduce((a, b) => a + b, 0);
  return Object.entries(p).map(([tok, w]) => ({ tok, p: w / tot })).sort((a, b) => b.p - a.p);
}

export function mount(el, ctx) {
  injectStyle('lab-context-window', CSS);
  let win = ctx.store.get('win', 14);
  let filler = ctx.store.get('filler', false);

  const passageEl = h('div', { class: 'cw-passage' });
  const countEl = h('div', { class: 'hint' });
  const statusEl = h('div', { 'aria-live': 'polite' });
  const barsEl = h('div', { class: 'stack', style: 'gap:8px' });
  const distTitle = h('div', { class: 'label', style: 'margin-bottom:8px' });

  const tokens = () => (filler ? [BASE[0], BASE[1], ...FILLER, ...BASE.slice(2)] : BASE);

  function update() {
    const toks = tokens();
    const n = toks.length;
    const start = Math.max(0, n - win);
    const visible = toks.slice(start);
    const keyIn = visible.includes(KEY);
    const hintIn = visible.includes(HINT);
    const mode = keyIn ? 'key' : hintIn ? 'hint' : 'none';

    render(passageEl,
      toks.map((t, i) => {
        const inWin = i >= start;
        let cls = 'token cw-tok';
        if (!inWin) cls += ' dim';
        else cls += ' in';
        if (inWin && i === start) cls += ' first';
        if (inWin && i === n - 1) cls += ' last';
        if (t === KEY) cls += inWin ? ' hot' : '';
        return h('span', { class: cls, title: inWin ? 'inside the window' : 'outside the window — invisible to the model' }, t);
      }),
      h('span', { class: 'cw-blank' }, '?'));

    const keyDist = n - toks.indexOf(KEY);
    countEl.textContent = `Passage length: ${n} tokens. “${KEY}” sits ${keyDist} tokens back from the blank, so the window must be at least ${keyDist} tokens to include it.`;

    render(statusEl, keyIn
      ? callout('ok', `“${KEY}” is inside the ${win}-token window`, 'Aviation words dominate the prediction. The single most important clue is still visible.')
      : callout('warn', `“${KEY}” has slid out of the ${win}-token window`,
        hintIn ? 'The model can no longer tell this is a pilot. All it has left is a morning-commute vibe from “coffee”.'
          : 'Even “coffee” is gone. The model is guessing from “walked out to the” alone — so it falls back on the most generic places people walk to.'));

    const d = norm(DISTS[mode].p);
    distTitle.textContent = 'Prediction — ' + DISTS[mode].title;
    render(barsEl, d.map(({ tok, p }) => barRow(tok, p, d[0].p, {
      valueText: fmt(p * 100, 0) + '%',
      color: ['runway', 'plane', 'hangar', 'gate'].includes(tok) ? 'var(--accent-2)' : undefined,
    })));
  }

  const winSlider = slider({
    label: 'Context window size (tokens)', min: 3, max: 20, step: 1, value: win,
    format: (v) => v + ' tokens',
    onInput: (v) => { win = v; ctx.store.set('win', v); update(); },
    hint: 'The window always holds the most recent tokens, counting back from the blank.',
  });

  const fillerBox = h('input', { type: 'checkbox', id: 'cw-filler-' + Math.random().toString(36).slice(2) });
  fillerBox.checked = filler;
  fillerBox.addEventListener('change', () => { filler = fillerBox.checked; ctx.store.set('filler', filler); update(); });
  const fillerLabel = h('label', { class: 'check', for: fillerBox.id }, fillerBox,
    h('span', null, h('strong', null, 'Reword with filler'), h('br'), h('span', { class: 'hint' }, 'Adds “, yawning after a night shift,” — same meaning, seven more tokens.')));

  render(el,
    h('div', { class: 'stack' },
      h('p', { style: 'margin:0' }, 'A model can only use what fits in its context window — the most recent stretch of tokens. Shrink the window, or pad the sentence, and watch what happens when the one word that matters drops out of view.'),
      h('div', { class: 'panel tint' },
        passageEl,
        h('div', { class: 'cw-legend', style: 'margin-top:10px' },
          h('span', null, h('i'), 'inside the window'),
          h('span', null, h('span', { class: 'token dim', style: 'font-size:.72rem;padding:0 4px' }, 'word'), ' outside (invisible to the model)'),
          h('span', null, h('span', { class: 'token hot', style: 'font-size:.72rem;padding:0 4px' }, 'pilot'), ' key clue'))),
      countEl,
      h('div', { class: 'lab-grid' },
        h('div', { class: 'stack' }, winSlider, fillerLabel, statusEl),
        h('div', { class: 'panel flat', 'aria-live': 'polite' }, distTitle, barsEl)),
      callout('info', 'Real-world scale',
        'This toy window holds 20 tokens or fewer. Today’s frontier models hold anywhere from about 200,000 to 10 million tokens, so rewording one sentence won’t push anything out. But long chats, large uploads, and big agent tasks still hit the limit — and models often attend poorly to long contexts well before they hit it.'),
      callout('think', 'What this shows',
        'The model has no memory outside its window. If a crucial fact falls out — or is buried under padding — the prediction quietly changes, and the model gives no warning. Treat context as a limited budget: keep what matters, cut what doesn’t.')));

  update();
}
