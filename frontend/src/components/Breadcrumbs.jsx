import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ChevronRight, Home } from "lucide-react";
import { hasPrerenderedSchema } from "../lib/prerenderedSchema";

/**
 * Breadcrumbs component with visible UI and BreadcrumbList JSON-LD for SEO.
 *
 * Usage:
 *   <Breadcrumbs
 *     items={[
 *       { name: "Solutions", href: "/solutions" },
 *       { name: "Meeting Rooms" }   // last item omits href (current page)
 *     ]}
 *   />
 *
 * `compact` drops the page-width container and padding and uses smaller text, for
 * trails that sit inside another bar (e.g. a tool's title bar).
 *
 * `tone` picks the ink for the surface the trail sits on: "light" for the site's
 * white and grey pages, "dark" for a dark surface such as the Room Planner's
 * title bar, where the default greys are unreadable.
 */
export const Breadcrumbs = ({ items = [], className = "", compact = false, tone = "light" }) => {
  if (!items.length) return null;

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const trail = [{ name: "Home", href: "/" }, ...items];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": trail.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.href ? { "item": `${base}${item.href}` } : {})
    }))
  };

  const dark = tone === "dark";
  const ink = {
    trail: dark ? "text-white/60" : "text-gray-600",
    link: dark
      ? "text-white/70 hover:text-white"
      : "text-gray-700 hover:text-brand-red",
    separator: dark ? "text-white/25" : "text-gray-400",
    current: dark ? "text-white" : "text-brand-dark",
  };

  return (
    <>
      {/* Skipped when the prerendered HTML already has this page's breadcrumbs */}
      {!hasPrerenderedSchema("BreadcrumbList") && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(schema)}</script>
        </Helmet>
      )}
      <nav
        aria-label="Breadcrumb"
        className={`${compact ? "" : "py-4"} ${className}`}
        data-testid="breadcrumbs-nav"
      >
        <div className={compact ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
          <ol className={`flex items-center flex-wrap gap-1.5 ${ink.trail} ${compact ? "text-xs" : "text-sm"}`}>
            {trail.map((item, index) => {
              const isLast = index === trail.length - 1;
              const isHome = index === 0;
              return (
                <li
                  key={`${item.name}-${index}`}
                  className="flex items-center gap-2"
                  data-testid={`breadcrumb-item-${index}`}
                >
                  {index > 0 && (
                    <ChevronRight
                      className={`w-4 h-4 ${ink.separator}`}
                      aria-hidden="true"
                    />
                  )}
                  {isLast || !item.href ? (
                    <span
                      className={`font-semibold ${ink.current}`}
                      aria-current="page"
                      data-testid={`breadcrumb-current`}
                    >
                      {item.name}
                    </span>
                  ) : (
                    <Link
                      to={item.href}
                      className={`${ink.link} transition-colors flex items-center gap-1.5`}
                      data-testid={`breadcrumb-link-${index}`}
                    >
                      {isHome && <Home className="w-4 h-4" aria-hidden="true" />}
                      {!isHome && item.name}
                      {isHome && <span className="sr-only">{item.name}</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
};
