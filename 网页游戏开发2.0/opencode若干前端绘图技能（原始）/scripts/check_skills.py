# -*- coding: utf-8 -*-
import os, re, sys, glob, yaml

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".opencode", "skills")
ALLOWED = {"name","description","license","compatibility","metadata"}
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

def parse_frontmatter(text):
    if not text.startswith("---"):
        return None, "missing frontmatter delimiter"
    parts = text.split("---", 2)
    if len(parts) < 3:
        return None, "unterminated frontmatter"
    try:
        fields = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as e:
        return None, f"yaml error: {e}"
    if not isinstance(fields, dict):
        return None, "frontmatter not a mapping"
    return fields, None

problems = []
count = 0
for skill_dir in sorted(glob.glob(os.path.join(ROOT, "*"))):
    if not os.path.isdir(skill_dir):
        continue
    base = os.path.basename(skill_dir)
    skill_md = os.path.join(skill_dir, "SKILL.md")
    if not os.path.isfile(skill_md):
        problems.append(f"[{base}] MISSING SKILL.md")
        continue
    with open(skill_md, encoding="utf-8", errors="replace") as f:
        text = f.read()
    fields, err = parse_frontmatter(text)
    if err:
        problems.append(f"[{base}] {err}")
        continue
    count += 1
    if not NAME_RE.match(base):
        problems.append(f"[{base}] dirname not matching regex: {base}")
    name = fields.get("name")
    if not name:
        problems.append(f"[{base}] missing name")
    elif name != base:
        problems.append(f"[{base}] name '{name}' != dir '{base}'")
    elif not NAME_RE.match(name):
        problems.append(f"[{base}] name not matching regex: {name}")
    elif len(name) > 64:
        problems.append(f"[{base}] name longer than 64")
    desc = fields.get("description")
    if desc is None:
        problems.append(f"[{base}] missing description")
    elif isinstance(desc, str) and not (1 <= len(desc) <= 1024):
        problems.append(f"[{base}] description length {len(desc)} out of 1-1024")
    elif not isinstance(desc, str):
        problems.append(f"[{base}] description not a string: {type(desc).__name__}")
    unknown = set(fields.keys()) - ALLOWED
    if unknown:
        problems.append(f"[{base}] unknown fields: {sorted(unknown)}")

print(f"checked: {count} skills")
if problems:
    print("PROBLEMS:")
    for p in problems:
        print(" -", p)
else:
    print("ALL OK")
