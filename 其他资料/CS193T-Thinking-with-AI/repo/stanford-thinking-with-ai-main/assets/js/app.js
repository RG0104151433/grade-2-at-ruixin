// Thinking with AI — interactive companion. Hash-routed single-page app, no dependencies.
import { h, render, makeStore, toast, copyText, downloadText } from './labs/_kit.js';
import { COURSE, LABS, MODULES, moduleById } from './data/modules.js';
import { ASSIGNMENTS, assignmentById } from './data/assignments.js';
import { GLOSSARY } from './data/glossary.js';
import { BOOK, READINGS, ETHICAL_MOVES, ETHICAL_TOOLS, LOGISTICS, TOOLS_COVERED, PLACEMENT, PROJECT, OFFICIAL_LINKS } from './data/resources.js';

const app = document.getElementById('app');
const store = makeStore('app');
let cleanups = [];

// ------------------------------------------------------------------ progress
const P = {
  get() { return store.get('progress', { read: {}, quiz: {}, labs: {}, checks: {}, journal: {} }); },
  save(p) { store.set('progress', p); },
  update(fn) { const p = P.get(); fn(p); P.save(p); },
};

function moduleProgress(m) {
  const p = P.get();
  const parts = [];
  parts.push(p.read[m.id] ? 1 : 0);
  const q = p.quiz[m.id]?.answers || {};
  parts.push(m.quiz.length ? Object.keys(q).length / m.quiz.length : 1);
  parts.push(m.labs.length ? m.labs.filter((l) => p.labs[l]).length / m.labs.length : 1);
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
}

function assignmentProgress(a) {
  const total = a.parts.reduce((n, part) => n + (part.checks?.length || 0), 0);
  if (!total) return 0;
  const c = P.get().checks[a.id] || {};
  return Math.round((Object.values(c).filter(Boolean).length / total) * 100);
}

function overallProgress() {
  const vals = MODULES.map(moduleProgress);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const ring = (pct, label) =>
  h('div', { class: 'progress-ring', style: { '--p': pct }, role: 'img', 'aria-label': `${label || 'Progress'}: ${pct}%` }, h('span', null, pct + '%'));

// ------------------------------------------------------------------ helpers
const html = (str) => h('span', { html: str });
const ext = (href, text, cls = '') => h('a', { href, target: '_blank', rel: 'noopener', class: cls }, text);
const moduleTag = (m) => h('span', { class: 'tag accent' }, `Module ${m.n}`);

function sectionHead(title, tag, id) {
  return h('div', { class: 'section-h', id }, h('h2', null, title), tag ? h('span', { class: 'tag' }, tag) : null);
}

function journalBox(key, prompt, { rows = 5 } = {}) {
  const p = P.get();
  const ta = h('textarea', { rows, 'aria-label': prompt, placeholder: 'Your reflection… (saved in this browser)' });
  ta.value = p.journal[key]?.text || '';
  const saved = h('span', { class: 'hint', 'aria-live': 'polite' }, ta.value ? 'Saved' : '');
  let t;
  ta.addEventListener('input', () => {
    clearTimeout(t);
    saved.textContent = 'Saving…';
    t = setTimeout(() => {
      P.update((pp) => {
        if (ta.value.trim()) pp.journal[key] = { prompt, text: ta.value, at: new Date().toISOString() };
        else delete pp.journal[key];
      });
      saved.textContent = 'Saved';
    }, 400);
  });
  return h('div', { class: 'field' }, h('label', null, prompt), ta, saved);
}

// ------------------------------------------------------------------ lab mounting
function labFrame(id, { lazy = true } = {}) {
  const meta = LABS[id];
  if (!meta) return h('div', { class: 'callout warn' }, `Unknown lab: ${id}`);
  const body = h('div', { class: `lab-body lab-${id}` });
  const frame = h('section', { class: 'lab', id: 'lab-' + id, 'aria-labelledby': 'lab-title-' + id },
    h('div', { class: 'lab-head' },
      h('div', { class: 'lab-icon', 'aria-hidden': 'true' }, meta.icon),
      h('div', { class: 'grow' },
        h('h3', { id: 'lab-title-' + id }, meta.title),
        h('p', null, meta.blurb)),
      h('a', { class: 'btn small ghost no-print', href: `#/lab/${id}`, title: 'Open this lab on its own page' }, 'Full screen ↗')),
    body);

  let mounted = false;
  const doMount = async () => {
    if (mounted) return;
    mounted = true;
    try {
      const mod = await import(`./labs/${id}.js`);
      const ctx = { id, store: makeStore('lab:' + id), toast };
      const cleanup = mod.mount(body, ctx);
      if (typeof cleanup === 'function') cleanups.push(cleanup);
      const markTried = () => {
        P.update((p) => { p.labs[id] = true; });
        body.removeEventListener('pointerdown', markTried);
        body.removeEventListener('keydown', markTried);
      };
      body.addEventListener('pointerdown', markTried);
      body.addEventListener('keydown', markTried);
    } catch (err) {
      console.error(err);
      render(body, h('p', { class: 'lab-error' }, 'This lab failed to load. '), h('pre', null, String(err && err.message || err)));
    }
  };
  if (lazy && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); doMount(); }
    }, { rootMargin: '400px' });
    io.observe(frame);
    cleanups.push(() => io.disconnect());
  } else {
    doMount();
  }
  return frame;
}

