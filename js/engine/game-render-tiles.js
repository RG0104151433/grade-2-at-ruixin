/* ============================================================================
 * engine/game-render-tiles.js —— Game 方法组 · 渲染（背景 / 瓦片 / 触发点）
 * ----------------------------------------------------------------------------
 * 渲染总入口 render、背景（纯色渐变与背景图滚动）、瓦片、毒雾、梯子、
 * 小游戏固定方块、触发点、感叹号标记、门。
 * ----------------------------------------------------------------------------
 * F5「去方块感」：drawTiles 在回退到 drawBox 色块之前，先尝试
 * `this.drawTileArt()` / `this.drawPoisonArt()`（见 game-tile-art.js，按 mapId
 * 取程序化材质与色板）。该模块未加载、或 Game.tileArt === false、
 * 或关卡 def.tileArt === false 时，本文件的行为与改造前完全一致。
 * ----------------------------------------------------------------------------
 * 由原 js/engine.js 按职责拆分而来（原第 3360-3636 行）。方法体未作任何改动；
 * 因改用对象字面量承载，仅在每个方法结束的大括号后补了成员分隔逗号。
 * ==========================================================================*/
'use strict';

Object.assign(Game.prototype, {
  render() {
    const L = this.level;
    if (L && L.mode === 'scene') { this.drawScene(); return; }
    // AI-06 镜像世界：以视口中心为轴整体上下翻转。地形/角色/平台/坑洞/红雾
    // 随之颠倒（它们顺序绘制于下方），HUD/对白/覆盖层在 restore 后保持正常。
    // 2026-09-20：背景不参与翻转 —— 绘制在翻转层之外，镜像态不再倒挂、顶部不再露黑区。
    const _mirrorFlip = !!this.mirrorFlip;
    const _ctx = this.ctx;
    this.drawBackground();
    if (_mirrorFlip) { _ctx.save(); _ctx.translate(0, this.viewH); _ctx.scale(1, -1); }
    // 记忆档案井（library）：右上角「损坏的存档槽」门，与背景同步滚动的独立素材。
    // 必须早于 drawTiles：让黄铜攀爬架（门平台）自然压在门底部之上。
    if (this.drawMemoryWellDoor) this.drawMemoryWellDoor();
    this.drawTiles();
    // F5·道路对齐：隐藏地面砖块后的道路辅助表现（边缘光/车道虚线/接触阴影）
    if (this.drawGroundDressing) this.drawGroundDressing();
    // E3/AI-20：guided 视觉引导叠加（投影锚点/偏离线/前方断口）——仅
    // game.guidedDebug === true 时绘制，缺模块自动跳过
    if (window.GuidedRoute) GuidedRoute.drawHint(this.ctx, this);
    this.drawTraps();
    this.drawPotion();
    this.drawTriggers();
    // 图书馆攀爬：三处档案调查点（ladderNotes，见 level-gen-archive.js）的可见标记——
    // 仅当玩家站上进关选中的触发架时，在其上方画一枚感叹号（未站上 / 已读不画）。
    if (this.drawLadderNotes) this.drawLadderNotes();
    // 遗失索引场（treasure）：扫描终端 / 安全桥 / 索引门（纯渲染，见 game-index-field-art.js）
    if (this.drawIndexField) this.drawIndexField();
    // 年鉴馆接待前厅（library_gate）：接待台暖光 / 莫罗 / 调查点柔和标记（纯渲染）
    if (this.drawArchiveHall) this.drawArchiveHall();

    // E3·S1：oasis 维护标记 / 扫描进度环 / 升降台（纯程序化，仅 oasis）
    if (this.drawOasisMaintenance) this.drawOasisMaintenance();
    // AI-06：镜像谜题世界装饰（校验台/死路门/出口光门/已读提示金标）
    if (this.drawGateMirror) this.drawGateMirror();
    this.drawEnemies();
    this.drawBook();
    this.drawBookDropArrow();
    if (!L.def.hidePlayer) this.drawPlayer();   // hidePlayer：纯展示关不绘制玩家小人
    if (this.level.fog) this.drawFog();
    if (_mirrorFlip) _ctx.restore();
    // 屏上覆盖层（保持正常方向）：跳跃提示箭头 + AI-06 镜像过渡特效
    this.drawJumpArrow();
    if (this.drawGateMirrorFx) this.drawGateMirrorFx(_ctx);
  },
  drawBackground() {
    const ctx = this.ctx;
    const L = this.level;
    const bg = L.def.bg || this.cfg.defaultBg || { top: '#070b18', bottom: '#111a33' };
    // 背景图（移植自gry长街：bgScroll=true 时按世界宽度拉伸并随相机横向滚动）
    const bgImgName = bg.image || L.def.bgImage;
    if (bgImgName) {
      let img = this.loadBgImage(bgImgName);
      // bg.fallback：主图加载失败时回退旧素材（loadBgImage 在 onerror 时打 __failed 标记），
      // 回退图也失败才走渐变兜底——保证关卡背景永不黑屏，且不影响碰撞与物理。
      if (img && img.__failed && bg.fallback) img = this.loadBgImage(bg.fallback);
      if (img && img.complete && img.naturalWidth > 0) {
        if (L.def.bgScreenFixed) {
          // 背景固定在界面（不随相机滚动）：等比放大到覆盖整个视口，按 bgAnchor 对齐，
          // 超出部分由画布裁掉。bgAnchor='top-right' → 图片右上角贴界面右上角，向左/下铺满。
          // bgShiftY<0（失重舞厅）：整体上移，顶部深色吊顶少露出——等比放大补足底部，
          // 并把底边钳到界面底（不露底、不横向拉伸变形）；其它关卡不设此键，路径不变。
          const shiftUp = Math.min(L.def.bgShiftY || 0, 0);
          const s0 = Math.max(this.viewW / img.naturalWidth, this.viewH / img.naturalHeight);
          const s = shiftUp ? Math.max(s0, (this.viewH - shiftUp) / img.naturalHeight) : s0;
          const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
          let dx = 0, dy = 0;
          if (L.def.bgAnchor === 'top-right') { dx = this.viewW - dw; dy = 0; }
          else if (L.def.bgAnchor === 'top-left') { dx = 0; dy = 0; }
          else if (L.def.bgAnchor === 'bottom-right') { dx = this.viewW - dw; dy = this.viewH - dh; }
          else { dx = (this.viewW - dw) / 2; dy = (this.viewH - dh) / 2; }
          if (shiftUp) dy = Math.min(dy, this.viewH - dh);
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
        } else if (L.def.bgCover) {
          // 自然大图（如荒原）：保持原始比例，按世界宽度铺满页面并随相机横向滚动。
          const worldW = L.cols * this.tile;
          if (L.def.bgFillHeight) {
            // bgFillHeight：按界面高度等比缩放（图高=界面高），自 y=0 起铺满整屏，
            // 无上下空隙；横向按世界宽度居中并随相机滚动。
            // 适用于宽高比与「世界宽×界面高」一致的自然大图
            // （如荒野 2048×1024 → 1440×720）。
            const scale = this.viewH / img.naturalHeight;
            const dw = img.naturalWidth * scale;
            const dx = (this.viewW / 2 - this.camera.x) + (worldW - dw) / 2;
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, 0, dw, this.viewH);
          } else {
            // 依据背景图里的「地面线」groundNative 对齐到关卡地面 groundY，
            // 超出视口的部分由画布裁掉，避免横向拉伸变形。
            // bg.valign（共同校验廊）：不做地面线锚定，按垂直对齐方式放置
            //（水平仍按世界宽居中）：
            //   'center' → 垂直居中，上下等量对称溢出、由画布裁掉；
            //   'bottom' → **图片下底与界面下地齐平**，只向上溢出、由画布裁掉。
            const scale = Math.max(worldW / img.naturalWidth, this.viewH / img.naturalHeight);
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;
            const dx = (this.viewW / 2 - this.camera.x) + (worldW - dw) / 2;
            let dy;
            if (bg.valign === 'center') {
              dy = (this.viewH - dh) / 2;
            } else if (bg.valign === 'bottom') {
              dy = this.viewH - dh;
            } else {
              const groundNative = (bg.groundNative != null) ? bg.groundNative : img.naturalHeight;
              const groundY = (L.def.groundY != null) ? L.def.groundY : this.viewH;
              dy = groundY - (groundNative / img.naturalHeight) * dh;
            }
            // 地面锚定且图片未顶到屏幕上沿时（长图宽高比与视口不同），把图片顶行
            // 向上延展补满顶部（边缘钳制）：与图片顶边逐列同色，无横向接缝，
            // 也不会露出上一帧残影/留白；纯渲染，不碰碰撞与物理。
            if (bg.groundNative != null && dy > 0) {
              ctx.drawImage(img, 0, 0, img.naturalWidth, 1, dx, 0, dw, dy);
            }
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
            // 记录整幅背景的屏幕映射，供「接待台遮罩」等渲染层按 native 坐标
            // 精确回贴背景局部（game-archive-hall.js）。纯渲染信息，不碰逻辑。
            this._bgCoverDraw = { img, dx, dy, dw, dh };
          }
        } else if (L.def.bgScrollY) {
          // 垂直滚动背景：保持图片原始比例，宽度严格等于页面宽度（viewW），
          // 超出页面的部分由画布自动裁掉（只露出视口范围）。
          // 锚定世界坐标左上角，与梯子同处世界空间，随相机 1:1 移动
          // （小人向上跳，背景与梯子同步向上滚动；水平方向不移动）。
          const scale = this.viewW / img.naturalWidth;
          const dw = this.viewW;
          const dh = img.naturalHeight * scale;
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
            this.viewW / 2 - this.camera.x,
            this.viewH / 2 - this.camera.y,
            dw, dh);
        } else if (L.def.bgScroll) {
          const worldW = L.cols * this.tile;
          // 对齐gry长街：本引擎相机以“视口中心”为世界坐标原点(camera.x=玩家中心)，
          // 背景应锚定到世界原点 x=0，即屏幕 toScreen(0) = viewW/2 - camera.x。
          // 之前直接照抄 gry 的 `-cam.x`（gry 相机是左上角原点），背景被整体左移了
          // 半屏（viewW/2）：跑到中后段背景图片右侧先于地图耗尽，右半屏只剩空底，
          // 视觉上表现为“后段背景被裁断/拉伸变形”。相机未越过半屏前的瞬态用 0 兜底。
          // F5·道路对齐：bg.groundNative + def.groundY 双锚定时改为「世界锚定」——
          // 图片顶对齐世界 y=0，纵向按「groundNative 行 → groundY」缩放（底部超出
          // 视口由画布裁掉）。相机在垂直钳制范围内任意位置，图中道路上沿都与世界
          // 地面（玩家脚底）重合；窗口尺寸变化同样成立。图片加载失败仍走渐变兜底，
          // 碰撞与该锚点无关。
          const dx = Math.min(0, this.viewW / 2 - this.camera.x);
          if (bg.groundNative != null && L.def.groundY != null) {
            const dh = L.def.groundY * img.naturalHeight / bg.groundNative;
            /* 2026-09-20：bgFixedY —— 背景纵向固定：不随相机纵向移动，也不随镜像翻转。
               横向仍随相机（dx 同上），保留跑动纵深；dy 取「背景底对齐视口底」，
               任何相机高度下都铺满、位置恒定（背景尺寸由 groundNative→groundY 决定，
               与原纵向锚定同一套换算，视觉比例不变）。
               原 AI-06·镜像 dropY 分支（翻转视图里把背景整体下移、并用渐变兜底露出的黑区）
               已删除：背景现在画在翻转层之外，既不翻转也不需要跟随跑道。 */
            if (L.def.bgFixedY) {
              /* 2026-09-21 镜像态（road 翻转跑酷）：背景整幅上下翻转 —— 图内
                 「黑色区/图像区」分界线（groundNative 行）对齐到镜像跑道上沿的
                 屏幕位置：黑区（图底）翻到界线之上作路面背面，街景图像翻到
                 界线之下，与翻转后的世界方向一致。相机纵向已锁定
                 （gateMirrorTick 的 cameraBound 上下同值），对齐位置逐帧恒定；
                 两处共用「跑道 row - 2」同一换算，改跑道基准行不会失配。
                 不足铺满的上下边缘用图底行/顶行延展补满（同正向分支顶行补满思路）。
                 非镜像态走原路径，行为与改造前一致。 */
              const _mMirror = !!this.mirrorFlip && !!(L.def.mirror && L.def.mirror.runway);
              if (_mMirror) {
                const Tm = this.tile;
                const rowTop = ((L.def.mirror.runway.row != null) ? L.def.mirror.runway.row : 3) * Tm;
                const gy = this.camera.y - rowTop + this.viewH / 2;   // 翻转后界线的屏幕 y
                const yImg = -dh * bg.groundNative / img.naturalHeight; // 界线行 → 局部 y=0
                ctx.save();
                ctx.translate(0, gy);
                ctx.scale(1, -1);
                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                  dx, yImg, worldW, dh);
                /* 黑区不足铺到屏幕顶：用图底行向上延展补满 */
                const blackH = dh * (img.naturalHeight - bg.groundNative) / img.naturalHeight;
                if (gy - blackH > 0.5) {
                  ctx.drawImage(img, 0, img.naturalHeight - 1, img.naturalWidth, 1,
                    dx, blackH, worldW, gy - blackH);
                }
                /* 图像上沿未到屏幕底：用图顶行向下延展补满 */
                const skyH = dh * bg.groundNative / img.naturalHeight;
                const gapH = this.viewH - gy - skyH;
                if (gapH > 0.5) {
                  ctx.drawImage(img, 0, 0, img.naturalWidth, 1,
                    dx, yImg - gapH, worldW, gapH);
                }
                ctx.restore();
              } else {
                const dyF = Math.min(0, this.viewH - dh);
                ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                  dx, dyF, worldW, dh);
                this._bgCoverDraw = { img, dx, dy: dyF, dw: worldW, dh };
              }
            } else {
              ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
                dx, this.viewH / 2 - this.camera.y, worldW, dh);
            }
          } else {
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, 0, worldW, this.viewH);
          }
        } else if (L.def.bgTile) {
          // 无缝贴图模式：图片按视口高度等比缩放后横向平铺，
          // 随相机横向滚动循环（左右边缘对齐的无缝贴图专用，适合无尽跑酷关）。
          // 可选 bgParallax（0~1）控制视差速度，默认 1（与世界 1:1 滚动）。
          var parallax = L.def.bgParallax != null ? L.def.bgParallax : 1;
          var tileScale = this.viewH / img.naturalHeight;
          var tileW = img.naturalWidth * tileScale;
          var tileH = this.viewH;
          // 视差偏移：世界原点在屏幕上的位置 × 视差系数
          var raw = this.viewW / 2 - this.camera.x * parallax;
          // 取余到 [0, tileW) 再左移一格，确保从视口左侧之前开始绘制
          var offsetX = ((raw % tileW) + tileW) % tileW - tileW;
          for (var tx = offsetX; tx < this.viewW; tx += tileW) {
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight,
              tx, 0, tileW, tileH);
          }
        } else {
          ctx.drawImage(img, 0, 0, this.viewW, this.viewH);
        }
      } else {
        // 图片未加载完成时用渐变兜底
        const g = ctx.createLinearGradient(0, 0, 0, this.viewH);
        g.addColorStop(0, bg.top || '#070b18'); g.addColorStop(1, bg.bottom || '#111a33');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.viewW, this.viewH);
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, this.viewH);
      g.addColorStop(0, bg.top); g.addColorStop(1, bg.bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }
    // 世界网格（关卡可用 hideGrid 关闭，露出自然背景）
    if (!L.def.hideGrid) {
      const T = this.tile;
      const camX = this.camera.x, camY = this.camera.y;
      ctx.strokeStyle = 'rgba(0,229,255,0.05)';
      ctx.lineWidth = 1;
      const x0 = Math.floor((camX - this.viewW / 2) / T) * T;
      const x1 = camX + this.viewW / 2;
      const y0 = Math.floor((camY - this.viewH / 2) / T) * T;
      const y1 = camY + this.viewH / 2;
      for (let x = x0; x <= x1; x += T) {
        const s = this.camera.toScreen(x, 0).x;
        ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(s, this.viewH); ctx.stroke();
      }
      for (let y = y0; y <= y1; y += T) {
        const s = this.camera.toScreen(0, y).y;
        ctx.beginPath(); ctx.moveTo(0, s); ctx.lineTo(this.viewW, s); ctx.stroke();
      }
    }
  },
  drawTiles() {
    const ctx = this.ctx;
    const L = this.level;
    // F5·隐藏地面砖块：def.hideGroundFromRow 以下的 solid 只保留碰撞不绘制
    // （绿洲跑道地面与其下方填充，玩家直接站在背景图道路上）。仅影响渲染：
    // Level.solids / 碰撞矩阵原样保留，玩家不会因此掉出地图。
    const hideFrom = (L.def.hideGroundFromRow != null)
      ? L.def.hideGroundFromRow * this.tile : null;
    // E2/AI-05：构成件渲染（成片顶面/侧壁/支撑，game-tile-shapes.js）优先——
    // 模块未加载、game.tileShapes===false、关卡 def.tileShapes===false 或地图未
    // 登记主题时返回 false，走下方原逐瓦路径，行为与改造前一致。
    if (this.drawTileShapes && this.drawTileShapes(hideFrom)) return;
    for (const t of this.level.allTiles) {
      const p = this.camera.toScreen(t.x, t.y);
      if (p.x + t.w < -40 || p.x > this.viewW + 40 || p.y + t.h < -40 || p.y > this.viewH + 40) continue;
      if (this._tileHidden(t)) continue;
      if (t.type === 'poison') {
        // 毒雾：优先走主题化「IOI 数据崩坏区」（game-tile-art.js）；该模块未加载
        // 或已关闭（this.tileArt === false / def.tileArt === false）时回退原绿色雾气
        if (!(this.drawPoisonArt && this.drawPoisonArt(p.x, p.y, t.w, t.h, t.color))) {
          this.drawPoison(p.x, p.y, t.w, t.h, t.color);
        }
        continue;
      }
      if (t.special === 'minigame') { this.drawMinigameBlock(p.x, p.y, t.w, t.h); continue; }
      // 记忆档案井：实体黄铜攀爬架（素材 + 程序化回退，见 game-archive-frame-art.js）。
      // 必须早于 hideSolids 跳过，否则会被当成边界实心块而不绘制。
      if (t.special === 'archive_frame' && this.drawArchiveFrameTile) {
        this.drawArchiveFrameTile(p.x, p.y, t.w, t.h, t); continue;
      }
      if (t.type === 'oneway' && this.level.def.ladderStyle) { this.drawLadder(p.x, p.y, t.w, t.h); continue; }
      // 关卡可要求隐藏实心色块（只保留碰撞，露出背景图，如图书馆的金色走廊边界）
      if (t.type === 'solid' && this.level.def.hideSolids) continue;
      // F5「去方块感」：无文字标签的 solid / oneway / block / spike 改走主题化材质
      // 渲染（game-tile-art.js，按 mapId 取材质与色板）；模块未加载时自动回退 drawBox
      if (this.drawTileArt && !pick(t, 'label') && this.drawTileArt(p.x, p.y, t.w, t.h, t)) continue;
      this.drawBox(p.x, p.y, t.w, t.h, t.color, pick(t, 'label'), t.type === 'spike');
    }
  },
  /* F5·地面/边界去方块（渲染层唯一判据）：
     返回 true 的瓦片只保留碰撞、所有绘制路径都跳过。drawTiles 逐瓦循环、
     game-tile-shapes 的构成件与 passthrough、图片加载失败的回退绘制全部走这里，
     因此不存在「某个绘制函数又把方块画回来」的路径。
     只读 def + 瓦片坐标，不碰碰撞数组 / 物理 / 出生点 / 相机边界。
     另：瓦片自带 hiddenVisual 时一律只作碰撞（条件生成几何，如遗失索引场的
     安全桥 col31-48 / 索引门 col49-51 —— 由 game-index-field-art.js 专属图层绘制）。 */
  _tileHidden(t) {
    const L = this.level;
    if (!L || !L.def || !t) return false;
    if (t.hiddenVisual) return true;
    if (t.type !== "solid" && t.type !== "block") return false;
    const d = L.def, T = this.tile;
    if (d.hideGroundFromRow != null && t.y >= d.hideGroundFromRow * T) return true;
    if (d.hideEdgeCols) {
      const cols = L.cols || 0;
      const c0 = Math.round(t.x / T);
      const c1 = c0 + Math.max(1, Math.round(t.w / T)) - 1;
      if (c0 <= 0) return true;
      if (cols > 0 && c1 >= cols - 1) return true;
    }
    return false;
  },
  // F5·道路辅助表现：隐藏地面砖块后，给「玩家脚下的道路」一点可读的着地感。
  // 只画不改：不碰碰撞数组；def.dressGround / hideGroundFromRow 未开启时零绘制。
  // ① 道路上沿 2px 暗青边缘光 + 1px 接地暗线（不是发光平台：alpha 很低、无脉冲）；
  // ② 稀疏车道虚线（世界坐标锚定，随相机横向滚动；间隔远、亮度近零，避免重新产生
  //    「格子感」）；
  // ③ 玩家贴地时的椭圆接触阴影（离地即消失）。
  drawGroundDressing() {
    const L = this.level;
    if (!L || !L.def || !L.def.dressGround || L.def.hideGroundFromRow == null) return;
    const ctx = this.ctx;
    const groundY = (L.def.groundY != null) ? L.def.groundY : L.def.hideGroundFromRow * this.tile;
    const gy = this.camera.toScreen(0, groundY).y;
    if (gy < -24 || gy > this.viewH + 24) return;
    // ① 上沿边缘光
    ctx.fillStyle = 'rgba(47,214,200,0.20)';
    ctx.fillRect(0, gy, this.viewW, 2);
    ctx.fillStyle = 'rgba(4,14,18,0.45)';
    ctx.fillRect(0, gy + 2, this.viewW, 1);
    // ② 稀疏车道虚线（groundY 下方 64px 处，世界间隔 320px / 段长 96px）
    const laneY = gy + 64;
    if (laneY > 0 && laneY < this.viewH) {
      const x0 = this.camera.x - this.viewW / 2;
      const STEP = 320, LEN = 96;
      ctx.fillStyle = 'rgba(180,220,235,0.06)';
      for (let wx = Math.floor(x0 / STEP) * STEP; wx < x0 + this.viewW; wx += STEP) {
        const sx = this.camera.toScreen(wx, 0).x;
        ctx.fillRect(sx, laneY, LEN, 3);
      }
    }
    // ③ 玩家接触阴影
    const p = this.player;
    if (p && p.onGround) {
      const cx = this.camera.toScreen(p.x, 0).x;
      const feet = this.camera.toScreen(0, p.y + p.h / 2).y;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#02080c';
      ctx.beginPath();
      ctx.ellipse(cx, feet + 2, p.w * 0.55, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
  // 毒雾渲染：绿色雾气 + 翻涌 + 上升气泡 + 警示描边（明显视觉提示）
  drawPoison(x, y, w, h, color) {
    const ctx = this.ctx;
    const now = performance.now();
    ctx.save();
    // 底色（呼吸式脉冲）
    ctx.globalAlpha = 0.42 + 0.12 * Math.sin(now / 420);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    // 雾气翻涌
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 3; i++) {
      const cx = x + (w / 4) + (i * w / 3);
      const cy = y + h * 0.4 + Math.sin(now / 600 + i) * 4;
      const r = Math.min(w, h) * 0.3;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    // 上升气泡
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#d9ffe6';
    for (let i = 0; i < 4; i++) {
      const bx = x + ((i + 0.5) * w) / 4 + Math.sin(now / 500 + i * 2) * 3;
      const by = y + h - ((now / 12 + i * 37) % h);
      const br = 2 + (i % 2);
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
    }
    // 警示描边
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#a6ffbf';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    ctx.restore();
  },
  // 图书馆跑酷的梯子平台：一小节棕色梯子（上下横梁 + 竖档）
  drawLadder(x, y, w, h) {
    const ctx = this.ctx;
    const H = Math.min(18, h);
    // 底部投影
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x, y + H - 2, w, 4);
    // 上下横梁
    ctx.fillStyle = '#6f4318';
    ctx.fillRect(x, y, w, 5);
    ctx.fillRect(x, y + H - 5, w, 5);
    // 竖档（梯级）
    const n = Math.max(2, Math.round(w / 16));
    ctx.fillStyle = '#9c662c';
    for (let i = 0; i <= n; i++) {
      const rx = Math.min(x + (i * w) / n, x + w - 4);
      ctx.fillRect(rx, y + 2, 4, H - 4);
    }
    // 顶部高光
    ctx.strokeStyle = 'rgba(255,210,140,0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, H - 1);
  },
  // 天空跑酷的固定方块：在普通悬浮平台基础上加金色呼吸光晕，提示「到达即触发」
  drawMinigameBlock(x, y, w, h) {
    const ctx = this.ctx;
    this.drawBox(x, y, w, h, this.cfg.assetsMap.oneway.color, '', false);
    const now = performance.now();
    const glow = 0.35 + 0.25 * Math.sin(now / 380);
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.strokeStyle = '#ffd97a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x + 1.25, y + 1.25, w - 2.5, h - 2.5);
    ctx.globalAlpha = glow * 0.5;
    ctx.fillStyle = '#ffd97a';
    ctx.fillRect(x, y, w, 3);
    ctx.restore();
  },
  drawTriggers() {
    /* 2026-09-20：镜像跑酷段（road 翻转后）不绘制任何交互点。翻转会把前进段的触发点
       （gate_hint_1 / gate_hint_2 / road_share）画到屏幕上方的无背景区域；镜像段除终点外
       不应有任何交互点。触发器本身保留（正常模式照旧），终点 gate_mirror_exit 自带
       hidden:true 本就不绘制。与 game-interact.js 的判定跳过保持一致。 */
    const _mirrorHideTriggers = !!this.mirrorFlip && this.level && this.level.id === 'road';
    for (const t of this.level.triggers) {
      if (_mirrorHideTriggers) break;
      if (t.hidden) continue;   // 隐藏触发点（如背景图中的门）不绘制
      if (t._activated) continue; // 已激活的触发点（如已点击的感叹号）不再绘制
      if (t.showAfter != null && this.player.x < t.showAfter) continue; // 未到达显现位置
      // filter 未通过（满足条件前，如接待前厅大门未解锁）的触发点不绘制提示；
      // 与交互判定（platformerHitTrigger）一致，保证「不可交互 ⇒ 不显示感叹号」。
      if (!this.save.checkFilter(t.filter)) continue;
      // 内部 auto 剧情触发点（未设置可见 label/icon）不绘制，避免出生点/走廊出现大片半透明面板；
      // 带 icon 的终点标记与 interact 触发点照常绘制。
      if (t.trigger === 'auto' && !t.label && !t.icon) continue;
      // 带自定义柔和标记的交互点（如接待台轮廓 / 调查点光环）由
      // game-archive-hall.js 单独绘制，不再画默认半透明方块。
      if (t.marker) continue;
      const p = this.camera.toScreen(t.rect.x, t.rect.y);
      if (p.x + t.rect.w < -40 || p.x > this.viewW + 40 || p.y + t.rect.h < -40 || p.y > this.viewH + 40) continue;
      if (t.icon === 'exclaim') { this.drawExclaim(p.x, p.y, t.rect.w, t.rect.h); continue; }
      if (t.icon === 'door') { this.drawDoor(p.x, p.y, t.rect.w, t.rect.h); continue; }
      const A = this.cfg.assetsMap;
      const color = (A[t.color] && A[t.color].color) || A.trigger.color;
      const label = t.npc ? pick(A.npc, 'label') : pick(t, 'label');
      this.drawBox(p.x, p.y, t.rect.w, t.rect.h, color, label, false, t.npc ? 0.9 : 0.35);
    }
  },
  // 结尾感叹号触发点：一个小巧的悬浮“!”，替代原巨大出口方块
  drawExclaim(x, y, w, h) {
    const ctx = this.ctx;
    const cx = x + w / 2;
    const cy = y + h * 0.5 + Math.sin(performance.now() / 380) * 3;
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd97a';
    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1205';
    ctx.font = 'bold 16px "Microsoft YaHei","PingFang SC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', cx, cy + 1);
    ctx.restore();
  },
  // 右上方的门：金色门扇 + 深色门框 + 呼吸光晕
  drawDoor(x, y, w, h) {
    const ctx = this.ctx;
    ctx.save();
    // 呼吸光晕
    const glow = 0.25 + 0.15 * Math.sin(performance.now() / 420);
    ctx.globalAlpha = glow;
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    // 门扇
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#ffe9a8');
    g.addColorStop(0.5, '#e0b45c');
    g.addColorStop(1, '#a9781f');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    // 门框
    ctx.strokeStyle = '#5a3a12';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    // 门缝
    ctx.strokeStyle = 'rgba(90,58,18,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 4);
    ctx.lineTo(x + w / 2, y + h - 4);
    ctx.stroke();
    // 门把手
    ctx.fillStyle = '#5a3a12';
    ctx.beginPath();
    ctx.arc(x + w * 0.72, y + h * 0.55, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
});
