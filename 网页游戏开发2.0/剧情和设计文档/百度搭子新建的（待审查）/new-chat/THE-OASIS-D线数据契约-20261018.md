# 《THE OASIS · 绿洲》D 线数据契约（定稿）

| 项 | 值 |
| --- | --- |
| 文档版本 | D-CONTRACT-20261018 |
| 契约日期 | 2026-10-18 |
| 定位 | D 线（IOI 债务奴役调查 D1-D4）的**落码数据规格**，第 2 批扩展线（IOI + 诺兰 + 弗娜莱）首线；工程文档地图缺口 G1 已定稿 |
| 状态 | 定稿（待落码） |
| 上游依据 | 《THE-OASIS-完整游戏剧本-20261005》（FINAL：6.2 节拍 L658 / 6.2b 全文 L763 / 9.1 状态 L2534 / 9.3 交叉 L2568 / 9.9 布尔 L2625）；《THE-OASIS-20261008方案采纳基线-20261017》（BASELINE）；《THE-OASIS-文档地图与缺口清单-20261017》（G1 已定稿：本契约即 G1 回填 / G5 三层校验）；story_config.js（9-23 版，4292 行，代码锚点） |
| 复用格式 | KM-CONTRACT-20261017 结构与 X1-X3 已落地 `trigger/filter/flags/events` 规格，含 `choice` 先例（road_share / exchange_terminal / maze_cover） |

---

# 第一部分 · 契约范围与硬约束

## 1.1 本契约覆盖内容

- D 线：D1 演出（档案柜检索欠款单）→ D2 选择 C1（混入观察 / 立即撤离）→ D3 线索（21:47 出勤异常 + ★F→D 联动旁证）→ D4 演出 + 解锁（底层管道区 · 契约中心地道）。
- 节点 id、节点类型、触发条件、写在节点上的 flag/clue、批内/批间互锁、reviews 条件引用。
- ★P1-2#5 三处同码互引：D3 对白出现「21:47」，与序章怀表、pump_station 维护日志三处同码互引（9.3 #5）。
- 契约中心子场景为第 2 批施工前置（9.5），本契约声明其挂接方式，不落独立地图。

## 1.2 硬约束（不可违反）

1. **命名以剧本 20261005 为准**：D 线 flag/clue 使用剧本正文定稿命名（`debt_arc_unlocked`、`debt_c1_infiltrate`、`debt_c1_retreat`、`debt_21_47_witness`、`debt_21_47_partial`）；文档地图 G1 列出的工程检索锚点 `ioidebt`/`debt_slave`（当前 count=0）仅作定位用，不得作为新状态 id 落码（同 KM 1.2 第 1 条）。
2. **事件类型白名单**：`dialog / setFlag / discoverClue / ifClue(then/else) / ifFlag(then/else) / finaleChoice / changeMap / preload / goalHint / archiveTransition / inviteVerify / indexBook / fade / choice`。
3. **filter 只收 flag，clue 判定必须走 ifClue**：`debt_21_47_witness` / `debt_21_47_partial` 均为 clue，不得写入任何 trigger 的 `filter/entryFilter`，只能用 `ifClue` 分支判定；线索类（母亲的欠款单 / 母亲的出勤异常）同理不进 filter。
4. **不触碰四协议解锁布尔**：本契约全部新增状态只是演出、对白与结局回顾（reviews）的素材，**不得写入** inherit / public_energy / charter 的 requirements 或任何协议解锁判定（9.1 声明）。
5. **资源预算**：0 新图 / 4 节点 / 演出 2 段（D1、D4）；契约中心工作区 / 档案室 / 底层管道区以泵站内嵌子场景设计（0.5 图折算口径申报，不新增独立地图，9.5 口径）。
6. **★P1-2#5 21:47 互引**：D3 对白必须保留「21:47」字样（三处同码：序章怀表 / 水泵站维护日志 / D3 出勤记录），落码后以四协议布尔断言回归核对。
7. **校验**：按文档地图 G5 三层替代校验规范（静态一致性 → index.html 加载守卫 → 动态冒烟），不以 verify-config 脚本存在为前提。

---

# 第二部分 · D 线数据契约（债务奴役调查 D1-D4）

## 2.1 入口规格（北区水泵站 · 档案柜 账目终端热区）