// ------------------------------------------------------------------ quiz
function quiz(m) {
  const wrap = h('div');
  const draw = () => {
    const saved = P.get().quiz[m.id]?.answers || {};
    const answered = Object.keys(saved).length;
    const correct = Object.entries(saved).filter(([i, a]) => m.quiz[i].answer === a).length;
    const score = h('div', { class: 'row between', 'aria-live': 'polite' },
      h('span', { class: 'muted small' }, `${answered}/${m.quiz.length} answered · ${correct} correct`),
      answered ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => { P.update((p) => { delete p.quiz[m.id]; }); draw(); } }, 'Reset quiz') : null);
    const qs = m.quiz.map((q, qi) => {
      const chosen = saved[qi];
      const done = chosen !== undefined;
      const opts = q.options.map((o, oi) => {
        let cls = 'quiz-opt';
        if (done && oi === q.answer) cls += ' right';
        else if (done && oi === chosen) cls += ' wrong';
        return h('button', {
          class: cls, type: 'button', disabled: done ? true : null,
          onclick: () => { P.update((p) => { (p.quiz[m.id] ||= { answers: {} }).answers[qi] = oi; }); draw(); },
        }, String.fromCharCode(65 + oi) + '. ', o);
      });
      return h('div', { class: 'quiz-q' },
        h('h4', null, `${qi + 1}. ${q.q}`),
        opts,
        done ? h('div', { class: `quiz-explain callout ${chosen === q.answer ? 'ok' : 'bad'}` },
          h('strong', null, chosen === q.answer ? 'Correct.' : 'Not quite.'), q.explain) : null);
    });
    const finished = answered === m.quiz.length;
    render(wrap, score, h('div', { style: { marginTop: '10px' } }, qs),
      finished ? h('div', { class: `callout ${correct === m.quiz.length ? 'ok' : 'info'}`, style: { marginTop: '12px' } },
        h('strong', null, `You scored ${correct}/${m.quiz.length}.`),
        correct === m.quiz.length ? 'Nicely done — on to the labs or the next module.' : 'Revisit the key ideas above for the ones you missed, then reset and try again.') : null);
  };
  draw();
  return wrap;
}

// ------------------------------------------------------------------ views
function viewHome() {
  const pct = overallProgress();
  const started = pct > 0;
  const nextModule = MODULES.find((m) => moduleProgress(m) < 100) || MODULES[0];
  const nLabs = Object.keys(LABS).length;
  const nQuiz = MODULES.reduce((n, m) => n + m.quiz.length, 0);

  return h('div', null,
    h('section', { class: 'hero container' },
      h('div', { class: 'eyebrow' }, `Stanford ${COURSE.code} · ${COURSE.term} · unofficial companion`),
      h('h1', null, 'Thinking with AI, ', h('em', { style: { color: 'var(--accent)' } }, 'hands-on.')),
      h('p', { class: 'lede' }, 'An interactive way to work through the ideas of Stanford’s CS193T: how language models really work, how to prompt like a good manager, how to wrangle context and sources, how to direct — and distrust — agents, how to evaluate AI, and how to count its costs. Every module pairs plain-language explanations with labs you can play with.'),
      h('div', { class: 'row', style: { marginTop: '22px' } },
        h('a', { class: 'btn primary', href: `#/module/${nextModule.id}` }, started ? `Continue: ${nextModule.title} →` : 'Start Module 1 →'),
        h('a', { class: 'btn', href: '#/labs' }, `Browse all ${nLabs} labs`),
        h('a', { class: 'btn ghost', href: '#/about' }, 'About the course')),
      h('div', { class: 'stats', style: { marginTop: '30px', maxWidth: '760px' } },
        stat('Modules', MODULES.length, 'lectures 1–7 + a throughline'),
        stat('Interactive labs', nLabs, 'simulations & builders'),
        stat('Self-check questions', nQuiz, 'with explanations'),
        stat('Missions', ASSIGNMENTS.length, 'paraphrased assignments'))),

    h('section', { class: 'container section' },
      h('div', { class: 'row between' },
        h('h2', null, 'The course arc'),
        started ? h('div', { class: 'row' }, ring(pct, 'Overall progress'), h('span', { class: 'muted small' }, 'overall progress')) : null),
      h('p', { class: 'muted', style: { maxWidth: '70ch' } }, 'Each week adds one new capability and one new way it can go wrong — from a single prompt, to persistent context, to agents that act, to systems you must govern, evaluate and pay for.'),
      h('div', { class: 'grid-cards', style: { marginTop: '18px' } }, MODULES.map(moduleCard))),

    h('section', { class: 'container section' },
      h('h2', null, 'Try a lab right now'),
      h('p', { class: 'muted' }, 'No sign-up, nothing to install. Your work is saved in this browser.'),
      h('div', { class: 'grid-cards', style: { marginTop: '14px' } },
        ['next-token', 'prompt-builder', 'prompt-injection', 'agent-loop', 'eval-arena', 'cost-calculator'].map(labCard))),

    h('section', { class: 'container section' },
      h('div', { class: 'grid-2' },
        h('div', { class: 'panel' },
          h('h3', null, 'Three habits the whole course comes back to'),
          h('ol', null,
            h('li', null, h('strong', null, 'Know when to trust. '), 'Ask for evidence you can check, not reassurance.'),
            h('li', null, h('strong', null, 'Know when to push back. '), 'Design checkpoints, least privilege and independent verification into everything.'),
            h('li', null, h('strong', null, 'Keep your own thinking sharp. '), 'Decide what stays yours, and install smoke detectors for skills you don’t want to lose.'))),
        h('div', { class: 'panel tint' },
          h('h3', null, 'How to use this companion'),
          h('ul', null,
            h('li', null, 'Read a module’s key ideas, then play with its labs.'),
            h('li', null, 'Check yourself with the quiz — explanations follow every answer.'),
            h('li', null, 'Do the matching mission with real AI tools, and log reflections in your ', h('a', { href: '#/journal' }, 'journal'), '.'),
            h('li', null, 'Plan your capstone in the ', h('a', { href: '#/project' }, 'project studio'), '.'),
            h('li', null, 'Press ', h('span', { class: 'kbd' }, '/'), ' anywhere to search.'))))),
  );
}

function stat(k, v, s) {
  return h('div', { class: 'stat' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, String(v)), h('span', { class: 's' }, s));
}

