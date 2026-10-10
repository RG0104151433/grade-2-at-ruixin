/* ============================================================================
 * engine/dialog.js —— 对话系统
 * ----------------------------------------------------------------------------
 * 对白解析（【说话人】正文）、说话人色调与立绘、打字机逐字显示、
 * 点击/按键推进、多选项选择。
 * 依赖：core.js 的 clamp、Util.punctDelay、SettingsUI / I18N（外壳层）。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 963-1138 行）。方法体未作任何改动；
 * 整段搬运，未作任何改动。
 * ==========================================================================*/
'use strict';
/* --------------------------- 说话者映射表 --------------------------------
   对白文本里的【…】就是说话者名，它随文本一起显示在对话框左上角。
   英文界面下必须经本表转换，否则说话者仍是中文。
   同时承载色调与立绘 —— 三者同源，避免出现「名字换了颜色没换」的错位。
   改动前注意：新增说话人时三处一起加，否则英文界面会漏显示英文名。 */
const SPEAKERS = {
  '旁白': { en: 'Narrator', tone: 'tone-sys', portrait: '' },
  '系统': { en: 'System', tone: 'tone-sys', portrait: '' },
  '埃尔': { en: 'El', tone: 'tone-el', portrait: 'image/player_front_id.png' },
  '莫罗': { en: 'Morrow', tone: 'tone-morrow', portrait: 'image/moro_avatar_front.png' },
  '哈里迪': { en: 'Halliday', tone: 'tone-halliday', portrait: 'image/halliday.png' },
  '哈里迪·残响': { en: "Halliday's Echo", tone: 'tone-halliday', portrait: 'image/halliday.png' },
  '阿尔忒弥斯': { en: 'Art3mis', tone: 'tone-el', portrait: 'image/art3mis_pixel.png' },
  '诺兰': { en: 'Nolan', tone: 'tone-halliday', portrait: 'image/nolan.png' },
  /* 2026-09-20 补登记：以下五个说话人此前只出现在对白文本里、未进本表，
     导致英文界面下名字仍是中文（且拿不到对应色调/立绘）。均为文档/记录类音源，
     除莫罗·残响外不配立绘（保留灰色圆球，读作「非现场人物」）。 */
  '档案': { en: 'Archive', tone: 'tone-sys', portrait: '' },
  '档案索引': { en: 'Archive Index', tone: 'tone-sys', portrait: '' },
  '系统记录': { en: 'System Log', tone: 'tone-sys', portrait: '' },
  '母亲·维修日志': { en: 'Mother · Repair Log', tone: 'tone-sys', portrait: '' },
  '莫罗·残响': { en: "Morrow's Echo", tone: 'tone-morrow', portrait: 'image/moro_avatar_front.png' },
};
/* 说话者名 → 英文名。由 SPEAKERS 派生，保证单一真值。
   未登记的说话人回退中文名（pickText 的第二参为 undefined 时取中文）。 */
const SPEAKER_EN = {};
for (const k of Object.keys(SPEAKERS)) SPEAKER_EN[k] = SPEAKERS[k].en;
/* 反向表：英文说话者名 → 规范键。
   英文对白写作 `[El] …` / `[Halliday's Echo] …`，解析后映射回中文规范键，
   从而与中文版共用同一套色调、立绘与译名（避免英文版只剩灰色圆球）。 */
const SPEAKER_BY_EN = {};
for (const k of Object.keys(SPEAKERS)) SPEAKER_BY_EN[SPEAKERS[k].en] = k;
/* 说话人 → 提示音音色（对话行开头播放，随角色区分） */
function speakerVoice(speaker) {
  if (speaker === '埃尔') return 'el';
  if (speaker === '莫罗') return 'morrow';
  if (speaker === '哈里迪') return 'halliday';
  if (speaker === '哈里迪·残响') return 'echo';
  if (speaker === '系统') return 'sys';
  if (speaker === '旁白') return 'narrator';
  return '';
}

