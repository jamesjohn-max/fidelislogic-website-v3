# SEO snapshot — generated, do not edit

Pre-rendered HTML for every static public route, written by
`backend/scripts/export_prerender_snapshot.py` from `backend/seo_prerender.py`
and `src/data/services.json`. `scripts/prerender-seo.mjs` merges these into the
compiled shell at build time, so every route's first HTML response carries its
own title, description, canonical, Open Graph tags, JSON-LD, H1 and summary,
without the build needing to reach the backend.

After changing either source, regenerate and commit:

```bash
cd backend && ./venv/bin/python scripts/export_prerender_snapshot.py
```

`backend/tests/test_prerender_snapshot.py` fails while these files are stale.
