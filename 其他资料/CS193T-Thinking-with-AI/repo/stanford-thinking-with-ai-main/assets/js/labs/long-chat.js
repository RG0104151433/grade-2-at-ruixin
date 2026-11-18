// Lab: Long chats — "new topic, new chat" and "lost in the middle".
import { h, render, injectStyle, slider, callout, fmt } from './_kit.js';

const SYSTEM_TOKENS = 800; // vendor system prompt + settings, re-sent every turn

const TOPICS = {
  calc: { label: 'Calculus help', icon: '∫', color: 'var(--accent)', turns: [
    { u: 'Can you explain the chain rule with a simple example?', a: 'Think of a function inside a function. Differentiate the outer one, leave the inner one alone, then multiply by the inner one’s derivative…', ut: 18, at: 260 },
    { u: 'Why do we multiply by the inner derivative?', a: 'Because the inner function changes at its own rate, and that rate scales how fast the whole thing changes…', ut: 12, at: 230 },
    { u: 'Give me a practice problem.', a: 'Try differentiating (3x² + 1)⁵. Start by naming the inner and outer functions…', ut: 9, at: 180 },
    { u: 'I got 30x(3x² + 1)⁴ — right?', a: 'Yes. Five from the power, 6x from the inside, and five times 6x is 30x…', ut: 16, at: 140 },
  ] },
  curry: { label: 'Curry recipe', icon: '🍛', color: 'var(--accent-2)', turns: [
    { u: 'What can I cook with coconut milk and chickpeas?', a: 'A quick chickpea curry: soften onion, garlic and ginger, bloom the spices, then add the chickpeas and coconut milk…', ut: 14, at: 300 },
    { u: 'I’m out of garam masala — substitute?', a: 'Combine cumin, coriander, a little cinnamon and black pepper. Toast them briefly…', ut: 14, at: 190 },
    { u: 'How long should it simmer?', a: 'Simmer 15–20 minutes, until it thickens and coats a spoon…', ut: 8, at: 120 },
  ] },
  advice: { label: 'Roommate advice', icon: '💬', color: 'var(--violet)', turns: [
    { u: 'My roommate keeps borrowing my things without asking. How do I bring it up?', a: 'Pick a calm moment and describe the specific behavior, not their character…', ut: 24, at: 280 },
    { u: 'What if they get defensive?', a: 'Acknowledge how they feel, then restate what you need without escalating…', ut: 8, at: 210 },
    { u: 'Help me word the first sentence?', a: 'Try: “Hey, could we talk about something small that’s been on my mind?”…', ut: 12, at: 150 },
  ] },
};
const MAX_TURNS = 12;

const CSS = `
.lab-long-chat .lc-log { max-height: 250px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; padding:4px; }
.lab-long-chat .lc-msg { font-size:.86rem; padding:7px 10px; border-radius:10px; max-width:92%; }
.lab-long-chat .lc-msg.u { align-self:flex-end; background:var(--accent-soft); }
.lab-long-chat .lc-msg.a { align-self:flex-start; background:var(--surface-2); color:var(--text-2); }
.lab-long-chat .lc-mix { display:flex; height:14px; border-radius:999px; overflow:hidden; background:var(--surface-3); }
.lab-long-chat .lc-mix > span { height:100%; transition: width .3s; }
.lab-long-chat .lc-legend { display:flex; gap:12px; flex-wrap:wrap; font-size:.8rem; color:var(--muted); }
.lab-long-chat .lc-legend i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:4px; vertical-align:-1px; }
.lab-long-chat svg text { fill: var(--muted); font-size: 9px; font-family: var(--font-sans); }
.lab-long-chat .lm-doc { display:flex; flex-direction:column; gap:3px; padding:10px; }
.lab-long-chat .lm-line { height:5px; border-radius:3px; background:var(--surface-3); }
.lab-long-chat .lm-line.key { height:9px; background:var(--accent-2); }
`;

