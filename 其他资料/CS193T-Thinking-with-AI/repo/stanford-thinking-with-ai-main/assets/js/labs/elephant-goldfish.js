import { h, render, injectStyle, callout, copyText, debounce } from './_kit.js';

const VAGUE_SAMPLE = `Build a website for the club like we discussed. It should have the usual pages and some photos from last semester. Pull the event info from the GSB doc and keep the text short. Make it look good and use the colors from last time. It needs to be done soon.`;

const BETTER_SAMPLE = `Goal: Build a one-page website for the Campus Hiking Club that helps new students decide whether to join.
Audience: first-year students who have never hiked with us; they will mostly read it on their phones.
Content: (1) a 2-sentence welcome, (2) a list of the 4 trips planned for next quarter with date, distance in miles, and difficulty, (3) a "How to join" section with the sign-up form link https://forms.example.com/hike and the meeting time (Thursdays 7pm, Room 104).
Sources: use only the trip list pasted at the end of this document. Do not invent trips, dates, or contact details.
Style: plain HTML and CSS in a single file; green and white color scheme; readable at 360px wide; no external libraries.
Deadline and constraints: finished by Friday, March 6; total page text under 300 words; no photos of identifiable people.
Done when: the page opens in a browser with no errors, all 4 trips appear with correct details, the sign-up link works, and it passes a mobile layout check.
Rubric: accurate (every fact matches the trip list), welcoming tone, scannable in under 30 seconds, accessible (alt text, sufficient color contrast).
If anything is unclear, stop and list your questions rather than guessing.`;

const COMMON_ACRONYMS = new Set(['AI', 'US', 'USA', 'OK', 'PDF', 'CSV', 'URL', 'FAQ', 'ID', 'HTML', 'CSS', 'JSON', 'PM', 'AM', 'TV', 'UK', 'EU', 'API', 'LLM']);

