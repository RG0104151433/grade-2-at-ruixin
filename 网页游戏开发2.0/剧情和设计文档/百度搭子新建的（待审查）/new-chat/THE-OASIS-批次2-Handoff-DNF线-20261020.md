# THE OASIS · 批次 2（D/N/F 线）Agent 交接 Handoff

- 版本：v1.0（2026-10-20）
- 读者：后续接手本批工作的 AI agent（全新上下文，不依赖原会话）
- 目的：完整记录批次 2（D/N/F 三线）**已落码的全部改动**、修复过程、校验结果，以及当前暂停点、未完成项与下一步，使接手 agent 无需回读原对话即可继续。
- 配套：《THE-OASIS-AI交接README-20261017.md》（执行手册）、《THE-OASIS-回归测试清单-20261018.md》（验收规格）

---

## 0. 一句话现状

D/N/F 三线**已完成落码**，五份校验脚本**全部通过**，回归验收第 1 层（静态一致性 5 项）与第 2 层（加载守卫）**已通过**；第 3 层动态冒烟**未执行**（被用户「停一停」打断，等待后续指示）。下一步是修复本地服务器 403 bug → 升级浏览器 CLI → 跑动态冒烟 5 步 + 四布尔断言。

---

## 1. 工程与改动文件

| 文件 | 路径 | mtime | 本轮是否改动 |
|---|---|---|---|
| `js/story_config.js` | `Desktop\文件\大二下学期开发\oasis\oasis-game-draft\js\story_config.js` | 2026-10-19 21:43 | ✅ **唯一改动面**（5586 行，9-23 版 4292 行 → 本轮 +1294 行） |
| `index.html` | 同上目录 | 2026-09-23 20:10 | ❌ 未动（脚本加载顺序未变） |
| `js/i18n.js` / `js/store.js` / `js/main.js` / 全部引擎 js | 同上 `js\` | 2026-09-23 及更早 | ❌ 未动 |
| 校验脚本 ×5 + 静态服务器脚本 | 当前工作目录 `new-chat\`（见第 5 节） | 2026-10-19 | ✅ 本批新建 |

- 工程**非 git 仓库**，无版本控制；改动仅体现在文件 mtime 与内容。
- 近 5 天（截至 2026-10-20）`js\` 下除 `story_config.js` 外**无任何其他 js 被修改**（`find js -mtime -5` 仅命中 story_config.js）。

---

## 2. 落码内容总览（三线各自做了什么）

三线均按对应数据契约落码，硬约束一致：事件类型全在白名单内、filter 只收 flag（clue 一律走 `ifClue`）、中英双语成对、**全部新增状态不进四协议 requirements**。

### 2.1 D 线（IOI 债务奴役调查 D1-D4）— 依据 D-CONTRACT-20261018

| 节点 | 内容 | 落码位置（story_config.js 行号） |
|---|---|---|
| 入口 | 北区水泵站档案柜热区 `debt_arc_gate`（interact） | L2643 起 |
| D1 | 演出：检索欠款单（工号 0417 / 4,312 / 逾期 37 天）→ `discoverClue debt_mother_notice`；写 `debt_arc_unlocked` | L2661-2663 |
| D2 | choice C1 两选项互斥：`debt_c1_infiltrate` / `debt_c1_retreat` | L2672-2677 |
| D3 | 分支 A/B 按 C1 档位；汇合 `discoverClue debt_mother_attendance`；★F→D 联动：`ifFlag fnale_helped` → `discoverClue debt_21_47_witness`，否则 `debt_21_47_partial` | L2680-2696 |
| D4 | 演出 + 契约中心地道解锁提示 | L2700 |
| 回看 | 已触发后再进热区三态：`debt_arc_review_witness / partial / ongoing` | L4208 前（dialogueTree） |

- clue 定义：`debt_mother_notice`（L430）、`debt_mother_attendance`（L438）、`debt_21_47_witness`（L444）、`debt_21_47_partial`（L451）。
- ⚠ 契约硬约束 6：D3 对白保留「21:47」字样（三处同码互引：序章怀表 / 水泵站维护日志 / D3 出勤记录）——校验脚本已断言。

### 2.2 N 线（诺兰动机档案 N1-N4）— 依据 N-CONTRACT-20261018

| 节点 | 内容 | 落码位置（story_config.js 行号） |
|---|---|---|
| N1 | `index_gate` 合同①流程内扩写：`ifFlag nolan_arc_unlocked` 分支 → 动机对白 + `setFlag nolan_arc_unlocked`；既有 deal 选项零改动 | L2213-2219 |
| N2 | 年鉴馆私人档案格热区 `nolan_arc_gate`（library_gate）：filter `['nolan_arc_unlocked']`；事件内 `ifClue nolan_soron_identity` 防重播 → `discoverClue` + 对白 | L1340-1353 |
| N3 | maze_exit 分支：`ifClue nolan_soron_identity` → choice C2 三选项互斥 `nolan_confronted / nolan_circumspect / nolan_sympathized`；含 morrow_pressed 差分文本（M→N 留口，未强制） | L2435-2456 |
| N4 | palace_contract.entryEvents：`ifFlag nolan_arc_unlocked` → 三档手写批注差分（note）×3 + 差异化视角片段（shot）×3 + open/close（**只读不写 flag**） | L2808-2824 |

- clue 定义：`nolan_soron_identity`（L465，usedBy `library_gate.triggers.nolan_arc_gate.events`）。
- ⚠ `nolan` 命中为剧情无关词，**不算**落码证据；契约锚点是 `nolan_arc_*` / `nolan_*` 三档 flag。

### 2.3 F 线（弗娜莱立场 F1-F4）— 依据 F-CONTRACT-20261018

| 节点 | 内容 | 落码位置（story_config.js 行号） |
|---|---|---|
| F1 | 演出（只读观演）：押送区 → 写 `fnale_arc_unlocked` | L2718-2729 |
| F2 | 走廊值班签到屏：对白 + `discoverClue fnale_pause`；`ifClue fnale_pause` 防重播 | L2730 附近 |
| F3 | choice C3 三选项互斥：`fnale_helped / fnale_reported / fnale_neutral`；分支收尾对白（helped/reported/neutral 三档 after） | L2739-2759 |
| F4 | palace_contract.entryEvents：`ifFlag fnale_arc_unlocked` → 三档终局留言板（helped/reported/neutral + open/close，**只读不写 flag**） | L2828-2841 |

- clue 定义：`fnale_pause`（L478，usedBy `maps.pumping_station.scene.hotspots.fnale_gate.events`）。
- ★F4 彩蛋：`fnale_helped` 命中时留言板「匿名测试员」新增一栏（隐去签名「谢谢」+「那枚硬币」呼应 M4），**不新增 flag**（契约硬约束 6）。
- ★F3→D3 联动由 **D 线热区内部** `ifFlag fnale_helped → discoverClue debt_21_47_witness` 承接，F 线自身不重复写（L2691）。

### 2.4 三线新增状态清单（合计 18 项）

| 线 | flag（9 项） | clue（9 项） |
|---|---|---|
| D | `debt_arc_unlocked`、`debt_c1_infiltrate`、`debt_c1_retreat` | `debt_mother_notice`、`debt_mother_attendance`、`debt_21_47_witness`、`debt_21_47_partial` |
| N | `nolan_arc_unlocked`、`nolan_confronted`、`nolan_circumspect`、`nolan_sympathized` | `nolan_soron_identity` |
| F | `fnale_arc_unlocked`、`fnale_helped`、`fnale_reported`、`fnale_neutral` | `fnale_pause` |

互斥轨道：`debt_c1_infiltrate/retreat`、`debt_21_47_witness/partial`、`nolan_confronted/circumspect/sympathized`、`fnale_helped/reported/neutral`——均同帧先写者胜出，无合并枚举。

### 2.5 双语对白

- 新增 dialogueTree 键（中英成对，dialogueTree_en key 集合与 dialogueTree 完全一致）：
  - D 线 13 键：`debt_d1_show / debt_d2_intro / debt_d2_c1_infiltrate / debt_d2_c1_retreat / debt_d3_branch_a / debt_d3_branch_b / debt_d3_link_witness / debt_d3_link_partial / debt_d3_end / debt_d4_show / debt_arc_review_witness / debt_arc_review_partial / debt_arc_review_ongoing`
  - N 线 22 键：`nolan1_arc_intro / nolan1_arc_after / nolan1_arc_system / nolan2_arc_show / nolan_arc_gate_locked / nolan3_arc_intro / nolan3_arc_morrow_diff / nolan3_confronted_reply / nolan3_circumspect_reply / nolan3_sympathized_reply / nolan3_confronted_after / nolan3_circumspect_after / nolan3_sympathized_after / nolan3_arc_end / nolan4_arc_open / nolan4_arc_close / nolan4_confronted_note / nolan4_sympathized_note / nolan4_circumspect_note / nolan4_confronted_shot / nolan4_sympathized_shot / nolan4_circumspect_shot`
  - F 线 15 键：`fnale1_arc_show / fnale2_arc_show / fnale2_arc_clue / fnale3_arc_intro / fnale3_helped_reply / fnale3_reported_reply / fnale3_neutral_reply / fnale3_helped_after / fnale3_reported_after / fnale3_neutral_after / fnale4_arc_open / fnale4_helped / fnale4_reported / fnale4_neutral / fnale4_arc_close`

---

## 3. 锚点计数与契约口径（重要）

### 3.1 检索锚点 vs 运行期锚点（契约 1.2 硬约束 1）

- 文档地图检索锚点 **仅作定位用，不作为状态 id 落码**。实测（2026-10-20，story_config.js 全文件 grep）：

| 检索锚点 | count | 命中位置 | 说明 |
|---|---|---|---|
| `ioidebt` | 0 | — | D 线检索锚点，未落码 ✅ |
| `debt_slave` | 0 | — | D 线检索锚点，未落码 ✅ |
| `fynne_` | 1 | L462 注释 | 仅注释说明，未落码 ✅ |
| `e_ch_index` | 1 | L476 注释 | 仅注释说明，未落码 ✅ |
| `aech` | 0 | — | E 线锚点，与本批无关 ✅ |
| `alley` | 0 | — | E 线锚点（批次 3） ✅ |

- **实际落码锚点是契约定稿命名**：D→`debt_*`、N→`nolan_arc_*`/`nolan_*`、F→`fnale_*`。

### 3.2 运行期锚点计数表（全部 ≥2，无重复命名）

```
debt_arc_gate=9  debt_arc_unlocked=5  debt_21_47_witness=9  debt_21_47_partial=6
debt_mother_notice=3  debt_mother_attendance=3  debt_c1_infiltrate=2  debt_c1_retreat=2
nolan_arc_gate=7  nolan_arc_unlocked=9  nolan_confronted=6  nolan_circumspect=6  nolan_sympathized=6  nolan_soron_identity=8
fnale_gate=3  fnale_arc_unlocked=5  fnale_helped=10  fnale_reported=4  fnale_neutral=4  fnale_pause=8
```

### 3.3 四协议 requirements 零泄漏（2026-10-20 实测快照）

三协议 requirements 中**仅出现既有闸门**，20 个批次 2 运行期标识**零出现**：

```json
inherit={"mode":"all","rules":[{"noneOf":["buyoutBinding"],"gap":"缺口：第三钥优先受让合同仍然有效；必须先履行或解除它，才能选择个人继承。","gap_en":"..."}]}
public_energy={"mode":"all","rules":[{"allOf":["realm_garden","home_mother_log"],"gap":"..."},{"noneOf":["buyoutBinding"],"gap":"..."}]}
charter={"mode":"all","rules":[{"allOf":["allAlmanac"],"gap":"..."},{"allOf":["art3misOnline"],"gap":"..."},{"noneOf":["buyoutBinding"],"gap":"..."}]}
derivedCheck=allAlmanac-present,art3misOnline-present
```

- ⚠ `buyoutBinding` 是 **flag**（被三协议 `noneOf` 引用），**不是** `endings` 顶层属性，也不是 clue——校验与讨论时勿再按顶层属性找。

---

## 4. 本批修复项记录（哪些地方踩过坑、已如何修复）

| # | 现象 | 根因 | 修复 | 状态 |
|---|---|---|---|---|
| 1 | `verify_f_line.js` TypeError（`r.discoverClues` undefined） | `collect()` 返回对象中 discoverClue 的 key 是 **`discClues`**，不是 `discoverClues` | 改用 `r.discClues.has(...)` | ✅ 已修 |
| 2 | `verify_f_extra.js` 报 `fnale3_helped_after` 中英各 got 2, expect 3 | 剧本 6.4b F3 helped 分支收尾 3 行（重复句「……第三栏，空了。」L1593 +（合上登记表）「交班记录，我来签。」L1597 +【系统】回看已收纳 L1601），落码漏了第①行 | 中英各前置补第①行（中文 `'【弗娜莱】（停顿）「……第三栏，空了。」'` / 英文 `'[F'Nale] (pause) "...Box three is empty."'`）；**期望值 3 是对的，不改期望** | ✅ 已修 |
| 3 | `verify_n_line.js` 报 4 个 `fnale_*` flag "undeclared @ palace_contract.entryEvents" | F4 块挂入 `palace_contract.entryEvents`（N4 之后），N 线脚本 `checkRefs` 整体收集 entryEvents 内所有 ifFlags | `existingFlags` 追加 `'fnale_arc_unlocked','fnale_helped','fnale_reported','fnale_neutral'`（L24） | ✅ 已修 |
| 4 | `verify_batch2_l1.js` 白名单断言形同虚设 | `scanCollect()` 原地收集不返回值，`assertWhitelist(scanCollect(...)||new Set(),...)` 恒为空集 | 新增 `collectRoot(list,label)` 返回 Set；白名单断言改用它 | ✅ 已修 |
| 5 | `verify_batch2_l1.js` 报 `buyoutBinding missing` | 误以为 buyoutBinding 是 `endings` 顶层属性（`cfg.endings.buyoutBinding` 不存在） | 断言改为三协议 requirements 文本均含 `'buyoutBinding'`（闸门引用保留） | ✅ 已修 |
| 6 | lightsandbox python 起不了 `http.server` | `ModuleNotFoundError: No module named 'html.entities'`（python 3.13.13 stdlib 不完整） | 改用 Node 零依赖静态服务器 `serve_oasis.js`（端口 8123） | ✅ 已绕行 |
| 7 | Node 静态服务器返回 HTTP 403 | `serve_oasis.js` 中 `path.normalize(path.join(root,...))` 产出 `C:\...`（反斜杠），与 root 字符串 `C:/...`（正斜杠）`startsWith` 直比误判越界 | **未修复**（见第 6 节） | ⏸ 待修 |