function moduleCard(m) {
  const pct = moduleProgress(m);
  return h('a', { class: 'card', href: `#/module/${m.id}` },
    h('div', { class: 'row between nowrap' },
      h('span', { class: 'num' }, String(m.n).padStart(2, '0')),
      pct ? ring(pct, m.title) : (m.upcoming ? h('span', { class: 'tag warn' }, 'Thread · partly upcoming') : null)),
    h('h3', null, m.title),
    h('p', null, m.hook),
    h('div', { class: 'card-foot' },
      h('span', { class: 'tag' }, m.week),
      h('span', { class: 'tag teal' }, `${m.labs.length} lab${m.labs.length === 1 ? '' : 's'}`),
      h('span', { class: 'tag violet' }, `${m.quiz.length} questions`)));
}

function labCard(id) {
  const l = LABS[id];
  const m = moduleById(l.module);
  const tried = P.get().labs[id];
  return h('a', { class: 'card', href: `#/lab/${id}` },
    h('div', { class: 'row between nowrap' },
      h('span', { style: { fontSize: '1.7rem', lineHeight: 1 }, 'aria-hidden': 'true' }, l.icon),
      tried ? h('span', { class: 'done-badge' }, '✓ tried') : null),
    h('h3', null, l.title),
    h('p', null, l.blurb),
    h('div', { class: 'card-foot' }, h('span', { class: 'tag' }, `Module ${m.n} · ${m.title}`)));
}

function viewModules() {
  return h('div', { class: 'container' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'Modules'),
      h('h1', null, 'Eight modules, one arc'),
      h('p', { class: 'lede' }, 'Modules 1–7 follow the seven lectures published so far; Module 8 gathers the course’s recurring thread on keeping your own thinking sharp, plus what’s still to come.')),
    h('div', { class: 'timeline' }, MODULES.map((m) => {
      const pct = moduleProgress(m);
      return h('div', { class: `tl-item ${pct === 100 ? 'done' : ''} ${m.upcoming ? 'future' : ''}` },
        h('div', { class: 'row between' },
          h('div', null,
            h('div', { class: 'muted small' }, `${m.week} · ${m.lecture}`),
            h('h3', { style: { margin: '2px 0 4px' } }, h('a', { href: `#/module/${m.id}`, style: { color: 'inherit', textDecoration: 'none' } }, `${m.n}. ${m.title}`))),
          ring(pct, m.title)),
        h('p', { class: 'muted', style: { maxWidth: '75ch' } }, m.summary),
        h('div', { class: 'row' },
          m.labs.map((id) => h('a', { class: 'tag teal', href: `#/lab/${id}`, style: { textDecoration: 'none' } }, LABS[id].icon + ' ' + LABS[id].title)),
          m.assignments.map((aid) => { const a = assignmentById(aid); return h('a', { class: 'tag warm', href: `#/assignment/${aid}`, style: { textDecoration: 'none' } }, `Mission ${a.num}`); })));
    })));
}

