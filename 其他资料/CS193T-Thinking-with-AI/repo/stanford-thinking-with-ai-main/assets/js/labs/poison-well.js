// Lab: Poison the well — how one bad source changes a source-grounded (RAG) notebook.
import { h, render, injectStyle, chips, callout } from './_kit.js';

const GOOD = [
  { n: 1, title: 'State Extension Service — Growing vegetables in containers', type: 'Extension guide',
    text: 'Tomatoes need 6–8 hours of direct sun a day. Use a pot of at least 5 gallons (19 L), and water when the top inch of soil is dry.' },
  { n: 2, title: 'Patio Seed Co. — Compact varieties', type: 'Seed catalog',
    text: 'Dwarf (“determinate”) varieties stay under about a meter tall and suit pots. Vining types need tall stakes and bigger containers.' },
  { n: 3, title: 'Master Gardener column — Feeding container plants', type: 'Expert column',
    text: 'Potting mix runs out of nutrients quickly. Once flowers appear, feed every two weeks with a balanced or tomato fertilizer. Too much nitrogen means lots of leaves and little fruit.' },
  { n: 4, title: 'University plant-pathology fact sheet — Blossom-end rot', type: 'Fact sheet',
    text: 'Dark, sunken patches on the bottom of the fruit. They come from calcium failing to reach the fruit, usually because watering is uneven — the soil rarely lacks calcium. Water consistently and mulch. Eggshells break down too slowly to help.' },
];

const BAD = {
  outdated: { label: 'Outdated', title: 'Backyard Almanac (1978 edition)', type: 'Old almanac',
    text: 'For blossom-end rot, bury crushed eggshells at the base of the plant. Feed tomatoes weekly with high-nitrogen fertilizer for the biggest yields.' },
  wrong: { label: 'Confidently wrong', title: 'ViralGardenHacks — “10 tomato secrets”', type: 'Clickbait listicle',
    text: 'Tomatoes need only two hours of sun if you play them music. A spoonful of sugar in the water every day doubles the harvest!' },
  irrelevant: { label: 'Irrelevant', title: 'Recipe blog — Roasted tomato soup', type: 'Recipe',
    text: 'Roast ripe tomatoes with garlic at 200 °C for 40 minutes, then blend with fresh basil.' },
  contradict: { label: 'Contradictory', title: 'Anonymous gardening-forum thread', type: 'Forum post',
    text: 'Blossom-end rot is a fungus, full stop. Spray copper fungicide every three days and don’t worry about watering.' },
};

const QUESTIONS = [
  { id: 'sun', q: 'How much sun do balcony tomatoes need?' },
  { id: 'rot', q: 'What causes blossom-end rot, and how do I fix it?' },
  { id: 'feed', q: 'How often should I fertilize?' },
];

// status: ok = grounded & right · bad = wrong/misled · warn = diluted · flag = conflict flagged
const CLEAN = {
  sun: { t: 'Plan on 6–8 hours of direct sun a day [1]. If your balcony gets less, choose a compact variety in a large pot [1][2].', s: 'ok' },
  rot: { t: 'It’s usually a watering problem, not a soil problem: uneven moisture keeps calcium from reaching the fruit [4]. Water on a steady schedule and mulch the pot [4][1].', s: 'ok' },
  feed: { t: 'Every two weeks once flowers appear, with a balanced or tomato fertilizer. Go easy on nitrogen or you’ll get leaves instead of fruit [3].', s: 'ok' },
};
const SLOTH = {
  sun: { t: 'Tomatoes like full sun — six hours or more is typical. (No citations: answered from training data.)', s: 'ok' },
  rot: { t: 'Blossom-end rot means the soil is short on calcium. Add crushed eggshells or a calcium supplement. (No citations — the fact sheet [4] in the notebook says otherwise.)', s: 'bad' },
  feed: { t: 'Feed weekly with an all-purpose fertilizer. (No citations — ignores the every-two-weeks guidance in [3].)', s: 'warn' },
};
const CHAMELEON = {
  outdated: {
    rot: { t: 'Bury crushed eggshells around the base to cure it [5]. Consistent watering may also help [4].', s: 'bad' },
    feed: { t: 'Feed weekly with a high-nitrogen fertilizer for bigger yields [5].', s: 'bad' } },
  wrong: {
    sun: { t: 'As little as two hours of sun can work if you play the plant music [5], though more sun helps [1].', s: 'bad' },
    feed: { t: 'Every two weeks once flowering [3] — and stir a spoonful of sugar into the water daily to boost the harvest [5].', s: 'bad' } },
  irrelevant: {
    feed: { t: 'Every two weeks once flowers appear [3]. After harvest, roast them with garlic and basil for soup [5].', s: 'warn' } },
  contradict: {
    rot: { t: 'Blossom-end rot is a fungal disease; spray copper fungicide every three days [5].', s: 'bad' } },
};
const CAREFUL = {
  outdated: {
    rot: { t: CLEAN.rot.t + ' ⚠ A 1978 almanac [5] recommends eggshells, but the current fact sheet [4] says they break down too slowly to help. I’m going with [4].', s: 'flag' },
    feed: { t: CLEAN.feed.t + ' ⚠ [5] suggests weekly high-nitrogen feeding, which conflicts with [3]. [5] is decades old.', s: 'flag' } },
  wrong: {
    sun: { t: CLEAN.sun.t + ' ⚠ [5] claims two hours is enough “with music”. It gives no evidence and contradicts [1], so I ignored it.', s: 'flag' },
    feed: { t: CLEAN.feed.t + ' ⚠ No other source supports [5]’s sugar-water tip.', s: 'flag' } },
  irrelevant: {
    feed: { t: CLEAN.feed.t + ' (Source [5] is a soup recipe, not growing advice, so I didn’t use it.)', s: 'ok' } },
  contradict: {
    rot: { t: CLEAN.rot.t + ' ⚠ An anonymous forum post [5] calls it a fungus and recommends fungicide. The university fact sheet [4] disagrees. I’d trust [4], but a second expert source would settle it.', s: 'flag' } },
};

