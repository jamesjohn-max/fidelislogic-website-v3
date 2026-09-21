import { useMemo } from "react";
import { HeroCarousel } from "./HeroCarousel";
import { ScrollProgress } from "./magicui/scroll-progress";

const factColumns = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4"
};

/**
 * Full-bleed photo hero for detail pages (solution and service pages), with an
 * optional quick-facts bar overlapping its bottom edge.
 *
 * Props:
 *  - image / imagePosition: responsive basePath built by optimize-images.sh and
 *    the focal point to keep in frame
 *  - icon / label: small chip above the headline
 *  - title, subtitle, actions: headline, one short supporting line, CTAs
 *  - facts: [{ label, value, helper? }] rendered in the overlapping bar
 */
export const DetailHero = ({
  image,
  imagePosition = "center",
  icon: Icon,
  label,
  title,
  subtitle,
  actions,
  facts = [],
  testId
}) => {
  // HeroCarousel restarts its timer whenever `images` changes identity.
  const slides = useMemo(
    () => [{ basePath: image, objectPosition: imagePosition }],
    [image, imagePosition]
  );

  return (
    <>
      {/* Reading progress, just under the fixed header. Brand blue into cyan,
          not the library's default purple/pink. */}
      <ScrollProgress className="top-20 z-40 h-0.5 from-blue-600 via-blue-500 to-fidelis-cyan" />
      <section
        className={`relative min-h-[460px] lg:min-h-[520px] flex items-center pt-10 px-4 sm:px-6 lg:px-8 overflow-hidden ${
          facts.length > 0 ? "pb-24" : "pb-16"
        }`}
      >
        <HeroCarousel images={slides} testId={testId ? `${testId}-carousel` : undefined} />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/85 via-black/60 to-black/20 lg:via-black/50 lg:to-black/5" />

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-2xl" data-testid={testId}>
            {label && (
              <div className="inline-flex items-center gap-2.5 mb-5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                {Icon && (
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white inline-flex items-center justify-center">
                    <Icon size={15} aria-hidden="true" />
                  </span>
                )}
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
            )}
            <h1
              className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-5 drop-shadow-[0_4px_18px_rgba(0,0,0,0.65)]"
              data-testid={testId ? `${testId}-title` : undefined}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg sm:text-xl text-gray-100 leading-relaxed mb-8 max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                {subtitle}
              </p>
            )}
            {actions && <div className="flex flex-col sm:flex-row gap-3 [&>*]:w-full sm:[&>*]:w-auto [&_button]:w-full sm:[&_button]:w-auto">{actions}</div>}
          </div>
        </div>
      </section>

      {facts.length > 0 && (
        <div className="relative z-10 -mt-14 px-4 sm:px-6 lg:px-8">
          <dl
            className={`max-w-7xl mx-auto grid ${factColumns[facts.length] || "md:grid-cols-3"} divide-y md:divide-y-0 md:divide-x divide-gray-200 rounded-2xl bg-white border border-gray-200 shadow-xl shadow-gray-900/10`}
            data-testid={testId ? `${testId}-facts` : undefined}
          >
            {facts.map((fact) => (
              <div key={fact.label} className="px-6 py-5 lg:px-8 lg:py-6">
                <dt className="text-sm font-medium text-gray-500 mb-1">{fact.label}</dt>
                <dd className="text-base font-semibold text-brand-dark leading-snug">{fact.value}</dd>
                {fact.helper && <dd className="mt-0.5 text-sm text-gray-500">{fact.helper}</dd>}
              </div>
            ))}
          </dl>
        </div>
      )}
    </>
  );
};