| 字段 | 值 | 说明 |
| --- | --- | --- |
| 触发器 id | `debt_arc_gate` | 北区水泵站档案柜/账目终端新增 interact 热区；复用泵站既有场景与背景族 |
| trigger 类型 | `interact` | 玩家按 E / 点击触发；不自动弹 |
| filter | `['!debt_arc_unlocked']` | 与 trigger 级 flags 配合去重（先例：road_share `flags:['road_share']`） |
| 进入写 | `debt_arc_unlocked` | 首次进入写（trigger 级 flags 字段），随后进入 D1 演出 |
| 可回溯 / 可跳过 | 可回溯 | 回看入口＝档案柜账目终端；D1 演出可跳过（2.5 D1 规格表 L2918） |

## 2.2 节点明细（D1-D4）

| 节点 | 节点类型 | 演出数 | 内容 | 写档（flag/clue） |
| --- | --- | --- | --- | --- |
| D1 | 演出 1（只读观演） | 1 | 检索欠款催缴单（工号 0417 / 4,312 / 逾期 37 天）；母亲声纹回录一句；旁白点题「这笔债不是钱，是十七个月的重来」（对白双语见 6.2b L775-813） | 入口已写 `debt_arc_unlocked`；节点内 `discoverClue`「母亲的欠款单」 |
| D2 | 对话 + 选择 C1 | 0 | 误入契约中心工作区；押送流水线 / 标语「按时偿债，恢复公民身份」（对白双语见 6.2b L821-878） | 选择 C1 见 2.3 |
| D3 | 线索节点（分支） | 0 | 混入 → 完整出勤记录；撤离 → 残缺记录；两分支汇合 + ★F→D 联动（对白双语见 6.2b L890-957） | 见 2.3 / 2.4 |
| D4 | 演出 2 + 解锁 | 1 | 底层管道区被封锁门 → 解锁契约中心地下通道（对白双语见 6.2b L959-1003） | 解锁可探索节点；`debt_arc_unlocked` 已有不重复写 |

> 演出预算：D 线共 2 段演出（D1、D4），满足「演出 ≤2 段」。

## 2.3 D2 选择 C1 写档规格

| 选项 | 写入 flag | 即时反馈（双语见 6.2b L885-886） |
| --- | --- | --- |
| 混入队伍，跟到账目终端那边 | `debt_c1_infiltrate` | 【押送员】「……五个？名单上四个。」 |
| 立即撤离，退回档案柜 | `debt_c1_retreat` | 【系统】「区域访问日志：无新增记录。」 |

- **互斥**：D2 两选项互斥，一次流程只写其一；仅影响 D3 线索完整度，不进解锁判定（剧本 L888 注）。

## 2.4 D3 线索分支与 ★F→D 联动

**分支 A · 混入观察（`debt_c1_infiltrate` 命中）**：出勤台账完整记录——21:47 打卡 · 离场：无 · 注「工作未完成，强制留区」（6.2b L896-917）。
**分支 B · 立即撤离（`debt_c1_retreat` 命中）**：残缺档案——21:47 打卡 · 离场空白 · 后页被抽走（6.2b L919-928）。
**两分支汇合**：`discoverClue`「母亲的出勤异常」（6.2b L947-950）；**★F→D 联动块原样插入**（6.2b L932-945 定稿原文，一字未改）：

```
ifFlag fnale_helped → discoverClue 'debt_21_47_witness'
  【系统】出勤记录 21:47 异常：另有旁证渠道。
  【弗娜莱】那天夜班签退表我多留了一栏。既然你信得过这个人，这一栏给你看。
else → discoverClue 'debt_21_47_partial'
  【系统】出勤记录 21:47 异常：旁证渠道受阻。
```

> 归档权限：结局回顾 · 审计用词（不进入协议解锁判定，6.2b L956）；`debt_21_47_witness` 与 `debt_21_47_partial` 互斥。

## 2.5 D 线新增状态总表

