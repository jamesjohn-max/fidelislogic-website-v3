import { Link } from "react-router-dom";
import { ArrowRight, Building2, Handshake } from "lucide-react";
import { audiences } from "../data/audiences";
import { analytics } from "../lib/analytics";
import { siteImages } from "../data/siteImages";
import { ResponsiveImage } from "./ResponsiveImage";

// Each card shows the same image as the page it leads to, so the card is a
// preview of its destination. Swap them in data/siteImages.js.
const cardImages = {
  organisation: siteImages.audienceOrganisation,
  partner: siteImages.audiencePartner,
};

const icons = { Building2, Handshake };

/**
 * The two-choice audience component from blueprint section 4.
 *
 * Used unchanged on Home, /solutions and /services. Both journeys are rendered
 * in one grid with identical weight: same card size, same heading level, same
 * button treatment, and no "or" / "also" copy that would rank one below the
 * other. On phones they stack in source order, which is why neither card
 * carries wording that assumes it is first.
 *
 * Props:
 *  - variant: "section" (own padded band) | "bare" (drop into an existing section)
 *  - background: "white" | "gray" | "dark"
 *  - heading / subheading: copy overrides
 *  - location: analytics location for the pathway click
 */
export const AudienceGateway = ({
  variant = "section",
  background = "white",
  heading = "Choose your journey",
  subheading = "The same expertise, entered from whichever side of the table you sit on.",
  location = "audience_gateway",
  testIdPrefix = "audience-gateway"
}) => {
  const isDark = background === "dark";
  const bgClass =
    background === "gray" ? "bg-gray-50" : isDark ? "bg-brand-dark" : "bg-white";

  const body = (
    <div className="max-w-7xl mx-auto">
      {heading && (
        <div className="max-w-3xl mb-10">
          <p className={`section-label mb-3 ${isDark ? "!text-fidelis-cyan" : ""}`}>
            Who we help
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

      {/* grid-cols-2 from md with equal-height items: neither pathway is ever
          presented as the alternative to the other. */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {audiences.map((audience) => {
          const Icon = icons[audience.icon] || Building2;
          const image = cardImages[audience.id];
          return (
            <Link
              key={audience.id}
              to={audience.href}
              onClick={() =>
                analytics.audiencePathwaySelect({
                  audience: audience.value,
                  location
                })
              }
              className={`card-interactive group flex flex-col overflow-hidden rounded-2xl border ${
                isDark
                  ? "border-white/15 bg-white/[0.04] hover:border-fidelis-cyan/60"
                  : "border-gray-200 bg-white"
              }`}
              data-testid={`${testIdPrefix}-${audience.id}`}
            >
              {image && (
                <div className="h-44 lg:h-52 overflow-hidden bg-gray-100">
                  <ResponsiveImage
                    basePath={image.base}
                    widths={image.widths}
                    sizes="(min-width: 768px) 600px, 100vw"
                    alt={image.alt}
                    className="image-zoom w-full h-full object-cover"
                    style={image.position ? { objectPosition: image.position } : undefined}
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-7 lg:p-9">
              <span
                className={`inline-flex w-12 h-12 items-center justify-center rounded-xl mb-6 ${
                  isDark ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
                }`}
              >
                <Icon size={24} aria-hidden="true" />
              </span>
              <h3
                className={`text-xl lg:text-2xl font-bold tracking-tight ${
                  isDark ? "text-white" : "text-brand-dark"
                }`}
              >
                {audience.selfLabel}
              </h3>
              <p
                className={`mt-3 leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {audience.summary}
              </p>
              <span
                className={`mt-auto pt-7 inline-flex items-center gap-2 font-semibold ${
                  isDark
                    ? "text-fidelis-cyan group-hover:text-white"
                    : "text-blue-600 group-hover:text-blue-700"
                }`}
              >
                {audience.navLabel}
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5"
                />
              </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  if (variant === "bare") return body;

  return (
    <section
      className={`py-16 lg:py-20 px-4 sm:px-6 lg:px-8 ${bgClass}`}
      data-testid={`${testIdPrefix}-section`}
      aria-label="Choose your journey"
    >
      {body}
    </section>
  );
};
