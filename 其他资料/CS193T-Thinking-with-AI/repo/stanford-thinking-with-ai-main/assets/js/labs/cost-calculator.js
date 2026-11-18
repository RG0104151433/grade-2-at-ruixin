// Lab: Count the Cost — tokens, money, energy, water, latency (Module 7)
import { h, render, injectStyle, chips, slider, callout, fmt, clamp } from './_kit.js';

// ---- Illustrative pricing & speed (NOT current list prices) ----
const TIERS = {
  small:  { label: 'Small',  inPrice: 0.25, outPrice: 1.25, energy: 0.3, ttft: 0.4, prefill: 40000, decode: 180 },
  medium: { label: 'Medium', inPrice: 3,    outPrice: 15,   energy: 1,   ttft: 0.8, prefill: 15000, decode: 80 },
  large:  { label: 'Large',  inPrice: 15,   outPrice: 75,   energy: 3,   ttft: 1.5, prefill: 6000,  decode: 40 },
};
const MODALITY = { text: { label: 'Text', mult: 1, range: '1×' }, image: { label: 'Image', mult: 30, range: '≈20–40×' }, video: { label: 'Video', mult: 2000, range: '≈1,000–3,000×' } };
const USER_MSG = 150;          // tokens you type per turn (assumption)
const THINK_TOKENS = 4000;     // illustrative hidden reasoning budget per turn
const REASON_ENERGY = 30;      // published average multiplier (Hugging Face)
const CACHE_READ = 0.1, CACHE_WRITE = 1.25;
const WATER_PER_WH = 0.26 / 0.24;   // mL per Wh, from Google's median-prompt figures
const CO2_PER_WH = 0.03 / 0.24;     // g CO2e per Wh, same source
const TV_W = 0.24 * 3600 / 9;       // ≈96 W: 0.24 Wh ≈ 9 s of TV

// Energy for one model pass over `ctxTokens` of input (Wh), text, medium-ish model.
// Power law through Epoch AI anchors: 2.5 Wh @10K and 40 Wh @100K (slope ≈1.2 in log-log),
// which lands near Google's 0.24 Wh median at ~1.4K tokens. Floored for tiny prompts. Very rough.
const SLOPE = Math.log10(40 / 2.5);
const passEnergy = (ctxTokens) => Math.max(0.03, 2.5 * Math.pow(Math.max(ctxTokens, 1) / 10000, SLOPE));

function simulate(p) {
  const t = TIERS[p.tier];
  const visibleOut = p.output;
  const hiddenOut = p.reasoning ? THINK_TOKENS : 0;
  const perTurnHistory = USER_MSG + visibleOut;
  const turns = [];
  let cost = 0, energy = 0, latency = 0, inputTotal = 0, outputTotal = 0;
  for (let i = 0; i < p.turns; i++) {
    const input = p.context + USER_MSG + i * perTurnHistory;
    const prefix = i === 0 ? 0 : p.context + i * perTurnHistory;   // what was already sent last turn
    let inCost, energyTokens;
    if (p.cache) {
      const cached = prefix, fresh = input - prefix;
      const write = i === 0 ? p.context : 0;                          // first turn writes the stable prefix
      inCost = (cached * CACHE_READ + write * CACHE_WRITE + (fresh - write) * 1) * t.inPrice / 1e6;
      energyTokens = fresh + cached * CACHE_READ;                      // cached attention isn't recomputed
    } else {
      inCost = input * t.inPrice / 1e6;
      energyTokens = input;
    }
    const outCost = (visibleOut + hiddenOut) * t.outPrice / 1e6;
    const e = passEnergy(energyTokens) * t.energy * MODALITY[p.modality].mult * (p.reasoning ? REASON_ENERGY : 1);
    const lat = t.ttft + (p.cache && i > 0 ? (input - prefix) : input) / t.prefill + (visibleOut + hiddenOut) / t.decode;
    turns.push({ input, e });
    cost += inCost + outCost; energy += e; latency += lat;
    inputTotal += input; outputTotal += visibleOut + hiddenOut;
  }
  return { turns, cost, energy, latency, inputTotal, outputTotal, tokens: inputTotal + outputTotal, water: energy * WATER_PER_WH, co2: energy * CO2_PER_WH };
}

