/* ============================================================================
 * engine/game-archive-transition.js —— Game 方法组 · 赛道尽头 → 年鉴馆接待前厅
 * ----------------------------------------------------------------------------
 * 玩家抵达 OASIS 出口后插入约 2.4s 的转场（替代原来的 dialog+fade+changeMap）：
 *   冻结操作 → 转场图淡入 → 淡到黑 → 加载年鉴馆接待前厅
 *   → 长走廊淡入 → 交还控制。
 *   原「画面下方一行埃尔文字」已移除：那句结语（archive_transition_line）改为
 *   oasis_exit 触发时的标准对白呈现（story_config.js），与其他交互方式统一。
 *
 * 事件入口：story_config 中 oasis_exit 的 `archiveTransition` 事件
 *   （game-events.js 分派；模块缺失时该事件为无操作，保持旧行为）。
 *
 * 硬性约束：
 *   · 图片先预加载再展示，绝不「先黑屏再等图」；
 *   · object-fit: contain 保持原始比例，不横向/纵向拉伸；
 *   · 不显示埃尔结语文字（该句由 oasis_exit 的标准对白呈现，避免重复）；
 *   · 空格 / Enter / Esc / 点击可跳过，开始 0.3s 内不接受跳过（避免上一段操作误触）；
 *   · motionFx=false 或系统 prefers-reduced-motion：取消长淡入淡出、总时长约 1s；
 *   · 缺图 / 无容器：用黑场 + 文字（或原 fade）完成，绝不阻止进入年鉴馆。
 *
 * 只读约束：不改长廊布局、莫罗验证、索引册、二段跳与档案门逻辑。转场期间
 *   status 维持 busy（update 不跑）⇒ 不会提前触发年鉴馆对白 / 莫罗交互 / 玩家物理。
 * 加载顺序：game.js 之后（与其它 Game 方法组一致）。
 * ==========================================================================*/