/* ------------------------------- 对话系统 -------------------------------- */
class Dialog {
  constructor(engine) {
    this.engine = engine;
    this.el = document.getElementById('dialog');
    this.nameEl = document.getElementById('dialog-name');
    this.textEl = document.getElementById('dialog-text');
    this.arrow = document.getElementById('dialog-continue');
    this.choiceEl = document.getElementById('choice');
    this.choicePrompt = document.getElementById('choice-prompt');
    this.choiceOptions = document.getElementById('choice-options');
    // 取消语义：每次 show/choose 期间若 epoch 变化（被 cancel），旧的等待立即收尾。
    this._epoch = 0;
    this._wakeAdvance = null;
    this._wakeChoice = null;
    // 「补全」后短暂屏蔽推进，避免同一次点击/按键既补全又推进。
    this._advanceBlockUntil = 0;
  }
  _now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  /* 取消当前对白/选项：关闭界面，并让挂起的 await 立即结束。
     由统一退出 leaveGame() 调用；调用后旧的 show/choose 不会再写回界面。 */
  cancel() {
    this._epoch++;
    this.arrow.classList.remove('blink');
    this.el.classList.add('hidden');
    if (this.choiceEl) this.choiceEl.classList.add('hidden');
    const wa = this._wakeAdvance; this._wakeAdvance = null; if (wa) wa();
    const wc = this._wakeChoice; this._wakeChoice = null; if (wc) wc();
    this.textEl.textContent = '';
    this.textEl.classList.remove('typing');
    this.nameEl.textContent = '';
    this.applyPortrait('tone-sys');
  }
  /* 说话人 → 色调。按映射表查，不再用字符串包含猜
     （旧实现 s.includes('El') 会把任何含 "El" 的人名误判成埃尔）。 */
  speakerTone(speaker) {
    const s = (speaker || '').trim();
    const rec = SPEAKERS[s];
    return rec ? rec.tone : 'tone-sys';
  }
  /* 对话框左侧立绘头像（真值在 SPEAKERS.portrait）：埃尔=player_front_id.png、
     阿尔忒弥斯=art3mis_pixel.png、哈里迪=halliday.png、莫罗=moro_avatar_front.png、
     诺兰=nolan.png；图片压缩进原本的方块框。
     旁白/系统（及其他未配图的人）保持原来的灰色圆球不变。 */
  applyPortrait(toneOrSpeaker) {
    const box = document.getElementById('dialog-portrait');
    if (!box) return;
    const rec = SPEAKERS[toneOrSpeaker];
    const img = rec ? rec.portrait
              : toneOrSpeaker === 'tone-halliday' ? 'image/halliday.png'
              : toneOrSpeaker === 'tone-el' ? 'image/player_front_id.png'
              : '';
    if (img) {
      box.style.backgroundImage = "url('" + img + "')";
      box.classList.add('img');
    } else {
      box.style.backgroundImage = '';
      box.classList.remove('img');
    }
  }
  // 读取当前玩家设置的文字速度（slow/normal/fast → 90/55/28ms）
  getSpeed() {
    try {
      const s = (window.SettingsUI && typeof SettingsUI.current === 'function')
        ? SettingsUI.current() : {};
      const map = { slow: 90, normal: 55, fast: 28 };
      return map[s.textSpeed] != null ? map[s.textSpeed] : 55;
    } catch (e) { return 55; }
  }
  isTypewriterOn() {
    try {
      const s = (window.SettingsUI && typeof SettingsUI.current === 'function')
        ? SettingsUI.current() : {};
      return s.typewriter !== false;
    } catch (e) { return true; }
  }
  parse(raw) {
    if (raw && raw[0] === '【') {
      const end = raw.indexOf('】');
      if (end > 0) return { speaker: raw.slice(1, end), text: raw.slice(end + 1).replace(/^\s+/, '') };
    }
    // 英文对白用 [El] / [Halliday's Echo] 前缀：能识别的说话人走规范键，
    // 使其与中文版一样把名字渲染到上方、并显示对应立绘；识别不了则整体作为正文。
    if (raw && raw[0] === '[') {
      const end = raw.indexOf(']');
      if (end > 0) {
        const enName = raw.slice(1, end).trim();
        if (SPEAKER_BY_EN[enName]) return { speaker: SPEAKER_BY_EN[enName], text: raw.slice(end + 1).replace(/^\s+/, '') };
      }
    }
    return { speaker: '', text: raw || '' };
  }
  isAdvanceKey(e) {
    return e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e';
  }
  /* opts.autoAdvance（毫秒）：文字显示完后自动推进；期间玩家仍可按 Enter/点击提前推进。
     不传时保持原行为（必须等待玩家确认）。 */
  async show(lines, opts) {
    lines = Array.isArray(lines) ? lines : [lines];
    const epoch = this._epoch;
    this.el.classList.remove('hidden');
    let lastSpk = null;
    for (const raw of lines) {
      if (epoch !== this._epoch) return;   // 已被 cancel()：停止推进
      const { speaker, text } = this.parse(raw);
      // 应用角色色调 + 左侧立绘头像（旁白保持灰色圆球）
      this.el.classList.remove('tone-el', 'tone-halliday', 'tone-sys');
      const tone = this.speakerTone(speaker);
      this.el.classList.add(tone);
      this.applyPortrait(speaker || tone);
      // 英文界面下说话者名走 SPEAKER_EN；未登记的说话人回退中文
      this.nameEl.textContent = pickText(speaker, SPEAKER_EN[speaker]);
      // 说话人提示音：仅在说话人变化时响一次，避免每句都重复
      if (speaker && speaker !== lastSpk && window.Audio2 && Audio2.voice) {
        Audio2.voice(speakerVoice(speaker));
      }
      lastSpk = speaker;
      await this.typewriter(text);
      if (epoch !== this._epoch) return;
      await this.waitAdvance(opts && opts.autoAdvance);
    }
    if (epoch !== this._epoch) return;
    this.nameEl.textContent = '';
    this.textEl.textContent = '';
    this.textEl.classList.remove('typing');
    this.applyPortrait('tone-sys');   // 关闭对话时清空立绘头像
    this.el.classList.add('hidden');
  }
  /* 打字机：逐字显示，受统一暂停信号控制（暂停时冻结、恢复后继续）。
     点击/确认键可立即补全全文；被 cancel() 时立即停止且不再写回。 */
  async typewriter(text) {
    this.textEl.textContent = '';
    const epoch = this._epoch;
    const useTw = this.isTypewriterOn();
    const base = this.getSpeed();
    // 关闭打字机时直接显示全文
    if (!useTw) {
      this.textEl.textContent = text;
      this.textEl.classList.remove('typing');
      return;
    }
    this.textEl.classList.add('typing');
    let skip = false;
    // 点击或确认键 → 补全本句；并短暂屏蔽推进，避免同一次操作连跳。
    const complete = () => { skip = true; this._advanceBlockUntil = this._now() + 140; };
    const onKey = e => { if (this.isAdvanceKey(e)) complete(); };
    const onClick = () => complete();
    document.addEventListener('keydown', onKey);
    this.el.addEventListener('click', onClick);
    try {
      for (let i = 0; i < text.length; i++) {
        if (skip || epoch !== this._epoch) break;
        const ch = text[i];
        this.textEl.textContent = text.slice(0, i + 1);
        // 句读停顿：句号/换行×6，逗号等×3；走统一的暂停感知延时
        const d = (window.Util && Util.punctDelay) ? Util.punctDelay(ch, base) : base;
        await Pause.after(d);
        if (epoch !== this._epoch) return;   // 取消：不再继续写
      }
      if (epoch === this._epoch) this.textEl.textContent = text;
    } finally {
      this.textEl.classList.remove('typing');
      document.removeEventListener('keydown', onKey);
      this.el.removeEventListener('click', onClick);
    }
  }
  waitAdvance(autoMs) {
    return new Promise(resolve => {
      const epoch = this._epoch;
      this.arrow.classList.add('blink');
      let timer = null;
      const cleanup = () => {
        this.arrow.classList.remove('blink');
        document.removeEventListener('keydown', onKey);
        this.el.removeEventListener('click', onClick);
        if (timer != null) { clearTimeout(timer); timer = null; }
        if (wake && this._wakeAdvance === wake) this._wakeAdvance = null;
      };
      const done = () => { if (epoch !== this._epoch) return; cleanup(); resolve(); };
      const onKey = e => { if (Pause.paused || this._now() < this._advanceBlockUntil) return; if (this.isAdvanceKey(e)) done(); };
      const onClick = () => { if (Pause.paused || this._now() < this._advanceBlockUntil) return; done(); };
      const wake = () => { cleanup(); resolve(); };
      this._wakeAdvance = wake;
      document.addEventListener('keydown', onKey);
      this.el.addEventListener('click', onClick);
      // 自动推进：文字显示完后计时；暂停时不计时，恢复后重新计时
      if (autoMs != null && autoMs >= 0) {
        const arm = () => {
          timer = setTimeout(() => {
            timer = null;
            if (epoch !== this._epoch) return;
            if (Pause.paused) { arm(); return; }
            done();
          }, autoMs);
        };
        arm();
      }
    });
  }
  choose(prompt, options) {
    return new Promise(resolve => {
      const epoch = this._epoch;
      const prevFocus = document.activeElement;   // 关闭后还原焦点（B4c）
      this.choicePrompt.textContent = prompt;
      this.choiceOptions.innerHTML = '';
      this.choiceEl.classList.remove('hidden');
      let focused = 0;
      const btns = [];
      let wake = null;
      const cleanup = () => {
        document.removeEventListener('keydown', onKey);
        this.choiceEl.classList.add('hidden');
        if (wake && this._wakeChoice === wake) this._wakeChoice = null;
        // 关闭后把真实焦点还给打开前的元素（B4c）
        if (prevFocus && typeof prevFocus.focus === 'function') { try { prevFocus.focus(); } catch (e) {} }
      };
      const finish = idx => { if (epoch !== this._epoch) return; cleanup(); resolve(idx); };
      options.forEach((label, idx) => {
        const b = document.createElement('button');
        b.className = 'choice-btn';   // 初始不高亮：两行均为黑色底，玩家选择后才变浅蓝
        b.textContent = label;
        b.addEventListener('click', () => {
          if (window.Audio2 && Audio2.click) Audio2.click();
          finish(idx);
        });
        this.choiceOptions.appendChild(b);
        btns.push(b);
      });
      const setFocus = i => {
        focused = clamp(i, 0, btns.length - 1);
        btns.forEach((b, j) => b.classList.toggle('focused', j === focused));
        if (btns[focused] && typeof btns[focused].focus === 'function') { try { btns[focused].focus(); } catch (e) {} }
        if (window.Audio2 && Audio2.hover) Audio2.hover();
      };
      // 打开即把真实焦点放到第一个选项（键盘/读屏可用），不额外发声
      if (btns[0] && typeof btns[0].focus === 'function') { try { btns[0].focus(); } catch (e) {} }
      function onKey(e) {
        if (Pause.paused) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { setFocus(focused + 1); e.preventDefault(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { setFocus(focused - 1); e.preventDefault(); }
        else if (e.key === 'Enter') {
          if (window.Audio2 && Audio2.click) Audio2.click();
          finish(focused);
        } else {
          const n = parseInt(e.key, 10);
          if (n >= 1 && n <= options.length) finish(n - 1);
        }
      }
      wake = () => { cleanup(); resolve(-1); };
      this._wakeChoice = wake;
      document.addEventListener('keydown', onKey);
    });
  }
}

