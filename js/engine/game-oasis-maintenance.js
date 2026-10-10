/* ============================================================================
 * engine/game-oasis-maintenance.js —— Game 方法组 · 逆流档案调查点
 * ----------------------------------------------------------------------------
 * OASIS 入口（oasis）的可选支线（改造自 E3·S1 维护点）：主路约 45% 处身后亮起
 * 档案信号，提示玩家回退逐一查看三处被忽略的档案。每查看一处，下一处才揭开
 * （逐点揭开）。三点齐备后传送机启动，把玩家送回主路约 70%（接近终点）。
 * 不回头可直接通关，不写任何负面状态。
 *
 * 交互：靠近当前目标 → 底部提示 [E] 查看档案；按 E 或鼠标点击（画面内点中目标
 * / 底部按钮）立即查看对白（无需长按）。与接待前厅的三个调查点一致。
 *
 * 几何真值：js/data/route-oasis.js 的 maintenance 段（三个点 + 传送机锚点）。
 * 文本/提交：story_config.maps.oasis.maintenance.completeEvents（证据 + 唯一状态）。
 * 进度状态：save flags oasis_maint_revealed / oasis_maint_1..3 / oasis_maintenance_seen。
 *
 * 只读约束：不改碰撞、跳跃/冲刺参数、route/nav 既有数据、主线触发与背景图。
 * 加载顺序：game.js 之后、game-scene.js 之前（与其它 Game 方法组一致）。
 * ==========================================================================*/
