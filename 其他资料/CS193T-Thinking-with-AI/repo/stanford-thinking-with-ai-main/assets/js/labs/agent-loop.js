import { h, render, injectStyle, callout, chips } from './_kit.js';

// A scripted agent run. Steps are generated from the scenario so the loop can
// branch on tool failures and on the human's approve/reject decision.
const SLOTS = ['Tue 4:00–5:00pm', 'Wed 1:00–2:00pm', 'Thu 7:00–8:00pm'];
const ROOM = 'Library Room 2B';

function call(tool, args) { return JSON.stringify({ type: 'tool_use', name: tool, input: args }, null, 2); }
function result(obj) { return JSON.stringify(obj, null, 2); }

function buildSteps(mode) {
  const s = [];
  let it = 1;
  s.push({ phase: 'analyze', it, text: 'The user wants a one-hour study session next week with Ana and Ben, plus invites. I can’t guess everyone’s schedule — I need to check calendars first.' });
  s.push({ phase: 'act', it, text: 'Emit a tool call to the calendar connector.', json: call('calendar.find_free_slots', { attendees: ['me', 'ana@example.com', 'ben@example.com'], duration_minutes: 60, window: 'next week' }) });
  s.push({ phase: 'observe', it, text: 'Tool returned three slots where all three people are free.', json: result({ slots: SLOTS }) });

  const workingIdx = mode === 'normal' ? 1 : -1; // which slot finally gets a room
  for (let i = 0; i < SLOTS.length; i++) {
    it++;
    s.push({ phase: 'analyze', it, text: i === 0
      ? `Earliest common slot is ${SLOTS[0]}. A study session needs a room, so reserve one before inviting anyone.`
      : `That reservation failed. Try the next common slot: ${SLOTS[i]}.` });
    s.push({ phase: 'act', it, text: 'Emit a tool call to the room-booking connector.', json: call('rooms.reserve', { room: ROOM, slot: SLOTS[i] }) });
    if (i === workingIdx) {
      s.push({ phase: 'observe', it, text: 'Success — the room is on hold.', json: result({ status: 'held', hold_id: 'H-2291', expires_in_minutes: 30 }) });
      break;
    }
    s.push({ phase: 'observe', it, fail: true, text: 'The tool reported an error. The model must notice this rather than assume success.', json: result({ error: 'ROOM_UNAVAILABLE', detail: `${ROOM} is already booked ${SLOTS[i]}` }) });
  }

  if (workingIdx < 0) {
    it++;
    s.push({ phase: 'analyze', it, text: 'Three reservation attempts have failed. My stopping condition says: after 3 failures, stop and ask the human instead of improvising.' });
    s.push({ phase: 'text', it, text: 'I couldn’t find a free room for any time that works for all three of you. Want me to try another building, or set this up as a video call?' });
    s.push({ phase: 'stop', it, outcome: 'ask', text: 'Stopped: failure limit reached → handed back to the human.' });
    return s;
  }

  const slot = SLOTS[workingIdx];
  it++;
  s.push({ phase: 'analyze', it, text: `Room is held for ${slot}. Next action sends messages to other people — that is a high-impact step.` });
  s.push({ phase: 'gate', it, text: `Draft invite to ana@example.com, ben@example.com:\n“Study session — ${slot}, ${ROOM}. Bring your problem set questions!”` });
  s.push({ phase: 'act', it, text: 'Emit a tool call to send the invites.', json: call('calendar.send_invite', { attendees: ['ana@example.com', 'ben@example.com'], slot, location: ROOM, hold_id: 'H-2291', title: 'Study session' }) });
  s.push({ phase: 'observe', it, text: 'Invites delivered.', json: result({ sent: 2, event_id: 'EVT-5531' }) });
  it++;
  s.push({ phase: 'analyze', it, text: 'Room booked and invites sent — the success condition is met. Now report back to the user in plain language.' });
  s.push({ phase: 'text', it, text: `All set: study session on ${slot} in ${ROOM}. Invites went to Ana and Ben.` });
  s.push({ phase: 'stop', it, outcome: 'ok', text: 'Stopped: success condition met.' });
  return s;
}

const REJECT_BRANCH = (it) => [
  { phase: 'analyze', it, text: 'The human rejected the draft. I should not send anything. Ask what to change rather than guessing.' },
  { phase: 'text', it, text: 'Understood — I won’t send that. What would you like changed: the time, the room, or the wording?' },
  { phase: 'stop', it, outcome: 'ask', text: 'Stopped: waiting on the human’s direction. The room hold expires in 30 minutes.' },
];