const recall = (x) => 0.55 + 0.25 * (1 - x) ** 4 + 0.32 * x ** 4; // illustrative U-curve

export function mount(el, ctx) {
  injectStyle('lab-long-chat', CSS);
  let chat = ctx.store.get('chat', []);
  let report = null;
  let pos = ctx.store.get('pos', 50);

  const logEl = h('div', { class: 'lc-log', 'aria-label': 'Simulated chat' });
  const statsEl = h('div', { 'aria-live': 'polite' });
  const chartEl = h('div');
  const reportEl = h('div', { 'aria-live': 'polite' });
  const btnRow = h('div', { class: 'row' });

  const used = (topic) => chat.filter((t) => t.topic === topic).length;

  function metrics(turns) {
    let history = 0, cumulative = 0;
    const perTurn = [];
    for (const t of turns) {
      const input = SYSTEM_TOKENS + history + t.ut;
      perTurn.push({ input, topic: t.topic });
      cumulative += input;
      history += t.ut + t.at;
    }
    return { perTurn, cumulative, history };
  }

  function separateCost() {
    return Object.keys(TOPICS).reduce((sum, k) => sum + metrics(chat.filter((t) => t.topic === k)).cumulative, 0);
  }

  function addTurn(topic) {
    if (chat.length >= MAX_TURNS) return;
    const pool = TOPICS[topic].turns;
    const i = used(topic);
    const base = pool[i % pool.length];
    chat.push({ topic, ...base, u: i >= pool.length ? base.u + ' (again)' : base.u });
    report = null;
    ctx.store.set('chat', chat);
    update();
    logEl.scrollTop = logEl.scrollHeight;
  }

  function newChat() {
    if (!chat.length) return;
    const actual = metrics(chat).cumulative;
    const sep = separateCost();
    const topicsUsed = new Set(chat.map((t) => t.topic)).size;
    report = { actual, sep, topicsUsed, turns: chat.length };
    chat = [];
    ctx.store.set('chat', chat);
    update();
  }

  function drawChart(perTurn) {
    const W = 320, H = 130, pad = 22;
    const maxV = Math.max(4000, ...perTurn.map((p) => p.input));
    const bw = (W - pad - 6) / MAX_TURNS;
    const bars = perTurn.map((p, i) => {
      const bh = ((H - pad - 8) * p.input) / maxV;
      return `<rect x="${pad + i * bw + 2}" y="${H - pad - bh}" width="${bw - 4}" height="${bh}" rx="2" style="fill:${TOPICS[p.topic].color}"><title>Turn ${i + 1}: ${p.input} input tokens</title></rect>`;
    }).join('');
    const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Input tokens sent per turn">
      <line x1="${pad}" y1="${H - pad}" x2="${W}" y2="${H - pad}" style="stroke:var(--border-strong)"/>
      <text x="${pad}" y="10">${fmt(maxV)} tokens</text>
      <text x="${pad}" y="${H - 6}">turn 1</text><text x="${W - 40}" y="${H - 6}">turn ${MAX_TURNS}</text>
      ${bars}</svg>`;
    chartEl.innerHTML = svg;
  }

  function update() {
    const m = metrics(chat);
    render(logEl, chat.length ? chat.flatMap((t) => [
      h('div', { class: 'lc-msg u' }, h('span', { class: 'small' }, TOPICS[t.topic].icon + ' '), t.u),
      h('div', { class: 'lc-msg a' }, t.a),
    ]) : h('p', { class: 'hint', style: 'margin:auto;text-align:center' }, 'Empty chat. Ask something below.'));

    const last = chat[chat.length - 1];
    const prior = chat.slice(0, -1);
    const priorTokens = prior.reduce((s, t) => s + t.ut + t.at, 0);
    const onTopic = prior.filter((t) => last && t.topic === last.topic).reduce((s, t) => s + t.ut + t.at, 0);
    const focus = !last ? 100 : priorTokens === 0 ? 100 : Math.round((onTopic / priorTokens) * 100);
    const lastInput = m.perTurn.length ? m.perTurn[m.perTurn.length - 1].input : 0;

    const mixTotal = m.history || 1;
    const mix = Object.entries(TOPICS).map(([k, t]) => {
      const tok = chat.filter((c) => c.topic === k).reduce((s, c) => s + c.ut + c.at, 0);
      return { k, t, share: tok / mixTotal };
    });

    render(statsEl,
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'This turn sends'), h('span', { class: 'v' }, fmt(lastInput)), h('span', { class: 's' }, 'input tokens')),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Total processed'), h('span', { class: 'v' }, fmt(m.cumulative)), h('span', { class: 's' }, `over ${chat.length} turn${chat.length === 1 ? '' : 's'}`)),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Focus'), h('span', { class: 'v', style: { color: focus >= 70 ? 'var(--ok)' : focus >= 40 ? 'var(--warn)' : 'var(--bad)' } }, focus + '%'), h('span', { class: 's' }, 'of history is on the current topic'))),
      h('div', { style: 'margin-top:12px' },
        h('div', { class: 'label', style: 'margin-bottom:5px' }, 'Topic mix in this chat’s context'),
        h('div', { class: 'lc-mix' }, mix.map(({ t, share }) => h('span', { style: { width: share * 100 + '%', background: t.color }, title: `${t.label}: ${Math.round(share * 100)}%` }))),
        h('div', { class: 'lc-legend', style: 'margin-top:6px' }, mix.map(({ t, share }) => h('span', null, h('i', { style: { background: t.color } }), `${t.label} ${Math.round(share * 100)}%`)))));

    drawChart(m.perTurn);

    render(btnRow,
      Object.entries(TOPICS).map(([k, t]) => {
        const b = h('button', { type: 'button', class: 'btn small', disabled: chat.length >= MAX_TURNS ? true : null }, `+ ${t.icon} ${t.label}`);
        b.addEventListener('click', () => addTurn(k));
        return b;
      }),
      (() => { const b = h('button', { type: 'button', class: 'btn small primary', disabled: chat.length ? null : true }, '↻ Start a new chat'); b.addEventListener('click', newChat); return b; })());

    if (report) {
      const saved = report.actual - report.sep;
      const pct = report.actual ? Math.round((saved / report.actual) * 100) : 0;
      render(reportEl, report.topicsUsed > 1
        ? callout('ok', `Chat closed. Splitting it by topic would have saved ${fmt(saved)} tokens (${pct}%).`,
          `That ${report.turns}-turn chat processed ${fmt(report.actual)} input tokens. With one chat per topic, the same questions would have cost ${fmt(report.sep)}, and each answer would have been read against only relevant history.`)
        : callout('info', 'Chat closed.', `All ${report.turns} turns were on one topic, so splitting saves nothing. Even so, very long single-topic chats can drift (“context rot”), and a fresh start is sometimes worth it.`));
    } else if (chat.length >= MAX_TURNS) {
      render(reportEl, callout('warn', 'This chat is getting long.', 'Start a new chat to see what it cost you.'));
    } else render(reportEl);
  }

  // ---- Part B: lost in the middle ----
  const curveEl = h('div');
  const docEl = h('div', { class: 'panel tint lm-doc', 'aria-hidden': 'true' });
  const lmNote = h('div', { 'aria-live': 'polite' });
  function drawCurve() {
    const W = 320, H = 150, pl = 30, pb = 24, pt = 10;
    const x = (v) => pl + v * (W - pl - 8);
    const y = (v) => pt + (1 - (v - 0.4) / 0.55) * (H - pt - pb);
    let d = '';
    for (let i = 0; i <= 50; i++) { const v = i / 50; d += (i ? 'L' : 'M') + x(v).toFixed(1) + ',' + y(recall(v)).toFixed(1); }
    const v = pos / 100, r = recall(v);
    curveEl.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Illustrative U-shaped recall curve">
      <line x1="${pl}" y1="${H - pb}" x2="${W - 8}" y2="${H - pb}" style="stroke:var(--border-strong)"/>
      <line x1="${pl}" y1="${pt}" x2="${pl}" y2="${H - pb}" style="stroke:var(--border-strong)"/>
      <text x="${pl}" y="${H - 8}">start of prompt</text><text x="${W - 68}" y="${H - 8}">end of prompt</text>
      <text x="2" y="${y(0.9) + 3}">high</text><text x="4" y="${y(0.5) + 3}">low</text>
      <path d="${d}" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>
      <line x1="${x(v)}" y1="${y(r)}" x2="${x(v)}" y2="${H - pb}" style="stroke:var(--accent-2);stroke-dasharray:3 3"/>
      <circle cx="${x(v)}" cy="${y(r)}" r="6" style="fill:var(--accent-2);stroke:var(--surface);stroke-width:2"/>
    </svg>`;
    const keyLine = Math.round(v * 19);
    render(docEl, [...Array(20)].map((_, i) => h('div', { class: 'lm-line' + (i === keyLine ? ' key' : ''), style: { width: (70 + ((i * 37) % 30)) + '%' } })));
    const zone = v < 0.2 ? 'near the start' : v > 0.8 ? 'near the end' : 'in the middle';
    render(lmNote, callout(v >= 0.2 && v <= 0.8 ? 'warn' : 'ok',
      `Key fact placed ${zone} → relative recall ≈ ${Math.round(r * 100)}% (illustrative)`,
      v >= 0.2 && v <= 0.8 ? 'Facts buried in the middle of a long prompt are the ones most likely to be overlooked.' : 'Models tend to use the beginning (primacy) and end (recency) of their context most reliably.'));
  }

  render(el,
    h('div', { class: 'stack-lg' },
      h('section', { class: 'stack' },
        h('h4', { style: 'margin:0' }, 'Part A · New topic, new chat'),
        h('p', { style: 'margin:0' }, 'A chatbot has no memory between turns. Each time you hit send, the app re-sends the whole conversation so far. Mix topics in one thread and watch what that costs.'),
        h('div', { class: 'lab-grid' },
          h('div', { class: 'panel flat', style: 'padding:10px' }, logEl),
          h('div', { class: 'stack' }, statsEl, h('div', { class: 'panel flat', style: 'padding:10px' }, h('div', { class: 'label' }, 'Input tokens sent on each turn'), chartEl))),
        btnRow, reportEl),
      h('section', { class: 'stack' },
        h('h4', { style: 'margin:0' }, 'Part B · Lost in the middle'),
        h('p', { style: 'margin:0' }, 'Even when everything fits, position matters. Drag the slider to move one crucial fact through a long prompt.'),
        slider({ label: 'Where the key fact sits', min: 0, max: 100, step: 1, value: pos, format: (v) => v + '%',
          onInput: (v) => { pos = v; ctx.store.set('pos', v); drawCurve(); } }),
        h('div', { class: 'lab-grid' }, h('div', { class: 'panel flat', style: 'padding:10px' }, curveEl), docEl),
        lmNote,
        h('p', { class: 'hint', style: 'margin:0' }, 'The curve is illustrative. Its U shape follows Liu et al., “Lost in the Middle: How Language Models Use Long Contexts” (TACL, 2023). Exact numbers vary by model, task, and context length.')),
      callout('think', 'What this shows',
        'Every turn re-sends the full chat history, so off-topic turns cost tokens — and energy — on every turn that follows. They also dilute the model’s focus. Start a new chat for a new topic. In long prompts, put the most important instructions and facts at the start or the end, not buried in the middle.')));

  update();
  drawCurve();
}
