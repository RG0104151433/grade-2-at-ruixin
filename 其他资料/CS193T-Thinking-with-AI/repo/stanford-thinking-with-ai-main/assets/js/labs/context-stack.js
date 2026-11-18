// Lab: What's in the context window? Layers, overflow, and retrieval (RAG).
import { h, render, injectStyle, chips, callout, fmt, estTokens } from './_kit.js';

const LAYERS = [
  { id: 'system', label: 'System prompt', who: 'AI company', tokens: 3000, color: 'var(--violet)', note: 'Hidden instructions the vendor adds to every chat.' },
  { id: 'settings', label: 'Custom instructions & settings', who: 'You', tokens: 300, color: 'var(--teal)', note: 'For example: “Fewer bullet points, no flattery.”' },
  { id: 'memory', label: 'Saved memory about you', who: 'AI tool (from past chats)', tokens: 1200, color: 'var(--accent-2)', note: 'Facts the tool has collected about you in earlier chats.' },
  { id: 'tools', label: 'Connector & tool instructions', who: 'Vendor + connectors you enabled', tokens: 6000, color: 'var(--warn)', note: 'Descriptions of every tool the model is allowed to call.' },
  { id: 'history', label: 'Chat history so far', who: 'You + the AI', tokens: 18000, color: 'var(--accent)', note: 'Every earlier prompt and reply in this chat.' },
  { id: 'files', label: 'Uploaded files', who: 'You', tokens: 0, color: 'var(--ok)', note: 'Choose a size below.' },
  { id: 'web', label: 'Web search results', who: 'AI tool (retrieved)', tokens: 9000, color: 'var(--bad)', note: 'Pages the tool fetched — written by strangers.' },
  { id: 'prompt', label: 'Your current prompt', who: 'You', tokens: 150, color: 'var(--text-2)', note: 'The only part you typed just now.', locked: true },
];
const FILES = [
  { value: '0', label: 'None', tokens: 0 },
  { value: '1', label: '2-page memo', tokens: 1200 },
  { value: '2', label: '30-page report', tokens: 22000 },
  { value: '3', label: 'Whole textbook', tokens: 250000 },
  { value: '4', label: '4 years of notes', tokens: 1800000 },
];
const WINDOWS = [{ value: '8000', label: '8K' }, { value: '128000', label: '128K' }, { value: '1000000', label: '1M' }];

const HANDBOOK = [
  ['Membership & fees', 'A yearly membership is $40 for students and $60 for staff, and covers unlimited rides under 45 minutes. A day pass costs $5 in the app.'],
  ['Checking out a bike', 'Scan the QR code on the handlebar with the PedalShare app. The dock light turns green when the bike unlocks. One bike per member at a time.'],
  ['Ride limits & late returns', 'Rides over 45 minutes cost $2 for each extra 15 minutes. A bike not returned within 24 hours is reported missing, and a $250 replacement fee may apply.'],
  ['Where you can ride', 'Ride anywhere on campus and in the nearby city, up to the service boundary on the app map. Riding beyond the boundary adds a $10 out-of-zone fee.'],
  ['Helmets & safety', 'Helmets are strongly encouraged. Free loaner helmets are at the main library dock. State law requires riders under 18 to wear one. Use lights after dark.'],
  ['Flat tires & damage', 'To report a flat tire or other damage, tap “Report a problem” in the app and enter the bike number. Don’t repair bikes yourself. Normal wear is never charged.'],
  ['Docking & returns', 'Return to any dock with an open slot. Push until the light blinks green twice. If a dock is full, the app gives you 15 free minutes to reach another one.'],
  ['Accessibility', 'Adaptive tricycles and hand-cycles can be reserved up to a week ahead at the recreation-center dock, at no extra cost.'],
  ['Weather closures', 'Service pauses during snow or ice warnings. You won’t be charged late fees for a ride that was in progress when a closure began.'],
  ['Accounts & lost items', 'Items left in baskets go to campus lost-and-found. To download your ride history or delete your account, email privacy@pedalshare.test.'],
].map(([title, text], i) => ({ id: i + 1, title, text, tokens: estTokens(title + ' ' + text) }));

const QUESTIONS = ['What happens if I return a bike late?', 'Can I ride the bike off campus?', 'How do I report a flat tire?', 'Do I need to wear a helmet?'];

const STOP = new Set('a an the i me my we you your is are am do does did can could should would to of in on at for and or if it be with how what when where which who why this that there their they get got any'.split(' '));
const SYN = { off: ['beyond', 'boundary', 'zone'], outside: ['beyond', 'boundary', 'zone'], late: ['extra', 'returned', 'late'], cost: ['fee', 'cost', 'charged'], price: ['fee', 'cost'],
  broken: ['damage', 'repair', 'report'], fix: ['repair', 'report'], flat: ['flat', 'tire', 'damage'], wear: ['helmet', 'wear'], rain: ['weather'], snow: ['weather', 'snow'], wheelchair: ['adaptive', 'accessibility'] };

