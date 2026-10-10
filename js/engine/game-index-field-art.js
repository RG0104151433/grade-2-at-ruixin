/* ============================================================================
 * engine/game-index-field-art.js —— Game 方法组 · 遗失索引场画面（纯渲染）
 * ----------------------------------------------------------------------------
 * 三段结构的「非瓦片」画面，全部程序化绘制、零新增素材、零中文字面量
 * （提示词一律走触发器 label / 对白，由 DOM 层渲染）：
 *   · 扫描终端（col25–29 台面）：圆形琥珀金扫描环 + 蓝紫悬浮颗粒 + 地面投影；
 *   · 安全桥（col31–48 row13，扫描成功后才有实体）：2/3 格整件拼接，
 *     road（数据道路件）/ gantry（检修桁架件）交替；上方一条流动的「记录光」；
 *   · 出口感应区（col48–51）：**不摆任何方块**——锁定态＝暗琥珀虚线 + 呼吸扫描弧；
 *     开放态＝暖金/紫光光幕从跑道线升起 + 上升光点（走到即自动通过）。
 * 素材不可用时的回退：零件图缺失 → 结构化面板（顶面亮缘 / 侧壁暗部 / 接触阴影 /
 *   桁架支撑），**绝不回退成纯色方块**；与 game-platform-art.js 的三态回退同口径。
 * 边界：只画不改 —— 不碰碰撞数组、玩家物理、存档、触发器。
 * 加载：class Game（game.js）之后（方法组），与 game-index-field.js 同批。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  /* 紫蓝舞池色板（与 game-tile-shapes.js 的 treasure 主题同源） */
  const P = {
    deck: '#241a4a', deckLit: '#2e2159', top: '#6e50d6',
    topHi: 'rgba(216,198,255,0.55)', side: '#140e2c',
    sideLit: 'rgba(168,142,255,0.28)', shadow: 'rgba(6,3,16,0.5)',
    support: '#3a2f5c', supportLit: '#5a4b8c',
    amber: '#ffcf7a', amberSoft: 'rgba(255,207,122,0.35)',
    violet: '#8f6bff', cyan: '#5ce0ff', ink: '#100c22',
  };
  const nowMs = () => (typeof performance !== 'undefined' && performance.now)
    ? performance.now() : Date.now();

  Object.assign(Game.prototype, {
    /* ------------------------------- 总入口 ------------------------------- */
    /* 由 render() 在瓦片/触发点之后调用；非本关立即返回（零开销） */
    drawIndexField() {
      if (!this.indexFieldOn || !this.indexFieldOn()) return;
      const cfg = this.indexFieldCfg();
      if (!cfg) return;
      try {
        if (this.indexBridgeMounted && this.indexBridgeMounted()) this.drawIndexBridge(cfg);
        this.drawIndexTerminal(cfg);
        this.drawIndexExit(cfg);
        this.drawIndexOneways();   // 2026-09-20：单向薄板的顶面高光（区分可跳穿 / 实心）
      } catch (e) { /* 渲染异常静默：不打断本帧 */ }
    },

    /* --------------------- 单向薄板顶面高光（2026-09-20） ---------------------
       本关新增的 oneway 中继板与实心平台共用同一套零件图，外观无法自行区分。
       这里在顶面叠一条青色光带 + 两端短竖线：一眼看出「这块可以从下面跳穿」。 */
    drawIndexOneways() {
      const L = this.level;
      if (!L || !L.oneways || !L.oneways.length) return;
      const ctx = this.ctx, cam = this.camera;
      if (!ctx || !cam) return;
      for (const t of L.oneways) {
        const p = cam.toScreen(t.x, t.y);
        if (p.x + t.w < -40 || p.x > this.viewW + 40 || p.y + t.h < -40 || p.y > this.viewH + 40) continue;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#5ef0e0';
        ctx.fillRect(p.x, p.y, t.w, 2.5);
        ctx.globalAlpha = 0.45;
        ctx.fillRect(p.x, p.y, 1.5, t.h * 0.55);
        ctx.fillRect(p.x + t.w - 1.5, p.y, 1.5, t.h * 0.55);
        ctx.restore();
      }
    },

    /* ------------------------------ 安全桥 ------------------------------ */
    /* 每段用对应 2/3 格整件绘制（road/gantry 交替）；图片未就绪走结构化回退。 */
    drawIndexBridge(cfg) {
      const plan = this.indexBridgePlan ? this.indexBridgePlan() : [];
      if (!plan.length) return;
      const ctx = this.ctx, T = this.tile, cam = this.camera;
      const row = cfg.bridgeRow != null ? cfg.bridgeRow : 13;
      const y0 = row * T;
      const t = nowMs();
      for (const seg of plan) {
        const wx = seg.col * T, w = seg.w * T;
        const p = cam.toScreen(wx, y0);
        if (p.x + w < -60 || p.x > this.viewW + 60 || p.y + T < -80 || p.y > this.viewH + 80) continue;
        /* 桥面落在舞池地板上：先压一条接触阴影，让桥面与背景地板分层 */
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = P.shadow;
        ctx.fillRect(p.x + 3, p.y + T - 3, w - 6, 5);
        ctx.restore();
        const img = this.indexBridgeImage ? this.indexBridgeImage(seg.key) : null;
        if (img && img.complete && img.naturalWidth) {
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, p.x, p.y, w, T);
        } else {
          this.drawIndexBridgeFallback(p.x, p.y, w, T);
        }
        /* 外露顶面亮缘：把桥面读成「一条被确认出来的路」而不是背景地板 */
        ctx.save();
        ctx.fillStyle = P.top;
        ctx.fillRect(p.x, p.y, w, 3);
        ctx.fillStyle = P.topHi;
        ctx.fillRect(p.x, p.y, w, 1.2);
        ctx.restore();
      }
      /* 记录光：沿桥面自左向右流动的一道细光（扫描成功后才存在） */
      const a0 = plan[0].col * T, a1 = (plan[plan.length - 1].col + plan[plan.length - 1].w) * T;
      const span = a1 - a0;
      const lx = a0 + (((t / 26) % span) + span) % span;
      const lp = cam.toScreen(lx, y0);
      if (lp.x > -40 && lp.x < this.viewW + 40 && lp.y > -60 && lp.y < this.viewH + 60) {
        ctx.save();
        const g = ctx.createLinearGradient(lp.x - 34, 0, lp.x + 34, 0);
        g.addColorStop(0, 'rgba(143,107,255,0)');
        g.addColorStop(0.5, 'rgba(196,178,255,0.75)');
        g.addColorStop(1, 'rgba(143,107,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(lp.x - 34, lp.y, 68, 2);
        ctx.restore();
      }
    },
    /* 零件图缺失时的结构化回退：顶面亮缘 + 侧壁暗部 + 桁架支撑（非纯色块） */
    drawIndexBridgeFallback(x, y, w, h) {
      const ctx = this.ctx;
      ctx.save();
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, P.deckLit); g.addColorStop(0.5, P.deck); g.addColorStop(1, '#170f31');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      /* 板缝：按 1.5 格周期（≠ 游戏格，读不出格子感） */
      ctx.fillStyle = 'rgba(8,4,18,0.5)';
      for (let sx = x + T15(this.tile); sx < x + w - 2; sx += T15(this.tile)) ctx.fillRect(sx, y + 3, 1.5, h - 12);
      ctx.fillStyle = P.side;
      ctx.fillRect(x, y, 3, h);
      ctx.fillRect(x + w - 3, y, 3, h);
      ctx.fillStyle = P.sideLit;
      ctx.fillRect(x, y, 1.2, h);
      /* 桁架支撑（视觉件，不进碰撞） */
      ctx.fillStyle = P.support;
      const legW = 3.5;
      ctx.fillRect(x + 4, y + h - 4, legW, 6);
      ctx.fillRect(x + w - 4 - legW, y + h - 4, legW, 6);
      ctx.fillStyle = P.supportLit;
      ctx.fillRect(x + 4, y + h - 4, 1.2, 6);
      ctx.restore();
    },

    /* ----------------------------- 扫描终端 ----------------------------- */
    drawIndexTerminal(cfg) {
      const tm = cfg.terminal;
      if (!tm) return;
      const ctx = this.ctx, T = this.tile, cam = this.camera;
      const t = nowMs();
      const linked = this.indexScanDone && this.indexScanDone();
      const baseY = tm.row * T;                       // 台面顶（跑道线）
      const cx = (tm.col + tm.w / 2) * T;
      const seat = cam.toScreen(cx, baseY);
      const halfW = tm.w * T * 0.42;
      if (seat.x + halfW < -80 || seat.x - halfW > this.viewW + 80) return;
      ctx.save();
      /* ① 地面投影：台体在舞池地板上的接触阴影 */
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = P.ink;
      ctx.beginPath();
      ctx.ellipse(seat.x, seat.y + 4, halfW * 1.05, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      /* ② 台体：深紫面板 + 琥珀金收边 */
      const h = 26, w = halfW * 2;
      const g = ctx.createLinearGradient(0, seat.y - h, 0, seat.y + 4);
      g.addColorStop(0, '#2b2050'); g.addColorStop(1, '#150e2c');
      ctx.fillStyle = g;
      ctx.fillRect(seat.x - halfW, seat.y - h, w, h);
      ctx.strokeStyle = linked ? 'rgba(92,224,255,0.7)' : 'rgba(255,207,122,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(seat.x - halfW + 0.75, seat.y - h + 0.75, w - 1.5, h - 1.5);
      /* ③ 指示灯：未扫描＝琥珀金呼吸；已连通＝青色常亮 */
      for (let i = 0; i < 3; i++) {
        const lx = seat.x - halfW + 9 + i * 13;
        const pulse = linked ? 1 : (0.28 + 0.52 * Math.abs(Math.sin(t / 520 + i)));
        ctx.fillStyle = linked
          ? 'rgba(92,224,255,' + (0.85 - i * 0.18).toFixed(3) + ')'
          : 'rgba(255,207,122,' + pulse.toFixed(3) + ')';
        ctx.fillRect(lx, seat.y - h + 7, 6, 6);
      }
      /* ④ 圆形琥珀金扫描环（未连通时呼吸；连通后停驻为青色细环） */
      const ringY = seat.y - h - 26;
      const rr = 20 + (linked ? 2 : 4 * Math.abs(Math.sin(t / 420)));
      ctx.strokeStyle = linked ? 'rgba(92,224,255,0.65)' : P.amber;
      ctx.lineWidth = linked ? 1.6 : 2.4;
      ctx.beginPath(); ctx.arc(seat.x, ringY, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = linked ? 0.16 : 0.26;
      ctx.fillStyle = linked ? P.cyan : P.amber;
      ctx.beginPath(); ctx.arc(seat.x, ringY, rr * 0.72, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      /* ⑤ 蓝紫悬浮颗粒：环绕扫描环缓慢上浮 */
      for (let i = 0; i < 7; i++) {
        const ph = (t / 1400 + i / 7) % 1;
        const px = seat.x + Math.sin(i * 2.1 + t / 900) * (rr + 12);
        const py = seat.y - h - 6 - ph * 42;
        ctx.globalAlpha = (1 - ph) * 0.7;
        ctx.fillStyle = (i % 3 === 0) ? P.cyan : P.violet;
        ctx.fillRect(px, py, 2.5, 2.5);
      }
      ctx.restore();
    },

    /* ----------------------------- 出口感应区 ----------------------------- */
    /* 出口不摆任何可见方块：只在地面上给一道「感应光线」——
       锁定态＝暗琥珀虚线 + 缓慢呼吸的扫描弧（提示此处有协议、尚未连通）；
       开放态＝暖金光幕从跑道线升起 + 门槛亮线（走到即自动通过）。 */
    drawIndexExit(cfg) {
      const ex = cfg.exit;
      if (!ex) return;
      const ctx = this.ctx, T = this.tile, cam = this.camera;
      const t = nowMs();
      const open = this.indexGateOpen ? this.indexGateOpen() : false;
      const x0 = ex.col * T, w = ex.w * T;
      // 门槛线：优先取 exit.row（门前高台顶面），否则沿用桥面下一行（缺省跑道线 row14）
      const floorY = (ex.row != null ? ex.row : (cfg.bridgeRow != null ? cfg.bridgeRow + 1 : 14)) * T;
      const p = cam.toScreen(x0, floorY);
      if (p.x + w < -90 || p.x > this.viewW + 90 || p.y < -90 || p.y > this.viewH + 90) return;
      ctx.save();
      /* 地面亮线：出口感知带的「门槛」（锁定=暗琥珀呼吸 / 开放=暖金常亮） */
      const base = open ? 0.75 : 0.30 + 0.16 * Math.sin(t / 520);
      ctx.fillStyle = open ? 'rgba(255,240,200,' + base.toFixed(3) + ')'
                           : 'rgba(255,207,122,' + base.toFixed(3) + ')';
      ctx.fillRect(p.x + 2, p.y - 1.5, w - 4, 2.5);
      /* 感应带端点刻度：两道竖直短线，读成「检测门框」而不是方块 */
      ctx.fillStyle = open ? 'rgba(255,240,200,0.55)' : 'rgba(255,207,122,0.35)';
      ctx.fillRect(p.x + 1, p.y - 10, 2, 10);
      ctx.fillRect(p.x + w - 3, p.y - 10, 2, 10);
      if (open) {
        /* 开放态：暖金→紫光光幕（纯渐变，无实体板块）+ 缓慢上升的光点 */
        const h = 2 * T;
        const g = ctx.createLinearGradient(0, p.y, 0, p.y - h);
        g.addColorStop(0, 'rgba(255,240,200,0.34)');
        g.addColorStop(0.55, 'rgba(143,107,255,0.24)');
        g.addColorStop(1, 'rgba(92,224,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(p.x, p.y - h, w, h);
        for (let i = 0; i < 6; i++) {
          const ph = (t / 1600 + i / 6) % 1;
          ctx.globalAlpha = (1 - ph) * 0.6;
          ctx.fillStyle = (i % 2) ? P.cyan : P.amber;
          ctx.fillRect(p.x + 6 + (i * (w - 12)) / 5, p.y - 4 - ph * (h - 8), 2, 2);
        }
        ctx.globalAlpha = 1;
      } else {
        /* 锁定态：中央一道缓慢扫描的弧 + 两条暗封条（表示协议未连通） */
        const cx = p.x + w / 2;
        const arc = Math.sin(t / 700);
        ctx.strokeStyle = 'rgba(255,207,122,' + (0.30 + 0.14 * arc).toFixed(3) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, p.y - 2, 14, Math.PI + arc * 0.5, Math.PI * 2 - arc * 0.5);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,207,122,0.18)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(p.x + 6, p.y - 12); ctx.lineTo(p.x + w - 6, p.y - 12);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    },
  });

  /* 板缝周期（1.5 格）：与 game-tile-shapes.js 的「非格对齐接缝」同一手感 */
  function T15(tile) { return Math.max(18, Math.round(tile * 1.5)); }
})();
