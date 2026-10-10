/* ============================================================================
 * engine/game-interact.js —— Game 方法组 · 交互与引导线索
 * ----------------------------------------------------------------------------
 * 触发点判定（auto / interact）、可消融方块的邻近查找与连锁消融、
 * 黄金图书馆前廊的跳跃箭头与掉落书本引导、书本落地的地面探测。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 2682-2858 行）。方法体未作任何改动；
 * 因改用对象字面量承载，仅在每个方法结束的大括号后补了成员分隔逗号。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  /* 站立判据（失重舞厅扫描台，2026-09-20 需求⑤）：玩家 onGround，脚底恰好落在
     zone.row（= 平台顶面行），且水平位置在该平台列范围内。
     只读玩家与配置，不碰碰撞数组；任何一格之差都返回 false，
     所以「靠近」「掠过」「贴边」都不算。 */
  standingOnPlatform(zone) {
    const L = this.level, p = this.player;
    if (!L || !p || !zone || !p.onGround) return false;
    const T = this.tile;
    const footRow = Math.round((p.y + p.h / 2) / T);
    if (footRow !== zone.row) return false;
    const x0 = zone.col * T, x1 = (zone.col + (zone.w || 1)) * T;
    return p.x >= x0 && p.x <= x1;
  },

  checkTriggers() {
    const pr = this.player.rect;
    // D2 通用复生锚点：玩家经过感应区即推进当局复生锚点（只前进不回退），
    // 并把落点写入存档出生位（save.spawn）——刷新/重开浏览器后 continueGame
    // 仍回最近锚点。锚点只推进不复位，故重复经过/往回走都不会降级。
    if (this.level.anchors.length) {
      for (const a of this.level.anchors) {
        if (a.idx <= this.level.anchorIdx) continue;
        if (!pr.intersects(a.rect)) continue;
        this.level.anchorIdx = a.idx;
        this.checkpoint = { col: a.col, row: a.row, facing: a.facing };
        this.save.spawn = { col: a.col, row: a.row };
        this.save.facing = a.facing;
        this.save.persist();
        break;
      }
    }
    let canInteract = false, label = null;
    /* 2026-09-20：镜像跑酷段（road 翻转后）不再判定前进段触发点 —— 与 drawTriggers 的
       渲染跳过一致（掉出跑道时会穿过这些触发区，不该在那里弹对白）。
       2026-09-21：放行「镜像门控的 auto 触发点」（filter 含 gate_mirrored，即终点
       gate_mirror_exit）—— 跑到跑道末端进入出口触发区即自动结算转场，无需手动按键；
       前进段的 interact 提示与死路提示（gate_dead_end）照旧跳过。 */
    const _mirrorSkipTriggers = !!this.mirrorFlip && this.level.id === 'road';
    for (const t of this.level.triggers) {
      if (_mirrorSkipTriggers &&
          !(t.trigger === 'auto' && Array.isArray(t.filter) && t.filter.includes('gate_mirrored'))) continue;
      if (t._activated) continue;
      if (t.showAfter != null && this.player.x < t.showAfter) continue;
      if (!this.save.checkFilter(t.filter)) continue;
      /* requiresStanding（失重舞厅扫描台，2026-09-20）：必须双脚站到指定平台上才算
         可交互；走近、掠过、贴边都不算。触发区只承担「可交互标记」的展示。 */
      if (t.requiresStanding && !this.standingOnPlatform(t.standOn)) continue;
      // 已记录指定线索后交互完全失效（如验证邀请完成后接待台不再提示）
      if (t.hideAfterClue && (typeof this.hasClue === 'function') && this.hasClue(t.hideAfterClue)) continue;
      if (!pr.intersects(t.rect)) continue;
      if (t.trigger === 'auto') { this.startEvents(t.events, t.flags); return; }
      if (t.trigger === 'interact') {
        // 首个命中的交互点即会被 activateTrigger 执行（下方 wasPressed 分支立即 return），
        // 故标签同取首个命中：重叠区域（如接待台 + 索引册）显示的标签与按 E 的结果一致。
        canInteract = true;
        // 已记录指定线索后保留响应但不显示提示标签（如验证后领取索引册不提示）
        if (!(t.hideLabelAfterClue && (typeof this.hasClue === 'function') && this.hasClue(t.hideLabelAfterClue))) {
          label = label || pick(t, 'label');
        }
        if (this.input.wasPressed(...KEYBINDS.interact)) { this.activateTrigger(t); return; }
      }
    }
    // 陷阱交互：玩家踩到无伤害，靠近按 E 获得提示（首次）
    if (this.level.traps && !this.save.has('maze_trap_intro')) {
      for (const t of this.level.traps) {
        if (pr.intersects(t.rect)) {
          canInteract = true; label = pick(this.cfg.assetsMap.trap, 'label');
          if (this.input.wasPressed(...KEYBINDS.interact)) {
            this.save.addFlags(['maze_trap_intro']);
            this.startEvents([{ type: 'dialog', id: 'maze_trap' }], []);
            return;
          }
        }
      }
    }
    // 可消融方块（G/C 数据残骸）：靠近时提示，按 E 消融（移植自gry长街）
    if (!canInteract && this.level.blocks && this.level.blocks.length) {
      const b = this.blockNear();
      if (b) {
        canInteract = true;
        label = I18N.t('ctx_dissolve');
        if (this.input.wasPressed(...KEYBINDS.interact)) { this.dissolveNear(); return; }
      }
    }
    this.player.canInteract = canInteract;
    this.player.interactLabel = label;
  },
  /* 图书馆档案调查点（2026-09-23 改版）：绑定在进关时选出的三块主路线触发架
     （level-gen-archive.js 的 ladderNotes）上——只有玩家**双脚站上**选中平台
     （standingOnPlatform：onGround + 脚底行 + 列范围）才自动播对白；空中跳跃、
     贴边掠过一律不触发。逐帧重试语义保留：busy 帧跳过，站稳状态跨帧持续，下一帧
     补触发，直到 startEvents 成功写入防重复 flag。仅当 level.ladderNotes
     （buildLadderParkour 登记）存在时工作，其余情况零开销。 */
  ladderNoteTick() {
    const L = this.level;
    if (!L || !L.ladderNotes || !L.ladderNotes.length) return;
    if (!!this.save && typeof this.save.has !== 'function') return;
    if (this.status !== 'running') return;   // 忙时不判定，下一帧重试
    for (const n of L.ladderNotes) {
      if (this.save.has(n.flag)) continue;   // 已触发过（防重复）
      if (!this.standingOnPlatform({ col: n.col, row: n.row, w: n.len })) continue;
      // 站上触发架：启动对白；成功后写 n.flag（startEvents 内部保证 running→busy→running）
      this.startEvents([{ type: 'dialog', text: n.text, text_en: n.text_en }], [n.flag]);
      return;
    }
  },
  // 最近的未消融方块（以玩家中心到方块中心的距离判定）
  blockNear() {
    const L = this.level;
    if (!L || !L.blocks || !L.blocks.length) return null;
    const T = this.tile, cx = this.player.x, cy = this.player.y;
    let best = null, bd = T * 1.9;
    for (const b of L.blocks) {
      const d = Math.hypot(b.x + T / 2 - cx, b.y + T / 2 - cy);
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  },
  // 消融最近方块及其同色相邻连锁（对齐 gry 的消融逻辑）
  dissolveNear() {
    const L = this.level;
    const near = this.blockNear();
    if (!near) return;
    const color = near.color;
    const map = new Map();
    for (const b of L.blocks) map.set(b.col + ',' + b.row, b);
    const stack = [near];
    const seen = new Set([near.col + ',' + near.row]);
    while (stack.length) {
      const b = stack.pop();
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = (b.col + dc) + ',' + (b.row + dr);
        const nb = map.get(k);
        if (nb && !seen.has(k) && nb.color === color) { seen.add(k); stack.push(nb); }
      }
    }
    const removed = new Set();
    for (const k of seen) removed.add(map.get(k).tile);
    L.solids = L.solids.filter(t => !removed.has(t));
    L.allTiles = L.allTiles.filter(t => !removed.has(t));
    L.blocks = L.blocks.filter(b => !removed.has(b.tile));
    if (window.Audio2 && typeof Audio2.success === 'function') Audio2.success();
    // 首次在跑酷中消融方块：在下方弹出黑色小字提示「新技能」
    if (!this.save.has('skill_dissolve')) {
      this.showSkillHint('dissolve');
    } else if (window.App && typeof App.toast === 'function') {
      App.toast(I18N.t('toast_debris_dissolved'));
    }
  },
  /* ============== 引导段（黄金图书馆前廊）：跳跃箭头 + 掉落书本 ==============
     由地图 def.hintArrow / def.bookDrop 驱动：
       - 玩家向前行走 → 画面正上方出现跳跃箭头；跳起后箭头消失；
       - 首次跳起 → 在前方 offsetCols 处掉落一本书，落到地面后静止；
       - 走到书前 → 对白一；再向前 forwardCols → 对白二并进入下一关。 */
  updateGuideCues() {
    if (this.status !== 'running') return;
    const L = this.level;
    if (!L) return;
    const def = L.def || {};
    const p = this.player;
    const T = this.tile;
    const jumping = !p.onGround && p.vy < -1.5;

    // 跳跃箭头：开始向前行走时出现，玩家跳起后消失
    if (this.jumpHint) {
      const h = this.jumpHint;
      if (!h.active && !h.done && (p.x > h.startX || p.vx > 0.5)) h.active = true;
      if (h.active && jumping) { h.active = false; h.done = true; }
    }

    // 走廊小字：走到一定距离后显示一次「可学习技能」提示
    if (def.gateSkillHint && !this._gateHintShown && this.gateHintX != null && p.x > this.gateHintX) {
      this._gateHintShown = true;
      this.showGateHint(pick(def.gateSkillHint, 'text'));
    }

    // 首次跳起：在前方一段距离处掉落一本书（跑到尽头仍未跳时兜底掉落，避免卡关）
    const nearEnd = p.x > (L.cols - 4) * T;
    if (def.bookDrop && !this.book && (jumping || nearEnd)) {
      const off = (def.bookDrop.offsetCols != null ? def.bookDrop.offsetCols : 7) * T;
      const fromRow = def.bookDrop.fromRow != null ? def.bookDrop.fromRow : 0;
      const minX = p.x + 2 * T;
      const maxX = (L.cols - 3) * T;
      let bx = p.x + off;
      if (bx < minX) bx = minX;
      if (bx > maxX) bx = maxX;
      this.book = {
        x: bx,
        y: fromRow * T,
        vy: 0,
        w: T * 0.72,
        h: T * 0.56,
        landed: false,
      };
    }

    // 书本自由下落，落到最近的地面后静止
    if (this.book && !this.book.landed) {
      this.book.vy = Math.min(this.book.vy + 0.7, 14);
      this.book.y += this.book.vy;
      const groundTop = this.groundTopAt(this.book.x, this.book.y);
      if (groundTop != null && this.book.y + this.book.h >= groundTop) {
        this.book.y = groundTop - this.book.h;
        this.book.landed = true;
        if (window.Audio2 && typeof Audio2.success === 'function') Audio2.success();
      }
    }

    // 交互一：走到书面前
    if (this.book && this.book.landed && !this.save.has('libgate_book')) {
      const r = new Rect(this.book.x - this.book.w / 2 - 8, this.book.y - 8, this.book.w + 16, this.book.h + 16);
      if (p.rect.intersects(r)) {
        this.save.addFlags(['libgate_book', 'doubleJump']);  // 拾书即学会二段跳
        this.save.persist();
        // 先弹出黑色小字「学会二段跳」，再触发埃尔的交互文字
        this.pendingEvents.push([
          { type: 'skillHint', key: 'doubleJump' },
          { type: 'dialog', text: ['【埃尔】好久没看到这么精美的书了，唉……'], text_en: ['[El] It\'s been so long since I\'ve seen such a beautiful book...'] },
        ]);
        return;
      }
    }

    // 交互二：拾书后继续向前一小段（仅显示对白，之后由末端触发点跳转）
    if (this.book && this.save.has('libgate_book') && !this.save.has('libgate_forward')) {
      const forward = (def.bookDrop.forwardCols != null ? def.bookDrop.forwardCols : 5) * T;
      const trigX = Math.min(this.book.x + forward, (L.cols - 1.5) * T);
      if (p.x > trigX) {
        this.save.addFlags(['libgate_forward']);
        this.save.persist();
        this.pendingEvents.push([{ type: 'dialog', text: ['【埃尔】好像就在前面了，去看看'], text_en: ['[El] It should be just ahead. Let\'s go take a look.'] }]);
      }
    }
  },
  // 在给定 x 列上，返回书本当前顶部下方最近实心瓦片的顶边 y（无则返回 null）
  groundTopAt(x, top) {
    let best = null;
    for (const t of this.level.solids) {
      if (x < t.x || x > t.x + t.w) continue;
      if (t.y + 0.5 < top) continue;   // 位于书本上方的瓦片忽略
      if (best == null || t.y < best) best = t.y;
    }
    return best;
  },
});