---

## 5. 校验脚本与结果（全部当前实测通过）

脚本位于当前工作目录 `C:\Users\EasonG\.qianfan\workspace\sessions\1a76703335e74fd0b11709d905be8bb9\2026-10-17\new-chat\`，用法统一：`node <script> <story_config.js 绝对路径>`。

| 脚本 | 校验内容 | 运行结果（2026-10-20 实测） |
|---|---|---|
| `verify_d_line.js` | D 线对白中英成对/行数、21:47 保留、clue usedBy、热区引用闭环、坐标不重叠、四协议结构 | `ALL_D_ARC_CHECKS_PASSED`（exit=0） |
| `verify_f_line.js` | F 线对白成对/行数、clue usedBy、fnale_gate 事件引用闭环、F3 恰 1 个 choice、F4 只读、F3→D3 联动、四协议零泄漏 | `ALL_F_ARC_CHECKS_PASSED`（exit=0） |
| `verify_f_extra.js` | F 线对白定义唯一性、clue usedBy 精确指向、F3 三选项互斥、剧本口核对白行数（含 fnale3_helped_after=3） | `F_EXTRA_CHECKS_PASSED`（exit=0） |
| `verify_n_line.js` | N 线对白成对/行数、clue usedBy、N1-N4 各挂点引用闭环与互斥写档、四协议结构 | `ALL_N_ARC_CHECKS_PASSED`（exit=0） |
| `verify_batch2_l1.js` | 第 1 层：D/N/F 全部事件序列类型白名单 + 20 个运行期标识零泄漏进三协议 requirements + buyoutBinding 闸门保留 + requirements 快照 | `L1_WHITELIST_AND_LEAK_CHECKS_PASSED`（exit=0） |

五份脚本 `node --check` 全部 SYNTAX OK。

---

## 6. 当前暂停点与未完成项

用户于 2026-10-19 落码收尾后喊「停一停先」，回归验收在第 3 层入口处暂停，**等待后续指示**。未完成项：

1. **`serve_oasis.js` 403 bug 未修**（异常 7）：根因为 Windows 路径形式不一致（`C:/` vs `C:\`）导致 `startsWith` 越界误判。
   - 建议修法：改为 `path.relative(root, filePath).startsWith('..')` 判定，或 `path.resolve` + 统一分隔符 + 小写后再比较。
   - 当前状态（2026-10-20 实测）：端口 8123 **无监听**，无 node 进程——服务器已停，待修后重启。
2. **浏览器 CLI 未升级**：`dumate-browser-cli --version` 仍为 **0.2.12**，`dumate-browser-use` skill 要求 ≥**0.2.13**。
   - 升级命令：PowerShell 执行 `iwr https://dumate-app-public.bj.bcebos.com/release-info/support/dumate-runtime-binaries/dependencies/browser-use/dumate-browser-cli/scripts/0.2.13/install.ps1 | iex`