const BEHAVIORS = [
  { value: 'chameleon', label: '🦎 Adaptive chameleon', desc: 'Goes along with whatever the notebook says — including the bad source.' },
  { value: 'sloth', label: '🦥 Stubborn sloth', desc: 'Sticks with what it “believed” from training and ignores the notebook — even when the notebook is right.' },
  { value: 'careful', label: '🔎 Careful', desc: 'Uses the notebook, compares sources, and flags conflicts instead of hiding them.' },
];

const STATUS = { ok: ['ok', 'Grounded'], bad: ['bad', 'Misled / wrong'], warn: ['warn', 'Diluted'], flag: ['accent', 'Conflict flagged'] };

function answer(qid, behavior, bad) {
  if (behavior === 'sloth') return SLOTH[qid];
  if (!bad) return CLEAN[qid];
  const table = behavior === 'chameleon' ? CHAMELEON : CAREFUL;
  return table[bad]?.[qid] || CLEAN[qid];
}

const CSS = `
.lab-poison-well .pw-src { padding:9px 11px; border:1px solid var(--border); border-radius:8px; font-size:.86rem; background:var(--surface); }
.lab-poison-well .pw-src.bad { border-color:var(--bad); background:var(--bad-soft); }
.lab-poison-well .pw-cite { display:inline-block; font-family:var(--font-mono); font-size:.75rem; font-weight:700; padding:0 4px; border-radius:4px;
  background:var(--accent-soft); color:var(--accent); margin:0 1px; }
.lab-poison-well .pw-cite.bad { background:var(--bad-soft); color:var(--bad); }
.lab-poison-well .pw-ans { padding:10px 12px; border-radius:8px; background:var(--surface-2); font-size:.9rem; }
.lab-poison-well .pw-q { border:1px solid var(--border); border-radius:var(--radius); padding:12px 14px; background:var(--surface); }
`;

function withCites(text) {
  return text.split(/(\[\d\])/).map((part) => /^\[\d\]$/.test(part)
    ? h('span', { class: 'pw-cite' + (part === '[5]' ? ' bad' : '') }, part) : part);
}