'use strict';
(function () {
  const SRC_DEFAULT = 'image/bg_race_to_archive_transition.png';
  const SKIP_LOCK_MS = 300;                 // 开演前 0.3s 不接受跳过
  const PRELOAD_CAP_MS = 1200;              // 缺图/慢图上限：最迟 1.2s 继续
  /* 正常：淡入 320 + 停留 1450 + 淡黑 300 + 走廊淡入 360 ≈ 2.43s（要求 2~3s） */
  const NORMAL = { fadeIn: 320, hold: 1450, out: 300, reveal: 360 };
  /* 减少动态：取消长淡入淡出，总时长约 0.9s */
  const REDUCED = { fadeIn: 0, hold: 620, out: 60, reveal: 180 };

  function now() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  }

  Object.assign(Game.prototype, {
    /* 演出参数（测试用纯数据） */
    _archivePlan(reduced) {
      const r = !!reduced;
      const p = r ? REDUCED : NORMAL;
      return { fadeIn: p.fadeIn, hold: p.hold, out: p.out, reveal: p.reveal, skipLockMs: SKIP_LOCK_MS };
    },
    _archiveReduced() {
      try {
        if (window.SettingsUI && typeof SettingsUI.current === 'function' && SettingsUI.current().motionFx === false) return true;
      } catch (e) { /* ignore */ }
      try {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
      } catch (e) { /* ignore */ }
      return false;
    },
    _archiveImage() {
      const meta = (this.cfg && this.cfg.meta && this.cfg.meta.archiveTransition) || {};
      return meta.image || SRC_DEFAULT;
    },
    _archiveEl() {
      if (typeof document === 'undefined' || !document.getElementById) return null;
      const box = document.getElementById('archive-transition');
      if (!box) return null;
      return {
        box,
        img: document.getElementById('archive-img'),
        text: document.getElementById('archive-text'),
      };
    },
    /* 转场演出不再显示埃尔结语文字：该句已在 oasis_exit 事件链中以标准对白播放
       （I18N archive_transition_line 保留备用，此处恒定返回空串以免重复展示）。 */
    _archiveText() { return ''; },
    /* 可跳过等待：skip 置位或到时即返回（40ms 轮询，对暂停/后台安全） */
    _archiveWait(ms) {
      return new Promise(resolve => {
        const t0 = now();
        const tick = () => {
          const c = this._archiveCutscene;
          if (!c || c.skip || (now() - t0) >= ms) { resolve(); return; }
          this._archiveTimer = setTimeout(tick, 40);
        };
        tick();
      });
    },
    /* 单图预加载：onload/onerror + 上限（缺图返回 false，不阻塞） */
    _archivePreload() {
      if (typeof Image === 'undefined') return Promise.resolve(false);
      const src = this._archiveImage();
      return new Promise(resolve => {
        const img = new Image();
        let done = false;
        const fin = ok => { if (!done) { done = true; resolve(ok); } };
        img.onload = () => fin(true);
        img.onerror = () => { console.warn('[archive-transition] 缺图：' + src + '，改用黑场 + 文字'); fin(false); };
        setTimeout(() => fin(false), PRELOAD_CAP_MS);
        img.src = src;
      });
    },
    /* 跳过输入：空格/Enter/Esc/点击。capture 阶段 stopPropagation，避免触发 Esc 暂停。 */
    _archiveBindInput(el) {
      if (this._archiveInputBound) return;
      this._archiveInputBound = true;
      const onKey = e => {
        const c = this._archiveCutscene;
        if (!c) return;
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          if (typeof e.stopPropagation === 'function') e.stopPropagation();
          if (c.canSkip) c.skip = true;
        }
      };
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('keydown', onKey, true);
      }
      if (el && el.box && typeof el.box.addEventListener === 'function') {
        el.box.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (this._archiveCutscene && this._archiveCutscene.canSkip) this._archiveCutscene.skip = true;
        });
      }
    },
    _archiveHideChapterCard() {
      if (typeof document === 'undefined' || !document.getElementById) return;
      const cc = document.getElementById('chapter-card');
      if (cc) { cc.classList.remove('show'); cc.classList.add('hidden'); }
      clearTimeout(this._chapterTimer);
    },
    _archiveHideOverlay(el) {
      if (!el) return;
      if (el.box) {
        el.box.classList.remove('show');
        setTimeout(() => { if (el.box) el.box.classList.add('hidden'); }, 280);
      }
      if (el.img) { try { el.img.classList.remove('active'); } catch (e) { /* ignore */ } }
      if (el.text) { try { el.text.classList.remove('show'); } catch (e) { /* ignore */ } }
    },
    _archiveCleanup() {
      if (this._archiveTimer) { clearTimeout(this._archiveTimer); this._archiveTimer = null; }
      this._archiveCutscene = null;
    },
    /* 事件入口：完整转场（有容器）或原 fade 进关（无容器）。 */
    async playArchiveTransition(ev) {
      ev = ev || {};
      const map = ev.map || 'library_gate';
      const spawn = ev.spawn || { col: 3, row: 13, facing: 1 };
      const el = this._archiveEl();
      // 无容器（无头/脱离外壳）：按原路径淡入淡出直接进关，绝不卡屏
      if (!el) {
        await this.fadeOut();
        this.loadLevel(map, spawn, spawn.facing);
        await this.fadeIn();
        return;
      }

      const reduced = this._archiveReduced();
      const plan = this._archivePlan(reduced);
      const ok = await this._archivePreload();   // 先加载后展示，避免「先黑屏再等图」
      this._archiveCutscene = { skip: false, canSkip: false };
      this._archiveBindInput(el);
      setTimeout(() => { if (this._archiveCutscene) this._archiveCutscene.canSkip = true; }, plan.skipLockMs);

      // 展示：黑底 + 图（若加载成功）淡入 + 文字淡入
      el.box.classList.remove('hidden');
      el.box.classList.toggle('at-reduced', reduced);
      void el.box.offsetWidth;
      el.box.classList.add('show');
      if (el.img) {
        el.img.classList.remove('active');
        if (ok) {
          if (el.img.getAttribute('src') !== this._archiveImage()) el.img.setAttribute('src', this._archiveImage());
          el.img.style.transition = plan.fadeIn > 0 ? ('opacity ' + plan.fadeIn + 'ms ease') : 'none';
        }
      }
      if (el.text) {
        el.text.style.transition = plan.fadeIn > 0 ? ('opacity ' + plan.fadeIn + 'ms ease') : 'none';
        el.text.textContent = this._archiveText();
      }
      void el.box.offsetWidth;
      if (ok && el.img) el.img.classList.add('active');
      if (el.text) el.text.classList.add('show');
      if (window.Audio2 && Audio2.reveal) Audio2.reveal(1);

      // 停留（跳过则提前结束）
      await this._archiveWait(plan.fadeIn + plan.hold);
      const skipped = !!(this._archiveCutscene && this._archiveCutscene.skip);

      // 淡到黑（跳过时立即黑场），随后切图
      if (el.img) el.img.classList.remove('active');
      if (el.text) el.text.classList.remove('show');
      if (!skipped) await this._archiveWait(plan.out);

      this.loadLevel(map, spawn, spawn.facing);
      this._archiveHideChapterCard();

      // 长走廊淡入：遮罩淡出（跳过时也走同一路径，不阻塞玩家）
      el.box.classList.remove('show');
      await this._archiveWait(plan.reveal);

      this._archiveHideOverlay(el);
      this._archiveCleanup();
    },
  });
})();
