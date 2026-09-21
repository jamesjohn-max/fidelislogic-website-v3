import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { NavMenu } from "./NavMenu";
import { analytics } from "../lib/analytics";
import { primaryNav } from "../data/navigation";
import { contactInfo } from "../data/siteContent";

// Two columns of links read better than one long list once a menu carries more
// than four destinations.
const panelWidthFor = (entry) => {
  const count = entry.groups.reduce((total, group) => total + group.items.length, 0);
  if (entry.id === "services") return "w-[640px]";
  return count > 4 ? "w-[560px]" : "w-[400px]";
};

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Which mobile group is expanded. One at a time keeps the menu scannable
  // instead of one long undifferentiated link list (blueprint section 4).
  const [openMobileGroup, setOpenMobileGroup] = useState(null);
  const location = useLocation();

  const isActive = (path) => {
    if (!path) return false;
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // A menu item is current when any of its destinations is.
  const isEntryActive = (entry) =>
    isActive(entry.href) ||
    entry.groups.some((group) => group.items.some((item) => isActive(item.href)));

  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenMobileGroup(null);
  }, [location.pathname]);

  // Tighter horizontal padding between lg and xl: six items plus the CTA leave
  // little room at ~1024px.
  const navLinkClass = (active) =>
    `px-2 xl:px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? "text-blue-700"
        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
    }`;

  const closeMobile = () => {
    setMobileMenuOpen(false);
    setOpenMobileGroup(null);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Primary">
        <div className="flex justify-between items-center h-20">
          {/* shrink-0: a crowded row squeezes the nav, never the logo. */}
          <Link to="/" className="flex shrink-0 items-center" aria-label="Fidelis Logic — home">
            <picture className="contents">
              <source type="image/webp" srcSet="/Logo_Color_Large.webp" />
              <img
                src="/Logo_Color_Large.png"
                alt="Fidelis Logic"
                width="220"
                height="40"
                className="h-10 w-auto"
              />
            </picture>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center space-x-0.5">
            {primaryNav.map((entry) => {
              const active = isEntryActive(entry);

              // Plain link (About) — no menu to open.
              if (!entry.groups.length) {
                return (
                  <Link
                    key={entry.id}
                    to={entry.href}
                    className={navLinkClass(active)}
                    data-testid={`nav-${entry.id}`}
                  >
                    {entry.label}
                  </Link>
                );
              }

              return (
                <NavMenu
                  key={entry.id}
                  label={entry.label}
                  triggerClassName={navLinkClass(active)}
                  panelClassName={panelWidthFor(entry)}
                  testId={`nav-${entry.id}`}
                >
                  {({ close }) => (
                    <>
                      <div className="p-3 space-y-3">
                        {entry.groups.map((group, groupIndex) => (
                          <div key={group.label || groupIndex}>
                            {group.label && (
                              <p className="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                                {group.label}
                              </p>
                            )}
                            <div
                              className={
                                group.items.length > 3
                                  ? "grid grid-cols-2 gap-1"
                                  : "grid gap-1"
                              }
                            >
                              {group.items.map((item) => (
                                <Link
                                  key={item.href}
                                  to={item.href}
                                  role="menuitem"
                                  onClick={close}
                                  className="group block px-3 py-2.5 rounded-lg hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
                                  data-testid={`nav-${entry.id}-item-${item.href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`}
                                >
                                  <span className="block text-sm font-semibold text-brand-dark group-hover:text-blue-700 leading-tight">
                                    {item.label}
                                  </span>
                                  {item.description && (
                                    <span className="block text-xs text-gray-500 mt-0.5 leading-snug">
                                      {item.description}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center justify-between gap-4">
                        <p className="text-xs text-gray-600">{entry.purpose}</p>
                        {entry.href && entry.overviewLabel && (
                          <Link
                            to={entry.href}
                            role="menuitem"
                            onClick={close}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                            data-testid={`nav-${entry.id}-overview`}
                          >
                            {entry.overviewLabel} →
                          </Link>
                        )}
                      </div>
                    </>
                  )}
                </NavMenu>
              );
            })}
          </div>

          {/* Persistent primary action */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              to="/contact"
              onClick={() =>
                analytics.consultationCtaClick({
                  location: "header_desktop",
                  source_path: location.pathname,
                })
              }
            >
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="nav-consultation-cta">
                Book a Consultation
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex h-11 w-11 items-center justify-center text-gray-700 hover:text-blue-600 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            data-testid="nav-mobile-toggle"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu — the same six items, grouped, each group collapsible. */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden py-4 border-t border-gray-100 max-h-[calc(100vh-5rem)] overflow-y-auto"
            data-testid="nav-mobile-menu"
          >
            {/* Book a Consultation stays a distinct action at the top, with Call
                directly beneath it (blueprint section 2). */}
            <div className="flex flex-col gap-2 pb-4 mb-3 border-b border-gray-100">
              <Link
                to="/contact"
                onClick={() => {
                  closeMobile();
                  analytics.consultationCtaClick({
                    location: "header_mobile",
                    source_path: location.pathname,
                  });
                }}
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Book a Consultation
                </Button>
              </Link>
              <a
                href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`}
                onClick={() => analytics.phoneClick({ location: "header_mobile" })}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                data-testid="nav-mobile-call"
              >
                <Phone size={16} aria-hidden="true" />
                {contactInfo.phone}
              </a>
            </div>

            <div className="flex flex-col space-y-1">
              {primaryNav.map((entry) => {
                const active = isEntryActive(entry);

                if (!entry.groups.length) {
                  return (
                    <Link
                      key={entry.id}
                      to={entry.href}
                      onClick={closeMobile}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        active
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                      data-testid={`nav-mobile-${entry.id}`}
                    >
                      {entry.label}
                    </Link>
                  );
                }

                const expanded = openMobileGroup === entry.id;
                return (
                  <div key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setOpenMobileGroup(expanded ? null : entry.id)}
                      aria-expanded={expanded}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        active
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                      data-testid={`nav-mobile-${entry.id}-trigger`}
                    >
                      {entry.label}
                      <ChevronDown
                        size={16}
                        aria-hidden="true"
                        className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {expanded && (
                      <div className="mt-1 ml-2 border-l-2 border-gray-100 pl-3 space-y-2 pb-2">
                        {entry.href && entry.overviewLabel && (
                          <Link
                            to={entry.href}
                            onClick={closeMobile}
                            className="block px-3 py-2 text-sm font-semibold text-blue-600 rounded-md hover:bg-blue-50"
                          >
                            {entry.overviewLabel}
                          </Link>
                        )}
                        {entry.groups.map((group, groupIndex) => (
                          <div key={group.label || groupIndex}>
                            {group.label && (
                              <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                                {group.label}
                              </p>
                            )}
                            {group.items.map((item) => (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={closeMobile}
                                className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
