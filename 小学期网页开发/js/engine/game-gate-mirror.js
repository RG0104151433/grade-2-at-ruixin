/* ============================================================================
 * engine/game-gate-mirror.js —— Game 方法组 · 无尽道路（road）双阶段镜像谜题（AI-06 转移）
 * ----------------------------------------------------------------------------
 * road 改造为「两阶段跑酷谜题」（原玉钥证据链玩法被替换）：
 *   阶段一（前进跑酷，正常重力）：出发平台 + 9 段固定障碍平台（2/3 格整件，
 *     起伏较大、二段跳可通）→ 两条按 E 触发的提示交互 → 终点无方块，只有一条
 *     隐形墙（col47，只碰撞不绘制）让人意识到不能继续向右；
 *   阶段二（镜像通关）：回到起点校验台范围内按 E → 确认 → 500-700ms 过渡 →
 *     世界整体上下翻转（背景/地形/角色/坑洞/平台）。不要求先到死路：
 *     玩家随时可以回到起点直接进入翻转跑酷。
 *     **重力不反转**：角色倒立、脚踩在镜像跑道上表面（世界行3），正常重力（世界向下）
 *     把它压在跑道上；翻转渲染后，屏幕上看是吊在跑道下方、朝屏幕下跳跃（朝"头"的方向）。
 *     沿镜像跑道跨过 2 处坑 → 抵达 col49-51 真正出口 → 转场 treasure（key2）。
 *
 * 职责拆分：
 *   · 状态机（tick）：gate_forward_started / hint / dead_end / mirror_ready /
 *     mirrored / complete 全部幂等落在存档；死亡、读档、离开再进入都不丢失。
 *   · 物理接线：engine.mirrorSign（-1）驱动 player.js 的重力/按键/站立面反转；
 *     level.mirrorRunwayTiles（跑道）与 mirrorDoorTiles（出口门）由 level.js
 *     预建，镜像启动时才进入/移出碰撞。
 *   · 渲染接线：render() 在镜像态用 ctx.translate(0,viewH)+scale(1,-1) 以
 *     视口中心为轴翻转世界；HUD/对白/覆盖层在 restore 后正常绘制。
 *   · 只读约束：不改 OASIS/其它关的重力、按键、坑洞逻辑；本模块仅在
 *     L.id === 'road' 且 def.mirror 存在时生效，缺模块/缺配置零开销跳过。
 * 加载顺序：game.js 之后（Object.assign 方法组），game-loop.js 之前（tick 用
 *   存在性守卫挂钩，game-scene.js 之前也行）。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  const MIRROR_MS = 600;              // 镜像过渡时长（500-700ms 区间）
  const REVEAL_MS = 180;              // 翻转后特效淡出
  const nowMs = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const zh = () => !(typeof isEn === 'function' && isEn());

  /* 确认文案与拾取文本（本地化） */
  function confirmLines() {
    return zh()
      ? ['【系统】检测到逆向校正权限。', '【系统】镜像检索会颠倒世界，但你的脚仍踩在同一段路上。', '【埃尔】那就别再沿着它替我规定的方向走。']
      : ['[System] Reverse calibration permission detected.', '[System] Mirror retrieval will turn the world over, yet your feet stay on the same road.', '[El] Then I will stop walking the direction it prescribed for me.'];
  }

  Object.assign(Game.prototype, {
    /* ---------------- 状态位（幂等，读档/死亡/重进保持） ---------------- */
    _gmHas(flag) { try { return !!(this.save && this.save.has(flag)); } catch (e) { return false; } },
    _gmWrite(flags) {
      try { if (this.save && this.save.addFlags) { this.save.addFlags(flags); this.save.persist(); } } catch (e) { /* ignore */ }
    },

    /* ---------------- 生命周期：loadLevel 时复位引擎镜像态 ---------------- */
    /* 镜像 = 仅渲染翻转（mirrorFlip）+ 正常重力（mirrorSign 恒 +1）：角色倒立、
       脚踩在镜像跑道/平台的上表面，翻转后在屏幕上吊在跑道下方、朝屏幕下跳跃。 */
    gateMirrorReset() {
      this.mirrorSign = 1;
      this.mirrorFlip = false;
      this._gmPrevOn = false;
      this._gmSyncHud(false);
    },

    /* ---------------- 每帧：状态同步 + 校验台交互 ---------------- */
    gateMirrorTick() {
      const L = this.level;
      if (!L) return;
      const isGate = L.id === 'road' && !!(L.def && L.def.mirror);
      const want = isGate && !!this._gmHas('gate_mirrored');
      const on = !!this.mirrorFlip;
      /* [098] 镜像相机：纵向完全锁定 —— 上下钳到同一值（跑道区上方 2 行），
         相机不再随玩家跳跃产生纵向位移，翻转视图里平台/跑道屏幕位置恒定，
         只保留横向跟随；跑道上沿同时是背景镜像对齐的锚点（见
         game-render-tiles.js drawBackground 的镜像分支，两者共用 row-2 同一换算）。
         loadLevel 每次重建 cameraBound，恢复重力视图自动回到原钳制。 */
      if (want && Array.isArray(L.cameraBound)) {
        const _fixY = Math.min(L.cameraBound[2], ((L.def.mirror.runway && L.def.mirror.runway.row != null ? L.def.mirror.runway.row : 3) - 2) * this.tile);
        L.cameraBound[2] = _fixY;
        L.cameraBound[3] = _fixY;
      }
      if (want && !on) {
        // 首次挂起镜像（含本次会话重进后再激活）：翻转渲染，挂载跑道/门
        this.mirrorSign = 1; this.mirrorFlip = true;
        if (L.enableMirrorRunway) L.enableMirrorRunway();
        if (L.openMirrorDoor) L.openMirrorDoor();
        this._gmHideForward(true);
        this._gmReposition();
      } else if (!want && on) {
        this.mirrorSign = 1; this.mirrorFlip = false;
        this._gmHideForward(false);
      } else if (want && !this._gmPrevOn && L.enableMirrorRunway) {
        // 同会话内重进（死亡/读档 = loadLevel 重建关卡）：跑道/门需要重新挂载
        L.enableMirrorRunway();
        if (L.openMirrorDoor) L.openMirrorDoor();
        this._gmHideForward(true);
      }
      this._gmPrevOn = want;
      this._gmSyncHud(!!this.mirrorFlip);
      if (!isGate) return;
      if (this.status !== 'running') return;
      // 开始前进跑酷（写入 gate_forward_started，幂等）
      const T = this.tile;
      if (!this._gmHas('gate_forward_started') && this.player && this.player.x > 8 * T) {
        this._gmWrite(['gate_forward_started']);
      }
      // 校验台交互（仅镜像前）
      if (!want) this._gmStation();
    },

    /* 镜像态隐藏/恢复「前进段平台」：翻转后它们落在背景的黑色区域（街景道路以下），
       按「平台只在有背景的地方出现」在镜像态隐藏；跑道本身（gateMirrorRunway）保留。 */
    _gmHideForward(on) {
      const L = this.level;
      if (!L || L.id !== 'road') return;
      const T = this.tile;
      if (!L._gmForwardTiles) {
        L._gmForwardTiles = (L.solids || []).filter(t => !t.hiddenVisual && !t.gateMirrorRunway &&
          t.y >= 5 * T && t.y <= 13 * T);
      }
      for (const t of L._gmForwardTiles) t.hiddenVisual = on;
    },

    /* 翻转跑酷键位互换：镜像态把底部 HUD 的「空格/W/↑ 跳跃」与「S 下梯」
       换成「空格/S 跳跃」与「W/↑ 下落」；离开镜像/非 road 关恢复原键位。
       只读/写 HUD 文本，不碰玩法；DOM 缺失或测试替身时静默跳过。 */
    _gmSyncHud(on) {
      try {
        if (typeof document === 'undefined') return;
        const box = document.getElementById('hud-controls');
        if (!box || !box.querySelectorAll) return;
        const items = box.querySelectorAll('.hud-kbd');
        if (!items || items.length < 4) return;
        const q = (it, sel) => (it && it.querySelector) ? it.querySelector(sel) : null;
        const jumpK = q(items[1], 'kbd'), jumpL = q(items[1], 'span');
        const downK = q(items[3], 'kbd'), downL = q(items[3], 'span');
        if (!jumpK || !downK) return;
        const t = k => (window.I18N && I18N.t) ? I18N.t(k) : '';
        const setLbl = (el, key) => { if (el) { el.setAttribute('data-i18n', key); el.textContent = t(key); } };
        if (this._gmHudJump == null) this._gmHudJump = jumpK.textContent;   // 首次记录原始键位
        if (this._gmHudDown == null) this._gmHudDown = downK.textContent;
        if (on) {
          jumpK.textContent = t('hud_kbd_jump_flip');   // 翻转跑酷：S/↓ 才是真正的向下（起跳）
          downK.textContent = t('hud_kbd_down_flip');
          setLbl(jumpL, 'hud_jump');
          setLbl(downL, 'hud_fall');
        } else {
          jumpK.textContent = this._gmHudJump;
          downK.textContent = this._gmHudDown;
          setLbl(jumpL, 'hud_jump');
          setLbl(downL, 'hud_climb');
        }
      } catch (e) { /* HUD 同步失败静默：不影响玩法 */ }
    },

    /* 镜像启动：把玩家安放到镜像跑道起点（世界 col5 跑道**上表面**）。
       正常重力向下 → 角色自然站在跑道上；翻转渲染后看起来吊在跑道下方。 */
    _gmReposition() {
      const L = this.level, p = this.player;
      if (!L || !L.def.mirror || !p) return;
      const M = L.def.mirror, T = this.tile;
      const topY = (M.runway && M.runway.row != null ? M.runway.row : 3) * T; // 跑道顶面
      p.x = ((M.startCol != null ? M.startCol : 5) + 0.5) * T;
      p.y = topY - p.h / 2;
      p.vx = 0; p.vy = 0; p.remX = 0; p.remY = 0; p.onGround = false;
      if (this.camera && this.camera.snap) this.camera.snap(p.x, p.y);
    },

    /* 起点校验台交互：站在起点校验台范围内按 E 即可翻转跑道。
       不要求先到死路——玩家随时可以回到起点，直接进入翻转跑酷。 */
    _gmStation() {
      if (this.mirrorFlip) return;                 // 已镜像：不再触发翻转
      if (!this.input.wasPressed(...KEYBINDS.interact)) return;
      const L = this.level, p = this.player;
      const st = L && L.def && L.def.mirror && L.def.mirror.station;
      if (!st || !p) return;
      const T = this.tile, pad = 2 * T;
      const x0 = st.x * T - pad, x1 = (st.x + st.w) * T + pad;
      if (p.x < x0 || p.x > x1) return;            // 只在起点校验台附近生效
      this.beginGateMirror();
    },

    /* 启动镜像（确认文案 → 500-700ms 过渡 → 世界翻转）。幂等：已有 gate_mirrored 不再重播。 */
    async beginGateMirror() {
      if (this._gmBusy) return;
      this._gmBusy = true;
      const wasRunning = this.status === 'running';
      try {
        if (wasRunning) { this.status = 'busy'; this.input.clear(); }
        await this.dialog.show(confirmLines());
        if (this.status === 'ending' || this.status === 'title') return;
        this._gateMirrorFx = { t0: nowMs(), ms: MIRROR_MS, phase: 'cover' };
        await delay(MIRROR_MS);
        if (this.status === 'ending' || this.status === 'title') return;
        // 字面量 addFlags（verify-config 的引擎侧授予来源扫描点）
        this.save.addFlags(['gate_mirrored']);
        this.save.persist();
        const L = this.level;
        if (L) {
          this.mirrorSign = 1; this.mirrorFlip = true;
          if (L.enableMirrorRunway) L.enableMirrorRunway();
          if (L.openMirrorDoor) L.openMirrorDoor();
          this._gmHideForward(true);
          this._gmReposition();
        }
        // 过渡特效淡出（翻转瞬间到 reveal 结束为正常渲染前的一帧覆盖）
        this._gateMirrorFx = { t0: nowMs(), ms: REVEAL_MS, phase: 'reveal', onMirror: true };
      } finally {
        this._gmBusy = false;
        if (wasRunning) { this.status = 'running'; this.input.clear(); }
      }
    },

    /* ---------------- 渲染：世界装饰（画在翻转层内，随世界一并翻转） ---------------- */
    drawGateMirror() {
      const L = this.level;
      if (!L || L.id !== 'road') return;
      const M = L.def && L.def.mirror;
      if (!M) return;
      const ctx = this.ctx, cam = this.camera;
      if (!ctx || !cam) return;
      const mirrored = !!this.mirrorFlip;
      try {
        /* 2026-09-20：终点黄色方块（原 _gmDrawExitGate 的暖金矩形）已删除。
           出口本就走 maps.road.triggers.gate_mirror_exit 的 auto 触发
           （player 进入 col49-51 行2-4 即触发），不需要任何可见方块。 */
        // 镜像跑道的坑洞 / 毒雾（纯渲染图片，见 _gmDrawRunwayHazards）
        if (mirrored) this._gmDrawRunwayHazards(ctx, cam, M);
        /* 已读提示点的弱金标记只在正常重力视图出现：镜像态它们同属前进段装饰，
           会被翻转画到无背景区域。 */
        if (!mirrored && this._gmHas('gate_dead_end_seen')) this._gmDrawHintMarks(ctx, cam);
        /* 2026-09-20：起点校验台的黄色浮签（gate_mirror_prompt「按 E 翻转跑道」）已删除。
           它绘制在本关最左端（mirror.station x=1）、颜色 #ffe9a8、进关即显示，
           等于在玩家撞上死路之前就把「这条路可以翻转」直接说出来，
           与「先给症状、让玩家自己推」的谜题设计冲突。
           需要操作指引时，由 gate_dead_end 在真正撞到隐形墙后给出（该提示保留）。 */
      } catch (e) { /* 渲染异常静默：不打断本帧 */ }
    },

    /* 校验台：黄铜档案控制台（起点区，程序化） */
    _gmDrawStationConsole(ctx, cam, mirrored) {
      const L = this.level, M = L.def.mirror;
      if (!M || !M.station) return;
      const st = M.station, T = this.tile;
      const cx0 = (st.x + st.w * 0.1) * T, cw = st.w * 0.8 * T;
      const cy1 = (st.y + st.h) * T, ch = Math.min(56, st.h * T * 0.5);
      const p0 = cam.toScreen(cx0, cy1 - ch);
      const p1 = cam.toScreen(cx0 + cw, cy1);
      if (p0.x + cw < -80 || p0.x > this.viewW + 80 || p0.y + ch < -80 || p0.y > this.viewH + 80) return;
      ctx.save();
      ctx.fillStyle = 'rgba(38,30,18,0.9)';
      ctx.fillRect(p0.x, p0.y, cw, ch);
      ctx.strokeStyle = 'rgba(201,162,74,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p0.x, p0.y, cw, ch);
      // 面板指示灯：起点校验台常亮（翻转随时可用，不再依赖死路进度）
      const pulse = 1;
      ctx.fillStyle = 'rgba(255,206,120,' + (0.35 * pulse).toFixed(3) + ')';
      for (let i = 0; i < 3; i++) ctx.fillRect(p0.x + 8 + i * 16, p0.y + 8, 7, 7);
      // 台面细分线
      ctx.strokeStyle = 'rgba(201,162,74,0.28)';
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y + ch * 0.55); ctx.lineTo(p0.x + cw, p0.y + ch * 0.55); ctx.stroke();
      ctx.restore();
    },

    /* 2026-09-20 移除 _gmDrawStationLabel（起点校验台的黄色浮签「按 E 翻转跑道」）。
       它是最左端唯一一行玩家可见黄字，进关即提示翻转机制；
       本关现在不主动提示翻转，只在 gate_dead_end 撞墙后给出指引。
       对应 i18n 键 gate_mirror_prompt 因此变为零引用（保留定义，勿删）。 */

    /* 镜像跑道的坑洞 / 毒雾 —— 复用跑酷关现成交付素材，纯渲染：
       · 坑 = image/hazard_oasis_pit_1.png（1 格）/ _2.png（2 格），坑口对齐逻辑与
         正常跑酷段完全一致（drawOasisPitArt 的 -0.42 格上提）。
       · 雾 = image/hazard_red_fog_1_a|b|c.png 三帧（≈220ms/帧），与 oasis /
         失重舞厅同一套。
       镜像渲染层整体上下翻转 ⇒ 这里不做任何额外变换，图片自然上下颠倒。
       只画不改：不进碰撞数组、不碰物理，掉落判定仍由 mirror.killFallRow 负责。 */
    _gmDrawRunwayHazards(ctx, cam, M) {
      const T = this.tile;
      const baseRow = (M.runway && M.runway.row != null) ? M.runway.row : 3;
      const draw = (item, kind) => {
        const row = (item.row != null) ? item.row : baseRow;
        const x = item.col * T, y = row * T, w = (item.w || 1) * T, h = T;
        const p = cam.toScreen(x, y);
        if (p.x + w < -80 || p.x > this.viewW + 80 || p.y + h * 2 < -80 || p.y > this.viewH + 80) return;
        if (kind === 'pit') {
          const src = w > T * 1.5 ? 'image/hazard_oasis_pit_2.png' : 'image/hazard_oasis_pit_1.png';
          const img = (typeof oasisHazardImage === 'function') ? oasisHazardImage(src) : null;
          if (img && img.complete && img.naturalWidth) {
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, p.x, p.y - h * 0.42, w, h * 4 / 3);
          } else if (this.drawPitFallbackArt) {
            this.drawPitFallbackArt(p.x, p.y, w, h);
          }
          return;
        }
        const frames = (this.hazardFogFrames ? this.hazardFogFrames() : []) || [];
        const img = frames.length
          ? ((typeof oasisHazardImage === 'function')
            ? oasisHazardImage(frames[Math.floor(nowMs() / 220) % frames.length]) : null) : null;
        if (img && img.complete && img.naturalWidth) {
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, p.x, p.y, w, h);
        } else if (this.drawHazardFogFallback) {
          this.drawHazardFogFallback(p.x, p.y, w, h);
        }
      };
      for (const it of (Array.isArray(M.pits) ? M.pits : [])) draw(it, 'pit');
      for (const it of (Array.isArray(M.fogs) ? M.fogs : [])) draw(it, 'fog');
    },

    /* [已移除] _gmDrawExitGate —— 镜像出口的暖金色方块。
       2026-09-20 删除：出口触发（gate_mirror_exit，trigger:'auto'）不需要可见方块，
       该方块是跑道最右端唯一的黄色矩形，玩家反馈应去掉。 */

    /* 死路：col47-51 行5-17 墙上的大型关闭档案门（程序化封门 + 警示封条） */
    _gmDrawDeadEnd(ctx, cam, mirrored) {
      const L = this.level, T = this.tile;
      const x0 = 47 * T, x1 = 52 * T;         // col47-51
      const y0 = (mirrored ? 9 : 6) * T;      // 门体从墙体顶部向下
      const y1 = 12 * T;
      const p0 = cam.toScreen(x0, y0);
      if (p0.x > this.viewW + 120 || p0.x + x1 - x0 < -120 || p0.y > this.viewH + 120 || p0.y + (y1 - y0) < -120) return;
      const w = x1 - x0, h = y1 - y0;
      ctx.save();
      // 门框（深木 + 黄铜收边）
      ctx.fillStyle = 'rgba(30,22,12,0.92)';
      ctx.fillRect(p0.x, p0.y, w, h);
      ctx.strokeStyle = 'rgba(201,162,74,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(p0.x + 2, p0.y + 2, w - 4, h - 4);
      // 两块门扇接缝
      ctx.strokeStyle = 'rgba(201,162,74,0.45)';
      ctx.beginPath();
      ctx.moveTo(p0.x + w / 2, p0.y + 6); ctx.lineTo(p0.x + w / 2, p0.y + h - 6);
      ctx.stroke();
      // 横向警示封条（两条）
      ctx.fillStyle = 'rgba(180,60,40,0.35)';
      const st1 = y0 + h * 0.38, st2 = y0 + h * 0.66;
      for (const sy of [st1, st2]) {
        const sp = cam.toScreen(x0 + 6, sy);
        ctx.fillRect(sp.x, sp.y, w - 12, 9);
      }
      // 中央「索引门」指示框
      const pc = cam.toScreen(x0 + w / 2, y0 + h * 0.5);
      ctx.strokeStyle = 'rgba(255,233,168,0.5)';
      ctx.strokeRect(pc.x - 26, pc.y - 13, 52, 26);
      ctx.restore();
    },

    /* 已读提示点 → 弱金色档案标记（死路触发后出现，方便辨认回程；不重复对白） */
    _gmDrawHintMarks(ctx, cam) {
      const spots = [[9, 10], [36, 6]];   // 提示点一（平台1）/ 提示点二（平台7）
      const T = this.tile;
      for (const [col, row] of spots) {
        const x = col * T + T / 2, y = row * T - 26;
        const p = cam.toScreen(x, y);
        if (p.x < -60 || p.x > this.viewW + 60 || p.y < -60 || p.y > this.viewH + 60) continue;
        const bob = 3 * Math.sin(nowMs() / 900 + col);
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.12 * Math.sin(nowMs() / 700 + col);
        ctx.strokeStyle = '#f0c869';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x - 12, p.y + bob); ctx.lineTo(p.x - 4, p.y + bob - 9);
        ctx.lineTo(p.x + 4, p.y + bob - 9); ctx.lineTo(p.x + 12, p.y + bob);
        ctx.stroke();
        ctx.restore();
      }
    },

    /* ---------------- 渲染：镜像过渡特效（屏幕空间，保持正常方向） ---------------- */
    drawGateMirrorFx(ctx) {
      const fx = this._gateMirrorFx;
      if (!fx || !ctx) return;
      const age = nowMs() - fx.t0;
      if (age >= fx.ms + (fx.phase === 'cover' ? 60 : 60)) { this._gateMirrorFx = null; return; }
      const k = clamp01(age / fx.ms);
      const fade = fx.phase === 'cover' ? (1 - k) : (1 - k);
      ctx.save();
      /* 轻微色差：暖青双色半透明边带（不闪白） */
      ctx.globalAlpha = 0.05 * fade;
      ctx.fillStyle = '#ffb45a';
      ctx.fillRect(0, this.viewH * (0.06 + 0.08 * k), this.viewW, 10);
      ctx.fillStyle = '#59d8ff';
      ctx.fillRect(0, this.viewH * (0.88 - 0.06 * k), this.viewW, 10);
      /* 扫描线：自上而下扫动的横纹带 */
      ctx.globalAlpha = 0.14 * fade;
      ctx.fillStyle = '#ffe9a8';
      const ly = ((age * 0.9) % (this.viewH + 60)) - 30;
      ctx.fillRect(0, ly, this.viewW, 3);
      /* 金色档案文字碎片（确定性伪随机） */
      ctx.globalAlpha = (0.10 + 0.10 * Math.abs(Math.sin(age / 90))) * fade;
      ctx.fillStyle = '#fff3cf';
      ctx.font = '12px "Microsoft YaHei","PingFang SC",serif';
      ctx.textAlign = 'left';
      const glyphs = ['索引', '校正', '逆', '路', '始', '序'];
      for (let i = 0; i < 10; i++) {
        const gx = (i * 137 % this.viewW);
        const gy = this.viewH - ((age * (0.4 + (i % 3) * 0.2) + i * 97) % this.viewH);
        ctx.fillText(glyphs[i % glyphs.length], gx, gy);
      }
      ctx.restore();
    },
  });
})();