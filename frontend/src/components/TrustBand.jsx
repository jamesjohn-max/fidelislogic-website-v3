import { Link } from "react-router-dom";
import { ArrowRight, Award, CalendarClock, GanttChartSquare, MapPin } from "lucide-react";
import { trustPoints, certifiedBrands } from "../data/trust";
import { getBrandBySlug } from "../data/brands";
import { BrandLogo } from "./BrandLogo";
import { BlurFade } from "./magicui/blur-fade";
import { NumberTicker } from "./magicui/number-ticker";

const icons = { Award, CalendarClock, GanttChartSquare, MapPin };

/**
 * Reusable proof component (blueprint section 4, "Trust band").
 *
 * Renders only the evidence approved in data/trust.js: years of experience,
 * project-management certification, technical certifications in the five named
 * brands, and the brand logos themselves. It deliberately states no
 * certification level, partnership tier, territory or exclusivity — see the
 * warning at the top of data/trust.js before adding anything here.
 *
 * Props:
 *  - variant: "full" (proof cards + logo strip + links) | "strip" (logos + one line)
 *  - background: "white" | "gray" | "dark"
 *  - showLinks: render the About / Brands links under the band
 */
export const TrustBand = ({
  variant = "full",
  background = "gray",
  heading = "Experience and certifications behind the advice",
  subheading = "Two decades of modern workplace projects, certified project management, and hands-on technical certification in the platforms we recommend.",
  showLinks = true,
  testIdPrefix = "trust-band"
}) => {
  const isDark = background === "dark";
  const bgClass =
    background === "gray" ? "bg-gray-50" : isDark ? "bg-brand-dark" : "bg-white";
  const brands = certifiedBrands.map(getBrandBySlug).filter(Boolean);

  return (
    <section
      className={`${variant === "strip" ? "py-10 lg:py-12" : "py-16 lg:py-20"} px-4 sm:px-6 lg:px-8 ${bgClass}`}
      data-testid={`${testIdPrefix}-section`}
      aria-label="Experience and certifications"
    >
      <div className="max-w-7xl mx-auto">
        {variant === "full" && (
          <div className="max-w-3xl mb-10">
            <p className={`section-label mb-3 ${isDark ? "!text-fidelis-cyan" : ""}`}>
              Evidence
            </p>
            <h2
              className={`text-3xl sm:text-4xl font-bold tracking-tight leading-tight ${
                isDark ? "text-white" : "text-brand-dark"
              }`}
              data-testid={`${testIdPrefix}-title`}
            >
              {heading}
            </h2>
            {subheading && (
              <p
                className={`mt-4 text-lg leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {subheading}
              </p>
            )}
          </div>
        )}

        {variant === "full" && (
          <dl className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {trustPoints.map((point, index) => {
              const Icon = icons[point.icon] || Award;
              return (
                // BlurFade is the grouping div itself, so <dl> > div > dt/dd
                // stays valid markup. Staggered 80ms per card.
                <BlurFade
                  key={point.id}
                  inView
                  delay={index * 0.08}
                  className={`rounded-2xl border p-6 ${
                    isDark
                      ? "border-white/15 bg-white/[0.04]"
                      : "border-gray-200 bg-white"
                  }`}
                  data-testid={`${testIdPrefix}-point-${point.id}`}
                >
                  <span
                    className={`inline-flex w-11 h-11 items-center justify-center rounded-lg mb-4 ${
                      isDark ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <dt
                    className={`text-2xl font-bold tracking-tight ${
                      isDark ? "text-white" : "text-brand-dark"
                    }`}
                  >
                    {point.count != null ? (
                      <>
                        <NumberTicker value={point.count} />
                        {point.suffix}
                      </>
                    ) : (
                      point.value
                    )}
                  </dt>
                  <dd
                    className={`mt-1.5 text-sm leading-relaxed ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {point.label}
                  </dd>
                </BlurFade>
              );
            })}
          </dl>
        )}

        {/* Certified-brand logo strip. Each logo links to its brand page so the
            claim can be checked against the page that explains the relationship. */}
        {brands.length > 0 && (
          <>
            <p
              className={`text-sm font-medium mb-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Technical certifications in
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
              {brands.map((brand) => (
                <li key={brand.slug}>
                  <Link
                    to={`/brands/${brand.slug}`}
                    className={`card-interactive flex items-center justify-center min-h-[80px] px-4 py-3 rounded-xl border ${
                      isDark
                        ? "border-white/15 bg-white"
                        : "border-gray-200 bg-white"
                    }`}
                    data-testid={`${testIdPrefix}-brand-${brand.slug}`}
                    title={`${brand.name} solutions`}
                  >
                    <BrandLogo
                      brand={brand}
                      size="md"
                      testId={`${testIdPrefix}-brand-logo-${brand.slug}`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {showLinks && (
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <Link
              to="/about"
              className={`inline-flex items-center gap-2 font-semibold ${
                isDark
                  ? "text-fidelis-cyan hover:text-white"
                  : "text-blue-600 hover:text-blue-700"
              }`}
              data-testid={`${testIdPrefix}-about-link`}
            >
              How we work
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/brands"
              className={`inline-flex items-center gap-2 font-semibold ${
                isDark
                  ? "text-fidelis-cyan hover:text-white"
                  : "text-blue-600 hover:text-blue-700"
              }`}
              data-testid={`${testIdPrefix}-brands-link`}
            >
              Brands we deliver
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
