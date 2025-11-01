import pytest
from pathlib import Path

pytest_plugins = ("pytest_jupyter.jupyter_server",)

@pytest.fixture
def jp_server_config():
    fixtures = Path(__file__).parent / "fixtures"
    return {
        "ServerApp": {
            "jpserver_extensions": {"jb_toc": True},
            "disable_check_xsrf": True,
            "root_dir": str(fixtures),
        }
    }