function viewModule(id) {
  const m = moduleById(id);
  if (!m) return notFound();
  const idx = MODULES.indexOf(m);
  const prev = MODULES[idx - 1];
  const next = MODULES[idx + 1];
  const read = !!P.get().read[m.id];
  const sectionIds = [['overview', 'Overview'], ['ideas', 'Key ideas'], ['labs', 'Labs'], ['quiz', 'Check yourself'], m.assignments.length ? ['missions', 'Missions'] : null, ['reflect', 'Reflect'], ['deeper', 'Go deeper']].filter(Boolean);
  const readings = READINGS.filter((r) => r.module === m.id);

  const readBtn = h('button', { class: `btn ${read ? '' : 'primary'}`, type: 'button' }, read ? '✓ Marked as read' : 'Mark key ideas as read');
  readBtn.addEventListener('click', () => {
    P.update((p) => { p.read[m.id] = !p.read[m.id]; });
    const r = !!P.get().read[m.id];
    readBtn.textContent = r ? '✓ Marked as read' : 'Mark key ideas as read';
    readBtn.classList.toggle('primary', !r);
    if (r) toast('Nice — on to the labs.');
  });

  const toc = h('nav', { class: 'toc', 'aria-label': 'On this page' },
    h('div', { class: 'muted small', style: { padding: '0 10px 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' } }, 'On this page'),
    sectionIds.map(([sid, label]) => h('a', { href: '#', onclick: (e) => { e.preventDefault(); document.getElementById(sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, label)),
    h('div', { style: { padding: '14px 10px 0' } }, ring(moduleProgress(m), 'Module progress')));

  const body = h('div', { class: 'stack-lg' },
    h('div', { id: 'overview', class: 'stack' },
      h('p', { class: 'lede' }, m.summary),
      h('div', { class: 'row' },
        h('span', { class: 'label' }, 'Tools this week:'),
        m.tools.map((t) => h('span', { class: 'tag' }, t))),
      h('div', { class: 'row' },
        m.slides ? ext(m.slides, 'Official lecture slides ↗', 'btn small') : null,
        ext(m.page, m.upcoming ? 'Course readings page ↗' : 'Official lecture page ↗', 'btn small'))),

    h('div', null,
      sectionHead('Key ideas', `${m.ideas.length} ideas`, 'ideas'),
      h('div', null, m.ideas.map((it, i) => h('div', { class: 'idea' }, h('h3', null, `${i + 1}. ${it.t}`), h('p', { html: it.b })))),
      h('div', { class: 'row', style: { marginTop: '18px' } }, readBtn)),

    h('div', null,
      sectionHead('Labs', `${m.labs.length} interactive`, 'labs'),
      h('div', { class: 'stack-lg' }, m.labs.map((l) => labFrame(l)))),

    h('div', null,
      sectionHead('Check yourself', `${m.quiz.length} questions`, 'quiz'),
      quiz(m)),

    m.assignments.length ? h('div', null,
      sectionHead('Missions', 'apply it with real tools', 'missions'),
      h('div', { class: 'grid-cards' }, m.assignments.map((aid) => assignmentCard(assignmentById(aid))))) : null,

    h('div', null,
      sectionHead('Reflect', 'saved to your journal', 'reflect'),
      h('div', { class: 'panel stack' }, m.reflect.map((r, i) => journalBox(`module:${m.id}:${i}`, r)))),

    h('div', null,
      sectionHead('Go deeper', null, 'deeper'),
      readings.length ? h('div', { class: 'stack' }, readings.flatMap((g) => g.items.map(readingItem))) : h('p', { class: 'muted' }, 'See the full reading list on the ', h('a', { href: '#/resources' }, 'Resources'), ' page.'),
      h('p', { class: 'small muted', style: { marginTop: '12px' } }, 'Related terms: ',
        GLOSSARY.filter((g) => g.m === m.id).map((g, i, arr) => [h('a', { href: `#/glossary?q=${encodeURIComponent(g.term)}` }, g.term), i < arr.length - 1 ? ', ' : '']))),

    h('div', { class: 'prev-next no-print' },
      prev ? h('a', { class: 'btn', href: `#/module/${prev.id}` }, `← ${prev.n}. ${prev.title}`) : h('span'),
      next ? h('a', { class: 'btn primary', href: `#/module/${next.id}` }, `${next.n}. ${next.title} →`) : h('a', { class: 'btn primary', href: '#/project' }, 'On to the project studio →')),
  );

  return h('div', { class: 'container' },
    h('section', { class: 'module-hero' },
      h('div', { class: 'num' }, `MODULE ${String(m.n).padStart(2, '0')} · ${m.week.toUpperCase()}`),
      h('h1', null, m.title),
      h('div', { class: 'muted' }, m.lecture),
      h('p', { class: 'lede', style: { marginTop: '14px' } }, m.hook),
      m.upcoming ? h('div', { class: 'callout warn', style: { maxWidth: '760px' } }, h('strong', null, 'Partly upcoming'), `As of ${COURSE.asOf}, lectures for Weeks 9–10 haven’t been published. This module gathers the course’s recurring thread on this theme; check the official site for new material.`) : null),
    h('div', { class: 'module-layout' }, h('aside', null, toc), body));
}

function readingItem(r) {
  return h('div', { class: 'row nowrap', style: { alignItems: 'flex-start', gap: '12px' } },
    h('span', { class: 'tag', style: { flex: 'none', marginTop: '3px' } }, r.kind),
    h('div', null,
      ext(r.url, r.title), h('span', { class: 'muted' }, ' — ', r.by),
      r.note ? h('div', { class: 'small muted' }, r.note) : null));
}

function assignmentCard(a) {
  const pct = assignmentProgress(a);
  const m = moduleById(a.module);
  return h('a', { class: 'card', href: `#/assignment/${a.id}` },
    h('div', { class: 'row between nowrap' },
      h('span', { class: 'tag warm' }, `Mission ${a.num}`),
      pct ? ring(pct, a.title) : null),
    h('h3', null, a.title),
    h('p', null, a.goal),
    h('div', { class: 'card-foot' }, h('span', { class: 'tag' }, a.week), h('span', { class: 'tag accent' }, `Module ${m.n}`)));
}

function viewLabs() {
  return h('div', { class: 'container' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'Labs'),
      h('h1', null, `${Object.keys(LABS).length} interactive labs`),
      h('p', { class: 'lede' }, 'Simulations, builders and sorting games — each one makes a course idea tangible. Simulations are simplified on purpose; they show the shape of a phenomenon, not a real model’s internals.')),
    MODULES.map((m) => h('section', { class: 'section', style: { paddingTop: '10px' } },
      h('div', { class: 'row between' }, h('h2', null, `${m.n}. ${m.title}`), h('a', { href: `#/module/${m.id}`, class: 'small' }, 'Go to module →')),
      h('div', { class: 'grid-cards', style: { marginTop: '10px' } }, m.labs.map(labCard)))));
}

function viewLab(id) {
  const l = LABS[id];
  if (!l) return notFound();
  const m = moduleById(l.module);
  return h('div', { class: 'container' },
    h('section', { class: 'module-hero' },
      h('div', { class: 'row small' }, h('a', { href: '#/labs' }, 'Labs'), h('span', { class: 'muted' }, '/'), h('a', { href: `#/module/${m.id}` }, `Module ${m.n}: ${m.title}`))),
    labFrame(id, { lazy: false }),
    h('div', { class: 'prev-next' },
      h('a', { class: 'btn', href: `#/module/${m.id}` }, `← Back to Module ${m.n}`),
      h('a', { class: 'btn ghost', href: '#/labs' }, 'All labs')));
}

function viewAssignments() {
  return h('div', { class: 'container' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'Missions'),
      h('h1', null, 'Assignments, as missions'),
      h('p', { class: 'lede' }, 'Each mission paraphrases a CS193T assignment so you can do it on your own with real AI tools. Tick off steps as you go and keep reflections in your journal. Weeks 4 and 5 offer a choice of two tracks.'),
      h('div', { class: 'callout info', style: { maxWidth: '760px' } }, h('strong', null, 'Enrolled in CS193T?'), 'Follow the official instructions and submit through the course’s channels — these missions are a study aid, not a substitute.')),
    h('div', { class: 'grid-cards' }, ASSIGNMENTS.map(assignmentCard)));
}

function viewAssignment(id) {
  const a = assignmentById(id);
  if (!a) return notFound();
  const m = moduleById(a.module);
  const idx = ASSIGNMENTS.indexOf(a);
  const prev = ASSIGNMENTS[idx - 1];
  const next = ASSIGNMENTS[idx + 1];
  const ringHolder = h('span', null, ring(assignmentProgress(a), a.title));
  const refreshRing = () => render(ringHolder, ring(assignmentProgress(a), a.title));

  const parts = a.parts.map((part, pi) => {
    const checks = (part.checks || []).map((c, ci) => {
      const key = `${pi}-${ci}`;
      const cb = h('input', { type: 'checkbox' });
      cb.checked = !!(P.get().checks[a.id] || {})[key];
      cb.addEventListener('change', () => { P.update((p) => { (p.checks[a.id] ||= {})[key] = cb.checked; }); refreshRing(); });
      return h('label', { class: 'check' }, cb, h('span', null, c));
    });
    return h('div', { class: 'panel flat stack' },
      h('div', { class: 'row nowrap', style: { alignItems: 'baseline' } }, h('span', { class: 'pill-num' }, String(pi + 1)), h('h3', { style: { margin: 0 } }, part.t)),
      h('p', { style: { margin: 0 } }, part.b),
      part.list ? h('ul', { style: { margin: 0 } }, part.list.map((x) => h('li', null, x))) : null,
      checks.length ? h('div', { class: 'stack', style: { gap: '6px' } }, h('div', { class: 'label' }, 'Checklist'), checks) : null);
  });

  return h('div', { class: 'container narrow' },
    h('section', { class: 'module-hero' },
      h('div', { class: 'row small' }, h('a', { href: '#/assignments' }, 'Missions'), h('span', { class: 'muted' }, '/'), h('a', { href: `#/module/${m.id}` }, `Module ${m.n}: ${m.title}`)),
      h('div', { class: 'row between', style: { marginTop: '10px' } },
        h('div', { class: 'num' }, `MISSION ${a.num} · ${a.week.toUpperCase()}`), ringHolder),
      h('h1', null, a.title),
      h('p', { class: 'lede' }, a.goal),
      h('div', { class: 'row' }, h('span', { class: 'tag' }, a.due), ext(a.url, 'Official instructions ↗', 'btn small'))),
    a.pattern ? h('div', { class: 'callout think' }, h('strong', null, 'The weekly pattern'), a.pattern) : null,
    h('div', { class: 'stack', style: { marginTop: '18px' } }, parts),
    sectionHead('Reflect', 'saved to your journal', 'reflect'),
    h('div', { class: 'panel stack' }, a.reflect.map((r, i) => journalBox(`assignment:${a.id}:${i}`, r))),
    sectionHead('Warm up with these labs', null, 'labs'),
    h('div', { class: 'grid-cards' }, a.labs.map(labCard)),
    h('div', { class: 'prev-next' },
      prev ? h('a', { class: 'btn', href: `#/assignment/${prev.id}` }, `← Mission ${prev.num}`) : h('span'),
      next ? h('a', { class: 'btn primary', href: `#/assignment/${next.id}` }, `Mission ${next.num} →`) : h('a', { class: 'btn primary', href: '#/project' }, 'Project studio →')));
}

function viewProject() {
  const canvasStore = makeStore('project');
  const fields = PROJECT.canvas.map((f) => {
    const ta = h('textarea', { rows: 3, placeholder: f.hint, 'aria-label': f.label });
    ta.value = canvasStore.get(f.k, '');
    ta.addEventListener('input', () => canvasStore.set(f.k, ta.value));
    return h('div', { class: 'field' }, h('label', null, f.label), ta, h('div', { class: 'hint' }, f.hint));
  });
  const exportCanvas = () => {
    const md = ['# Final project canvas', '', ...PROJECT.canvas.flatMap((f) => [`## ${f.label}`, canvasStore.get(f.k, '') || '_(not yet filled in)_', ''])].join('\n');
    downloadText('project-canvas.md', md);
  };

  const ideaGrid = h('div', { class: 'grid-cards' }, PROJECT.ideas.map((idea) =>
    h('details', { class: 'acc' }, h('summary', null, idea.t), h('div', { class: 'acc-body' }, h('strong', null, 'Ethics to wrestle with: '), idea.ethics))));

  return h('div', { class: 'container' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'Project studio'),
      h('h1', null, 'Build a custom AI system for your own work'),
      h('p', { class: 'lede' }, 'The CS193T capstone is a portfolio-ready, agentic AI system that helps with work you’re actually doing — plus a serious ethics reflection — shown at a poster session in finals week.'),
      h('div', { class: 'row' }, h('span', { class: 'tag warm' }, `Poster session: ${COURSE.posterSession}`), ext(COURSE.base + 'resources/final_project_early_advice', 'Official project advice ↗', 'btn small'))),

    h('section', { class: 'section' },
      h('div', { class: 'grid-2' }, PROJECT.principles.map((p) => h('div', { class: 'panel' }, h('h3', null, p.t), h('p', { style: { margin: 0 } }, p.b))))),

    h('section', { class: 'section' },
      h('div', { class: 'grid-2' },
        h('div', { class: 'panel tint' }, h('h3', null, 'Deliverables'), h('ol', { style: { margin: 0 } }, PROJECT.deliverables.map((d) => h('li', null, d)))),
        h('div', { class: 'panel tint' }, h('h3', null, 'Themes classmates are exploring'),
          h('div', { class: 'row', style: { gap: '6px' } }, PROJECT.themes.map((t) => h('span', { class: 'tag' }, t)))))),

    h('section', { class: 'section' },
      h('h2', null, 'Idea starters — each with an ethics question'),
      h('p', { class: 'muted' }, 'Inspired by the course’s project advice. Open one to see the hard question that comes with it.'),
      ideaGrid),

    h('section', { class: 'section' },
      h('div', { class: 'row between' }, h('h2', null, 'Your project canvas'), h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: exportCanvas }, 'Export as Markdown'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => window.print() }, 'Print'))),
      h('p', { class: 'muted' }, 'Fill this in as your idea firms up. It autosaves in your browser. It mirrors the course’s workflow questions: trigger, automation, human review, reuse and a simple test of success.'),
      h('div', { class: 'grid-2' }, fields)),

    h('section', { class: 'section' },
      h('h2', null, 'Starter prompt: a brainstorming partner that doesn’t take over'),
      h('pre', null, PROJECT.starter),
      h('button', { class: 'btn primary', type: 'button', onclick: () => copyText(PROJECT.starter) }, 'Copy prompt'),
      h('p', { class: 'small muted', style: { marginTop: '10px' } }, 'Before you build, run your agent spec through the ', h('a', { href: '#/lab/agent-anatomy' }, 'Agent Anatomy Builder'), ' and your scope document through ', h('a', { href: '#/lab/elephant-goldfish' }, 'Elephant & Goldfish'), '.')));
}

