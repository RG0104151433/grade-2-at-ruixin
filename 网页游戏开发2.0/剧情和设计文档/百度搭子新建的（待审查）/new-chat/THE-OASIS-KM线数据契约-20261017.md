# 《THE OASIS · 绿洲》K/M 线数据契约

| 项 | 值 |
| --- | --- |
| 文档版本 | KM-CONTRACT-20261017 |
| 契约日期 | 2026-10-17 |
| 定位 | K 线（基拉回忆层 K1-K4）与 M 线（莫罗见证席 M1-M4）的**落码数据规格**，第一批扩展线落码的唯一下发口径 |
| 状态 | 待落码 |
| 上游依据 | 《THE-OASIS-完整游戏剧本-20261005》（FINAL，剧情正文真源）；《THE-OASIS-20261008方案采纳基线-20261017》（BASELINE，决策与批次基线）；story_config.js（9-23 版，4292 行，代码锚点） |
| 复用格式 | X1-X3 已在 story_config.js 落地的节点规格（`trigger/filter/flags/events` 结构），含 `choice` 先例（road_share / exchange_terminal / maze_cover） |

---

# 第一部分 · 契约范围与硬约束

## 1.1 本契约覆盖内容

- K 线：K1 演出 → K2 对话 → K3 选择（公开/封存）→ K4 演出（残页升级）；锚点 `library_gate` 新增 `kira_memory_gate`。
- M 线：M1 对话 → M2 选择（追问/尊重）→ M3 暗门演出 → M4 徽记；锚点 `palace_memory` 热区 `morrow`。
- 两线节点 id、节点类型、触发条件、写在节点上的 flag/clue、批内/批间互锁、reviews 条件引用。
- 待决策项裁定：第 3 项（错过窗口存档策略）与第 4 项（memory 层线索条数）——本契约同步给出正式裁定，供第零线契约沿用。

## 1.2 硬约束（不可违反）

1. **命名以剧本 20261005 为准**：K/M 全部 flag/clue 使用正文定稿命名（见第二/第三部分），不使用此前聊天记录中的备选命名（如 `k1_memory_viewed / m1_open` 等均无出处，禁止落码）。
2. **事件类型白名单**：新增节点只允许使用 story_config.js 既有事件类型——`dialog / setFlag / discoverClue / ifClue(then/else) / ifFlag(then/else) / finaleChoice / changeMap / preload / goalHint / archiveTransition / inviteVerify / indexBook / fade / choice`。
3. **filter 只收 flag，clue 判定必须走 ifClue**：`almanac_01`、`almanac_01_restored`、`witness_token`、`morrow_identity`、`kira_signature_echo_public/sealed` 均为 clue，不得写入任何 trigger 的 `filter/entryFilter`，只能用 `ifClue` 分支判定。
4. **不触碰四协议解锁布尔**：本契约全部新增状态仅是演出、对白与结局回顾（reviews）的素材，**不得写入** inherit / public_energy / charter 的 requirements 或任何协议解锁判定。
5. **资源预算**：K、M 两线各 **0 新图 / 4 节点 / 演出 ≤2 段**；详见第六部分。
6. **G5 三层替代校验**：落码后必须按《THE-OASIS-回归测试清单-20261018》（REG-TEST-20261018）通过 G5 三层替代校验（静态一致性 5 项 → 加载守卫核对 → 动态冒烟 5 步），否则视为契约未落地。

---

# 第二部分 · K 线数据契约（基拉回忆层 K1-K4）

## 2.1 入口规格（library_gate 新增 trigger）

