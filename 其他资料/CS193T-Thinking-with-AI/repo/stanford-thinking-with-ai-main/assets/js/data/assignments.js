// Assignments, paraphrased as self-guided "missions". Official instructions are linked on each.
const BASE = 'https://web.stanford.edu/class/archive/cs/cs193t/cs193t.1272/assignments/';

export const ASSIGNMENTS = [
  {
    id: 'a1', num: '1', title: 'AI Foundations', module: 'how-ai-works', week: 'Week 1', due: 'Forms due Fri Sep 25; discuss in Week 2 tutorial',
    url: BASE + '1-ai-foundations/',
    goal: 'Get set up for the quarter, then stress-test how well a chatbot sticks to instructions you give it.',
    pattern: 'Every week has two halves: hands-on AI tool work, and a written reflection that seeds a ten-minute check-in with your TA.',
    parts: [
      { t: 'Set up your tools', b: 'Request access to the premium licensed versions of the major assistants (Stanford provides Claude, Gemini and ChatGPT Edu at no cost to affiliates) and, optionally, install a coding agent in your terminal for later weeks. Outside Stanford, use whatever licensed tools your organization provides.' },
      { t: 'Help me — but not too much', b: 'Start a fresh chat and write an opening instruction asking the assistant to help with homework without doing it for you, and never to state false information about the topic. Make it as firm and specific as you think it needs to be. Then try to break it: plead, reframe, escalate.', checks: ['Wrote an emphatic, specific opening instruction', 'Pushed back repeatedly to see if it caves', 'Checked its factual claims', 'Stretch: compared model sizes or vendors on the same test'] },
      { t: 'Reflect', b: 'Pick at least one: draft the AI section of this course’s honor code, or name a skill you’ll use AI to speed up but want to keep sharp — and how you’d notice it dulling.' },
    ],
    reflect: ['How did the assistant hold up? Did it resist your pleas or give in? What strategies worked best for you, both in the instruction and in trying to break it?'],
    labs: ['next-token', 'honor-code'],
  },
  {
    id: 'a2', num: '2', title: 'Models + Prompting', module: 'prompting', week: 'Week 2', due: 'Submit by Sun Oct 4; discuss in Week 3 tutorial',
    url: BASE + '2-models-prompting/',
    goal: 'Compare models and modes, practice the scope-of-work and interview-me patterns, and reflect on keeping your own voice.',
    parts: [
      { t: 'Same task, different models', b: 'In tutorial, groups compare several models’ answers to one constrained planning problem (a small budget-allocation puzzle). Before reading closely, decide what success means. Then guess which model wrote which, cite your evidence, and ask: were the differences substantive or stylistic? Would a 5× slower answer still be worth it?', checks: ['Defined success criteria before judging', 'Separated content differences from style differences'] },
      { t: 'How am I perceived?', b: 'Give a strong model (with extended thinking on) a few paragraphs of your own consequential writing and ask what it infers about the author — seniority, confidence, mood, motives, values. Does that match how you want to come across? Then ask for small shifts: 10% more senior, cheerful, stern, enthusiastic.', checks: ['Analyzed a real writing sample', 'Tried at least one “10% more …” rewrite'] },
      { t: 'Interview me', b: 'Pick a genuinely complex task or decision in your life. Ask the assistant to interview you with at least 15 questions to uncover requirements you haven’t thought of, then summarize them as a scope of work.', checks: ['Opening interview prompt saved', 'Kept a few of the questions and answers'] },
      { t: 'Reflect', b: 'One skill you want to keep sharp while using AI, and the early-warning mechanism you’d put in place.' },
    ],
    reflect: ['How does the AI’s read of your writing compare with how you want to be perceived? What surprised you?'],
    labs: ['prompt-builder', 'long-chat', 'skill-guard'],
  },
  {
    id: 'a3', num: '3', title: 'Managing Sources + Context', module: 'sources', week: 'Week 3', due: 'Submit by Sun Oct 11; discuss in Week 4 tutorial',
    url: BASE + '3-managing-sources/',
    goal: 'Curate what an AI can see, watch how sources change its answers, and experiment with persistent instructions.',
    parts: [
      { t: 'What does the model know?', b: 'List every kind of information that can shape a response. For each: who put it there (you, the vendor, or the AI)? Can you inspect or change it? When does it help, when does it hurt, and would you ever withhold it? Is “give it as much context as possible” actually good advice?' },
      { t: 'Build a glossary — then distrust it', b: 'Feed the first three lectures’ slides to a multi-document tool (Gemini Notebook) and ask for a glossary. Predict where it will go wrong, then check: missing concepts? Padding? Can every definition be traced back to the slides?', checks: ['Predicted failure modes first', 'Traced definitions back to sources'] },
      { t: 'Build a source-grounded notebook', b: 'Choose a topic you care about and assemble a small, varied set of sources — no magic number; deciding how much is enough is part of the exercise. Ask questions a good corpus should answer, then have the notebook describe its own purpose and limits.', checks: ['Sources offer different perspectives or evidence types', 'Asked the notebook to describe its scope and limits'] },
      { t: 'Poison the well', b: 'Save answers to a few questions, then add one bad source (unreliable, irrelevant, outdated, or contradictory) and ask again. Did the notebook ignore it, qualify it, or absorb it?', checks: ['Saved “before” answers', 'Compared “after” answers', 'Noted one concrete change'] },
      { t: 'Persistent instructions', b: 'Add one standing instruction to an assistant’s memory — e.g., skip the validation and lead with the answer; correct my wrong assumptions first; don’t change an answer just because I’m unhappy; flag uncertainty — then rerun an earlier prompt. Keep it or remove it?', checks: ['Chose and saved an instruction', 'Re-ran an earlier prompt', 'Decided whether to keep it'] },
      { t: 'Reflect', b: 'What kind of context should you actively curate rather than simply hand over?' },
    ],
    reflect: ['What happened when you poisoned the well? What will you change about how you curate sources for AI?'],
    labs: ['context-stack', 'poison-well', 'prompt-injection'],
  },
  {
    id: 'a4a', num: '4A', title: 'Deep Research', module: 'research', week: 'Week 4', due: 'Submit by Sun Oct 18 (choose 4A or 4B)',
    url: BASE + '4a-deep-research/',
    goal: 'Direct a deep-research agent on something you genuinely need to understand, then audit the evidence behind its report.',
    parts: [
      { t: 'Discuss a model report', b: 'In tutorial, groups examine a deep-research report on a contested ethical question and discuss which claims they’d repeat, hedge, or check; trace several claims to their sources; and sort the disagreements into factual versus values disputes.' },
      { t: 'Run your own research', b: 'Choose a topic where gathering and comparing information would move you forward — maybe your final project. Write a brief covering goal, question, context and constraints, source priorities, output, and rules (cite, separate evidence from inference, flag gaps).', checks: ['Wrote a structured research brief', 'Recorded any clarifying follow-ups'] },
      { t: 'Interrogate the report', b: 'Without the AI: state the report’s main argument in a sentence or two; describe its two most important sources (type, where found, what each contributes); and check whether claims trace back, links resolve, sources say what’s claimed, and are used fairly.', checks: ['Summarized the central claim', 'Profiled two key sources', 'Checked at least one citation by hand'] },
      { t: 'Reflect on trust', b: 'What did it let you accomplish? What choice did you still have to make? Do you trust the result, and what would you do before sharing it?' },
    ],
    reflect: ['Do you trust your report? What did checking its sources change about your confidence?'],
    labs: ['research-brief'],
  },
  {
    id: 'a4b', num: '4B', title: 'Claude Science', module: 'research', week: 'Week 4', due: 'Submit by Sun Oct 18 (choose 4A or 4B)',
    url: BASE + '4b-claude-science/',
    goal: 'Let a research agent take several steps on a project you care about, then check the work behind one result yourself.',
    parts: [
      { t: 'Explore a project', b: 'Set up the agent, choose one of its suggested starter tasks or your own, and use tutorial time to push on it: ask questions, try changes, follow surprises. An unfinished or failed attempt is fine if you can explain what you learned.' },
      { t: 'Ask a technical question', b: 'What is model-generated? What came from a tool or source? What code actually ran? How did earlier results shape the next step? For data work, consider whether a different dataset or baseline would change the conclusion; for literature, what a summary leaves out; for a prototype, where it breaks.', checks: ['Identified generated vs retrieved vs executed', 'Explored at least one “what would change the result?” question'] },
      { t: 'Check something that matters', b: 'Pick one important claim, result or behavior and verify it with ordinary tools — open the source, inspect the data or calculation, or test a case you can judge. An automated reviewer checking against its own records isn’t an independent check.', checks: ['Performed an independent check', 'Noted what remains uncertain'] },
      { t: 'Reflect on trust', b: 'What did it let you understand, what did you still decide yourself, and how did checking the work change your confidence?' },
    ],
    reflect: ['Which choice did you still have to make yourself while the agent worked?'],
    labs: ['research-brief'],
  },
  {
    id: 'a5a', num: '5A', title: 'ChatGPT Work / Claude Cowork', module: 'agents', week: 'Week 5', due: 'Submit by Sun Oct 25 (choose 5A or 5B)',
    url: BASE + '5a-cowork/',
    goal: 'Use a desktop agent with files or connectors to simplify something real — deciding what access it needs and where you want checkpoints.',
    parts: [
      { t: 'Mitigate the worst cases', b: 'Revisit the three agent scenarios from lecture (a dorm leak report, recruiter replies, a Downloads cleanup). For each: what mitigations — such as where to place a human in the loop — would fix the risks? Or is it simply a bad idea?' },
      { t: 'Three things', b: 'Improv-style: jot down the first three topics or domains that come to mind for your final project. No commitment.', checks: ['Wrote three project ideas'] },
      { t: 'Pick a problem and run', b: 'Try a task with files or a connected app: organize copies of project files, compare documents, triage mailing-list email, or have it act as a chief of staff proposing a plan for your week. Check what access you’re granting first; sample data is fine.', checks: ['Reviewed permissions before starting', 'Saved the opening prompt', 'Noted one thing about how the agent worked'] },
      { t: 'Check what it actually did', b: 'Compare what the agent said it did with the action record and the real state of the file or app. Open the source messages behind its list of deadlines, diff an edited file, inspect a calendar draft. Asking the agent isn’t an independent check.', checks: ['Compared claims against the action record', 'Verified the resulting state directly'] },
      { t: 'Reflect on trust and agency', b: 'How would people feel knowing their interactions with you were mediated by an AI? Could you drift into being a passenger in your own life?' },
    ],
    reflect: ['What access did you grant, and would you grant it again?'],
    labs: ['agent-anatomy', 'agent-loop', 'risk-matrix'],
  },
  {
    id: 'a5b', num: '5B', title: 'ChatGPT in Chrome / Claude in Chrome', module: 'agents', week: 'Week 5', due: 'Submit by Sun Oct 25 (choose 5A or 5B)',
    url: BASE + '5b-browser-agents/',
    goal: 'Use a browser agent that can navigate and interact with web pages to simplify something real.',
    parts: [
      { t: 'Mitigate the worst cases', b: 'Same group activity as 5A: for each lecture scenario, design mitigations or decide it’s a bad idea.' },
      { t: 'Three things', b: 'Write down three possible final-project domains.', checks: ['Wrote three project ideas'] },
      { t: 'Pick a problem and run', b: 'Use an agent that actually operates the page (not just a chat sidebar): compare events against your interests, gather information from several sites into a planning doc, or fill a form for you to review before submitting. Public sites are fine if you’d rather not connect accounts.', checks: ['Confirmed the agent can act on pages', 'Saved the opening prompt', 'Noted a checkpoint, failure, or surprise'] },
      { t: 'Check what it actually did', b: 'Revisit the original listings, inspect what it typed into a draft form, or reopen a saved item to see if changes persisted. Compare with the browser steps in the action record.', checks: ['Compared claims against the action record', 'Verified the resulting state directly'] },
      { t: 'Reflect on trust and agency', b: 'Same prompt as 5A.' },
    ],
    reflect: ['Did anything on a web page try to steer the agent? How would you know?'],
    labs: ['prompt-injection', 'agent-loop', 'risk-matrix'],
  },
  {
    id: 'a6', num: '6', title: 'Claude Code and Codex', module: 'control', week: 'Week 6', due: 'Submit by Sun Nov 1; discuss in Week 7 tutorial',
    url: BASE + '6-coding-agents/',
    goal: 'Build something useful with a coding agent — or try an advanced feature you haven’t used — and keep track of what went wrong.',
    parts: [
      { t: 'Find your squad', b: 'Add yourself to a shared board of project interests grouped by theme, and find classmates with related ideas.' },
      { t: 'Choose a build', b: 'Work with real project files and run what you make — a chat that only suggests code doesn’t count. Options by difficulty:', list: ['Build a website (beginner): homepage, project page, or club site', 'Build a custom skill with instructions and supporting files', 'Design specialist subagents and conduct them', 'Make a rule executable with a hook (e.g., validate data after every edit)', 'Give the agent a new tool by writing a small MCP server', 'Explore parallel approaches in separate git worktrees'], checks: ['Defined what a working result looks like first', 'Saved the opening prompt', 'Ran the result locally'] },
      { t: 'What went wrong?', b: 'Log a failure, surprise, or unexpected result. If everything seemed fine, name something you haven’t checked yet. These become raw material for next week’s evals.', checks: ['Logged at least one failure or unchecked assumption'] },
      { t: 'Reflect: builder or conductor?', b: 'What did you need to decide yourself? What would you want to understand or maintain before someone else relied on it?' },
    ],
    reflect: ['What went wrong — and what did it reveal about what you hadn’t specified?'],
    labs: ['elephant-goldfish', 'key-leak'],
  },
  {
    id: 'a7', num: '7', title: 'Evals: Grading the Graders', module: 'control', week: 'Week 7', due: 'Submit by Sun Nov 8; discuss in Week 8 tutorial',
    url: BASE + '7-evals/',
    goal: 'Build an LLM grader and see how it scores on cases it has never seen.',
    parts: [
      { t: 'Eval Arena', b: 'Judge one behavior: does an AI assistant handle a situation the way the course says a responsible assistant should? Label example answers PASS or FAIL with a one-line reason, write instructions for an LLM judge, preview it, and submit. Every grader is scored on a hidden test set using balanced accuracy, against a baseline with no examples or instructions.', checks: ['Labeled at least three cases with reasons', 'Wrote judging instructions', 'Beat (or analyzed losing to) the baseline'] },
      { t: 'Debrief', b: 'Look at the leaderboard, the hidden case that split the room, and what separated the best graders from the rest.' },
      { t: 'Reflect', b: 'How did your grader compare to the baseline, what made the difference, and what surprised you?' },
    ],
    reflect: ['Which hidden case did your grader get wrong, and was the “right” label actually clear?'],
    labs: ['eval-arena'],
  },
  {
    id: 'a8', num: '8', title: 'APIs and API Keys', module: 'cost', week: 'Week 8', due: 'Submit by Sun Nov 15; discuss in Week 9 tutorial',
    url: BASE + '8-apis/',
    goal: 'Connect your own app to an external service through an API — and understand what the key makes possible.',
    parts: [
      { t: 'Project check-in', b: 'Who are you working with, what have you done, what’s your plan — and will you be proud of it? The final poster session is December 8 (36×42-inch poster, demo encouraged).' },
      { t: 'Choose a build', b: 'Pick one starter (or add an API feature to your project) and add stretch goals as time allows:', list: ['Fridge helper (beginner): ingredients in, three meal ideas out', 'Interview practice partner (intermediate): a three-question interview with feedback', 'DIY campus map (intermediate): five locations with your own notes', 'Club event finder (intermediate–advanced): filter one event source by place and date', 'Game character (advanced): one character, one clue, rules your code enforces', 'Meet-in-the-middle planner (advanced): compare venues by travel time from two starts'], checks: ['Made at least one successful API call', 'Kept the key out of front-end code and Git', 'Handled an empty or error response'] },
      { t: 'Reflect', b: 'What did you connect, what does your app send and receive, and what was one challenge?' },
    ],
    reflect: ['Where does your API key live, and who pays when someone else uses your app?'],
    labs: ['key-leak', 'cost-calculator', 'model-picker'],
  },
];

export const assignmentById = (id) => ASSIGNMENTS.find((a) => a.id === id);
