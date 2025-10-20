#!/usr/bin/env python3
import json
from pathlib import Path
import re
import sys

SEMVER = re.compile(
    r'^(\d+\.\d+\.\d+)'                              # 1.2.3
    r'(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?'     # -pre.release
    r'(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$'   # +build.meta
)

PROJECT_TABLE_RE = re.compile(r'(?ms)^\[project\]\s*(?P<body>.*?)(?=^\[[^\]]+\]|\Z)')
VERSION_LINE_RE = re.compile(r'(?m)^\s*version\s*=\s*([\'"])(?P<ver>.*?)(\1)\s*$')

def npm_to_pep440(v: str) -> str:
    m = SEMVER.match(v or "")
    if not m:
        raise ValueError(f"Not semver: {v}")
    base, pre, _ = m.groups()
    if not pre:
        return base
    parts = pre.split('.')
    tag = parts[0].lower()
    num = parts[1] if len(parts) > 1 and parts[1].isdigit() else '0'
    map_ = {'alpha': 'a', 'a': 'a', 'beta': 'b', 'b': 'b', 'rc': 'rc', 'dev': 'dev'}
    return f"{base}.{map_[tag]}{num}" if tag in map_ else f"{base}.dev0"

def ensure_project_version(pyproj_text: str, pep440_version: str) -> str:
    """
    Insert or replace [project].version = "<pep440_version>".
    """
    m = PROJECT_TABLE_RE.search(pyproj_text)
    if not m:
        # No [project] table — append one.
        add = f'[project]\nversion = "{pep440_version}"\n'        
        return pyproj_text.rstrip() + add

    start, end = m.span()
    body = m.group('body')

    if VERSION_LINE_RE.search(body):
        body = VERSION_LINE_RE.sub(f'version = "{pep440_version}"\n', body, count=1)
    else:
        if body and not body.startswith("\n"):
            body = "\n" + body
        body = f'\nversion = "{pep440_version}"{body}'

    new_project_block = f"[project]\n{body}"
    return pyproj_text[:start] + new_project_block + pyproj_text[end:]

def update_pyproject(pyproj_path: Path, pep440_version: str) -> bool:
    if not pyproj_path.exists():
        return False
    original = pyproj_path.read_text(encoding="utf-8")
    updated = ensure_project_version(original, pep440_version)
    if updated != original:
        pyproj_path.write_text(updated, encoding="utf-8")
        return True
    return False

def main():
    root = Path(__file__).resolve().parents[1]
    pkg_json = root / "jb_toc_frontend/package.json"
    pyproject_paths = [
        root / "pyproject.toml",
        root / "jb_toc_frontend/pyproject.toml",
        root / "jb_toc/pyproject.toml",
    ]
    version_txt_path = root / "VERSION"

    data = json.loads(pkg_json.read_text(encoding="utf-8"))
    version = data.get("version")
    if not SEMVER.match(version or ""):
        print("Error: not semver", file=sys.stderr)
        sys.exit(2)

    pep_version = npm_to_pep440(version)

    version_txt_path.write_text(pep_version + "\n", encoding="utf-8")

    updated = []
    for p in pyproject_paths:
        if update_pyproject(p, pep_version):
            updated.append(p)

    print(f"Wrote version {pep_version} to:")
    print(f" - {version_txt_path.relative_to(root)}")
    for p in updated:
        print(f" - {p.relative_to(root)} (pyproject.toml)")

if __name__ == "__main__":
    main()
