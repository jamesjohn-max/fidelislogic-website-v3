# SEO Pre-render — how it works and how to enable it in production

## What it does
Public marketing routes are pre-rendered on the server so that crawlers and
social scrapers receive route-specific `<title>`, `<meta name="description">`,
canonical URL, OG tags, JSON-LD schema, `<h1>` and a summary paragraph
**before** JavaScript hydration.

Routes covered:

| Route pattern | Type |
|---|---|
| `/` | Static |
| `/solutions` | Static |
| `/solutions/<slug>` (meeting-rooms, headsets, workspace-experience, business-apps) | Static |
| `/services` | Static, from `services.json` |
| `/services/<slug>` (all 8 services) | Static, from `services.json` |
| `/brands` | Static |
| `/brands/<slug>` (roomz, morbit, jabra, poly, neat, yealink, logitech) | Static |
| `/blog` | Static (plus links to every published post when built with a live backend) |
| `/blog/<slug>` | Dynamic (any published blog post) |
| `/about`, `/contact`, `/tools/room-configurator` | Static |
| `/deals` | Static (plus links to current deals when built with a live backend) |
| `/deals/<slug>` | Dynamic (any published deal) |

Source of truth: `/app/backend/seo_prerender.py` — extend `STATIC_ROUTES` to
add more static pages. `backend/tests/test_prerender_snapshot.py` fails if a
public route in `frontend/src/App.js` has no entry.

The `/services` routes are generated from `frontend/src/data/services.json`,
the same file the React service pages render, so edit service copy there and
both stay in step. The backend reads it from `../frontend/src/data/services.json`
relative to `backend/` (override with `SERVICES_JSON_PATH`). If the file is
missing, the service routes are simply not pre-rendered.

Every JSON-LD block the build-time prerender (`frontend/scripts/prerender-seo.mjs`)
injects is tagged `data-prerender="<route>"`. React's `StructuredData`,
`Breadcrumbs` and `FAQSchema` components skip any schema type already present
for the current URL, so a page never carries two copies (Google flags a
duplicate `FAQPage` as an error).

Page titles are kept identical between `STATIC_ROUTES` and the React pages
(`frontend/src/data/seoConfig.js`, which omits the brand because `SEO.jsx`
appends ` | Fidelis Logic`).

## API

```
GET /api/prerender?path=/solutions/business-apps
    → 200 text/html   Full HTML shell with SEO tags baked in
    → 404             Path is not in the pre-render registry

GET /api/prerender/routes
    → 200 application/json   Lists all static + dynamic (published blog) routes
```

Quick check:
```bash
curl -s "$REACT_APP_BACKEND_URL/api/prerender?path=/brands/roomz" | head -30
```

## Wiring it up in production

The React app still owns the browser experience. Only bot traffic needs the
pre-rendered HTML. Route bot User-Agents at the edge to the `/api/prerender`
endpoint.

### Option 1 — Nginx (simplest)

```nginx
# In your server{} block, before the SPA fallback:
map $http_user_agent $is_bot {
    default 0;
    ~*(googlebot|bingbot|duckduckbot|slurp|baiduspider|yandexbot) 1;
    ~*(facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot) 1;
    ~*(slackbot|discordbot|applebot|pinterestbot) 1;
}

location / {
    if ($is_bot) {
        rewrite ^ /api/prerender?path=$uri last;
    }
    try_files $uri $uri/ /index.html;
}
```

### Option 2 — Cloudflare Worker

```js
export default {
  async fetch(request, env) {
    const ua = (request.headers.get("user-agent") || "").toLowerCase();
    const isBot = /(googlebot|bingbot|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp)/.test(ua);
    const url = new URL(request.url);

    if (isBot && !url.pathname.startsWith("/api/")) {
      const prerenderUrl = new URL(url.origin + "/api/prerender");
      prerenderUrl.searchParams.set("path", url.pathname);
      return fetch(prerenderUrl.toString());
    }
    return fetch(request);
  }
}
```

### Option 3 — Static build-time pre-render (RECOMMENDED)

Removes the need for edge bot detection entirely. Every visitor — human or
crawler — gets a fully SEO-populated HTML file straight from Nginx.

