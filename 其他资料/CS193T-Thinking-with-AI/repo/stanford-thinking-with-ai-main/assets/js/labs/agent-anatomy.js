import { h, render, injectStyle, copyText, downloadText, debounce, callout } from './_kit.js';

const FIELDS = [
  { key: 'goal', label: 'Goal', hint: 'What does "done" look like, in one sentence?' },
  { key: 'context', label: 'Context', hint: 'Background facts the agent needs to do this well.' },
  { key: 'tools', label: 'Tools', hint: 'Which connectors / apps can it call?' },
  { key: 'permissions', label: 'Permissions', hint: 'Exactly what may it read, write, send, or delete?' },
  { key: 'memory', label: 'Memory', hint: 'What does it carry between runs?' },
  { key: 'actions', label: 'Actions', hint: 'The steps it is allowed to take, in order.' },
  { key: 'stopping', label: 'Stopping conditions', hint: 'When does it stop — on success, on failure, or to ask you?' },
];

const PRESETS = {
  dinner: {
    label: 'Team-dinner scheduler',
    goal: 'Get a team dinner on the calendar on a night all six teammates can attend.',
    context: 'Team roster of six people; the restaurant is open Tue–Sat, 5–10pm; budget is $40 per person.',
    tools: 'Calendar connector, team chat connector',
    permissions: 'View free/busy for teammates; draft chat messages; send messages only after I approve the draft.',
    memory: 'Past dinner dates and which nights people usually decline.',
    actions: 'Check availability, propose two dates, draft a poll message, wait for my approval, send, collect replies, book the calendar slot.',
    stopping: 'Stop when the dinner is confirmed by everyone, or after 3 rounds without agreement — then ask me what to do.',
  },
  leak: {
    label: 'Dorm-leak reporter',
    goal: 'Report a leaking window to building maintenance with photo evidence.',
    context: 'The maintenance desk address is facilities@example.com.',
    tools: 'Phone photo library connector, email connector',
    permissions: 'Can view all photos and send emails.',
    memory: 'Previous maintenance tickets I have filed.',
    actions: 'Find photos of the water damage, describe the problem, write the email, send it, watch for a reply.',
    stopping: 'Stop when maintenance confirms the repair, or ping me if there is no reply in 24 hours.',
  },
  recruiter: {
    label: 'Recruiter-reply bot',
    goal: 'Answer every recruiter who messages me with a polite, informed reply.',
    context: 'My career interests: climate tech, product roles, Bay Area.',
    tools: 'Professional networking site connector, web search',
    permissions: 'Full access to read, write, and send messages on my account; any web search.',
    memory: 'Replies I have written to recruiters before.',
    actions: 'Watch for new recruiter messages, research the company online, write a reply, send it.',
    stopping: 'Run for one month.',
  },
  cleanup: {
    label: 'Downloads cleanup',
    goal: 'Free up disk space by removing files in Downloads I have not opened in 6+ months.',
    context: 'The laptop is at 94% storage.',
    tools: 'File system access',
    permissions: 'Read and permanently delete any file on the laptop.',
    memory: 'None needed.',
    actions: 'Scan files from oldest to newest, delete them, check total disk usage.',
    stopping: 'Stop when usage is below the target.',
  },
  blank: { label: 'Blank', goal: '', context: '', tools: '', permissions: '', memory: '', actions: '', stopping: '' },
};

const IRREVERSIBLE = /\b(delete|deletes|deleting|remove|erase|wipe|send|sends|sending|pay|pays|purchase|buy|post|posts|publish|publishes|submit|transfer|book)\b/i;
const APPROVAL = /\b(approv\w*|confirm\w*|review\w*|ask me|ask for|check with me|draft|preview|my ok|sign[- ]off|wait for me)\b/i;
const BROAD = /\b(any|all|every|everything|full access|unlimited|entire|whole)\b/i;
const SENSITIVE = /\b(password|ssn|social security|bank|credit card|card number|health|medical|diagnos\w*|home address|phone numbers?|salary|passport|grades?)\b/i;
const HUMAN = /\b(ask me|approv\w*|ping me|notify me|check with me|human|review|confirm with me|tell me)\b/i;
const TIME_ONLY = /^\s*(run|keep going|continue)?\s*(for)?\s*(one|a|\d+)\s*(day|week|month|year|hour)s?\.?\s*$/i;

