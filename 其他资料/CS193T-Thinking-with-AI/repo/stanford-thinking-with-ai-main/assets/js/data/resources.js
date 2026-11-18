// Readings, tools, logistics and project material. Descriptions are written for this companion.
const BASE = 'https://web.stanford.edu/class/archive/cs/cs193t/cs193t.1272/';

export const BOOK = {
  title: 'Co-Intelligence: Living and Working with AI',
  author: 'Ethan Mollick',
  url: 'https://www.penguinrandomhouse.com/books/741805/co-intelligence-by-ethan-mollick/',
  note: 'The instructor’s one-book recommendation: a user- and use-case-centered tour that starts beginner-friendly and goes surprisingly deep.',
};

export const READINGS = [
  { week: 'Week 1', topic: 'How AI works', module: 'how-ai-works', items: [
    { title: 'What happens when you talk to AI?', by: 'Anthropic', kind: 'Video', url: 'https://www.youtube.com/watch?v=j1Vk6Y-23CY', note: 'A gentle, non-technical look behind the chat window.' },
    { title: 'Transformers, explained', by: 'Google Cloud', kind: 'Video', url: 'https://www.youtube.com/watch?v=SZorAJ4I-sA', note: 'Short overview of the architecture behind GPT, BERT and T5.' },
    { title: 'Visualizing transformers and attention', by: 'Grant Sanderson (3Blue1Brown)', kind: 'Video', url: 'https://www.youtube.com/watch?v=KJtZARuO3JY', note: 'Long, with outstanding animations.' },
    { title: 'Transformers (Speech and Language Processing, ch. 8)', by: 'Dan Jurafsky & James H. Martin', kind: 'Textbook chapter', url: 'https://web.stanford.edu/~jurafsky/slp3/8.pdf', note: 'Much deeper than the course requires.' },
    { title: 'Attention Is All You Need', by: 'Vaswani et al., NeurIPS 2017', kind: 'Paper', url: 'https://arxiv.org/pdf/1706.03762', note: 'The original transformer paper — skim it after the videos.' },
    { title: 'How random contingencies created the current AI moment', by: 'Ethan Mollick', kind: 'Post / video', url: 'https://www.linkedin.com/posts/emollick_i-was-reflecting-on-how-many-random-contingencies-ugcPost-7510172476031803392-nsz9/', note: 'A connect-the-dots history. The video was itself AI-made, so check its claims.' },
  ] },
  { week: 'Week 2', topic: 'Prompting & model choice', module: 'prompting', items: [
    { title: 'Claude system prompts', by: 'Anthropic', kind: 'Documentation', url: 'https://platform.claude.com/docs/en/release-notes/system-prompts/overview', note: 'Published system prompts for each Claude model.' },
    { title: 'Lost in the Middle: How Language Models Use Long Contexts', by: 'Liu et al., TACL', kind: 'Paper', url: 'https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00638/119630/Lost-in-the-Middle-How-Language-Models-Use-Long', note: 'Evidence for primacy and recency effects in long contexts.' },
    { title: 'I Love Generative AI and Hate the Companies Building It', by: 'Christina Wodtke', kind: 'Blog post', url: 'https://cwodtke.medium.com/i-love-generative-ai-and-hate-the-companies-building-it-3fb120e512ac', note: 'Choosing a model through an ethics lens.' },
  ] },
  { week: 'Week 3', topic: 'Context & retrieval', module: 'sources', items: [
    { title: 'Adaptive Chameleon or Stubborn Sloth', by: 'Xie et al., ICLR 2024', kind: 'Paper', url: 'https://arxiv.org/pdf/2305.13300', note: 'What models do when your documents conflict with their training.' },
  ] },
  { week: 'Week 4', topic: 'Research with AI', module: 'research', items: [
    { title: 'Using an LLM for Humanities research', by: 'Rachel Helps', kind: 'Blog post', url: 'https://rachelhelps.substack.com/p/using-an-llm-for-humanities-research', note: 'A practitioner’s account.' },
    { title: 'AI Legal Review Says Millions Live Under Discriminatory Local Laws', by: 'Andrew Myers, Stanford HAI', kind: 'Article', url: 'https://hai.stanford.edu/news/ai-legal-review-says-millions-live-under-discriminatory-local-laws', note: 'Legal text review at a scale no human team could manage.' },
  ] },
  { week: 'Week 5', topic: 'Connectors & agents', module: 'agents', items: [
    { title: 'Stanford-approved connectors grid', by: 'Stanford UIT', kind: 'Reference', url: 'https://uit.stanford.edu/ai/connectors', note: 'Which connectors are approved for which tools.' },
    { title: 'Elephants, Goldfish and the New Golden Age of Software Engineering', by: 'Dave Rensin', kind: 'Blog post', url: 'https://drensin.medium.com/elephants-goldfish-and-the-new-golden-age-of-software-engineering-c33641a48874', note: 'The original elephant-and-goldfish write-up.' },
    { title: 'Specification Gaming: How AI Can Turn Your Wishes Against You', by: 'Rational Animations', kind: 'Video', url: 'https://www.youtube.com/watch?v=jQOBaGka7O0', note: 'When a system does what you said, not what you meant.' },
    { title: 'How to explain agentic AI to your leadership team', by: 'Ashley Nicholson', kind: 'Post', url: 'https://www.linkedin.com/posts/ashley--nicholson_how-to-explain-agentic-ai-to-your-leadership-share-7500569045541367808-vFZ7/', note: '' },
  ] },
  { week: 'Week 6', topic: 'Governing agentic AI', module: 'control', items: [
    { title: 'Practices for Governing Agentic AI Systems', by: 'OpenAI white paper', kind: 'Paper', url: 'https://cdn.openai.com/papers/practices-for-governing-agentic-ai-systems.pdf', note: 'Key risks and recommendations for agentic systems.' },
    { title: 'NIST AI Risk Management Framework', by: 'NIST', kind: 'Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', note: 'The U.S. reference framework for trustworthy AI, plus playbooks.' },
    { title: 'Responsible AI at Stanford', by: 'Stanford UIT', kind: 'Guidance', url: 'https://uit.stanford.edu/security/responsibleai', note: 'Policies and guidance for sensitive data in AI tools.' },
    { title: 'US military had close call after using AI for false intelligence report', by: 'Lillis & Cohen, CNN', kind: 'Article', url: 'https://www.cnn.com/2026/09/18/politics/us-military-ai-false-intelligence-china-ship', note: 'Why verification matters at high stakes.' },
  ] },
  { week: 'Week 7', topic: 'Eval design', module: 'control', items: [
    { title: 'Teaching the New Loop', by: 'Andy Hall', kind: 'Blog post', url: 'https://freesystems.substack.com/p/teaching-the-new-loop', note: 'Students writing their own eval rubrics.' },
    { title: 'Universities should arm students with AI “eval” powers', by: 'Andy Hall, Financial Times', kind: 'Article (may be paywalled)', url: 'https://www.ft.com/content/ac15aa4a-960f-4957-90c6-ff1b4a390fa4', note: '' },
    { title: 'Define success criteria and build evaluations', by: 'Anthropic', kind: 'Documentation', url: 'https://platform.claude.com/docs/en/test-and-evaluate/develop-tests', note: 'A practical guide to writing tests for model output.' },
  ] },
  { week: 'Week 8', topic: 'Tokens & budgets', module: 'cost', items: [
    { title: 'Using Claude Code: Spending your effort', by: 'Thariq Shihipar', kind: 'Blog post', url: 'https://claude.dev/blog/spending-your-effort/', note: 'When low versus high effort settings pay off.' },
  ] },
  { week: 'Week 9', topic: 'Learning & thinking with AI', module: 'thinking', items: [
    { title: 'What happens to learning when AI does the thinking for us?', by: 'Stanford Report', kind: 'Article', url: 'https://news.stanford.edu/stories/2026/11/cognitive-offloading-thinking-ai', note: 'Research on cognitive offloading.' },
    { title: 'Rethinks: Defining Where We Want AI to Take Us', by: 'Matt Abrahams with Russ Altman (Think Fast Talk Smart)', kind: 'Podcast', url: 'https://open.spotify.com/episode/6iiLBpowGq7UbAZqMTHJVH', note: 'AI as an amplifier of a clear message, not a substitute for one.' },
  ] },
];

