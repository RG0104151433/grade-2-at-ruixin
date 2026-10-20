# THE OASIS · AI 交接 README（给接手 Agent）

- 版本：v1.2（2026-10-18）
- 读者：后续接手本项目的 AI agent（全新上下文，不依赖原会话）
- 目的：让你在**不读原对话、不全文加载大文件**的情况下，按本手册一步一步完成《THE OASIS · 绿洲》扩展线的代码落码。
- 配套：《THE-OASIS-文档地图与缺口清单-20261017.md》提供文档全貌、缺口与已定案口径；本文档是执行手册。

---

## 0. 你的身份与职责

你是**落码执行 agent**，不是内容创作者。

- 剧本、方案、数据契约均已定稿。你的职责是：**把数据契约逐条翻译成 `story_config.js` 中的事件序列、flag/clue 与对白**，并保证不破坏既有系统。
- 遇到**阻塞项**（契约未覆盖的事项，见第 8 节）时**停下来报告**；遇到已定案口径与已定稿契约（D1/D2/C1/C2/G5 与 G1-G4，见第 8 节）时**照章执行**。不要自行创造剧情、不要自行拍板口径、不要扩大改动范围。
- 只修改工程内与剧情数据相关的文件（`js/story_config.js`、必要时 `js/i18n.js`、不触碰 `store.js` 的版本逻辑）。不新增无关文件。

### 三条铁律（违反即失败）

1. **不触碰四协议解锁布尔**：任何新增 flag/clue 只进演出/对白/reviews，**不得写入 `inherit` / `public_energy` / `charter` 的 requirements**；`allAlmanac` / `art3misOnline` 等派生状态零改动。
2. **事件只用白名单**（见第 4.1 节）；`filter` 只收 flag，**clue 判定必须走 `ifClue`**。
3. **中英双语必须成对写**：对白同时写入 `dialogueTree` 与 `dialogueTree_en`。

---

## 1. 工程与文档速览

### 1.1 工程路径

```
Desktop\文件\大二下学期开发\oasis\
├── oasis-game-draft\            # 游戏工程（改动对象）
│   ├── index.html               # 入口；含 verify-boot / verify-lint 守卫注释（三层校验第 2 层基线）
│   ├── css\                     # 样式
│   └── js\
│       ├── story_config.js      # ★ 4292 行剧情/地图/对话唯一改动面
│       ├── store.js             # 存档层（save::<user>，story 收 flags[]+clues[]，PROGRESS_VERSION=6）
│       ├── i18n.js              # 双语层（dialogueTree / dialogueTree_en）
│       ├── game-progress.js     # V4 §11.2 穹顶托管两来源判定（dome_source_honor/new，只读参考）
│       ├── engine\              # 引擎（30+ js，一般不改）
│       └── data\                # 地图路由（10 个 route-*.js），含 achievements.js / intro.js 穹顶落点
├── oasis-game-draft.zip         # 备份（约 137 MB，绝不改动）
└── output\第一阶段开发文档\ 等    # 历史文档副本
```

### 1.2 工作目录（文档所在）

