"""
SEO iteration 10 tests.

1) Deploy fix  — SEO.jsx parses cleanly with @babel/parser (jsx plugin).
2) Sitemap     — no <changefreq>/<priority>, every <url> has one ISO <lastmod>.
3) Lastmod     — blog posts use per-post dates; static pages use seo_prerender.py mtime.
4) Regression  — root /sitemap.xml alias, prerender metadata, www->apex 301,
                 /api/prerender/routes counts, brand JSON-LD.
5) Blog hub P0 — /api/prerender?path=/blog emits an anchor per published post
                 inside <main id="__seo_prerender">.

NOTE: Motor's client binds to the first event loop that touches it, so only
ONE module-scoped starlette TestClient is used (same pattern as iter9).
"""
import os
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

sys.path.insert(0, "/app/backend")
from starlette.testclient import TestClient  # noqa: E402
from server import app  # noqa: E402

_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _env.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")

NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
FRONTEND_DIR = Path("/app/frontend")
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


# `client` fixture is session-scoped in tests/conftest.py


@pytest.fixture(scope="module")
def sitemap_xml():
    r = requests.get(f"{BASE_URL}/api/sitemap.xml", timeout=30)
    assert r.status_code == 200, r.text[:300]
    assert "xml" in r.headers.get("content-type", "")
    return r.text


@pytest.fixture(scope="module")
def blog_posts():
    r = requests.get(f"{BASE_URL}/api/blog/posts", timeout=30)
    assert r.status_code == 200, r.text[:300]
    data = r.json()
    posts = data if isinstance(data, list) else data.get("posts", [])
    assert isinstance(posts, list) and posts, "no blog posts returned"
    return posts


@pytest.fixture(scope="module")
def blog_prerender_html():
    r = requests.get(f"{BASE_URL}/api/prerender", params={"path": "/blog"}, timeout=30)
    assert r.status_code == 200, r.text[:300]
    return r.text


# --------------------------------------------------------------------------
# 1) Deploy fix — SEO.jsx syntax
# --------------------------------------------------------------------------
class TestSEOJsxCompiles:
    def test_babel_parses_seo_jsx(self):
        script = (
            'const {parse}=require("@babel/parser");'
            'parse(require("fs").readFileSync("src/components/SEO.jsx","utf8"),'
            '{sourceType:"module",plugins:["jsx"]});console.log("OK")'
        )
        proc = subprocess.run(
            ["node", "-e", script], cwd=str(FRONTEND_DIR),
            capture_output=True, text=True, timeout=120,
        )
        assert proc.returncode == 0, f"stderr={proc.stderr[:800]}"
        assert "OK" in proc.stdout

    @pytest.mark.skipif(
        os.environ.get("RUN_FRONTEND_BUILD") != "1",
        reason="set RUN_FRONTEND_BUILD=1 to run the ~30s CRA build",
    )
    def test_cra_build_compiles(self):
        proc = subprocess.run(
            ["yarn", "build:no-prerender"], cwd=str(FRONTEND_DIR),
            env={**os.environ, "CI": "false"},
            capture_output=True, text=True, timeout=600,
        )
        out = proc.stdout + proc.stderr
        assert "Failed to compile" not in out, out[-1500:]
        assert proc.returncode == 0, out[-1500:]

    def test_no_jsx_comments_outside_return(self):
        src = (FRONTEND_DIR / "src/components/SEO.jsx").read_text()
        head = src.split("return (")[0]
        assert "{/*" not in head, "JSX-style comment still present in function body"

    def test_eslint_clean_on_seo_jsx(self):
        proc = subprocess.run(
            ["npx", "--no-install", "eslint", "src/components/SEO.jsx"],
            cwd=str(FRONTEND_DIR), capture_output=True, text=True, timeout=240,
        )
        out = proc.stdout + proc.stderr
        if ("couldn't find" in out.lower() or "not found" in out.lower()
                or "eslint.config" in out):
            pytest.skip(f"standalone eslint not configured for CRA project: {out[:120]}")
        assert "Unexpected character" not in out, out[:800]
        assert "Missing semicolon" not in out, out[:800]
        assert proc.returncode == 0, out[:800]


