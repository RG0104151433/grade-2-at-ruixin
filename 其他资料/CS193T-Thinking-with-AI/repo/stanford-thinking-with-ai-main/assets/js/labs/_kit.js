// Shared helpers for interactive labs. No dependencies.
// Every lab module:  export function mount(el, ctx) { ...; return optionalCleanupFn; }
//   el  — an empty container element (class "lab-body" plus "lab-<id>")
//   ctx — { id, store, toast }
//          store.get(key, fallback) / store.set(key, value)  (localStorage, namespaced per lab)
//          toast(message)

/**
 * Hyperscript element builder.
 *   h('div', { class: 'row', onclick: fn, style: { gap: '4px' }, dataset: { id: 1 } }, 'text', childEl, [moreKids])
 * Special attrs: class | style (string|object) | dataset | html (sets innerHTML) | on<event> (listener)
 * null/false/undefined children are skipped. Arrays are flattened.
 */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    children.unshift(attrs);
    attrs = null;
  }
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class' || k === 'className') el.className = v;
      else if (k === 'style') {
        if (typeof v === 'string') el.style.cssText = v;
        else Object.assign(el.style, v);
      } else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  append(el, children);
  return el;
}

function append(el, kids) {
  for (const c of kids) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else if (c instanceof Node) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

/** Replace all children of el. */
export function render(el, ...children) {
  el.replaceChildren();
  append(el, children);
  return el;
}

/** Inject a <style> block once per id. Scope rules under .lab-<id>. */
export function injectStyle(id, css) {
  const sid = 'style-' + id;
  if (document.getElementById(sid)) return;
  const s = document.createElement('style');
  s.id = sid;
  s.textContent = css;
  document.head.appendChild(s);
}

/** localStorage wrapper namespaced by prefix. */
export function makeStore(prefix) {
  const full = (k) => `twai:${prefix}:${k}`;
  return {
    get(k, fallback = null) {
      try {
        const raw = localStorage.getItem(full(k));
        return raw === null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(k, v) {
      try { localStorage.setItem(full(k), JSON.stringify(v)); } catch { /* storage full or disabled */ }
    },
    remove(k) { try { localStorage.removeItem(full(k)); } catch {} },
  };
}

export function toast(msg, ms = 2200) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = h('div', { class: 'toast-wrap', role: 'status', 'aria-live': 'polite' });
    document.body.appendChild(wrap);
  }
  const t = h('div', { class: 'toast' }, msg);
  wrap.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export async function copyText(text, okMsg = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg);
  } catch {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' });
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(okMsg); } catch { toast('Copy failed — select and copy manually'); }
    ta.remove();
  }
}

/** Trigger a text-file download (e.g. exporting a Markdown worksheet). */
export function downloadText(filename, text, type = 'text/markdown') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const round = (x, d = 0) => { const m = 10 ** d; return Math.round(x * m) / m; };
export const fmt = (x, d = 0) => Number(x).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

/** Deterministic PRNG (mulberry32) so simulations are reproducible. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Labeled horizontal bar: label | bar | value. value/max in [0..]. */
export function barRow(label, value, max = 1, { color, valueText } = {}) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return h('div', { class: 'bar-row' },
    h('div', null, label),
    h('div', { class: 'bar' }, h('span', { style: { width: pct + '%', background: color || '' } })),
    h('div', { class: 'val' }, valueText ?? String(value)));
}

/** Row of toggle chips. options: [{value,label}] or strings. onChange(value). */
export function chips(options, current, onChange, { multi = false } = {}) {
  const wrap = h('div', { class: 'row', role: 'group' });
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const isOn = (v) => (multi ? (current || []).includes(v) : current === v);
  for (const o of opts) {
    const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(isOn(o.value)) }, o.label);
    b.addEventListener('click', () => {
      if (multi) {
        const set = new Set(current || []);
        set.has(o.value) ? set.delete(o.value) : set.add(o.value);
        current = [...set];
      } else current = o.value;
      [...wrap.children].forEach((c, i) => c.setAttribute('aria-pressed', String(isOn(opts[i].value))));
      onChange(current);
    });
    wrap.appendChild(b);
  }
  return wrap;
}

