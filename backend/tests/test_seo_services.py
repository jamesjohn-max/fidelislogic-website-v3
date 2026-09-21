"""
Service page pre-render tests.

The /services routes are generated from frontend/src/data/services.json, the
same file the React pages render. These tests exercise seo_prerender directly
(no server, no database) so they also guard the JSON contract: if a field the
backend relies on is renamed in services.json, they fail.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import seo_prerender  # noqa: E402

SERVICES = json.load(open(seo_prerender.SERVICES_JSON_PATH, encoding="utf-8"))["services"]


def _jsonld(html: str) -> list[dict]:
    return [
        json.loads(block)
        for block in re.findall(
            r'<script type="application/ld\+json">(.*?)</script>', html, re.S
        )
    ]


def test_every_service_is_prerendered():
    routes = seo_prerender.list_static_routes()
    assert "/services" in routes
    for service in SERVICES:
        assert f"/services/{service['slug']}" in routes


def test_service_page_head_and_body():
    for service in SERVICES:
        path = f"/services/{service['slug']}"
        html = seo_prerender.render_seo_html(path, seo_prerender.STATIC_ROUTES[path])

        title = re.search(r"<title>(.*?)</title>", html).group(1)
        assert title.endswith("| Fidelis Logic")
        assert title.count("Fidelis Logic") == 1

        h1 = re.search(r"<h1>(.*?)</h1>", html).group(1)
        assert h1 == seo_prerender._esc(service["h1"])
        assert f'<link rel="canonical" href="{seo_prerender.SITE_BASE_URL}{path}" />' in html

        types = [block.get("@type") for block in _jsonld(html)]
        assert "Service" in types
        assert "BreadcrumbList" in types
        assert "FAQPage" in types

        # Every FAQ question is visible to crawlers, not only in JSON-LD.
        for faq in service["faqs"]:
            assert f"<h3>{seo_prerender._esc(faq['question'])}</h3>" in html


def test_home_links_to_every_service():
    html = seo_prerender.render_seo_html("/", seo_prerender.STATIC_ROUTES["/"])
    for service in SERVICES:
        assert f'href="/services/{service["slug"]}"' in html
    org = next(b for b in _jsonld(html) if b.get("@type") == "Organization")
    assert len(org["hasOfferCatalog"]["itemListElement"]) == len(SERVICES)


def test_missing_services_json_is_tolerated(tmp_path):
    assert seo_prerender._load_services_data(str(tmp_path / "missing.json")) is None


def test_every_prerendered_title_names_the_brand_once():
    for path, meta in seo_prerender.STATIC_ROUTES.items():
        title = meta["title"]
        assert title.endswith(" | Fidelis Logic"), (path, title)
        assert title.count("Fidelis Logic") == 1, (path, title)


def test_organization_address_matches_the_contact_details():
    org = seo_prerender._organization_schema()
    assert org["address"]["addressLocality"] == "Sharjah"
    assert org["address"]["addressCountry"] == "AE"


def test_titles_match_the_react_pages():
    """Crawlers see the prerendered title; browsers see seoConfig.js plus the
    " | Fidelis Logic" suffix SEO.jsx adds. They must be the same string."""
    frontend = os.path.join(os.path.dirname(seo_prerender.SERVICES_JSON_PATH), "seoConfig.js")
    config = open(frontend, encoding="utf-8").read()
    titles = dict(re.findall(r'^\s{2}(\w+): \{\s*\n\s*title: "([^"]+)"', config, re.M))
    route_keys = {
        "/": "home",
        "/solutions": "solutions",
        "/solutions/meeting-rooms": "meetingRooms",
        "/solutions/headsets": "headsets",
        "/solutions/workspace-experience": "workspaceExperience",
        "/solutions/business-apps": "businessApps",
        "/blog": "blog",
    }
    for path, key in route_keys.items():
        assert seo_prerender.STATIC_ROUTES[path]["title"] == f"{titles[key]} | Fidelis Logic", path
