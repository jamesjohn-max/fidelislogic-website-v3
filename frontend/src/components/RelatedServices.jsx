import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { getServiceBySlug } from "../data/services";
import { getServiceIcon } from "../lib/serviceIcons";
import { analytics } from "../lib/analytics";

/**
 * The lifecycle services that deliver a given solution (blueprint section 7:
 * every solution page links its "delivery services").
 *
 * Props:
 *  - slugs: service slugs, in the order they should appear
 *  - solution: id used for the analytics params
 */
export const RelatedServices = ({
  slugs = [],
  solution,
  heading = "How we deliver it",
  subheading = "The services that turn a recommendation into a working room.",
  background = "white",
  testIdPrefix = "related-services"
}) => {
  const services = slugs.map(getServiceBySlug).filter(Boolean);
  if (services.length === 0) return null;

  const bgClass = background === "gray" ? "bg-gray-50" : "bg-white";

  return (
    <section
      className={`py-16 lg:py-20 px-4 sm:px-6 lg:px-8 ${bgClass}`}
      data-testid={`${testIdPrefix}-section`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="max-w-3xl">
            <p className="section-label mb-3">Delivery services</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              {heading}
            </h2>
            {subheading && (
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">{subheading}</p>
            )}
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold shrink-0"
            data-testid={`${testIdPrefix}-all`}
          >
            All services
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <Link
                key={service.slug}
                to={`/services/${service.slug}`}
                onClick={() =>
                  analytics.serviceEnquiryClick({ service: service.slug, solution })
                }
                className="card-interactive group flex flex-col rounded-2xl border border-gray-200 bg-white p-6"
                data-testid={`${testIdPrefix}-${service.slug}`}
              >
                <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-5">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold text-brand-dark group-hover:text-blue-700 leading-snug">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">
                  {service.oneLiner}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  Learn more
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
