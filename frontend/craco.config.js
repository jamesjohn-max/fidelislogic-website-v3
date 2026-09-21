// craco.config.js
const path = require("path");
const { pathToFileURL } = require("url");
require("dotenv").config();

// Craco sets NODE_ENV=development for start and production for build.
const isDevServer = process.env.NODE_ENV !== "production";

const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
  enableVisualEdits:
    isDevServer && process.env.ENABLE_VISUAL_EDITS === "true",
};

const seoBaseUrl = (
  process.env.SEO_PRERENDER_BASE_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  ""
).replace(/\/+$/, "");

const crawlerPattern =
  /(googlebot|bingbot|duckduckbot|slurp|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|applebot|pinterestbot)/i;

function createSeoRoutingMiddleware() {
  return async (req, res, next) => {
    if (!seoBaseUrl || !["GET", "HEAD"].includes(req.method)) return next();

    const requestedUrl = new URL(req.originalUrl || req.url, "http://localhost");
    const routePath = requestedUrl.pathname;
    const isSitemap = routePath === "/sitemap.xml";
    const isCrawler = crawlerPattern.test(String(req.headers["user-agent"] || ""));
    const excluded =
      routePath.startsWith("/api/") ||
      routePath.startsWith("/admin") ||
      routePath.startsWith("/static/") ||
      routePath === "/robots.txt" ||
      routePath === "/favicon.ico" ||
      /\.[a-z0-9]{2,8}$/i.test(routePath);

    if (!isSitemap && (!isCrawler || excluded)) return next();

    const targetUrl = isSitemap
      ? seoBaseUrl + "/api/sitemap.xml"
      : seoBaseUrl + "/api/prerender?path=" + encodeURIComponent(routePath);

    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          Accept: isSitemap ? "application/xml,text/xml" : "text/html",
          "User-Agent": String(req.headers["user-agent"] || "FidelisLogic-SEO-Proxy"),
        },
      });

      // Unknown routes continue through the React SPA normally.
      if (!upstream.ok) return next();

      const body = Buffer.from(await upstream.arrayBuffer());
      res.statusCode = upstream.status;
      res.setHeader(
        "Content-Type",
        upstream.headers.get("content-type") ||
        (isSitemap ? "application/xml; charset=utf-8" : "text/html; charset=utf-8"),
      );
      res.setHeader("Cache-Control", "public, max-age=300");
      res.setHeader("Vary", "User-Agent");
      res.setHeader("Content-Length", String(body.length));

      if (req.method === "HEAD") return res.end();
      return res.end(body);
    } catch (error) {
      console.warn("SEO routing fallback:", error.message);
      return next();
    }
  };
}

// Writes the per-route SEO pages (scripts/prerender-seo.mjs) once a production
// build has emitted its files. It runs inside `craco build` rather than from a
// package.json script because Emergent's production build never ran either the
// `build && prerender` or the `postbuild` form, and it uses webpack's real
// output path in case the build goes somewhere other than build/.
// SEO_PRERENDER=0 skips it.
class SeoPrerenderPlugin {
  apply(compiler) {
    compiler.hooks.done.tapPromise("SeoPrerenderPlugin", async (stats) => {
      if (stats.hasErrors()) return;
      const script = pathToFileURL(path.join(__dirname, "scripts", "prerender-seo.mjs"));
      const { prerender, reportFailure } = await import(script.href);
      try {
        await prerender({ buildDir: compiler.options.output.path });
      } catch (error) {
        if (reportFailure(error)) throw error;
      }
    });
  }
}

let setupDevServer;
let babelMetadataPlugin;

if (config.enableVisualEdits) {
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
}

let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

const webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (webpackConfig, { env }) => {
      if (env === "production" && process.env.SEO_PRERENDER !== "0") {
        webpackConfig.plugins.push(new SeoPrerenderPlugin());
      }

      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/build/**",
          "**/dist/**",
          "**/coverage/**",
          "**/public/**",
        ],
      };

      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

if (config.enableVisualEdits && babelMetadataPlugin) {
  webpackConfig.babel = {
    plugins: [babelMetadataPlugin],
  };
}

webpackConfig.devServer = (devServerConfig) => {
  if (config.enableVisualEdits && setupDevServer) {
    devServerConfig = setupDevServer(devServerConfig);
  }

  const originalSetupMiddlewares = devServerConfig.setupMiddlewares;
  devServerConfig.setupMiddlewares = (middlewares, devServer) => {
    if (originalSetupMiddlewares) {
      middlewares = originalSetupMiddlewares(middlewares, devServer);
    }

    // Dev server only — production is a static build (see SeoPrerenderPlugin).
    // Put SEO routing ahead of the SPA fallback so crawlers receive
    // server-rendered metadata and /sitemap.xml returns the backend XML.
    middlewares.unshift({
      name: "fidelis-seo-routing",
      middleware: createSeoRoutingMiddleware(),
    });

    if (
      config.enableHealthCheck &&
      setupHealthEndpoints &&
      healthPluginInstance
    ) {
      setupHealthEndpoints(devServer, healthPluginInstance);
    }

    return middlewares;
  };

  return devServerConfig;
};

module.exports = webpackConfig;