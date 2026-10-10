/* ============================================================
   audio.js —— 无音频文件依赖的 WebAudio 合成音效
   （原型阶段用合成音占位；正式配乐后续放入 assets/ 再替换）
   音量跟随设置：masterVolume × sfxVolume / bgmVolume

   结构：
     · 短音效 tone(freq,dur,type,vol,when) —— 单/多音提示
     · noise(dur,vol,freq,q)               —— 噪声突发（爆炸/风/故障）
     · BGM：两套持续音垫（oasis 清亮 / reality 低沉），
       并可按关卡 mood 改振荡器频率、滤波与风噪层
   所有函数在无 WebAudio 环境（含无头测试）下静默降级，返回空操作。
   ============================================================ */
window.Audio2 = (function () {
  let ctx = null;
  let settings = { masterVolume: 80, bgmVolume: 70, sfxVolume: 80 };
  let bgmNodes = null;
  let bgmKind = null;
  let bgmMood = 'default';
  let noiseBuf = null;
  // G7：首次用户手势前不创建 AudioContext（避免浏览器 "AudioContext was not allowed to start" 反复告警）；
  // 手势解锁后惰性创建；解锁前请求的 BGM 先记下，解锁时补启动。
  let unlocked = false;
  let warnedResume = false;
  let pendingBgm = null;

  function ensure() {
    if (!ctx && unlocked) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === "suspended") {
      try { const p = ctx.resume(); if (p && typeof p.catch === 'function') p.catch(() => {}); }
      catch (e) { warnedResume = true; }
    }
    return ctx;
  }
  function unlockAudio() {
    if (unlocked) { ensure(); return; }
    unlocked = true;
    ensure();
    if (pendingBgm) { const k = pendingBgm; pendingBgm = null; if (typeof api.bgmStart === 'function') api.bgmStart(k); }
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('pointerdown', unlockAudio, true);
      window.removeEventListener('keydown', unlockAudio, true);
      window.removeEventListener('touchstart', unlockAudio, true);
    }
  }
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pointerdown', unlockAudio, true);
    window.addEventListener('keydown', unlockAudio, true);
    window.addEventListener('touchstart', unlockAudio, true);
  }
  function update(s) { settings = s; if (bgmNodes) applyBgmGain(); }

  function sfxGain() { return (settings.masterVolume / 100) * (settings.sfxVolume / 100); }

  function tone(freq, dur, type, vol, when) {
    const c = ensure(); if (!c) return;
    const g = sfxGain(); if (g <= 0) return;
    try {
      const t = c.currentTime + (when || 0);
      const osc = c.createOscillator();
      const amp = c.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, (vol || 0.2) * g), t + 0.015);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(amp).connect(c.destination);
      osc.start(t); osc.stop(t + dur + 0.05);
    } catch (e) {}
  }

  // 噪声突发：爆炸 / 风 / 数据故障
  function noise(dur, vol, freq, q) {
    const c = ensure(); if (!c) return;
    const g = sfxGain(); if (g <= 0) return;
    try {
      if (!noiseBuf) {
        const len = Math.floor(c.sampleRate * 2);
        noiseBuf = c.createBuffer(1, len, c.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      const t = c.currentTime;
      const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = c.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = freq || 800; f.Q.value = q || 0.8;
      const amp = c.createGain();
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, (vol || 0.15) * g), t + 0.01);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(amp).connect(c.destination);
      src.start(t); src.stop(t + dur + 0.05);
    } catch (e) {}
  }

  const api = {
    update,
    /* ---------- 基础 / 菜单 ---------- */
    click()  { tone(660, 0.08, "triangle", 0.12); },
    hover()  { tone(1200, 0.04, "sine", 0.04); },
    page()   { tone(420, 0.12, "sine", 0.1); tone(560, 0.12, "sine", 0.08, 0.05); },
    error()  { tone(180, 0.25, "sawtooth", 0.1); },
    success(){ tone(523, 0.12, "triangle", 0.14); tone(659, 0.12, "triangle", 0.14, 0.09); tone(784, 0.2, "triangle", 0.16, 0.18); },
    /* ---------- 跑酷 / 平台跳跃 ---------- */
    jump()   { tone(440, 0.12, "square", 0.1); tone(660, 0.1, "square", 0.08, 0.04); },
    dash()   { tone(300, 0.18, "sawtooth", 0.12); tone(900, 0.12, "sine", 0.06, 0.02); },
    land()   { tone(140, 0.1, "sine", 0.14); },
    coin()   { tone(880, 0.08, "square", 0.1); tone(1320, 0.1, "square", 0.08, 0.05); },
    hurt()   { tone(200, 0.2, "sawtooth", 0.12); tone(120, 0.25, "sine", 0.1, 0.05); },
    achievement() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, "triangle", 0.16, i * 0.11));
      tone(2093, 0.6, "sine", 0.05, 0.5);
    },
    /* ---------- 叙事高光 ---------- */
    // 获得钥匙：三把逐级升高（G4/C5/E5）+ 金属泛音
    keyGain(i) {
      const base = [392, 523, 659][Math.min(Math.max(i || 1, 1), 3) - 1];
      tone(base, 0.28, "triangle", 0.16);
      tone(base * 2, 0.5, "sine", 0.08, 0.02);
      tone(base * 3, 0.6, "sine", 0.04, 0.06);
    },
    // 集齐三钥：低音铺底 + 叠加和弦
    threeKeys() {
      tone(130.8, 1.6, "sine", 0.08, 0);
      [261.6, 329.6, 392.0, 523.3].forEach((f, i) => tone(f, 1.4, "triangle", 0.09, i * 0.05));
    },
    // 技能习得：两音上行，按技能换音高
    skill(kind) {
      const f = { shift: 740, dissolve: 620, doubleJump: 880 }[kind] || 700;
      tone(f, 0.1, "triangle", 0.12);
      tone(f * 1.5, 0.18, "triangle", 0.1, 0.07);
    },
    // 章节过渡卡：数据脉冲，按 KEY I/II/III 升根音（无 key 的过渡关用 i=0）
    chapter(i) {
      const base = [196, 220, 262][Math.min(Math.max(i || 1, 1), 3) - 1];
      tone(base, 0.5, "sine", 0.08);
      tone(base * 2, 0.7, "sine", 0.05, 0.05);
      noise(0.25, 0.04, 1800, 1.2);
    },
    // 存档点确认音（章节卡上的 CHECKPOINT SAVED）
    checkpoint() { tone(880, 0.1, "sine", 0.06); tone(1174, 0.22, "sine", 0.05, 0.08); },
    // 说话人提示音（对话行开头，按角色音色区分）
    voice(kind) {
      const m = {
        el: [720, "sine", 0.05], morrow: [320, "triangle", 0.05], halliday: [200, "sawtooth", 0.05],
        echo: [150, "sawtooth", 0.05], sys: [520, "square", 0.04], narrator: [300, "sine", 0.03],
      }[kind];
      if (m) tone(m[0], 0.07, m[1], m[2]);
    },
    uiOpen()  { tone(520, 0.1, "sine", 0.08); tone(780, 0.16, "sine", 0.06, 0.06); },
    uiClose() { tone(700, 0.1, "sine", 0.07); tone(460, 0.16, "sine", 0.06, 0.06); },
    /* ---------- 死亡 / 结局 ---------- */
    die()        { tone(220, 0.5, "sawtooth", 0.1); tone(110, 0.9, "sine", 0.1, 0.05); noise(0.4, 0.06, 300, 0.7); },
    lostEnding() { tone(110, 2.2, "sine", 0.09); tone(82.4, 2.6, "sine", 0.08, 0.1); noise(1.6, 0.04, 220, 0.6); },
    ending(kind) {
      if (kind === "inherit") {   // 表面圆满、内核孤独：空五度 + 悬置高音
        tone(110, 2.6, "sine", 0.1);
        tone(164.8, 2.6, "sine", 0.07, 0.02);
        tone(233.1, 3.0, "sine", 0.05, 0.15);
      } else {                    // 回到现实：温暖大三和弦
        [261.6, 329.6, 392.0].forEach((f, i) => tone(f, 2.4, "triangle", 0.09, i * 0.04));
        tone(523.3, 2.8, "sine", 0.05, 0.2);
      }
    },
    /* ---------- 小游戏 ---------- */
    move()    { tone(520, 0.03, "square", 0.05); },
    rotate()  { tone(700, 0.05, "square", 0.06); },
    hardDrop(){ tone(180, 0.14, "sawtooth", 0.1); noise(0.1, 0.05, 500, 0.7); },
    lineClear(n) {
      n = Math.max(1, n || 1);
      for (let i = 0; i < n; i++) tone(523 * Math.pow(1.1225, i), 0.16, "triangle", 0.12, i * 0.06);
      tone(1046, 0.3, "sine", 0.05, n * 0.06);
    },
    gameOver() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, "triangle", 0.12, i * 0.12)); },
    reveal(n)  { tone(n ? 420 + n * 70 : 900, 0.05, "sine", 0.06); },
    flag()     { tone(1046, 0.05, "square", 0.06); },
    explode()  { noise(0.7, 0.2, 160, 0.5); tone(60, 0.8, "sawtooth", 0.12); },
    turn()     { tone(600, 0.03, "square", 0.04); },
  };

  /* ---------- BGM：两套音垫 + 关卡 mood ---------- */
  const MOODS = {
    default:   { o1: 55, o2: 110.5, cut: 320, wind: 0.0 },
    wasteland: { o1: 49, o2: 98,    cut: 260, wind: 0.05 },
    library:   { o1: 55, o2: 165,   cut: 420, wind: 0.0 },
    road:      { o1: 55, o2: 110,   cut: 340, wind: 0.015 },
    maze:      { o1: 51, o2: 116,   cut: 240, wind: 0.04 },
    vortex:    { o1: 45, o2: 96,    cut: 520, wind: 0.07 },
    palace:    { o1: 41, o2: 82.4,  cut: 200, wind: 0.02 },
  };
  function bgmGainValue() { return (settings.masterVolume / 100) * (settings.bgmVolume / 100) * 0.05; }
  function applyBgmGain() {
    if (!bgmNodes || !ctx) return;
    try { bgmNodes.gain.gain.setTargetAtTime(bgmGainValue(), ctx.currentTime, 0.6); } catch (e) {}
  }
  function makeNoiseBuf(c) {
    const len = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function applyMood(mood) {
    if (!bgmNodes || !ctx) return;
    const m = MOODS[mood] || MOODS.default;
    try {
      bgmNodes.o1.frequency.setTargetAtTime(m.o1, ctx.currentTime, 0.8);
      bgmNodes.o2.frequency.setTargetAtTime(m.o2, ctx.currentTime, 0.8);
      bgmNodes.filter.frequency.setTargetAtTime(m.cut, ctx.currentTime, 0.8);
      bgmNodes.windGain.gain.setTargetAtTime(m.wind * bgmGainValue() * 6, ctx.currentTime, 1.0);
    } catch (e) {}
  }
  api.bgmStart = function (kind) {
    kind = kind || "oasis";
    if (!unlocked) { pendingBgm = kind; return; }   // G7：首次手势解锁后再启动
    const c = ensure(); if (!c) return;
    if (bgmNodes && bgmKind === kind) return;
    if (bgmNodes) api.bgmStop();
    try {
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      const o1 = c.createOscillator(), o2 = c.createOscillator();
      filter.type = "lowpass";
      if (kind === "reality") {
        filter.frequency.value = 180;
        o1.type = "sawtooth"; o1.frequency.value = 41.2;   // E1
        o2.type = "sine";     o2.frequency.value = 82.4;
      } else {
        filter.frequency.value = 320;
        o1.type = "sawtooth"; o1.frequency.value = 55;     // A1
        o2.type = "sine";     o2.frequency.value = 110.5;
      }
      o1.connect(filter); o2.connect(filter); filter.connect(gain).connect(c.destination);
      // 风 / 数据噪层：默认静音，由关卡 mood 打开
      const windSrc = c.createBufferSource(); windSrc.buffer = makeNoiseBuf(c); windSrc.loop = true;
      const windFilter = c.createBiquadFilter(); windFilter.type = "bandpass"; windFilter.frequency.value = 600; windFilter.Q.value = 0.6;
      const windGain = c.createGain(); windGain.gain.value = 0;
      windSrc.connect(windFilter).connect(windGain).connect(gain);
      o1.start(); o2.start(); windSrc.start();
      bgmNodes = { gain, filter, o1, o2, windGain, windSrc };
      bgmKind = kind;
      if (kind === "oasis") applyMood(bgmMood);
      applyBgmGain();
    } catch (e) { bgmNodes = null; bgmKind = null; }
  };
  api.bgmSetMood = function (mood) {
    bgmMood = mood || "default";
    if (bgmKind === "oasis") applyMood(bgmMood);
  };
  api.bgmStop = function () {
    if (!bgmNodes || !ctx) { bgmNodes = null; bgmKind = null; return; }
    const n = bgmNodes; bgmNodes = null; bgmKind = null;
    try {
      n.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
      setTimeout(() => { try { n.o1.stop(); n.o2.stop(); n.windSrc.stop(); } catch (e) {} }, 1200);
    } catch (e) {}
  };

  return api;
})();
