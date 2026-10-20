# 《THE OASIS · 绿洲》E 线数据契约（定稿）

| 项 | 值 |
| --- | --- |
| 文档版本 | E-CONTRACT-20261018 |
| 契约日期 | 2026-10-18 |
| 定位 | E 线（艾奇工坊认同 E1-E4）的**落码数据规格**，第 3 批扩展线（阿尔忒弥斯 + 艾奇）第二线；工程文档地图缺口 G4 已定稿 |
| 状态 | 定稿（待落码） |
| 上游依据 | 《THE-OASIS-完整游戏剧本-20261005》（FINAL：6.6 节拍 L744 / 6.6b 全文 L2115 / 9.1 状态 L2534 / 9.2 数值轨道 L2553 / 9.5 触发改挂 L2594 / 9.9 布尔 L2625 / 2.10 演出预算 L2963）；《THE-OASIS-20261008方案采纳基线-20261017》（BASELINE）；《THE-OASIS-文档地图与缺口清单-20261017》（G4 已定稿：本契约即 G4 回填 / G5 三层校验）；story_config.js（9-23 版，4292 行，代码锚点） |
| 复用格式 | KM-CONTRACT-20261017 结构与 X1-X3 已落地 `trigger/filter/flags/events` 规格，含 `choice` 先例（road_share / exchange_terminal / maze_cover）；数值轨道先例 9.2（engine 层 `numericAtLeast` / `numericTrack`） |

---

# 第一部分 · 契约范围与硬约束

## 1.1 本契约覆盖内容

- E 线：E1 对话（触发节点，工坊）→ E2 选择（储物间 bond 轨道）→ E3 选择（年鉴馆公共区，bond≥1）→ E4 演出 + 解锁反馈（工坊收尾 + ★E→X 彩蛋）。
- 节点 id、节点类型、触发条件、写在节点上的 flag/clue、`save.numeric.aech_bond` 数值轨道、批内/批间互锁、结局回顾（reviews）引用。
- **触发改挂（9.5 定稿）**：E2-E4 由"集齐三把钥匙（key1+key2+key3）→ 终局阶段（palace_memory 或签约厅后）解锁"驱动；E1 为独立触发节点（三钥齐后出现）；涉及即将上线的 X4 告别（第 3 批内）。
- 双声线规格：艾奇 = 绿洲嗓门（命令 + 自夸 +「哈！」开嗓）；海伦 = 现实心声（〔切换到海伦〕标注，短句低音自疑，句尾悬空）；E4 之前禁止全名，只用「我」。
- 「外壳」关键词（机箱外壳 = 身份外壳双关）：每节点 ≥1 次；E4 名字补全前不直呼海伦·哈里斯。

## 1.2 硬约束（不可违反）

1. **命名以剧本 20261005 为准**：E 线 flag/clue 使用剧本正文定稿命名（`aech_arc_unlocked`、`aech_public_support`、`aech_private_support`、`save.numeric.aech_bond`）；文档地图 G4 列出的工程检索锚点 `alley`（当前 count=0）仅作定位用，不得作为新状态 id 落码（同 KM 1.2 第 1 条）。
2. **事件类型白名单**：`dialog / setFlag / discoverClue / ifClue(then/else) / ifFlag(then/else) / finaleChoice / changeMap / preload / goalHint / archiveTransition / inviteVerify / indexBook / fade / choice`（与 KM/D/N/F 契约一致）；数值轨道阈值判定**不新增 story_config 事件类型**，统一由 engine 层 `numericAtLeast`/`numericTrack` 承载（9.2）。
3. **filter 只收 flag，clue 判定必须走 ifClue**：`aech_public_support` / `aech_private_support` 为互斥 flag，filter 可收；「工坊里的未完成自画像」为 clue，不得写入任何 trigger 的 `filter/entryFilter`，只能用 `ifClue` 判定防重播。
4. **不触碰四协议解锁布尔**：本契约全部新增状态只是演出、对白与结局回顾（reviews）的素材，**不得写入** inherit / public_energy / charter 的 requirements 或任何协议解锁判定（9.1 声明）。
5. **资源预算**：0 新图 / 4 节点 / 演出 ≤2 段（E4 演出 1 段 + 彩蛋段，2.10 口径）；工坊、年鉴馆、公共区均复用既有场景，不新增地图。
6. **数值轨道约束**：`save.numeric.aech_bond` 缺失字段按 0 处理；阈值函数 `numericAtLeast(key, n)` / `numericTrack(key, min, max)` 挂 engine 层，story_config 内不出现阈值常量之外逻辑；UI 浮字不显示数字（9.2）。
7. **触发改挂**：E2-E4 走 9.5 三段（只改触发时机不改判定）；不改变 X4 告别演出既有行为。
8. **校验**：按文档地图 G5 三层替代校验规范。