| 标识 | 类型 | 写入节点 | 用途 |
| --- | --- | --- | --- |
| `debt_arc_unlocked` | flag | D 入口 | 线门控（已进入）；D4 解锁依托此 flag 已有 |
| `debt_c1_infiltrate` | flag | D2 混入 | D3 分支 A 门控 |
| `debt_c1_retreat` | flag | D2 撤离 | D3 分支 B 门控（与上互斥） |
| `debt_21_47_witness` | clue | D3（fnale_helped 命中） | D 线 review 完整旁证 |
| `debt_21_47_partial` | clue | D3（fnale_helped 未命中） | D 线 review 残缺旁证（与上互斥） |
| 母亲的欠款单（`debt_mother_notice`） | clue | D1 | D1 收集线索（D4 合流引用） |
| 母亲的出勤异常（`debt_mother_attendance`） | clue | D3 | D3 收集线索（D4 合流引用） |

> 命名说明：后两项线索在剧本中以中文文案定稿（「母亲的欠款单」「母亲的出勤异常」），契约给出英文 id（`debt_mother_notice` / `debt_mother_attendance`）供 dialogueTree_en 与存档键使用；若工程已有等价既有 clue 则复用既有 id，不新建。**全部状态不进四协议解锁布尔**（硬约束 4）。

---

# 第三部分 · 批间互锁

## 3.1 批次依赖

| 依赖 | 内容 | 契约落点 |
| --- | --- | --- |
| F→D（9.3 #3，2.3.2） | F3 选 `fnale_helped` → D3 获 `debt_21_47_witness` 完整旁证 | 2.4 联动块（ifFlag） |
| D→P0-1（9.3 #5） | 21:47 三处同码互引：序章怀表 / 水泵站维护日志 / D3 出勤记录 | 2.2 D3 对白（文本对齐） |
| D→N 审计用词 | `debt_21_47_witness/partial` 供 N 线审计用词条件引用 | 第四部分 |

## 3.2 批内互锁

- D2 两选项互斥（`debt_c1_infiltrate` / `debt_c1_retreat`）；D3 分支由 C1 决定；D4 仅在 D3 汇合后进入。
- `debt_21_47_witness` / `debt_21_47_partial` 同帧原子互斥，先写者胜出（同 M 线三值互斥轨道先例）。

## 3.3 与 X 线（X1-X3 落地格式）的一致性

- 入口 trigger 级 `flags` 写线门控（同 `road_share` 先例）；进节点即写的状态放 trigger 级，不放在 events 内以防重复触发。
- `ifClue` / `ifFlag` 判定放 events 内；`choice` 事件用法与 `road_share` 一致（`prompt/prompt_en + options[{label,label_en,events}]`）。
- 双语成对：`dialogueTree` 与 `dialogueTree_en` 每个新增键成对出现（G5 第 1 层静态检查）。

---

# 第四部分 · reviews 条件引用（结局回顾）

- **引用规则**：沿 story_config.js 结局 reviews（L4199 起）"条件命中才进入回顾"规则；本线状态均为 `allOf/anyOf` 条件化，不修改 requirements 结构与既有条目。
- **已定稿关联**：`debt_21_47_witness` / `debt_21_47_partial` 为 clue，依据剧本 9.1 供 **D 线 review（旁证）与 N 线审计用词**条件引用；引用文案以剧本 8.3 既有各条为准（如 public_energy 文案「你见过她最后十分钟：她不是失踪，是把证据留在原地等一个接手的人。」为 P0-1 `mother_last_ten_minutes` 条件项，D 线旁证条在其后按需追加）。
- **D 线专属 review 建议稿（区分 witness/partial 两档 · 待项目方落码评审定稿）**：剧本 8.3 未给 D 线专属文案，本契约按 8.3 语体（第二人称、画面感、结尾不改写事实）补两档建议稿；落码评审通过后即回填为定稿，未通过则以项目方批注文案为准（处理方式同 KM 5.3 的 morrow_refused 拒收行）。
  - `debt_21_47_witness`（完整旁证 · 建议稿）：「你见过她 21:47 的出勤记录，也见过弗娜莱在本该空白的签退栏里多留的那一笔。她不是失踪，是被人按在制度里继续偿还十七个月的重来——而这一次，终于有人替那晚作证。」
  - `debt_21_47_partial`（残缺旁证 · 建议稿）：「你只找到半页出勤记录：21:47 打卡，离场一栏空白，后页被人抽走。没有人能替那晚作证，可你仍把这张残缺的纸留进了档案——证据不完整，也依然是证据。」
  - 两档与 9.1 clue 定义一一对应（witness=完整旁证 / partial=残缺旁证，互斥），仅进结局回顾，不改四协议解锁布尔。