const money = (x) => (x < 0.01 ? '$' + x.toFixed(4) : x < 10 ? '$' + x.toFixed(3) : '$' + fmt(x, 2));
const wh = (x) => (x < 1 ? fmt(x, 2) + ' Wh' : x < 1000 ? fmt(x, 1) + ' Wh' : fmt(x / 1000, 2) + ' kWh');
const ml = (x) => (x < 1000 ? fmt(x, x < 10 ? 2 : 0) + ' mL' : fmt(x / 1000, 2) + ' L');
const secs = (x) => (x < 90 ? fmt(x, 1) + ' s' : fmt(x / 60, 1) + ' min');
const logToTok = (v) => Math.round(Math.pow(10, v) / 100) * 100 || 200;

export function mount(el, ctx) {
  injectStyle('lab-cost-calculator', `
    .lab-cost-calculator .cc-cols { display: flex; align-items: flex-end; gap: 3px; height: 120px; padding: 6px 4px 0; border-bottom: 1px solid var(--border-strong); }
    .lab-cost-calculator .cc-cols span { flex: 1; background: var(--accent); border-radius: 3px 3px 0 0; min-height: 2px; transition: height .3s ease; }
    .lab-cost-calculator .cc-cols span.first { background: var(--teal); }
    .lab-cost-calculator .cc-axis { display: flex; justify-content: space-between; font-size: .75rem; color: var(--muted); }
    .lab-cost-calculator .cc-eq { font-size: .9rem; margin: 0; padding-left: 1.1em; }
    .lab-cost-calculator .cc-habit { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: .92rem; }
    .lab-cost-calculator .cc-habit:last-child { border-bottom: 0; }
    .lab-cost-calculator .cc-save { font-family: var(--font-mono); font-weight: 700; color: var(--ok); white-space: nowrap; }
    .lab-cost-calculator .cc-src { font-size: .82rem; color: var(--muted); }
    .lab-cost-calculator .stats .v { font-size: 1.35rem; }
  `);
  const p = { modality: 'text', reasoning: false, logContext: 3.3, output: 500, turns: 6, cache: false, tier: 'medium', ...ctx.store.get('p', {}) };
  const save = () => ctx.store.set('p', p);

  const out = h('div', { class: 'stack', 'aria-live': 'polite' });
  const ctxSlider = slider({ label: 'Context per prompt (system prompt + files + pasted text)', min: 2.3, max: 5.3, step: 0.05, value: p.logContext,
    format: (v) => fmt(logToTok(v)) + ' tokens', onInput: (v) => { p.logContext = v; update(); }, hint: 'Log scale: ~200 tokens (a short question) to ~200K (a long report or codebase).' });

  const controls = h('div', { class: 'stack' },
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'What are you generating?'),
      chips(Object.entries(MODALITY).map(([value, m]) => ({ value, label: `${m.label} (${m.range})` })), p.modality, (v) => { p.modality = v; update(); })),
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Model size (illustrative tiers)'),
      chips(Object.entries(TIERS).map(([value, t]) => ({ value, label: t.label })), p.tier, (v) => { p.tier = v; update(); })),
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Reasoning / "thinking" mode'),
      chips([{ value: false, label: 'Off' }, { value: true, label: 'On (≈30× energy)' }], p.reasoning, (v) => { p.reasoning = v; update(); }),
      h('div', { class: 'hint' }, `On average reasoning uses about 30× the energy; some models measured far higher (150–700×). We also bill an illustrative ${fmt(THINK_TOKENS)} hidden thinking tokens per turn.`)),
    ctxSlider,
    slider({ label: 'Reply length per turn', min: 50, max: 4000, step: 50, value: p.output, format: (v) => fmt(v) + ' tokens', onInput: (v) => { p.output = v; update(); } }),
    slider({ label: 'Turns in the same chat', min: 1, max: 30, step: 1, value: p.turns, format: (v) => v + (v === 1 ? ' turn' : ' turns'), onInput: (v) => { p.turns = v; update(); },
      hint: 'Every turn re-sends the whole conversation so far.' }),
    h('div', { class: 'field' }, h('span', { class: 'label' }, 'Prompt caching'),
      chips([{ value: false, label: 'Off' }, { value: true, label: 'On' }], p.cache, (v) => { p.cache = v; update(); }),
      h('div', { class: 'hint' }, 'Caching stores the already-computed attention for text that repeats from turn to turn. Writing to the cache costs a little extra (≈1.25×); later reads are ≈90% cheaper.')));

  function habitRows(base) {
    const pctSave = (alt) => (base.energy > 0 ? Math.round((1 - alt.energy / base.energy) * 100) : 0);
    const rows = [];
    // new topic → new chat: split into chats of ≤5 turns
    if (p.turns > 5) {
      const chunks = Math.floor(p.turns / 5), rest = p.turns % 5;
      const a = simulate({ ...p, context: logToTok(p.logContext), turns: 5 });
      const b = rest ? simulate({ ...p, context: logToTok(p.logContext), turns: rest }) : { energy: 0 };
      rows.push(['New topic → new chat (here: chats of ≤5 turns instead of one long thread)', pctSave({ energy: a.energy * chunks + b.energy })]);
    } else rows.push(['New topic → new chat', null, 'Your chat is already short.']);
    rows.push(p.modality !== 'text'
      ? ['Paste the text instead of an image or video of it', pctSave(simulate({ ...p, modality: 'text', context: logToTok(p.logContext) }))]
      : ['Paste text instead of screenshots', null, 'Already text.']);
    rows.push(p.tier !== 'small' ? ['Use the smallest model that does the job', pctSave(simulate({ ...p, tier: 'small', context: logToTok(p.logContext) }))] : ['Smallest model that works', null, 'Already small.']);
    rows.push(p.reasoning ? ['Turn off reasoning for simple tasks', pctSave(simulate({ ...p, reasoning: false, context: logToTok(p.logContext) }))] : ['Save reasoning for hard problems', null, 'Already off.']);
    if (!p.cache && p.turns > 1) rows.push(['Turn on caching for repeated context', pctSave(simulate({ ...p, cache: true, context: logToTok(p.logContext) }))]);
    rows.push(['Skip AI when a calculator, Find (⌘/Ctrl-F), or plain search would do', 100]);
    return rows.map(([text, s, note]) => h('div', { class: 'cc-habit' }, h('span', null, text),
      s === null ? h('span', { class: 'hint' }, note) : h('span', { class: 'cc-save' }, s > 0 ? `−${s}%` : '≈0%')));
  }

  function update() {
    save();
    const context = logToTok(p.logContext);
    const r = simulate({ ...p, context });
    const maxIn = Math.max(...r.turns.map((t) => t.input));
    const tvSec = (r.energy * 3600) / TV_W;
    render(out,
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Tokens processed'), h('span', { class: 'v' }, fmt(r.tokens)), h('span', { class: 's' }, `${fmt(r.inputTotal)} in · ${fmt(r.outputTotal)} out`)),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Est. cost'), h('span', { class: 'v' }, money(r.cost)), h('span', { class: 's' }, 'illustrative prices')),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Energy'), h('span', { class: 'v' }, wh(r.energy)), h('span', { class: 's' }, 'very rough')),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Water'), h('span', { class: 'v' }, ml(r.water)), h('span', { class: 's' }, 'data-center cooling')),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'CO₂e'), h('span', { class: 'v' }, fmt(r.co2, r.co2 < 1 ? 2 : 0) + ' g'), h('span', { class: 's' }, 'depends on the grid')),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Time waiting'), h('span', { class: 'v' }, secs(r.latency)), h('span', { class: 's' }, 'summed over turns'))),
      h('div', { class: 'panel flat' },
        h('div', { class: 'row between' }, h('strong', { class: 'small' }, 'Input tokens sent on each turn'), h('span', { class: 'hint' }, `turn ${p.turns}: ${fmt(maxIn)} tokens`)),
        h('div', { class: 'cc-cols', role: 'img', 'aria-label': `Input tokens grow from ${fmt(r.turns[0].input)} on turn 1 to ${fmt(maxIn)} on turn ${p.turns}` },
          r.turns.map((t, i) => h('span', { class: i === 0 ? 'first' : '', style: { height: clamp((t.input / maxIn) * 100, 2, 100) + '%' }, title: `Turn ${i + 1}: ${fmt(t.input)} tokens` }))),
        h('div', { class: 'cc-axis' }, h('span', null, 'turn 1'), h('span', null, `turn ${p.turns}`)),
        p.turns > 1 ? h('p', { class: 'hint', style: { marginTop: '6px' } }, `The last turn re-reads ${fmt(maxIn)} tokens — ${fmt(maxIn / r.turns[0].input, 1)}× the first. That's the cost of one ever-growing thread.`) : null),
      h('div', { class: 'panel flat' }, h('strong', { class: 'small' }, 'In everyday terms (roughly)'),
        h('ul', { class: 'cc-eq' },
          h('li', null, `≈ ${secs(tvSec)} of watching TV`),
          h('li', null, `≈ ${fmt(r.energy / 15, r.energy < 15 ? 2 : 1)} smartphone charges (≈15 Wh each)`),
          h('li', null, `≈ ${fmt(r.energy / 10 * 60, 0)} minutes of a 10 W LED bulb`),
          h('li', null, `≈ ${fmt(r.water / 5, r.water < 50 ? 1 : 0)} teaspoons of water`))),
      h('div', { class: 'panel tint' }, h('h4', null, 'Habits that cut the footprint'), habitRows(r)));
  }

  render(el, h('div', { class: 'stack-lg' },
    callout('warn', 'Estimates, not measurements', 'Published figures for AI energy and water vary by an order of magnitude or more depending on the model, hardware, data center, and how the study counted. Treat every number here as a ballpark that shows direction and scale, not a precise footprint. Prices are illustrative, not any vendor\'s current list price.'),
    h('div', { class: 'lab-grid' }, controls, out),
    h('details', { class: 'acc' }, h('summary', null, 'Where the numbers come from'),
      h('div', { class: 'acc-body cc-src stack' },
        h('ul', null,
          h('li', null, 'Median text prompt ≈ 0.24 Wh, 0.26 mL water, 0.03 g CO₂e (about 9 seconds of TV) — ', h('a', { href: 'https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference', target: '_blank', rel: 'noopener' }, 'Google, 2025'), '. Water and CO₂e here scale with energy using Google\'s ratios.'),
          h('li', null, 'Long context ≈ 2.5 Wh at 10K input tokens and ≈ 40 Wh at 100K — ', h('a', { href: 'https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use', target: '_blank', rel: 'noopener' }, 'Epoch AI'), '. We draw a straight line through these on a log-log scale; it passes near Google\'s median at ~1.4K tokens.'),
          h('li', null, 'Images ≈ 20–40× a text reply; video ≈ 1,000–3,000× — ', h('a', { href: 'https://www.technologyreview.com/2025/05/20/1116327/ai-energy-usage-climate-footprint-big-tech/', target: '_blank', rel: 'noopener' }, 'MIT Technology Review'), '. We use 30× and 2,000×.'),
          h('li', null, 'Reasoning mode ≈ 30× on average, with some models far higher — ', h('a', { href: 'https://huggingface.github.io/AIEnergyScore/', target: '_blank', rel: 'noopener' }, 'Hugging Face AI Energy Score'), '.'),
          h('li', null, 'Model-size energy factors (0.3× / 1× / 3×), prices, speeds, the 150-token message, and the thinking budget are illustrative assumptions for teaching.')))),
    callout('think', 'What this shows', h('p', null, 'Cost grows with everything in the context window, on every turn — so the habits that make AI more effective (focused chats, lean context, the right-sized model) are also the ones that save money, energy, and water. Caching helps because the attention work on repeated text is computed once and reused.'))));
  update();
}