---

# 第二部分 · E 线数据契约（艾奇工坊认同 E1-E4）

## 2.1 入口规格（工坊 · 三钥后触发节点）

| 字段 | 值 | 说明 |
| --- | --- | --- |
| 触发器 id | `aech_gate` | 工坊（公共区/储物间内）新增 interact 热区；三钥齐后出现 |
| trigger 类型 | `interact` | 玩家按 E / 点击触发；不自动弹 |
| filter | `['!aech_arc_unlocked']` | 与 trigger 级 flags 配合去重；首次进入写 `aech_arc_unlocked` |
| 触发改挂（9.5） | E1 独立触发节点 | 集齐 key1+key2+key3 → 三钥齐后出现；E2-E4 在终局阶段（palace_memory 或签约厅后）解锁 |
| 可回溯 / 可跳过 | 可回溯 | 回看入口＝工坊储物间（2.10 E4 规格表 L2963）；演出可跳过 |

> **触发改挂说明（9.5）**：原考量若让 E 线在"声望阈值"（art3mis 信任轨道）处触发会与 X 线错位，E 线统一走三钥路线：三钥齐 → E1 出现；终局阶段按三钥齐解锁 E2-E4。三钥为既有资产（key1/key2/key3），E 线不新增钥匙相关状态。

## 2.2 节点明细（E1-E4）

| 节点 | 节点类型 | 演出数 | 内容 | 写档（flag/clue/numeric） |
| --- | --- | --- | --- | --- |
| E1 | 对话节点（触发） | 0 | 工坊试探「如果有一天你知道我长什么样，还会来这个工坊吗？」；自画像未完成状态（对白双语见 6.6b L2142-2209） | 入口已写 `aech_arc_unlocked`；`discoverClue`「工坊里的未完成自画像」；试探回应不写 flag 不计数值 |
| E2 | 选择节点 | 0 | 储物间「壮汉机械师」形象原因；认同 / 沉默 / 追问（对白双语见 6.6b L2217-2279） | `save.numeric.aech_bond` 增减，见 2.3 |
| E3 | 选择节点 | 0 | 年鉴馆公共区被当众质疑；当众作证 / 私下安慰（bond≥1 可触发；对白双语见 6.6b L2287-2352） | 互斥 flag + bond 增减，见 2.3 |
| E4 | 演出 1 + 解锁反馈 | 1 | 工坊收尾：自画像名字补全「海伦·哈里斯」；同伴名单「署名者」栏；★E→X 彩蛋（bond≥2 且 X4 完成）（对白双语见 6.6b L2358-2430） | 读 bond/X4 完成（只读不写）；见 2.4 |

> 演出预算：E 线共 1 段演出 + 彩蛋追加段（E4），满足「演出 ≤2 段」。

## 2.3 E2 / E3 选择写档规格

**E2 选择（6.6b L2253-2256）**：

| 选项 | 写入 numeric | UI 浮字 |
| --- | --- | --- |
| 认同 | `save.numeric.aech_bond` +1 | 艾奇把模型的螺丝拧紧了一圈 / Aech torques the model's screw one full turn. |
| 沉默 | +0 | 同上 |
| 追问 | +1 | 同上 |

- 试探回应（E1）不写 flag 不计数值（6.6b L2205 附注）。

**E3 选择（6.6b L2318-2322）**：

| 选项 | 写入 flag | bond |
| --- | --- | --- |
| 当众作证 | `aech_public_support` | +1 |
| 私下安慰 | `aech_private_support` | +0 |

- **互斥**：E3 两选项互斥，一次流程只写其一；`aech_public_support` / `aech_private_support` 均为 flag，可入 filter（硬约束 3 允许）。
- E3 触发前提 `save.numeric.aech_bond ≥ 1`（事件内 `numericAtLeast('aech_bond', 1)` 判定，filter 不收 numeric）；E3 完成后写档。

## 2.4 E4 演出 + ★E→X 彩蛋

