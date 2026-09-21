import { ResponsiveImage } from "./ResponsiveImage";

/**
 * Hero for hub and utility pages (Solutions, Services, Brands, About, Contact,
 * Blog, Smart Deals, the audience pages). Left-aligned to the same max-w-7xl
 * container as the breadcrumbs above it, so every hub page starts from the
 * same edge.
 *
 * `image` is optional: pass an entry from data/siteImages.js and the header
 * becomes two columns on desktop, with the photo stacked below the text on
 * phones. Without it the header stays text-only, as before.
 *
 * Detail pages with a full-bleed photo use <DetailHero> instead.
 */
export const PageHeader = ({ label, title, children, actions, testId, image }) => {
  const text = (
    <>
      {label && <p className="section-label mb-4">{label}</p>}
      <h1
        className={`text-4xl sm:text-5xl font-bold text-brand-dark leading-[1.05] tracking-tight mb-6 max-w-4xl ${
          image ? "" : "lg:text-6xl"
        }`}
        data-testid={testId}
      >
        {title}
      </h1>
      {children && (
        <div className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl space-y-3">
          {children}
        </div>
      )}
      {actions && <div className="mt-8 flex flex-col sm:flex-row gap-3 [&>*]:w-full sm:[&>*]:w-auto [&_button]:w-full sm:[&_button]:w-auto">{actions}</div>}
    </>
  );

  return (
    <section className="pt-6 pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-white to-blue-50/60">
      <div className="max-w-7xl mx-auto">
        {image ? (
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">{text}</div>
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-xl shadow-gray-900/10 aspect-[16/10] lg:aspect-[4/5]">
                <ResponsiveImage
                  basePath={image.base}
                  widths={image.widths}
                  sizes="(min-width: 1024px) 480px, 100vw"
                  width={image.width}
                  height={image.height}
                  alt={image.alt}
                  // Above the fold on every page that uses it.
                  loading="eager"
                  fetchPriority="high"
                  className="w-full h-full object-cover"
                  style={image.position ? { objectPosition: image.position } : undefined}
                  testId={testId ? `${testId}-image` : undefined}
                />
              </div>
            </div>
          </div>
        ) : (
          text
        )}
      </div>
    </section>
  );
};
