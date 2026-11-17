"""评测器自检，不包含学生题目的解答。"""

from contextlib import redirect_stdout
from decimal import Decimal
from io import StringIO
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import judge


class JudgeTests(unittest.TestCase):
    def setUp(self):
        base = Path(__file__).resolve().parent
        self.temp = tempfile.TemporaryDirectory(dir=base, prefix="judge-check-")
        self.root = Path(self.temp.name).resolve()
        if self.root.parent != base:
            raise RuntimeError("自检临时目录超出预期范围")
        self.addCleanup(self.temp.cleanup)
        self.solution = self.root / "answer.py"
        self.input = "hello\n"
        self.expected = "hello\n"

    def run_source(self, source, timeout=2):
        self.solution.write_text(source, encoding="utf-8")
        return judge.run_case(self.solution, self.input, self.expected, timeout)

    def test_real_stdin_and_unicode(self):
        self.input = "你好，Python\n"
        self.expected = "你好，Python\n"
        self.assertEqual(self.run_source("print(input())\n")["status"], "AC")

    def test_wrong_answer(self):
        self.assertEqual(self.run_source("print('wrong')\n")["status"], "WA")

    def test_empty_solution(self):
        self.assertEqual(self.run_source("")["status"], "WA")

    def test_extra_prompt_is_wrong(self):
        self.assertEqual(self.run_source("print(input('Enter: '))\n")["status"], "WA")

    def test_runtime_error(self):
        self.assertEqual(self.run_source("raise ValueError('test')\n")["status"], "RE")

    def test_timeout(self):
        self.assertEqual(self.run_source("while True:\n    pass\n", timeout=0.2)["status"], "TLE")

    def test_whitespace_policy(self):
        self.assertTrue(judge.outputs_match("4  3\r\n", "4\n3\n", "tokens"))
        self.assertFalse(judge.outputs_match("4.0 3", "4 3", "tokens"))
        self.assertFalse(judge.outputs_match("4 3", "4\n3\n", "exact"))

    def test_cli_and_syntax_error(self):
        manifest = {
            "title": "评测器自检",
            "solution": "answer.py",
            "comparison": "tokens",
            "timeout_seconds": 2,
            "cases": [{"name": "echo", "input": self.input, "expected": self.expected}],
        }
        (self.root / "99.json").write_text(json.dumps(manifest), encoding="utf-8")
        self.solution.write_text("print(input())\n", encoding="utf-8")
        with patch.object(judge, "PROBLEMS", self.root), redirect_stdout(StringIO()):
            self.assertEqual(judge.main(["99"]), 0)
            self.solution.write_text("print(\n", encoding="utf-8")
            self.assertEqual(judge.main(["99"]), 1)

    def test_problem_10_test_data(self):
        data, solution, cases, timeout = judge.load_problem("10")
        self.assertTrue(solution.is_file())
        self.assertEqual(data["comparison"], "tokens")
        self.assertEqual(len(cases), 8)
        self.assertGreater(timeout, 0)
        for name, input_text, expected in cases:
            with self.subTest(case=name):
                n, k = [int(value) for value in input_text.split()]
                groups, remaining = [int(value) for value in expected.split()]
                self.assertTrue(0 <= n <= 1_000_000_000)
                self.assertTrue(1 <= k <= 1_000_000)
                self.assertGreaterEqual(groups, 0)
                self.assertTrue(0 <= remaining < k)
                self.assertEqual(groups * k + remaining, n)

    def test_current_file_detection(self):
        _, solution, _, _ = judge.load_problem("10")
        self.assertEqual(judge.find_problem_for_file(solution), "10")

    def test_unregistered_or_moved_file(self):
        self.solution.write_text("print('hello')\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "尚未接入"):
            judge.find_problem_for_file(self.solution)
        with self.assertRaisesRegex(ValueError, "不存在或已移动"):
            judge.find_problem_for_file(self.root / "missing.py")

    def test_cli_current_file_mode(self):
        manifest = {
            "title": "当前文件模式自检",
            "solution": "answer.py",
            "comparison": "tokens",
            "timeout_seconds": 2,
            "cases": [{"name": "echo", "input": self.input, "expected": self.expected}],
        }
        (self.root / "99.json").write_text(json.dumps(manifest), encoding="utf-8")
        self.solution.write_text("print(input())\n", encoding="utf-8")
        with patch.object(judge, "PROBLEMS", self.root), redirect_stdout(StringIO()):
            self.assertEqual(judge.main(["--file", str(self.solution)]), 0)

    def test_problem_11_expected_values_and_format(self):
        _, solution, cases, _ = judge.load_problem("11")
        self.assertTrue(solution.is_file())
        self.assertEqual(len(cases), 14)
        for name, input_text, expected in cases:
            with self.subTest(case=name):
                radius, height = [Decimal(value) for value in input_text.split()]
                volume = Decimal("3.14") * radius * radius * height
                self.assertEqual(expected.strip(), format(volume, ".2f"))
                self.assertTrue(Decimal(0) <= radius <= Decimal(100))
                self.assertTrue(Decimal(0) <= height <= Decimal(1000))

    def test_invalid_inline_test_data(self):
        manifest = {
            "title": "配置错误自检", "solution": "answer.py",
            "comparison": "tokens", "timeout_seconds": 2,
            "cases": [{"name": "invalid", "input": [1, 2], "expected": "3"}],
        }
        (self.root / "99.json").write_text(json.dumps(manifest), encoding="utf-8")
        with patch.object(judge, "PROBLEMS", self.root):
            with self.assertRaisesRegex(ValueError, "必须是字符串"):
                judge.load_problem("99")

    def test_problem_12_expected_values_and_input_spacing(self):
        _, solution, cases, _ = judge.load_problem("12")
        self.assertTrue(solution.is_file())
        self.assertEqual(len(cases), 20)
        for name, input_text, expected in cases:
            with self.subTest(case=name):
                fields = input_text.split()
                self.assertEqual(len(fields), 5)
                self.assertEqual(len(input_text.splitlines()), 1)
                price, quantity, discount, shipping, paid = [Decimal(value) for value in fields]
                original = price * quantity
                due = original * (100 - discount) / 100 + shipping
                change = paid - due
                self.assertGreaterEqual(change, 0)
                self.assertEqual(expected.split(), [format(value, ".2f") for value in (original, due, change)])
        self.assertTrue(any("\t" in text for _, text, _ in cases))
        self.assertTrue(any("  " in text for _, text, _ in cases))


if __name__ == "__main__":
    unittest.main(verbosity=2)