It runs inside `craco build` itself: `SeoPrerenderPlugin` in
`frontend/craco.config.js` calls it once webpack has written the production
build, using webpack's actual output directory. Earlier versions ran it from
`package.json` (`build && prerender`, then `postbuild`), and Emergent's
production build never ran either. `SEO_PRERENDER=0` (`yarn build:no-prerender`)
skips it.

What `scripts/prerender-seo.mjs` does:
1. Reads the compiled `build/index.html` (contains the React bundle links).
2. Reads the pre-rendered HTML for every static route from the committed
   `frontend/seo-snapshot/` — no network needed. (The production build on
   Emergent has never been able to reach the backend, which is why production
   used to ship without any per-route pages.)
3. Looks for a live backend — `REACT_APP_BACKEND_URL` (from `frontend/.env`),
   then `https://fidelislogic.com` — and, if one answers, adds every published
   blog post and deal from `GET /api/prerender/routes`, and the `/blog` and
   `/deals` link lists.
4. For each route, extracts the SEO fragments (title, meta description,
   canonical, OG/Twitter, JSON-LD, and the visible H1 + summary block). Meta
   and canonical tags get `data-rh="true"` so react-helmet replaces them
   rather than adding duplicates; JSON-LD is left unmarked.
5. Merges those fragments into a copy of the build shell and writes it to
   both `build/<route>/index.html` and `build/<route>.html`, so hosts that
   resolve `/about` either way serve it.

`build/index.html` is both the home page and the SPA fallback for any URL
without its own page. When no backend was reachable, blog posts and deals fall
back to it, so the home page is written without its canonical and `og:url`
rather than have them all claim to be the home page.

The shell (`public/index.html`) hides `#__seo_prerender` once JavaScript runs,
so visitors don't see the plain-HTML block flash before React renders; crawlers
and visitors without JavaScript see it, plus the `<noscript>` site links.

### Regenerating the snapshot

After editing `STATIC_ROUTES` or `frontend/src/data/services.json`:

```bash
cd backend && ./venv/bin/python scripts/export_prerender_snapshot.py
```

Commit the changed files under `frontend/seo-snapshot/`.
`backend/tests/test_prerender_snapshot.py` fails while they are stale.

Run it manually (after a build) if you only want to refresh the SEO pages:
```bash
cd frontend && yarn prerender
```

Environment overrides:
- `REACT_APP_BACKEND_URL` (preferred) — the URL of the running FastAPI backend
- `API_BASE_URL` / `SEO_PRERENDER_BASE_URL` — accepted aliases

Result — a browsable `build/` tree:
```
build/index.html                                        ← "/"  (with SEO baked in)
build/solutions/index.html
build/solutions/business-apps/index.html
build/brands/roomz/index.html
build/blog/index.html
build/blog/<slug>/index.html                            ← one per published post
```

Nginx's existing SPA fallback (`try_files $uri $uri/ /index.html`) resolves every
route to its per-route SEO'd file automatically.

Regenerating for new blog posts: run `yarn prerender` again after publishing —
no rebuild required (the compiled JS bundle is unchanged).

## Testing without deploying

Use curl with any User-Agent to see exactly what Google/Facebook will see:

```bash
API="$REACT_APP_BACKEND_URL"

# Every static route
for p in "/" "/solutions" "/solutions/business-apps" "/brands/roomz" "/blog"; do
  echo "=== $p ==="
  curl -s "$API/api/prerender?path=$p" \
    | grep -E "<title>|<meta name=\"description\"|canonical|<h1>" | head -5
done

# A dynamic blog post
curl -s "$API/api/prerender?path=/blog/teams-rooms-vs-zoom-rooms-2025" \
  | python3 -c "import sys, re; h=sys.stdin.read(); \
      print('title:', re.search(r'<title>(.*?)</title>', h).group(1)); \
      print('JSON-LD blocks:', h.count('application/ld+json'))"
```

## Adding more static routes

Edit `/app/backend/seo_prerender.py` → add an entry to `STATIC_ROUTES`:

```python
"/solutions/meeting-rooms": {
    "title": "...",
    "description": "...",
    "canonical": "/solutions/meeting-rooms",
    "h1": "...",
    "summary": "...",
    "og_type": "website",
    "keywords": ["..."],
    "structured_data": [ ... ],
},
```
Reload the backend (`sudo supervisorctl restart backend`) and you're done.