function review(spec) {
  const flags = [];
  const all = FIELDS.map((f) => spec[f.key] || '').join(' ');
  const perms = spec.permissions || '';
  const acts = spec.actions || '';
  const permAct = perms + ' ' + acts;

  const irrev = permAct.match(IRREVERSIBLE);
  if (irrev && !APPROVAL.test(permAct)) {
    flags.push({ sev: 'bad', title: `Irreversible action ("${irrev[0].toLowerCase()}") with no approval step`,
      fix: 'Use draft-then-approve: the agent prepares the message/purchase/deletion and waits for your OK before executing it.' });
  }
  if (/permanent\w*\s+delet|delet\w*\s+permanent/i.test(permAct)) {
    flags.push({ sev: 'bad', title: 'Permanent deletion is allowed',
      fix: 'Move items to the Trash (or a quarantine folder) instead, so a mistake can be undone. Do a dry run that only lists what it would delete.' });
  }
  const broad = perms.match(BROAD);
  if (broad) {
    flags.push({ sev: 'warn', title: `Overbroad permission ("${broad[0].toLowerCase()}")`,
      fix: 'Apply least privilege: scope access to one folder, one album, one label, or one thread — only what the goal requires.' });
  }
  const stop = (spec.stopping || '').trim();
  if (!stop) {
    flags.push({ sev: 'bad', title: 'No stopping condition',
      fix: 'Define success ("done when…") AND a failure exit ("after 3 tries, stop and ask me").' });
  } else if (TIME_ONLY.test(stop)) {
    flags.push({ sev: 'warn', title: 'Stopping condition is only a time limit',
      fix: 'A month is a long time to run unattended. Add a success condition, a cap on actions (e.g. max 5 messages/day), and a failure exit.' });
  } else if (!/\b(after|tries|attempts|fail\w*|no (reply|response)|ask me|ping me|cannot|can't)\b/i.test(stop)) {
    flags.push({ sev: 'warn', title: 'No failure exit',
      fix: 'Say what happens if success never arrives: cap the attempts and hand control back to you.' });
  }
  if (!HUMAN.test(all)) {
    flags.push({ sev: 'warn', title: 'No human checkpoint anywhere',
      fix: 'Decide when you are informed (progress updates) and when you gatekeep (approval before high-impact steps).' });
  }
  if (SENSITIVE.test(spec.memory || '') || SENSITIVE.test(spec.context || '')) {
    flags.push({ sev: 'warn', title: 'Memory or context may hold sensitive data',
      fix: 'Minimize: store only what the task needs, and keep sensitive identifiers out of long-term memory.' });
  }
  if (/\b(web|search|browse|internet|messages?|email|inbox)\b/i.test(spec.tools || '') && irrev) {
    flags.push({ sev: 'warn', title: 'Reads untrusted text AND can take actions',
      fix: 'Web pages and incoming messages can contain prompt injections. Keep an action log and require approval for anything triggered by outside content.' });
  }
  if (!/\b(log|record|report|summary|audit)\b/i.test(all) && irrev) {
    flags.push({ sev: 'info', title: 'No action record',
      fix: 'Ask the agent to keep a log of every action it takes so you can check what it actually did afterward.' });
  }
  const empty = FIELDS.filter((f) => !(spec[f.key] || '').trim()).map((f) => f.label);
  if (empty.length && empty.length < FIELDS.length) {
    flags.push({ sev: 'info', title: `Unspecified: ${empty.join(', ')}`,
      fix: 'Blank parts get filled in by the model’s defaults. Write them down, even if the answer is “none”.' });
  }
  return flags;
}

function toMarkdown(spec, title) {
  const lines = [`# Agent spec${title ? ': ' + title : ''}`, ''];
  for (const f of FIELDS) lines.push(`## ${f.label}`, (spec[f.key] || '_(not specified)_').trim(), '');
  return lines.join('\n');
}

function toPrompt(spec) {
  const parts = ['You are an agent working on my behalf. Follow this specification exactly.', ''];
  for (const f of FIELDS) if ((spec[f.key] || '').trim()) parts.push(`${f.label.toUpperCase()}: ${spec[f.key].trim()}`);
  parts.push('', 'Before any action that cannot be undone, show me what you plan to do and wait for my approval. Keep a log of every action you take.');
  return parts.join('\n');
}

export function mount(el, ctx) {
  injectStyle('lab-agent-anatomy', `
    .lab-agent-anatomy .aa-form { display: grid; gap: 12px; }
    .lab-agent-anatomy .aa-form textarea { min-height: 58px; }
    .lab-agent-anatomy .aa-num { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%;
      background: var(--accent-soft); color: var(--accent); font-size: .72rem; font-weight: 700; margin-right: 6px; }
    .lab-agent-anatomy .aa-flag { border-radius: var(--radius-sm); padding: 10px 12px; border: 1px solid var(--border); background: var(--surface); }
    .lab-agent-anatomy .aa-flag + .aa-flag { margin-top: 8px; }
    .lab-agent-anatomy .aa-flag.bad { border-left: 4px solid var(--bad); }
    .lab-agent-anatomy .aa-flag.warn { border-left: 4px solid var(--warn); }
    .lab-agent-anatomy .aa-flag.info { border-left: 4px solid var(--accent); }
    .lab-agent-anatomy .aa-flag .t { font-weight: 650; font-size: .93rem; }
    .lab-agent-anatomy .aa-flag .f { font-size: .88rem; color: var(--text-2); margin-top: 3px; }
    .lab-agent-anatomy .aa-review { position: sticky; top: calc(var(--nav-h, 60px) + 12px); }
    .lab-agent-anatomy .aa-score { font-family: var(--font-serif); font-size: 1.5rem; }
  `);

  let spec = ctx.store.get('spec', null) || { ...PRESETS.leak };
  let presetKey = ctx.store.get('preset', 'leak');
  delete spec.label;

  const inputs = {};
  const flagsBox = h('div', { 'aria-live': 'polite' });
  const scoreBox = h('div');

  const save = debounce(() => { ctx.store.set('spec', spec); ctx.store.set('preset', presetKey); }, 300);

  function updateReview() {
    const flags = review(spec);
    const bad = flags.filter((f) => f.sev === 'bad').length;
    const warn = flags.filter((f) => f.sev === 'warn').length;
    const verdict = bad ? ['bad', 'High risk — would not ship'] : warn ? ['warn', 'Needs mitigations'] : ['ok', 'Looks well-scoped'];
    render(scoreBox,
      h('div', { class: 'row between' },
        h('span', { class: 'aa-score' }, `${bad} critical · ${warn} warning${warn === 1 ? '' : 's'}`),
        h('span', { class: `tag ${verdict[0]}` }, verdict[1])));
    if (!flags.length) {
      render(flagsBox, callout('ok', 'No red flags from the heuristics.', 'That does not prove it is safe — ask yourself the worst-case question one more time.'));
    } else {
      render(flagsBox, flags.map((f) => h('div', { class: `aa-flag ${f.sev}` },
        h('div', { class: 't' }, f.title), h('div', { class: 'f' }, '→ ', f.fix))));
    }
  }

  function fillInputs() {
    for (const f of FIELDS) inputs[f.key].value = spec[f.key] || '';
    updateReview();
  }

  const presetChips = h('div', { class: 'row', role: 'group', 'aria-label': 'Load a preset agent' });
  function drawChips() {
    render(presetChips, Object.entries(PRESETS).map(([k, p]) => {
      const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(k === presetKey) }, p.label);
      b.addEventListener('click', () => {
        presetKey = k;
        spec = { ...p }; delete spec.label;
        fillInputs(); drawChips(); save();
      });
      return b;
    }));
  }

  const form = h('div', { class: 'aa-form' });
  FIELDS.forEach((f, i) => {
    const id = `aa-${f.key}-${Math.random().toString(36).slice(2, 7)}`;
    const ta = h('textarea', { id, rows: '2', placeholder: f.hint });
    ta.addEventListener('input', () => { spec[f.key] = ta.value; updateReview(); save(); });
    inputs[f.key] = ta;
    form.append(h('div', { class: 'field' },
      h('label', { for: id }, h('span', { class: 'aa-num' }, String(i + 1)), f.label),
      ta, h('div', { class: 'hint' }, f.hint)));
  });

  const title = () => (PRESETS[presetKey] && presetKey !== 'blank' ? PRESETS[presetKey].label : 'custom agent');

  render(el,
    h('div', { class: 'stack' },
      h('p', { class: 'muted', style: 'margin:0' },
        'Every agent has seven parts. Pick a preset or write your own, then read the review panel — it plays a deliberately pessimistic security officer asking “what’s the worst that could happen?”'),
      presetChips,
      h('div', { class: 'lab-grid' },
        h('div', { class: 'panel flat' }, form),
        h('div', { class: 'aa-review' },
          h('div', { class: 'panel tint stack' },
            h('div', { class: 'panel-title' }, h('span', { 'aria-hidden': 'true' }, '🕵️'), h('h4', null, 'Pessimistic CISO review')),
            scoreBox, flagsBox,
            h('div', { class: 'row' },
              h('button', { type: 'button', class: 'btn small', onclick: () => downloadText('agent-spec.md', toMarkdown(spec, title())) }, '⬇ Export Markdown'),
              h('button', { type: 'button', class: 'btn small primary', onclick: () => copyText(toPrompt(spec), 'Agent prompt copied') }, '⧉ Copy as prompt'))))),
      callout('think', 'What this shows',
        'An agent spec is the “detailed scope of work” prompt with three extra questions: what can it touch (permissions), what does it remember, and when does it stop. Most worst cases trace back to overbroad permissions, irreversible actions without a checkpoint, or a missing failure exit — the principle of least privilege fixes many of them.')));

  drawChips();
  fillInputs();
}