| 字段 | 值 | 说明 |
| --- | --- | --- |
| 触发器 id | `kira_memory_gate` | library_gate triggers 数组新增（platformer 模式；模式内已有 `trigger:'interact'` 先例：`libgate_book_pickup` L1018、`morrov_gate` L1059、`road_share` L2878） |
| trigger 类型 | `interact` | 玩家按 E / 点击触发；不自动弹 |
| 布局参照 | 接待台右侧墙面档案格 | x/y/w/h 沿用 archiveHall 调查点坐标域，最终以落码时实测对齐为准 |
| filter | `['!kira_sig_choice_done']`（落地值） | ⚠ 剧本 2.4 原文写 `['almanac_01', '!kira_sig_choice_done']`，但 `almanac_01` 是 clue，filter 不收 clue。落地写法：filter 只放 `!kira_sig_choice_done` 做去重；`almanac_01` 存在性用事件内 `ifClue` 判定；未获 `almanac_01` 时渲染「被锁住的档案格」或按现有调查点无触发处理 |
| 进入写 | `kira_arc_unlocked` | 仅在首次进入时写（与 filter 去重配合），随后进入 K1 |
| 可回溯 / 可跳过 | 可回溯 | 回看入口＝年鉴图鉴·残页 01 详情页；K3 之后再次进入按当前 `kira_signature_public/sealed` 复现 K4 状态横幅 |

## 2.2 节点明细（K1-K4）

| 节点 | 节点类型 | 演出数 | 内容 | 写档（flag/clue） |
| --- | --- | --- | --- | --- |
| K1 | 演出 1（只读观演） | 1 | 被抹去的署名泛起暖光；基拉回忆绿洲起点（对白见剧本 2.4） | 无新写（入口已写 `kira_arc_unlocked`） |
| K2 | 对话节点（无选择） | 0 | 埃尔问「为什么抹掉你的名字」，基拉回应「不是恨我，是怕」 | 无新写 |
| K3 | 选择节点 A（choice） | 0 | 「公开，还是封存？」 | 见 2.3 选择写档 |
| K4 | 演出 2（残页升级） | 1 | 残页 01「被抹去的署名」→「补全的署名」 | `kira_arc_completed`、`almanac_01_restored`（clue） |

> 演出预算：K 线共 2 段演出（K1、K4），满足「演出 ≤2 段」。

## 2.3 K3 选择写档规格

| 选项 | flag | clue（同步写，source） | 即时反馈 |
| --- | --- | --- | --- |
| 公开署名原稿 | `kira_signature_public` | `kira_signature_echo_public`（source `'kira:memory'`） | 残页文案变化 + 莫罗远程确认 |
| 封存原稿 | `kira_signature_sealed` | `kira_signature_echo_sealed`（source `'kira:memory'`） | 残页文案变化 + 基拉短句 |

- **互斥**：K3 两选项互斥，一次流程只写其一；回看时按已写 flag 复现对应横幅。
- **去重**：K3 选择完成后写 `kira_sig_choice_done`（flag），入口 filter 据此关闭，杜绝二次选择。
- **reviews 引用**：两条 clue 供 charter 结局 reviews 以 `anyOf` 引用为实体条款（见第五部分）。

## 2.4 K 线新增状态总表

| 标识 | 类型 | 写入节点 | 用途 |
| --- | --- | --- | --- |
| `kira_arc_unlocked` | flag | K 入口 | 回忆层门控（已进入） |
| `kira_arc_completed` | flag | K4 | 回忆层完成 |
| `kira_signature_public` | flag | K3 公开 | 公开路径门控（场景内/回看差分） |
| `kira_signature_sealed` | flag | K3 封存 | 封存路径门控（场景内/回看差分） |
| `kira_signature_echo_public` | clue | K3 公开 | charter reviews 实体条款引用 |
| `kira_signature_echo_sealed` | clue | K3 封存 | charter reviews 实体条款引用 |
| `almanac_01_restored` | clue | K4 | 残页升级态（M1 触发前提；`almanac_01` 本身 id 不变） |
| `kira_sig_choice_done` | flag | K3 后 | 去重 |

- **兼容性**：`almanac_01` id 保持不变，`allAlmanac` 只读其存在性，升级不改变判定；`almanac_01_restored` 为新增独立 clue。
- **K 线全部状态不进四协议解锁布尔**（硬约束 4）。

