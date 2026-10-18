# 算法认知的隐性启发 · Algo Implicit Heuristics

> 一个与平台无关的 Agent Skill：用并行案例和参数微调设计算法题讲解，让"这题该想什么"自己长出来；用行为信号诊断学习者卡在哪一层。

**状态：alpha（v0.1.0）**。设计与文档已可实际使用；模块库、评测与英文版仍在建设中，见 [docs/roadmap.md](docs/roadmap.md)。

---

## 它解决什么问题

- 题解看完就忘，换个题面又不会——记住的是步骤，没有形成可迁移的判断。
- "看懂了"和"做得出来"之间有落差，但说不清差在哪。
- 通用讲解要么假定你什么都会，要么从最基础讲起，两边都不合适。

这个 Skill 不写题解，它规定**讲解怎么组织**，以及**Agent 怎么在不打断阅读的前提下判断你的起点**。

## 它不做什么

- 不替代题解：不负责给出可提交的代码、不调试、不推导复杂度。这类请求明确不适用。
- 不承诺提分：隐性启发的可触发性是概率性的，诊断层的判断也是概率性的。文档里写明了这一点，不做夸大。
- 不是题库或模板集：模块 A、B 是方法实例，不是知识点的目录。

## 三层结构

| 层 | 位置 | 作用 |
|---|---|---|
| 教学层 | 第 1–6 章 | 并行案例制造张力、参数微调暴露边界、词汇重复沉淀本质；五段式模板 |
| 诊断层 | 第 7 章 | 区分前置缺失与校准误差；每个信号按正/负/无三态记录；A/B/C 三层加地板兜底 |
| 执行层 | 3.1、3.2、5.1、第 8 章 | 模块声明 schema、问题路由、可机器校验清单、七步使用流程 |

## 安装

Skill 是纯 Markdown 加一个 Python 脚本，不依赖特定模型、IDE 或插件。

- **WorkBuddy**：把 `skills/algo-implicit-heuristics/` 整个目录放进 `~/.workbuddy/skills/`。
- **其他支持 SKILL.md 的 Agent**：放进对应的 skills 目录，保持目录名与 `name` 字段一致。
- **没有 skills 机制**：把 `SKILL.md` 的内容作为系统提示的一部分，效果相同。

## 快速开始

对你的 Agent 说：

```
用隐性启发讲讲这道题：<题目描述>
```

或者更具体：

```
这道题我看过题解，但换个题面就不会。帮我建立判断。
```

Skill 会先做问题路由（命中模块 / 现场声明新模块 / 不适用），再按层级选择讲法。若只需要代码，直接说"给我代码"，它会跳过这套流程。

## 质量保障

`scripts/check_lesson.py` 实现了 5.1 清单中可机器判定的部分：

```bash
python skills/algo-implicit-heuristics/scripts/check_lesson.py lesson.txt \
  --terms "连续段" --verbs "留下" --entity "[1, 1, 2]"
```

检查评价型元问题、诊断宣告、自我评估请求、检查框架句是否零命中，术语首现是否晚于案例，核心动词的渗透次数与段落分布，回扣段是否复现实体。退出码 0 表示通过。

边界要写清楚：**通过清单不保证讲解有效**（可触发性是概率性的），但未通过的一定违反了设计约束。清单是下限，不是上限。

## 诚实声明

- 文档引用的三处研究（自我报告不可靠、Veenman 元认知线索法、Capture-Calibrate-Coach）只用于**背书概念来源**，不构成对本 Skill 设计有效性的实证支持。出处见 SKILL.md 附录。
- 这套机制尚未做过对照实验。仓库下一步的重点之一就是补上小样本证据（见 roadmap 的 Phase 3）。
- 如果你的使用体验与文档描述不符，欢迎开 issue 贴出原始对话——失败案例比成功案例更有价值。

## 仓库结构

```
skills/algo-implicit-heuristics/
  SKILL.md                 # 技能正文（唯一权威来源）
  scripts/check_lesson.py  # 5.1 清单的可执行子集
docs/
  design.md                # 设计原理、取舍与已知局限
  roadmap.md               # 从 alpha 到可发布版本的路线
examples/
  01-cycles.md             # 模块 A：状态映射与环
  02-adjacency-xor.md      # 邻接约束：把位运算条件翻译掉
tests/                     # 校验脚本的正例/反例测试
HANDOFF.md                 # 交接说明：资产位置、设计约束、未完成事项
```

## English

A platform-agnostic agent skill for learning algorithm problems (LeetCode-style). Instead of writing solutions, it prescribes **how explanations are structured** — parallel cases, parameter tweaks, naming after experience — and **how the agent infers the learner's starting level** from behavior rather than self-report. Modules A/B are examples of a reusable schema, not a fixed taxonomy. Includes a machine-checkable acceptance checklist for generated lessons. Content is currently Chinese; an English edition is on the roadmap.

## License

MIT. See [LICENSE](LICENSE).
