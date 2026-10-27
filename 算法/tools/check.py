#!/usr/bin/env python3
"""题解目录自检工具。

用法（在仓库根目录）：
    python 算法/tools/check.py            # 全量检查
    python 算法/tools/check.py --quiet    # 只打印问题

检查内容：
1. 每个 .cpp 能否通过语法检查：先用 C++23（补 tools/oj.h），失败再按 C17 试一次（补 tools/ojc.h）；
2. 每个 .cpp/.md 是否合法 UTF-8（防 GB18030 混入导致乱码）；
3. 文件名是否含空格或全角标点；
4. 每个题目目录下是否有同号档案。

两类"预期内的失败"不算错：
- `附录-*.cpp`：一个文件里写了多份实现的原件，按约定归档、不参与编译；
- 档案 front-matter 里 `状态: 待重做` 的题目：已知有错、等复习时重写，只提示不报错。
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


def iter_sources() -> list[pathlib.Path]:
    return sorted((ROOT / "题目").rglob("*.cpp"))


def compile_cpp(p: pathlib.Path) -> tuple[str, str]:
    r = subprocess.run(["g++", "-std=c++23", "-fsyntax-only", "-include", str(OJ_H), str(p)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode == 0:
        return "OK", ""
    errs = [l for l in r.stderr.splitlines() if " error" in l]
    return "FAIL", errs[0] if errs else (r.stderr.splitlines() or [""])
    

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

    if problems:
        print(f"\n共 {problems} 处问题。")
        return 1
    print("\n全部通过。")
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
            # 空 stderr 通常是并发过高被系统打断，串行重试一次
            status, msg = compile_cpp(p)
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
    if not quiet:
        print("[编码] UTF-8 检查完成")
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
        print("[档案] 检查完成")
    return bad


if __name__ == "__main__":
    sys.exit(main())