# --------------------------------------------------------------------------
# 2) Sitemap simplification
# --------------------------------------------------------------------------
class TestSitemapSimplified:
    def test_url_count_and_structure(self, sitemap_xml):
        root = ET.fromstring(sitemap_xml)
        urls = root.findall("s:url", NS)
        assert len(urls) >= 30, f"only {len(urls)} urls"
        for u in urls:
            loc = u.findall("s:loc", NS)
            assert len(loc) == 1 and loc[0].text.startswith("http")
            lastmods = u.findall("s:lastmod", NS)
            assert len(lastmods) == 1, f"{loc[0].text} has {len(lastmods)} lastmod"
            assert ISO_DATE.match(lastmods[0].text or ""), lastmods[0].text
            # no other children allowed
            tags = {c.tag.split('}')[-1] for c in u}
            assert tags == {"loc", "lastmod"}, tags

    def test_zero_changefreq_and_priority(self, sitemap_xml):
        root = ET.fromstring(sitemap_xml)
        assert root.findall(".//s:changefreq", NS) == []
        assert root.findall(".//s:priority", NS) == []
        assert "changefreq" not in sitemap_xml
        assert "priority" not in sitemap_xml


class TestSitemapLastmod:
    def _map(self, xml):
        root = ET.fromstring(xml)
        return {
            u.find("s:loc", NS).text: u.find("s:lastmod", NS).text
            for u in root.findall("s:url", NS)
        }

    def test_blog_lastmod_matches_post_dates(self, sitemap_xml, blog_posts):
        m = self._map(sitemap_xml)
        checked = 0
        for post in blog_posts:
            slug = post.get("slug")
            raw = post.get("updated_at") or post.get("published_at") or post.get("date")
            if not slug or not raw:
                continue
            entry = [v for k, v in m.items() if k.endswith(f"/blog/{slug}")]
            assert entry, f"/blog/{slug} missing from sitemap"
            assert entry[0] == str(raw)[:10], f"{slug}: sitemap={entry[0]} post={raw}"
            checked += 1
        assert checked >= 1

    def test_blog_lastmods_not_all_identical(self, sitemap_xml, blog_posts):
        m = self._map(sitemap_xml)
        vals = {v for k, v in m.items() if "/blog/" in k}
        assert len(vals) > 1, f"all blog lastmods identical: {vals}"

    def test_static_lastmod_equals_seo_prerender_mtime(self, sitemap_xml):
        from datetime import datetime
        import seo_prerender as _seo
        expected = datetime.utcfromtimestamp(
            os.path.getmtime(_seo.__file__)
        ).strftime("%Y-%m-%d")
        m = self._map(sitemap_xml)
        static = [v for k, v in m.items() if k.rstrip("/").endswith("/about") or k.endswith("/contact")]
        assert static, "no static pages found"
        for v in static:
            assert v == expected, f"static lastmod {v} != mtime {expected}"


class TestSitemapRootAlias:
    def test_root_alias_matches_api(self, client, sitemap_xml):
        r = client.get("/sitemap.xml")
        assert r.status_code == 200
        assert "xml" in r.headers.get("content-type", "")
        api_count = len(ET.fromstring(sitemap_xml).findall("s:url", NS))
        root_count = len(ET.fromstring(r.text).findall("s:url", NS))
        assert root_count == api_count, f"root={root_count} api={api_count}"
        assert "changefreq" not in r.text and "priority" not in r.text

    def test_build_sitemap_snapshot_shape(self):
        p = FRONTEND_DIR / "build" / "sitemap.xml"
        if not p.exists():
            pytest.skip("build/sitemap.xml not present (build not run in preview)")
        xml = p.read_text()
        assert "changefreq" not in xml and "priority" not in xml