export const ETHICAL_MOVES = [
  { t: 'Run it locally', icon: '💻', b: 'When a model runs on your own machine, prompts and files never leave it — nothing to trust because nothing moved. Ideal for unpublished research, interviews, records or NDA work, and it works offline. The trade-off: local models are smaller and less capable, and your battery does the work.' },
  { t: 'Prefer open models', icon: '🔓', b: 'Openness is a spectrum, from weights-only to fully published data and training code. The more open, the more you can check what it learned from, where biases come from, and whether results can be reproduced.' },
  { t: 'Use the smallest model that works', icon: '🌱', b: 'Larger models cost far more energy and water per query. Most everyday drafting, summarizing and reformatting doesn’t need a frontier model — start small and step up only when it actually fails.' },
];

export const ETHICAL_TOOLS = [
  { group: 'No setup required', items: [
    { name: 'Apertus Mini (in-browser)', url: 'https://huggingface.co/spaces/swiss-ai/apertus-mini-webgpu', note: 'Runs entirely in your browser tab; nothing is sent anywhere.' },
    { name: 'ThinkHere (in-browser)', url: 'https://thinkhere.ai', note: 'Private chat with open models running on your device. Without an account: SmolLM2 1.7B (one-time ~1 GB download). A free account unlocks Gemma 4 E2B and E4B and Qwen3.5 0.8B, 2B and 4B (all five also read images and PDFs), plus Llama 3.2 1B and Mistral 7B. Downloads range from ~600 MB to ~3.8 GB.' },
    { name: 'OLMo playground (AI2)', url: 'https://playground.allenai.org/', note: 'Weights, training data and code all published — inspectable end to end.' },
    { name: 'IBM Granite playground', url: 'https://www.ibm.com/granite/playground', note: 'Openly licensed models from a major vendor.' },
  ] },
  { group: 'Some technical setup', items: [
    { name: 'LM Studio', url: 'https://lmstudio.ai', note: 'Point-and-click local models.' },
    { name: 'Jan Desktop', url: 'https://www.jan.ai', note: 'A familiar chat interface, fully local.' },
    { name: 'Ollama', url: 'https://ollama.com', note: 'Local models from the terminal; easy to script against.' },
    { name: 'OpenJarvis', url: 'https://open-jarvis.github.io/OpenJarvis', note: 'A Stanford project focused on efficiency.' },
    { name: 'MLX-LM', url: 'https://github.com/ml-explore/mlx-lm', note: 'Run and fine-tune models on Apple silicon.' },
    { name: 'llama.cpp', url: 'https://github.com/ggml-org/llama.cpp', note: 'Quantization lets models run on modest hardware.' },
    { name: 'Hugging Face Transformers', url: 'https://huggingface.co/docs/transformers/index', note: 'Python toolkit to run and study models directly.' },
    { name: 'Intelligence per Watt', url: 'https://hazyresearch.stanford.edu/intelligence-per-watt', note: 'Measure what local inference actually costs in energy.' },
  ] },
];