function checks(doc) {
  const q = [];
  const text = doc.trim();
  const words = text ? text.split(/\s+/).length : 0;
  if (!text) return [{ cat: 'Empty', text: 'There is no document. What is the task?' }];

  if (words < 60) q.push({ cat: 'Detail', text: `This is only ${words} words. Could a team really work for hours from it? What are the steps?` });

  if (!/\b(audience|readers?|users?|visitors?|customers?|stakeholders?|who will (?:read|use))\b/i.test(text))
    q.push({ cat: 'Audience', text: 'Who is this for? Who will read or use the result, and what do they already know?' });

  if (!/\b(rubric|success|criteria|acceptance|quality|excellent|accurate|measure[sd]?|evaluate)\b/i.test(text))
    q.push({ cat: 'Success criteria', text: 'How will we judge whether the result is good? What would make it excellent versus merely acceptable?' });

  if (!/\b(deadline|due|by (?:mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d)\w*|before (?:mon|tue|wed|thu|fri|sat|sun|\d)\w*|finished by)\b/i.test(text))
    q.push({ cat: 'Deadline', text: 'When exactly is this due?' });

  if (!/\b(budget|under \d+|at most|no more than|limit|constraint|must not|do not|don['’]t|only|maximum|minimum)\b/i.test(text))
    q.push({ cat: 'Constraints', text: 'What limits apply — budget, length, tools, things I must not do?' });

  if (!/\b(format|markdown|pdf|slides?|table|bullets?|email|report|csv|spreadsheet|html|single file|one-page|words|json|memo)\b/i.test(text))
    q.push({ cat: 'Output format', text: 'What form should the output take (file type, length, structure)?' });

  if (!/\b(done when|finished when|complete when|definition of done|stop (?:when|and)|deliverables?)\b/i.test(text))
    q.push({ cat: 'Definition of done', text: 'How will I know when I am finished — what is the stopping condition?' });

  const vague = text.match(/\b(a few|some|soon|several|a bit|a lot|many|asap|quickly|nice|look good|better|stuff|things|etc\.?)\b/gi) || [];
  [...new Set(vague.map((v) => v.toLowerCase()))].forEach((v) =>
    q.push({ cat: 'Ambiguous', quote: v, text: `“${v}” could mean many things. Can you make it specific (a number, a date, a concrete standard)?` }));

  const shared = text.match(/\b(as (?:we )?discussed|like (?:we )?discussed|like last time|from last time|the usual|as before|same as before|you know|as mentioned|the thing|that doc|that file)\b/gi) || [];
  [...new Set(shared.map((v) => v.toLowerCase()))].forEach((v) =>
    q.push({ cat: 'Missing shared context', quote: v, text: `I wasn’t part of any earlier conversation. What does “${v}” refer to? Please write it out.` }));

  const acr = text.match(/\b[A-Z]{2,6}s?\b/g) || [];
  [...new Set(acr)].filter((a) => !COMMON_ACRONYMS.has(a.replace(/s$/, ''))).forEach((a) => {
    const defined = new RegExp(`\\(${a}\\)|${a}\\s*\\(|${a}\\s*(?:=|means|stands for)`).test(text);
    if (!defined) q.push({ cat: 'Undefined acronym', quote: a, text: `What does “${a}” stand for? A fresh reader won’t know.` });
  });

  return q;
}

const GOLDFISH_PROMPT = (doc) => `You have no context about this project except the document below. Your job is to decide whether a team of AI agents could complete the task fully autonomously using only this document. Do not do the task. Instead, list every clarifying question you would need answered first. If you have no questions, say "No clarifying questions."

--- DOCUMENT ---
${doc}`;

export function mount(el, ctx) {
  injectStyle('lab-elephant-goldfish', `
    .lab-elephant-goldfish .eg-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
    .lab-elephant-goldfish .eg-steps > div { background: var(--surface-2); border-radius: 8px; padding: 8px 10px; font-size: .82rem; }
    .lab-elephant-goldfish .eg-steps b { display: block; font-size: .78rem; color: var(--accent); }
    @media (max-width: 640px) { .lab-elephant-goldfish .eg-steps { grid-template-columns: 1fr 1fr; } }
    .lab-elephant-goldfish textarea.eg-doc { min-height: 260px; font-size: .9rem; }
    .lab-elephant-goldfish .eg-q { border: 1px solid var(--border); border-left: 4px solid var(--violet); border-radius: 8px; padding: 8px 11px; background: var(--surface); font-size: .9rem; }
    .lab-elephant-goldfish .eg-q + .eg-q { margin-top: 7px; }
    .lab-elephant-goldfish .eg-hist { display: flex; align-items: flex-end; gap: 6px; height: 70px; padding-top: 6px; }
    .lab-elephant-goldfish .eg-hist > div { flex: 1 1 0; max-width: 44px; background: var(--violet); border-radius: 5px 5px 0 0; position: relative; min-height: 3px; }
    .lab-elephant-goldfish .eg-hist > div.zero { background: var(--ok); }
    .lab-elephant-goldfish .eg-hist span { position: absolute; top: -18px; left: 0; right: 0; text-align: center; font-size: .72rem; color: var(--muted); }
    .lab-elephant-goldfish .eg-pane-h { display: flex; align-items: center; gap: 8px; }
    .lab-elephant-goldfish .eg-pane-h .emoji { font-size: 1.6rem; line-height: 1; }
  `);

  let doc = ctx.store.get('doc', VAGUE_SAMPLE);
  let history = ctx.store.get('history', []);

  const ta = h('textarea', { class: 'eg-doc', id: 'eg-doc', 'aria-describedby': 'eg-wc' });
  ta.value = doc;
  const wc = h('div', { class: 'hint', id: 'eg-wc' });
  const out = h('div', { 'aria-live': 'polite' });
  const hist = h('div');

  const save = debounce(() => ctx.store.set('doc', doc), 300);
  const updWc = () => { const n = doc.trim() ? doc.trim().split(/\s+/).length : 0; wc.textContent = `${n} words`; };
  ta.addEventListener('input', () => { doc = ta.value; updWc(); save(); });

  function drawHist() {
    if (!history.length) { render(hist, null); return; }
    const max = Math.max(...history, 1);
    render(hist, h('div', { class: 'stack', style: 'gap:4px' },
      h('div', { class: 'label' }, `Goldfish iterations: ${history.length}`),
      h('div', { class: 'eg-hist', role: 'img', 'aria-label': `Questions per iteration: ${history.join(', ')}` },
        history.map((n) => h('div', { class: n === 0 ? 'zero' : '', style: { height: `${Math.max(4, (n / max) * 100)}%` } }, h('span', null, String(n)))))));
  }

  function ask() {
    const qs = checks(doc);
    history.push(qs.length);
    ctx.store.set('history', history);
    const n = history.length;
    if (!qs.length) {
      render(out, h('div', { class: 'stack' },
        callout('ok', `Goldfish #${n}: “No clarifying questions.”`,
          'Passes the goldfish test — now a human reviews the document before any implementation agents start.'),
        h('p', { class: 'hint' }, 'Remember: this checker only looks for common gaps. A real fresh model (or colleague) may still find questions — try the prompt below on one.')));
    } else {
      render(out, h('div', { class: 'stack' },
        h('div', { class: 'row between' }, h('strong', null, `Goldfish #${n} has ${qs.length} question${qs.length === 1 ? '' : 's'}`),
          h('span', { class: 'tag bad' }, 'Fails — revise the doc')),
        h('div', null, qs.map((x) => h('div', { class: 'eg-q' }, h('span', { class: 'tag violet' }, x.cat), ' ', x.text)))));
    }
    drawHist();
  }

  const loadBtn = (label, text) => h('button', { type: 'button', class: 'btn small', onclick: () => {
    doc = text; ta.value = text; updWc(); ctx.store.set('doc', doc); history = []; ctx.store.set('history', history); render(out, null); drawHist();
  } }, label);

  render(el, h('div', { class: 'stack' },
    h('p', { class: 'muted', style: 'margin:0' },
      'A workflow pattern credited to Google engineer Dave Rensin. The elephant remembers everything; the goldfish remembers nothing — which is exactly why it is a good test reader.'),
    h('div', { class: 'eg-steps' },
      h('div', null, h('b', null, '1 · Elephant'), 'Long “interview me” chat, then write a detailed scope-of-work doc.'),
      h('div', null, h('b', null, '2 · Goldfish'), 'A brand-new chat reads only the doc and lists its questions.'),
      h('div', null, h('b', null, '3 · Revise'), 'Any question means the doc failed. Fix it and use a new goldfish.'),
      h('div', null, h('b', null, '4 · Human review'), 'Zero questions → a person reviews, then agents implement.')),
    h('div', { class: 'lab-grid' },
      h('div', { class: 'panel flat stack' },
        h('div', { class: 'eg-pane-h' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🐘'), h('h4', { style: 'margin:0' }, 'Elephant: the scope-of-work doc')),
        h('label', { class: 'label', for: 'eg-doc' }, 'Write or edit the document the agents will work from'),
        ta, wc,
        h('div', { class: 'row' }, loadBtn('Load vague sample', VAGUE_SAMPLE), loadBtn('Load revised sample', BETTER_SAMPLE),
          h('button', { type: 'button', class: 'btn small ghost', onclick: () => copyText(GOLDFISH_PROMPT(doc), 'Goldfish prompt copied — paste into a fresh chat') }, '⧉ Copy goldfish prompt'))),
      h('div', { class: 'panel tint stack' },
        h('div', { class: 'eg-pane-h' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🐟'), h('h4', { style: 'margin:0' }, 'Goldfish: a context-free reader')),
        h('p', { class: 'hint', style: 'margin:0' }, 'Simulated with simple heuristics that mimic what a model with no context tends to ask: who, why, when, what format, what does “done” mean, and what do your vague words refer to.'),
        h('button', { type: 'button', class: 'btn primary', onclick: ask }, '🐟 Ask a fresh reader'),
        out, hist)),
    callout('think', 'What this shows',
      'Anything that lives only in your head — or only in the long interview chat — is invisible to the agents that do the work. Strategically withholding the chat history forces the document to stand on its own, and keeps agents from chasing side tangents that came up during the interview.')));

  updWc();
  drawHist();
}