---

# 第三部分 · M 线数据契约（莫罗见证席 M1-M4）

## 3.1 触发与插入点（palace_memory 热区 morrow）

| 字段 | 值 | 说明 |
| --- | --- | --- |
| 锚点 | `palace_memory` 热区 `morrow`（远程见证席位） | 场景 mode `scene`，70×30 网格；热区现有 events 见 story_config.js L3121-3132 |
| 触发前提 | 持 `almanac_01_restored`（K4 补全署名）且 `morrow_arc_triggered` 未置位 | `almanac_01_restored` 是 clue → 用 `ifClue` 判定；`morrow_arc_triggered` 是 flag → 防重播 |
| 插入位置 | 既有 `morrow_witness_intro` 对白**之后**、`ifClue ally_maze_cover` 三态判定**之前** | 即：对话 `morrow_witness_intro` 播放完后，先判 `almanac_01_restored`（持，进 M 线）；未持则原样走 `ally_maze_cover → almanac_03 → ok/partial/offline` |
| **不得改动** | 其后 `morrow_witness_ok / partial / offline` 三态判定与现存对白 | 未触发 M 线的存档行为必须与改动前完全一致 |
| 写档 | 线完成写 `morrow_arc_triggered`（flag，防重播） | 防重播短对白见 3.4 |
| 回看 | 可回溯 | 回看入口＝莫罗见证席（`morrow_witness_intro` 后常驻"暗门回忆层"回看）；写 `morrow_identity` 仅首次 |

> 代码锚点：`morrow_witness_intro`（dialogueTree L3691-3696）→ 现接 `ifClue ally_maze_cover`（L3123）。落码时在本热区 events 中，于 L3122 `morrow_witness_intro` 与 L3123 `ifClue` 之间插入 `{ type:'ifClue', id:'almanac_01_restored', then:[M 线事件序列], else:[原有 ally_maze_cover 判定] }`。

## 3.2 节点明细（M1-M4）

| 节点 | 节点类型 | 演出数 | 内容 | 写档（flag/clue） |
| --- | --- | --- | --- | --- |
| M1 | 对话节点（三选一回应） | 1（对话内演出差异） | 「你把它补全了」；选择：关切 / 试探 / 沉默——只做演出差异，**不写独立 flag** | 无新写 |
| M2 | 选择节点 B（choice） | 0 | 「问不问，随你」；选择：追问到底 / 尊重沉默 | 追问到底 → `morrow_pressed`（flag）；尊重沉默 → 无追问档，走 3.3 环境叙事 |
| M3 | 暗门回忆层（演出） | 1 | 年轻三人合影 + 《绿洲公约》第一页；**读 `kira_signature_public/sealed` 合影差分（只读不写）** | `morrow_identity`（clue「莫罗的身份」，仅追问路径；仅首次回看时写） |
| M4 | 见证者徽记（解锁反馈） | 0（对话+道具发放） | 「拿住，见证者的徽记」 | 收下 → `witness_token`（clue，关键道具）；拒收 → `morrow_refused`（flag）；三值互斥轨道见 3.3 |

> 演出预算矛盾标注：剧本 6.1b 总表（L656）写「演出 2 段（M1 与 M3）」，7.3 正文（L483）写「演出 1 段（M3 暗门回忆层）」。本契约采用**保守口径 2 段**（M1 对话差分演出 + M3 暗门演出），预算仍满足「演出 ≤2 段」上限，落码按 2 段申报；待项目方确认统一口径后回填。

## 3.3 三值互斥轨道与分支

M 线选择收敛为**三值互斥轨道**（同一周目只成立其一，先写者胜出，同帧原子提交）：