```
C:\Users\EasonG\.qianfan\workspace\sessions\1a76703335e74fd0b11709d905be8bb9\2026-10-17\new-chat\
├── THE-OASIS-20261008方案采纳基线-20261017.md      # BASELINE：红线与采纳范围
├── THE-OASIS-KM线数据契约-20261017.md              # KM-CONTRACT：第 1 批落码规格（M 线演出 2 段已定案）
├── THE-OASIS-第零线对白-20261017.md                # ZERO-DIALOGUE：第零线 64 组中英对白
├── THE-OASIS-第零线数据契约-20261017.md            # ZERO-CONTRACT：第零线落码规格
├── THE-OASIS-D线数据契约-20261018.md               # D-CONTRACT：批次 2 落码规格（G1 已定稿）
├── THE-OASIS-N线数据契约-20261018.md               # N-CONTRACT：批次 2 落码规格（G2 已定稿）
├── THE-OASIS-F线数据契约-20261018.md               # F-CONTRACT：批次 2 落码规格（G3 已定稿）
├── THE-OASIS-E线数据契约-20261018.md               # E-CONTRACT：批次 3 落码规格（G4 已定稿）
├── THE-OASIS-回归测试清单-20261018.md              # REG-TEST：每批落码后的回归验收（G6 已补齐）
├── THE-OASIS-文档地图与缺口清单-20261017.md        # 全貌 + 缺口 + 已定案口径（本 README 的目录）
├── THE-OASIS-人类README-20261017.md               # 给项目方，含已定案口径与行动建议
└── THE-OASIS-AI交接README-20261017.md             # ★ 本文件
    .dumate\inbox\
    ├── THE-OASIS-剧情结局重构与第六剧情线方案-20261008.md   # PROPOSAL：第零线裁定
    ├── THE-OASIS-完整游戏剧本-20261005.md                  # SCREENPLAY：唯一剧情事实源
    └── THE-OASIS-完整游戏剧本-纯剧情版-20261005.md         # 纯剧情/对白版
```

---

## 2. 文档消费顺序（每次落码的固定工作流）

```
STEP 1  读 BASELINE（红线）───────────── 10 分钟，建立禁区意识
STEP 2  读本批次「数据契约」───────────── 该批唯一规格；KM、ZERO 或 D/N/F/E
STEP 3  按契约锚点回剧本核对上下文 ─────── 只读对应节（见第 6 节锚点表），不全文读剧本
STEP 4  在 story_config.js 定位落码点 ──── 用锚点检索（grep），禁止全文扫描
STEP 5  落码：事件序列 / flag / clue / 对白
STEP 6  同步 i18n 双语 + 核对 store 兼容
STEP 7  校验：三层替代校验规范（G5 已定案，见 7.1）+ 回归冒烟（见 7.2）
STEP 8  交付：报告落码锚点清单、改动 diff 摘要、未决项
```

每次只做一个批次，做完一批汇报一批。**不要跨批次混做。**

---

## 3. 批次路线图（当前状态）

| 批次 | 内容 | 数据契约 | 状态 | 处理方式 |
|------|------|---------|------|---------|
| 批次 0 | X 线 X1-X3（含全部穹顶剧情，C2 已定案） | 无单独契约（已在代码） | ✅ 已落码 | **先读它的实现作范例**：锚点 `road_share` / `exchange_terminal` / `maze_cover` / `finale_transition` / `morrow` / `library_gate` |
| 批次 1 | K 线（基拉 K1-K4） | KM-CONTRACT | 📋 待落码 | 正文对白见剧本 2.4；节拍见 6.1；合同 P0-2 以 KM-CONTRACT 为落码依据（C1 已定案） |
| 批次 1 | M 线（莫罗 M1-M4） | KM-CONTRACT | 📋 待落码 | 正文见剧本 7.3；M1 前提 `almanac_01_restored`，M3 差分 `kira_signature_public/sealed`；演出按 **2 段** 口径（D1 已定案） |
| 批次 2 | D/N/F 线（IOI 债务奴役调查 / 诺兰动机档案 / 弗娜莱立场） | ✅ D/N/F-CONTRACT-20261018（G1-G3 已定稿） | 📋 待落码 | 契约已回填（见文档地图第 4 节），按契约拆解即可，无需自行读 200 KB 剧本 |
| 批次 3 | X4 告别 + E 线（剧本 9.7 第 3 批） | ✅ E-CONTRACT-20261018（G4 已定稿） | 📋 待落码 | X1-X3 已落码作范例；X4 告别先落地，E4 彩蛋以 X4 完成 + bond≥2 判定 |
| 批次 4 | 穹顶（C2 已定案按 X 线已落码处理） | 无契约 | ✅ 已含于批次 0 | 不新建契约、不单独落码 |
| 批次 5 | 第零线 Z（第六协议，可选） | ZERO-CONTRACT + ZERO-DIALOGUE | 📋 待落码（可选） | 入口门控只用 `zero_backup_tape` 线索存在性（ifClue）；Z1/Z4 演出；三互斥 flag 写档；新图申报独立关卡单列（D2 已定案，仅预算口径不影响落码） |

