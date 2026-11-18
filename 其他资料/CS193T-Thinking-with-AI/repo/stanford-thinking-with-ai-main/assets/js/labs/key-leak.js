// Lab: Find the API key leak (Module 7 — API keys)
import { h, render, injectStyle, chips, slider, callout, fmt } from './_kit.js';

const FAKE_KEY = 'sk-DEMO-not-a-real-key-0000';
const CODE = [
  '<!doctype html>',
  '<html lang="en">',
  '<head>',
  '  <meta charset="utf-8">',
  '  <title>Haiku Helper</title>',
  '</head>',
  '<body>',
  '  <h1>Haiku Helper 🌸</h1>',
  '  <input id="topic" placeholder="Give me a topic…">',
  '  <button id="go">Write a haiku</button>',
  '  <p id="out"></p>',
  '',
  '  <script>',
  '    // TODO: move this somewhere safer before launch',
  `    const AI_KEY = "${FAKE_KEY}";`,
  '    const ENDPOINT = "https://api.example-ai.test/v1/generate";',
  '',
  '    document.getElementById("go").onclick = async () => {',
  '      const topic = document.getElementById("topic").value;',
  '      const prompt = "Write one haiku about: " + topic;',
  '',
  '      const res = await fetch(ENDPOINT, {',
  '        method: "POST",',
  '        headers: {',
  '          "content-type": "application/json",',
  '          "authorization": "Bearer " + AI_KEY',
  '        },',
  '        body: JSON.stringify({ model: "small-fast", prompt })',
  '      });',
  '      const data = await res.json();',
  '      document.getElementById("out").textContent = data.text;',
  '    };',
  '  </script>',
  '</body>',
  '</html>',
];
const LEAKS = { 15: 'The key itself is written into the page. Anyone who chooses "View page source" can copy it and bill requests to your account.', 26: 'The browser sends the key with every request, so it also shows up in the Network tab of the browser\'s developer tools — even if you hid line 15 in another file.' };
const NOTES = {
  14: 'A good instinct written as a comment — but comments ship to the browser too, and "before launch" has a way of never arriving.',
  16: 'The endpoint address isn\'t a secret. Knowing where to send requests is useless without a key.',
  20: 'Visible, but not a secret. (It is worth thinking about what users might type into a prompt, though — that\'s prompt injection, a different problem.)',
  28: 'The model name isn\'t sensitive.',
  13: 'Script tags are fine. The problem is what\'s inside this one.',
};

const SERVER = `// api/haiku.js — runs on YOUR server or a serverless function, never in the browser
export default async function handler(req, res) {
  const { topic } = req.body || {};
  if (!topic || topic.length > 100) {
    return res.status(400).json({ error: "Topic required (100 characters max)" });
  }
  const r = await fetch("https://api.example-ai.test/v1/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // The key lives in an environment variable set in your host's secret settings
      "authorization": "Bearer " + process.env.AI_KEY
    },
    body: JSON.stringify({ model: "small-fast", prompt: "Write one haiku about: " + topic })
  });
  const data = await r.json();
  res.json({ text: data.text });
}`;
const BROWSER = `// In the page: no key anywhere — just ask your own server
const res = await fetch("/api/haiku", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ topic })
});`;

const CHECKLIST = [
  ['Keep keys out of front-end code', 'Anything shipped to a browser — HTML, JavaScript, even "hidden" files — is public.'],
  ['Never commit keys to Git', 'Put them in a .env file and add .env to .gitignore. Bots scan public repositories for keys within minutes.'],
  ['Store keys in environment variables or a secret manager', 'Your hosting service has a settings page for this.'],
  ['Set a spending limit and usage alerts', 'Caps the damage if a key escapes.'],
  ['Restrict each key', 'One key per project; limit which models, IPs, or sites it works from where the provider allows.'],
  ['Rate-limit your own endpoint', 'Otherwise anyone can still run up your bill through your server.'],
  ['If a key leaks, revoke and replace it immediately', 'Deleting the commit isn\'t enough — copies and Git history live on.'],
  ['Have a fresh reviewer scan for secrets', 'Ask a "goldfish" reviewer (a fresh AI chat or a teammate) to check vibe-coded work for exposed keys before you publish.'],
];