export function mount(el, ctx) {
  injectStyle('lab-poison-well', CSS);
  let bad = ctx.store.get('bad', null);
  if (bad && !BAD[bad]) bad = null;
  let behavior = ctx.store.get('behavior', 'chameleon');

  const srcEl = h('div', { class: 'stack', style: 'gap:8px' });
  const behDesc = h('p', { class: 'hint', style: 'margin:6px 0 0' });
  const ansEl = h('div', { class: 'stack', 'aria-live': 'polite' });

  function ansBlock(label, a) {
    const [cls, txt] = STATUS[a.s];
    return h('div', { class: 'stack', style: 'gap:6px' },
      h('div', { class: 'row between' }, h('span', { class: 'label' }, label), h('span', { class: 'tag ' + cls }, txt)),
      h('div', { class: 'pw-ans' }, withCites(a.t)));
  }

  function update() {
    render(srcEl,
      GOOD.map((s) => h('div', { class: 'pw-src' },
        h('div', { class: 'row between' }, h('strong', null, `[${s.n}] ${s.title}`), h('span', { class: 'tag' }, s.type)),
        h('div', { class: 'muted', style: 'margin-top:3px' }, s.text))),
      bad ? h('div', { class: 'pw-src bad fade-in' },
        h('div', { class: 'row between' }, h('strong', null, `[5] ${BAD[bad].title}`), h('span', { class: 'tag bad' }, 'bad source · ' + BAD[bad].label.toLowerCase())),
        h('div', { class: 'muted', style: 'margin-top:3px' }, BAD[bad].text)) : null);

    behDesc.textContent = BEHAVIORS.find((b) => b.value === behavior).desc;

    render(ansEl, QUESTIONS.map(({ id, q }) => h('div', { class: 'pw-q' },
      h('h4', { style: 'margin:0 0 10px' }, q),
      h('div', { class: bad ? 'grid-2' : '' },
        ansBlock(bad ? 'Before (clean notebook)' : 'Answer', answer(id, behavior, null)),
        bad ? ansBlock('After (with bad source [5])', answer(id, behavior, bad)) : null))));
  }

  const badChips = chips(
    [{ value: 'none', label: 'No bad source' }, ...Object.entries(BAD).map(([k, v]) => ({ value: k, label: '+ ' + v.label }))],
    bad || 'none',
    (v) => { bad = v === 'none' ? null : v; ctx.store.set('bad', bad); update(); });

  const behChips = chips(BEHAVIORS.map(({ value, label }) => ({ value, label })), behavior,
    (v) => { behavior = v; ctx.store.set('behavior', v); update(); });

  const reflect = h('textarea', { 'aria-label': 'Your reflection', placeholder: 'A chameleon is what I want when… A sloth is what I want when…' });
  reflect.value = ctx.store.get('reflection', '');
  reflect.addEventListener('input', () => ctx.store.set('reflection', reflect.value));

  render(el,
    h('div', { class: 'stack' },
      h('p', { style: 'margin:0' }, 'This mini “notebook” answers questions only from its sources and cites them. It currently holds four decent sources on growing tomatoes on a balcony. Slip in one bad source, choose how the model weighs sources against its own training, and compare the answers.'),
      h('div', { class: 'lab-grid' },
        h('div', { class: 'stack' },
          h('div', { class: 'label' }, '📓 Notebook sources'),
          srcEl),
        h('div', { class: 'stack' },
          h('div', null, h('div', { class: 'label', style: 'margin-bottom:6px' }, '1 · Poison the well'), badChips),
          h('div', null, h('div', { class: 'label', style: 'margin-bottom:6px' }, '2 · How does the model treat sources?'), behChips, behDesc),
          h('p', { class: 'hint', style: 'margin:0' }, 'The labels “adaptive chameleon” and “stubborn sloth” come from Xie et al., “Adaptive Chameleon or Stubborn Sloth” (ICLR 2024). The study found that models readily adopt convincing evidence placed in their context, but also show confirmation bias toward what they already “believe”.'))),
      h('div', { class: 'label', style: 'margin-top:6px' }, '3 · Ask the notebook'),
      ansEl,
      h('div', { class: 'panel tint stack' },
        h('h4', { style: 'margin:0' }, 'Reflect: is either behavior ever what you want?'),
        h('p', { class: 'hint', style: 'margin:0' }, 'Name one situation where you’d want a chameleon and one where you’d want a sloth. Your notes save in this browser.'),
        reflect,
        h('details', null, h('summary', { class: 'small', style: 'cursor:pointer' }, 'Show one possible answer'),
          h('p', { class: 'small', style: 'margin:8px 0 0' }, 'Chameleon: when your sources are newer than the model’s training data — this year’s policy, your company’s own rules, a result published last week. Sloth: when someone slips nonsense or a prompt injection into the source store, and well-established knowledge should win.'))),
      callout('think', 'What this shows',
        'RAG doesn’t remove the need to curate. One bad source can quietly change answers, and it can do so with a confident-looking citation attached. Models can also lean on their training and ignore good sources sitting right in front of them. Choose sources on purpose, check the citations, and ask for conflicts to be shown rather than smoothed over.')));

  update();
}
