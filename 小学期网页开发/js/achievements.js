/* ============================================================
   achievements.js —— 成就殿堂渲染与点亮
   数据来自 js/data/achievements.js；解锁状态存于每玩家存档。
   ============================================================ */
window.AchievementsUI = (function () {
  const grid = () => document.getElementById("ach-grid");
  const clueGrid = () => document.getElementById("clue-grid");

  function defs() { return window.ACHIEVEMENTS || []; }

  function render() {
    const unlocked = Store.getSave(App.user()).achievements;
    const en = window.I18N && I18N.lang === "en";
    grid().innerHTML = "";
    defs().forEach(a => {
      const card = document.createElement("div");
      card.className = "ach-card" + (unlocked.includes(a.id) ? " unlocked" : "");
      card.dataset.ach = a.id;
      const desc = en ? (a.desc_en || a.desc) : a.desc;
      const nameMain = en ? (a.en || a.name) : a.name;
      const nameSub = en ? "" : `<div class="ach-en">${Util.esc(a.en)}</div>`;
      card.innerHTML = `
        <div class="ach-icon">${a.icon}</div>
        <div class="ach-name">${Util.esc(nameMain)}</div>
        ${nameSub}
        <div class="ach-desc">${unlocked.includes(a.id) ? Util.esc(desc) : hintFor(a, en)}</div>
        <div class="ach-state">${unlocked.includes(a.id) ? I18N.t("ach_lit") : (a.type === "story" ? I18N.t("ach_locked_story") : I18N.t("ach_locked"))}</div>`;
      grid().appendChild(card);
    });
    updateCount();
    renderClues();
    renderReplay();
  }

  function renderClues() {
    const host = clueGrid();
    if (!host) return;
    const progress = Store.getProgress(App.user()) || {};
    const discovered = Array.isArray(progress.clues) ? progress.clues : [];
    const found = new Set(discovered.map(item => item && item.id).filter(Boolean));
    const definitions = (window.STORY_CONFIG && STORY_CONFIG.clues) || {};
    const definitionsList = Object.values(definitions);
    const slots = new Map();
    definitionsList.forEach(clue => {
      const slot = clue.archiveSlot || clue.id;
      if (!slots.has(slot)) slots.set(slot, []);
      slots.get(slot).push(clue);
    });
    const entries = Array.from(slots.values()).map(options =>
      options.find(clue => found.has(clue.id)) || options[0]
    );
    const en = window.I18N && I18N.lang === "en";
    host.innerHTML = "";
    entries.forEach(clue => {
      const unlocked = found.has(clue.id);
      const card = document.createElement("article");
      card.className = "clue-card" + (unlocked ? " discovered" : " locked");
      card.dataset.clue = clue.id;
      const title = en ? (clue.title_en || clue.title) : clue.title;
      const text = en ? (clue.text_en || clue.text) : clue.text;
      card.innerHTML = unlocked
        ? `<div class="clue-mark">◇</div><h4>${Util.esc(title)}</h4><p>${Util.esc(text)}</p><div class="clue-state">${I18N.t("archive_recorded")}</div>`
        : `<div class="clue-mark">·</div><h4>${I18N.t("archive_locked_title")}</h4><p>${I18N.t("archive_locked_text")}</p><div class="clue-state">${I18N.t("archive_missing")}</div>`;
      host.appendChild(card);
    });
    const count = document.getElementById("clue-count");
    if (count) count.textContent = `${entries.filter(clue => found.has(clue.id)).length}/${entries.length}`;
  }

  /* ---------- 结局回放 / 章节重玩（E8 · G11） ---------- */
  const REPLAY_CHAPTERS = ['home', 'oasis', 'library_gate', 'library', 'corridor', 'gold_approach', 'road', 'treasure', 'maze', 'palace'];
  function renderReplay() {
    const en = window.I18N && I18N.lang === 'en';
    const save = Store.getSave(App.user()) || {};
    const unlocked = Array.isArray(save.achievements) ? save.achievements : [];
    const endings = (window.STORY_CONFIG && STORY_CONFIG.endings) || {};
    const eHost = document.getElementById('ending-replay-list');
    if (eHost) {
      eHost.innerHTML = '';
      Object.keys(endings).forEach(id => {
        const e = endings[id];
        const ok = !!e.achievement && unlocked.includes(e.achievement);
        const b = document.createElement('button');
        b.className = 'replay-chip';
        b.type = 'button';
        b.disabled = !ok;
        b.dataset.ending = id;
        b.textContent = (en ? (e.name_en || e.name) : e.name) + (ok ? '' : ' · ' + I18N.t('replay_locked'));
        b.addEventListener('click', () => { if (ok) openReplay(pick(e, 'title'), pick(e, 'text')); });
        eHost.appendChild(b);
      });
    }
    const cHost = document.getElementById('chapter-replay-list');
    if (cHost) {
      cHost.innerHTML = '';
      const maps = (window.STORY_CONFIG && STORY_CONFIG.maps) || {};
      REPLAY_CHAPTERS.forEach(id => {
        const def = maps[id];
        if (!def) return;
        const b = document.createElement('button');
        b.className = 'replay-chip';
        b.type = 'button';
        b.dataset.chapter = id;
        b.textContent = en ? (def.name_en || def.name) : def.name;
        b.addEventListener('click', () => {
          const name = en ? (def.name_en || def.name) : def.name;
          if (!window.confirm(I18N.t('chapter_replay_confirm', { name }))) return;
          if (window.App && typeof App.replayChapter === 'function') App.replayChapter(id);
        });
        cHost.appendChild(b);
      });
    }
  }
  function openReplay(title, text) {
    const ov = document.getElementById('replay-overlay');
    if (!ov) return;
    const t = document.getElementById('replay-title');
    const p = document.getElementById('replay-text');
    if (t) t.textContent = title || '';
    if (p) p.textContent = text || '';
    ov.classList.remove('hidden');
    const c = document.getElementById('replay-close');
    if (c) c.focus();
  }
  function closeReplay() {
    const ov = document.getElementById('replay-overlay');
    if (ov) ov.classList.add('hidden');
  }

  function hintFor(a, en) {
    if (a.type !== "story") return Util.esc(I18N.t("ach_hint_locked"));
    return Util.esc((en ? a.hint_en : a.hint) || I18N.t("ach_hint_story"));
  }

  function updateCount() {
    const unlocked = Store.getSave(App.user()).achievements;
    const known = defs().map(a => a.id);
    const got = unlocked.filter(id => known.includes(id)).length;
    const total = defs().length;
    const el = document.getElementById("ach-count");
    if (el) el.textContent = `${got}/${total}`;
  }

  /* 被 App.unlockAchievement 调用：若正在成就页则播放点亮动画 */
  function markUnlocked(id) {
    updateCount();
    const card = grid() && grid().querySelector(`[data-ach="${id}"]`);
    if (card && !card.classList.contains("unlocked")) {
      render(); // 重绘拿到新状态
      const fresh = grid().querySelector(`[data-ach="${id}"]`);
      if (fresh) { fresh.classList.add("unlocked", "just-lit"); }
    }
  }

  function init() {
    App.onEnter("screen-achievements", render);
    const close = document.getElementById('replay-close');
    if (close) close.addEventListener('click', closeReplay);
    const ov = document.getElementById('replay-overlay');
    if (ov) ov.addEventListener('click', e => { if (e.target === ov) closeReplay(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeReplay(); });
  }

  return { init, render, renderClues, renderReplay, markUnlocked, updateCount };
})();
