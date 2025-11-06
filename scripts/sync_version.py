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
FRONTEND_DEP_RE = re.compile(r'(?m)^[ \t]*"jb_toc_frontend\s*==\s*(?P<ver>[^"]+)"[ \t]*,?$')

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
    
def get_pyproject_version(pyproj_text: str) -> str:
    m = PROJECT_TABLE_RE.search(pyproj_text)
    if not m:
        raise ValueError("No [project] section found in pyproject.toml")
    body = m.group('body')
    m2 = VERSION_LINE_RE.search(body)
    if not m2:
        raise ValueError("No static version found in [project] (maybe dynamic= ['version']?)")

    return m2.group('ver')

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

def ensure_project_dep(pyproj_text: str, pep440_version: str) -> str:
    """
    Update jb_toc_frontend dependency version in jb_toc/pyproject.toml
    """
    m = PROJECT_TABLE_RE.search(pyproj_text)
 
    start, end = m.span()
    body = m.group('body')

    if FRONTEND_DEP_RE.search(body):
        body = FRONTEND_DEP_RE.sub(f'    "jb_toc_frontend=={pep440_version}"', body, count=1)
    else:
        if body and not body.startswith("\n"):
            body = "\n" + body
        body = f'\n    "jb_toc_frontend=={pep440_version}"\n{body}'

    new_project_block = f"[project]\n{body}"
    return pyproj_text[:start] + new_project_block + pyproj_text[end:]

def update_pyproj_version(pyproj_path: Path, pep440_version: str) -> bool:
    if not pyproj_path.exists():
        return False
    original = pyproj_path.read_text(encoding="utf-8")
    updated = ensure_project_version(original, pep440_version)
    if updated != original:
        pyproj_path.write_text(updated, encoding="utf-8")
        return True
    return False

def update_pyproj_dep(pyproj_path: Path, pep440_version: str) -> bool:
    original = pyproj_path.read_text(encoding="utf-8")
    updated = ensure_project_dep(original, pep440_version)
    if updated != original:
        pyproj_path.write_text(updated, encoding="utf-8")
        return True
    return False

def update_package_json_version(pkg_path: Path, semver_version: str) -> bool:
    text = pkg_path.read_text(encoding="utf-8")
    new_text = re.sub(
        r'("version"\s*:\s*")[^"]+(")',
        rf'\g<1>{semver_version}\2',
        text,
        count=1,
    )
    if new_text != text:
        pkg_path.write_text(new_text, encoding="utf-8")
        return True
    return False


def main():
    root = Path(__file__).resolve().parents[1]
    root_pyproject = root / "pyproject.toml"
    pyproject_paths = [
        root / "jb_toc_frontend/pyproject.toml",
        root / "jb_toc/pyproject.toml",
    ]
    package_json_paths = [
        root / "jb_toc_frontend/package.json",
        root / "jb_toc/package.json",
    ]

    data = root_pyproject.read_text(encoding="utf-8")
    version = get_pyproject_version(data)
 
    if not SEMVER.match(version or ""):
        print("Error: not semver", file=sys.stderr)
        sys.exit(2)

    pep_version = npm_to_pep440(version)

    updated = []
    for p in pyproject_paths:
        if update_pyproj_version(p, pep_version):
            updated.append(p)
        if "jb_toc" in str(p) and "frontend" not in str(p):
            update_pyproj_dep(p, pep_version)

    for p in package_json_paths:
        if update_package_json_version(p, version):
            updated.append(p)

    if len(updated) > 0:
        print(f"Wrote version {pep_version} to:")
        for p in updated:
            print(f" - {p.relative_to(root)}")

if __name__ == "__main__":
    main()
