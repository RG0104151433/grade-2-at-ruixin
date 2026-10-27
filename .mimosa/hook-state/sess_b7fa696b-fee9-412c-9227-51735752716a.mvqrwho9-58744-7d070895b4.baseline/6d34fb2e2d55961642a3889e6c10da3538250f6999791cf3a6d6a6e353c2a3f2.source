"""把"一个文件里塞了多份实现"的题解拆成 v1/v2/...，并校验每段都能单独通过语法检查。

用法（在仓库根目录）：python 算法/tools/split_multi.py [--apply]
不带 --apply 时只打印计划。
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1] / "题目"
OJ = ROOT.parent / "tools" / "oj.h"
DEF = re.compile(r'^(class\s+\w+|struct\s+\w+|[A-Za-z_][\w:<>,\*&\s]*\**\w+\s*\([^;]*\)\s*\{?\s*$)')


def compiles(path: pathlib.Path) -> bool:
    return subprocess.run(["g++", "-std=c++23", "-fsyntax-only", "-include", str(OJ), str(path)],
                          capture_output=True).returncode == 0


def split_lines(lines):
    chunks, cur, pending, depth = [], [], [], 0
    for line in lines:
        if depth == 0 and line[:1] not in (" ", "\t", "}", "{", ")", ""):
            if line.startswith("#"):
                (cur if cur else pending).append(line)
                continue
            if DEF.match(line.strip()):
                if any(not c.strip().startswith("//") for c in cur):
                    chunks.append(cur)
                cur = pending + [line]
                pending = []
                depth += line.count("{") - line.count("}")
                continue
            if line.strip().startswith("//") or line.strip().startswith("/*"):
                pending.append(line)
                continue
        if depth == 0 and not cur and line.strip() and not line.strip().startswith("//"):
            pending.append(line)
            continue
        cur.append(line)
        depth += line.count("{") - line.count("}")
    if any(c.strip() for c in cur):
        chunks.append(cur)
    return [c for c in chunks if any(l.strip() and not l.strip().startswith("//") for l in c)]


def main(apply: bool) -> int:
    todo = []
    for d in sorted(ROOT.iterdir()):
        if not d.is_dir():
            continue
        for f in sorted(d.glob("v*-*.cpp")):
            if compiles(f):
                continue
            lines = f.read_text(encoding="utf-8").split("\n")
            chunks = split_lines(lines)
            if len(chunks) < 2:
                continue
            stem = f.stem.split("-", 1)[1]
            names = [f"v{i}-{stem}.cpp" for i in range(1, len(chunks) + 1)]
            todo.append((d, f, names, chunks))

    print(f"可拆分 {len(todo)} 个文件")
    for d, f, names, chunks in todo:
        print(f"  {d.name}/{f.name} -> {' / '.join(names)}")
    if not apply:
        return 0

    for d, f, names, chunks in todo:
        tmps = []
        for i, chunk in enumerate(chunks, 1):
            head = (f"// 说明：本文件由 `{f.name}` 拆出（该文件里写了 {len(chunks)} 份实现），"
                    f"这是第 {i} 份。\n\n")
            tmp = d / f".__split{i}.cpp"
            tmp.write_text(head + "\n".join(chunk).strip("\n") + "\n", encoding="utf-8")
            tmps.append(tmp)
        if all(compiles(p) for p in tmps):
            f.unlink()
            for tmp, name in zip(tmps, names):
                tmp.rename(d / name)
            print("拆好", d.name, "/", " / ".join(names))
        else:
            for p in tmps:
                p.unlink()
            print("拆开后仍编译不过，保留原文件：", d.name, "/", f.name)
    return 0


if __name__ == "__main__":
    sys.exit(main("--apply" in sys.argv))