**当前可执行批次：1（K/M）、2（D/N/F）、3（X4 告别 + E）与 5（第零线，可选）。** D/N/F/E 四份数据契约已定稿，按第 2 节工作流直接执行；批次 3 依赖 X4 告别先落地。

---

## 4. 落码总规则

### 4.1 事件类型白名单（构造事件序列只能用这些）

```
dialog / setFlag / discoverClue / ifClue(then/else) / ifFlag(then/else) /
finaleChoice / changeMap / preload / goalHint / archiveTransition /
inviteVerify / indexBook / fade / choice
```

### 4.2 flag 与 clue 规则

- `filter` 只收 flag（例：K 线去重用 `!kira_sig_choice_done`）；
- 线索类（如 `:almanac_01`、`almanac_01_restored`、`zero_backup_tape`）是 clue，**必须走 `ifClue` 判定，不能进 filter**；
- 同名 flag 写档互斥时（如 `zero_db_public/sealed/questioned`），同一帧原子提交、先写者胜出，不写"已错过"失败态。

### 4.3 对白与存档

- 中英对白成对写入 `dialogueTree` 与 `dialogueTree_en`；
- 存档层 `store.js`：flag 进 `story.flags[]`，clue 进 `story.clues[]`；`PROGRESS_VERSION=6` 不升级，除非契约明确要求；
- 第零线入口可再入、无 UI 提示、不写失败态（已裁定，照此执行）。

### 4.4 命名风格

- 新 flag/clue 沿用现有命名风格（snake_case，语义前缀，如 `kira_` / `zero_` / `witness_`）；
- 可复用锚点：`kira_memory_gate`、`kira_signature_echo`、`witness_token`、`zero_backup_tape`、`zero_db_public`、`ioidebt`、`debt_slave`、`fynne_*`、`e_ch_index`、`aech`、`alley`（当前 count=0，表明尚未落码，落码时挂到契约对应位置）。

---

## 5. 如何低成本把知识转移给你（给派活方的建议）

> 核心问题：`story_config.js` 276 KB / 4292 行、剧本 217 KB，**全文注入不可行**。以下三档按成本从低到高：

| 方式 | 做法 | 成本 | 适用 |
|------|------|------|------|
| **A 最小注入（推荐）** | 只把本 README + 文档地图路径给 agent；让 agent 按第 2 节工作流**按需读取**契约与锚点（grep 定位，不全文扫描） | 极低 | 每批派活 |
| **B 单批契约注入** | 把要落码那一批的数据契约正文直接放进任务 prompt（KM ≈ 23 KB、ZERO ≈ 25 KB，单批可承受） | 中 | 需要"无文件系统"环境或要严格锁定契约版本时 |
| **C 全量注入** | 全部核心文档 + 关键代码段注入 | 高（全部核心文档，含四线数据契约与回归测试清单） | 仅一次性全貌梳理，不适合逐批落码 |

**推荐用法：A+B 组合。** 派活模板见第 10 节任务卡。关键原则：**让 agent 按锚点检索代码，而不是把 story_config.js 全文塞进上下文**；每份契约都在 prompt 里给出绝对路径，agent 自行读取正文。

---

## 6. 关键锚点速查表（grep 用）

