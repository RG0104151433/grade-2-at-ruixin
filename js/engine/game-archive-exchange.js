/* ============================================================================
 * engine/game-archive-exchange.js —— 共同校验廊（archive_exchange_corridor）
 * ----------------------------------------------------------------------------
 * 本场景不再使用任何额外插入的贴图（终端三态 / 阿尔忒弥斯全息三帧已移除）：
 * 左右门与中央仪器全部烘焙在背景图 bg_archive_shared_corridor.png 里，
 * 玩家从左侧门进入 → 中央仪器交互 → 右侧门离开。
 * 本模块只保留一处纯逻辑：老档恢复。
 *   · 旧档已有 ally_share_k1 / ally_keep_k1 但没有新流程的 exchange_choice_made 时，
 *     补写该 flag，使右侧门与「已选择」状态一致（只写一次，不覆盖已有数据）。
 * 边界：只读/一次性写 flag，不碰碰撞、物理、触发器判定、存档其它字段。
 * ==========================================================================*/
'use strict';
(function () {
  if (typeof Game === 'undefined') return;

  Object.assign(Game.prototype, {
    /* 老档恢复：已有 ally_share_k1 / ally_keep_k1 但缺少终端选择 flag 时补写，
       使出口门与终端状态与旧档一致；只写一次，不覆盖已有数据。 */
    archiveExchangeTick() {
      if (this.mapId !== 'archive_exchange_corridor') return;
      if (this.save.has('exchange_choice_made')) return;
      if (this.save.hasClue('ally_share_k1') || this.save.hasClue('ally_keep_k1')) {
        this.save.addFlags(['exchange_choice_made']);
        this.save.persist();
      }
    },
  });
})();