'use strict';
(function () {
  const TRIGGER_DEFAULT = 0.45;
  const RADIUS_DEFAULT = 72;
  // 三个调查点的内容文案键（写成字面量数组，便于 i18n 引用扫描）
  const POINT_KEYS = ['maint_point_1', 'maint_point_2', 'maint_point_3'];
  // 进度 flag：第 n 点完成写第 n 个；最终状态只在三点齐备后写一次
  const PROGRESS_FLAGS = ['oasis_maint_1', 'oasis_maint_2', 'oasis_maint_3'];

  // 调查点柔和光环（静态、无闪烁；与接待前厅调查点一致）
  function drawSoftRing(ctx, cx, cy, alpha) {
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 22);
    g.addColorStop(0, 'rgba(255,224,164,' + (0.30 * alpha).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,224,164,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,228,176,' + (0.75 * alpha).toFixed(3) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,236,200,' + (0.95 * alpha).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(cx, cy, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // 已查看：淡环 + 中心小点（与未查看区分）
  function drawRecorded(ctx, cx, cy) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(255,228,176,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,236,200,0.85)';
    ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // 传送机：程序化平台 + 上箭头（无图片依赖，缺图也能用）
  function drawTeleporter(ctx, T, lp) {
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = '#9fd8ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(lp.x, lp.y, T * 0.85, T * 0.30, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(lp.x, lp.y - T * 0.55, T * 0.60, T * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath();
    ctx.moveTo(lp.x - T * 0.26, lp.y - T * 1.0);
    ctx.lineTo(lp.x, lp.y - T * 1.5);
    ctx.lineTo(lp.x + T * 0.26, lp.y - T * 1.0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  Object.assign(Game.prototype, {
    /* 懒初始化：关卡实例变化时从 route 数据 + 存档重建支线状态。 */
    _oasisMaintEnsure() {
      const L = this.level;
      if (!L || this.mapId !== 'oasis') { this._maintLevel = null; return null; }
      if (this._maintLevel === L && L.maint) return L.maint;
      this._maintLevel = L;
      const T = this.tile;
      const route = (window.ROUTE_DATA && ROUTE_DATA.oasis) || null;
      const data = (route && route.maintenance) || null;
      const pts = (data && Array.isArray(data.points)) ? data.points : [];
      const points = pts.map((p, i) => ({
        id: p.id || ('nr' + (i + 1)), index: i,
        t: typeof p.t === 'number' ? p.t : 0,
        col: p.col, row: p.row,
        x: p.col * T + T / 2, y: p.row * T,
        state: 'dormant',
      }));
      const lf = (data && data.lift) || null;
      const lift = lf ? {
        col: lf.col, row: lf.row,
        x: lf.col * T + T / 2, y: lf.row * T,
        targetCol: lf.target && lf.target.col != null ? lf.target.col : lf.col,
        targetRow: lf.target && lf.target.row != null ? lf.target.row : lf.row,
        targetT: lf.targetT != null ? lf.targetT : 0.7,
      } : null;
      const m = {
        data, points, lift,
        triggerT: data && typeof data.triggerT === 'number' ? data.triggerT : TRIGGER_DEFAULT,
        radiusPx: data && typeof data.radiusPx === 'number' ? data.radiusPx : RADIUS_DEFAULT,
        triggered: false, revealed: false, done: false,
        mousePressed: false, cueIdx: '', errorCooldown: 0,
        revisitShown: false, completeQueued: false,
      };
      L.maint = m;
      m.revealed = this.save.has('oasis_maint_revealed') || this.save.has('oasis_maintenance_seen') || this._oasisMaintCount() > 0;
      m.done = this.save.has('oasis_maintenance_seen');
      m.triggered = m.revealed;
      // 逐点揭开：已查看的 recorded；下一处（信号已亮）revealed；其余 dormant
      const count = this._oasisMaintCount();
      for (const p of points) {
        p.state = this.save.has(PROGRESS_FLAGS[p.index]) ? 'recorded'
                : (m.revealed && p.index === count) ? 'revealed' : 'dormant';
      }
      this._oasisMaintBindDom();
      this._oasisMaintUpdateHud(m);
      return m;
    },
    _oasisMaintCount() {
      let n = 0;
      for (let i = 1; i <= 3; i++) if (this.save.has('oasis_maint_' + i)) n++;
      return n;
    },
    // routeT：优先官方 guided；缺模块时按 route 口径手算（x/(cols-1)/tile）
    _oasisMaintRouteT() {
      const g = this.level && this.level.guided;
      if (g && typeof g.routeT === 'function') return g.routeT();
      const w = (this.level.cols - 1) * this.tile;
      return w > 0 ? clamp(this.player.x / w, 0.02, 0.96) : 0;
    },
    _oasisMaintNear(px, py, x, y, r) {
      return Math.hypot(px - x, py - y) <= r;
    },
    // 当前可交互目标：下一个未查看点（逐点揭开）；或三点齐备后的传送机
    _oasisMaintTarget(m) {
      const T = this.tile;
      const n = this._oasisMaintCount();
      if (n < 3 && m.points[n] && m.points[n].state === 'revealed') {
        return { kind: 'point', pt: m.points[n], x: m.points[n].x, y: m.points[n].y - T * 1.05 };
      }
      if (n >= 3 && m.lift) return { kind: 'lift', x: m.lift.x, y: m.lift.y };
      return null;
    },
    _oasisMaintBindDom() {
      if (typeof document === 'undefined') return;
      // 底部按钮：鼠标点击查看/使用（替代原长按扫描）
      const btn = document.getElementById('scan-hold');
      if (btn && !btn._maintBound) {
        btn._maintBound = true;
        btn.addEventListener('click', e => {
          if (e) e.preventDefault();
          const m = this._maintLevel && this._maintLevel.maint;
          if (m) m.mousePressed = true;
        });
        btn.addEventListener('contextmenu', e => e.preventDefault());
      }
      // 画面内点击目标：与键盘 E 等价的鼠标交互
      if (this.canvas && !this._maintCanvasBound) {
        this._maintCanvasBound = true;
        this.canvas.addEventListener('click', e => this._oasisMaintCanvasClick(e));
      }
    },
    _oasisMaintCanvasClick(e) {
      const m = this._maintLevel && this._maintLevel.maint;
      if (!m || this.status !== 'running') return;
      const pt = (typeof this.scenePointFromEvent === 'function') ? this.scenePointFromEvent(e) : null;
      if (!pt) return;
      const tgt = this._oasisMaintTarget(m);
      if (!tgt) return;
      const sp = this.camera.toScreen(tgt.x, tgt.y);
      if (Math.hypot(pt.x - sp.x, pt.y - sp.y) <= this.tile * 1.7) m.mousePressed = true;
    },
    _oasisMaintUpdateHud(m) {
      if (typeof document === 'undefined') return;
      const el = document.getElementById('hud-maintenance');
      if (!el) return;
      if (!m || !m.revealed || m.done) { el.classList.add('hidden'); el.textContent = ''; return; }
      el.classList.remove('hidden');
      el.textContent = I18N.t('maint_progress', { n: this._oasisMaintCount() });
    },
    // 离开 oasis / 非运行态：收起 HUD 与鼠标按钮，避免残留
    _oasisMaintHideDom(hideHud) {
      if (typeof document === 'undefined') return;
      if (hideHud) {
        const h = document.getElementById('hud-maintenance');
        if (h) { h.classList.add('hidden'); h.textContent = ''; }
      }
      const b = document.getElementById('scan-hold');
      if (b) b.hidden = true;
    },
    // 唯一最终状态：三点齐备后只写一次（addFlags 幂等；写前复查）
    _oasisMaintWriteFinal() {
      if (this.save.has('oasis_maintenance_seen')) return false;
      this.save.addFlags(['oasis_maintenance_seen']);
      this.save.persist();
      return true;
    },
    // 单个调查点查看完成：写进度 flag（幂等），弹档案对白；第 3 点写最终状态并接完成链
    _oasisMaintRecord(m, pt) {
      const n = pt.index + 1;
      if (!this.save.has(PROGRESS_FLAGS[n - 1])) {
        this.save.addFlags([PROGRESS_FLAGS[n - 1]]);
        this.save.persist();
      }
      pt.state = 'recorded';
      if (window.Audio2 && Audio2.reveal) Audio2.reveal(n);
      const chain = [{ type: 'dialog', text: [I18N.t(POINT_KEYS[n - 1] || POINT_KEYS[0])] }];
      const cfg = (this.cfg.maps.oasis && this.cfg.maps.oasis.maintenance) || {};
      if (n >= 3) {
        this._oasisMaintWriteFinal();
        if (Array.isArray(cfg.completeEvents)) chain.push(...cfg.completeEvents);
        m.done = true;
        m.completeQueued = true;
      } else if (m.points[n]) {
        m.points[n].state = 'revealed';   // 逐点揭开下一处
      }
      this._oasisMaintUpdateHud(m);
      this.startEvents(chain, []);
    },
    // 三记录齐备但未写最终状态（刷新/异常中断兜底）：补写状态 + 补一次完成链
    _oasisMaintCompleteIfNeeded(m) {
      if (!m || m.completeQueued || this.save.has('oasis_maintenance_seen')) return false;
      if (this._oasisMaintCount() < 3) return false;
      const cfg = (this.cfg.maps.oasis && this.cfg.maps.oasis.maintenance) || {};
      this._oasisMaintWriteFinal();
      m.completeQueued = true; m.done = true;
      this._oasisMaintUpdateHud(m);
      if (Array.isArray(cfg.completeEvents) && cfg.completeEvents.length) {
        this.startEvents(cfg.completeEvents.slice(), []);
        return true;
      }
      return false;
    },
    // 传送机：仅三点完成后可用，送回主路目标锚点（无图片依赖，直接安全传送）
    _oasisMaintUseLift(m) {
      if (!m || !m.lift || this._oasisMaintCount() < 3) return false;
      const T = this.tile;
      this.player.x = m.lift.targetCol * T + T / 2;
      this.player.y = m.lift.targetRow * T - this.player.h / 2;
      this.player.vx = 0; this.player.vy = 0;
      this.save.spawn = { col: m.lift.targetCol, row: m.lift.targetRow };
      this.save.persist();
      if (window.Audio2 && Audio2.checkpoint) Audio2.checkpoint();
      if (window.App && typeof App.toast === 'function') App.toast(I18N.t('maint_lift_use'));
      return true;
    },
    /* 主循环：触发提示 / 逐点揭开 / 顺序校验 / 按 E 或点击查看 / 传送机。 */
    oasisMaintenanceTick() {
      const onOasis = !!this.level && this.mapId === 'oasis';
      if (!onOasis || this.status !== 'running' || !this.player) {
        this._oasisMaintHideDom(!onOasis);   // 离开 oasis 同时收起 HUD；非运行态只收按钮
        return;
      }
      const m = this._oasisMaintEnsure();
      if (!m) return;
      const T = this.tile;
      const p = this.player;

      // ① 主路进度越过 45%：身后信号首次亮起，揭开第一处（只一次；不暂停、不弹窗）
      if (!m.triggered) {
        if (this._oasisMaintRouteT() >= m.triggerT) {
          m.triggered = true; m.revealed = true;
          const count = this._oasisMaintCount();
          if (m.points[count]) m.points[count].state = 'revealed';
          this.save.addFlags(['oasis_maint_revealed']);
          this.save.persist();
          if (window.Audio2 && Audio2.error) Audio2.error();
          if (window.App && typeof App.toast === 'function') App.toast(I18N.t('maint_optional_hint'));
        }
        this._oasisMaintUpdateHud(m);
        return;
      }

      // ② 重访提示（已查看时，每次进关一次）
      if (this.save.has('oasis_maintenance_seen') && !m.revisitShown) {
        let nearBranch = m.lift && this._oasisMaintNear(p.x, p.y, m.lift.x, m.lift.y, m.radiusPx + T);
        if (!nearBranch) for (const pt of m.points) {
          if (pt.state === 'recorded' && this._oasisMaintNear(p.x, p.y, pt.x, pt.y, m.radiusPx + T)) { nearBranch = true; break; }
        }
        if (nearBranch) {
          m.revisitShown = true;
          if (window.App && typeof App.toast === 'function') App.toast(I18N.t('maint_revisit'));
        }
      }
      if (this._oasisMaintCompleteIfNeeded(m)) return;

      // ③ 当前目标 + 就近判定
      const tgt = this._oasisMaintTarget(m);
      const near = !!(tgt && this._oasisMaintNear(p.x, p.y, tgt.x, tgt.y, m.radiusPx));
      const btn = (typeof document !== 'undefined') ? document.getElementById('scan-hold') : null;

      // 顺序校验：碰到尚未轮到的靠后记录 → 提示缺前序，不推进、不代完成
      const n = this._oasisMaintCount();
      if (tgt && tgt.kind === 'point' && m.errorCooldown <= 0) {
        for (const pt of m.points) {
          if (pt.index > n && pt.state === 'dormant' && this._oasisMaintNear(p.x, p.y, pt.x, pt.y, m.radiusPx)) {
            m.errorCooldown = 90;
            if (window.App && typeof App.toast === 'function') App.toast(I18N.t('maint_need_prev'));
            break;
          }
        }
      }
      if (m.errorCooldown > 0) m.errorCooldown--;

      // 靠近目标：一次轻微提示音（状态翻转沿，不反复响）
      const cue = near ? tgt.kind : '';
      if (cue && m.cueIdx !== cue && window.Audio2 && Audio2.hover) Audio2.hover();
      m.cueIdx = cue;

      // ④ 按 E / 鼠标点击查看（立即，无需长按）
      if (near && tgt) {
        this.player.canInteract = true;
        this.player.interactLabel = (tgt.kind === 'lift') ? I18N.t('maint_lift_use') : I18N.t('maint_scan_hold');
        if (btn) { btn.hidden = false; btn.textContent = (tgt.kind === 'lift') ? I18N.t('maint_lift_use') : I18N.t('maint_scan_mouse'); }
        if (this.input.wasPressed(...KEYBINDS.interact) || m.mousePressed) {
          m.mousePressed = false;
          if (btn) btn.hidden = true;
          if (tgt.kind === 'lift') { this._oasisMaintUseLift(m); return; }
          this._oasisMaintRecord(m, tgt.pt);
          return;
        }
      } else if (btn) {
        btn.hidden = true;
      }
      m.mousePressed = false;
      this._oasisMaintUpdateHud(m);
    },
    /* 渲染：调查点柔和标记 / 传送机（纯程序化，无图片依赖）。 */
    drawOasisMaintenance() {
      if (!this.level || this.mapId !== 'oasis') return;
      const m = this._maintLevel && this._maintLevel.maint;
      if (!m || !m.revealed) return;
      const ctx = this.ctx, T = this.tile;

      for (const pt of m.points) {
        if (pt.state === 'dormant') continue;
        const p = this.camera.toScreen(pt.x, pt.y - T * 1.05);
        if (p.x < -60 || p.x > this.viewW + 60 || p.y < -80 || p.y > this.viewH + 80) continue;
        if (pt.state === 'recorded') drawRecorded(ctx, p.x, p.y);
        else drawSoftRing(ctx, p.x, p.y, 1);
      }

      // 传送机（三点齐备后可用；程序化平台 + 上箭头）
      if (m.lift && this._oasisMaintCount() >= 3) {
        const lp = this.camera.toScreen(m.lift.x, m.lift.y);
        if (lp.x > -80 && lp.x < this.viewW + 80) drawTeleporter(ctx, T, lp);
      }
    },
  });
})();