const PHASE = {
  analyze: { label: 'Analyze', cls: 'violet', icon: '🧠' },
  act: { label: 'Act', cls: 'accent', icon: '⚙️' },
  observe: { label: 'Observe', cls: 'teal', icon: '👀' },
  gate: { label: 'Human checkpoint', cls: 'warn', icon: '✋' },
  text: { label: 'Reply to human', cls: 'warm', icon: '💬' },
  stop: { label: 'Stop', cls: 'ok', icon: '■' },
};

export function mount(el, ctx) {
  injectStyle('lab-agent-loop', `
    .lab-agent-loop .al-log { display: flex; flex-direction: column; gap: 10px; max-height: 560px; overflow-y: auto; padding-right: 4px; }
    .lab-agent-loop .al-step { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; background: var(--surface); }
    .lab-agent-loop .al-step.fail { border-color: var(--bad); background: var(--bad-soft); }
    .lab-agent-loop .al-step.update { background: var(--surface-2); border-style: dashed; font-size: .88rem; }
    .lab-agent-loop .al-step pre { margin: 8px 0 0; font-size: .78rem; }
    .lab-agent-loop .al-step .note { font-size: .82rem; color: var(--muted); margin-top: 6px; }
    .lab-agent-loop .al-ring { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; align-items: center; gap: 4px; text-align: center; }
    .lab-agent-loop .al-node { border: 2px solid var(--border-strong); border-radius: 10px; padding: 8px 4px; font-weight: 650; font-size: .86rem; background: var(--surface); transition: all .2s; }
    .lab-agent-loop .al-node.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); transform: scale(1.05); }
    .lab-agent-loop .al-arrow { color: var(--muted); }
    .lab-agent-loop .al-gate { border: 2px solid var(--warn); background: var(--warn-soft); border-radius: var(--radius-sm); padding: 12px; }
    .lab-agent-loop .al-gate pre { white-space: pre-wrap; background: var(--surface); }
  `);

  let mode = 'normal';
  let approveOn = true;
  let updatesOn = true;
  let steps = [];
  let idx = 0;
  let timer = null;
  let waitingGate = false;
  let entries = [];

  const log = h('div', { class: 'al-log', 'aria-live': 'polite' });
  const status = h('div', { class: 'stats' });
  const ring = h('div', { class: 'al-ring', 'aria-hidden': 'true' });
  const gateBox = h('div');
  const playBtn = h('button', { type: 'button', class: 'btn primary' }, '▶ Play');
  const stepBtn = h('button', { type: 'button', class: 'btn' }, 'Step ›');
  const resetBtn = h('button', { type: 'button', class: 'btn ghost' }, '↺ Reset');

  function reset() {
    stop();
    steps = buildSteps(mode);
    idx = 0; entries = []; waitingGate = false;
    draw();
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = '▶ Play'; }

  const failures = () => entries.filter((e) => e.step && e.step.fail).length;
  const done = () => idx >= steps.length;

  function advance() {
    if (waitingGate || done()) { stop(); return; }
    const st = steps[idx];
    if (st.phase === 'gate') {
      if (approveOn) { waitingGate = true; stop(); draw(); return; }
      entries.push({ step: { ...st, phase: 'gate' }, skipped: true });
      idx++;
      draw();
      return;
    }
    entries.push({ step: st });
    idx++;
    if (updatesOn && st.phase === 'observe') {
      entries.push({ update: st.fail ? `Update: attempt ${failures()} of 3 failed — retrying.` : 'Update: step completed, moving on.' });
    }
    if (done()) stop();
    draw();
  }

  function decide(approved) {
    const gate = steps[idx];
    waitingGate = false;
    entries.push({ step: gate, decision: approved });
    idx++;
    if (!approved) steps = steps.slice(0, idx).concat(REJECT_BRANCH(gate.it));
    draw();
  }

  function stepCard(e) {
    if (e.update) return h('div', { class: 'al-step update' }, '📣 ', e.update);
    const st = e.step; const p = PHASE[st.phase];
    const head = h('div', { class: 'row between' },
      h('span', { class: `tag ${st.phase === 'stop' && st.outcome === 'ask' ? 'warn' : p.cls}` }, `${p.icon} ${p.label}`),
      h('span', { class: 'small muted' }, `loop ${st.it}`));
    const kids = [head];
    if (st.phase === 'gate') {
      kids.push(h('pre', null, st.text));
      kids.push(e.skipped
        ? h('div', { class: 'callout bad', style: 'margin-top:8px' }, 'Approval is OFF — the agent sent this without anyone reviewing it.')
        : h('div', { class: `tag ${e.decision ? 'ok' : 'bad'}`, style: 'margin-top:8px' }, e.decision ? '✓ You approved' : '✕ You rejected'));
    } else {
      kids.push(h('div', { style: 'margin-top:6px' }, st.text));
      if (st.json) kids.push(h('pre', null, h('code', null, st.json)));
      if (st.phase === 'act') kids.push(h('div', { class: 'note' }, 'Connector manager: recognized tool-call syntax → runs the tool.'));
      if (st.phase === 'text') kids.push(h('div', { class: 'note' }, 'Connector manager: no tool-call syntax found → does nothing; the text is shown to you.'));
    }
    return h('div', { class: `al-step${st.fail ? ' fail' : ''}` }, kids);
  }

  function draw() {
    const cur = waitingGate ? 'gate' : entries.length ? (entries[entries.length - 1].step || {}).phase : null;
    const on = (ph) => (cur === ph ? ' on' : '');
    render(ring,
      h('div', { class: 'al-node' + on('analyze') }, '🧠 Analyze'), h('span', { class: 'al-arrow' }, '→'),
      h('div', { class: 'al-node' + on('act') }, '⚙️ Act'), h('span', { class: 'al-arrow' }, '→'),
      h('div', { class: 'al-node' + on('observe') }, '👀 Observe'));

    const last = steps[steps.length - 1];
    const finished = done() && !waitingGate;
    render(status,
      h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Loop'), h('span', { class: 'v' }, String(entries.length ? (entries.filter((e) => e.step).slice(-1)[0] || { step: { it: 0 } }).step.it : 0))),
      h('div', { class: 'stat' }, h('span', { class: 'k' }, 'Failures'), h('span', { class: 'v', style: failures() ? 'color:var(--bad)' : '' }, `${failures()}/3`)),
      h('div', { class: 'stat' }, h('span', { class: 'k' }, 'State'), h('span', { class: 'v', style: 'font-size:1.05rem' },
        waitingGate ? 'Waiting on you' : finished ? (last.outcome === 'ok' ? 'Done ✓' : 'Asked you') : entries.length ? 'Running' : 'Ready')));

    render(gateBox, waitingGate ? h('div', { class: 'al-gate stack' },
      h('strong', null, '✋ The agent paused before sending messages. Approve?'),
      h('pre', null, steps[idx].text),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn primary', onclick: () => decide(true) }, 'Approve & send'),
        h('button', { type: 'button', class: 'btn', onclick: () => decide(false) }, 'Reject'))) : null);

    render(log, entries.length ? entries.map(stepCard) : h('div', { class: 'empty' }, 'Press Step or Play to start the agent.'));
    log.scrollTop = log.scrollHeight;
    stepBtn.disabled = waitingGate || done();
    playBtn.disabled = waitingGate || done();
  }

  playBtn.addEventListener('click', () => {
    if (timer) { stop(); return; }
    playBtn.textContent = '❚❚ Pause';
    advance();
    timer = setInterval(advance, 1300);
  });
  stepBtn.addEventListener('click', () => { stop(); advance(); });
  resetBtn.addEventListener('click', reset);

  const toggle = (label, get, set) => {
    const id = 'al-' + label.replace(/\W+/g, '').toLowerCase();
    const cb = h('input', { type: 'checkbox', id });
    cb.checked = get();
    cb.addEventListener('change', () => { set(cb.checked); reset(); });
    return h('label', { class: 'check', for: id }, cb, h('span', null, label));
  };

  render(el, h('div', { class: 'stack' },
    h('div', { class: 'panel tint' },
      h('strong', null, 'Task given to the agent: '),
      '“Find a one-hour slot next week when Ana, Ben, and I are all free, book a study room, and send the invites.”'),
    h('div', { class: 'lab-grid' },
      h('div', { class: 'stack' },
        ring, status, gateBox,
        h('div', { class: 'row' }, playBtn, stepBtn, resetBtn),
        h('div', { class: 'panel flat stack' },
          h('div', { class: 'label' }, 'Scenario'),
          chips([{ value: 'normal', label: 'One room conflict' }, { value: 'booked', label: 'Every room booked' }], mode, (v) => { mode = v; reset(); }),
          h('div', { class: 'label' }, 'Human in the loop'),
          toggle('Approve before sending messages', () => approveOn, (v) => { approveOn = v; }),
          toggle('Progress update after each observation', () => updatesOn, (v) => { updatesOn = v; }),
          h('div', { class: 'hint' }, 'Stopping condition: success, or 3 failed attempts → ask the human.'))),
      h('div', { class: 'panel flat' }, h('h4', null, 'Agent trace'), log)),
    callout('think', 'What this shows',
      'Nothing magical happens in an agent. The model is still predicting the next token; sometimes the likeliest text is a structured tool call, which a connector manager recognizes and runs. The loop — analyze, act, observe, repeat — is what makes it “agentic,” and the stopping condition and human checkpoints are design choices you make.')));

  reset();
  return () => stop();
}