export function mount(el, ctx) {
  injectStyle('lab-key-leak', `
    .lab-key-leak .kl-code { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 0; font-family: var(--font-mono); font-size: .8rem; overflow-x: auto; }
    .lab-key-leak .kl-line { display: grid; grid-template-columns: 3.2em 1fr; width: 100%; text-align: left; border: 0; background: none; color: var(--text); font: inherit; padding: 1px 10px 1px 0; cursor: pointer; white-space: pre; }
    .lab-key-leak .kl-line:hover { background: var(--accent-soft); }
    .lab-key-leak .kl-line .n { color: var(--muted); text-align: right; padding-right: 12px; user-select: none; }
    .lab-key-leak .kl-line[aria-pressed="true"] { background: var(--warn-soft); box-shadow: inset 3px 0 0 var(--warn); }
    .lab-key-leak .kl-line.hit { background: var(--ok-soft); box-shadow: inset 3px 0 0 var(--ok); }
    .lab-key-leak .kl-line.miss { background: var(--bad-soft); box-shadow: inset 3px 0 0 var(--bad); }
    .lab-key-leak .kl-line.fa { background: var(--surface-3); box-shadow: inset 3px 0 0 var(--border-strong); }
    .lab-key-leak .grid-2 > div { min-width: 0; }
    .lab-key-leak pre { max-width: 100%; }
    .lab-key-leak .kl-arch { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .lab-key-leak .kl-box { flex: 1 1 160px; border: 2px solid var(--border-strong); border-radius: var(--radius-sm); padding: 10px 12px; background: var(--surface); font-size: .88rem; }
    .lab-key-leak .kl-box.key { border-color: var(--ok); background: var(--ok-soft); }
    .lab-key-leak .kl-arrow { color: var(--muted); font-size: 1.2rem; }
    @media (max-width: 640px) { .lab-key-leak .kl-arrow { width: 100%; text-align: center; transform: rotate(90deg); } }
  `);
  const st = ctx.store.get('state', { picked: [], checked: false, list: [], tab: 0, billing: 'owner', users: 200, reqs: 10 });
  const save = () => ctx.store.set('state', st);
  const pane = h('div', { role: 'tabpanel' });
  const tabNames = ['1 · Find the leak', '2 · Fix it', '3 · Who pays?'];
  const tabBtns = tabNames.map((n, i) => h('button', { type: 'button', role: 'tab', class: 'chip', onclick: () => select(i) }, n));
  function select(i) {
    st.tab = i; save();
    tabBtns.forEach((b, j) => { b.setAttribute('aria-pressed', String(i === j)); b.setAttribute('aria-selected', String(i === j)); });
    render(pane, [findPane, fixPane, payPane][i]());
  }

  function findPane() {
    const feedback = h('div', { 'aria-live': 'polite' });
    const lines = CODE.map((text, i) => {
      const n = i + 1;
      const b = h('button', { type: 'button', class: 'kl-line', 'aria-pressed': String(st.picked.includes(n)), 'aria-label': `Line ${n}: ${text.trim() || '(blank)'}` },
        h('span', { class: 'n' }, String(n)), h('span', null, text || ' '));
      b.addEventListener('click', () => {
        st.picked = st.picked.includes(n) ? st.picked.filter((x) => x !== n) : [...st.picked, n];
        st.checked = false; save();
        b.setAttribute('aria-pressed', String(st.picked.includes(n)));
        lineEls.forEach((x) => x.classList.remove('hit', 'miss', 'fa'));
        render(feedback);
      });
      return b;
    });
    const lineEls = lines;
    const check = () => {
      st.checked = true; save();
      const leakLines = Object.keys(LEAKS).map(Number);
      const hits = leakLines.filter((n) => st.picked.includes(n));
      const misses = leakLines.filter((n) => !st.picked.includes(n));
      const fas = st.picked.filter((n) => !LEAKS[n]);
      lineEls.forEach((b, i) => {
        const n = i + 1;
        b.classList.toggle('hit', hits.includes(n));
        b.classList.toggle('miss', misses.includes(n));
        b.classList.toggle('fa', fas.includes(n));
      });
      render(feedback, h('div', { class: 'stack' },
        callout(misses.length === 0 && fas.length === 0 ? 'ok' : misses.length === 0 ? 'info' : 'warn',
          `Found ${hits.length} of ${leakLines.length} leaking lines${fas.length ? ` · ${fas.length} not a leak` : ''}`,
          misses.length ? 'Missed lines are outlined in red. Look for everywhere the key appears or travels.' : 'Both leaks found.'),
        h('ul', { class: 'small' },
          leakLines.map((n) => h('li', null, h('span', { class: 'tag ' + (hits.includes(n) ? 'ok' : 'bad') }, `Line ${n}`), ' ', LEAKS[n])),
          fas.map((n) => h('li', null, h('span', { class: 'tag' }, `Line ${n}`), ' ', NOTES[n] || 'Nothing secret here.'))),
        h('button', { type: 'button', class: 'btn small primary', onclick: () => select(1) }, 'Next: fix it →')));
    };
    if (st.checked) setTimeout(check, 0);
    return h('div', { class: 'stack' },
      h('p', null, 'Someone vibe-coded "Haiku Helper," a page that turns any topic into a haiku using an AI API, and published it. This is what any visitor sees with ', h('em', null, 'right-click → View page source'), '. Click every line where the API key is exposed.'),
      h('div', { class: 'kl-code', role: 'group', 'aria-label': 'Page source code — click lines to flag them' }, lines),
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary', onclick: check }, 'Check my flags'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => { st.picked = []; st.checked = false; save(); select(0); } }, 'Clear')),
      feedback);
  }

  function fixPane() {
    const done = h('span', { class: 'tag accent', 'aria-live': 'polite' });
    const sync = () => { done.textContent = `${st.list.length}/${CHECKLIST.length} in your habits`; };
    sync();
    return h('div', { class: 'stack' },
      h('p', null, 'The fix is architectural: the browser should never hold the key. Put a tiny server (or serverless function) in the middle that keeps the key in an environment variable and forwards only what\'s needed.'),
      h('div', { class: 'kl-arch', role: 'img', 'aria-label': 'Browser sends topic to your server, which adds the key and calls the AI API' },
        h('div', { class: 'kl-box' }, h('strong', null, 'Browser'), h('div', { class: 'hint' }, 'Sends only the topic. No key.')),
        h('span', { class: 'kl-arrow', 'aria-hidden': 'true' }, '→'),
        h('div', { class: 'kl-box key' }, h('strong', null, 'Your server function 🔑'), h('div', { class: 'hint' }, 'Reads the key from an environment variable, checks input, rate-limits.')),
        h('span', { class: 'kl-arrow', 'aria-hidden': 'true' }, '→'),
        h('div', { class: 'kl-box' }, h('strong', null, 'AI API'), h('div', { class: 'hint' }, 'Bills the key\'s owner.'))),
      callout('info', 'Hosting note', 'Static hosts such as GitHub Pages can\'t keep secrets — every file they serve is public. The server piece has to run somewhere that supports environment variables (a serverless platform or your own backend).'),
      h('div', { class: 'grid-2' },
        h('div', null, h('div', { class: 'label' }, 'Browser (fixed)'), h('pre', null, h('code', null, BROWSER))),
        h('div', null, h('div', { class: 'label' }, 'Server function'), h('pre', null, h('code', null, SERVER)))),
      h('div', { class: 'panel tint stack' },
        h('div', { class: 'row between' }, h('h4', { style: { margin: 0 } }, 'Key-safety checklist'), done),
        CHECKLIST.map(([t, d], i) => {
          const cb = h('input', { type: 'checkbox', id: 'kl-c' + i });
          cb.checked = st.list.includes(i);
          cb.addEventListener('change', () => { st.list = cb.checked ? [...new Set([...st.list, i])] : st.list.filter((x) => x !== i); save(); sync(); });
          return h('label', { class: 'check', for: 'kl-c' + i }, cb, h('span', null, h('strong', null, t), ' — ', h('span', { class: 'muted' }, d)));
        })));
  }

  function payPane() {
    const out = h('div', { 'aria-live': 'polite' });
    const COST = 0.002; // illustrative $ per haiku request
    const draw = () => {
      const monthly = st.users * st.reqs * 30 * COST;
      const per = st.reqs * 30 * COST;
      render(out, st.billing === 'owner'
        ? h('div', { class: 'stack' },
          h('div', { class: 'stats' },
            h('div', { class: 'stat' }, h('span', { class: 'k' }, 'You pay / month'), h('span', { class: 'v' }, '$' + fmt(monthly, 2))),
            h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Each user pays'), h('span', { class: 'v' }, '$0'))),
          callout('info', 'Owner\'s key', 'Easiest for users — nothing to set up. But every request lands on your bill, so a leaked key or a viral week can get expensive. Spend limits, rate limits, and the server-side pattern above are non-negotiable.'))
        : h('div', { class: 'stack' },
          h('div', { class: 'stats' },
            h('div', { class: 'stat' }, h('span', { class: 'k' }, 'You pay / month'), h('span', { class: 'v' }, '$0')),
            h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Each user pays'), h('span', { class: 'v' }, '$' + fmt(per, 2)))),
          callout('info', 'Bring your own key', 'You build and maintain the tool; each user pastes their own key and pays for their own use. Fairer at scale, but users must trust your tool with their key — and should never paste a key into a site they don\'t trust.')));
    };
    draw();
    return h('div', { class: 'stack' },
      h('p', null, 'An API key is how a program proves "bill this to me." When you share a tool built on an AI API, someone\'s key pays for every request.'),
      chips([{ value: 'owner', label: 'Tool owner\'s key' }, { value: 'byok', label: 'Each user brings their own key' }], st.billing, (v) => { st.billing = v; save(); draw(); }),
      h('div', { class: 'grid-2' },
        slider({ label: 'Users', min: 10, max: 5000, step: 10, value: st.users, format: (v) => fmt(v), onInput: (v) => { st.users = v; save(); draw(); } }),
        slider({ label: 'Requests per user per day', min: 1, max: 100, step: 1, value: st.reqs, format: (v) => String(v), onInput: (v) => { st.reqs = v; save(); draw(); } })),
      h('p', { class: 'hint' }, `Illustrative: $${COST} per request.`),
      out);
  }

  render(el, h('div', { class: 'stack-lg' },
    h('div', { class: 'row', role: 'tablist' }, tabBtns),
    pane,
    callout('think', 'What this shows', h('p', null, 'An API key works like a password with your credit card attached. Code that runs in a browser is public by design, so a key placed there is a key given away. When you review vibe-coded work — or ask a fresh "goldfish" reviewer to — checking for exposed secrets belongs on the list.'))));
  select(Math.min(2, Math.max(0, Number(st.tab) || 0)));
}