function viewGlossary(params) {
  const q0 = params.get('q') || '';
  let mod = params.get('m') || '';
  const input = h('input', { type: 'search', placeholder: 'Search terms and definitions…', 'aria-label': 'Search glossary', value: q0 });
  const list = h('div', { 'aria-live': 'polite' });
  const modChips = h('div', { class: 'row' });
  const drawChips = () => render(modChips,
    [{ id: '', label: 'All' }, ...MODULES.map((m) => ({ id: m.id, label: `${m.n}. ${m.title}` }))].map((o) =>
      h('button', { class: 'chip', type: 'button', 'aria-pressed': String(mod === o.id), onclick: () => { mod = o.id; drawChips(); draw(); } }, o.label)));
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hl = (text, q) => {
    if (!q) return text;
    const parts = text.split(new RegExp(`(${esc(q)})`, 'ig'));
    return parts.map((p) => (p.toLowerCase() === q.toLowerCase() ? h('mark', null, p) : p));
  };
  const draw = () => {
    const q = input.value.trim();
    const items = GLOSSARY
      .filter((g) => !mod || g.m === mod)
      .filter((g) => !q || (g.term + ' ' + g.def).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.term.localeCompare(b.term));
    render(list,
      h('p', { class: 'muted small' }, `${items.length} term${items.length === 1 ? '' : 's'}`),
      items.length ? h('div', { class: 'grid-2' }, items.map((g) => {
        const m = moduleById(g.m);
        return h('div', { class: 'panel flat' },
          h('div', { class: 'row between nowrap', style: { alignItems: 'baseline' } },
            h('h3', { style: { margin: 0, fontSize: '1.08rem' } }, hl(g.term, q)),
            h('a', { class: 'tag accent', href: `#/module/${m.id}`, style: { textDecoration: 'none', flex: 'none' } }, `M${m.n}`)),
          h('p', { style: { margin: '6px 0 0', color: 'var(--text-2)' } }, hl(g.def, q)));
      })) : h('div', { class: 'empty' }, 'No matching terms.'));
  };
  input.addEventListener('input', draw);
  drawChips();
  draw();
  setTimeout(() => { if (q0) input.focus(); }, 0);
  return h('div', { class: 'container' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'Glossary'),
      h('h1', null, 'Course vocabulary'),
      h('p', { class: 'lede' }, `${GLOSSARY.length} terms, each linked to the module where it appears. (Mission 3 asks students to make a glossary with AI and then check it — this one was written by hand.)`)),
    h('div', { class: 'stack' }, h('div', { class: 'search-box' }, input), modChips, list));
}

