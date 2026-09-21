import { Link } from "react-router-dom";
import { SEO } from "../components/SEO";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { PageHeader } from "../components/PageHeader";
import { CtaBand } from "../components/CtaBand";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { StructuredData } from "../components/StructuredData";
import { AudienceGateway } from "../components/AudienceGateway";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import {
  services,
  serviceStages,
  serviceCoverage,
  getServicesByStage,
  serviceImageWidths
} from "../data/services";
import { getServiceIcon } from "../lib/serviceIcons";
import { ArrowRight } from "lucide-react";
import { siteImages } from "../data/siteImages";

// ItemList schema so crawlers see the hub as the index of every service page.
const servicesItemListSchema = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Workplace technology services",
    "itemListElement": services.map((service, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "name": service.name,
      "url": `${origin}/services/${service.slug}`
    }))
  };
};

export const Services = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Workplace Technology Services UAE"
        description="Consulting, audits, deployment, rentals, relocations, managed support, refresh programmes and training for meeting rooms and workspace technology across the UAE."
        keywords="workplace technology services UAE, AV services Dubai, meeting room deployment, managed AV support, video conferencing rental, IT consulting UAE"
      />
      <StructuredData data={servicesItemListSchema()} />
      <Breadcrumbs items={[{ name: "Services" }]} className="pt-24" />

      <PageHeader title="Workplace technology services, under one accountable partner" testId="services-hero-title"
        image={siteImages.headerServices}>
        <p>
          From the first audit to day-90 adoption reviews, we plan, deliver and operate
          workplace technology for organisations across {serviceCoverage.label}.
        </p>
      </PageHeader>

      {/* Services, grouped by lifecycle stage */}
      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16 lg:space-y-20">
          {serviceStages.map((stage) => {
            const stageServices = getServicesByStage(stage.id);
            return (
              <div
                key={stage.id}
                className="grid lg:grid-cols-12 gap-8 lg:gap-12"
                data-testid={`services-stage-${stage.id}`}
              >
                <div className="lg:col-span-3">
                  <div className="lg:sticky lg:top-28">
                    <h2 className="text-3xl font-bold text-brand-dark tracking-tight">{stage.label}</h2>
                    <p className="mt-2 text-gray-600 leading-relaxed">{stage.description}</p>
                  </div>
                </div>
                <div
                  className={`lg:col-span-9 grid sm:grid-cols-2 gap-6 ${
                    stageServices.length === 3 ? "lg:grid-cols-3" : ""
                  }`}
                >
                  {stageServices.map((service) => {
                    const Icon = getServiceIcon(service.icon);
                    return (
                      <Link
                        key={service.slug}
                        to={`/services/${service.slug}`}
                        className="card-interactive group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
                        data-testid={`services-card-${service.slug}`}
                      >
                        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                          <ResponsiveImage
                            basePath={service.images.hero}
                            widths={serviceImageWidths}
                            sizes="(min-width: 1024px) 420px, (min-width: 640px) 46vw, 92vw"
                            alt={service.images.heroAlt}
                            className="image-zoom w-full h-full object-cover"
                            style={{ objectPosition: service.images.heroPosition }}
                          />
                        </div>
                        <div className="flex flex-1 flex-col p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 inline-flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-200">
                              <Icon size={20} aria-hidden="true" />
                            </span>
                            <h3 className="text-lg font-bold text-brand-dark leading-tight">
                              {service.name}
                            </h3>
                          </div>
                          <p className="text-gray-600 leading-relaxed mb-5">{service.shortDescription}</p>
                          <span className="mt-auto inline-flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                            Learn more
                            <ArrowRight size={16} className="ml-1.5 group-hover:translate-x-0.5 transition-transform duration-200 ease-out-strong" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Audience gateway — the same component as Home and /solutions, so a
          visitor can pick their journey from any of the three hubs. */}
      <AudienceGateway
        background="gray"
        heading="Buying these services, or reselling them?"
        subheading="Organisations engage us directly. Resellers and system integrators engage us under their own brand."
        location="services"
        testIdPrefix="services-gateway"
      />

      {/* Renders only once approved cases exist */}
      <CaseStudyStrip
        limit={3}
        heading="Services in practice"
        background="white"
        testIdPrefix="services-cases"
      />

      <CtaBand
        title="Not sure which service you need?"
        location="services_footer"
        ctaLabel="Discuss your requirements"
        testId="services-cta"
      >
        A 30-minute call is usually enough to point you at the right starting service,
        or to tell you honestly that you don't need us yet.
      </CtaBand>
    </div>
  );
};
