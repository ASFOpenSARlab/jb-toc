from __future__ import annotations
import json
from typing import List
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from tornado import web
from .titles import get_titles


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
        self.log.info("TitlesHandler: received POST with paths=%s", (self.get_json_body() or {}).get("paths"))

        body = self.get_json_body() or {}
        paths: List[str] = list(body.get("paths") or [])
        cm = self.contents_manager
        out = await get_titles(paths, cm)

        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps({"titles": out}))

    async def get(self):
        self.set_status(405)
        self.finish({"error": "Use POST /jbtoc/titles"})

class HealthHandler(APIHandler):
    """GET /jbtoc/health: lightweight health ping for testing"""
    async def get(self):
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps({"ok": True}))

def setup_handlers(web_app):
    base = web_app.settings.get("base_url", "/")
    titles_route = url_path_join(base, "jbtoc", "titles")
    health_route = url_path_join(base, "jbtoc", "health")

    web_app.add_handlers(".*$", [
        (titles_route, TitlesHandler),
        (health_route, HealthHandler),
    ])

    jb = web_app.settings.setdefault("jb_toc_routes", {})
    jb["titles"] = titles_route
    jb["health"] = health_route