| 值 | 类型 | 产生条件 | reviews 影响 |
| --- | --- | --- | --- |
| `morrow_pressed` | flag | M2 追问到底 | N3 建议文本差分源 |
| `witness_token` | clue | M4 收下徽记 | charter 差分行 1 条 + inherit 差分行 1 条 |
| `morrow_refused` | flag | M4 拒收徽记 | 见证席差分行（文本以 8.3.3 定稿为主，拒收专属行待评审回填） |

- **尊重沉默路径**（M2 选尊重）：不触发 M3/M4；播放环境叙事（黄铜相框一角 + 莫罗短句，剧本 7.3 尊重沉默路径全文），只进演出文本，不写 `morrow_identity / witness_token / morrow_refused`。
- **拒收路径**：M3 之后莫罗仍出示徽记，玩家可拒收；拒收后写 `morrow_refused`，不写 `witness_token`；见证席差分行按拒收文案呈现（当前以 8.3.3 charter witness_token 行兼容，正式拒收行在落码评审时对齐）。

## 3.4 防重播短对白

`morrow_arc_triggered` 已置位时，再进热区 `morrow` 播放下述短对白（不进主线）：

| 判定 | 对话 id | 内容 |
| --- | --- | --- |
| 已获徽记（持 `witness_token`） | `morrow_arc_m4_retain` | 「徽记还在你那里。它认得选择。」 |
| 已触发未追问（持 `morrow_arc_triggered` 且未持 `morrow_pressed`） | `morrow_arc_env_gap` | 「档案还在，问不问随你。有些账，留着也不算错。」 |

> 判定逻辑：`morrow_arc_triggered` 置位 → ifClue `witness_token`（有→ `morrow_arc_m4_retain`；无→ `morrow_arc_env_gap`）。两类对白均不复播主线 M1-M4。

## 3.5 M 线新增状态总表

| 标识 | 类型 | 写入节点 | 用途 |
| --- | --- | --- | --- |
| `morrow_arc_triggered` | flag | M 线完成时 | 防重播（6.1b 总表曾写作 `morrow_arc_unlocked`，正文 7.3 定稿以 `morrow_arc_triggered` 为准，落码统一用后者） |
| `morrow_pressed` | flag | M2 追问到底 | 追问轨道；N3 建议文本差分源 |
| `morrow_refused` | flag | M4 拒收 | 拒收轨道；见证席差分行 |
| `morrow_identity` | clue | M3 | 「莫罗的身份」；charter reviews 引用 |
| `witness_token` | clue | M4 收下 | 「见证者的徽记」关键道具；charter / inherit reviews 引用 |
| `morrow_arc_m4_retain` | dialog id | 防重播 | 已获徽记短对白（非状态，仅对话树条目） |
| `morrow_arc_env_gap` | dialog id | 防重播 | 已触发未追问短对白（非状态，仅对话树条目） |

- **M 线全部状态不进四协议解锁布尔**（硬约束 4）。
- `witness_token` 以 clue 形态落地，供 charter / inherit reviews 条件引用。

---

# 第四部分 · 批间互锁

## 4.1 批次依赖

| 依赖 | 内容 | 契约落点 |
| --- | --- | --- |
| M1 前提 = K 线完成 | M 线仅在持 `almanac_01_restored`（K4 补全署名）后可触发 | 3.1 触发前提（ifClue） |
| M3 差分 = K3 选择 | M3 合影差分读 `kira_signature_public/sealed`，只读不写 | 3.2 M3 节点 |
| K reviews = charter | K3 两条 clue 被 charter reviews 引用为实体条款 | 第五部分 5.1 |
| M reviews = charter / inherit | `witness_token`、`morrow_identity` 被 charter / inherit reviews 引用 | 第五部分 5.2 |

## 4.2 批内互锁

- K：K3 两选项互斥；`kira_sig_choice_done` 去重；K4 只在 K3 完成后进入。
- M：M2 追问 → M3 → M4 链路；M2 尊重 → 直接环境叙事收束；M4 收下/拒收互斥。
- K/M 两线互锁为**单向**：K 线的 `almanac_01_restored` 解锁 M 线触发；M 线不反向影响 K 线任何判定。

