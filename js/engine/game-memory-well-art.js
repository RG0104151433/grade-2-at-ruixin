/* ============================================================================
 * engine/game-memory-well-art.js —— 记忆档案井「损坏的存档槽」门外观（library）
 * ----------------------------------------------------------------------------
 * 背景换成无门的 bg_archive_memory_well.png 后，右上角的门用独立素材
 * archive_door_damaged_slot.png 补回。坐标为背景图 native 像素，绘制时按
 * bgScrollY 同一换算（native → 世界 = viewW / 背景图宽）投影到世界坐标，
 * 因此与背景 1:1 同步上下滚动，窗口缩放/相机移动都不会与背景脱节。
 * 只画不改：不碰碰撞、物理、触发器判定、检查点、出口、存档。
 * 背景图或门素材未就绪时静默跳过（不回退色块、不抛异常）。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  Object.assign(Game.prototype, {
    _memoryWellDoorImg(cfg) {
      if (!cfg || !cfg.image) return null;
      if (!this._mwDoorImg) {
        const im = new Image();
        im.onerror = () => { im.__failed = true; };
        im.src = cfg.image;
        this._mwDoorImg = im;
      }
      return this._mwDoorImg;
    },
    drawMemoryWellDoor() {
      const L = this.level;
      if (!L || !L.def || L.def.id !== 'library') return;
      const cfg = L.def.memoryWellDoor;
      if (!cfg || !cfg.native) return;
      const bg = L.def.bg || {};
      // 背景图必须已就绪：否则不画，避免门与背景不同步。
      const bgImg = this.loadBgImage ? this.loadBgImage(bg.image || L.def.bgImage) : null;
      if (!bgImg || !bgImg.complete || bgImg.naturalWidth <= 0) return;
      const img = this._memoryWellDoorImg(cfg);
      if (!img || img.__failed || !img.complete || img.naturalWidth <= 0) return;
      const s = this.viewW / bgImg.naturalWidth;   // 与 drawBackground(bgScrollY) 同源
      const n = cfg.native;
      const p = this.camera.toScreen(n.x * s, n.y * s);
      const w = n.w * s, h = n.h * s;
      const ctx = this.ctx;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, p.x, p.y, w, h);
      ctx.restore();
    },
  });
})();
