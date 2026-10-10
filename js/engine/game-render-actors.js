/* ============================================================================
 * engine/game-render-actors.js —— Game 方法组 · 渲染（实体 / 图元 / 精灵）
 * ----------------------------------------------------------------------------
 * 陷阱、药水、敌人、玩家、书本、跳跃箭头与掉落箭头、跑酷小人、
 * 迷雾与已见格子、通用矩形图元 drawBox、精灵绘制 drawSprite，
 * 以及精灵加载与背景抠图 mkSprite。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 3637-3993 行）。方法体未作任何改动；
 * 因改用对象字面量承载，仅在每个方法结束的大括号后补了成员分隔逗号。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  drawTraps() {
    if (!this.level.traps || !this.level.traps.length) return;
    const A = this.cfg.assetsMap;
    const color = (A.trap && A.trap.color) || '#ff6d00';
    const label = pick(A.trap, 'label') || I18N.t('ctx_trap');
    for (const t of this.level.traps) {
      const p = this.camera.toScreen(t.rect.x, t.rect.y);
      if (p.x + t.rect.w < -40 || p.x > this.viewW + 40 || p.y + t.rect.h < -40 || p.y > this.viewH + 40) continue;
      this.drawBox(p.x, p.y, t.rect.w, t.rect.h, color, label, false, 0.55);
    }
  },
  drawPotion() {
    if (!this.level.potion || this.save.has('magic-potion')) return;
    const A = this.cfg.assetsMap;
    const color = (A.potion && A.potion.color) || '#b388ff';
    const label = pick(A.potion, 'label') || I18N.t('ctx_magic_potion');
    const t = this.level.potion;
    const p = this.camera.toScreen(t.rect.x, t.rect.y);
    if (p.x + t.rect.w < -40 || p.x > this.viewW + 40 || p.y + t.rect.h < -40 || p.y > this.viewH + 40) return;
    this.drawBox(p.x, p.y, t.rect.w, t.rect.h, color, label, false, 0.9);
  },
  drawEnemies() {
    const spr = this.sprites.monster;
    for (const e of this.enemies) {
      const p = this.camera.toScreen(e.rect.x, e.rect.y);
      if (spr && spr.ready) {
        // 暗紫雾影幽灵：大小不超过一个游戏方块（tile），底边对齐微漂浮
        const sz = Math.min(this.tile * 0.92, e.w * 1.7);
        this.drawSprite(spr, p.x + e.w / 2, p.y + e.h, sz, false, false, 0, 0.92);
      } else {
        this.drawBox(p.x, p.y, e.w, e.h, this.cfg.assetsMap.enemy.color, pick(this.cfg.assetsMap.enemy, 'label'), false, 0.95);
      }
    }
  },
  drawPlayer() {
    const r = this.player.rect;
    const p = this.camera.toScreen(r.x, r.y);
    const pl = this.player;
    let indicatorTop = p.y;
    // 接待前厅 / 署名复原室 / 共同校验廊：改用「大个子」立绘（原图朝右，朝左走镜像）
    if (this.bigPlayerScene()) {
      indicatorTop = p.y + r.h - this.drawBigPlayer();
    } else {
      const spr = this.sprites.player;
      // 优先绘制「帕西瓦尔」冒险家精灵图（全游戏通用：跑酷/迷宫一致）
      if (spr && spr.ready) {
        // 统一把人物压缩到一个方块（tile）以内：跑酷与迷宫俯视一致，底边对齐居中
        const dh = Math.min(r.h * 1.35, this.tile * 0.92);
        this.drawSprite(spr, p.x + r.w / 2, p.y + r.h, dh, pl.facing < 0, pl.onGround, pl.vx);
        indicatorTop = p.y + r.h - dh;
      } else if (this.level && this.level.mode === 'topdown') {
        // 俯视模式（迷宫）保留原来的方块占位；横版跑酷改用 gry 的小人模型
        this.drawBox(p.x, p.y, r.w, r.h, this.cfg.assetsMap.player.color, pick(this.cfg.assetsMap.player, 'label'), false, 1);
      } else {
        this.drawRunner(p.x, p.y, r.w, r.h, pl.facing, pl.onGround, pl.vx);
      }
    }
    if (pl.canInteract && this.status !== 'busy') {
      const hx = p.x + r.w / 2;
      const hy = indicatorTop - 18;
      this.ctx.fillStyle = '#ffe082';
      this.ctx.beginPath();
      this.ctx.arc(hx, hy, 10, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000';
      this.ctx.font = 'bold 15px sans-serif';
      this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
      this.ctx.fillText('!', hx, hy + 1);
    }
  },
  // 使用「大个子」立绘的三个场景（接待前厅 / 署名复原室 / 共同校验廊）
  bigPlayerScene() {
    const id = this.level && this.level.id;
    return id === 'library_gate' || id === 'credit_restoration_room' || id === 'archive_exchange_corridor';
  },
  // 大个子立绘精灵：懒加载，首次进入上述场景时才解码三张图（避免开局常驻大图）。
  bigPlayerSprites() {
    if (!this._bigPlayer) {
      this._bigPlayer = {
        idle: this.mkSprite('image/player_big_idle.png'),
        walk1: this.mkSprite('image/player_big_walk_1.png'),
        walk2: this.mkSprite('image/player_big_walk_2.png'),
      };
    }
    return this._bigPlayer;
  },
  // 帧选择：站定（|vx| 很小）用 idle；移动时按位移推进相位，在两帧行走图之间交替。
  bigPlayerFrame(vx) {
    if (Math.abs(vx) <= 0.5) { this._bigWalkAnim = 0; return 'idle'; }
    this._bigWalkAnim = (this._bigWalkAnim || 0) + Math.abs(vx) * 0.022;
    return (Math.floor(this._bigWalkAnim) & 1) ? 'walk2' : 'walk1';
  },
  // 绘制大个子立绘：三帧共用同一画布坐标（脚底对齐），按原始宽高比缩放，
  // 底边中心对齐碰撞盒；朝左时水平镜像。返回本次绘制高度（供交互「!」定位）。
  drawBigPlayer() {
    const r = this.player.rect;
    const p = this.camera.toScreen(r.x, r.y);
    const pl = this.player;
    const cx = p.x + r.w / 2;
    const by = p.y + r.h;                 // 脚底 = 碰撞盒底边
    const def = (this.level && this.level.def) || {};
    const dh = def.bigPlayerHeight || 210; // 立绘高度（世界像素），可按关微调
    /* bigPlayerSink：立绘脚底下沉量（世界像素，默认 0）。用于把**可见脚底**对齐到
       背景图里的目标线（如共同校验廊两门的下缘），而不动碰撞盒——碰撞盒底边仍钉在
       地面行，物理 / 触发判定零变化。返回值同步减去 sink，让交互「!」仍贴着头部。 */
    const sink = def.bigPlayerSink || 0;
    const key = this.bigPlayerFrame(pl.vx);
    const sprites = this.bigPlayerSprites();
    const spr = sprites[key] || sprites.idle;
    if (spr && spr.ready) {
      const dw = dh * (spr.cw / spr.ch);  // 保持原图宽高比（画布非正方）
      const ctx = this.ctx;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(cx - dw / 2, by - dh + sink);
      if (pl.facing < 0) { ctx.translate(dw, 0); ctx.scale(-1, 1); }
      ctx.drawImage(spr.canvas || spr.img, 0, 0, spr.cw, spr.ch, 0, 0, dw, dh);
      ctx.restore();
      return dh - sink;
    }
    // 立绘尚未解码：回退小精灵 / 小人模型，避免空一帧
    const fallback = this.sprites.player;
    if (fallback && fallback.ready) {
      const fdh = Math.min(r.h * 1.35, this.tile * 0.92);
      this.drawSprite(fallback, cx, by, fdh, pl.facing < 0, pl.onGround, pl.vx);
      return fdh;
    }
    this.drawRunner(p.x, p.y, r.w, r.h, pl.facing, pl.onGround, pl.vx);
    return r.h;
  },
  // 引导段掉落书本：深色封面 + 金色描边 + 书页，在金色背景下清晰可辨
  drawBook() {
    const b = this.book;
    if (!b) return;
    // 拾取并学会二段跳后书籍消失（交互二仍以 book 坐标为锚点，不影响后续触发）
    if (this.save.has('libgate_book')) return;
    const ctx = this.ctx;
    const p = this.camera.toScreen(b.x - b.w / 2, b.y);
    if (p.x + b.w < -40 || p.x > this.viewW + 40 || p.y + b.h < -40 || p.y > this.viewH + 40) return;
    ctx.save();
    // 落地阴影
    if (b.landed) {
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(p.x + b.w / 2, p.y + b.h + 2, b.w * 0.55, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 封面（深青皮革）
    ctx.globalAlpha = 1;
    const grad = ctx.createLinearGradient(p.x, p.y, p.x + b.w, p.y + b.h);
    grad.addColorStop(0, '#164a56');
    grad.addColorStop(1, '#0a2029');
    ctx.fillStyle = grad;
    ctx.fillRect(p.x, p.y, b.w, b.h);
    // 书脊
    ctx.fillStyle = '#0a2029';
    ctx.fillRect(p.x, p.y, Math.max(3, b.w * 0.18), b.h);
    // 书页（右侧）
    ctx.fillStyle = '#f7e2a0';
    ctx.fillRect(p.x + b.w - 4, p.y + 2, 3, b.h - 4);
    // 金色描边
    ctx.strokeStyle = '#f0c869';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x + 0.75, p.y + 0.75, b.w - 1.5, b.h - 1.5);
    // 呼吸微光
    ctx.globalAlpha = 0.45 + 0.3 * Math.sin(performance.now() / 320);
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x - 2, p.y - 2, b.w + 4, b.h + 4);
    ctx.restore();
  },
  // 跳跃提示箭头：显示在画面正中上方，玩家跳起后隐藏。
  // 深色主体 + 浅金描边（金色/暗色背景均清晰），多层箭头强化跳跃时机提示。
  drawJumpArrow() {
    const h = this.jumpHint;
    if (!h || !h.active) return;
    const cfg = (this.level && this.level.def && this.level.def.hintArrow) || {};
    const dark = cfg.dark || '#1a1205';
    const rim = cfg.rim || '#f0c869';
    const n = Math.max(1, cfg.chevrons || 1);
    const ctx = this.ctx;
    const cx = this.viewW / 2;
    const bob = Math.sin(performance.now() / 260) * 8;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const cy = 104 + bob - i * 34;
      const s = 1 - i * 0.22;                      // 越靠上的箭头越小
      // 浅金光晕：暗背景下保证轮廓可见
      ctx.globalAlpha = 0.85 - i * 0.2;
      ctx.fillStyle = 'rgba(255,233,168,0.3)';
      ctx.beginPath(); ctx.arc(cx, cy, 32 * s, 0, Math.PI * 2); ctx.fill();
      // 深色箭头主体
      ctx.globalAlpha = 1;
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 24 * s);
      ctx.lineTo(cx - 19 * s, cy - 2 * s);
      ctx.lineTo(cx - 7 * s, cy - 2 * s);
      ctx.lineTo(cx - 7 * s, cy - 21 * s);
      ctx.lineTo(cx + 7 * s, cy - 21 * s);
      ctx.lineTo(cx + 7 * s, cy - 2 * s);
      ctx.lineTo(cx + 19 * s, cy - 2 * s);
      ctx.closePath();
      ctx.fill();
      // 浅金描边
      ctx.strokeStyle = rim;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // 操作提示：深色字 + 浅色描边
    const ty = 104 + bob + 52;
    const hint = I18N.t('hud_jump_hint');
    ctx.font = 'bold 16px "Microsoft YaHei","PingFang SC",sans-serif';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeText(hint, cx, ty);
    ctx.fillStyle = dark;
    ctx.fillText(hint, cx, ty);
    ctx.restore();
  },
  // 书本落点箭头：书本落地后在其上方显示深色向下箭头，提示玩家跳/走去拾取
  drawBookDropArrow() {
    const b = this.book;
    if (!b || !b.landed) return;
    // 拾书后箭头一并消失（书本已隐去）
    if (this.save.has('libgate_book')) return;
    const cfg = (this.level && this.level.def && this.level.def.hintArrow) || {};
    const dark = cfg.dark || '#1a1205';
    const rim = cfg.rim || '#f0c869';
    const ctx = this.ctx;
    const p = this.camera.toScreen(b.x, b.y);
    if (p.x < -60 || p.x > this.viewW + 60) return;
    const cy = p.y - 36 + Math.sin(performance.now() / 300) * 5;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(255,233,168,0.32)';
    ctx.beginPath(); ctx.arc(p.x, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(p.x, cy + 16);
    ctx.lineTo(p.x - 12, cy - 4);
    ctx.lineTo(p.x - 4, cy - 4);
    ctx.lineTo(p.x - 4, cy - 16);
    ctx.lineTo(p.x + 4, cy - 16);
    ctx.lineTo(p.x + 4, cy - 4);
    ctx.lineTo(p.x + 12, cy - 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  },
  // gry 小人模型（头/目镜/躯干/双腿），仅负责外观，不改变任何物理参数
  drawRunner(x, y, w, h, face, onGround, vx) {
    const ctx = this.ctx;
    // 跑动时腿部交替（按移动距离推进相位）
    let step = 0;
    if (onGround && Math.abs(vx) > 0.5) {
      this._runAnim = (this._runAnim || 0) + Math.abs(vx) * 0.32;
      step = Math.sin(this._runAnim) * Math.max(3, h * 0.09);
    } else {
      this._runAnim = 0;
    }
    // 双腿
    ctx.fillStyle = '#0b3d4a';
    ctx.fillRect(x + 3, y + h - 12 + Math.max(0, step), 6, 12 - Math.max(0, step));
    ctx.fillRect(x + w - 9, y + h - 12 + Math.max(0, -step), 6, 12 - Math.max(0, -step));
    // 躯干
    ctx.fillStyle = '#0e2f3a';
    ctx.fillRect(x, y + 12, w, h - 22);
    ctx.strokeStyle = 'rgba(0,229,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 13, w - 2, h - 24);
    // 头
    ctx.fillStyle = '#101c26';
    ctx.fillRect(x + 2, y, w - 4, 12);
    // 目镜（朝向侧）
    ctx.fillStyle = '#f0c869';
    const ex = face > 0 ? x + w - 10 : x + 4;
    ctx.fillRect(ex, y + 4, 6, 4);
  },
  drawFog() {
    const ctx = this.ctx;
    const T = this.tile;
    const R = this.level.mazeCfg ? (this.level.mazeCfg.fogRadius || 3) : 3;
    const pc = Math.floor(this.player.x / T);
    const pr = Math.floor(this.player.y / T);
    if (!this._seen) this._seen = new Set();
    for (let r = 0; r < this.level.rows; r++) {
      for (let c = 0; c < this.level.cols; c++) {
        const key = c + ',' + r;
        const d = Math.max(Math.abs(c - pc), Math.abs(r - pr));
        // 当前可见：记入探索集合（供离开视野后保留轮廓），不遮罩
        if (d <= R) { this._seen.add(key); continue; }
        // 离开视野：去过的用较浅暗色，从没去过的用最深
        const p = this.camera.toScreen(c * T, r * T);
        ctx.fillStyle = this._seen.has(key) ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.92)';
        ctx.fillRect(p.x, p.y, T, T);
      }
    }
  },
  drawBox(x, y, w, h, color, label, isSpike, alpha) {
    const ctx = this.ctx;
    ctx.globalAlpha = (alpha != null ? alpha : 1);
    if (isSpike) {
      // 地刺：画三角形
      ctx.fillStyle = color;
      const n = Math.max(2, Math.floor(w / 12));
      for (let i = 0; i < n; i++) {
        const tx = x + (i * w) / n;
        ctx.beginPath();
        ctx.moveTo(tx, y + h);
        ctx.lineTo(tx + w / n / 2, y);
        ctx.lineTo(tx + w / n, y + h);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
    if (label) {
      const fs = clamp(Math.floor(Math.min(h * 0.34, (w / (label.length || 1)) * 0.9)), 8, 18);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x + 1, y + h / 2 - fs * 0.65, w - 2, fs * 1.3);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + fs + 'px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x + w / 2, y + h / 2, w - 6);
    }
    ctx.globalAlpha = 1;
  },
  // 绘制精灵图：以底部中心 (cx, by) 为锚点，高为 dh（方图宽=高），
  // face<0 时水平翻转；跑动中轻微上下浮动；alpha 可调（如幽灵半透明）。
  drawSprite(spr, cx, by, dh, flip, onGround, vx, alpha) {
    if (!spr || !spr.ready) return;
    const ctx = this.ctx;
    const dw = dh; // 素材为 1:1 方图，等比例缩放不拉伸
    // 跑动浮动相位（与旧版小人腿部动画共用节奏）
    let step = 0;
    if (onGround && Math.abs(vx) > 0.5) {
      this._runAnim = (this._runAnim || 0) + Math.abs(vx) * 0.32;
      step = Math.sin(this._runAnim) * Math.max(2, dh * 0.05);
    } else {
      this._runAnim = 0;
      step = 0;
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;   // 保持像素锐利
    ctx.globalAlpha = (alpha != null ? alpha : 1);
    ctx.translate(cx - dw / 2, by - dh + step);
    if (flip) { ctx.translate(dw, 0); ctx.scale(-1, 1); }
    ctx.drawImage(spr.canvas || spr.img, 0, 0, spr.cw, spr.ch, 0, 0, dw, dh);
    ctx.restore();
  },
  // 从图片生成可绘制精灵：把纯品红背景（#FF00FF 家族，包括水印的半透明墨红底）
  // 抠成透明，并清除生成平台常见的右下角「AI生成」水印块。
  mkSprite(src) {
    const out = { ready: false, canvas: null, img: null, cw: 0, ch: 0 };
    const img = new Image();
    img.onload = () => {
      // 先无条件采用原始图片：在 file:// 下画布被污染、无法 getImageData，
      // 若等到像素处理成功才 ready，精灵图会永远不生效并回退成色块/小人模型。
      out.img = img;
      out.cw = img.naturalWidth; out.ch = img.naturalHeight;
      out.ready = true;
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height);
        const px = d.data;
        // 已抠好透明背景的 PNG（player.png / monster.png）直接使用：
        // 图片本身带 <255 的 alpha 即视为透明素材，跳过品红抠图与水印处理，
        // 避免把透明像素（RGB 已归零）误判为「非背景」而扩大水印清除区域。
        let hasAlpha = false;
        for (let i = 3; i < px.length; i += 4) {
          if (px[i] !== 255) { hasAlpha = true; break; }
        }
        if (hasAlpha) {
          out.canvas = c; out.cw = c.width; out.ch = c.height; out.ready = true;
          return;
        }
        // 品红系判定（收紧：只有接近纯品红的高饱和亮洋红/深洋红才抠掉，
        // 避免误伤暗紫色的幽灵身体与紫红眼睛）：
        // 例：背景 255,0,255 / 深洋红 178,0,178 / 深粉 255,20,147 → 抠；
        //     幽灵暗紫 70,20,110 / 紫红眼 255,60,147 → 保留。
        const isMagenta = (r, gg, b) => b > 120 && r > 150 && gg < b * 0.35 && r > b * 0.7;
        let wmX0 = c.width, wmY0 = c.height, wmX1 = -1, wmY1 = -1;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i], gg = px[i + 1], b = px[i + 2];
          if (isMagenta(r, gg, b)) { px[i + 3] = 0; continue; }
          // 记录非背景像素：仅关心右下角区域（角色主体不会延伸到那里）
          const x = (i / 4) % c.width, y = (i / 4) / c.width;
          if (x > c.width * 0.72 && y > c.height * 0.82) {
            if (x < wmX0) wmX0 = x; if (x > wmX1) wmX1 = x;
            if (y < wmY0) wmY0 = y; if (y > wmY1) wmY1 = y;
          }
        }
        g.putImageData(d, 0, 0);
        if (wmX1 > 0) {
          const pad = Math.max(4, c.width * 0.01);
          g.clearRect(Math.max(0, wmX0 - pad), Math.max(0, wmY0 - pad),
            Math.min(c.width - (wmX0 - pad), wmX1 - wmX0 + pad * 2),
            Math.min(c.height - (wmY0 - pad), wmY1 - wmY0 + pad * 2));
        }
        out.canvas = c; out.cw = c.width; out.ch = c.height; out.ready = true;
      } catch (e) { /* 像素处理失败（如 file:// 画布污染）：保留原始图片兜底，精灵图照常绘制 */ }
    };
    img.src = src;
    return out;
  },
});
