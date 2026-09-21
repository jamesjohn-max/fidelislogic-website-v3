"""
The committed frontend/seo-snapshot/ matches what seo_prerender renders, and
every public page of the React app has a pre-rendered entry.

The frontend build reads the snapshot instead of calling /api/prerender, so a
stale snapshot would ship old titles and copy. No server or database needed.
"""
import filecmp
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = BACKEND_DIR.parent
SNAPSHOT_DIR = REPO_DIR / "frontend" / "seo-snapshot"
EXPORTER = BACKEND_DIR / "scripts" / "export_prerender_snapshot.py"

sys.path.insert(0, str(BACKEND_DIR))
import seo_prerender  # noqa: E402

PUBLIC_PAGES = ["/about", "/contact", "/deals", "/tools/room-configurator"]


def _snapshot_files(root: Path) -> set[str]:
    return {str(p.relative_to(root)) for p in root.rglob("*.html")}


def test_snapshot_is_up_to_date(tmp_path):
    subprocess.run([sys.executable, str(EXPORTER), "--out", str(tmp_path)], check=True)
    fresh, committed = _snapshot_files(tmp_path), _snapshot_files(SNAPSHOT_DIR)
    assert fresh == committed, "Run backend/scripts/export_prerender_snapshot.py"
    _, mismatch, errors = filecmp.cmpfiles(tmp_path, SNAPSHOT_DIR, sorted(fresh), shallow=False)
    assert not mismatch and not errors, (
        f"Stale snapshot files {mismatch + errors}: "
        "run backend/scripts/export_prerender_snapshot.py"
    )


def test_snapshot_uses_the_production_host():
    for name in _snapshot_files(SNAPSHOT_DIR):
        html = (SNAPSHOT_DIR / name).read_text(encoding="utf-8")
        canonical = re.search(r'<link rel="canonical" href="([^"]+)"', html).group(1)
        assert canonical.startswith("https://fidelislogic.com/"), (name, canonical)


@pytest.mark.parametrize("path", PUBLIC_PAGES)
def test_public_page_has_its_own_head_and_body(path):
    html = seo_prerender.render_seo_html(path, seo_prerender.STATIC_ROUTES[path])
    base = seo_prerender.SITE_BASE_URL
    assert f'<link rel="canonical" href="{base}{path}" />' in html
    assert f'<meta property="og:url" content="{base}{path}" />' in html
    assert re.search(r"<h1>[^<]+</h1>", html)
    assert re.search(r"<title>[^<]+\| Fidelis Logic</title>", html)
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    assert "BreadcrumbList" in [json.loads(b)["@type"] for b in blocks]


def test_every_public_react_route_is_prerendered():
    app_js = (REPO_DIR / "frontend" / "src" / "App.js").read_text(encoding="utf-8")
    routes = re.findall(r'<Route path="([^"]+)" element=\{<PublicLayout>', app_js)
    assert routes, "No public routes found in App.js"
    static = set(seo_prerender.STATIC_ROUTES)
    for route in routes:
        if ":slug" in route:
            # Served by the blog/deal/brand/service resolvers instead.
            continue
        if route in seo_prerender.UNPUBLISHED_ROUTES:
            # Reachable but deliberately not publishable yet: noindex, absent
            # from the sitemap, and awaiting approved content.
            continue
        assert route in static, f"{route} has no entry in seo_prerender.STATIC_ROUTES"


def test_unpublished_routes_stay_out_of_the_registry():
    """A route cannot be both unpublished and pre-rendered."""
    overlap = set(seo_prerender.UNPUBLISHED_ROUTES) & set(seo_prerender.STATIC_ROUTES)
    assert not overlap, f"{overlap} is both unpublished and pre-rendered"


def test_audience_routes_are_prerendered():
    """The two audience journeys are publishable, so they must be pre-rendered."""
    for path in ("/for-organisations", "/for-partners"):
        assert path in seo_prerender.STATIC_ROUTES
        html = seo_prerender.render_seo_html(path, seo_prerender.STATIC_ROUTES[path])
        assert f'<link rel="canonical" href="{seo_prerender.SITE_BASE_URL}{path}" />' in html
        assert re.search(r"<h1>[^<]+</h1>", html)


def test_deal_route_pattern():
    assert seo_prerender.DEAL_POST_RE.match("/deals/try-roomz-for-free")
    assert not seo_prerender.DEAL_POST_RE.match("/deals")
    assert not seo_prerender.DEAL_POST_RE.match("/deals/../admin")


class _Deals:
    def __init__(self, docs):
        self.docs = docs

    async def find_one(self, query):
        return next(
            (d for d in self.docs if all(d.get(k) == v for k, v in query.items())),
            None,
        )


def test_deal_page_meta():
    import asyncio
    from datetime import datetime
    from types import SimpleNamespace

    deal = {
        "slug": "try-roomz-for-free",
        "title": "Try ROOMZ for free",
        "excerpt": "A month of ROOMZ displays at no cost.",
        "content": "<p>Book rooms from the door.</p>",
        "featured_image": "data:image/png;base64,AAAA",
        "start_date": datetime(2026, 9, 1),
        "end_date": datetime(2026, 12, 30),
        "published": True,
    }
    db = SimpleNamespace(deals=_Deals([deal, {**deal, "slug": "draft", "published": False}]))

    meta = asyncio.run(seo_prerender.resolve_route_meta("/deals/try-roomz-for-free", db))
    html = seo_prerender.render_seo_html("/deals/try-roomz-for-free", meta)
    assert "<title>Try ROOMZ for free | Smart Deals - Fidelis Logic</title>" in html
    assert "<h1>Try ROOMZ for free</h1>" in html
    assert "data:image" not in html  # base64 images can't be an og:image
    assert f"{seo_prerender.SITE_BASE_URL}/deals/try-roomz-for-free" in html

    assert asyncio.run(seo_prerender.resolve_route_meta("/deals/draft", db)) is None
