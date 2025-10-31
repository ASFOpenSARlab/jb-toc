import pytest
import jb_toc

@pytest.fixture(autouse=True)
def _load_ext(jp_serverapp):
    jb_toc.load_jupyter_server_extension(jp_serverapp)
    yield

@pytest.fixture(autouse=True)
def _no_proxies(monkeypatch):
    for k in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy", "ALL_PROXY", "all_proxy"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("NO_PROXY", "127.0.0.1,localhost,::1")


def jp_server_config():
    return {
        "ServerApp": {
            "jpserver_extensions": {"jb_toc": True},
            "disable_check_xsrf": True,
        }
    }
