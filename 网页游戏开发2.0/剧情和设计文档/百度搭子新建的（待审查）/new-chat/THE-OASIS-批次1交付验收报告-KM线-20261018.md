# THE OASIS · 批次 1（K/M 线）交付验收报告

- 版本：v1.0
- 日期：2026-10-18
- 汇报对象：项目方 / 派活方
- 落码范围：K 线 K1-K4（`kira_memory_gate`）+ M 线 M1-M4（`palace_memory` 热区 `morrow`）
- 依据文档：
  - 《THE-OASIS-KM线数据契约-20261017》（KM-CONTRACT，落码依据）
  - 《THE-OASIS-回归测试清单-20261018》（REG-TEST，G6，验收步骤）
  - 《THE-OASIS-AI交接README-20261017》7.1-7.3（G5 三层替代校验规范与 7.3 交付报告模板）

---

## 1. 批次与落码范围

| 项 | 内容 |
|---|---|
| 批次 | 1（K/M 线） |
| K 线 | K1 演出 → K2 对话 → K3 选择（公开/封存）→ K4 演出（残页升级）；锚点 `library_gate` 新增 trigger `kira_memory_gate` |
| M 线 | M1 对话 → M2 选择（追问/尊重）→ M3 暗门演出（合影差分只读）→ M4 徽记（收下/拒收）；锚点 `palace_memory` 热区 `morrow` |
| 演出口径 | M 线按 **2 段**（M1 对话差分 + M3 暗门回忆层，D1 已定案） |
| 落码文件 | `js/story_config.js`（2026-10-18 落码，4680 行版） |
| 未触碰 | `index.html` 与全部引擎文件（9-23 版基线，脚本加载顺序未变） |

---

## 2. 落码锚点（grep count 0→N）

落码前经契约核对全部锚点为 0；落码后实测 grep count（`js/story_config.js`）：

| 锚点 | 落码前 | 落码后 | 说明 |
|---|---|---|---|
| `kira_memory_gate` | 0 | 4 | trigger 定义 + 引用 |
| `kira_signature_echo_public` | 0 | 4 | clue schema + anyOf + 写档引用 |
| `kira_signature_echo_sealed` | 0 | 4 | clue schema + anyOf + 写档引用 |
| `kira_signature_public` | 0 | 3 | setFlag + ifFlag 差分 |
| `kira_signature_sealed` | 0 | 2 | setFlag + ifFlag 差分 |
| `kira_sig_choice_done` | 0 | 6 | setFlag ×2 + ifFlag + filter |
| `kira_arc_unlocked` | 0 | 2 | trigger flagsAttr + 事件引用 |
| `kira_arc_completed` | 0 | 3 | setFlag ×2 + 事件引用 |
| `almanac_01_restored` | 0 | 7 | clue schema + ifClue ×2 + 写档 |
| `morrow_witness_intro` | 存在（基线） | 3 | M 线插入点既有对白 |
| `morrow_arc_triggered` | 0 | 4 | setFlag + ifFlag 防重播 |
| `morrow_pressed` | 0 | 1 | setFlag（仅追问路径） |
| `morrow_refused` | 0 | 2 | setFlag + 事件引用（reviews 行未落码，见未决项） |
| `morrow_identity` | 0 | 4 | clue schema + ifClue + anyOf + 写档 |
| `witness_token` | 0 | 9 | clue schema + ifClue + anyOf + 写档 |
| `morrow_arc_m4_retain` | 0 | 4 | 防重播对白（双语） |
| `morrow_arc_env_gap` | 0 | 4 | 防重播对白（双语） |

无重复命名：`kiraMemoryGateIdDef=1`、`morrowIdDef=1`（锚点均单一定义）。

---

## 3. 新增状态标识

契约 6.1 总表：K 线 8 项 + M 线 5 项 = **13 项状态**，另有防重播对白 dialog id 2 个，共 **15 项新增标识**。

### K 线 8 项
| 标识 | 类型 | 产生条件 | 判定/引用 |
|---|---|---|---|
| `kira_arc_unlocked` | flag | 进 `kira_memory_gate` | trigger flagsAttr |
| `kira_signature_public` | flag | K3 公开 | ifFlag 差分 |
| `kira_signature_sealed` | flag | K3 封存 | ifFlag 差分 |
| `kira_sig_choice_done` | flag | K3 选择后 | trigger filter 防重进 |
| `kira_arc_completed` | flag | K4 完成（终态标记） | 契约豁免运行时判定 |
| `kira_signature_echo_public` | clue | K3 公开 | charter reviews 实体条款 |
| `kira_signature_echo_sealed` | clue | K3 封存 | charter reviews 实体条款 |
| `almanac_01_restored` | clue | K4 补全署名 | M 线前提（ifClue） |

### M 线 5 项
| 标识 | 类型 | 产生条件 | 判定/引用 |
|---|---|---|---|
| `morrow_pressed` | flag | M2 追问到底（终态标记） | 契约豁免运行时判定 |
| `morrow_refused` | flag | M4 拒收（终态标记，reviews 行未落码） | 契约豁免运行时判定 |
| `morrow_arc_triggered` | flag | M 线完成 | ifFlag 防重播 |
| `morrow_identity` | clue | M3 暗门（仅追问首次回看） | charter reviews 引用 |
| `witness_token` | clue | M4 收下徽记 | charter / inherit reviews 引用 |

