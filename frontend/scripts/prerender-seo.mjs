#!/usr/bin/env node
/**
 * frontend/scripts/prerender-seo.mjs
 *
 * Post-build SEO prerender.
 *
 * Reads `build/index.html` (the compiled CRA shell with the React bundle),
 * merges each route's SEO tags into it, and writes per-route
 * `build/<route>/index.html` and `build/<route>.html` files. The static host
 * then serves every visitor — including crawlers — the correct title, meta
 * description, canonical, OG/Twitter tags, JSON-LD schema, and an H1 +
 * summary before any JavaScript runs. React renders on top as normal.
 *
 * Static routes come from the committed `seo-snapshot/` (no network needed).
 * Blog posts, deals and the /blog and /deals link lists come from the live
 * backend's `/api/prerender` when one is reachable at build time.
 *
 * Usage
 * -----
 *   yarn build / craco build                    # runs automatically (craco.config.js)
 *   node scripts/prerender-seo.mjs [buildDir]   # re-run against an existing build
 *
 * Requirements: Node 18+ (uses global `fetch`), builds already generated.
 */

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = path.resolve(__dirname, "..");
const DEFAULT_BUILD_DIR = path.join(FRONTEND_DIR, "build");
const DOTENV_PATH = path.join(FRONTEND_DIR, ".env");