export const LOGISTICS = [
  { k: 'Units & grading', v: '2 units, Satisfactory / No Credit. No prerequisites, no textbook, no exam.' },
  { k: 'Lecture', v: 'Tuesdays 1:30–2:50 pm, NVIDIA Auditorium (Huang Building). Recorded for auditors and excused absences.' },
  { k: 'Tutorial', v: 'From Week 2, a weekly 80-minute studio in CoDa B80: ~20 minutes on the week’s tool, then an hour of hands-on building. Same TA and table group all quarter; a ten-minute weekly check-in on the previous assignment.' },
  { k: 'Assignments', v: 'Weekly, designed around work you already need to do, with layers of reflection, comparison and verification. Signed off in tutorial.' },
  { k: 'Final project', v: 'A custom, agentic AI system for your own work, with an ethics reflection — presented at a poster session in finals week.' },
  { k: 'Who it’s for', v: 'Everyone: first-years to faculty and staff, STEM and humanities, AI fans and critics. No coding required.' },
  { k: 'Auditing & remote', v: 'Stanford affiliates may audit (materials and recordings, no staff support). Non-Stanford learners can take it for credit through Stanford Online.' },
];

export const TOOLS_COVERED = [
  { vendor: 'Anthropic', items: ['Claude', 'Claude Cowork', 'Claude Code', 'Claude in Chrome', 'Claude Science'] },
  { vendor: 'Google', items: ['Gemini Enterprise', 'Gemini Notebook (NotebookLM)', 'Deep Research', 'Data Insights', 'Code Assist'] },
  { vendor: 'OpenAI', items: ['ChatGPT / ChatGPT Edu', 'ChatGPT Work', 'Codex', 'Deep Research', 'Browser agent'] },
  { vendor: 'Microsoft', items: ['Microsoft 365 Copilot', 'GitHub Copilot'] },
  { vendor: 'Open models', items: ['DeepSeek', 'Mistral', 'Llama'] },
  { vendor: 'Connectors', items: ['Gmail & Calendar', 'Drive & OneDrive', 'Slack & Teams', 'GitHub', 'Research databases'] },
];

