"""
Write the pre-rendered HTML for every static route to frontend/seo-snapshot/.

The frontend build (frontend/scripts/prerender-seo.mjs) turns these files into
per-route pages in build/. They're committed so the build doesn't need to reach
the backend: the production build on Emergent has never managed to fetch
/api/prerender, so it silently shipped without any per-route pages.

Run this after changing STATIC_ROUTES in seo_prerender.py or
frontend/src/data/services.json, and commit the result:

    python scripts/export_prerender_snapshot.py

tests/test_prerender_snapshot.py fails while the committed files are out of date.
No database is needed; blog posts and deals are still fetched live at build time.
"""
import argparse
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_OUT = BACKEND_DIR.parent / "frontend" / "seo-snapshot"

# The snapshot ships to production, so canonical and og:url must use the live
# host whatever backend/.env says. Set before seo_prerender reads it.
os.environ["SITE_BASE_URL"] = "https://fidelislogic.com"
sys.path.insert(0, str(BACKEND_DIR))

from seo_prerender import STATIC_ROUTES, render_seo_html  # noqa: E402


def snapshot_path(route: str) -> str:
    """'/' -> 'index.html', '/services/consulting' -> 'services/consulting.html'."""
    return "index.html" if route == "/" else route.strip("/") + ".html"


def write_snapshot(out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    for stale in out_dir.rglob("*.html"):
        stale.unlink()
    written = []
    for route in sorted(STATIC_ROUTES):
        target = out_dir / snapshot_path(route)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(render_seo_html(route, STATIC_ROUTES[route]), encoding="utf-8")
        written.append(target)
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    written = write_snapshot(args.out)
    print(f"Wrote {len(written)} routes to {args.out}")


if __name__ == "__main__":
    main()
