import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getBrandsSorted } from "../data/brands";
import { PartnershipBadge } from "./PartnershipBadge";
import { BrandLogo } from "./BrandLogo";

/**
 * Section that surfaces the curated brand ecosystem. Used on the homepage
 * and (in detailed form) on the About page.
 *
 * Props:
 *  - title, subtitle: copy overrides
 *  - variant: "compact" (logo strip + link) | "detailed" (grid of cards)
 *  - background: "white" | "gray"
 */
export const TrustedBrands = ({
  title = "Our curated brand ecosystem",
  subtitle = "We partner deliberately with a short list of best-in-class platforms — chosen for outcomes, not quotas.",
  variant = "compact",
  background = "white",
  density = "default",
  testIdPrefix = "trusted-brands"
}) => {
  const brands = getBrandsSorted();
  const bgClass = background === "gray" ? "bg-gray-50" : "bg-white";
  const isTight = density === "tight";
  const sectionPadding = isTight
    ? "py-8 lg:py-10"
    : "py-16 lg:py-20";
  const headerSpacing = isTight ? "mb-5" : "mb-12";
  const headerLabelSpacing = isTight ? "mb-2" : "mb-3";
  const titleClass = isTight
    ? "text-xl sm:text-2xl font-bold text-brand-dark mb-2 leading-tight tracking-tight"
    : "text-3xl sm:text-4xl font-bold text-brand-dark mb-4 leading-tight tracking-tight";
  const subtitleClass = isTight
    ? "text-sm text-gray-600 leading-relaxed"
    : "text-lg text-gray-600 leading-relaxed";
  const cardClass = isTight
    ? "card-interactive group flex flex-col items-center justify-center min-h-[96px] px-4 py-3 bg-white border border-gray-200 rounded-xl"
    : "card-interactive group flex flex-col items-center justify-center min-h-[150px] px-6 py-8 bg-white border border-gray-200 rounded-2xl";
  const gridGap = isTight ? "gap-3 mb-5" : "gap-7 mb-10";

  return (
    <section className={`${sectionPadding} px-4 sm:px-6 lg:px-8 ${bgClass}`} data-testid={`${testIdPrefix}-section`}>
      {/* <div className="max-w-6xl mx-auto"> */}
<div className="max-w-7xl mx-auto">
        <div className={`max-w-3xl ${headerSpacing}`}>
          <p className={`section-label ${headerLabelSpacing}`}>
            Strategic partnerships
          </p>
          <h2 className={titleClass} data-testid={`${testIdPrefix}-title`}>
            {title}
          </h2>
          <p className={subtitleClass}>{subtitle}</p>
        </div>

        {variant === "compact" ? (
          <>
            {/* </> <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-10"> */}
              <div className={`w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 ${gridGap}`}>
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  to={`/brands/${brand.slug}`}
                 className={cardClass}
                 data-testid={`${testIdPrefix}-logo-${brand.slug}`}
                  title={`${brand.name} — ${brand.partnershipType}`}
                >
                  <div className="mb-2">
                    <BrandLogo
                      brand={brand}
                      size="md"
                      testId={`${testIdPrefix}-logo-img-${brand.slug}`}
                    />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full ${
                      brand.partnershipType === "Distribution Partner"
                        ? "bg-amber-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                    data-testid={`${testIdPrefix}-partnership-${brand.slug}`}
                  >
                    {brand.partnershipType !== "Distribution Partner" && (
                      <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                    )}
                    {brand.partnershipType === "Distribution Partner" ? "Distribution" : "Channel"}
                  </span>
                </Link>
              ))}
            </div>
            <div>
              <Link
                to="/brands"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                data-testid={`${testIdPrefix}-cta`}
              >
                Explore the full brand ecosystem
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  to={`/brands/${brand.slug}`}
                  className="card-interactive group bg-white border border-gray-200 rounded-2xl p-6 flex flex-col"
                  data-testid={`${testIdPrefix}-card-${brand.slug}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <BrandLogo
                      brand={brand}
                      size="md"
                      testId={`${testIdPrefix}-card-logo-${brand.slug}`}
                    />
                    {brand.featured && (
                      <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="mb-3">
                    <PartnershipBadge
                      type={brand.partnershipType}
                      size="xs"
                      testId={`${testIdPrefix}-detailed-partnership-${brand.slug}`}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    {brand.category}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1 mb-4">
                    {brand.shortDescription}
                  </p>
                  <div className="flex items-center text-sm text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform duration-200 ease-out-strong">
                    Learn more
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10">
              <Link
                to="/brands"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                data-testid={`${testIdPrefix}-cta`}
              >
                Visit the brand hub
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
