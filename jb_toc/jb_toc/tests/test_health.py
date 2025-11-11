import json
from jb_toc.handlers import HealthHandler

async def test_health_handler():
    class DummyHandler:
        def __init__(self):
            self.sent = None
            self.status = 200
            class _Log:
                def info(self, *a, **k): pass
            self.log = _Log()

        def get_current_user(self):
            return True

        def set_status(self, code): self.status = code
        def set_header(self, name, value): pass
        def finish(self, obj): self.sent = obj

    dummy = DummyHandler()
    await HealthHandler.get(dummy)

    assert dummy.status == 200
    assert json.loads(dummy.sent) == {"ok": True}

def test_health_route_is_registered(jp_serverapp):
    base = jp_serverapp.base_url.rstrip("/")
    expected = f"{base}/jbtoc/health"
    got = jp_serverapp.web_app.settings.get("jb_toc_routes", {}).get("health")
    assert got == expected, f"health route mismatch: got={got!r}, expected={expected!r}"
