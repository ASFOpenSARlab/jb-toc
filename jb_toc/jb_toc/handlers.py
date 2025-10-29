from __future__ import annotations
import json, os, re
from typing import Dict, Any, List
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join, ensure_async
from tornado import web

def _title_from_markdown(md_text: str) -> str | None:
    """
    Searches Markdown for the first heading of any level up to 6.
    Supports ATX and SETEXT heading styles

    md_text: Markdown text to search for a heading
    returns: The first encountered heading as a title
    """
    atx = re.compile(r'^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$', re.MULTILINE)
    setext = re.compile(r'^(.+)\n[=-]{3,}\s*$', re.MULTILINE)
    result = atx.search(md_text)

    if result:
        return result.group(1).strip()
    result = setext.search(md_text)

    if result:
        return result.group(1).strip()
    return None

def _title_from_notebook(notebook: Dict[str, Any]) -> str | None:
    """
    Searches a notebook's markdown cells for the first heading of any level
    up to 6 and returns it as a title

    notebook: json object containing the notebook
    returns: The first encountered heading as a title
    """
    title = (notebook.get("metadata") or {}).get("title")

    if title:
        return str(title)
    for cell in notebook.get("cells", []):
        if cell.get("cell_type") == "markdown":
            src = cell.get("source") or ""
            if isinstance(src, list):
                src = "".join(src)
            title = _title_from_markdown(src)
            if title:
                return title
    return None

class TitlesHandler(APIHandler):
    """
    Handle HTTP POST requests for the jbtoc/title endpoint.
    """
    @web.authenticated
    async def post(self):
        """
        Looks up the titles for notebooks and Markdown docs from a list of paths provided
        in a POST request. Titles are determined by the first Mardown heading in a file. 
        """
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
                out[p] = {"title": title}
            except Exception as e:
                out[p] = {"title": f"File not found: {p}"}

        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps({"titles": out}))

def setup_handlers(web_app):
    base = web_app.settings.get("base_url", "/")
    route = url_path_join(base, "jbtoc", "titles")
    web_app.add_handlers(".*$", [(route, TitlesHandler)])