# --------------------------------------------------------------------------
# 3) Blog discovery (P0)
# --------------------------------------------------------------------------
class TestBlogDiscovery:
    def test_latest_posts_heading(self, blog_prerender_html):
        assert "<h2>Latest posts</h2>" in blog_prerender_html

    def test_anchors_inside_prerender_main(self, blog_prerender_html, blog_posts):
        m = re.search(
            r'<main id="__seo_prerender".*?</main>', blog_prerender_html, re.S
        )
        assert m, "prerender main block missing"
        block = m.group(0)
        anchors = re.findall(r'href="(/blog/[^"]+)"', block)
        assert len(anchors) >= len(blog_posts), (
            f"{len(anchors)} anchors < {len(blog_posts)} published posts"
        )

    def test_every_post_has_anchor(self, blog_prerender_html, blog_posts):
        for post in blog_posts:
            slug = post.get("slug")
            assert f'href="/blog/{slug}"' in blog_prerender_html, f"missing link for {slug}"

    def test_no_broken_anchor_slugs(self, blog_prerender_html, blog_posts):
        valid = {p.get("slug") for p in blog_posts}
        anchors = set(re.findall(r'href="/blog/([^"]+)"', blog_prerender_html))
        assert anchors, "no anchors found"
        assert anchors <= valid, f"unknown slugs: {anchors - valid}"

    def test_anchor_slug_prerenders_ok(self, blog_prerender_html):
        slug = re.findall(r'href="/blog/([^"]+)"', blog_prerender_html)[0]
        r = requests.get(f"{BASE_URL}/api/prerender", params={"path": f"/blog/{slug}"}, timeout=30)
        assert r.status_code == 200
        assert "BlogPosting" in r.text


# --------------------------------------------------------------------------
# 4) Regressions
# --------------------------------------------------------------------------
class TestPrerenderRegression:
    @pytest.mark.parametrize("path", ["/", "/solutions/business-apps", "/brands/roomz"])
    def test_static_route_metadata(self, path):
        r = requests.get(f"{BASE_URL}/api/prerender", params={"path": path}, timeout=30)
        assert r.status_code == 200
        html = r.text
        assert "<title>" in html and len(re.search(r"<title>(.*?)</title>", html).group(1)) > 10
        assert 'name="description"' in html
        assert f'rel="canonical"' in html
        assert 'property="og:image"' in html
        assert 'application/ld+json' in html
        assert "<h1>" in html

    def test_blog_post_metadata(self, blog_posts):
        slug = blog_posts[0]["slug"]
        r = requests.get(f"{BASE_URL}/api/prerender", params={"path": f"/blog/{slug}"}, timeout=30)
        assert r.status_code == 200
        for token in ["<title>", 'name="description"', 'rel="canonical"',
                      'property="og:image"', "application/ld+json", "<h1>"]:
            assert token in r.text, token

    def test_routes_endpoint_counts(self):
        r = requests.get(f"{BASE_URL}/api/prerender/routes", timeout=30)
        assert r.status_code == 200
        data = r.json()
        static = data.get("static") or data.get("static_routes") or []
        dynamic = data.get("dynamic") or data.get("blog_posts") or data.get("dynamic_routes") or []
        assert len(static) == 15, f"static={len(static)}: {data.keys()}"
        assert len(dynamic) >= 1

    def test_brand_jsonld(self):
        r = requests.get(f"{BASE_URL}/api/prerender", params={"path": "/brands/jabra"}, timeout=30)
        assert r.status_code == 200
        assert '"@type":"Brand"' in r.text.replace(" ", "")

    def test_www_to_apex_301(self, client):
        r = client.get("/api/sitemap.xml", headers={"host": "www.fidelislogic.com"})
        assert r.status_code == 301
        loc = r.headers.get("location", "")
        assert loc.startswith("https://fidelislogic.com/") or loc.startswith("http://fidelislogic.com/"), loc
        assert "www." not in loc
