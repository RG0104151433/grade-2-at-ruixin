/* ============================================================================
   level-gen-archive.js —— Level 的程序化关卡生成方法组 · 记忆档案井（library）
   ------------------------------------------------------------
   从 level-gen.js 拆出（该文件受 verify-lint「js/engine/*.js ≤ 500 行」红线约束）。
   只承载 library 的实体黄铜攀爬架生成 buildLadderParkour；其余生成器仍在
   level-gen.js。加载顺序：level.js 与 level-gen.js 之后、player.js 之前。
   ============================================================================ */
Object.assign(Level.prototype, {
  /* 记忆档案井（library）：程序生成**实体**黄铜攀爬架。
     固定起点（左下）与终点门平台（右上），中间生成左右交错、逐段可达的主路线：
       · 相邻两块水平不重叠（gap 0~2），杜绝「正上方」与大面积上下重叠；
       · 每段抬升 2~3 格（≤ 二段跳上限），水平空隙 ≤2 格（rise=3 物理上限 3.40 格）；
       · 门前最后三块固定为向右上的收束台阶，保证与门 gap ≤1；
       · 主路径列不进入门平台列，避免玩家从下方撞门底梁。
     宽度：主路线 2~3 格；检查点强制 3 格；起点/门 5 格（3+2 素材组合）。
     1 格素材只作主平台上方 2 行、非跳跃端的装饰小檐（不做主路线落点）。 */
  buildLadderParkour() {
    const cfg = this.def.ladderParkour || {};

    /* E1/AI-04B：生成器参数若越出 route 数据 compose 区间，控制台告警（越界即配置错误；
       深度 clamp 接管属 AI-20/E3）。game.tileCompose=false 可静默。 */
    if (window.LevelCompose && this.engine.tileCompose !== false) {
      const _cv = LevelCompose.validateCompose(this.id, this.def);
      if (!_cv.ok) console.warn('[compose] ' + this.id + ':', _cv.errors.join('; '));
    }
    const T = this.engine.tile;
    const seed = (cfg.seed != null ? cfg.seed : Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    const rng = makeRng(seed);
    const rand = (a, b) => a + Math.floor(rng() * (b - a + 1));
    const used = new Set();

    // 单件高度由素材裁剪框宽高比推导（与 game-archive-frame-art.js 同一公式）
    const frameMeta = (this.engine.cfg.meta && this.engine.cfg.meta.archiveFrames) || null;
    const frameAspect = (len) => {
      if (frameMeta && frameMeta.crop && frameMeta.crop[len - 1]) {
        const c = frameMeta.crop[len - 1];
        return c[3] / c[2];
      }
      return [0.4002, 0.3751, 0.3502][len - 1] || 0.3751;
    };
    const frameH = (len) => Math.max(8, Math.round(len * T * frameAspect(len)));

    const mark = (c, r, len) => { for (let i = 0; i < len; i++) used.add((c + i) + ',' + r); };
    const overlaps = (c, r, len) => {
      for (let i = 0; i < len; i++) if (used.has((c + i) + ',' + r)) return true;
      return false;
    };
    const place = (c, r, pieces) => {
      const len = pieces.reduce((a, b) => a + b, 0);
      c = Math.max(1, Math.min(c, this.cols - 1 - len));
      r = Math.max(1, Math.min(r, this.rows - 2));
      mark(c, r, len);
      const h = Math.max.apply(null, pieces.map(frameH));
      const tile = this.addGeneratedFrame(c * T, r * T, len * T, h, pieces);
      return { c, r, len, tile };
    };

    const start = cfg.start || { col: 1, row: this.rows - 2 };
    const door = cfg.door || { col: this.cols - 7, row: 2 };
    const startLen = cfg.startLen || 5;
    const doorLen = cfg.doorLen || 5;
    const doorPlat = place(door.col, door.row, [3, 2]);     // 5 格 = 3+2
    const startPlat = place(start.col, start.row, [3, 2]);  // 5 格 = 3+2

    // ---- 主路线行序列：抬升 2~3 格，末段正好落在门前 3 格处 ----
    const maxRise = Math.max(1, Math.min(3, cfg.stepRows || 3));
    const maxGap = cfg.maxGap != null ? cfg.maxGap : 2;
    const minGap = cfg.minGap != null ? cfg.minGap : 0;
    const minW = cfg.minWidth || 2;
    const maxW = cfg.maxWidth || 3;
    const doorTop = doorPlat.r;
    const lastRow = doorTop + maxRise;
    const totalRise = startPlat.r - lastRow;
    const rises = [];
    let rem = totalRise;
    while (rem > 0) {
      let rise = (rem >= maxRise && rng() < 0.72) ? maxRise : Math.min(maxRise, rem);
      if (rem - rise === 1) rise = rem - 2;   // 避免出现 1 格的碎步（保持每段 2~3 格）
      rises.push(rise); rem -= rise;
    }
    const rows = [];
    let rr = startPlat.r;
    for (const rise of rises) { rr -= rise; rows.push(rr); }
    const nSteps = rises.length;

    // 检查点（约 1/3、2/3、门前）强制 3 格宽（复生落脚更稳）。
    const nearestIdx = (targetRow, exclude) => {
      let best = -1, bd = Infinity;
      for (let i = 0; i < rows.length; i++) {
        if (exclude && exclude.indexOf(i) >= 0) continue;
        const d = Math.abs(rows[i] - targetRow);
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    };
    const cpIdx = [];
    for (const tr of [Math.round(startPlat.r - totalRise / 3),
                      Math.round(startPlat.r - (2 * totalRise) / 3), lastRow]) {
      const i = nearestIdx(tr, cpIdx);
      if (i >= 0) cpIdx.push(i);
    }
    const forceWide = new Set(cpIdx);
    /* 三处档案调查点的目标高度（确定性，不随随机种子变化）：起点/门平台（均为配置
       固定值）之间 25% / 50% / 75% 处。这里只算高度；实际触发架等主路线（spine）
       生成完，在下方 ladderNotes 处按此高度就近选出。 */
    const noteRows = [0.25, 0.5, 0.75]
      .map(f => Math.round(startPlat.r - (startPlat.r - doorTop) * f));

    // 目标斜线：起点中心 → 右上门左缘附近（贯穿整个界面宽度）。
    // 普通段围绕「左下 → 右上」对角线左右摆动，最高处紧贴门左缘，
    // 后续由门前收束台阶把最后几步向右上接到门平台。
    const c0 = startPlat.c + startPlat.len / 2;
    const c1 = doorPlat.c - 1;   // 斜线终点 = 门左缘前一列（界面右上，不进入门列）
    const idealCenter = (row) => {
      const t = (startPlat.r - row) / Math.max(1, startPlat.r - doorTop);
      return c0 + (c1 - c0) * t;
    };

    // ---- 生成主路线普通段（左右交错，相邻不重叠；末 3 块另建收束台阶） ----
    const spine = [];
    let cur = { c: startPlat.c, w: startPlat.len, center: c0 };
    let side = -1;   // 首步经交错翻转为向右
    const genEnd = Math.max(0, nSteps - 4);
    const intervalOf = (sd, wNew) => {
      let lo, hi;
      if (sd > 0) { lo = cur.c + cur.w + minGap; hi = cur.c + cur.w + maxGap; }
      else { lo = cur.c - wNew - maxGap; hi = cur.c - wNew - minGap; }
      lo = Math.max(lo, 1);
      // 普通段右缘不进入门平台列（col ≥ doorPlat.c），避免玩家从下方撞门底梁；
      // 其余可横跨整个界面宽度，配合斜线实现「左下 → 右上」贯穿分布。
      hi = Math.min(hi, (doorPlat.c - 1) - wNew, this.cols - 2 - wNew);
      return { lo, hi };
    };
    // 在 [lo,hi] 内找第一个不与已生成平台重叠的落点；找不到返回 -1
    const findFree = (lo, hi, row, wNew) => {
      for (let c = lo; c <= hi; c++) if (!overlaps(c, row, wNew)) return c;
      for (let c = hi; c >= lo; c--) if (!overlaps(c, row, wNew)) return c;
      return -1;
    };
    for (let k = 0; k <= genEnd; k++) {
      const row = rows[k];
      const wNew = forceWide.has(k) ? 3 : rand(minW, maxW);
      // 位置随机化：目标列围绕斜线 ±1 格抖动（绝对目标，不随步骤累积漂移）。
      const desired = Math.round(idealCenter(row) - wNew / 2) + rand(-1, 1);
      if (desired - cur.center > 1.5) side = 1;
      else if (cur.center - desired > 1.5) side = -1;
      else side = -side;
      let iv = intervalOf(side, wNew);
      if (iv.lo > iv.hi) { side = -side; iv = intervalOf(side, wNew); }
      let c = (iv.lo <= iv.hi) ? Math.max(iv.lo, Math.min(iv.hi, desired))
        : ((desired >= cur.center) ? Math.min(cur.c + cur.w + 1, this.cols - 2 - wNew)
                                   : Math.max(cur.c - wNew - 1, 1));
      // 与已生成平台同行重叠时，就近平移避让（保持可达）
      if (overlaps(c, row, wNew)) {
        const lo = (iv.lo <= iv.hi) ? iv.lo : 1;
        const hi = (iv.lo <= iv.hi) ? iv.hi : Math.min((doorPlat.c - 1) - wNew, this.cols - 2 - wNew);
        const f = findFree(lo, hi, row, wNew);
        if (f >= 0) c = f;
      }
      const spot = place(c, row, [wNew]);
      spine.push({ c: spot.c, row: spot.r, len: spot.len });
      cur = { c: spot.c, w: spot.len, center: spot.c + spot.len / 2 };
    }

    // ---- 门前收束台阶（最后 3 块）：从普通段末端向右上排到门左缘 ----
    const funnelRows = [];
    for (let k = genEnd + 1; k < nSteps; k++) funnelRows.push(rows[k]);
    if (funnelRows.length === 3) {
      const prev = spine.length ? spine[spine.length - 1]
                                : { c: startPlat.c, len: startPlat.len };
      const wF = 3;   // 门前台阶固定 3 格宽（保证门前检查点在宽平台上）
      // 从前一块末块向门插值排三块：共 4 段空隙（prev→f3、f3→f2、f2→f1、f1→门），
      // 每段 0~maxGap，把水平距离均匀摊到空隙里。这样即使普通段末块随机偏左/偏右，
      // 门前台阶仍能保持 ≤maxGap 的连接，不会退化成兜底的断裂布局。
      const prevRight = prev.c + prev.len;
      const dist = doorPlat.c - prevRight;
      const minDist = 3 * wF;
      const cols = [];
      if (dist >= minDist) {
        let slack = Math.min(dist - minDist, 4 * maxGap);
        const gaps = [0, 0, 0, 0];
        // 优先摊在中间两段，门前与连接段尽量小；每段不超过 maxGap。
        for (const i of [1, 2, 0, 3]) {
          const g = Math.min(maxGap, slack);
          gaps[i] = g; slack -= g;
        }
        let x = prevRight + gaps[0];
        cols.push(x); x += wF + gaps[1];
        cols.push(x); x += wF + gaps[2];
        cols.push(x);
      } else {
        // 末块已贴到门前：从门反向排三块（相邻），保证不与门重叠。
        cols.push(doorPlat.c - 3 * wF, doorPlat.c - 2 * wF, doorPlat.c - wF);
      }
      for (let t = 0; t < 3; t++) {
        let c = Math.max(1, Math.min(cols[t], this.cols - 1 - wF));
        // 与已生成平台同行重叠时就近避让（保持能接回门前）
        if (overlaps(c, funnelRows[t], wF)) {
          const f = findFree(1, Math.min((doorPlat.c - 1) - wF, this.cols - 2 - wF), funnelRows[t], wF);
          if (f >= 0) c = f;
        }
        const spot = place(c, funnelRows[t], [wF]);
        spine.push({ c: spot.c, row: spot.r, len: spot.len });
      }
    } else {
      for (let k = genEnd + 1; k < nSteps; k++) {
        const wNew = forceWide.has(k) ? 3 : rand(minW, maxW);
        let c = Math.min(cur.c + cur.w + 1, doorPlat.c - wNew);
        if (overlaps(c, rows[k], wNew)) {
          const f = findFree(1, Math.min(doorPlat.c - 1 - wNew, this.cols - 2 - wNew), rows[k], wNew);
          if (f >= 0) c = f;
        }
        const spot = place(c, rows[k], [wNew]);
        spine.push({ c: spot.c, row: spot.r, len: spot.len });
        cur = { c: spot.c, w: spot.len, center: spot.c + spot.len / 2 };
      }
    }

    this.ladderSpine = spine;   // 主路线平台序列（由下至上；供校验/调试读取）
    this.ladderDoor = { col: doorPlat.c, row: doorPlat.r, len: doorPlat.len };

    // 不登记检查点锚点（genAnchorSpots）：死亡或退出后回到本关出生点（spawn），
    // 从关开头重新攀爬，而不是回到中途检查点（cpIdx/forceWide 仍用于平台宽度）。

    /* 三处档案调查点（2026-09-23 改版）：进关生成完主路线后，按既定高度（起点→门
       25% / 50% / 75%）在**已生成的主路线平台**（spine，由下至上）里就近各选 1 块
       作为触发架——三块互不重复；旁边的随机装饰平台（extra）不参与，保证正常攀爬
       必然踩到。触发与可见标记都绑定在选中平台上：只有玩家双脚站上去
       （Game.standingOnPlatform）才在架子上方冒感叹号并自动播对白，空中掠过不触发；
       选点随本局种子变化（seedFor('ladder') 已定，刷新/复生/读档一致）。对白文案与
       防重复 flag 与旧版一致（archive_note_N）。 */
    const noteTexts = cfg.investigations || [];
    const usedPlat = [];   // 已选 spine 下标：保证三块触发架互不重复
    this.ladderNotes = noteRows.map((targetRow, n) => {
      let best = -1, bd = Infinity;
      for (let i = 0; i < spine.length; i++) {
        if (usedPlat.indexOf(i) >= 0) continue;
        const d = Math.abs(spine[i].row - targetRow);
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return null;   // 兜底：主路线不足 3 块时跳过（实际不会发生）
      usedPlat.push(best);
      const sp = spine[best];
      const txt = noteTexts[n] || {};
      return {
        id: 'archive_note_' + (n + 1),
        flag: 'archive_note_' + (n + 1),
        col: sp.c, row: sp.row, len: sp.len,   // 触发架格坐标（standingOnPlatform 判据）
        targetRow: targetRow,                  // 目标高度行（供校验/调试读取）
        text: [txt.text || ''],
        text_en: [txt.text_en || txt.text || ''],
      };
    }).filter(Boolean);

    // 可选随机平台（保留随机感）：只放在主路线右侧空区（col≥12、下半区），
    // 与任何已生成平台保持 ≥3 行净空，绝不进入主路线的跳跃路径。
    const extra = cfg.extra != null ? cfg.extra : 2;
    let added = 0, tries = 0;
    while (added < extra && tries++ < 400) {
      const len = rand(2, 3);
      const rc = rand(12, this.cols - 2 - len);
      const rrr = rand(25, this.rows - 4);
      if (overlaps(rc, rrr, len)) continue;
      let clear = true;
      for (let i = 0; i < len && clear; i++) {
        for (let dr = -3; dr <= 3; dr++) {
          if (used.has((rc + i) + ',' + (rrr + dr))) { clear = false; break; }
        }
      }
      if (!clear) continue;
      place(rc, rrr, [len]);
      added++;
    }

    this.ladderSeed = seed;
  },
});
