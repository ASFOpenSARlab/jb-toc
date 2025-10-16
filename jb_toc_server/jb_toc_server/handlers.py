from __future__ import annotations
import json, os, re
from typing import Dict, Any, List
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join, ensure_async
from tornado import web

_ATX = re.compile(r'^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$', re.MULTILINE)
_SETEXT = re.compile(r'^(.+)\n[=-]{3,}\s*$', re.MULTILINE)

def _title_from_markdown(text: str) -> str | None:
    m = _ATX.search(text)
    if m:
        return m.group(1).strip()
    m = _SETEXT.search(text)
    if m:
        return m.group(1).strip()
    return None

def _title_from_notebook(nb: Dict[str, Any]) -> str | None:
    t = (nb.get("metadata") or {}).get("title")
    if t:
        return str(t)
    for cell in nb.get("cells", []):
        if cell.get("cell_type") == "markdown":
            src = cell.get("source") or ""
            if isinstance(src, list):
                src = "".join(src)
            t = _title_from_markdown(src)
            if t:
                return t
    return None

class TitlesHandler(APIHandler):
    @web.authenticated
    async def post(self):
        body = self.get_json_body() or {}
        paths: List[str] = list(body.get("paths") or [])
        cm = self.contents_manager

        out: Dict[str, Dict[str, str]] = {}
        for p in paths:
            try:
                model = await ensure_async(cm.get(p, content=True))
                kind = model.get("type")
                title = None
                if kind == "notebook":
                    title = _title_from_notebook(model.get("content") or {})
                elif kind == "file":
                    content = model.get("content") or ""
                    if isinstance(content, bytes):
                        content = content.decode("utf-8", "replace")
                    head = content[:131072]
                    if p.lower().endswith((".md", ".markdown", ".mdx")):
                        title = _title_from_markdown(head)
                if not title:
                    title = os.path.splitext(os.path.basename(p))[0]
                out[p] = {"title": title, "last_modified": str(model.get("last_modified") or "")}
            except Exception as e:
                # out[p] = {"title": os.path.splitext(os.path.basename(p))[0]}
                out[p] = {"title": str(e)[:80]}

        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps({"titles": out}))

def setup_handlers(web_app):
    base = web_app.settings.get("base_url", "/")
    route = url_path_join(base, "jbtoc", "titles")
    web_app.add_handlers(".*$", [(route, TitlesHandler)])