/** Labeled range slider. Returns element; calls onInput(number). */
export function slider({ label, min, max, step = 1, value, format = (v) => v, onInput, hint }) {
  const out = h('span', { class: 'mono small' }, format(value));
  const input = h('input', { type: 'range', min, max, step, value });
  input.addEventListener('input', () => {
    const v = Number(input.value);
    out.textContent = format(v);
    onInput(v);
  });
  return h('div', { class: 'field' },
    h('div', { class: 'row between' }, h('label', null, label), out),
    input,
    hint ? h('div', { class: 'hint' }, hint) : null);
}

/**
 * Click-or-drag sorter. items: [{id, text, answer}], bins: [{id, label, hint?}].
 * Works with mouse drag AND with click-to-select then click-a-bin (keyboard/touch friendly).
 * onChange(placements) where placements = {itemId: binId}. Returns { el, check(), reset() }.
 * check() marks correct/wrong and returns {correct, total}.
 */
export function sorter({ items, bins, placements = {}, onChange = () => {} }) {
  let selected = null;
  const state = { ...placements };
  const el = h('div', { class: 'stack' });
  const pool = h('div', { class: 'dropzone', 'aria-label': 'Unsorted items' });
  const binEls = {};
  const itemEls = {};

  const binGrid = h('div', { class: 'grid-cards', style: { gridTemplateColumns: `repeat(auto-fit, minmax(${bins.length > 3 ? 180 : 220}px, 1fr))` } });
  for (const b of bins) {
    const zone = h('div', { class: 'dropzone', dataset: { bin: b.id }, tabindex: '0', role: 'button', 'aria-label': 'Place selected item in ' + b.label });
    const wrap = h('div', { class: 'stack', style: { gap: '6px' } },
      h('div', null, h('strong', null, b.label), b.hint ? h('div', { class: 'hint' }, b.hint) : null), zone);
    wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.gap = '6px';
    binEls[b.id] = zone;
    binGrid.appendChild(wrap);
  }

  const place = (itemId, binId) => {
    if (binId) state[itemId] = binId; else delete state[itemId];
    layout();
    onChange({ ...state });
  };

  for (const it of items) {
    const d = h('div', { class: 'draggable', draggable: 'true', tabindex: '0', role: 'button', dataset: { id: it.id } }, it.text);
    d.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', it.id); });
    const sel = () => {
      selected = selected === it.id ? null : it.id;
      Object.values(itemEls).forEach((x) => x.classList.toggle('selected', x.dataset.id === selected));
    };
    d.addEventListener('click', (e) => { e.stopPropagation(); sel(); });
    d.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); } });
    itemEls[it.id] = d;
  }

  const wireZone = (zone, binId) => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      if (id) place(id, binId);
    });
    const clickPlace = () => { if (selected) { const id = selected; selected = null; itemEls[id].classList.remove('selected'); place(id, binId); } };
    zone.addEventListener('click', clickPlace);
    zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickPlace(); } });
  };
  wireZone(pool, null);
  for (const b of bins) wireZone(binEls[b.id], b.id);

  function layout() {
    for (const it of items) {
      itemEls[it.id].classList.remove('correct', 'wrong');
      const target = state[it.id] ? binEls[state[it.id]] : pool;
      target.appendChild(itemEls[it.id]);
    }
    pool.style.display = pool.children.length ? '' : 'none';
  }

  el.append(h('div', { class: 'hint' }, 'Drag items into a category — or click an item, then click a category.'), pool, binGrid);
  layout();

  return {
    el,
    check() {
      let correct = 0;
      for (const it of items) {
        const ok = state[it.id] === it.answer;
        if (ok) correct++;
        if (state[it.id]) itemEls[it.id].classList.add(ok ? 'correct' : 'wrong');
      }
      return { correct, total: items.length, placed: Object.keys(state).length };
    },
    reset() { for (const k of Object.keys(state)) delete state[k]; layout(); onChange({}); },
    get placements() { return { ...state }; },
  };
}

/** Simple callout element. kind: info | ok | warn | bad | think */
export function callout(kind, title, body) {
  return h('div', { class: `callout ${kind}` }, title ? h('strong', null, title) : null, body);
}

/** Debounce helper. */
export function debounce(fn, ms = 200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/** Rough token estimate (~4 chars/token for English, as a teaching approximation). */
export const estTokens = (text) => Math.max(0, Math.round((text || '').trim().length / 4));