export const PLACEMENT = [
  { title: 'Take CS193T if…', points: ['You don’t code, or coding isn’t the AI use case you care about', 'You want to move from casual chat to structured, autonomous workflows for study, research and work'] },
  { title: 'Take CS106A → CS193V if…', points: ['You want to learn programming fundamentals', 'You want to build larger software (whole websites) with AI-assisted “vibe coding,” without becoming a software engineer'] },
  { title: 'Considering a CS major?', points: ['Start the core sequence (CS106A/AX/B → CS107, CS103, CS109)', 'Then AI foundations (CS221, CS229) and advanced courses like CS224N and CS231N'] },
];

export const PROJECT = {
  principles: [
    { t: 'Bring your own problem', b: 'Open-ended by design: apply AI to a real problem in your field, work or life, and the course helps you shape a solution.' },
    { t: 'Make it agentic — broadly', b: '“Agentic” can mean many things: a library of reusable skills, a RAG tool, a multi-agent workflow, an eval suite, a connector-powered assistant.' },
    { t: 'Engage the ethics', b: 'Is this an appropriate use of AI? What misuse can you anticipate and mitigate? Who is responsible for the gaps? Whose work is used, and whose might be displaced? How would widespread use change the community it serves?' },
    { t: 'Make it worth showing', b: 'Something you’re proud to present at the showcase and to put in a portfolio.' },
  ],
  deliverables: [
    'A pre-showcase review with your tutorial TA walking through how it works',
    'A poster (36×42 inches) presenting the project and your ethics reflections',
    'A practiced 3–5 minute pitch; a live demo is a welcome bonus',
  ],
  ideas: [
    { t: 'A shared library of Skills or Gems', ethics: 'If you adapt someone else’s IP (games, characters, course materials), how transformative is it? Could something very engaging become unhealthily addictive?' },
    { t: '“Interview me” assistants for campus forms', ethics: 'Could it short-circuit the reflection some application questions exist to provoke? Could “talk to the bot first” quietly become a gatekeeper?' },
    { t: 'RAG over past course evaluations', ethics: 'Student reviews carry documented biases (e.g., by instructor gender). Could the tool amplify them?' },
    { t: '“Explain this bill” over pending legislation', ethics: 'Could the framing of “what this bill does” slant readers without anyone intending it?' },
    { t: 'A dashboard over a dataset you care about', ethics: 'Does reducing people or art to statistics flatten them? Could predicting popularity homogenize what gets made?' },
    { t: 'Generator + cheap checker pipeline', ethics: 'What slips past both models, and who answers for it?' },
    { t: 'A mini eval suite and “report card”', ethics: 'How could your eval be unrepresentative or gamed, and how will you disclose that?' },
    { t: 'An audit-trail layer that flags unverified claims', ethics: 'If the auditor misses a fabricated citation, who is accountable — you, the user, or the model developer?' },
    { t: 'A red-team agent for your own prompts', ethics: 'If others got it, could it be used for harm? Should you publish the weaknesses it finds?' },
    { t: 'A virtual chief of staff', ethics: 'How would people feel knowing their interactions with you are AI-mediated? Could you lose touch with your own priorities?' },
  ],
  themes: ['Calendar & time blocking', 'Academic workload planning', 'Inbox, file & photo cleanup', 'Knowledge libraries & notes', 'Tutoring & exam prep', 'Language learning & advising', 'Job search & applications', 'Interview prep & outreach', 'Writing & content creation', 'Games & entertainment', 'Personalized news briefings', 'Legal tools', 'Investment research & modeling', 'Shopping & product comparison', 'Fitness, nutrition & wellbeing', 'Business workflows & customer insight', 'Healthcare & patient support', 'Events & social planning', 'Travel planning', 'Scientific discovery assistants', 'Visual design & storytelling', 'AI evaluation & safety'],
  canvas: [
    { k: 'problem', label: 'The problem', hint: 'What recurring task or pain point? Who has it?' },
    { k: 'users', label: 'Who it’s for', hint: 'You? Classmates? A club, lab, or office?' },
    { k: 'inputs', label: 'Inputs → outputs', hint: 'What goes in, what comes out, in what form?' },
    { k: 'trigger', label: 'Trigger & workflow', hint: 'What starts it? Which steps need AI, which are ordinary automation?' },
    { k: 'tools', label: 'Tools & permissions', hint: 'Which models, connectors, APIs? What is the least access that works?' },
    { k: 'human', label: 'Human in the loop', hint: 'Where must a person review or approve? How are they kept informed?' },
    { k: 'success', label: 'Test of success', hint: 'How will you know it works? What does your eval look like?' },
    { k: 'ethics', label: 'Ethics reflection', hint: 'Misuse, responsibility, whose work is used or displaced, community effects.' },
    { k: 'cost', label: 'Cost & footprint', hint: 'Smallest model that works? Token budget? Where do API keys live?' },
    { k: 'first', label: 'Smallest useful version & first step', hint: 'One complete working run before polish.' },
  ],
  starter: `Be my brainstorming partner for a course project on thinking with AI. I'm interested in [topic or rough idea] and the people I'd want to help are [intended users]. A task that keeps coming up for them is [recurring problem]. I have about [time] to build something.

Ask me two or three focused questions at a time — don't hand me a menu of project ideas. Help me find a problem I genuinely care about, then define the smallest useful version: what starts the workflow, what can happen automatically, where a human must review, and what would make it reusable. Leave the purpose and key decisions with me. End by helping me write one simple test of success and one concrete first step.`,
};

export const OFFICIAL_LINKS = [
  { t: 'Course home', url: BASE },
  { t: 'Syllabus', url: BASE + 'course/syllabus' },
  { t: 'Tutorials', url: BASE + 'course/about_tutorial/' },
  { t: 'About assignments', url: BASE + 'course/about_assignments/' },
  { t: 'Course placement', url: BASE + 'course/course_placement' },
  { t: 'Final project advice', url: BASE + 'resources/final_project_early_advice' },
  { t: 'Ethical AI tools', url: BASE + 'resources/ethical_ai_tools' },
  { t: 'Optional readings', url: BASE + 'resources/optional_extra_readings' },
  { t: 'Stanford Online listing', url: 'https://online.stanford.edu/courses/cs193t-thinking-ai-strategies-effective-and-ethical-human-ai-collaboration' },
];
