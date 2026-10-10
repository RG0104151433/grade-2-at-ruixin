/* ============================================================
   intro.js —— 进入游戏后的 4 页信件式背景介绍（迁移自 gry 版）
   · 打字机逐字显示（速度受设置控制，可关闭）
   · 点击 / 空格 / 回车 / → 可手动快进；← 回看上一页
   · 打字机结束后自动停留片刻并连续进入下一页（验收要求：
     无需额外操作即可连续展示）；末页结束后自动开始游戏
   · 每页氛围色由 mood 决定（现实 → 绿洲 → 独照 → 彩蛋）
   · 读完点亮「往事见证者」→ 直接开始游戏（draft：进入 home）
   ============================================================ */
window.IntroUI = (function () {
  let idx = 0, typing = false, typeTimer = null, fullText = "", autoTimer = null;

  const stage = () => document.getElementById("intro-page");
  const tagEl = () => document.getElementById("intro-tag");
  const titleEl = () => document.getElementById("intro-title");
  const bodyEl = () => document.getElementById("intro-body");
  const dotsEl = () => document.getElementById("intro-dots");
  const screenEl = () => document.getElementById("screen-intro");

  function pages() { return window.INTRO_PAGES || []; }

  function renderDots() {
    dotsEl().innerHTML = pages()
      .map((_, i) => `<span class="${i === idx ? "on" : ""}"></span>`)
      .join("");
  }

  function type(text, done) {
    const s = SettingsUI.current();
    clearTimeout(typeTimer);
    if (!s.typewriter) { // 关闭打字机 → 一次性显示
      fullText = text;
      bodyEl().textContent = text;
      typing = false;
      done && done();
      return;
    }
    fullText = text;
    typing = true;
    let i = 0;
    const speed = Util.speedFor(s.textSpeed);
    const cursor = document.createElement("span");
    cursor.className = "cursor";

    (function step() {
      bodyEl().textContent = text.slice(0, i);
      bodyEl().appendChild(cursor);
      if (i <= text.length) {
        const ch = text[i - 1];
        i++;
        typeTimer = setTimeout(step, Util.punctDelay(ch, speed));
      } else {
        cursor.remove();
        typing = false;
        done && done();
      }
    })();
  }

  function finishTyping() {
    clearTimeout(typeTimer);
    bodyEl().textContent = fullText;
    typing = false;
  }

  /* 自动翻页：打字结束后停留片刻 → 下一页（末页 → 开始游戏）
     停留时长按本页文本长度换算（长文多留），取代固定 2600/1800ms。 */
  function scheduleAuto() {
    cancelAuto();
    const cur = idx;
    const len = (fullText || "").length;
    const delay = Math.max(1800, Math.min(6500, 900 + len * 60));
    autoTimer = setTimeout(() => {
      autoTimer = null;
      if (!window.App || App.currentScreen !== "screen-intro") return;
      if (cur !== idx) return;   // 期间已被手动翻页
      if (typing) finishTyping();
      next();
    }, delay);
  }
  function cancelAuto() {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  }

  function show(i) {
    idx = Math.max(0, Math.min(i, pages().length - 1));
    const p = pages()[idx];
    const en = window.I18N && I18N.lang === "en";
    const page = stage();
    page.classList.add("fading");
    setTimeout(() => {
      // 防护：260ms 延迟期间若已点「跳过」/离开序章屏，回调不得再把 #screen-intro 重新激活。
      if (!window.App || App.currentScreen !== "screen-intro") return;
      screenEl().className = `screen active mood-${p.mood || "oasis"}`;
      tagEl().textContent = p.tag || "";
      titleEl().textContent = (en ? (p.title_en || p.title) : p.title) || "";
      renderDots();
      type((en ? (p.body_en || p.body) : p.body) || "", scheduleAuto);
      page.classList.remove("fading");
    }, 260);
  }

  function next() {
    cancelAuto();
    if (typing) { finishTyping(); return; }        // 打字中 → 先补全本页
    if (idx < pages().length - 1) {
      Audio2.page();
      show(idx + 1);
    } else {
      finish();
    }
  }
  function prev() {
    cancelAuto();
    if (idx > 0) { Audio2.page(); show(idx - 1); }
  }

  function completeIntro() {
    Store.updateSave(App.user(), s => { s.introRead = true; });
  }

  /* draft：读完背景信后直接开始游戏（进入 叠楼区 · 家）。
     走 beginRun()：只清界面并加载起始关，不清进度——
     否则刚写入的 introRead=true 会被 newGame→save.reset() 清回 false。 */
  function startGame() {
    if (!window.game) { if (window.App) App.go("screen-menu"); return; }
    if (window.App && typeof App.go === "function") App.go("screen-game");
    if (typeof window.game.beginRun === "function") window.game.beginRun();
    else if (typeof window.game.newGame === "function") window.game.newGame();
  }

  function finish() {
    completeIntro();
    App.toast(I18N.t("toast_intro_done"));
    startGame();
  }

  function init() {
    /* 点击进入下一页 */
    document.getElementById("intro-stage").addEventListener("click", () => { Audio2.click(); next(); });

    /* 跳过按钮 → 标记已读 → 直接开始游戏 */
    document.getElementById("intro-skip").addEventListener("click", e => {
      e.stopPropagation();
      cancelAuto();
      clearTimeout(typeTimer);
      completeIntro();
      startGame();
    });

    /* 键盘操作 */
    window.addEventListener("keydown", e => {
      if (App.currentScreen !== "screen-intro") return;
      if ([" ", "Enter", "ArrowRight"].includes(e.key)) { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    });

    App.onEnter("screen-intro", () => {
      const s = Store.getSave(App.user());
      if (s.introRead && s.settings.skipReadIntro) {
        /* 已读背景 + 跳过已读 → 直接开始游戏 */
        startGame();
        return;
      }
      show(0);
    });
    /* 离开时停止打字与自动翻页 */
    App.onLeave("screen-intro", () => { clearTimeout(typeTimer); typing = false; cancelAuto(); });
  }

  return { init };
})();