3. **第 3 层动态冒烟 5 步未执行**：启动无报错 → 按契约路径触发三线核对 flag/clue 互斥 → 存档读档 → 中英切换 → 结局 reviews + 四布尔断言。
   - 关键方法（沿用批次 1 报告）：触发前 `driveUntil` 等待入场对白结束且 `status==='running'`；四布尔断言以「未触发本批内容存档，inherit / public_energy / charter / buyoutBinding 与改动前完全一致」为底线。
4. **批次 2 验收报告未写**：按《AI交接README》7.3 + 批次 1 报告模板，产出 `THE-OASIS-批次2交付验收报告-DNF线-20261019.md`（或按实际日期命名，todo 中约定为 20261019，可沿用该命名）。

---

## 7. 下一步（接手 agent 建议顺序）

1. 修复 `serve_oasis.js` 403 bug（`path.relative` 判定），启动后 `curl http://127.0.0.1:8123/index.html` 验证 200。
2. 升级 `dumate-browser-cli` 至 0.2.13，验证 `--version`。
3. 按《回归测试清单》第 3 节执行动态冒烟 5 步 + 四布尔断言（批次 2 触发路径见第 4.2 节：D→pumping_station `debt_arc_gate`、N→index_gate/library_gate/maze_exit、F→pumping_station `fnale_gate`）。
4. 全部通过后更新 todo、撰写批次 2 验收报告（第 6 节第 4 项）。

---

## 8. 参考文档索引（当前工作目录）

- 《THE-OASIS-AI交接README-20261017.md》— 执行手册（红线、白名单、验收模板）
- 《THE-OASIS-回归测试清单-20261018.md》— 本批验收规格（第 1/2/3 层）
- 《THE-OASIS-D线数据契约-20261018.md》/ 《THE-OASIS-N线数据契约-20261018.md》/ 《THE-OASIS-F线数据契约-20261018.md》— 落码唯一依据
- 《THE-OASIS-批次1交付验收报告-KM线-20261018.md》— 验收报告模板与动态冒烟方法基线
- 剧本：《THE-OASIS-完整游戏剧本-20261005.md》（D 6.2/6.2b、N 6.3/6.3b、F 6.4/6.4b）

---

*本文件由 DuMate 于 2026-10-20 生成，内容基于工作目录文档与对游戏工程的实测取证（锚点 grep、校验脚本运行、mtime 核对、端口与 CLI 版本确认）。*