function viewResources() {
  return h('div', { class: 'container' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'Resources'),
      h('h1', null, 'Readings, tools & links'),
      h('p', { class: 'lede' }, 'The course’s optional readings, grouped by week, plus its guide to more private, open and efficient AI. None of the readings are required.')),
    h('section', { class: 'section' },
      h('div', { class: 'panel', style: { display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' } },
        h('div', { style: { fontSize: '2.4rem' }, 'aria-hidden': 'true' }, '📘'),
        h('div', { class: 'grow', style: { minWidth: '240px' } },
          h('div', { class: 'eyebrow', style: { marginBottom: '4px' } }, 'If you read one book'),
          h('h3', { style: { margin: 0 } }, ext(BOOK.url, BOOK.title)),
          h('div', { class: 'muted' }, BOOK.author),
          h('p', { style: { margin: '8px 0 0' } }, BOOK.note)))),
    h('section', { class: 'section' },
      h('h2', null, 'Optional readings by week'),
      h('div', { class: 'stack' }, READINGS.map((g) => {
        const m = moduleById(g.module);
        return h('details', { class: 'acc', open: g.week === 'Week 1' ? true : null },
          h('summary', null, h('span', { class: 'tag' }, g.week), ' ', g.topic, h('span', { class: 'muted small', style: { fontWeight: 500 } }, ` · ${g.items.length} item${g.items.length === 1 ? '' : 's'}`)),
          h('div', { class: 'acc-body stack' }, g.items.map(readingItem), h('a', { href: `#/module/${m.id}`, class: 'small' }, `Module ${m.n}: ${m.title} →`)));
      }))),
    h('section', { class: 'section' },
      h('h2', null, 'Using AI more ethically: three moves'),
      h('p', { class: 'muted' }, 'Nearly every “ethical AI” option is some mix of these three changes. Knowing which one a tool makes tells you what you actually gain.'),
      h('div', { class: 'grid-3' }, ETHICAL_MOVES.map((x) => h('div', { class: 'panel' }, h('div', { style: { fontSize: '1.6rem' }, 'aria-hidden': 'true' }, x.icon), h('h3', null, x.t), h('p', { style: { margin: 0, color: 'var(--text-2)' } }, x.b)))),
      h('div', { class: 'grid-2', style: { marginTop: '18px' } }, ETHICAL_TOOLS.map((g) => h('div', { class: 'panel flat' },
        h('h3', null, g.group),
        h('ul', { style: { margin: 0 } }, g.items.map((t) => h('li', null, ext(t.url, t.name), h('span', { class: 'muted' }, ' — ', t.note))))))),
      h('div', { class: 'callout ok', style: { marginTop: '18px' } }, h('strong', null, 'Default to small.'), 'Start with a “mini” model for drafting, summarizing and reformatting, and step up only when it actually fails. Try the ', h('a', { href: '#/lab/model-picker' }, 'Right-Size the Model'), ' lab.')),
    h('section', { class: 'section' },
      h('h2', null, 'Official course pages'),
      h('div', { class: 'row' }, OFFICIAL_LINKS.map((l) => ext(l.url, l.t + ' ↗', 'btn small')))));
}

function viewAbout() {
  const resetBtn = h('button', { class: 'btn', type: 'button' }, 'Reset all progress & notes');
  resetBtn.addEventListener('click', () => {
    if (!confirm('Erase all progress, quiz answers, lab state, project canvas and journal entries stored by this site in this browser?')) return;
    Object.keys(localStorage).filter((k) => k.startsWith('twai:') && k !== 'twai:app:theme').forEach((k) => localStorage.removeItem(k));
    toast('Progress reset');
    route();
  });
  return h('div', { class: 'container narrow' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'About'),
      h('h1', null, `${COURSE.code}: ${COURSE.title}`),
      h('p', { class: 'lede' }, 'Practical AI skills for work, study and life — when to trust, when to push back, and how to keep your own thinking and learning sharp. Taught at Stanford in ' + COURSE.term + ' by ' + COURSE.instructor + ', with a large team of TAs who each follow a small group of students all quarter.')),
    h('div', { class: 'table-wrap' }, h('table', null, h('tbody', null, LOGISTICS.map((r) => h('tr', null, h('th', { scope: 'row', style: { width: '28%' } }, r.k), h('td', null, r.v)))))),
    sectionHead('Tools covered', null),
    h('div', { class: 'grid-3' }, TOOLS_COVERED.map((g) => h('div', { class: 'panel flat' }, h('h4', null, g.vendor), h('div', { class: 'row', style: { gap: '6px' } }, g.items.map((t) => h('span', { class: 'tag' }, t)))))),
    sectionHead('Is it the right course?', null),
    h('div', { class: 'grid-3' }, PLACEMENT.map((p) => h('div', { class: 'panel' }, h('h4', null, p.title), h('ul', { style: { margin: 0 } }, p.points.map((x) => h('li', null, x)))))),
    sectionHead('About this companion', null),
    h('div', { class: 'stack' },
      h('p', null, 'This is an independent, unofficial study aid built from the course’s public website, lecture slides and assignment pages as of ', h('strong', null, COURSE.asOf), '. It is not affiliated with or endorsed by Stanford University or the CS193T teaching team.'),
      h('p', null, 'To respect the course’s copyright, explanations here are written in fresh language rather than copied from slides, and every module links to the official lecture page and slides. The labs, quizzes, examples, glossary and project canvas are original. Personal information about students and staff (such as contact details) has deliberately been left out.'),
      h('p', null, 'Simulations are simplified teaching models — they illustrate how a phenomenon behaves, not how any specific product works internally. Numbers in the cost lab come from cited public estimates and are rough by nature.'),
      h('p', null, 'Your progress, quiz answers, lab inputs, project canvas and journal live only in this browser’s localStorage. Nothing is sent anywhere.'),
      h('div', { class: 'row' }, ext(COURSE.officialUrl, 'Official course site ↗', 'btn primary'), ext(COURSE.onlineUrl, 'Take it via Stanford Online ↗', 'btn'), resetBtn)));
}

