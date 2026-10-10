/* ============================================================================
 * engine/minigame-relay-defense.js —— 小游戏 · 三中继掩护（V4 §8.4）
 * ----------------------------------------------------------------------------
 * 第三幕核心玩法：30 秒内维持城堡外围的三处力场中继，拦截追踪脉冲。
 *   · 玩家在竞技场底部左右移动；脉冲会锁定某个中继并蓄力（预警）。
 *   · 脉冲落下时，玩家若在该中继附近 → 拦截成功；否则该中继损失完整度。
 *   · 按住 E 可在中继附近修复。
 *   · 每 10 秒关闭一段力场（视觉 + 压力递减）。
 *   · 结算：计时结束且至少一处中继存活 → won；三处全部归零 → lost。
 *
 * 只回答「玩法如何运行」，不写任何剧情状态（clue/flag 由事件链提交）。
 * 依赖：core.js 的 clamp / normKey / Pause；音频 Audio2 可选。
 * 加载顺序：core.js 之后；与其它 minigame-*.js 同级，game-minigames.js 之前。
 * ==========================================================================*/
'use strict';

class RelayDefense {
  constructor(engine, opts) {
    opts = opts || {};
    this.engine = engine;
    this.ctx = engine.ctx;
    this.duration = opts.duration || 30;
    this.relays = [0.20, 0.50, 0.80].map(x => ({ x, hp: 100 }));
    this.player = { x: 0.5 };
    this.t = 0;
    this.pulses = [];
    this.nextPulse = 1.4;
    this.field = 0;            // 已关闭的力场段数（0..3）
    this.over = false;
    this.won = false;
    this.attempts = 0;
    this.assist = false;
    this._keys = new Set();
    this._done = false;
    this._last = 0;
    this._bindInput();
  }
  get arena() {
    const w = this.engine.viewW, h = this.engine.viewH;
    return { x: 90, y: 130, w: w - 180, h: h - 250 };
  }
  relayX(i) { const a = this.arena; return a.x + this.relays[i].x * a.w; }
  playerX() { const a = this.arena; return a.x + this.player.x * a.w; }
  _bindInput() {
    this._onKey = e => {
      const k = normKey(e.key);
      if (k === 'Escape') { this.engine.pauseGame(); return; }
      if (k === 'ArrowLeft' || k === 'a') this._keys.add('left');
      else if (k === 'ArrowRight' || k === 'd') this._keys.add('right');
      else if (k === 'e' || k === 'Enter' || k === ' ') this._keys.add('repair');
    };
    this._onKeyUp = e => {
      const k = normKey(e.key);
      if (k === 'ArrowLeft' || k === 'a') this._keys.delete('left');
      else if (k === 'ArrowRight' || k === 'd') this._keys.delete('right');
      else if (k === 'e' || k === 'Enter' || k === ' ') this._keys.delete('repair');
    };
    document.addEventListener('keydown', this._onKey);
    document.addEventListener('keyup', this._onKeyUp);
  }
  _unbindInput() {
    document.removeEventListener('keydown', this._onKey);
    document.removeEventListener('keyup', this._onKeyUp);
  }
  abort() { this.over = true; this.won = false; }
  start() {
    this._last = performance.now();
    return new Promise(resolve => {
      this._resolve = resolve;
      this._loop = requestAnimationFrame(this.loop.bind(this));
    });
  }
  _finish() {
    if (this._done) return;
    this._done = true;
    this._unbindInput();
    cancelAnimationFrame(this._loop);
    if (this.won && window.Audio2 && Audio2.success) Audio2.success();
    if (this._resolve) this._resolve(this.won);
  }
  loop(now) {
    this._loop = requestAnimationFrame(this.loop.bind(this));
    const dt = Math.min(0.05, (now - this._last) / 1000 || 0);
    this._last = now;
    if (typeof Pause === 'undefined' || !Pause.paused) this.step(dt);
    this.draw();
    if (this.over) this._finish();
  }
  radius() { return 0.075; }
  step(dt) {
    const spd = 0.62;                         // 竞技场宽度/秒
    if (this._keys.has('left')) this.player.x -= spd * dt;
    if (this._keys.has('right')) this.player.x += spd * dt;
    this.player.x = clamp(this.player.x, 0.05, 0.95);
    this.t += dt;
    const stage = Math.min(3, Math.floor(this.t / 10));
    if (stage > this.field) this.field = stage;
    // 脉冲生成：力场越少，压力越低（每关闭一段，间隔变长）
    this.nextPulse -= dt;
    if (this.nextPulse <= 0) {
      this._spawnPulse();
      const base = this.assist ? 3.4 : 2.6;
      this.nextPulse = Math.max(1.4, base - this.field * 0.25) + Math.random() * 0.4;
    }
    // 脉冲推进与结算
    const rad = this.radius();
    for (const p of this.pulses) {
      p.t += dt;
      if (!p.done && p.t >= p.windup) {
        p.done = true;
        const rx = this.relays[p.relay].x;
        if (Math.abs(this.player.x - rx) <= rad) {
          if (window.Audio2 && Audio2.click) Audio2.click();
        } else {
          this.relays[p.relay].hp = Math.max(0, this.relays[p.relay].hp - (this.assist ? 25 : 34));
          this.engine.shake(4);
          if (window.Audio2 && Audio2.die) Audio2.die();
        }
      }
    }
    this.pulses = this.pulses.filter(p => p.t < p.windup + 0.45);
    // 修复：站在受损中继旁按住 E
    if (this._keys.has('repair')) {
      for (const r of this.relays) {
        if (r.hp > 0 && r.hp < 100 && Math.abs(this.player.x - r.x) <= rad) {
          r.hp = Math.min(100, r.hp + 14 * dt);
        }
      }
    }
    if (this.relays.every(r => r.hp <= 0)) { this.over = true; this.won = false; return; }
    if (this.t >= this.duration) { this.over = true; this.won = true; }
  }
  _spawnPulse() {
    const alive = this.relays.map((r, i) => i).filter(i => this.relays[i].hp > 0);
    if (!alive.length) return;
    const i = alive[Math.floor(Math.random() * alive.length)];
    this.pulses.push({ relay: i, t: 0, windup: this.assist ? 2.0 : 1.5, done: false });
  }
  draw() {
    const ctx = this.ctx, W = this.engine.viewW, H = this.engine.viewH, a = this.arena;
    const t = k => (window.I18N && I18N.t) ? I18N.t(k) : '';
    ctx.fillStyle = '#05060d';
    ctx.fillRect(0, 0, W, H);
    // 力场帘幕：未关闭的段更亮
    for (let i = 0; i < 3; i++) {
      const on = i >= this.field;
      ctx.fillStyle = on ? 'rgba(90,190,255,0.10)' : 'rgba(60,70,90,0.05)';
      ctx.fillRect(a.x + i * a.w / 3, a.y - 40, a.w / 3, a.h + 40);
      ctx.strokeStyle = on ? 'rgba(120,210,255,0.35)' : 'rgba(90,100,120,0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(a.x + i * a.w / 3, a.y - 40, a.w / 3, a.h + 40);
    }
    // 标题 / 提示
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#00e5ff'; ctx.font = 'bold 26px "Microsoft YaHei",sans-serif';
    ctx.fillText(t('mg_relay_title'), 36, 26);
    ctx.fillStyle = '#cfd8ff'; ctx.font = '15px "Microsoft YaHei",sans-serif';
    ctx.fillText(t('mg_relay_help'), 36, 62);
    // 计时 + 力场
    const left = Math.max(0, Math.ceil(this.duration - this.t));
    ctx.textAlign = 'right'; ctx.fillStyle = '#ffe082'; ctx.font = 'bold 24px "Microsoft YaHei",sans-serif';
    ctx.fillText(t('mg_relay_time', { n: left }), W - 36, 30);
    ctx.fillStyle = '#9fd8ff'; ctx.font = '15px "Microsoft YaHei",sans-serif';
    ctx.fillText(t('mg_relay_field', { n: this.field }), W - 36, 64);
    // 中继 + 完整度
    const baseY = a.y + a.h;
    for (let i = 0; i < this.relays.length; i++) {
      const x = this.relayX(i), hp = this.relays[i].hp;
      ctx.fillStyle = hp > 0 ? 'rgba(40,60,90,0.95)' : 'rgba(30,30,40,0.9)';
      ctx.fillRect(x - 16, baseY - 120, 32, 120);
      ctx.strokeStyle = hp > 0 ? 'rgba(120,210,255,0.7)' : 'rgba(120,120,140,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 16, baseY - 120, 32, 120);
      // 完整度条
      const bh = 110 * (hp / 100);
      ctx.fillStyle = hp > 50 ? '#69f0ae' : (hp > 0 ? '#ffd54f' : '#ff5252');
      ctx.fillRect(x - 10, baseY - 10 - bh, 20, bh);
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#cfe8f0'; ctx.font = '12px "Microsoft YaHei",sans-serif';
      ctx.fillText(Math.round(hp) + '%', x, baseY + 6);
    }
    // 脉冲预警 / 命中
    for (const p of this.pulses) {
      const x = this.relayX(p.relay);
      const k = Math.min(1, p.t / p.windup);
      ctx.save();
      ctx.globalAlpha = p.done ? Math.max(0, 1 - (p.t - p.windup) / 0.45) : 0.35 + 0.5 * k;
      ctx.strokeStyle = p.done ? '#69f0ae' : '#ff6b6b';
      ctx.lineWidth = p.done ? 4 : 3;
      ctx.beginPath();
      ctx.arc(x, baseY - 60, 16 + 40 * (1 - k), 0, Math.PI * 2);
      ctx.stroke();
      if (!p.done) {
        ctx.beginPath();
        ctx.moveTo(x, a.y - 30);
        ctx.lineTo(x, baseY - 60);
        ctx.stroke();
      }
      ctx.restore();
    }
    // 玩家
    const px = this.playerX();
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(px, baseY - 26, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, baseY - 26, 24, 0, Math.PI * 2); ctx.stroke();
  }
}
