/* ============================================================================
 * engine/game-archive-door.js —— Game 方法组 · 主档案门 → 进入记忆档案井（阶段6）
 * ----------------------------------------------------------------------------
 * 开门条件（四项全满足；见 _archiveDoorUnlocked）：
 *   ① 持有有效邀请（clue home_invitation）
 *   ② 莫罗已完成邀请验证（flag libgate_book_open）
 *   ③ 已获得二段跳（flag doubleJump）
 *   ④ 已在接待台前原地成功过一次空中第二跳（flag libgate_dj_confirm）
 *   重访时（进入本关前就已领取过索引册 libgate_book）跳过重复教学，直接开门
 *   —— 即「拿到索引册 + 二段跳」的老档不再要求原地再跳一次。
 *
 * 门扇出现（drawArchiveDoor）：背景为「无门」版本，门扇在通过全部检查
 *   （_archiveDoorUnlocked）之前完全不绘制；条件达成后才以「关闭」态出现。
 *
 * 开门演出（playArchiveDoor，触发点由 archiveDoorTick 排队）：
 *   ⓪ 门以「关闭」态出现后，先播莫罗引导（approachLines：现在你可以通过这扇门…）；
 *   ① 「二次跃迁确认」小字先自然消失（等 IB_NOTE_MS，且玩家已落地才开演）；
 *   ② 接待台发出暖金色扫描光，沿走廊扫向档案门（程序绘制，加法光效）；
 *   ③ 档案门由关闭片交叉淡入开启片（openMs）；
 *   ④ 门内显示向上延伸的记忆档案井（暖金光带向上流动 + 竖向亮芯）；
 *   ⑤ 写一次性 flag libgate_door_open（幂等）→ 不自动切图；
 *   ⑥ 三句对白（莫罗 / 埃尔 / 莫罗）后交还控制，玩家自行走到门前按 E。
 *
 * 门口交互（story_config.maps.library_gate.triggers.libgate_exit）：
 *   trigger:'interact' + label「E · 进入记忆档案井」+ filter
 *   ['libgate_door_open','!libgate_library']；确认后先预加载正式图书馆背景，
 *   再淡出接待前厅 → changeMap library（原子写 libgate_library）→ 淡入，
 *   随后由既有 lib_intro 触发器正常播放正式图书馆开场内容。
 *
 * 渲染（drawArchiveDoor，由 game-archive-hall.js 的 drawArchiveHall 末尾调用）：
 *   门扇两态 + 门内记忆井 + 开门瞬间的扫描光；坐标经 _bgCoverDraw 从「背景原图
 *   native 像素」换算到屏幕，因此与图中圆形档案门、地面接触线始终对齐。
 * 边界：只画不改——不碰碰撞数组、玩家物理、二段跳手感、莫罗验证、背景图；缺图 /
 *   缺背景映射时静默跳过绘制，开门条件与切图逻辑照常（不卡流程）。
 * 加载顺序：game.js 之后（index.html 中紧随 game-archive-hall.js）。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  const IB_NOTE_MS = 900;      // 与 game-index-book.js 的「二次跃迁确认」小字停留一致
  const SWEEP_TICKS = 4;       // 扫描光推进时的提示音拍数

  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }
  function clamp01(k) { return k < 0 ? 0 : (k > 1 ? 1 : k); }
  function easeOut(k) { k = clamp01(k); return 1 - (1 - k) * (1 - k); }
  function easeInOut(k) { k = clamp01(k); return k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k); }

  Object.assign(Game.prototype, {
    /* 本关档案门配置（仅 library_gate）；其它地图 / 缺配置返回 null */
    _archiveDoorCfg() {
      const L = this.level;
      if (!L || !L.def || this.mapId !== 'library_gate') return null;
      return (L.def.archiveHall && L.def.archiveHall.archiveDoor) || null;
    },
    /* 素材（同一 Game 实例只 new Image 一次；未就绪返回 null，静默跳过绘制） */
    _archiveDoorImg(cfg) {
      if (!this._archDoorImg) {
        const im = new Image();
        im.src = cfg.sheet;
        this._archDoorImg = im;
      }
      const im = this._archDoorImg;
      return (im && im.complete && im.naturalWidth > 0) ? im : null;
    },
    /* 四项开门条件（① 邀请 ② 验证 ③ 二段跳 ④ 原地成功）；重访跳过重复教学 */
    _archiveDoorUnlocked() {
      const s = this.save;
      if (!s || !this.player) return false;
      if (!s.has('doubleJump')) return false;                 // ③ 已经获得二段跳
      if (!s.has('libgate_book_open')) return false;          // ② 莫罗已完成邀请验证
      if (typeof this.hasClue === 'function' && !this.hasClue('home_invitation')) return false;  // ① 有效邀请
      if (this._archDoorSkipTeach) return true;                // 重访：跳过重复教学
      return s.has('libgate_dj_confirm');                     // ④ 已原地成功一次空中第二跳
    },
    /* ---------- 渲染（drawArchiveHall 末尾调用；纯绘制，不改逻辑） ----------
       门的位置 = 背景图中那扇圆形档案门；用 _bgCoverDraw 把 native 像素换算到屏幕，
       与背景一起随相机横向滚动、随窗口等比缩放（不需要额外坐标常量）。 */
    drawArchiveDoor() {
      const cfg = this._archiveDoorCfg();
      if (!cfg) return;
      // 通过全部检查前门扇不出现：只有条件达成 / 演出中 / 已开启过才绘制。
      // （背景已换成无门版本，因此这里是门唯一的出现来源。）
      const unlocked = this._archiveDoorUnlocked();
      if (!unlocked && !this.save.has('libgate_door_open')
          && this._archDoorStage !== 'appear'
          && this._archDoorStage !== 'opening'
          && this._archDoorStage !== 'open') return;
      const bd = this._bgCoverDraw;                 // drawBackground(bgCover) 记录的整幅映射
      if (!bd || !bd.img || !bd.img.complete || bd.img.naturalWidth <= 0) return;
      const ctx = this.ctx;
      const sx = bd.dw / bd.img.naturalWidth;       // native → 屏幕 横比
      const sy = bd.dh / bd.img.naturalHeight;      // native → 屏幕 纵比
      const toX = nx => bd.dx + nx * sx;
      const toY = ny => bd.dy + ny * sy;
      const closed = cfg.cropClosed, open = cfg.cropOpen;
      if (!closed || !open) return;

      // 门框（以「关闭」片的宽高比为准，保证两态同位同尺寸）
      const hScr = cfg.heightNative * sy;
      const wScr = hScr * (closed.w / closed.h);
      const x0 = toX(cfg.centerNativeX) - wScr / 2;
      const y0 = toY(cfg.bottomNativeY) - hScr;
      const bottom = toY(cfg.bottomNativeY);

      const img = this._archiveDoorImg(cfg);
      if (!img) return;                             // 缺图：静默跳过（不回退色块）

      const t0 = this._archDoorT0;
      const stage = this._archDoorStage || (this.save.has('libgate_door_open') ? 'open' : 'closed');
      const openMs = cfg.openMs || 1100;
      // 开门动画只在 t0（真正的开门时刻）记录后才推进；扫描阶段 t0 为 null → 门保持关闭，
      // 避免「扫描期间门先开、随后 t0 重置又合上重开」的两次打开现象。
      const openK = (stage === 'opening' && t0 != null)
        ? easeOut((now() - t0) / openMs)
        : (stage === 'open' ? 1 : 0);

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      // ① 门扇：关闭片淡出、开启片淡入（opening 期间交叉）
      if (openK < 1) {
        ctx.globalAlpha = 1 - openK;
        ctx.drawImage(img, closed.x, closed.y, closed.w, closed.h, x0, y0, wScr, hScr);
      }
      if (openK > 0) {
        const ow = hScr * (open.w / open.h);
        ctx.globalAlpha = openK;
        ctx.drawImage(img, open.x, open.y, open.w, open.h,
          toX(cfg.centerNativeX) - ow / 2, y0, ow, hScr);
      }
      ctx.restore();

      // ② 门内「向上延伸的记忆档案井」：暖金光带向上流动 + 竖向亮芯（加法光效）
      if (openK > 0.02 && cfg.well) {
        const wl = cfg.well;
        const wx0 = x0 + wScr * wl.x, wy0 = y0 + hScr * wl.y;
        const ww = wScr * wl.w, wh = hScr * wl.h;
        ctx.save();
        ctx.beginPath(); ctx.rect(wx0, wy0, ww, wh); ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        // 竖向亮芯：顶端最亮 → 读作「向上延伸」
        const core = ctx.createLinearGradient(0, wy0, 0, wy0 + wh);
        core.addColorStop(0, 'rgba(255,236,196,' + (0.30 * openK).toFixed(3) + ')');
        core.addColorStop(1, 'rgba(255,206,138,' + (0.05 * openK).toFixed(3) + ')');
        ctx.fillStyle = core;
        ctx.fillRect(wx0, wy0, ww, wh);
        // 光带：等距横条整体向上流动（wellSpeed 世界 px/秒）
        const period = 26;
        const off = ((now() / 1000) * (cfg.wellSpeed || 58)) % period;
        ctx.fillStyle = 'rgba(255,214,150,' + (0.14 * openK).toFixed(3) + ')';
        for (let y = wy0 + wh + period - off; y > wy0 - 1; y -= period) {
          ctx.fillRect(wx0, y - 7, ww, 7);
        }
        ctx.restore();
      }

      // ③ 开门演出：接待台发出暖金色扫描光（沿走廊扫向门）+ 门面余晖
      //    扫描计时以 _archDoorScanT0 为准（独立于开门动画时刻 _archDoorT0）
      if (stage === 'opening' && this._archDoorScanT0 != null) {
        const scanMs = cfg.scanMs || 900;
        const k = clamp01((now() - this._archDoorScanT0) / scanMs);
        const deskCol = ((this.level.def.archiveHall || {}).deskLight || {}).col || 29.7;
        const deskX = this.camera.toScreen(deskCol * this.tile, 0).x;
        const doorX = toX(cfg.centerNativeX);
        const beamX = deskX + (doorX - deskX) * easeInOut(k);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // ① 接待台起点的暖金爆发（前 40% 最强）
        const burst = Math.max(0, 1 - k / 0.4);
        if (burst > 0) {
          const g = ctx.createRadialGradient(deskX, bottom, 4, deskX, bottom, 240);
          g.addColorStop(0, 'rgba(255,222,164,' + (0.34 * burst).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(255,190,110,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(deskX, bottom, 240, 0, Math.PI * 2); ctx.fill();
        }
        // ② 扫掠光柱：从接待台扫到门（竖条 + 柔边）
        const beamH = hScr * 1.15;
        const bg2 = ctx.createLinearGradient(0, bottom - beamH, 0, bottom + 24);
        bg2.addColorStop(0, 'rgba(255,236,196,0)');
        bg2.addColorStop(0.55, 'rgba(255,222,164,' + (0.30 * (1 - k * 0.5)).toFixed(3) + ')');
        bg2.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = bg2;
        ctx.fillRect(beamX - 13, bottom - beamH, 26, beamH + 24);
        ctx.fillStyle = 'rgba(255,244,214,' + (0.20 * (1 - k * 0.6)).toFixed(3) + ')';
        ctx.fillRect(beamX - 3, bottom - beamH, 6, beamH + 24);
        // ③ 门面余晖：扫描抵达后门自身亮起来
        const near = Math.max(0, 1 - Math.abs(doorX - beamX) / 180);
        if (near > 0) {
          const cyD = y0 + hScr * 0.5;
          const g2 = ctx.createRadialGradient(doorX, cyD, 6, doorX, cyD, wScr * 0.95);
          g2.addColorStop(0, 'rgba(255,228,176,' + (0.26 * near).toFixed(3) + ')');
          g2.addColorStop(1, 'rgba(255,190,110,0)');
          ctx.fillStyle = g2;
          ctx.beginPath(); ctx.arc(doorX, cyD, wScr * 0.95, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        // 扫掠提示音：SWEEP_TICKS 拍（按下标去重，避免每帧都响）
        const tick = Math.min(SWEEP_TICKS - 1, Math.floor(k * SWEEP_TICKS));
        if (this._archDoorSweepTick !== tick) {
          this._archDoorSweepTick = tick;
          if (window.Audio2 && Audio2.reveal) Audio2.reveal(tick);
        }
      } else {
        this._archDoorSweepTick = -1;
      }

      // ④ 已开启且还没进去：门口一层极克制的呼吸暖光（提示「这里可进」，不抢交互标签）
      if (stage === 'open' && !this.save.has('libgate_library')) {
        const doorX = toX(cfg.centerNativeX);
        const pulse = 0.5 + 0.5 * Math.sin(now() / 700);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g3 = ctx.createRadialGradient(doorX, bottom, 8, doorX, bottom, wScr * 1.05);
        g3.addColorStop(0, 'rgba(255,214,140,' + (0.06 + 0.06 * pulse).toFixed(3) + ')');
        g3.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = g3;
        ctx.beginPath(); ctx.arc(doorX, bottom, wScr * 1.05, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    },
    /* ---------- 每帧：开门条件监听（由 game-loop update 调用；只读玩家状态） ----------
       顺序刻意与演出一致：先等「二次跃迁确认」小字自然消失、且玩家已落地，再开演，
       避免在空中冻结物理（startEvents 会把 status 置 busy）。其余情况零开销。 */
    archiveDoorTick() {
      const cfg = this._archiveDoorCfg();
      if (!cfg) {                       // 离开接待前厅：清掉本关的会话状态
        this._archDoorStage = null;
        this._archDoorT0 = null;
        this._archDoorScanT0 = null;
        this._archDoorQueued = false;
        this._archDoorSkipTeach = null;
        this._moroPose = 'idle';        // 复位莫罗姿态
        return;
      }
      // 进入本关时就已经领取过索引册（上一轮会话）+ 已有二段跳 → 跳过重复教学：
      // 只需要邀请 + 验证即可开门（对应「重访时已经拥有二段跳」）
      if (this._archDoorSkipTeach == null) {
        this._archDoorSkipTeach = !!(this.save.has('libgate_book') && this.save.has('doubleJump'));
      }
      if (this.save.has('libgate_door_open')) {           // 已开启（本局或上一局）
        if (this._archDoorStage !== 'open') { this._archDoorStage = 'open'; this._archDoorT0 = null; this._archDoorScanT0 = null; }
        this._archDoorQueued = false;
        return;
      }
      if (this._archDoorStage === 'opening' || this._archDoorQueued) {
        // 自愈：演出若在中途被打断（退出/重开使 token 失效）没能推进到 open，
        // 超时后解除卡住的 opening，下一次 tick 重新排队（扫描阶段 t0 为 null，
        // 取扫描开始时刻 _archDoorScanT0 计超时；对白阶段两个时刻均为空，不受影响）。
        if (this._archDoorStage === 'opening' && (this._archDoorT0 != null || this._archDoorScanT0 != null)) {
          const from = this._archDoorT0 != null ? this._archDoorT0 : this._archDoorScanT0;
          const budget = (cfg.scanMs || 900) + (cfg.openMs || 1100) + (cfg.holdMs || 700) + 4000;
          if (now() - from > budget) {
            this._archDoorStage = null;
            this._archDoorT0 = null;
            this._archDoorScanT0 = null;
            this._archDoorQueued = false;
          }
        }
        return;   // 演出已排队/进行中
      }
      if (!this._archiveDoorUnlocked()) return;
      const p = this.player;
      if (!p || !p.onGround) return;                      // 落地后再演（不冻结空中物理）
      const fx = this._ibConfirmFx;                       // 阶段5 的确认小字
      if (fx && (now() - fx.t0) < IB_NOTE_MS) return;      // 让它先消失
      if (this.status !== 'running') return;              // busy 帧不排队（startEvents 会静默失效）
      // 只置「已排队」标记，真正切到 opening 由 playArchiveDoor 完成：
      // 若这一帧因任何原因没能开演，下一帧仍会重试（不会卡在半开状态）。
      this._archDoorQueued = true;
      this._archDoorSweepTick = -1;
      this.startEvents([{ type: 'archiveDoor' }], []);
    },
    /* ---------- 事件入口：开门演出（archiveDoorTick 排队 → game-events 分派） ----------
       ① 扫描光（scanMs）→ ② 门开（openMs）→ 写一次性 flag libgate_door_open → 
       ③ 停顿 → ④ 三句对白（莫罗 / 埃尔 / 莫罗）→ 交还控制 + 一次「走到门前」指引。
       不切图、不动玩家、不写钥匙；期间 status=busy（玩家无法操作），结束后自动恢复。 */
    async playArchiveDoor(ev, token) {
      ev = ev || {};
      const cfg = this._archiveDoorCfg() || {};
      const alive = () => (token == null || token === this._runToken);
      this._archDoorQueued = false;
      this._archDoorStage = 'appear';                     // 门先以「关闭」态出现
      this._archDoorT0 = null;
      // ⓪ 门出现后、开门前：莫罗的引导（此时门仍关闭）—— 莫罗切换到「抬手说明」姿态
      this._moroPose = 'speak';
      const approach = Array.isArray(cfg.approachLines) ? cfg.approachLines : [];
      for (const l of approach) {
        await this.dialog.show([pickText(l.text, l.text_en)]);
        await this.waitWhilePaused();
        if (!alive()) return;
      }
      this._archDoorStage = 'opening';
      this._archDoorScanT0 = now();                       // 扫描开始时刻（扫描期间门保持关闭）
      this._archDoorT0 = null;                            // 开门动画尚未开始
      if (window.Audio2 && Audio2.click) Audio2.click();
      await delay(cfg.scanMs || 900);                     // ① 接待台暖金色扫描光（门仍关闭）
      await this.waitWhilePaused();
      if (!alive()) return;
      this._archDoorT0 = now();                           // 门开始打开（渲染层按此时刻交叉淡入）
      await delay(cfg.openMs || 1100);                    // ② 关闭 → 开启
      await this.waitWhilePaused();
      if (!alive()) return;
      this._archDoorStage = 'open';
      this._archDoorT0 = null;
      this._archDoorScanT0 = null;
      // 门已开启：莫罗切换到「侧身指引」姿态，引导玩家走向大门
      this._moroPose = 'point';
      if (!this.save.has('libgate_door_open')) {          // 幂等：只写一次并立刻落盘
        this.save.addFlags(['libgate_door_open']);
        this.save.persist();
      }
      if (window.Audio2 && Audio2.success) Audio2.success();
      await delay(cfg.holdMs || 700);                     // ③ 门内记忆井亮起后停顿
      await this.waitWhilePaused();
      if (!alive()) return;
      const lines = Array.isArray(cfg.lines) ? cfg.lines : [];
      for (const l of lines) {                            // ④ 对白
        await this.dialog.show([pickText(l.text, l.text_en)]);
        await this.waitWhilePaused();
        if (!alive()) return;
      }
      // ⑤ 交还控制（由事件链结束自动恢复）后给一次指引：门开着，自己走过去按 E
      const hint = (window.I18N && I18N.t) ? I18N.t('libgate_door_goal') : '';
      if (hint) this.showGoalHint(hint, 6000);
    },
  });
})();