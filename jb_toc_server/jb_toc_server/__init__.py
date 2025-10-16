from .handlers import setup_handlers

def _jupyter_server_extension_points():
    return [{"module": "jb_toc_server"}]

def _load_jupyter_server_extension(server_app):
    setup_handlers(server_app.web_app)
    server_app.log.info("jb_toc_server: /jbtoc/titles ready")