**主演出（2.10 E4 规格表 L2963-2970）**：工坊全景 → 自画像外壳特写名字补全逐笔浮现（海伦·哈里斯）→ 同伴名单条目高亮（署名者栏）；时长 60-75s；音频暖弦与 K 线共鸣音同族呼应署名主题；演出可跳过、回看入口＝工坊储物间（本演出仅反馈不写数值，`aech_bond` 档位由前序节点持有）。

**★E→X 彩蛋（条件追加，6.6b L2416-2428）**：

```
if numericAtLeast('aech_bond', 2) 且 X4 告别已完成（X 线演出已触发）
→ 追加段：零件箱底旧 ID 签条特写（GEAR_RUNT）
  【系统】回看条目已收录：旧 ID 签条（GEAR_RUNT）。
```

- X4 完成判定：X 线进入轨道并演出终局告别后（第 3 批内，X4 告别已落地）；E 线只读不写 X 线状态。
- 彩蛋段不新增 flag（条件命中追加回看条目，9.1 声明「clue 类仅用于结局回顾与演出档位」）。

## 2.5 E 线新增状态总表

| 标识 | 类型 | 写入节点 | 用途 |
| --- | --- | --- | --- |
| `aech_arc_unlocked` | flag | E1 入口 | 线门控（已进入） |
| `save.numeric.aech_bond` | numeric | E2 / E3 | 数值轨道（E2 ±1/0，E3 +1/0）；E3 触发前提 ≥1；E4 彩蛋前提 ≥2 |
| `aech_public_support` | flag | E3 当众作证 | E3 互斥档位一；结局回顾（reviews）条件引用 |
| `aech_private_support` | flag | E3 私下安慰 | E3 互斥档位二（与上互斥） |
| 工坊里的未完成自画像（`aech_unfinished_portrait`） | clue | E1 | E1 收集线索；E4 名字补全演出引用 |

> 命名说明：线索在剧本中以中文文案定稿（「工坊里的未完成自画像」），契约给出英文 id（`aech_unfinished_portrait`）供 dialogueTree_en 与存档键使用；若工程已有等价既有 clue 则复用既有 id，不新建。**全部状态不进四协议解锁布尔**（硬约束 4）。

---

# 第三部分 · 批间互锁

## 3.1 批次依赖

| 依赖 | 内容 | 契约落点 |
| --- | --- | --- |
| X→E（2.4#4，9.3） | X4 告别完成 → E4 追加零件箱底旧 ID 签条（GEAR_RUNT） | 2.4 彩蛋 |
| E→X（batch 顺序） | E 线第 3 批，与 X 线同批；X4 告别先落地，E4 彩蛋按 X4 完成判定 | 1.2 硬约束 7 / 2.4 |
| E→reviews | `aech_public_support` / `aech_private_support` 供结局回顾条件引用 | 第四部分 |
| E→P2-2 | 回看收纳：工坊储物间 / 旧 ID 签条 | 2.4 |

## 3.2 批内互锁

- E2 三选项（认同/沉默/追问）只写 bond，不写 flag；E3 两选项互斥且各写 flag。
- E4 只读 bond 与 X4 完成态，不新增写入；E1 试探回应不写任何状态（不计数值）。
- `aech_public_support` / `aech_private_support` 同帧原子互斥，先写者胜出。

## 3.3 与 X 线（X1-X3 落地格式）的一致性

- 入口 trigger 级 `flags` 写线门控（同 `road_share` 先例）；进节点即写的状态放 trigger 级，不放在 events 内以防重复触发。
- `ifClue` / `ifFlag` 判定放 events 内；`choice` 事件用法与 `road_share` 一致。
- 双语成对：`dialogueTree` 与 `dialogueTree_en` 每个新增键成对出现（G5 第 1 层静态检查）。
- 数值轨道复用 X 线 `save.numeric.art3mis_trust` 的实现先例（engine 层叠加，不重复造函数）。

---

# 第四部分 · reviews 条件引用（结局回顾）

- **引用规则**：沿 story_config.js 结局 reviews（L4199 起）"条件命中才进入回顾"规则；本线状态均为 `allOf/anyOf` 条件化，不修改 requirements 结构与既有条目。
- **已定稿关联**：`aech_public_support`（当众作证）→ charter 艾奇去向条「艾奇用真名协助重建，公开场合再不以『外壳』自称。」；`aech_private_support`（私下安慰）→ charter 条「艾奇把工坊搬到议会工坊区，海伦·哈里斯以本名任职。」（均为剧本 8.3.4 定稿文案，落码时按 anyOf 命中追加到既有 review，不新增 protocols 判定键）。
- **E4 名字补全**：不新增 reviews 条目；由回看条目（旧 ID 签条 / 工坊储物间）承载。

