#!/usr/bin/env python3

import json
import os
from pathlib import Path

root = os.popen("git rev-parse --show-toplevel").read().strip()
ver = json.loads(Path(root, "jb_toc", "package.json").read_text())["version"]

# npm "1.0.4-dev0" -> PEP 440 "1.0.4.dev0"
if "-dev" in ver:
    base, suffix = ver.split("-dev", 1)
    if suffix and suffix[0].isdigit():
        ver = f"{base}.dev{suffix}"
print(ver.strip())
