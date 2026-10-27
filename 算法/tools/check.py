#!/usr/bin/env python3
"""题解目录自检工具。

用法（在仓库根目录）：
    python 算法/tools/check.py            # 全量检查
    python 算法/tools/check.py --quiet    # 只打印问题

检查内容：
1. 每个 .cpp 能否通过语法检查：先用 C++23（补 tools/oj.h），失败再按 C17 试一次（补 tools/ojc.h）；
2. 每个 .cpp/.md 是否合法 UTF-8（防 GB18030 混入导致乱码）且不含控制字符；
3. 文件名是否含空格或全角标点、扩展名是否预期；
4. 每个题目目录是否有同号档案；
5. 档案 front-matter 的必填字段与枚举（难度/状态/错因/完整度），以及「## 1. 代码」表里引用的
   文件是否真实存在（防止出现“档案说有代码、目录里却没有”的空壳）。

三类"预期内的失败"不算错：
- `附录-*.cpp`：一个文件里写了多份实现的原件，按约定归档、不参与编译；
- 档案 front-matter 里 `状态: 待重做 / 未AC` 的题目：已知有错、等复习时重写，只提示不报错；
- 外部题解代码（`灵神-* / 官方-* / 题解-*`）与自有代码一样参与编译，不额外豁免。
"""

from __future__ import annotations

import argparse
import os
import pathlib
import re
import subprocess
import sys
from concurrent import futures

ROOT = pathlib.Path(__file__).resolve().parents[1]          # 算法/
REPO = ROOT.parent
OJ_H = ROOT / "tools" / "oj.h"
OJC_H = ROOT / "tools" / "ojc.h"

BAD_NAME = re.compile(r"[ \u3000（）【】「」：，、！？]")
STATE = re.compile(r"^状态:\s*(\S+)", re.M)

REQUIRED = ["题号", "标题", "难度", "通过率", "来源", "首次", "专题", "状态", "错因", "下次复习", "完整度"]
STATES = {"独立AC", "提示后AC", "看题解后AC", "未AC", "待复核", "待重做"}
CAUSES = {"读题错", "边界漏", "复杂度没达标", "数据结构选错", "证明不出", "模板忘", "实现bug", "看题解太快"}
DIFFS = {"简单", "中等", "困难", "—"}
LEVELS = {"完整", "简版", "待补"}

KNOWN_FAILS = [0]      # 已登记待修的数量（不阻塞）


def iter_sources() -> list[pathlib.Path]:
    return sorted((ROOT / "题目").rglob("*.cpp"))