| 内容 | 所在文件/节 | 检索锚点 |
|------|------------|---------|
| K 线全文对白 | SCREENPLAY 2.4（L159 起） | `kira_`、`P0-2` |
| M 线全文 | SCREENPLAY 7.3（L480 后） | `morrow_witness_intro`、`almanac_01_restored` |
| K/M 节拍总览 | SCREENPLAY 6.1（L633）/ 6.1b（L645） | `6.1`、`6.1b` |
| M 线演出预算矛盾 | KM-CONTRACT 第三部分（L210） | 已按 **2 段** 定案（D1），按契约回填值执行 |
| D 线 | SCREENPLAY 6.2（L658）/ 6.2b（L763） | `ioidebt`、`debt_slave` |
| N 线 | SCREENPLAY 6.3（L685）/ 6.3b（L1007） | `fynne_`（注意 `nolan` 是剧情无关词，不算落码证据） |
| F 线 | SCREENPLAY 6.4（L701）/ 6.4b（L1370） | `e_ch_index`、`aech` |
| E 线 | SCREENPLAY 6.6（L744）/ 6.6b（L2115） | `alley`；触发改挂/彩蛋也在 6.5b |
| 结局正文 / reviews | SCREENPLAY 8.2 / 8.3（L2464） | 四协议结局 |
| 批次顺序 / 约束 / 解锁布尔 | SCREENPLAY 9.7 / 9.8 / 9.9 | `9.7`、`9.9` |
| voice bible | SCREENPLAY 10.1（L2647） | 对白体例 |
| 第零线方案与裁定 | PROPOSAL 4.1-4.4（L187-268） | Z1-Z4、zero_ |
| 第零线待决策项 | PROPOSAL 7.3（L428） | 第 2 项已定案：新图独立关卡单列（D2） |
| 穹顶剧情落点（只读参考，勿新增契约） | story_config.js L276/L291-300/L356-367/L376/L2030/L2525-2528；data/achievements.js（ending-e2、deal-reject）；game-progress.js V4 §11.2；data/intro.js | C2 已定案：按 X 线已落码处理 |

**在 story_config.js 里检索落码状态的命令（git-bash）：**
```bash
grep -c "kira_memory_gate" "Desktop/文件/大二下学期开发/oasis/oasis-game-draft/js/story_config.js"
# count=0 表示未落码；count>0 表示已落码
```

---

## 7. 校验与交付

### 7.1 三层替代校验规范（G5 已定案，替代缺失的 verify-config 工具）

工程内**没有** verify-config 脚本实体，只有 index.html 的 verify-boot / verify-lint 守卫注释。已定案采用**三层替代校验规范**；若日后项目方提供真实工具，优先用工具并以其通过条件为准。

- **第 1 层 · 静态一致性检查**（落码后、提交前）：
  1. 事件类型全量在白名单内（第 4.1 节，可 grep 核对）；
  2. 新增 flag/clue 均有引用闭环：定义处（setFlag/discoverClue）与判定处（ifFlag/ifClue）一一对应，无孤立引用；
  3. 双语成对：`dialogueTree` 与 `dialogueTree_en` 每个新增键成对出现，key 集合 diff 为空；
  4. 四协议 requirements diff 为零：`inherit` / `public_energy` / `charter` 各层 `requirements` 落码前后无变化；
  5. 锚点计数 0→N：本批契约声明的锚点在 story_config.js 中 grep count 从 0 变为契约约定的 N，且无重复命名。
- **第 2 层 · 工程加载守卫核对**：不改动 `index.html` 脚本加载顺序；落码后以未变更的 verify 守卫注释（verify-boot ⑩ / verify-lint ③⑤ / verify-boot ⑩A）为基线，确认页面加载无脚本缺失/重复。
- **第 3 层 · 动态冒烟**：见 7.2 回归冒烟 5 步。
- **通过判定**：三层全过 = 等价通过；任一失败按失败清单修复后重跑对应层，不得带病交付。

### 7.2 回归冒烟（每批落码后必做）

1. 启动 `index.html`，主线前段（到 X 线任一锚点）无 console 报错；
2. 按契约路径触发本批内容（K/M 或第零线），核对 flag/clue 写入与互斥；
3. 存档 → 读档，状态不丢；
4. 中英切换，对白成对出现；
5. 结局 reviews 页可正常查看（四协议解锁布尔不变）。

### 7.3 交付报告模板（向项目方/派活方汇报）

