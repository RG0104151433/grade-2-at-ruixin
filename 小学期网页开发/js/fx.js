/* ============================================================
   fx.js —— 双世界氛围粒子背景（纯 canvas，无外部依赖）
   现实 world-reality：灰败的尘埃缓缓下落
   绿洲 world-oasis  ：青蓝粒子上浮 + 霓虹地平线网格
   ============================================================ */
window.FX = (function () {
  const canvas = document.getElementById("fx-canvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, particles = [], raf = null, enabled = true;
  let world = "reality";

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    // 重设 canvas 尺寸会清空画布：若当前没有 RAF（减少动态 / 已禁用），立即重绘静态层，
    // 否则氛围层会一直空白到下次切屏。RAF 运行中则由下一帧自动补绘。
    if (!raf) paintStatic();
  }
  window.addEventListener("resize", resize);
  resize();

  function makeParticle() {
    if (world === "oasis") {
      return {
        x: Math.random() * W,
        y: H + Math.random() * 60,
        r: 0.6 + Math.random() * 1.8,
        vy: -(0.25 + Math.random() * 0.8),
        vx: (Math.random() - 0.5) * 0.25,
        a: 0.15 + Math.random() * 0.5,
        hue: Math.random() < 0.75 ? 187 : 45, // 青为主，偶尔金
      };
    }
    return {
      x: Math.random() * W,
      y: -10,
      r: 0.5 + Math.random() * 1.4,
      vy: 0.15 + Math.random() * 0.5,
      vx: (Math.random() - 0.5) * 0.2,
      a: 0.05 + Math.random() * 0.18,
      hue: 0,
    };
  }

  function seed(n) {
    particles = [];
    for (let i = 0; i < n; i++) {
      const p = makeParticle();
      p.y = Math.random() * H; // 初始铺满全屏
      particles.push(p);
    }
  }

  function drawGrid() {
    // 绿洲地平线透视网格
    const horizon = H * 0.72;
    ctx.strokeStyle = "rgba(0,229,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const y = horizon + (H - horizon) * Math.pow(t, 1.7);
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    const cx = W / 2;
    for (let i = -10; i <= 10; i++) {
      ctx.moveTo(cx + i * (W / 12), H);
      ctx.lineTo(cx + i * 40, horizon);
    }
    ctx.stroke();
    // 地平线光晕
    const g = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 6);
    g.addColorStop(0, "rgba(0,229,255,0)");
    g.addColorStop(1, "rgba(0,229,255,0.10)");
    ctx.fillStyle = g;
    ctx.fillRect(0, horizon - 60, W, 66);
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    if (world === "oasis") drawGrid();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      const dead = world === "oasis" ? p.y < -12 : p.y > H + 12;
      if (dead || p.x < -20 || p.x > W + 20) {
        particles[i] = makeParticle();
        continue;
      }
      ctx.beginPath();
      if (world === "oasis") {
        ctx.fillStyle = `hsla(${p.hue},100%,70%,${p.a})`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = `rgba(160,168,180,${p.a})`;
        ctx.shadowBlur = 0;
      }
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    raf = requestAnimationFrame(tick);
  }

  function prefersReduced() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }
  function start() {
    stop();
    seed(world === "oasis" ? 90 : 60);
    if (enabled && !prefersReduced()) raf = requestAnimationFrame(tick);
    else paintStatic();
  }
  function paintStatic() {
    ctx.clearRect(0, 0, W, H);
    if (world === "oasis") drawGrid();
  }
  function stop() { if (raf) cancelAnimationFrame(raf), (raf = null); }

  function setWorld(w) { world = w; start(); }
  function setEnabled(b) { enabled = b; start(); }

  return { setWorld, setEnabled };
})();
