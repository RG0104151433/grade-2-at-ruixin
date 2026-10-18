"""check_lesson.py 的正例/反例测试。

原则：测试必须在"故意破坏"的输入上失败，否则不知道检查是否为空。
"""

import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills" / "algo-implicit-heuristics" / "scripts" / "check_lesson.py"
FIXTURES = ROOT / "tests" / "fixtures"


def run(fixture, *args):
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(FIXTURES / fixture), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


class TestCheckLesson(unittest.TestCase):
    def test_good_lesson_passes(self):
        r = run("good_lesson.txt", "--terms", "连续段", "--verbs", "留下", "--entity", "[1, 1, 2]")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("PASS", r.stdout)
        self.assertNotIn("FAIL", r.stdout)

    def test_bad_lesson_fails(self):
        r = run("bad_lesson.txt", "--terms", "环", "--verbs", "留下", "--entity", "[1, 1, 2]")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("FAIL", r.stdout)

    def test_wrong_entity_fails(self):
        r = run("good_lesson.txt", "--terms", "连续段", "--entity", "[9, 9, 9]")
        self.assertEqual(r.returncode, 1)

    def test_cycles_lesson_passes(self):
        r = run(
            "cycles_lesson.txt",
            "--terms", "环,置换,闭合",
            "--verbs", "该去",
            "--entity", "[3, 1, 2]",
            "--naming-term", "环",
        )
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertNotIn("FAIL", r.stdout)


if __name__ == "__main__":
    unittest.main()