```
批次：______
落码锚点：______（grep count 变化 0→N）
新增 flag：______  新增 clue：______
双语对白：中 N 条 / 英 N 条（成对）
校验结果：三层替代校验（G5）——第 1 层静态 N/M 项通过；第 2 层加载守卫通过/未通过；第 3 层冒烟 M/N 步通过
回归冒烟：5 步通过/未通过
已定案口径执行情况：D1（2 段）/ D2（独立关卡单列）/ C1（以契约为准）/ C2（按 X 线）——
未决项：______
```

---

## 8. 阻塞与已定案口径速查

> v1.2 起：D1/D2/C1/C2/G5 已全部定案，G1-G4 数据契约已定稿，**均不再是待确认项，照章执行即可**；真正需要停下的是契约未覆盖的未决事项。

| 编号 | 事项 | 处理 |
|------|------|------|
| D1 | KM 契约 M 线演出 2 段 vs 1 段 | **已定案：按 2 段执行**（M1 + M3 暗门回忆层独立段），交付报告标注口径即可，不再等待 |
| D2 | 第零线新图按独立关卡单列申报（不折算合并） | **已定案**：只影响预算申报，不影响落码；知道即可 |
| C1 | K 线合同 P0-2 引用旧文档《剧本重构-第一阶段-20260929.md》找不到 | **已定案**：以 KM-CONTRACT 为落码依据，不找旧文档不溯源 |
| C2 | "穹顶线改动"范围 | **已定案：按 X 线已落码剧情处理**；任务卡出现"穹顶线"字样时直接对应 X 线锚点，**不要新建契约、不要停下确认** |
| G5 | verify-config 工具缺失 | **已定案：跑 7.1 三层替代校验规范**；若派活方提供工具则优先用工具重跑 |
| G1-G4 | D/N/F/E 契约缺失 | ✅ **已定稿**：按 D/N/F/E-CONTRACT-20261018 落码；遇契约未覆盖事项停下来报告，不自行拆剧本 |

---

## 9. 常见坑（务必避开）

- `grep -c "nolan"` 命中不代表 N 线落码——N 线锚点是 `fynne_`，其他词可能是剧情文本；
- `filter` 数组里塞 clue（如 `:almanac_01`）会导致判定失效——clue 只走 `ifClue`；
- 只写 `dialogueTree` 忘写 `dialogueTree_en`——中英必须成对；
- 为了"更完整"把新 flag 加进四协议 requirements——**绝对禁止**；
- 修改 `store.js` 的 PROGRESS_VERSION——未获授权不要动版本号；
- 全文读取 story_config.js（276 KB）——永远用锚点 grep + 局部读取；
- 见到"穹顶"字样就以为缺契约——C2 已定案，穹顶剧情已在 X 线落码，只需做审计回执时登记落点，**不新增数据契约**。

---

## 10. 派活任务卡模板（给派活方复制使用）

```
【任务卡】THE-OASIS 批次 N 落码
- 批次：1（K/M 线）/ 2（D/N/F 线）/ 3（X4 告别 + E 线）/ 5（第零线，可选）
- 数据契约（绝对路径）：______
- 剧本核对节（绝对路径 + 节号）：______
- 需要新增/挂接的锚点：______
- 验收：按第 7 节三层替代校验（G5）+ 回归冒烟，交付报告第 7.3 格式
- 红线：见《AI交接README》第 0 节三条铁律
- 已定案口径：D1=2 段、D2=独立关卡单列、C1=以契约为准、C2=按 X 线（见第 8 节）
- 工作流：按《AI交接README》第 2 节 STEP 1-8
```

把任务卡 + 第 5 节推荐的转移方式（A+B）交给新 agent，即可开始干活，无需原会话上下文。

---

*本文件由 DuMate 于 2026-10-18 更新至 v1.2，内容基于工作目录既有文档与对游戏工程的核实；D1/D2/C1 为项目方拍板口径，C2/G5 为依据工程实际的定案结论；v1.2 起 G1-G4 数据契约已定稿回填（D/N/F/E-CONTRACT-20261018），批次 1-5 解除阻塞（批次 4 穹顶线已含于批次 0/X 线）。*