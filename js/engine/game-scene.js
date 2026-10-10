/* ============================================================================
 * engine/game-scene.js —— Game 方法组 · 场景模式
 * ----------------------------------------------------------------------------
 * mode:"scene" 的静态画面关卡（家 / 阳台 / 过渡页）：背景图加载、
 * 鼠标热区命中、悬停与点击、场景检视面板、场景渲染。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 2276-2468 行）。方法体未作任何改动；
 * 因改用对象字面量承载，仅在每个方法结束的大括号后补了成员分隔逗号。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  loadSceneImage(name) {
    if (!name) return null;
    let img = this.sceneImages[name];
    if (!img) {
      img = new Image();
      img.onerror = () => { img.__failed = true; };   // 供 drawScene 的 fallback 链判定
      img.src = name;
      this.sceneImages[name] = img;
    }
    return img;
  },
  // 跑酷背景图加载（移植自gry长街 bgScroll 背景机制）
  loadBgImage(name) {
    if (!name) return null;
    let img = this.bgImages[name];
    if (!img) {
      img = new Image();
      img.onerror = () => { img.__failed = true; };   // 供 drawBackground 的 fallback 链判定
      img.src = name;
      this.bgImages[name] = img;
    }
    return img;
  },
  scenePointFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
    };
  },
  sceneHitIndex(pt) {
    const spots = this.level && this.level.sceneSpots;
    if (!spots || !pt) return -1;
    for (let i = 0; i < spots.length; i++) {
      const r = spots[i].rect;
      if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) return i;
    }
    return -1;
  },
  sceneMouseMove(e) {
    if (!this.level) { this.sceneHover = -1; return; }
    if (this.level.mode === 'scene') {
      if (this.status !== 'running') return; // 对话/检视期间不更新悬停
      const pt = this.scenePointFromEvent(e);
      const prev = this.sceneHover;
      this.sceneHover = pt ? this.sceneHitIndex(pt) : -1;
      // 悬停到热区时给一声轻提示（仅状态翻转沿，不在同一热区内反复响）
      if (this.sceneHover >= 0 && this.sceneHover !== prev && window.Audio2 && Audio2.hover) Audio2.hover();
      return;
    }
    // 跑酷模式：悬停在可点击的感叹号上时显示手型光标
    if (this.level.mode === 'platformer') {
      const over = this.platformerHitTrigger(e);
      this.canvas.style.cursor = (over && this.status === 'running') ? 'pointer' : 'default';
    }
  },
  sceneMouseClick(e) {
    if (!this.level) return;
    if (this.level.mode === 'scene') {
      if (this.status !== 'running') return;
      const pt = this.scenePointFromEvent(e);
      const i = pt ? this.sceneHitIndex(pt) : -1;
      if (i >= 0) this.activateSceneSpot(i);
      return;
    }
    // 跑酷模式：点击感叹号触发点（如荒原的树木交互）
    if (this.level.mode === 'platformer') this.platformerClick(e);
  },
  // 跑酷模式下命中的可点击感叹号触发点（需玩家就在其交互范围内）
  platformerHitTrigger(e) {
    if (!this.level || this.status !== 'running') return null;
    const pt = this.scenePointFromEvent(e);
    if (!pt) return null;
    for (const t of this.level.triggers) {
      if (t._activated || t.hidden || !t.icon || t.trigger !== 'interact') continue;
      if (t.showAfter != null && this.player.x < t.showAfter) continue;
      if (!this.save.checkFilter(t.filter)) continue;
      // 已记录指定线索后交互失效（与 checkTriggers 一致：验证后接待台不再响应）
      if (t.hideAfterClue && (typeof this.hasClue === 'function') && this.hasClue(t.hideAfterClue)) continue;
      const p = this.camera.toScreen(t.rect.x, t.rect.y);
      if (pt.x >= p.x && pt.x <= p.x + t.rect.w && pt.y >= p.y && pt.y <= p.y + t.rect.h) {
        return this.player.rect.intersects(t.rect) ? t : null;
      }
    }
    return null;
  },
  platformerClick(e) {
    const t = this.platformerHitTrigger(e);
    if (t) this.activateTrigger(t);
  },
  // 激活交互触发点：支持「点击感叹号 → 角色自动跳跃 → 落地后再弹文字」的演出
  activateTrigger(t) {
    if (!t || t._activated) return;
    if (this.status !== 'running') return;
    if (!this.save.checkFilter(t.filter)) return;
    // 一次性触发点（感叹号/跳跃演出）在本次进入关卡内标记已激活；
    // 普通可重复交互点（如 $ 交互点）不标记，保持原有可重复查看的行为。
    const once = t.jump || t.icon === 'exclaim';
    if (once) t._activated = true;
    if (t.jump) {
      const phy = (this.level.def.physics) || {};
      const js = phy.jumpSpeed != null ? phy.jumpSpeed : this.player.jumpSpeed;
      this.player.vy = js;
      this.player.onGround = false;
      if (this.player.jumps > 0) this.player.jumps--;
      if (window.Audio2 && typeof Audio2.jump === 'function') Audio2.jump();
      // 跳跃演出：等角色落地后再弹出对白（由 updateJumpWait 驱动）
      this._jumpWait = { level: this.level, t, timer: 0, left: false };
    } else {
      this.startEvents(t.events, t.flags);
    }
  },
  updateScene() {
    if (this.status !== 'running') return;
    // 键盘可达（B4b）：A/← 上一个热区、D/→ 下一个（场景模式无跑动，不冲突）
    const spots = this.level && this.level.sceneSpots;
    if (spots && spots.length) {
      if (this.input.wasPressed(...KEYBINDS.left)) this.cycleSceneSpot(-1);
      else if (this.input.wasPressed(...KEYBINDS.right)) this.cycleSceneSpot(1);
    }
    // E 触发当前（鼠标悬停或键盘选中的）热区，与点击等价
    if (this.sceneHover >= 0 && this.input.wasPressed(...KEYBINDS.interact)) {
      this.activateSceneSpot(this.sceneHover);
    }
  },
  // 键盘在场景热区间循环（B4b）：从「未选中」开始正向选第 0 个、反向选最后一个
  cycleSceneSpot(dir) {
    const spots = this.level && this.level.sceneSpots;
    if (!spots || !spots.length) return;
    const cur = this.sceneHover;
    const next = cur < 0 ? (dir > 0 ? 0 : spots.length - 1)
      : ((cur + dir) % spots.length + spots.length) % spots.length;
    if (next === cur) return;
    this.sceneHover = next;
    if (window.Audio2 && Audio2.hover) Audio2.hover();
  },
  activateSceneSpot(i) {
    const spots = this.level && this.level.sceneSpots;
    const spot = spots && spots[i];
    if (!spot) return;
    if (spot.actions && spot.actions.length) { this.openScenePanel(i); return; }
    if (spot.events && spot.events.length) { this.startEvents(spot.events, []); return; }
    this.openScenePanel(i); // 兜底：无动作也无事件时也弹检视面板
  },
  /* 场景动作按钮文案（可随存档状态变化）：
       · 已记录（clueId 命中）→ doneLabel / 「已记录」；
       · 前置线索齐备且指定线索缺失 → labelAlt（如 VR 未修电源时显示「检查电源」）；
       · 其余 → label。 */
  sceneActionLabel(a) {
    if (a.clueId && this.hasClue(a.clueId)) {
      return pick(a, 'doneLabel') || I18N.t('clue_recorded_short');
    }
    if (a.labelAlt && a.labelAltIfMissing && !this.hasClue(a.labelAltIfMissing)
        && (!Array.isArray(a.labelAltIfPresent) || a.labelAltIfPresent.every(id => this.hasClue(id)))) {
      return pick(a, 'labelAlt');
    }
    return pick(a, 'label') || I18N.t('ctx_leave');
  },
  openScenePanel(i) {
    const spots = this.level && this.level.sceneSpots;
    const spot = spots && spots[i];
    if (!spot) return;
    const panel = document.getElementById('interact-panel');
    const titleEl = document.getElementById('ip-title');
    const ctxEl = document.getElementById('ip-context');
    const actsEl = document.getElementById('ip-actions');
    if (!panel || !titleEl || !ctxEl || !actsEl) return;
    this._scenePanelOpen = true;
    if (this.status === 'running') this.status = 'busy';
    this.input.clear();
    titleEl.textContent = pick(spot, 'title') || '';
    ctxEl.textContent = pick(spot, 'context') || '';
    actsEl.innerHTML = '';
    const actions = (spot.actions && spot.actions.length) ? spot.actions : [{ label: I18N.t('ctx_leave'), label_en: 'Leave' }];
    actions.forEach(a => {
      const b = document.createElement('button');
      const completed = !!(a.clueId && this.hasClue(a.clueId));
      b.textContent = this.sceneActionLabel(a);
      b.disabled = completed;
      b.addEventListener('click', () => {
        this.closeScenePanel();
        if (a.events && a.events.length) this.startEvents(a.events, []);
      });
      actsEl.appendChild(b);
    });
    panel.hidden = false;
    if (window.Audio2 && Audio2.uiOpen) Audio2.uiOpen();
  },
  closeScenePanel() {
    const panel = document.getElementById('interact-panel');
    if (panel) panel.hidden = true;
    this._scenePanelOpen = false;
    if (this.status === 'busy') this.status = 'running';
    this.input.clear();
    if (window.Audio2 && Audio2.uiClose) Audio2.uiClose();
  },
  drawScene() {
    const ctx = this.ctx;
    const def = this.level.def || {};
    const bgDef = def.bg || {};
    // bg.fallback：主图加载失败时回退到老图（loadSceneImage 在 onerror 时打 __failed 标记），
    // 回退图也失败才走渐变兜底——保证场景页永不黑屏。
    let img = this.loadSceneImage(bgDef.image);
    if (img && img.__failed && bgDef.fallback) img = this.loadSceneImage(bgDef.fallback);
    if (img && img.complete && img.naturalWidth > 0) {
      if (bgDef.bgCover) {
        // 等比铺满（cover 居中裁切）：不把非 16:9 的图强行拉成长图
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const s = Math.max(this.viewW / iw, this.viewH / ih);
        const sw = this.viewW / s, sh = this.viewH / s;
        ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, this.viewW, this.viewH);
      } else {
        ctx.drawImage(img, 0, 0, this.viewW, this.viewH);
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, this.viewH);
      g.addColorStop(0, bgDef.top || '#0b0a14');
      g.addColorStop(1, bgDef.bottom || '#221a2c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
    const spots = this.level.sceneSpots || [];
    ctx.lineWidth = 1;
    for (let i = 0; i < spots.length; i++) {
      const s = spots[i];
      const r = s.rect;
      const hovered = (i === this.sceneHover);
      ctx.lineWidth = hovered ? 2 : 1;
      ctx.strokeStyle = hovered ? '#eaffff' : 'rgba(0,229,255,0.22)';
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
      if (hovered && s.title) {
        const fs = 13;
        ctx.font = 'bold ' + fs + 'px Consolas,"Microsoft YaHei","PingFang SC",sans-serif';
        const t = pick(s, 'title');
        const tw = ctx.measureText(t).width;
        const bx = r.x;
        const by = Math.max(2, r.y - fs - 12);
        ctx.fillStyle = 'rgba(8,10,18,0.85)';
        ctx.fillRect(bx, by, tw + 16, fs + 8);
        ctx.fillStyle = '#eaffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(t, bx + 8, by + 4);
      }
    }
    this.canvas.style.cursor = (this.sceneHover >= 0 && this.status === 'running') ? 'pointer' : 'default';
  },
});