def compile_cpp(p: pathlib.Path) -> tuple[str, str]:
    r = subprocess.run(["g++", "-std=c++23", "-fsyntax-only", "-include", str(OJ_H), str(p)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode == 0:
        return "OK", ""
    errs = [l for l in r.stderr.splitlines() if " error" in l]
    return "FAIL", errs[0] if errs else ""


def compile_c(p: pathlib.Path) -> tuple[str, str]:
    r = subprocess.run(["gcc", "-x", "c", "-std=c17", "-fsyntax-only", "-include", str(OJC_H), str(p)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode == 0:
        return "OK", ""
    errs = [l for l in r.stderr.splitlines() if " error" in l]
    return "FAIL", errs[0] if errs else ""


def dossier_state(d: pathlib.Path) -> str:
    for f in d.glob("*.md"):
        m = STATE.search(f.read_text(encoding="utf-8", errors="replace"))
        if m:
            return m.group(1)
    return ""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    problems = 0
    problems += check_compile(args.quiet)
    problems += check_encoding(args.quiet)
    problems += check_names(args.quiet)
    problems += check_dossiers(args.quiet)
    problems += check_frontmatter(args.quiet)

    if problems:
        print(f"\n共 {problems} 处问题。")
        return 1
    note = f"（{KNOWN_FAILS[0]} 个已登记待修不阻塞）" if KNOWN_FAILS[0] else ""
    print(f"\n全部通过{note}。")
    return 0


def check_compile(quiet: bool) -> int:
    srcs = [p for p in iter_sources() if not p.name.startswith("附录-")]
    skipped = [p for p in iter_sources() if p.name.startswith("附录-")]
    workers = max(2, min(6, (os.cpu_count() or 4)))

    def one(p: pathlib.Path):
        status, msg = compile_cpp(p)
        if status == "OK":
            return p, "CPP", ""
        cstatus, cmsg = compile_c(p)
        if cstatus == "OK":
            return p, "C", ""
        if not msg:
            status, msg = compile_cpp(p)          # 空 stderr 通常是并发过高被打断，串行重试一次
            if status == "OK":
                return p, "CPP", ""
        return p, "FAIL", msg

    with futures.ThreadPoolExecutor(max_workers=workers) as ex:
        results = list(ex.map(one, srcs))

    bad = 0
    known = 0
    n_c = 0
    for p, status, msg in results:
        if status == "C":
            n_c += 1
            if not quiet:
                print(f"[编译] OK(C) {p.relative_to(REPO)}")
        elif status in ("OK", "CPP"):
            if not quiet:
                print(f"[编译] OK    {p.relative_to(REPO)}")
        else:
            st = dossier_state(p.parent)
            if st in ("待重做", "未AC"):
                known += 1
                print(f"[已登记] {p.relative_to(REPO)}  状态={st}：{msg}")
            else:
                bad += 1
                print(f"[编译] {p.relative_to(REPO)}\n        {msg}")
    KNOWN_FAILS[0] = known
    print(f"\n编译自检：{len(srcs) - bad - known}/{len(srcs)} 通过"
          f"（其中 C 风格 {n_c} 个、已登记待修 {known} 个；归档原件 {len(skipped)} 个未参与）")
    return bad


def check_encoding(quiet: bool) -> int:
    bad = 0
    for p in sorted(ROOT.rglob("*")):
        if p.is_file() and p.suffix.lower() in (".cpp", ".md", ".h", ".py", ".c"):
            try:
                txt = p.read_bytes().decode("utf-8")
            except UnicodeDecodeError as e:
                bad += 1
                print(f"[编码] 非 UTF-8：{p.relative_to(REPO)}（{e}）")
                continue
            if "\ufffd" in txt:
                bad += 1
                print(f"[编码] 含替换字符 U+FFFD：{p.relative_to(REPO)}")
            ctl = [ch for ch in txt if ord(ch) < 32 and ch not in "\n\t\r"]
            if ctl:
                bad += 1
                print(f"[编码] 含控制字符 {len(ctl)} 个：{p.relative_to(REPO)}")
    if not quiet:
        print("[编码] UTF-8 / 控制字符检查完成")
    return bad


def check_names(quiet: bool) -> int:
    bad = 0
    for p in sorted((ROOT / "题目").rglob("*")):
        if p.is_file():
            if BAD_NAME.search(p.name):
                bad += 1
                print(f"[命名] 含空格/全角标点：{p.relative_to(REPO)}")
            elif p.suffix.lower() not in (".cpp", ".md", ".png", ".jpg", ".jpeg", ".webp"):
                bad += 1
                print(f"[命名] 非预期扩展名：{p.relative_to(REPO)}")
    if not quiet:
        print("[命名] 检查完成")
    return bad


def check_dossiers(quiet: bool) -> int:
    bad = 0
    for d in sorted((ROOT / "题目").iterdir()):
        if not d.is_dir():
            continue
        m = re.match(r"^(\d{4})-", d.name)
        if m:
            if not (d / f"{m.group(1)}.md").exists():
                bad += 1
                print(f"[档案] 缺少 {m.group(1)}.md：{d.relative_to(REPO)}")
        elif d.name.startswith("洛谷-"):
            if not (d / f"{d.name}.md").exists():
                bad += 1
                print(f"[档案] 缺少 {d.name}.md：{d.relative_to(REPO)}")
        else:
            bad += 1
            print(f"[档案] 目录名不是 NNNN-标题：{d.name}")
    if not quiet:
        print("[档案] 目录/同名档案检查完成")
    return bad


def check_frontmatter(quiet: bool) -> int:
    """校验 front-matter 字段与枚举，并确认「## 1. 代码」引用的文件真实存在。"""
    bad = 0
    for d in sorted((ROOT / "题目").iterdir()):
        if not d.is_dir():
            continue
        md = sorted(d.glob("*.md"))
        if not md:
            continue
        main_md = md[0]
        txt = main_md.read_text(encoding="utf-8", errors="replace")
        rel = main_md.relative_to(REPO)
        m = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n", txt, re.S)
        if not m:
            bad += 1
            print(f"[档案] 缺少 front-matter：{rel}")
            continue
        meta = {}
        for line in m.group(1).split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        missing = [k for k in REQUIRED if k not in meta]
        if missing:
            bad += 1
            print(f"[档案] front-matter 缺字段 {missing}：{rel}")
        if meta.get("难度") and meta["难度"] not in DIFFS:
            bad += 1
            print(f"[档案] 难度取值非法（{meta['难度']}）：{rel}")
        if meta.get("状态") and meta["状态"] not in STATES:
            bad += 1
            print(f"[档案] 状态取值非法（{meta['状态']}）：{rel}")
        for c in re.split(r"[,，]", meta.get("错因", "").strip("[]")):
            c = c.strip()
            if c and c not in CAUSES:
                bad += 1
                print(f"[档案] 错因标签非法（{c}）：{rel}")
        if meta.get("完整度") and meta["完整度"] not in LEVELS:
            bad += 1
            print(f"[档案] 完整度取值非法（{meta['完整度']}）：{rel}")

        # 代码表只校验「文件」列（第一列）；「原文件名」列记录的是迁移前的名字，本来就不存在
        if "## 1. 代码" in txt:
            seg = txt.split("## 1. 代码", 1)[1].split("\n## ", 1)[0]
            refs = []
            for line in seg.split("\n"):
                if not line.strip().startswith("|"):
                    continue
                cells = line.split("|")
                if len(cells) < 2:
                    continue
                for name in re.findall(r"`([^`]+)`", cells[1]):
                    if "." in name:
                        refs.append(name)
            if not refs:
                bad += 1
                print(f"[档案] 「## 1. 代码」表为空：{rel}")
            for name in refs:
                if not (d / name).exists():
                    bad += 1
                    print(f"[档案] 代码表引用了不存在的文件 `{name}`：{rel}")
        elif meta.get("完整度") == "待补":
            if not any(x.suffix.lower() in (".cpp", ".jpeg", ".jpg", ".png") for x in d.iterdir()):
                bad += 1
                print(f"[档案] 标为待补但目录里没有任何代码/截图：{rel}")
    if not quiet:
        print("[档案] front-matter / 代码表检查完成")
    return bad


if __name__ == "__main__":
    sys.exit(main())
