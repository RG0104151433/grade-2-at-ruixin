/* ============================================================================
 * engine/game-index-book.js —— Game 方法组 · 访客索引册 → 原地二段跳（阶段5）
 * ----------------------------------------------------------------------------
 * 接待台档案槽在邀请验证完成后（libgate_book_open）推出访客索引册；玩家走近按 E：
 *   ① 领取瞬间即写能力：addFlags(['libgate_book','doubleJump']) + persist
 *      （不等事件链结束就落盘 → 刷新不丢；链被中断也已解锁）；
 *   ② 数据页面展开演出：opened 精灵缩放淡出 + 双金环 + 确认音（程序绘制，不加美工）；
 *   ③ 技能提示（两行：新技能 + 访客移动协议已更新，见 showSkillHint 的第二参）；
 *   ④ 对白（埃尔 / 莫罗）；
 *   ⑤ 常驻操作提示「原地试试…」，直到玩家原地成功二段跳。
 *
 * 原地尝试（indexBookTick，每帧只读玩家状态；由 game-loop.update 调用）：
 *   · 不移动玩家、不送教学区、不升平台：接待台前本来就是无顶棚的安全空地；
 *   · 原地跳起后在空中再按跳跃键（player.jumps 在空中的递减）→ 判定成功：
 *     短促金色圆环 + 确认音 + 画布内「二次跃迁确认」小字；写 libgate_dj_confirm
 *     （幂等，只写一次）并收起常驻提示；
 *   · 只跳一次落地 → 记一次未成功，操作提示保留（不清除）；
 *   · 连续 FAILS_FOR_ASSIST 次未成功 → 下一次跳跃顶点给一个克制的小圆环 +
 *     「再按一次跳跃键」小字（不替玩家跳、不改重力 / 跳跃高度 / 碰撞）。
 *
 * 渲染（drawIndexBook，由 game-archive-hall.js 的 drawArchiveHall 末尾调用）：
 *   档案槽 → 合册从槽内滑出（SLIDE_MS）→ 台面静止 + 呼吸光环 → 领取后数据页面展开。
 * 边界：不碰碰撞 / 物理 / 触发器判定 / 检查点 / 存档结构；二段跳是否生效完全由
 *   player.js 既有的 save.has('doubleJump') 决定，本模块只负责「写能力 + 演出 + 提示」。
 *   图片缺失时静默跳过绘制，事件照常完成（不卡流程）。
 * 加载顺序：game.js 之后（index.html 中紧随 game-archive-hall.js）。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  const SLIDE_MS = 1200;          // 索引册从档案槽推出的时长
  const FX_MS = 1100;             // 领取时「数据页面展开 + 双金环」特效时长
  const RING_MS = 520;            // 单个金环扩散时长
  const NOTE_MS = 900;            // 确认小字 / 辅助小圆环停留时长
  const FAILS_FOR_ASSIST = 3;     // 连续未成功几次后给一次顶点辅助

  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }
  function easeOut(k) { k = Math.max(0, Math.min(1, k)); return 1 - (1 - k) * (1 - k); }
  function ringK(t0) { return (now() - t0) / RING_MS; }
  function roundRectIb(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function goldRing(ctx, x, y, r, alpha) {
    ctx.strokeStyle = 'rgba(255,214,140,' + alpha.toFixed(3) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,200,' + (alpha * 0.6).toFixed(3) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.stroke();
  }
  /* 画面内小字（键名在调用点以字面量传给 I18N.t：verify-config ⑩ 只统计
     `I18N.t('字面量')` 形式的引用，走变量的取词会被误判成「无人引用」的残影） */
  function ibLabelText(ctx, text, x, y) {
    if (!text) return;
    ctx.save();
    ctx.font = '12px "Noto Sans SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,232,190,0.97)';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 4;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  Object.assign(Game.prototype, {
    /* 索引册素材（同一 Game 实例只 new Image 一次；缺图返回 null，静默跳过绘制） */
    _indexBookImg(kind) {
      if (!this._ibImg) this._ibImg = {};
      if (!this._ibImg[kind]) {
        const im = new Image();
        im.src = kind === 'opened' ? 'image/sprite_index_book_opened.png'
                                   : 'image/sprite_index_book_closed.png';
        this._ibImg[kind] = im;
      }
      const im = this._ibImg[kind];
      return (im && im.complete && im.naturalWidth > 0) ? im : null;
    },
    /* 状态：hidden（未验证）→ opening（推出动画）→ ready（可领取）→ picked（已领取） */
    _indexBookState() {
      if (this.mapId !== 'library_gate') return 'hidden';
      if (this.save.has('libgate_book')) return 'picked';
      if (!this.save.has('libgate_book_open')) return 'hidden';
      if (this._ibOpenAt == null) this._ibOpenAt = now();
      return ((now() - this._ibOpenAt) < SLIDE_MS) ? 'opening' : 'ready';
    },
    /* ---------- 渲染（drawArchiveHall 末尾调用；纯绘制，不改逻辑） ---------- */
    drawIndexBook() {
      const L = this.level;
      const cfg = L && L.def && L.def.archiveHall && L.def.archiveHall.indexSlot;
      if (!cfg || this.mapId !== 'library_gate') return;
      const stage = this._indexBookState();
      const ctx = this.ctx, cam = this.camera;
      // ① 档案槽（台侧暗槽；验证完成后透出暖光边）
      const sp = cam.toScreen(cfg.slot.x, cfg.slot.y);
      ctx.save();
      ctx.fillStyle = 'rgba(14,10,6,0.92)';
      roundRectIb(ctx, sp.x, sp.y, cfg.slot.w, cfg.slot.h, 3);
      ctx.fill();
      if (stage !== 'hidden') {
        ctx.strokeStyle = 'rgba(255,206,138,0.5)';
        ctx.lineWidth = 1.5;
        roundRectIb(ctx, sp.x, sp.y, cfg.slot.w, cfg.slot.h, 3);
        ctx.stroke();
      }
      ctx.restore();
      // ② 索引册合册：从槽口沿台面滑向最终位置（opening）→ 台面就位（ready）
      if (stage === 'opening' || stage === 'ready') {
        const img = this._indexBookImg('closed');
        const prog = (stage === 'ready') ? 1 : easeOut((now() - this._ibOpenAt) / SLIDE_MS);
        const fromX = cfg.slot.x + cfg.slot.w;
        const fromY = cfg.slot.y + cfg.slot.h - cfg.book.h;
        const bx = fromX + (cfg.book.x - fromX) * prog;
        const by = fromY + (cfg.book.y - fromY) * prog;
        const p = cam.toScreen(bx, by);
        if (img) ctx.drawImage(img, p.x, p.y, cfg.book.w, cfg.book.h);
      }
      // ③ 领取特效：数据页面展开（opened 精灵缩放淡出）+ 双金环
      if (this._ibFxAt != null) {
        const t = (now() - this._ibFxAt) / FX_MS;
        if (t < 1) {
          const oi = this._indexBookImg('opened');
          const c = cam.toScreen(cfg.book.x + cfg.book.w / 2, cfg.book.y + cfg.book.h / 2);
          if (oi) {
            const s = 0.6 + 0.6 * easeOut(t);
            const w = cfg.book.w * 2.1 * s, h = cfg.book.h * 1.5 * s;
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - t);
            ctx.drawImage(oi, c.x - w / 2, c.y - h / 2, w, h);
            ctx.restore();
          }
          const a1 = Math.max(0, 1 - ringK(this._ibFxAt));
          const a2 = Math.max(0, 1 - ringK(this._ibFxAt + 160));
          ctx.save();
          if (a1 > 0) goldRing(ctx, c.x, c.y, 20 + 90 * (1 - a1), a1 * 0.9);
          if (a2 > 0) goldRing(ctx, c.x, c.y, 12 + 55 * (1 - a2), a2 * 0.8);
          ctx.restore();
        } else {
          this._ibFxAt = null;   // 特效播完自行收起（不残留半透明图）
        }
      }
      // ④ ready：台面上柔和呼吸光环（克制的可拾取标记）
      if (stage === 'ready') {
        const c = cam.toScreen(cfg.book.x + cfg.book.w / 2, cfg.book.y + cfg.book.h / 2);
        const pulse = 0.5 + 0.5 * Math.sin(now() / 600);
        ctx.save();
        const g = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 26);
        g.addColorStop(0, 'rgba(255,224,164,' + (0.18 + 0.12 * pulse).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,224,164,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(c.x, c.y, 26, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,228,176,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.x, c.y, 12 + 2 * pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      // ⑤ 原地二段跳成功：短促金色圆环 + 「二次跃迁确认」小字（世界坐标，画在玩家头顶）
      if (this._ibRings && this._ibRings.length) {
        this._ibRings = this._ibRings.filter(r => ringK(r.t0) < 1);
        for (const r of this._ibRings) {
          const p = cam.toScreen(r.x, r.y);
          const k = ringK(r.t0);
          ctx.save();
          goldRing(ctx, p.x, p.y, 8 + 34 * k, 0.9 * (1 - k));
          ctx.restore();
        }
      }
      if (this._ibConfirmFx) {
        const age = now() - this._ibConfirmFx.t0;
        if (age >= NOTE_MS) {
          this._ibConfirmFx = null;
        } else {
          const p = cam.toScreen(this._ibConfirmFx.x, this._ibConfirmFx.y);
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - age / NOTE_MS);
          ibLabelText(ctx, (window.I18N && I18N.t) ? I18N.t('dj_confirm_text') : '', p.x, p.y - 20 - age * 0.012);
          ctx.restore();
        }
      }
      // ⑥ 辅助小圆环：连续未成功 FAILS_FOR_ASSIST 次后，在第一跳顶点提示「再按一次」
      if (this._ibAssist) {
        const age = now() - this._ibAssist.t0;
        if (age >= NOTE_MS) {
          this._ibAssist = null;
        } else {
          const p = cam.toScreen(this._ibAssist.x, this._ibAssist.y);
          const k = (age / NOTE_MS);
          ctx.save();
          ctx.strokeStyle = 'rgba(255,224,164,' + (0.85 * (1 - k)).toFixed(3) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(p.x, p.y, 10 + 14 * k, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
          ibLabelText(ctx, (window.I18N && I18N.t) ? I18N.t('dj_assist_hint') : '', p.x, p.y - 20);
        }
      }
    },
    /* ---------- 事件入口：领取访客索引册（libgate_book_pickup → indexBook） ----------
       顺序：① 领取瞬间即写能力并落盘（不等链尾）→ ② 数据页面展开特效 + 确认音
             → ③ 技能提示（两行）→ ④ 对白（埃尔 / 莫罗）→ ⑤ 常驻操作提示。
       玩家位置不动（不位移、不切图）；控制由事件链结束自动恢复。 */
    async playIndexBook(ev, token) {
      ev = ev || {};
      const alive = () => (token == null || token === this._runToken);
      // 莫罗切换到「抬手说明」姿态（对白期间）
      this._moroPose = 'speak';
      // ① 领取即写能力：libgate_book（本册已领取）+ doubleJump（visitor movement）
      //    addFlags 幂等，重复调用不会重复发放；persist 立即落盘 → 刷新不丢。
      this.save.addFlags(['libgate_book', 'doubleJump']);
      this.save.persist();
      // ② 数据页面展开特效（渲染层按 _ibFxAt 播放） + 确认音
      this._ibFxAt = now();
      if (window.Audio2 && Audio2.coin) Audio2.coin();
      // 原地尝试状态复位（提示出现后由 indexBookTick 接管）
      this._ibFails = 0;
      this._ibSecondJump = false;
      this._ibApexDone = false;
      this._ibRings = [];
      this._ibPrevJumps = this.player ? this.player.jumps : null;
      this._ibPrevVy = 0;
      this._ibPrevOnGround = this.player ? !!this.player.onGround : true;
      // ③ 技能提示：新技能 + 访客移动协议已更新（第二行；已是老档时 showSkillHint 自带幂等）
      this.showSkillHint('doubleJump', (window.I18N && I18N.t) ? I18N.t('visitor_move_protocol') : '');
      await delay(FX_MS);
      await this.waitWhilePaused();
      if (!alive()) return;
      // ④ 对白（埃尔 / 莫罗）
      const lines = Array.isArray(ev.lines) ? ev.lines : [];
      for (const l of lines) {
        await this.dialog.show([pickText(l.text, l.text_en)]);
        await this.waitWhilePaused();
        if (!alive()) return;
      }
      // ⑤ 常驻操作提示：原地试试（ms=0 = 常驻，直到原地成功二段跳）
      const hint = pickText(ev.prompt && ev.prompt.text, ev.prompt && ev.prompt.text_en)
                || ((window.I18N && I18N.t) ? I18N.t('dj_try_hint') : '');
      this._ibPrompt = hint || '';
      if (this._ibPrompt) this.showGoalHint(this._ibPrompt, 0);
      // 对白结束、玩家开始尝试原地二段跳：恢复静立姿态
      this._moroPose = 'idle';
    },
    /* 原地二段跳成功：写一次性 flag（幂等）+ 金环 + 确认音 + 画布小字 + 收提示 */
    _ibConfirmJump(p) {
      this._ibSecondJump = true;
      this._ibFails = 0;
      if (!this.save.has('libgate_dj_confirm')) {
        this.save.addFlags(['libgate_dj_confirm']);
        this.save.persist();
      }
      const at = { x: p.x, y: p.y - 12, t0: now() };
      this._ibRings = this._ibRings || [];
      this._ibRings.push(at);
      this._ibConfirmFx = at;
      if (window.Audio2 && Audio2.coin) Audio2.coin();
      this._ibPrompt = '';                                     // 停止兜底重显
      if (typeof this.hideGoalHint === 'function') this.hideGoalHint();
    },
    /* ---------- 每帧：原地尝试监听（game-loop.update 调用；只读玩家状态） ----------
       只在 library_gate + 已解锁 doubleJump + 尚未原地确认时工作；其余情况零开销。
       不写玩家位置、不动速度、不改重力 / 跳跃高度 / 碰撞 —— 纯粹的「读帧 + 判成功」。 */
    indexBookTick() {
      // 离开地图时清掉推出动画的起点：下次回到接待前厅时合册重新从槽内滑出
      if (this.mapId !== 'library_gate') { this._ibOpenAt = null; return; }
      const p = this.player;
      if (!p) return;
      if (!this.save.has('doubleJump') || this.save.has('libgate_dj_confirm')) {
        this._ibPrevJumps = null;
        this._ibPrevVy = 0;
        this._ibPrevOnGround = true;
        return;
      }
      // 常驻操作提示兜底：被其它提示顶掉时重新显示（成功后 _ibPrompt 置空即停止）
      if (this._ibPrompt) {
        const el = document.getElementById('goal-hint');
        if (el && !el.classList.contains('show')) this.showGoalHint(this._ibPrompt, 0);
      }
      const jumps = p.jumps, ground = !!p.onGround, vy = p.vy;
      const prevGround = this._ibPrevOnGround, prevJumps = this._ibPrevJumps, prevVy = this._ibPrevVy;
      // 起跳沿（地面 → 空中）：重置本跳状态
      if (prevGround && !ground) { this._ibSecondJump = false; this._ibApexDone = false; }
      if (ground) {
        // 落地沿（空中 → 地面）：本次只跳了一次 → 记一次未成功；常驻提示保留（不清除）
        if (prevGround === false && !this._ibSecondJump) this._ibFails = (this._ibFails || 0) + 1;
      } else {
        // 第一跳顶点（vy 由非正转正）：连续未成功达到阈值 → 顶点小圆环 + 小字
        if (!this._ibApexDone && prevVy <= 0 && vy > 0) {
          this._ibApexDone = true;
          if ((this._ibFails || 0) >= FAILS_FOR_ASSIST) {
            this._ibAssist = { x: p.x, y: p.y - 12, t0: now() };
          }
        }
        // 空中跳跃次数减少（player.js：onGround 重置为 maxJumps-1，空中再按才递减）= 成功
        if (prevJumps != null && jumps < prevJumps) this._ibConfirmJump(p);
      }
      this._ibPrevJumps = jumps;
      this._ibPrevVy = vy;
      this._ibPrevOnGround = ground;
    },
  });
})();