## 4.3 与 X 线（X1-X3 落地格式）的一致性

- K/M 节点规格沿用 X 线已在 story_config.js 落地的 `trigger/filter/flags/events` 结构（参照 `road_share` L2878-2907、`exchange_terminal` L1539 系列、`maze_cover` L2188-2198）。
- `choice` 事件用法与 `road_share` 一致：`prompt/prompt_en + options[{label,label_en,events}]`。
- 若 flag 需要在节点进入时立即写（如 `kira_arc_unlocked`），放在 trigger 级 `flags` 字段（同 `road_share` 的 `flags:['road_share']` 先例），而非事件内部以防重复触发；仅 `ifClue` 类判定放在 events 内。

---

# 第五部分 · reviews 条件引用（结局回顾）

引用规则沿用 story_config.js 结局 reviews（L4199 起）：句子只有条件命中才进入结局回顾；全部为 `anyOf/allOf` 条件化条目，不修改 requirements 结构与既有条目。

## 5.1 charter reviews 追加（基拉署名实体条款，剧本 8.3.2）

| 条件 | 文本（中文定稿） |
| --- | --- |
| `anyOf: ['kira_signature_echo_public']` | 你公开了基拉的署名原稿。玩家公约的第一条由此成为实体条款：被抹去的人要留下名字，保存并公开证据的人也要留下名字。 |
| `anyOf: ['kira_signature_echo_sealed']` | 你封存了基拉的署名原稿。公约第一条因此多出一条注释：有些名字，适合慢一点被看见。 |

## 5.2 charter / inherit reviews 追加（M 线见证差分行，剧本 8.3.3）

| 归属 | 条件 | 文本（中文定稿） |
| --- | --- | --- |
| charter（追问到底路径） | `anyOf: ['witness_token']` | 终局前，莫罗把见证者的徽记按进你掌心，说"凭它，我会站到见证席上"。签署玩家公约时，他果然站在其余共同签署人中间——不是程序判定，是一个把名字让给世界的人。 |
| charter（追问到底路径） | `anyOf: ['morrow_identity']` | 你在暗门里看见年轻三人的合影与《绿洲公约》第一页。他的名字被划掉，见证席却一直为他留着——这与你签署的公约第一条重合：共同设计，共同署名。 |
| inherit（未兑现的承诺差分行） | `anyOf: ['witness_token']` | 你收下了见证者的徽记，然后选择了王座。那道暗门里的合影没等到它想要见证的时刻。 |
| charter（拒收见证席差分行·**建议稿，待项目方定稿**） | `anyOf: ['morrow_refused']` | 你谢绝了莫罗递来的见证者徽记。他没有多言，把那枚验证硬币放回侧柜；玩家公约照常签署，见证席空着一格，像一句没有说出口的到场。 |

## 5.3 落码要求

- 上述 5 条为标准 reviews 增量，落在对应结局 `endings.reviews` 数组尾部，**不触碰既有条目与 requirements**。
- `morrow_refused` 拒收路径不命中 `anyOf:['witness_token']` 条件，charter/inherit 上述 reviews 自然不播；专属「拒收见证席差分行」**建议稿已补入 5.2 表末行（标注待项目方定稿）**：若项目方确认则按建议稿回填落码，未通过则以项目方批注文案为准；不阻塞 K/M 本次落码。

---

# 第六部分 · 资源预算声明

| 线 | 预算 | 本契约核算 | 结论 |
| --- | --- | --- | --- |
| K 线 | 0 新图 / 4 节点 / 演出 ≤2 段 | 0 新图；节点 K1-K4 计 4；演出 K1+K4 计 2 段 | 达标 |
| M 线 | 0 新图 / 4 节点 / 演出 ≤2 段 | 0 新图；节点 M1-M4 计 4；演出按保守口径计 2 段（M1 对话差分 + M3 暗门演出；7.3 正文写 1 段，6.1b 总表写 2 段，矛盾标注见 3.2） | 达标（按 2 段申报） |