// Load .env manually — yarn doesn't inject it for arbitrary node scripts.
if (fsSync.existsSync(DOTENV_PATH)) {
  const dotenv = fsSync.readFileSync(DOTENV_PATH, "utf8");
  for (const line of dotenv.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

// Pre-rendered HTML for every static route, exported from the backend by
// backend/scripts/export_prerender_snapshot.py (see seo-snapshot/README.md).
const SNAPSHOT_DIR = path.join(FRONTEND_DIR, "seo-snapshot");

const API_BASE =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.API_BASE_URL ||
  process.env.SEO_PRERENDER_BASE_URL;
// Tried after API_BASE for the database-backed routes.
const PUBLIC_SITE_URL = "https://fidelislogic.com";
// Snapshot routes the live backend enriches with links from the database.
const LIVE_HUBS = new Set(["/blog", "/deals"]);

// Strict mode = fail the build on prerender errors. Off by default so
// production deploys never break just because the currently-running
// backend hasn't caught up with new SEO endpoints yet. First deploy after
// wiring this up will simply skip prerender; the next deploy (with the
// updated backend live) will produce the SEO files as expected.
const STRICT = /^(1|true|yes)$/i.test(process.env.SEO_PRERENDER_STRICT || "");

// Timings and safety
const FETCH_TIMEOUT_MS = 15_000;
const MAX_CONCURRENCY = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(msg) {
  process.stdout.write(msg + "\n");
}

/**
 * Report a prerender that couldn't run. Returns true when the build should
 * fail (SEO_PRERENDER_STRICT=1); otherwise it warns so a prerender problem
 * never blocks a deploy — the plain React SPA is served instead.
 */
export function reportFailure(err) {
  const msg = err?.message || String(err);
  if (STRICT) {
    process.stderr.write(`${c.red}✗ SEO prerender failed: ${msg}${c.reset}\n`);
    return true;
  }
  process.stderr.write(
    `${c.yellow}!${c.reset}  SEO prerender failed: ${msg}\n` +
      `${c.dim}   Continuing without prerender output — the plain React SPA will be served.` +
      `\n   To make this failure fatal, set SEO_PRERENDER_STRICT=1.${c.reset}\n`,
  );
  return false;
}

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url) {
  const res = await fetchWithTimeout(url);
  return res.json();
}

async function fetchText(url) {
  const res = await fetchWithTimeout(url);
  return res.text();
}

// ---------------------------------------------------------------------------
// HTML parsing / injection
// ---------------------------------------------------------------------------

/**
 * Pull the SEO-relevant pieces out of the /api/prerender HTML response.
 * We only take what we need — leaving CRA's own asset <script> and <link>
 * tags alone so the compiled bundle keeps working.
 */
function extractSeoFragments(prerenderHtml) {
  const grab = (re) => {
    const m = prerenderHtml.match(re);
    return m ? m[0] : "";
  };
  const grabAll = (re) => [...prerenderHtml.matchAll(re)].map((m) => m[0]);
  const grabInner = (re) => {
    const m = prerenderHtml.match(re);
    return m ? m[1] : "";
  };

  return {
    title: grabInner(/<title>([\s\S]*?)<\/title>/i),
    metaTags: grabAll(
      /<meta\s+(?:name|property)="(?:description|keywords|robots|author|og:[^"]+|twitter:[^"]+)"[^>]*\/?>/gi,
    ),
    canonical: grab(/<link\s+rel="canonical"[^>]*\/?>/i),
    jsonLdScripts: grabAll(
      /<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
    ),
    seoBody: grab(/<main\s+id="__seo_prerender"[\s\S]*?<\/main>/i),
  };
}

/**
 * Given the compiled build/index.html shell and extracted SEO fragments,
 * return a new HTML string with everything merged.
 */
function mergeIntoShell(shell, seo, route) {
  let html = shell;

  // Tag each JSON-LD block with the route it describes. The React app checks
  // this (see src/components/FAQSchema.jsx) so it does not emit a second copy
  // of structured data the static HTML already carries for the current URL.
  const routeAttr = route.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const jsonLdScripts = seo.jsonLdScripts.map((tag) =>
    tag.replace(
      /^<script\s+type="application\/ld\+json"/i,
      `<script type="application/ld+json" data-prerender="${routeAttr}"`,
    ),
  );

  // ---- <title> ----
  if (seo.title) {
    if (/<title>[\s\S]*?<\/title>/i.test(html)) {
      html = html.replace(
        /<title>[\s\S]*?<\/title>/i,
        `<title>${seo.title}</title>`,
      );
    } else {
      html = html.replace(/<\/head>/i, `<title>${seo.title}</title></head>`);
    }
  }

  // ---- Remove stale head tags we're about to replace ----
  // Match the attribute anywhere in the tag: the shell's fallback og:image
  // tags lead with data-rh="true", and must not survive next to the route's.
  html = html
    .replace(/<meta\b[^>]*\sname="(?:description|keywords|robots)"[^>]*>/gi, "")
    .replace(/<meta\b[^>]*\sproperty="og:[^"]+"[^>]*>/gi, "")
    .replace(/<meta\b[^>]*\sname="twitter:[^"]+"[^>]*>/gi, "")
    .replace(/<link\b[^>]*\srel="canonical"[^>]*>/gi, "");

  // ---- Build injection block for <head> ----
  // data-rh hands the meta and canonical tags to react-helmet, which replaces
  // them with its own once the page renders; unmarked, they would stay beside
  // Helmet's and the page would carry two canonicals, two descriptions, etc.
  // JSON-LD stays unmarked: Helmet would delete it, and the React schema
  // components already skip types that are prerendered for this URL.
  const helmetOwned = (tag) => tag.replace(/^<(meta|link)\s/i, '<$1 data-rh="true" ');
  const headInject = [
    ...seo.metaTags.map(helmetOwned),
    seo.canonical && helmetOwned(seo.canonical),
    ...jsonLdScripts,
  ]
    .filter(Boolean)
    .join("\n    ");

  html = html.replace(
    /<\/head>/i,
    `    ${headInject}\n  </head>`,
  );

  // ---- Inject visible SEO block inside <div id="root"> ----
  // React will replace #root on hydration, so real users never see the block.
  // Crawlers and non-JS clients see the H1 + summary.
  if (seo.seoBody && /<div id="root">/i.test(html)) {
    html = html.replace(
      /<div id="root">/i,
      `<div id="root">${seo.seoBody}`,
    );
  }

  return html;
}

/**
 * Convert a route like "/solutions/business-apps" to its on-disk output paths,
 * "build/solutions/business-apps/index.html" and
 * "build/solutions/business-apps.html". Static hosts differ in which one they
 * serve for the extensionless URL (nginx's `$uri/` vs "clean URL" hosts'
 * `$uri.html`), so both are written. Root ("/") overwrites "build/index.html"
 * so a crawler hitting the site root gets SEO immediately.
 */
function routeToOutputPaths(buildDir, route) {
  if (route === "/") return [path.join(buildDir, "index.html")];
  const clean = route.replace(/^\//, "").replace(/\/$/, "");
  return [
    path.join(buildDir, clean, "index.html"),
    path.join(buildDir, `${clean}.html`),
  ];
}

/**
 * Map every page in seo-snapshot/ to its route: "index.html" → "/",
 * "services/consulting.html" → "/services/consulting".
 */
async function readSnapshot() {
  const pages = new Map();
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.name.endsWith(".html")) {
        const rel = path.relative(SNAPSHOT_DIR, full).split(path.sep).join("/");
        const route = rel === "index.html" ? "/" : `/${rel.replace(/\.html$/, "")}`;
        pages.set(route, await fs.readFile(full, "utf8"));
      }
    }
  }
  await walk(SNAPSHOT_DIR);
  return new Map([...pages].sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Find a backend that answers /api/prerender/routes: the configured one first,
 * then the public site. Returns null when neither responds, in which case the
 * database-backed routes (blog posts, deals) are left to the SPA fallback.
 */
async function findLiveBackend() {
  const candidates = [
    ...new Set(
      [API_BASE, PUBLIC_SITE_URL].filter(Boolean).map((url) => url.replace(/\/+$/, "")),
    ),
  ];
  for (const base of candidates) {
    try {
      const payload = await fetchJson(`${base}/api/prerender/routes`);
      log(`   Live backend: ${c.dim}${base}${c.reset}`);
      return { base, dynamicRoutes: payload.dynamic_routes || [] };
    } catch (err) {
      log(`   ${c.yellow}!${c.reset} ${base} unreachable ${c.dim}${err.message}${c.reset}`);
    }
  }
  log(
    `   ${c.yellow}!${c.reset} No backend reachable — ` +
      `blog posts and deals are not prerendered in this build`,
  );
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Write the per-route pages into `buildDir`. Runs inside `craco build` (see
 * craco.config.js) and from the command line. Throws when it can't run at all;
 * per-route failures are logged and only thrown in strict mode.
 */
export async function prerender({ buildDir = DEFAULT_BUILD_DIR } = {}) {
  log(`${c.cyan}▶${c.reset}  SEO prerender starting ${c.dim}(${buildDir})${c.reset}`);
  const indexHtmlPath = path.join(buildDir, "index.html");
  // Pristine shell snapshot. The first run copies the freshly built index.html
  // here; later runs merge from this copy, so re-running is idempotent.
  const shellSnapshotPath = path.join(buildDir, "_shell.html");

  let shell;
  try {
    // If a snapshot already exists (previous run), use it — it's guaranteed
    // to be un-injected.
    shell = await fs.readFile(shellSnapshotPath, "utf8");
    log(`   ${c.dim}Using existing pristine shell snapshot${c.reset}`);
  } catch {
    // No snapshot yet. Read the current index.html (pristine straight out of
    // the build) and save it for reuse.
    try {
      shell = await fs.readFile(indexHtmlPath, "utf8");
    } catch {
      throw new Error(`${indexHtmlPath} not found. Build the app first.`);
    }
    if (/<main\s+id="__seo_prerender"/i.test(shell)) {
      throw new Error(
        `${indexHtmlPath} already contains SEO injections but no _shell.html snapshot is present. ` +
          `Run \`yarn build\` to regenerate a clean shell.`,
      );
    }
    await fs.writeFile(shellSnapshotPath, shell, "utf8");
    log(`   ${c.dim}Snapshotted pristine shell to _shell.html${c.reset}`);
  }

  // Static routes come from the committed snapshot, so they are prerendered
  // even when the build can't reach the backend.
  const snapshot = await readSnapshot();
  if (snapshot.size === 0) {
    throw new Error(`No pages found in ${path.relative(FRONTEND_DIR, SNAPSHOT_DIR)}/.`);
  }

  // Blog posts and deals live in the database, so they need a live backend.
  const live = await findLiveBackend();
  const dynamicRoutes = live
    ? live.dynamicRoutes.filter((route) => !snapshot.has(route))
    : [];
  const allRoutes = [...snapshot.keys(), ...dynamicRoutes];
  log(
    `   ${allRoutes.length} routes queued ` +
      `${c.dim}(${snapshot.size} from snapshot + ${dynamicRoutes.length} live)${c.reset}`,
  );

  async function prerenderHtmlFor(route) {
    if (live && (LIVE_HUBS.has(route) || !snapshot.has(route))) {
      try {
        return await fetchText(
          `${live.base}/api/prerender?path=${encodeURIComponent(route)}`,
        );
      } catch (err) {
        if (!snapshot.has(route)) throw err;
      }
    }
    return snapshot.get(route);
  }

  // build/index.html is the home page and also what the host serves for any
  // URL without a page of its own. Without a live backend, that includes every
  // blog post and deal, so leave the home page's canonical and og:url out
  // rather than have all of them claim to be the home page.
  const homeIsFallbackForContent = !live;

  // Prerender each route with bounded concurrency.
  let ok = 0;
  let fail = 0;
  const failures = [];

  const queue = [...allRoutes];
  async function worker(id) {
    while (queue.length) {
      const route = queue.shift();
      try {
        const prerenderHtml = await prerenderHtmlFor(route);
        const seo = extractSeoFragments(prerenderHtml);
        if (route === "/" && homeIsFallbackForContent) {
          seo.canonical = "";
          seo.metaTags = seo.metaTags.filter((tag) => !/property="og:url"/i.test(tag));
          log(`   ${c.yellow}!${c.reset} / written without canonical/og:url (it is the fallback for blog posts and deals)`);
        }
        const finalHtml = mergeIntoShell(shell, seo, route);
        for (const outPath of routeToOutputPaths(buildDir, route)) {
          await fs.mkdir(path.dirname(outPath), { recursive: true });
          await fs.writeFile(outPath, finalHtml, "utf8");
        }
        log(`   ${c.green}✓${c.reset} ${route}`);
        ok++;
      } catch (err) {
        failures.push({ route, error: err.message });
        log(`   ${c.red}✗${c.reset} ${route} ${c.dim}${err.message}${c.reset}`);
        fail++;
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(MAX_CONCURRENCY, allRoutes.length) },
    (_, i) => worker(i),
  );
  await Promise.all(workers);

  // build/sitemap.xml comes from public/sitemap.xml — a sitemap index pointing
  // at the live /api/sitemap.xml. Don't overwrite it with a snapshot here: a
  // build-time copy would miss every blog post published after the deploy.

  log("");
  log(
    `${c.cyan}▶${c.reset}  SEO prerender complete — ${c.green}${ok} written${c.reset}` +
      (fail ? `, ${c.red}${fail} failed${c.reset}` : ""),
  );

  if (fail > 0) {
    log(`${c.yellow}Failures:${c.reset}`);
    for (const f of failures) {
      log(`   ${c.red}✗${c.reset} ${f.route} — ${f.error}`);
    }
    // Per-route failures are non-fatal unless STRICT — deploy should proceed
    // with whatever routes succeeded.
    if (STRICT) throw new Error(`${fail} route(s) failed to prerender`);
  }
}

// `node scripts/prerender-seo.mjs [buildDir]` re-runs it against an existing build.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const buildDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_BUILD_DIR;
  prerender({ buildDir }).catch((err) => {
    if (reportFailure(err)) process.exit(1);
  });
}