---

# 第五部分 · 资源预算声明

| 条 | 预算 | 本契约核算 | 结论 |
| --- | --- | --- | --- |
| E 线 | 0 新图 / 4 节点 / 演出 ≤2 段 | 0 新图；节点 E1-E4 计 4；演出 E4 计 1 段 + 彩蛋段（2.10 口径）；工坊/年鉴馆/公共区均复用既有场景 | 达标 |

- 不涉及新地图、新立绘；E4 演出复用 2.10 规格（工坊全景 + 特写），音频与 K 线共鸣音同族（10.4 听觉设计）。

---

# 第六部分 · 不触碰四协议布尔声明

1. 本契约新增状态（flag 3 项＋clue 1 项＋numeric 1 项＝5 项标识）**只进演出、对白、数值轨道与结局回顾 reviews**，不得写入 inherit / public_energy / charter 的 requirements 或任何协议解锁布尔。
2. `allAlmanac` / `art3misOnline` / `buyoutBinding` 及四结局 requirements **零改动**（9.9）。
3. 回归口径：未触发 E 线的存档，四协议判定结果与改动前完全一致；回归以四布尔断言为准（同 BASELINE 6.3）。

---

# 第七部分 · 落码检查清单与验收映射

## 7.1 落码检查清单

- [ ] `aech_gate`（interact；filter `!aech_arc_unlocked`；trigger 级 flags 写 `aech_arc_unlocked`）
- [ ] E1 对话双语 + 线索「工坊里的未完成自画像」；试探回应不写 flag 不计数值
- [ ] E2 choice 写 `save.numeric.aech_bond`（+1/+0/+1）+ 浮字；E3 choice（bond≥1 触发）互斥 flag + bond
- [ ] E4 演出 1（名字补全 + 名单高亮）；彩蛋条件 `numericAtLeast('aech_bond', 2)` 且 X4 完成 → 旧 ID 签条追加
- [ ] 双声线（海伦模式 ≤2 句/节点、E4 前禁全名）；外壳关键词每节点 ≥1
- [ ] 资源核算：E 0 图 / 4 节点 / ≤2 段演出；触发改挂 9.5 三段（只改时机不改判定）
- [ ] 不触碰四协议解锁布尔；`allAlmanac / art3misOnline / buyoutBinding` 零改动
- [ ] 通过 G5 三层替代校验（静态一致性 → index.html 加载守卫 → 动态冒烟）

## 7.2 验收映射

| # | 要求 | 本契约落点 |
| --- | --- | --- |
| R1 | E 线节点 id / 类型 / 触发 / 写档 / 回看 | 第二部分 |
| R2 | 批间互锁（X→E / E→reviews / E→P2-2） | 第三部分 |
| R3 | reviews / 回看差异引用 | 第四部分 |
| R4 | 资源预算（0 新图 / 4 节点 / ≤2 段演出）+ 触发改挂 | 第五部分 / 2.1 |
| R5 | 不触碰四协议布尔 + 数值轨道约束 | 第六部分 / 1.2 硬约束 6 |

## 7.3 版本说明

| 版本 | 日期 | 内容 |
| --- | --- | --- |
| E-CONTRACT-20261018 | 2026-10-18 | 草案首版：节点规格 + flag/clue/numeric 清单 + 触发改挂 + X→E 彩蛋 + 预算 + 校验（G4 回填） |
| E-CONTRACT-20261018（定稿） | 2026-10-18 | 定稿版：状态由「草案（待落码）」升级为「定稿（待落码）」；规格条款不变，确认可作为 E 线落码唯一依据 |

## 7.4 引用文档

- 《THE-OASIS-完整游戏剧本-20261005》（FINAL）——E 线 6.6/6.6b（L744/L2115）、状态 9.1、数值轨道 9.2、触发改挂 9.5、布尔 9.9、演出预算 2.10
- 《THE-OASIS-20261008方案采纳基线-20261017》（BASELINE）——批次计划 6.2 / 预算约束 6.3
- 《THE-OASIS-文档地图与缺口清单-20261017》——G4 已定稿（本契约即 G4 回填） / G5 三层校验
- story_config.js（9-23 版，4292 行）——事件类型全集 / 入口先例 / reviews 引用规则