- 本次落码不涉及新地图、新背景、新立绘；所有演出复用既有场景与角色资源。

---

# 第七部分 · 不触碰四协议布尔声明

1. 本契约全部新增 flag/clue（K 线 8 项＋M 线 5 项＝13 项状态，另有防重播对白 dialog id 2 个，共 15 项新增标识）**只进演出、谈判文本与结局回顾 reviews**，不得写入 inherit / public_energy / charter 的 requirements 或任何协议解锁布尔。
2. `allAlmanac`、`art3misOnline` 等既有派生状态与判定集合**零改动**。
3. 回归口径：未触发 K/M 线的存档，三协议判定结果与改动前完全一致；回归脚本以四布尔断言（三协议 + buyoutBinding）为准（同 BASELINE 6.3）。

---

# 第八部分 · 待决策项正式裁定（第 3、4 项）

依据 BASELINE-20261017 第五部分，第 3、4 项必须在第零线数据契约落稿前裁定。本契约基于 store.js（319 行）/ story_config.js（4292 行）实际容量核实，给出正式裁定如下。

## 8.1 第 3 项 · 错过窗口的存档策略

**正式裁定：可再入、无 UI 提示、不写"已错过"失败态。**

| 条目 | 裁定 |
| --- | --- |
| 错过窗口定义 | 当周目未持 `zero_backup_tape` 即已过 finale_transition，或进入第零章后倒计时耗尽自动登出 |
| 周目内再入 | 允许。回到 finale_transition 后再持有磁带即可再次出现第二选择项（逻辑同首次持有） |
| 多周目重试 | 允许。存档不清除 `zero_backup_tape`，新周目持带仍可进第零线 |
| UI 提示 | **不提供任何提示**（保持 EPHEMERAL 质感；与第五结局 `fifth_arc_sealed` 永久封条逻辑不同） |
| 状态记录 | **不写"已错过/已耗尽/次数"类 flag 或计数**。未持带时第二选择项不出现；持有即出现；无惩罚、无次数记录 |
| 第零线内耗尽 | 倒计时耗尽自动登出回 finale_transition；回程**不写失败状态**，不触发任何 reviews 差分 |
| 对第零线契约的约束 | 第零线入口门控不引入"错过计数/错过标记"字段；门控只用 `zero_backup_tape` 存在性（clue，ifClue 判定） |

**依据**：BASELINE 第五部分第 3 项建议（可再入、无 UI 提示）与第五结局永久封条语义区分明确；引擎无"周目次数"全局计数依赖，多周目重试对 normalizeProgress（PROGRESS_VERSION=6）白名单无新增迁移成本。

## 8.2 第 4 项 · memory 层线索条数

**正式裁定：不超限、不合并 `zero_db_*` 三选一为枚举字段。**

| 条目 | 裁定 |
| --- | --- |
| 是否超限 | **否**。store.js 无显式线索条数上限，容量只受 localStorage 配额（典型 5MB）约束；story_config.js 现有 clues 331 个，本次新增约 10 个标识（数百字节级），远小于配额量级 |
| 是否合并枚举 | **不合并**。保持 `zero_db_public` / `zero_db_sealed` / `zero_db_questioned` 三独立 flag + 互斥写档规则（同帧原子提交，先写者胜出） |
| 不合并理由 | ① 合并枚举字段会引入新存档类型，增加 normalizeProgress 迁移与互斥维护成本；② 与既有 `ally_maze_cover/leave` 终局互斥、M 线三值互斥轨道（`morrow_pressed / witness_token / morrow_refused`）先例一致；③ 三独立 flag 在 reviews 条件引用 / 演出差分中无需改引擎读取路径 |
| 落码约束 | `zero_db_*` 三 flag 写档遵循「同帧原子提交，先写者胜出」规则（同 `FINAL_STATE_IDS` 处理方式，仅限本线内部互斥，不进终局互斥集合） |

