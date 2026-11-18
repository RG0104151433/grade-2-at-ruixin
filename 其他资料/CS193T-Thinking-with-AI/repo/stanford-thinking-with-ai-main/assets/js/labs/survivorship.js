import { h, render, injectStyle, callout, slider, rng } from './_kit.js';

const N = 200;

function population(seed) {
  const r = rng(seed);
  return Array.from({ length: N }, () => ({ u1: r(), u2: r(), u3: r() }));
}

function simulate(pop, { base, sens, fa, holdout }) {
  return pop.map((p) => {
    const weak = p.u1 < base;
    const flagged = weak ? p.u2 < sens : p.u2 < fa;
    const kept = !flagged || (holdout && p.u3 < 0.1); // holdout keeps a random 10% of flagged people
    return { weak, flagged, kept, inHoldout: flagged && kept };
  });
}

export function mount(el, ctx) {
  injectStyle('lab-survivorship', `
    .lab-survivorship .sv-dots { display: grid; grid-template-columns: repeat(20, minmax(0, 1fr)); gap: 4px; max-width: 520px; }
    .lab-survivorship .sv-dot { aspect-ratio: 1; border-radius: 50%; background: var(--surface-3); border: 2px solid transparent; transition: all .3s ease; position: relative; }
    .lab-survivorship .sv-dot.flag { border-color: var(--accent-2); }
    .lab-survivorship .sv-dot.good { background: var(--ok); }
    .lab-survivorship .sv-dot.bad { background: var(--bad); }
    .lab-survivorship .sv-dot.gone { opacity: .08; transform: scale(.6); }
    .lab-survivorship .sv-dot.ghost { opacity: .9; background: transparent; }
    .lab-survivorship .sv-dot.ghost.good { border-color: var(--ok); border-style: dashed; }
    .lab-survivorship .sv-dot.ghost.bad { border-color: var(--bad); border-style: dashed; }
    .lab-survivorship .sv-dot.hold { box-shadow: 0 0 0 2px var(--accent); }
    .lab-survivorship .sv-legend { display: flex; flex-wrap: wrap; gap: 12px; font-size: .8rem; color: var(--text-2); }
    .lab-survivorship .sv-legend i { display: inline-block; width: 11px; height: 11px; border-radius: 50%; margin-right: 5px; vertical-align: -1px; border: 2px solid transparent; }
    .lab-survivorship .sv-phase { display: flex; gap: 6px; flex-wrap: wrap; }
    .lab-survivorship .sv-brag { font-family: var(--font-serif); font-size: 1.25rem; padding: 12px 14px; border-radius: 10px; background: var(--ok-soft); color: var(--ok); text-align: center; }
  `);

  let seed = ctx.store.get('seed', 7);
  let params = ctx.store.get('params', { base: 0.2, sens: 0.97, fa: 0.3, holdout: false });
  let phase = 0; // 0 predictions, 1 deployed, 2 counterfactual
  let pop = population(seed);

  const dots = h('div', { class: 'sv-dots', role: 'img' });
  const legend = h('div', { class: 'sv-legend' });
  const panel = h('div', { class: 'stack', 'aria-live': 'polite' });
  const phaseBtns = h('div', { class: 'sv-phase', role: 'group', 'aria-label': 'Simulation stage' });

  const save = () => { ctx.store.set('params', params); ctx.store.set('seed', seed); };

  function draw() {
    const sim = simulate(pop, params);
    const fired = sim.filter((e) => !e.kept);
    const retained = sim.filter((e) => e.kept);
    const retainedGood = retained.filter((e) => !e.weak).length;
    const firedGood = fired.filter((e) => !e.weak).length;
    const hold = sim.filter((e) => e.inHoldout);
    const holdGood = hold.filter((e) => !e.weak).length;
    const truthGood = sim.filter((e) => !e.weak).length;

    render(phaseBtns, ['1 · Month 3: AI flags people', '2 · Deploy: flagged people let go', '3 · Reveal the counterfactual'].map((label, i) =>
      h('button', { type: 'button', class: 'chip', 'aria-pressed': String(phase === i), onclick: () => { phase = i; draw(); } }, label)));

    render(dots, sim.map((e) => {
      let cls = 'sv-dot';
      if (phase === 0) cls += e.flagged ? ' flag' : '';
      else if (e.kept) cls += (e.weak ? ' bad' : ' good') + (e.inHoldout ? ' hold' : '');
      else cls += phase === 1 ? ' gone' : ' ghost' + (e.weak ? ' bad' : ' good');
      return h('div', { class: cls });
    }));
    dots.setAttribute('aria-label', `${N} employees. ${fired.length} let go. ${phase === 2 ? firedGood + ' of them would have performed well.' : ''}`);

    const item = (style, label) => h('span', null, h('i', { style }), label);
    render(legend, phase === 0
      ? [item('background:var(--surface-3)', 'Employee (true performance not yet known)'), item('background:var(--surface-3);border-color:var(--accent-2)', 'Flagged by the AI')]
      : [item('background:var(--ok)', 'Performed well'), item('background:var(--bad)', 'Performed poorly'),
        phase === 2 ? item('border-color:var(--ok);border-style:dashed', 'Let go — would have performed well') : item('background:var(--surface-3);opacity:.3', 'Let go (no data collected)'),
        phase === 2 ? item('border-color:var(--bad);border-style:dashed', 'Let go — would have performed poorly') : null,
        params.holdout ? item('background:var(--ok);box-shadow:0 0 0 2px var(--accent)', 'Holdout: flagged but kept') : null]);

    const pctRetained = retained.length ? Math.round((retainedGood / retained.length) * 100) : 0;
    const stats = [
      ['Flagged & let go', fired.length, `of ${N}`],
      ['Retained performing well', pctRetained + '%', `${retainedGood} of ${retained.length}`],
    ];
    if (phase === 2) stats.push(['Good people let go', firedGood, `${fired.length ? Math.round((firedGood / fired.length) * 100) : 0}% of those let go`]);
    if (phase === 2) stats.push(['Strong performers overall', truthGood, 'in the full population']);

    render(panel,
      phase === 0 ? callout('info', 'Month 3', 'The model reads early performance data and flags the people it predicts will underperform over the rest of their contract. Nobody can see the true outcome yet.') : null,
      phase >= 1 ? h('div', { class: 'sv-brag' }, `📈 Dashboard: ${pctRetained}% of retained employees performed well!`) : null,
      phase >= 1 ? h('div', { class: 'stats' }, stats.map(([k, v, s]) => h('div', { class: 'stat' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, String(v)), h('span', { class: 's' }, s)))) : null,
      phase === 1 ? callout('warn', 'Is it working?', 'Leadership is thrilled. But look at what the dashboard is measuring: only the people who survived the cut. The people who were let go generate no data at all. Try dragging the false-alarm slider up — the bragging number barely moves.') : null,
      phase === 2 ? callout('bad', `${firedGood} people who would have done well were let go.`,
        'This is survivorship bias: the monitoring only sees the survivors. Without the counterfactual — what would have happened if we had not acted — a model that wrongly flags many good people looks perfect.') : null,
      phase === 2 && params.holdout && hold.length ? callout('ok', `The holdout reveals it: ${holdGood} of ${hold.length} flagged-but-kept employees performed well.`,
        'Keeping a small random group of flagged people lets you measure how often the flags are wrong — the evidence the main dashboard can never produce.') : null);
  }

  const sliders = h('div', { class: 'stack' },
    slider({ label: 'Truly weak performers in the workforce', min: 0.05, max: 0.5, step: 0.01, value: params.base, format: (v) => Math.round(v * 100) + '%',
      onInput: (v) => { params.base = v; save(); draw(); } }),
    slider({ label: 'AI catches truly weak performers', min: 0.5, max: 1, step: 0.01, value: params.sens, format: (v) => Math.round(v * 100) + '%',
      onInput: (v) => { params.sens = v; save(); draw(); } }),
    slider({ label: 'AI wrongly flags strong performers (false alarms)', min: 0, max: 0.6, step: 0.01, value: params.fa, format: (v) => Math.round(v * 100) + '%',
      hint: 'A model can ace a historical test and still drift after deployment — conditions change.', onInput: (v) => { params.fa = v; save(); draw(); } }));

  const holdId = 'sv-holdout';
  const holdCb = h('input', { type: 'checkbox', id: holdId });
  holdCb.checked = params.holdout;
  holdCb.addEventListener('change', () => { params.holdout = holdCb.checked; save(); draw(); });

  render(el, h('div', { class: 'stack' },
    h('div', { class: 'panel tint' },
      h('strong', null, 'The case. '),
      'A company hires on one-year contracts. An AI tool, validated on last year’s data, predicts at month 3 who will be a weak performer, and those people are let go. A year later, everyone who stayed is doing great. Success?'),
    phaseBtns,
    h('div', { class: 'lab-grid' },
      h('div', { class: 'stack' }, dots, legend,
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn small ghost', onclick: () => { seed = (seed * 31 + 7) % 9973; pop = population(seed); save(); draw(); } }, '🎲 New random workforce'))),
      h('div', { class: 'stack' }, sliders,
        h('label', { class: 'check', for: holdId }, holdCb, h('span', null, h('strong', null, 'Add monitoring: '), 'keep a random 10% of flagged employees as a holdout group')),
        panel)),
    h('div', { class: 'panel flat' },
      h('h4', null, 'Monitoring that could catch this'),
      h('ul', { style: 'margin:0' },
        h('li', null, h('strong', null, 'Randomized holdout: '), 'don’t act on a small random share of predictions, and track how those people actually do.'),
        h('li', null, h('strong', null, 'Audit a sample: '), 'have humans independently review some flagged cases before and after the decision.'),
        h('li', null, h('strong', null, 'Track the people you acted on: '), 'where possible, follow up on outcomes for those affected (e.g., performance at their next job).'),
        h('li', null, h('strong', null, 'Question the use itself: '), 'should a prediction alone decide someone’s job? Who bears the cost when it is wrong?'))),
    callout('think', 'What this shows',
      'When an AI system’s output drives real-world actions, you often can’t observe what would have happened otherwise. Post-deployment monitoring has to be designed to measure the counterfactual, or it will happily confirm a broken system.')));

  draw();
}
