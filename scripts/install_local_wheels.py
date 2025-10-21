#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys


def pick_latest(pattern: str) -> str:
    wheels = sorted(Path("dist").glob(pattern))
    return str(wheels[-1])


def install_wheel(wheel_path: str) -> None:
    print(f"Installing {wheel_path} (no deps)...")
    subprocess.check_call([
        sys.executable,
        "-m", "pip",
        "install",
        "--no-deps",
        wheel_path
    ])


def main():
    frontend_wheel = pick_latest("jb_toc_frontend-*.whl")
    jb_toc_wheel = pick_latest("jb_toc-*.whl")

    install_wheel(frontend_wheel)
    install_wheel(jb_toc_wheel)


if __name__ == "__main__":
    main()