**参考参数（非阻塞）**：此前聊天语境中「P=0.2 与总常量 +8」出自「命运三选项 vs 八代码容」缺省对抗的经验调参，P 为对抗成功率、+8 为常量修正；本契约将其作为**非阻塞参考参数**登记，不构成硬约束，不影响 K/M 落码与第零线数据契约。

---

# 第九部分 · 落码检查清单与验收映射

## 9.1 落码检查清单

- [ ] `library_gate` 新增 `kira_memory_gate`（interact；filter `!kira_sig_choice_done` + 事件内 `ifClue almanac_01`）；进入写 `kira_arc_unlocked`
- [ ] K1-K4 节点与对白（dialogueTree + dialogueTree_en 双语两处同步）落码；K3 choice 两选项 + `kira_sig_choice_done` 去重
- [ ] K4 写 `kira_arc_completed` + `almanac_01_restored`；残页文案升级，`almanac_01` id 不变
- [ ] `palace_memory` 热区 `morrow` 插入 `ifClue almanac_01_restored` → M 线；未持走既有 `ally_maze_cover` 三态（不改写 ok/partial/offline）
- [ ] M1-M4 节点与对白（双语）落码；M2 choice（追问/尊重）；`morrow_pressed` 仅在追问写
- [ ] M3 合影差分读 `kira_signature_public/sealed`（只读不写）；写 `morrow_identity`（仅首次回看）
- [ ] M4 收下 → `witness_token` / 拒收 → `morrow_refused`（三值互斥，先写者胜出）
- [ ] 线完成写 `morrow_arc_triggered`；防重播 `morrow_arc_m4_retain` / `morrow_arc_env_gap` 双语对白
- [ ] reviews 5 条增量（charter ×4 + inherit ×1）挂入对应 `endings.reviews`，不修改 requirements
- [ ] 资源核算：K 0 图 / 4 节点 / 2 段演出；M 0 图 / 4 节点 / 2 段演出（保守口径申报）
- [ ] 不触碰四协议解锁布尔；`allAlmanac / art3misOnline` 判定零改动
- [ ] 通过 G5 三层替代校验（静态一致性 5 项 → 加载守卫核对 → 动态冒烟 5 步，见《回归测试清单》REG-TEST-20261018）

## 9.2 验收映射

| # | 要求 | 本契约落点 |
| --- | --- | --- |
| R1 | K 线节点 id / 类型 / 触发 / 写档 / 回看 | 第二部分 |
| R2 | M 线节点 id / 类型 / 触发 / 写档 / 回看 + 插入点 | 第三部分 |
| R3 | 批次互锁 | 第四部分 |
| R4 | reviews 条件引用 | 第五部分 |
| R5 | 资源预算（0 新图 / 4 节点 / ≤2 段演出 ×2 线） | 第六部分 |
| R6 | 不触碰四协议布尔 | 第七部分 |
| R7 | 第 3、4 项待决策正式裁定 | 第八部分 |

## 9.3 版本说明

| 版本 | 日期 | 内容 |
| --- | --- | --- |
| KM-CONTRACT-20261017 | 2026-10-17 | 首版：K/M 节点规格 + 互锁 + reviews 引用 + 预算声明 + 第 3/4 项裁定 |

## 9.4 引用文档

- 《THE-OASIS-完整游戏剧本-20261005》（FINAL）——K 线 2.4 / M 线 7.3 / 节拍总览 6.1-6.1b / reviews 8.3
- 《THE-OASIS-20261008方案采纳基线-20261017》（BASELINE）——批次计划 6.2 / 预算约束 6.3 / 待决策项第五部分
- story_config.js（9-23 版，4292 行）——事件类型全集 / 入口先例 / reviews 引用规则
- store.js（319 行）——存档结构 / normalizeProgress / 容量依据