function viewJournal() {
  const p = P.get();
  const entries = Object.entries(p.journal).sort((a, b) => (a[1].at < b[1].at ? 1 : -1));
  const labelFor = (key) => {
    const [kind, id] = key.split(':');
    if (kind === 'module') { const m = moduleById(id); return m ? { label: `Module ${m.n}: ${m.title}`, href: `#/module/${m.id}` } : { label: key }; }
    if (kind === 'assignment') { const a = assignmentById(id); return a ? { label: `Mission ${a.num}: ${a.title}`, href: `#/assignment/${a.id}` } : { label: key }; }
    return { label: key };
  };
  const exportAll = () => {
    const md = ['# My Thinking with AI journal', '', ...entries.flatMap(([k, e]) => [`## ${labelFor(k).label}`, `*${e.prompt}*`, '', e.text, '', `_${new Date(e.at).toLocaleString()}_`, ''])].join('\n');
    downloadText('thinking-with-ai-journal.md', md);
  };
  return h('div', { class: 'container narrow' },
    h('section', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'Journal'),
      h('h1', null, 'Your reflections'),
      h('p', { class: 'lede' }, 'CS193T pairs every week of tool work with written reflection. Everything you write in a module or mission shows up here.'),
      entries.length ? h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: exportAll }, 'Export as Markdown'), h('button', { class: 'btn ghost', type: 'button', onclick: () => window.print() }, 'Print')) : null),
    entries.length
      ? h('div', { class: 'stack' }, entries.map(([k, e]) => {
        const lf = labelFor(k);
        return h('article', { class: 'panel' },
          h('div', { class: 'row between' }, lf.href ? h('a', { href: lf.href, class: 'tag accent', style: { textDecoration: 'none' } }, lf.label) : h('span', { class: 'tag' }, lf.label), h('span', { class: 'muted small' }, new Date(e.at).toLocaleDateString())),
          h('p', { class: 'muted', style: { margin: '10px 0 6px', fontStyle: 'italic' } }, e.prompt),
          h('p', { style: { whiteSpace: 'pre-wrap', margin: 0 } }, e.text));
      }))
      : h('div', { class: 'empty' }, 'No entries yet. Every module ends with a reflection prompt — ', h('a', { href: '#/module/how-ai-works' }, 'start with Module 1'), '.'));
}

