/* ============================================================================
 * engine/game-archive-hall.js —— 年鉴馆接待前厅（library_gate）走廊表现
 * ----------------------------------------------------------------------------
 * 只画不改：由 def.archiveHall 驱动的纯渲染层，负责
 *   ① 莫罗：透明 PNG「静立」姿态，站在接待台后方（独立角色，非烘焙进背景）；
 *   ② 接待台遮罩：把背景原图的接待台区域再画一次，盖住莫罗下半身 →
 *      读作「站在台后」，不需要额外美工、也不改动背景图；
 *   ③ 接待台暖光：静态（无脉冲/无闪烁）的暖色径向光，让接待台比走廊其他区域
 *      稍亮，兼作方向引导（不使用持续闪烁的大箭头）；
 *   ④ 交互表现：调查点（marker:'soft'）的柔和光环 + 靠近接待台（marker:'desk'）
 *      时的柔和交互轮廓。
 * 缺配置 / 图片未就绪时静默跳过（不回退色块、不报错）。
 * 边界：不碰碰撞数组、玩家物理、触发器判定、检查点、出口、存档。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  /* 调查点：柔和的暖金光环（静态、无闪烁）——清楚但克制 */
  function drawSoftRing(ctx, cx, cy) {
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 24);
    g.addColorStop(0, 'rgba(255,224,164,0.30)');
    g.addColorStop(1, 'rgba(255,224,164,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,228,176,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,236,200,0.95)';
    ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* 接待台：靠近时的柔和交互轮廓（低透明度暖金 + 柔光边缘） */
  function drawSoftOutline(ctx, x, y, w, h) {
    const r = Math.min(12, h * 0.14);
    ctx.save();
    ctx.shadowColor = 'rgba(255,206,138,0.75)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(255,216,156,0.55)';
    ctx.lineWidth = 2;
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
    ctx.stroke();
    ctx.restore();
  }

  /* 阶段4·扫描台辅助：当前时刻 / 圆角矩形路径 */
  function nowMs() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }
  function roundRectPath(ctx, x, y, w, h, r) {
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

  Object.assign(Game.prototype, {
    /* 懒加载本关独立素材（莫罗三姿态立绘）：同一 Game 实例每种姿态只 new Image 一次 */
    _archiveHallImages(cfg) {
      if (!this._archHall) this._archHall = {};
      const poses = cfg && cfg.morro && cfg.morro.poses;
      if (poses) {
        for (const key of Object.keys(poses)) {
          const src = poses[key].image;
          if (src && !this._archHall['morro_' + key]) {
            const im = new Image();
            im.src = src;
            this._archHall['morro_' + key] = im;
          }
        }
      }
      return this._archHall;
    },
    /* 莫罗当前姿态键：由交互模块设置 this._moroPose（'idle'|'speak'|'point'）；
       缺省回退到配置 defaultPose，再回退 'idle'。重访且大门已开时强制 'point'。 */
    _moroCurrentPose(cfg) {
      if (this.save && this.save.has('libgate_door_open')) return 'point';
      const p = this._moroPose;
      if (p && cfg && cfg.morro && cfg.morro.poses && cfg.morro.poses[p]) return p;
      return (cfg && cfg.morro && cfg.morro.defaultPose) || 'idle';
    },
    /* 玩家是否在给定世界矩形附近（水平方向；用于「靠近才显示轮廓」） */
    _nearRectX(r, pad) {
      const p = this.player;
      if (!p || !r) return false;
      return p.x >= r.x - pad && p.x <= r.x + r.w + pad;
    },
    drawArchiveHall() {
      const L = this.level;
      if (!L || !L.def) return;
      const cfg = L.def.archiveHall;
      if (!cfg) return;
      const ctx = this.ctx, T = this.tile, cam = this.camera;
      const groundY = (L.def.groundY != null)
        ? L.def.groundY
        : (L.def.hideGroundFromRow != null ? L.def.hideGroundFromRow * T : 0);

      // ① 莫罗（先画；下半身稍后被接待台遮罩盖住）
      const imgs = this._archiveHallImages(cfg);
      const mo = cfg.morro;
      const poseKey = this._moroCurrentPose(cfg);
      const morroImg = imgs['morro_' + poseKey];
      if (mo && morroImg && morroImg.complete && morroImg.naturalWidth > 0) {
        const h = mo.height || 200;
        const w = h * (morroImg.naturalWidth / morroImg.naturalHeight);
        const cx = (mo.col != null ? mo.col : 27.5) * T;
        const p = cam.toScreen(cx - w / 2, groundY - h);
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(morroImg, p.x, p.y, w, h);
        ctx.restore();
      }

      // ② 接待台遮罩：把背景原图的接待台区域再画一次，盖住莫罗下半身
      const bd = this._bgCoverDraw;
      const oc = cfg.deskOcclude;
      if (bd && oc && bd.img && bd.img.complete && bd.img.naturalWidth > 0) {
        const k = bd.dw / bd.img.naturalWidth;
        ctx.drawImage(bd.img, oc.x, oc.y, oc.w, oc.h,
          bd.dx + oc.x * k, bd.dy + oc.y * k, oc.w * k, oc.h * k);
      }

      // ②' 阶段6·主档案门（关闭/开启两态 + 门内向上延伸的记忆档案井 + 开门扫描光）：
      //     由 game-archive-door.js 的同名方法绘制。放在接待台遮罩之后、暖光之前，
      //     这样接待台暖光会一并落在门上；模块未加载时静默跳过。
      if (typeof this.drawArchiveDoor === 'function') this.drawArchiveDoor();

      // ③ 接待台暖光（静态、无脉冲）
      const dl = cfg.deskLight;
      if (dl) {
        const cxp = cam.toScreen((dl.col != null ? dl.col : 29.7) * T, 0).x;
        const cyp = cam.toScreen(0, (dl.y != null ? dl.y : 540)).y;
        const r = dl.radius || 320;
        const g = ctx.createRadialGradient(cxp, cyp, r * 0.05, cxp, cyp, r);
        g.addColorStop(0, 'rgba(255,206,138,0.20)');
        g.addColorStop(0.55, 'rgba(255,186,110,0.08)');
        g.addColorStop(1, 'rgba(255,170,90,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cxp, cyp, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // ④ 调查点柔和标记 + 接待台柔和交互轮廓
      const ol = cfg.deskOutline;
      for (const t of L.triggers) {
        if (!t.marker || t._activated) continue;
        if (t.showAfter != null && this.player && this.player.x < t.showAfter) continue;
        // 已记录指定线索后不再绘制提示（验证完成后接待台轮廓消失）
        if (t.hideAfterClue && typeof this.hasClue === 'function' && this.hasClue(t.hideAfterClue)) continue;
        if (t.marker === 'desk') {
          if (ol && this._nearRectX(t.rect, 3 * T)) {
            const p = cam.toScreen(ol.x, ol.y);
            drawSoftOutline(ctx, p.x, p.y, ol.w, ol.h);
          }
        } else if (t.marker === 'soft') {
          const p = cam.toScreen(t.rect.x + t.rect.w / 2, t.rect.y + 22);
          drawSoftRing(ctx, p.x, p.y);
        }
      }

      // ⑤ 阶段4·邀请验证扫描台（程序绘制，非图片）：演出时显示 待机→扫描→验证通过
      const sc = this._inviteScan;
      const rd = cfg.scanReader;
      if (sc && rd && sc.state) {
        const p = cam.toScreen(rd.x, rd.y);
        const w = rd.w, h = rd.h;
        const label = (window.I18N && I18N.t)
          ? I18N.t(sc.state === 'idle' ? 'invite_scan_idle'
              : (sc.state === 'scanning' ? 'invite_scan_run' : 'invite_scan_ok'))
          : '';
        ctx.save();
        // 读取台底座
        ctx.shadowColor = 'rgba(255,206,138,0.6)';
        ctx.shadowBlur = sc.state === 'verified' ? 16 : 8;
        ctx.fillStyle = 'rgba(30,24,16,0.85)';
        roundRectPath(ctx, p.x, p.y, w, h, 4);
        ctx.fill();
        ctx.strokeStyle = sc.state === 'verified' ? 'rgba(255,214,140,0.95)'
          : (sc.state === 'scanning' ? 'rgba(180,214,255,0.9)' : 'rgba(214,214,200,0.55)');
        ctx.lineWidth = 2;
        roundRectPath(ctx, p.x, p.y, w, h, 4);
        ctx.stroke();
        ctx.shadowBlur = 0;
        // 台面内容：待机=暗条；扫描=来回扫掠亮条；验证通过=金色对勾
        if (sc.state === 'idle') {
          ctx.fillStyle = 'rgba(150,150,140,0.35)';
          ctx.fillRect(p.x + 6, p.y + h / 2 - 1.5, w - 12, 3);
        } else if (sc.state === 'scanning') {
          const phase = ((nowMs() - sc.t0) / 900) % 2;
          const k = phase < 1 ? phase : 2 - phase;
          ctx.fillStyle = 'rgba(120,190,255,0.35)';
          ctx.fillRect(p.x + 4, p.y + 3, w - 8, h - 6);
          ctx.fillStyle = 'rgba(210,236,255,0.95)';
          ctx.fillRect(p.x + 4 + (w - 16) * k, p.y + 3, 8, h - 6);
        } else {
          ctx.strokeStyle = 'rgba(255,222,150,0.98)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(p.x + w * 0.30, p.y + h * 0.52);
          ctx.lineTo(p.x + w * 0.44, p.y + h * 0.74);
          ctx.lineTo(p.x + w * 0.70, p.y + h * 0.26);
          ctx.stroke();
        }
        // 状态小字（读取器上方）
        if (label) {
          ctx.font = '12px "Noto Sans SC", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = sc.state === 'verified' ? 'rgba(255,224,164,0.95)'
            : (sc.state === 'scanning' ? 'rgba(196,224,255,0.9)' : 'rgba(214,214,200,0.75)');
          ctx.fillText(label, p.x + w / 2, p.y - 6);
        }
        ctx.restore();
      }

      // ⑥ 阶段5·访客索引册（档案槽 + 合册推出 + 领取展开特效 + 原地二段跳反馈）：
      //    由 game-index-book.js 的同名方法绘制；模块未加载时静默跳过。
      if (typeof this.drawIndexBook === 'function') this.drawIndexBook();
    },
  });
})();
