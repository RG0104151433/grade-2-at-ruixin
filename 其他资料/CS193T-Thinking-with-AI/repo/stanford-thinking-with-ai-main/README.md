# Thinking with AI — Interactive Companion to Stanford CS193T

An unofficial, interactive study companion to Stanford's **CS193T: Thinking with AI** (Autumn 2026, taught by Cynthia Bailey). It turns the course's arc into something you can *do*:

- **8 modules**: Lectures 1–7, plus a module on the course's recurring theme of keeping your own thinking sharp. Each has plain-language key ideas, labs, a self-check quiz, missions and a reflection prompt.
- **22 interactive labs**, including a next-token predictor, context-window squeeze, attention spotlight, scope-of-work prompt builder, RAG "poison the well", prompt-injection spotter, agent anatomy and a security review, an analyze→act→observe stepper, a risk matrix, elephant & goldfish, a survivorship-bias simulator, NIST AI RMF and data-risk sorters, a mini eval arena, a token/energy/water calculator, a model right-sizer, an API-key-leak puzzle, an honor-code builder and a skill "smoke detector".
- **10 missions**: the assignments, paraphrased so you can do them on your own with real AI tools, with checklists.
- **Project studio**: principles, ethics-paired idea starters and a project canvas you can export.
- **Glossary** (66 terms), **readings by week**, an **ethical-AI tools** guide, a **journal** that collects your reflections (exportable as Markdown), and site-wide search (press `/`).

Everything a visitor types is saved only in their own browser (localStorage). There is no backend and no tracking, and nothing needs building.

> **Not affiliated with or endorsed by Stanford University.** Course materials are © Stanford University and the CS193T teaching team. This site paraphrases the course's public pages for study and links to the official lecture pages and slides throughout. The labs, quizzes, examples and glossary are original. Personal information about students and staff has deliberately been left out. Content reflects the public course site as of **November 11, 2026**; Weeks 9–10 had not been published yet.

## Run locally

ES modules need a web server (opening `index.html` directly from disk won't work):

```bash
python3 -m http.server 8193
```

Then open <http://localhost:8193>.

To work on a single lab in isolation, use the dev harness, e.g. <http://localhost:8193/dev/lab-harness.html?lab=eval-arena&theme=dark>.

## Project structure

```
index.html                  App shell (nav, footer, theme bootstrap)
assets/css/style.css        Design system (light/dark via CSS variables)
assets/js/app.js            Hash router, views, progress, quiz, journal, search
assets/js/data/
  modules.js                Course meta, lab registry, 8 modules (ideas, quizzes, reflections)
  assignments.js            10 missions
  glossary.js               Glossary terms
  resources.js              Readings, ethical tools, logistics, project studio content
assets/js/labs/
  _kit.js                   Shared helpers: h(), sorter(), slider(), chips(), store, toast…
  <lab-id>.js               One file per lab; each exports mount(el, ctx)
dev/lab-harness.html        Load any lab on its own for development
```

### Adding a lab

1. Create `assets/js/labs/my-lab.js` exporting `mount(el, ctx)`. `ctx` is `{ id, store, toast }`, and `store.get/set` persist to localStorage. Scope any CSS under `.lab-my-lab` using `injectStyle`, and use only the CSS variables so dark mode works.
2. Register it in `LABS` in `assets/js/data/modules.js`.
3. Add its id to a module's `labs` array (and optionally to a mission's `labs`).

Labs load lazily when they scroll into view, so adding more doesn't slow the first page load.

## Credits

The course is CS193T: Thinking with AI at Stanford University. Instructor: Cynthia Bailey. Head TA: Piper Fleming. CGOE coordinator: Elise Baumgartner. With the CS193T teaching assistants. See the [official course site](https://cs193t.stanford.edu) and the [Stanford Online listing](https://online.stanford.edu/courses/cs193t-thinking-ai-strategies-effective-and-ethical-human-ai-collaboration).

Research and estimates cited in the labs include: Liu et al. 2023 (*Lost in the Middle*), Xie et al. 2024 (*Adaptive Chameleon or Stubborn Sloth*), Vaswani et al. 2017, Liang et al. 2023 (bias in GPT detectors), the NIST AI RMF (2023), Dave Rensin's elephant-and-goldfish pattern, and the published energy estimates from Google, Epoch AI, MIT Technology Review and Hugging Face.