function notFound() {
  return h('div', { class: 'container section center' }, h('h1', null, 'Page not found'), h('p', null, h('a', { href: '#/' }, 'Back home')));
}

// ------------------------------------------------------------------ search palette
const searchIndex = () => [
  ...MODULES.map((m) => ({ kind: 'Module', title: `${m.n}. ${m.title}`, text: m.summary + ' ' + m.ideas.map((i) => i.t).join(' '), href: `#/module/${m.id}` })),
  ...MODULES.flatMap((m) => m.ideas.map((i) => ({ kind: `Idea · M${m.n}`, title: i.t, text: i.b.replace(/<[^>]+>/g, ''), href: `#/module/${m.id}` }))),
  ...Object.entries(LABS).map(([id, l]) => ({ kind: 'Lab', title: `${l.icon} ${l.title}`, text: l.blurb, href: `#/lab/${id}` })),
  ...ASSIGNMENTS.map((a) => ({ kind: 'Mission', title: `${a.num}. ${a.title}`, text: a.goal, href: `#/assignment/${a.id}` })),
  ...GLOSSARY.map((g) => ({ kind: 'Term', title: g.term, text: g.def, href: `#/glossary?q=${encodeURIComponent(g.term)}` })),
];

function openSearch() {
  if (document.querySelector('.search-overlay')) return;
  const idx = searchIndex();
  const input = h('input', { type: 'search', placeholder: 'Search modules, ideas, labs, missions, terms…', 'aria-label': 'Search' });
  const results = h('div', { class: 'search-results', role: 'listbox' });
  let sel = 0;
  let current = [];
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey, true); };
  const go = (r) => { close(); location.hash = r.href; };
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    current = q ? idx.map((r) => {
      const t = r.title.toLowerCase(); const x = r.text.toLowerCase();
      let s = 0;
      for (const w of terms) { if (t.includes(w)) s += 3; else if (x.includes(w)) s += 1; else return null; }
      if (t.startsWith(q)) s += 4;
      return { ...r, s };
    }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 12) : idx.filter((r) => r.kind === 'Module' || r.kind === 'Lab').slice(0, 10);
    sel = Math.min(sel, Math.max(0, current.length - 1));
    render(results, current.length ? current.map((r, i) => h('button', {
      type: 'button', class: 'search-item' + (i === sel ? ' sel' : ''), role: 'option', 'aria-selected': String(i === sel), onclick: () => go(r),
    }, h('span', { class: 'tag' }, r.kind), h('span', { class: 'grow' }, r.title))) : h('div', { class: 'muted', style: { padding: '14px' } }, 'No results'));
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, current.length - 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
    else if (e.key === 'Enter' && current[sel]) { e.preventDefault(); go(current[sel]); }
  };
  const overlay = h('div', { class: 'search-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search', onclick: (e) => { if (e.target === overlay) close(); } },
    h('div', { class: 'search-dialog' }, h('div', { class: 'search-box' }, input), results, h('div', { class: 'hint', style: { padding: '8px 4px 0' } }, '↑↓ to move · Enter to open · Esc to close')));
  input.addEventListener('input', () => { sel = 0; draw(); });
  document.addEventListener('keydown', onKey, true);
  document.body.appendChild(overlay);
  draw();
  input.focus();
}

// ------------------------------------------------------------------ router
function parse() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { parts, params: new URLSearchParams(qs || '') };
}

const TITLES = { modules: 'Modules', labs: 'Labs', assignments: 'Missions', project: 'Project studio', glossary: 'Glossary', resources: 'Resources', about: 'About', journal: 'Journal' };

function route() {
  cleanups.forEach((fn) => { try { fn(); } catch {} });
  cleanups = [];
  const { parts, params } = parse();
  const [a, b] = parts;
  let view;
  let title = 'Thinking with AI — Interactive Companion';
  let nav = a || 'home';
  switch (a) {
    case undefined: view = viewHome(); break;
    case 'modules': view = viewModules(); break;
    case 'module': { view = viewModule(b); const m = moduleById(b); if (m) title = `${m.title} · Thinking with AI`; nav = 'modules'; break; }
    case 'labs': view = viewLabs(); break;
    case 'lab': { view = viewLab(b); if (LABS[b]) title = `${LABS[b].title} · Thinking with AI`; nav = 'labs'; break; }
    case 'assignments': view = viewAssignments(); break;
    case 'assignment': { view = viewAssignment(b); const x = assignmentById(b); if (x) title = `Mission ${x.num}: ${x.title} · Thinking with AI`; nav = 'assignments'; break; }
    case 'project': view = viewProject(); break;
    case 'glossary': view = viewGlossary(params); break;
    case 'resources': view = viewResources(); break;
    case 'about': view = viewAbout(); break;
    case 'journal': view = viewJournal(); break;
    default: view = notFound();
  }
  if (TITLES[a]) title = `${TITLES[a]} · Thinking with AI`;
  document.title = title;
  render(app, h('div', { class: 'fade-in' }, view));
  document.querySelectorAll('.navlinks a').forEach((el) => el.classList.toggle('active', el.dataset.nav === nav));
  document.getElementById('navlinks').classList.remove('open');
  document.getElementById('menu-btn').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ------------------------------------------------------------------ chrome
function initChrome() {
  document.getElementById('theme-btn').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('theme', next);
  });
  const menu = document.getElementById('menu-btn');
  menu.addEventListener('click', () => {
    const nl = document.getElementById('navlinks');
    const open = nl.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  document.getElementById('search-btn').addEventListener('click', openSearch);
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && !['input', 'textarea', 'select'].includes(tag) && !e.target.isContentEditable) { e.preventDefault(); openSearch(); }
  });
  window.addEventListener('hashchange', route);
}

initChrome();
route();
