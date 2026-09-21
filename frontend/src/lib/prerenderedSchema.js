// Structured data the static HTML already carries for this URL.
//
// scripts/prerender-seo.mjs bakes route-specific JSON-LD into each page's
// <head> and tags every block with data-prerender="<route>". When a visitor
// (or crawler) lands on such a page, the React components that would emit the
// same schema type skip it, so the page never carries two copies. Blocks left
// over from the page first loaded, before client-side navigation, carry a
// different route and are ignored.

const normalisePath = (path) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

export const hasPrerenderedSchema = (type) => {
  if (typeof document === "undefined" || !type) return false;
  const path = normalisePath(window.location.pathname);
  return Array.from(
    document.querySelectorAll('script[type="application/ld+json"][data-prerender]')
  ).some((el) => {
    if (normalisePath(el.getAttribute("data-prerender") || "") !== path) return false;
    try {
      return JSON.parse(el.textContent)["@type"] === type;
    } catch {
      return false;
    }
  });
};