const stem = (w) => w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w;
const terms = (s) => (s.toLowerCase().match(/[a-z]+/g) || []).filter((w) => !STOP.has(w));

function score(query, chunk) {
  const q = new Set();
  for (const w of terms(query)) { q.add(stem(w)); (SYN[w] || []).forEach((s) => q.add(stem(s))); }
  const body = new Set(terms(chunk.text).map(stem));
  const title = new Set(terms(chunk.title).map(stem));
  let s = 0;
  for (const w of q) { if (body.has(w)) s += 1; if (title.has(w)) s += 0.5; }
  return s;
}

const CSS = `
.lab-context-stack .cs-layer { display:grid; grid-template-columns: auto 1fr auto; gap:10px; align-items:center; padding:7px 4px; border-bottom:1px solid var(--border); }
.lab-context-stack .cs-layer:last-child { border-bottom:0; }
.lab-context-stack .cs-sw { width:12px; height:12px; border-radius:3px; display:inline-block; }
.lab-context-stack .cs-bar { position:relative; display:flex; height:30px; border-radius:8px; overflow:hidden; background:var(--surface-3); }
.lab-context-stack .cs-bar > span { height:100%; min-width:0; transition: width .35s; }
.lab-context-stack .cs-limit { position:absolute; top:-4px; bottom:-4px; width:3px; background:var(--text); border-radius:2px; }
.lab-context-stack .cs-wrap { position:relative; padding-top:4px; }
.lab-context-stack .cs-chunk { padding:9px 11px; border:1px solid var(--border); border-radius:8px; font-size:.86rem; }
.lab-context-stack .cs-chunk.hit { border-color:var(--ok); background:var(--ok-soft); }
.lab-context-stack .cs-chunk.miss { opacity:.55; }
`;

