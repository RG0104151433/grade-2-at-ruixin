#!/usr/bin/env python3
"""题解目录自检工具。

用法（在仓库根目录）：
    python 算法/tools/check.py            # 语法校验 + 编码/命名检查
    python 算法/tools/check.py --quiet    # 只打印问题

检查内容：
1. 每个 .cpp 能否通过 g++ -fsyntax-only（用 tools/oj.h 补头文件）；
2. 每个 .cpp/.md 是否合法 UTF-8（防 GB18030 混入导致乱码）；
3. 文件名是否含空格或全角标点（约定禁止）；
4. 每个题目目录下是否有同号档案 NNNN.md。

这个工具只做"体检"，不修改任何文件。
"""

from __future__ import annotations

import argparse
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]          # 算法/
REPO = ROOT.parent
OJ_H = ROOT / "tools" / "oj.h"

BAD_NAME = re.compile(r"[ \u3000（）【】「」：，、！？]")
CJK = re.compile(r"[\u4e00-\u9fff]")


def iter_sources() -> list[pathlib.Path]:
    return sorted((ROOT / "题目").rglob("*.cpp"))


def compile_ok(p: pathlib.Path) -> tuple[bool, str]:
    cmd = ["g++", "-std=c++20", "-fsyntax-only", "-include", str(OJ_H), str(p)]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode == 0:
        return True, ""
    errs = [line for line in r.stderr.splitlines() if " error" in line]
    return False, errs[0] if errs else r.stderr.splitlines()[0]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    problems = 0
    problems += check_compile(args.quiet)
    problems += check_encoding(args.quiet)
    problems += check_names(args.quiet)
    problems += check_dossiers(args.quiet)

    if problems:
        print(f"\n共 {problems} 处问题。")
        return 1
    print("\n全部通过。")
    return 0


def check_compile(quiet: bool) -> int:
    bad = 0
    srcs = iter_sources()
    for p in srcs:
        ok, msg = compile_ok(p)
        if not ok:
            bad += 1
            print(f"[编译] {p.relative_to(REPO)}\n        {msg}")
        elif not quiet:
            print(f"[编译] OK   {p.relative_to(REPO)}")
    print(f"\n编译自检：{len(srcs) - bad}/{len(srcs)} 通过")
    return bad


def check_encoding(quiet: bool) -> int:
    bad = 0
    for p in sorted(ROOT.rglob("*")):
        if p.is_file() and p.suffix in (".cpp", ".md", ".h", ".py"):
            try:
                txt = p.read_bytes().decode("utf-8")
            except UnicodeDecodeError as e:
                bad += 1
                print(f"[编码] 非 UTF-8：{p.relative_to(REPO)}（{e}）")
                continue
            # UTF-8 下仍可能是乱码（GB18030 被误当 UTF-8 存过），用汉字信号粗略兜底
            if "\ufffd" in txt:
                bad += 1
                print(f"[编码] 含替换字符 U+FFFD：{p.relative_to(REPO)}")
    if not quiet:
        print(f"[编码] UTF-8 检查完成")
    return bad


def check_names(quiet: bool) -> int:
    bad = 0
    for p in sorted((ROOT / "题目").rglob("*")):
        if p.is_file():
            name = p.name
            if BAD_NAME.search(name):
                bad += 1
                print(f"[命名] 含空格/全角标点：{p.relative_to(REPO)}")
            elif p.suffix not in (".cpp", ".md"):
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
        if not m:
            bad += 1
            print(f"[档案] 目录名不是 NNNN-标题：{d.name}")
            continue
        if not (d / f"{m.group(1)}.md").exists():
            bad += 1
            print(f"[档案] 缺少 {m.group(1)}.md：{d.relative_to(REPO)}")
    if not quiet:
        print("[档案] 检查完成")
    return bad


if __name__ == "__main__":
    sys.exit(main())