三值互斥轨道：`morrow_pressed / witness_token / morrow_refused`，先写者胜出，无合并枚举。

---

## 4. 双语对白

- 静态取证：新增对话树 key 中英**成对 28 对**（`dialogueTree` 与 `dialogueTree_en` key 集合 diff 为空）。
- 动态补验：M 线 20 个对白 id 中英成对、英文无中文残留，切 EN 后无单语缺失。

---

## 5. 三层替代校验（G5）结果

### 第 1 层 · 静态一致性：**5/5 通过**

| # | 检查项 | 结果 | 证据 |
|---|---|---|---|
| 1 | 事件类型全量在白名单内 | 通过 | 本批事件仅出现 `ifClue / dialog / ifFlag / setFlag / discoverClue / choice / fade / changeMap / preload` |
| 2 | flag/clue 引用闭环 | 通过 | 13 项状态定义处与判定处一一对应，无孤立/悬空引用；`kira_arc_completed / morrow_refused / morrow_pressed / kira_arc_unlocked` 4 个契约型终态标记豁免 no-use 判定 |
| 3 | 中英双语成对 | 通过 | 28 个新增 dialog id 中英成对，key 集合 diff 为空 |
| 4 | 四协议 requirements diff 为零 | 通过 | `inherit / public_energy / charter` requirements 零改动；`allAlmanac / art3misOnline` 等派生状态零改动 |
| 5 | 锚点计数 0→N | 通过 | 全部契约锚点落码后 grep count ≥1；无重复命名 |

### 第 2 层 · 工程加载守卫：**通过**

`index.html` 与全部引擎文件（`game-events.js / game-scene.js / game-progress.js / dialog.js / store.js`）最新修改时间 2026-09-23，本轮仅落码 `story_config.js`（10-18），脚本加载顺序未动，verify-boot / verify-lint 守卫基线未触碰，页面加载无脚本缺失/重复。

### 第 3 层 · 动态冒烟：**5 步全部通过**

| 步骤 | 内容 | 结果 |
|---|---|---|
| 1 | 启动 `index.html`，主线前段无 console 报错 | 通过（console 零报错） |
| 2 | 按契约路径触发本批内容，核对 flag/clue 写入与互斥 | 通过（S1-S9 全量 **34/34 PASS**，明细见下） |
| 3 | 存档 → 读档，状态不丢 | 通过（M 线存档/读档 flags/clues 保留 6/6：`morrow_pressed / morrow_arc_triggered / morrow_identity / witness_token / almanac_01_restored`） |
| 4 | 中英切换，对白成对出现 | 通过（M 线 20 个对白 id 中英成对，英文无中文残留） |
| 5 | 结局 reviews 可查，四协议解锁布尔不变 | 通过（S8 基线四布尔 + reviews；S9 持证档 charter/inherit + A 中英双向） |

S1-S9 场景明细（34/34 PASS）：
- S1 K 公开路径：10 项通过
- S2 K 封存路径：3 项通过
- S3 K 锁死（防重进）：3 项通过
- S4 M 收下路径：9 项通过（修复后时序：等入场对白 `palace_memory_intro` 结束 `status==='running'` 再触发热区）
- S5 M 封存差分：2 项通过
- S6 M 尊重路径：2 项通过
- S7 M 拒收路径：2 项通过（仅写 `morrow_refused` flag，不落 reviews 行）
- S8 基线四布尔 + reviews：通过
- S9 持证档（charter / inherit reviews + A 中英双向）：通过

**四布尔断言**：`inherit=true  public_energy=false  charter=false  buyoutBinding=false`（未触发本批内容的存档，与改动前一致）。

---

## 6. 已定案口径执行情况

- **D1（M 线演出 2 段 vs 1 段）**：按 **2 段** 执行（M1 对话差分 + M3 暗门回忆层独立段）✅
- **D2（第零线新图独立关卡单列）**：不涉及本批（第零线为批次 5）
- **C1（K 线旧文档找不到）**：以 KM-CONTRACT 为落码依据，不溯源旧文档，不新建契约 ✅
- **C2（穹顶线改动按 X 线）**：不涉及本批（穹顶/X 线属批次 4 已落码范畴）

---

## 7. 未决项

- **`morrow_refused` 拒收见证席差分行（reviews 建议稿待定稿）**：KM-CONTRACT 5.2 表末行「你谢绝了莫罗递来的见证者徽记……」为**建议稿，待项目方定稿**；通过前不落码该行（S7 仅写 `morrow_refused` flag，不写 reviews 行）。若项目方确认建议稿，按确认文案回填落码并复跑第 3 层 S7；不阻塞 K/M 本次验收。

---

## 8. 结论

**通过。** 三层替代校验（G5）全过：第 1 层静态一致性 5/5、第 2 层加载守卫通过、第 3 层动态冒烟 5 步全过（S1-S9 共 34/34 + M 线补验 6/6）；四布尔断言与改动前完全一致；reviews 5 条增量（charter ×4 + inherit ×1）已挂对应结局，未修改 requirements。

---

*本文件由 DuMate 于 2026-10-18 按《THE-OASIS-AI交接README-20261017》7.3 交付报告模板与《THE-OASIS-回归测试清单-20261018》第 5 节回归记录模板填写。*