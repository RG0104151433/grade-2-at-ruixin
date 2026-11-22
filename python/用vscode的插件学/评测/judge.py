"""标准库实现的本地评测器：py -3 路径/judge.py 10。"""

import argparse
import json
import math
from pathlib import Path
import subprocess
import sys


PROBLEMS = Path(__file__).resolve().parent / "题库"


def outputs_match(actual, expected, comparison):
    if comparison == "tokens":
        return actual.split() == expected.split()
    return actual.replace("\r\n", "\n") == expected.replace("\r\n", "\n")


def run_case(solution, input_text, expected, timeout, comparison="tokens"):
    """每个测试点都启动新进程，不改动学生源码。"""
    stdin = input_text.encode("utf-8")
    try:
        result = subprocess.run(
            [sys.executable, "-X", "utf8", str(solution.resolve())],
            input=stdin,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=solution.parent,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return {"status": "TLE", "detail": f"超过 {timeout:g} 秒"}
    stdout = result.stdout.decode("utf-8", errors="replace")
    stderr = result.stderr.decode("utf-8", errors="replace")
    if result.returncode != 0:
        return {"status": "RE", "detail": stderr[-1000:] or f"退出码 {result.returncode}"}
    if not outputs_match(stdout, expected, comparison):
        return {
            "status": "WA",
            "detail": f"预期：{expected[:300]!r}\n实际：{stdout[:300]!r}",
        }
    return {"status": "AC", "detail": ""}


def load_problem(problem_id):
    if not problem_id.isascii() or not problem_id.isdigit():
        raise ValueError("题号应为数字，例如 10")
    manifest = PROBLEMS / f"{int(problem_id)}.json"
    data = json.loads(manifest.read_text(encoding="utf-8-sig"))
    if data.get("comparison") not in ("tokens", "exact"):
        raise ValueError("comparison 应为 tokens 或 exact")
    timeout = float(data["timeout_seconds"])
    if not math.isfinite(timeout) or timeout <= 0:
        raise ValueError("每个测试点的时间限制必须大于 0")
    if not isinstance(data.get("cases"), list) or not data["cases"]:
        raise ValueError("测试点列表不能为空")
    solution = (manifest.parent / data["solution"]).resolve()
    cases = []
    for entry in data["cases"]:
        if not all(isinstance(entry[key], str) for key in ("name", "input", "expected")):
            raise ValueError("测试点的 name、input、expected 必须是字符串")
        cases.append((entry["name"], entry["input"], entry["expected"]))
    return data, solution, cases, timeout


def find_problem_for_file(current_file):
    current_file = current_file.resolve()
    if not current_file.is_file():
        raise ValueError("当前文件不存在或已移动，请从教学路线图重新打开题目并保存")
    matches = []
    for manifest in PROBLEMS.glob("*.json"):
        data = json.loads(manifest.read_text(encoding="utf-8-sig"))
        solution = (manifest.parent / data["solution"]).resolve()
        if solution == current_file:
            matches.append(manifest.stem)
    if not matches:
        raise ValueError("当前文件尚未接入评测。请打开已接入的题目文件，可用 --list 查看题号")
    if len(matches) != 1:
        raise ValueError("当前文件对应多个题号，请检查题库配置")
    return matches[0]


def main(argv=None):
    parser = argparse.ArgumentParser(description="Python 练习本地评测器")
    parser.add_argument("problem", nargs="?", help="题号，例如 10")
    parser.add_argument("--list", action="store_true", help="列出已接入的题目")
    parser.add_argument("--solution", type=Path, help="评测指定的代码文件，默认使用题目原文件")
    parser.add_argument("--file", type=Path, help="根据当前作答文件自动识别题号（VS Code 使用）")
    args = parser.parse_args(argv)
    try:
        if args.file is not None and (args.problem is not None or args.solution is not None or args.list):
            raise ValueError("--file 不能与题号、--solution 或 --list 同时使用")
        if args.list:
            for manifest in sorted(PROBLEMS.glob("*.json"), key=lambda item: int(item.stem)):
                data = json.loads(manifest.read_text(encoding="utf-8-sig"))
                print(f"{manifest.stem}: {data['title']}")
            return 0
        problem_id = find_problem_for_file(args.file) if args.file is not None else args.problem
        if problem_id is None:
            parser.print_help()
            return 2
        data, solution, cases, timeout = load_problem(problem_id)
        if args.solution is not None:
            solution = args.solution.resolve()
        if not solution.is_file():
            raise ValueError(f"找不到作答文件：{solution}")
        try:
            compile(solution.read_text(encoding="utf-8-sig"), str(solution), "exec")
        except SyntaxError as error:
            print(f"CE 语法错误：第 {error.lineno} 行，{error.msg}")
            return 1
        print(f"第 {int(problem_id)} 题：{data['title']}")
        print(f"作答文件：{solution}")
        passed = 0
        for name, input_text, expected in cases:
            result = run_case(solution, input_text, expected, timeout, data["comparison"])
            print(f"[{result['status']}] {name}")
            if result["status"] == "AC":
                passed += 1
            else:
                print(result["detail"])
        print(f"结果：{passed}/{len(cases)} 通过")
        return 0 if passed == len(cases) else 1
    except (OSError, UnicodeError, ValueError, KeyError, TypeError) as error:
        print(f"评测配置或运行环境错误：{error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    raise SystemExit(main())
