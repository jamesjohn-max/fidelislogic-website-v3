import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SEO } from "../components/SEO";
import { PageHeader } from "../components/PageHeader";
import { CtaBand } from "../components/CtaBand";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { AudienceGateway } from "../components/AudienceGateway";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { seoConfig } from "../data/seoConfig";
import { segmentImageWidths } from "../data/siteContent";
import { priorityPillars, supportingSolutions } from "../data/pillars";
import { getServiceBySlug } from "../data/services";
import { solutionBrandMap, getBrandBySlug } from "../data/brands";
import { analytics } from "../lib/analytics";
import { siteImages } from "../data/siteImages";

/**
 * /solutions — the hub (blueprint section 7).
 *
 * Leads with the visitor's decision rather than a product catalogue: the three
 * priority pillars come first, each with the services, brands and tools that
 * belong to it, and headsets plus related solutions follow in a secondary group.
 * The audience gateway sits below so a visitor who has not yet picked a journey
 * can do so from here.
 */
export const Solutions = () => (
  <div className="min-h-screen">
    <SEO
      title={seoConfig.solutions.title}
      description={seoConfig.solutions.description}
      keywords={seoConfig.solutions.keywords}
    />
    <Breadcrumbs items={[{ name: "Solutions" }]} className="pt-24" />

    <PageHeader
      label="Solutions"
      title="Start from the decision you are trying to make"
      testId="solutions-hero-title"
        image={siteImages.headerSolutions}
      actions={
        <>
          <Link to="/contact">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Discuss your requirements
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
          <Link to="/tools/room-configurator">
            <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
              Start planning your room
            </Button>
          </Link>
        </>
      }
    >
      <p>
        The technology market is crowded with overlapping products and confusing
        messaging. We help you cut through the noise with independent consulting,
        structured solution design, and delivery support through your own vendor.
      </p>
    </PageHeader>

    {/* Three priority pillars, each with its related services and brands */}
    <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-10">
          <p className="section-label mb-3">Priority solutions</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
            Three areas we are asked about most
          </h2>
        </div>

        <div className="space-y-8">
          {priorityPillars.map((pillar) => {
            const Icon = LucideIcons[pillar.icon];
            const relatedServices = (pillar.relatedServices || [])
              .map(getServiceBySlug)
              .filter(Boolean);
            const relatedBrands = (solutionBrandMap[pillar.brandSolutionKey] || [])
              .map(getBrandBySlug)
              .filter(Boolean);

            return (
              <article
                key={pillar.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                data-testid={`solutions-pillar-${pillar.id}`}
              >
                <div className="grid lg:grid-cols-12">
                  <div className="lg:col-span-4 min-h-[220px] bg-gray-100">
                    <ResponsiveImage
                      basePath={pillar.imageBase}
                      widths={segmentImageWidths}
                      sizes="(min-width: 1024px) 440px, 100vw"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="lg:col-span-8 p-7 lg:p-9">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        {Icon && <Icon size={22} aria-hidden="true" />}
                      </span>
                      <p className="text-sm font-semibold text-blue-600">{pillar.tagline}</p>
                    </div>
                    <h3 className="text-2xl font-bold text-brand-dark tracking-tight leading-snug">
                      <Link to={pillar.href} className="hover:text-blue-700 transition-colors">
                        {pillar.title}
                      </Link>
                    </h3>
                    <p className="mt-3 text-gray-600 leading-relaxed">{pillar.description}</p>

                    <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      {pillar.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Related services, brands and tools for this pillar */}
                    <div className="mt-7 pt-6 border-t border-gray-100 grid sm:grid-cols-2 gap-6">
                      {relatedServices.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 mb-2.5">
                            Services
                          </h4>
                          <ul className="space-y-1.5">
                            {relatedServices.map((service) => (
                              <li key={service.slug}>
                                <Link
                                  to={`/services/${service.slug}`}
                                  className="text-sm text-gray-700 hover:text-blue-600"
                                >
                                  {service.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        {relatedBrands.length > 0 && (
                          <>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500 mb-2.5">
                              Brands
                            </h4>
                            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4">
                              {relatedBrands.map((brand) => (
                                <li key={brand.slug}>
                                  <Link
                                    to={`/brands/${brand.slug}`}
                                    className="text-sm text-gray-700 hover:text-blue-600"
                                  >
                                    {brand.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {pillar.toolHref && (
                          <Link
                            to={pillar.toolHref}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600"
                          >
                            {pillar.toolLabel}
                            <ArrowRight size={14} aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
                      <Link
                        to={pillar.href}
                        onClick={() =>
                          analytics.solutionEnquiryClick({
                            solution: pillar.id,
                            location: "solutions_hub"
                          })
                        }
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {pillar.ctaLabel}
                        <ArrowRight size={18} aria-hidden="true" />
                      </Link>
                      {pillar.brandHref && (
                        <Link
                          to={pillar.brandHref}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600"
                        >
                          {pillar.brandLabel}
                          <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>

    {/* Secondary group: headsets and related solutions */}
    <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-8">
          <p className="section-label mb-3">Also from us</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight leading-tight">
            Supporting solutions and tools
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {supportingSolutions.map((item) => {
            const Icon = LucideIcons[item.icon];
            return (
              <Link
                key={item.id}
                to={item.href}
                className="card-interactive group flex flex-col rounded-2xl border border-gray-200 bg-white p-6"
                data-testid={`solutions-supporting-${item.id}`}
              >
                <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600 mb-5 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  {Icon && <Icon size={20} aria-hidden="true" />}
                </span>
                <h3 className="text-base font-semibold text-brand-dark group-hover:text-blue-700">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed flex-1">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  {item.ctaLabel}
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>

    {/* Audience gateway */}
    <AudienceGateway
      background="white"
      heading="Which side of the table are you on?"
      subheading="Organisations and delivery partners approach the same solutions with different questions."
      location="solutions"
      testIdPrefix="solutions-gateway"
    />

    {/* Why an independent layer helps — existing copy, retained */}
    <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-brand-dark mb-8 tracking-tight">
          Why you need a bridge between you and vendors
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-brand-dark mb-4">The problem</h3>
              <ul className="space-y-3 text-gray-600">
                {[
                  "Too many overlapping products with similar claims",
                  "Vendor messaging focused on features, not outcomes",
                  "No clear comparison framework for decision-making",
                  "Integration complexity not addressed until too late"
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-blue-600 mr-2" aria-hidden="true">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-brand-dark mb-4">Our approach</h3>
              <ul className="space-y-3 text-gray-600">
                {[
                  "Independent guidance aligned with your objectives",
                  "Structured assessment and solution architecture",
                  "Clear recommendations with rationale and trade-offs",
                  "Implementation through your preferred partner in the UAE ecosystem"
                ].map((item) => (
                  <li key={item} className="flex items-start">
                    <span className="text-blue-600 mr-2" aria-hidden="true">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* Renders only once approved cases exist */}
    <CaseStudyStrip
      limit={3}
      heading="Comparable engagements"
      background="white"
      testIdPrefix="solutions-cases"
    />

    <CtaBand
      title="Not sure where to start?"
      location="solutions_footer"
      ctaLabel="Discuss your requirements"
      testId="solutions-cta"
    >
      Book a consultation to talk through your requirements and the approaches worth
      considering.
    </CtaBand>
  </div>
);
