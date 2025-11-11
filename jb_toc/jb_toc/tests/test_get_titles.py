import pytest
from jb_toc.titles import get_titles

@pytest.mark.asyncio
async def test_get_titles_with_real_cm(jp_serverapp):
    paths = [
        "header1.ipynb",
        "header2.ipynb",
        "header1.md",
        "header2.md",
    ]
    cm = jp_serverapp.contents_manager
    
    titles = await get_titles(paths, cm)

    assert titles[paths[0]] == {"title": "Level 1 Notebook Header, Markdown Cell # 1"}
    assert titles[paths[1]] == {"title": "Level 2 Notebook Header, Markdown Cell # 1"}
    assert titles[paths[2]] == {"title": "Level 1 Header"}
    assert titles[paths[3]] == {"title": "Level 2 Header"}
 