---

# 第五部分 · 资源预算声明

| 条 | 预算 | 本契约核算 | 结论 |
| --- | --- | --- | --- |
| D 线 | 0 新图 / 4 节点 / 演出 ≤2 段 | 0 新图；节点 D1-D4 计 4；演出 D1+D4 计 2 段；契约中心工作区 / 档案室 / 底层管道区按泵站内嵌子场景（0.5 图折算口径申报） | 达标 |

- 不涉及新地图、新背景、新立绘；演出复用泵站既有资源（2.5 D1 L2918 / 2.6 D4 L2927 规格表）。

---

# 第六部分 · 不触碰四协议布尔声明

1. 本契约新增状态（flag 4 项＋clue 4 项＝8 项标识）**只进演出、对白与结局回顾 reviews**，不得写入 inherit / public_energy / charter 的 requirements 或任何协议解锁布尔。
2. `allAlmanac` / `art3misOnline` / `buyoutBinding` 及四结局 requirements **零改动**（9.9）。
3. 回归口径：未触发 D 线的存档，四协议判定结果与改动前完全一致；回归以四布尔断言为准（同 BASELINE 6.3）。

---

# 第七部分 · 落码检查清单与验收映射

## 7.1 落码检查清单

- [ ] `debt_arc_gate`（interact；filter `!debt_arc_unlocked`；trigger 级 flags 写 `debt_arc_unlocked`）
- [ ] D1-D4 对白双语成对落入 dialogueTree / dialogueTree_en（6.2b L775-1003 全量迁移）
- [ ] D1 `discoverClue`「母亲的欠款单」；D2 choice C1 两选项互斥写档
- [ ] D3 分支 A/B + 汇合 `discoverClue`「母亲的出勤异常」；★F→D 联动 ifFlag `fnale_helped` → witness/partial（原样对白）
- [ ] D4 演出 + 解锁契约中心地下通道可探索节点（契约中心场景就绪后挂接）
- [ ] 资源核算：D 0 图 / 4 节点 / 2 段演出；契约中心按 0.5 图折算申报
- [ ] 不触碰四协议解锁布尔；`allAlmanac / art3misOnline / buyoutBinding` 零改动
- [ ] 通过 G5 三层替代校验（静态一致性 → index.html 加载守卫 → 动态冒烟）

## 7.2 验收映射

| # | 要求 | 本契约落点 |
| --- | --- | --- |
| R1 | D 线节点 id / 类型 / 触发 / 写档 / 回看 | 第二部分 |
| R2 | 批间互锁（F→D / D→P0-1 / D→N） | 第三部分 |
| R3 | reviews 条件引用 | 第四部分 |
| R4 | 资源预算（0 新图 / 4 节点 / ≤2 段演出） | 第五部分 |
| R5 | 不触碰四协议布尔 | 第六部分 |
| R6 | 21:47 三处同码互引 | 1.2 硬约束 6 / 3.1 |

## 7.3 版本说明

| 版本 | 日期 | 内容 |
| --- | --- | --- |
| D-CONTRACT-20261018 | 2026-10-18 | 草案首版：节点规格 + flag/clue 清单 + F→D 联动 + 预算 + 校验（G1 回填） |
| D-CONTRACT-20261018（定稿） | 2026-10-18 | 定稿版：状态由「草案（待落码）」升级为「定稿（待落码）」；第四部分补充 D 线专属 review 建议稿（witness/partial 两档，待项目方落码评审定稿） |

## 7.4 引用文档

- 《THE-OASIS-完整游戏剧本-20261005》（FINAL）——D 线 6.2/6.2b（L658/L763）、状态 9.1、交叉 9.3、预算口径 9.5、布尔 9.9
- 《THE-OASIS-20261008方案采纳基线-20261017》（BASELINE）——批次计划 6.2 / 预算约束 6.3
- 《THE-OASIS-文档地图与缺口清单-20261017》——G1 已定稿（本契约即 G1 回填） / G5 三层校验
- story_config.js（9-23 版，4292 行）——事件类型全集 / 入口先例 / reviews 引用规则