export function mount(el, ctx) {
  injectStyle('lab-context-stack', CSS);
  const on = new Set(ctx.store.get('on', ['system', 'settings', 'memory', 'history', 'prompt']));
  on.add('prompt');
  let fileSize = ctx.store.get('file', '2');
  let win = ctx.store.get('win', '128000');
  let query = ctx.store.get('q', QUESTIONS[0]);

  const listEl = h('div', { class: 'panel flat', style: 'padding:6px 12px' });
  const barEl = h('div', { 'aria-live': 'polite' });
  const ragAnchor = h('div');
  const ragEl = h('div', { 'aria-live': 'polite' });

  const tokensOf = (l) => (l.id === 'files' ? FILES.find((f) => f.value === fileSize).tokens : l.tokens);

  function drawList() {
    render(listEl, LAYERS.map((l) => {
      const id = 'cs-' + l.id + '-' + Math.random().toString(36).slice(2, 7);
      const box = h('input', { type: 'checkbox', id, disabled: l.locked ? true : null });
      box.checked = on.has(l.id);
      box.addEventListener('change', () => { box.checked ? on.add(l.id) : on.delete(l.id); ctx.store.set('on', [...on]); drawBar(); });
      return h('div', { class: 'cs-layer' },
        box,
        h('label', { for: id, style: 'cursor:pointer' },
          h('div', null, h('span', { class: 'cs-sw', style: { background: l.color, marginRight: '6px' } }), h('strong', { style: 'font-size:.92rem' }, l.label)),
          h('div', { class: 'hint' }, h('span', { class: 'tag', style: 'margin-right:6px' }, l.who), l.note)),
        h('span', { class: 'mono small muted' }, fmt(tokensOf(l))));
    }));
  }

  function drawBar() {
    const active = LAYERS.filter((l) => on.has(l.id) && tokensOf(l) > 0);
    const total = active.reduce((s, l) => s + tokensOf(l), 0);
    const W = Number(win);
    const scale = Math.max(W, total);
    const over = total > W;
    const used = total / W;
    render(barEl,
      h('div', { class: 'row between', style: 'margin-bottom:6px' },
        h('span', { class: 'label' }, `Context used: ${fmt(total)} of ${fmt(W)} tokens`),
        h('span', { class: 'tag ' + (over ? 'bad' : used > 0.6 ? 'warn' : 'ok') }, over ? `${fmt(total - W)} over!` : `${Math.round(used * 100)}% full`)),
      h('div', { class: 'cs-wrap' },
        h('div', { class: 'cs-bar', role: 'img', 'aria-label': `Stacked bar: ${active.map((l) => l.label + ' ' + tokensOf(l)).join(', ')}` },
          active.map((l) => h('span', { style: { width: (tokensOf(l) / scale) * 100 + '%', background: l.color }, title: `${l.label}: ${fmt(tokensOf(l))} tokens` }))),
        over ? h('div', { class: 'cs-limit', style: { left: `calc(${(W / scale) * 100}% - 1px)` }, title: 'Window limit' }) : null),
      over ? h('div', { class: 'hint', style: 'margin-top:4px' }, 'The black line marks the window limit. Everything to its right cannot fit.') : null,
      h('div', { style: 'margin-top:12px' }, over
        ? callout('bad', 'Overflow — the model cannot see all of this.',
          h('span', null, 'Tools usually respond by silently truncating or summarizing older material. A better fix for big source collections is ', h('strong', null, 'retrieval-augmented generation (RAG)'), ': keep the documents in a separate searchable store and pull in only the passages relevant to each question. ',
            (() => { const b = h('button', { type: 'button', class: 'btn small', style: 'margin-top:6px' }, 'Try RAG below ↓'); b.addEventListener('click', () => ragAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' })); return b; })()))
        : used > 0.6
          ? callout('warn', 'It fits, but it’s crowded.', 'Long, crowded contexts invite “lost in the middle” and context rot. Is every layer earning its place?')
          : callout('ok', 'Plenty of room.', 'Notice how much of the window is filled by things you didn’t type in this turn.')));
  }

  function drawRag() {
    const scored = HANDBOOK.map((c) => ({ ...c, s: score(query, c) })).sort((a, b) => b.s - a.s || a.id - b.id);
    const top = scored.filter((c) => c.s > 0).slice(0, 3);
    const topIds = new Set(top.map((c) => c.id));
    const all = HANDBOOK.reduce((s, c) => s + c.tokens, 0);
    const got = top.reduce((s, c) => s + c.tokens, 0);
    render(ragEl,
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Retrieved'), h('span', { class: 'v' }, `${top.length} of ${HANDBOOK.length}`), h('span', { class: 's' }, 'chunks enter the context')),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Tokens added'), h('span', { class: 'v' }, fmt(got)), h('span', { class: 's' }, `instead of ${fmt(all)} for the whole handbook`)),
        h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Saved'), h('span', { class: 'v' }, all ? Math.round((1 - got / all) * 100) + '%' : '—'), h('span', { class: 's' }, 'and it scales: 50,000 pages would still add ~3 chunks'))),
      top.length === 0 ? callout('warn', 'Nothing matched.', 'Retrieval found no relevant passages. A good system says it doesn’t know instead of guessing from training data.') : null,
      h('div', { class: 'grid-2', style: 'margin-top:12px' }, scored.map((c) =>
        h('div', { class: 'cs-chunk ' + (topIds.has(c.id) ? 'hit' : 'miss') },
          h('div', { class: 'row between' }, h('strong', null, `[${c.id}] ${c.title}`), h('span', { class: 'tag ' + (topIds.has(c.id) ? 'ok' : '') }, topIds.has(c.id) ? 'retrieved' : `score ${c.s}`)),
          h('div', { class: 'muted', style: 'margin-top:4px' }, c.text)))));
  }

  const qInput = h('input', { type: 'text', value: query, 'aria-label': 'Your question to the handbook', placeholder: 'Ask the bike-share handbook…' });
  qInput.addEventListener('input', () => { query = qInput.value; ctx.store.set('q', query); drawRag(); });
  const qChips = h('div', { class: 'row' }, QUESTIONS.map((q) => {
    const b = h('button', { type: 'button', class: 'chip' }, q);
    b.addEventListener('click', () => { query = q; qInput.value = q; ctx.store.set('q', q); drawRag(); });
    return b;
  }));

  render(el,
    h('div', { class: 'stack-lg' },
      h('section', { class: 'stack' },
        h('h4', { style: 'margin:0' }, 'Part A · Build a context window'),
        h('p', { style: 'margin:0' }, 'Your prompt is only one slice of what the model reads. Switch layers on and off, pick a file size and a window size, and see how fast the space fills.'),
        h('div', { class: 'lab-grid' },
          listEl,
          h('div', { class: 'stack' },
            h('div', null, h('div', { class: 'label', style: 'margin-bottom:6px' }, 'Uploaded file size'),
              chips(FILES.map(({ value, label }) => ({ value, label })), fileSize, (v) => { fileSize = v; ctx.store.set('file', v); drawList(); drawBar(); })),
            h('div', null, h('div', { class: 'label', style: 'margin-bottom:6px' }, 'Model’s context window'),
              chips(WINDOWS, win, (v) => { win = v; ctx.store.set('win', v); drawBar(); })),
            barEl))),
      ragAnchor,
      h('section', { class: 'stack' },
        h('h4', { style: 'margin:0' }, 'Part B · Retrieval instead of stuffing'),
        h('p', { style: 'margin:0' }, 'Here is a fictional campus bike-share handbook split into 10 chunks. Ask a question; the retriever scores each chunk, and only the top three go into the context.'),
        qChips, qInput,
        h('p', { class: 'hint', style: 'margin:0' }, 'This toy scores keyword overlap. Real RAG systems usually rank by embedding similarity, which matches meaning rather than exact words — but the idea is the same.'),
        ragEl),
      callout('think', 'What this shows',
        'Everything in the window — system prompt, settings, memory, files, web pages, your words — is one long row of tokens, and next-token prediction runs over all of it. Changing context changes the output, but never the model’s weights. When sources are too big to fit, RAG fetches only what is relevant. That makes choosing what goes into the store matter even more.')));

  drawList(); drawBar(); drawRag();
}
