from .handlers import setup_handlers
from .titles import get_titles

def _jupyter_server_extension_points():
    return [{"module": "jb_toc"}]

def _load_jupyter_server_extension(server_app):
    setup_handlers(server_app.web_app)
    server_app.log.info("jb_toc loaded: /jbtoc/titles and /jbtoc/health ready")
