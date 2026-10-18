#!/usr/bin/env python3
"""5.1 验收清单校验器：实现可机器判定的检查项。

用法:
  python check_lesson.py lesson.txt --terms "环,置换,闭合" --verbs "该去" \
      --entity "[3, 1, 2]" --naming-term 环

lesson.txt 为讲解正文，段落之间用空行分隔（也接受每个非空行即一段）。
输出 Markdown 报告；全部通过退出码 0，存在 FAIL 退出码 1。

检查范围（对应 SKILL.md 5.1）:
  1-4 句式类：评价型元问题 / 诊断宣告 / 自我评估请求 / 检查框架句
  5-6 术语与定义句式首现位置（不得出现在第一段，且不得早于命名段）
  7   并置案例单参数差异：需人工核对，脚本仅列出案例行
  8   核心动词在命名段之前的出现次数与段落分布
  9   回扣段复现第一段实体 + 术语
"""

import argparse
import re
import sys

PATTERNS = [
    ("1 评价型元问题", r"你理解|你觉得|你确定|你熟悉|懂了吗|明白了吗|会了吗|对吗\s*[?？]|是不是很简单|Do you understand|Got it|Are you sure"),
    ("2 诊断宣告", r"你可能缺少|你的基础|你还没掌握|建议你先学|你需要先补"),
    ("3 自我评估请求", r"请告诉我你|说说你的理解|你掌握到什么程度|你学到哪了"),
    ("4 检查框架句", r"检查一下你|来测一下|试试看你能|考考你"),
]
DEF_PATTERNS = r"所谓|是指|的定义是"


def load_paragraphs(path):
    raw = open(path, encoding="utf-8").read()
    paras = [p.strip() for p in re.split(r"\n\s*\n", raw) if p.strip()]
    if len(paras) <= 1:  # 退化为“每个非空行一段”
        paras = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    return paras


def first_para(paras, needle):
    for i, p in enumerate(paras, 1):
        if needle in p:
            return i
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lesson")
    ap.add_argument("--terms", default="", help="模块核心术语，逗号分隔")
    ap.add_argument("--verbs", default="", help="模块核心动词，逗号分隔")
    ap.add_argument("--entity", default="", help="第一段的具体实体（如数组字面量）")
    ap.add_argument("--naming-term", default="", help="命名段的标志术语，缺省取第一个术语")
    args = ap.parse_args()

    paras = load_paragraphs(args.lesson)
    text = "\n".join(paras)
    terms = [t for t in args.terms.split(",") if t]
    verbs = [v for v in args.verbs.split(",") if v]
    naming_term = args.naming_term or (terms[0] if terms else "")
    naming = first_para(paras, naming_term) or len(paras)
    last = paras[-1]

    rows, failed = [], 0

    def record(name, ok, detail):
        nonlocal failed
        rows.append((name, "PASS" if ok else "FAIL", detail))
        if not ok:
            failed += 1

    for name, rx in PATTERNS:
        hits = re.findall(rx, text)
        record(name, not hits, f"{len(hits)} 命中" + (f"：{hits[:5]}" if hits else ""))

    term_report = []
    for t in terms:
        pos = first_para(paras, t)
        if pos is None:
            term_report.append(f"{t}=未出现")
            continue
        term_report.append(f"{t}=第{pos}段")
        record(f"5 术语首现晚于过程（{t}）", pos > 1, f"首现第{pos}段，命名段第{naming}段")

    early_defs = [n for n, p in enumerate(paras, 1) if n < naming and re.search(DEF_PATTERNS, p)]
    record("6 定义句式前置禁用", not early_defs, f"提前出现段落：{early_defs or '无'}")

    for v in verbs:
        pre = [(n, paras[n - 1].count(v)) for n in range(1, min(naming, len(paras) + 1)) if v in paras[n - 1]]
        total = sum(c for _, c in pre)
        ok = total >= 2 and len(pre) >= 2
        record(f"8 核心动词渗透（{v}）", ok, f"命名前共 {total} 次，分布段落 {[n for n, _ in pre]}")

    if args.entity:
        record("9 回扣复现实体", args.entity in last, f"末段含 {args.entity}: {args.entity in last}")
    record("9 回扣复用术语", any(t in last for t in terms) if terms else True,
           f"末段命中术语：{[t for t in terms if t in last]}")

    print(f"# 5.1 验收报告\n\n- 文件：`{args.lesson}`\n- 段落数：{len(paras)}；命名段：第 {naming} 段\n")
    print("| 检查项 | 结果 | 详情 |\n|---|---|---|")
    for name, status, detail in rows:
        print(f"| {name} | {status} | {detail} |")
    print("\n> 第 7 项（并置案例单参数差异）、层级配置与运行模式需人工核对，脚本不覆盖。")
    if term_report:
        print(f"\n术语首现：{'；'.join(term_report)}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
