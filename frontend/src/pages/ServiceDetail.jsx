import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import axios from "axios";
import { SEO } from "../components/SEO";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { Button } from "../components/ui/button";
import { DetailHero } from "../components/DetailHero";
import { CtaBand } from "../components/CtaBand";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { BrandLogo } from "../components/BrandLogo";
import { FAQSection } from "../components/FAQSection";
import { FAQSchema } from "../components/FAQSchema";
import { StructuredData, serviceDetailSchema } from "../components/StructuredData";
import {
  getServiceBySlug,
  serviceCoverage,
  serviceImageWidths
} from "../data/services";
import { segments, segmentImageWidths, consultationCta } from "../data/siteContent";
import { getBrandBySlug } from "../data/brands";
import { getServiceIcon } from "../lib/serviceIcons";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { analytics } from "../lib/analytics";

import { BACKEND_URL } from "../lib/api";

export const ServiceDetail = () => {
  const { slug } = useParams();
  const service = getServiceBySlug(slug);
  const [dbFaqs, setDbFaqs] = useState([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    axios
      .get(`${BACKEND_URL}/api/faqs`, { params: { service_slug: slug } })
      .then((res) => {
        if (!cancelled) setDbFaqs(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setDbFaqs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const Icon = getServiceIcon(service.icon);

  // Extract nested arrays into local consts to avoid the local visual-edits
  // Babel plugin recursing infinitely on inline .map() over deeply-nested fields.
  const benefits = service.keyBenefits || [];
  const deliverables = service.deliverables || [];
  const idealFor = service.idealFor || [];
  const challenges = service.challenges || [];
  const processSteps = service.process || [];
  const platforms = service.platforms || [];
  const facts = [
    ...(service.quickFacts || []),
    { label: "Coverage", value: serviceCoverage.label }
  ];
  const brandList = (service.brands || []).map(getBrandBySlug).filter(Boolean);
  const relatedServices = (service.relatedServices || [])
    .map(getServiceBySlug)
    .filter(Boolean);
  const relatedSolutions = (service.relatedSolutions || [])
    .map((path) => segments.find((segment) => segment.link === path))
    .filter(Boolean);

  // Static FAQs ship with the page; any added through the admin FAQ editor are
  // appended, skipping questions that duplicate a static one.
  const staticFaqs = service.faqs || [];
  const staticQuestions = new Set(staticFaqs.map((f) => f.question.trim().toLowerCase()));
  const faqs = [
    ...staticFaqs,
    ...dbFaqs.filter((f) => !staticQuestions.has((f.question || "").trim().toLowerCase()))
  ];

  // Bento rhythm for the four benefits: wide, narrow / narrow, wide.
  const benefitTiles = [
    "md:col-span-2 bg-blue-600 text-white",
    "bg-gray-50 border border-gray-200 text-brand-dark",
    "bg-gray-50 border border-gray-200 text-brand-dark",
    "md:col-span-2 bg-brand-dark text-white"
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={service.seo.title}
        description={service.seo.description}
        keywords={service.seo.keywords}
        ogImage={`/img/social/og-service-${service.slug}.jpg`}
      />
      <StructuredData data={serviceDetailSchema(service, serviceCoverage)} />
      <FAQSchema faqs={faqs} />
      <Breadcrumbs
        items={[
          { name: "Services", href: "/services" },
          { name: service.name }
        ]}
        className="pt-24"
      />

      <DetailHero
        image={service.images.hero}
        imagePosition={service.images.heroPosition}
        icon={Icon}
        label={service.name}
        title={service.h1}
        subtitle={service.tagline}
        facts={facts}
        testId="service-hero"
        actions={
          <>
            <Link
              to="/contact"
              onClick={() =>
                analytics.consultationCtaClick({
                  location: "service_hero",
                  service: service.slug
                })
              }
            >
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40"
                data-testid="service-hero-cta-primary"
              >
                {consultationCta}
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                How It Works
              </Button>
            </a>
          </>
        }
      />

      {/* Overview */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight tracking-tight mb-6">
              {service.overviewHeading}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-[62ch]">
              {service.longDescription}
            </p>
            <h3 className="text-base font-semibold text-brand-dark mb-4">Best fit for</h3>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {idealFor.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-gray-700 leading-snug">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-3 lg:-inset-4 rounded-[1.75rem] bg-gradient-to-br from-blue-100 to-cyan-50 -rotate-2"
              />
              <ResponsiveImage
                basePath={service.images.detail}
                widths={serviceImageWidths}
                sizes="(min-width: 1024px) 560px, 92vw"
                alt={service.images.detailAlt}
                width={1920}
                height={1280}
                className="relative w-full aspect-[4/3] object-cover rounded-2xl shadow-lg shadow-gray-900/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Challenges */}
      {challenges.length > 0 && (
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight tracking-tight">
                  Sound familiar?
                </h2>
                <p className="mt-4 text-lg text-gray-600 leading-relaxed max-w-md">
                  The problems we are most often brought in to solve.
                </p>
              </div>
            </div>
            <ul className="lg:col-span-7 space-y-5">
              {challenges.map((challenge) => (
                <li
                  key={challenge.title}
                  className="bg-white rounded-2xl border border-gray-200 border-l-4 border-l-blue-600 p-6 lg:p-7"
                  data-testid="service-challenge"
                >
                  <h3 className="text-xl font-semibold text-brand-dark leading-snug mb-2">
                    {challenge.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{challenge.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Key benefits, bento */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight tracking-tight mb-10 max-w-2xl">
            What you get from working with us
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {benefits.map((benefit, idx) => {
              const tile = benefitTiles[idx % benefitTiles.length];
              const isDark = tile.includes("text-white");
              const isWide = tile.includes("col-span-2");
              return (
                <div
                  key={benefit.title}
                  className={`relative overflow-hidden rounded-2xl p-7 lg:p-8 ${tile}`}
                  data-testid={`service-benefit-${idx}`}
                >
                  {tile.includes("bg-brand-dark") && (
                    <div
                      aria-hidden="true"
                      className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-fidelis-cyan/20 blur-3xl"
                    />
                  )}
                  <div className="relative">
                    <CheckCircle2
                      className={`w-7 h-7 mb-6 ${isDark ? "text-fidelis-cyan" : "text-blue-600"}`}
                      aria-hidden="true"
                    />
                    <h3 className={`font-bold leading-tight mb-2 ${isWide ? "text-2xl" : "text-xl"}`}>
                      {benefit.title}
                    </h3>
                    <p
                      className={`leading-relaxed max-w-[52ch] ${
                        isDark ? "text-white/80" : "text-gray-600"
                      } ${isWide ? "text-lg" : ""}`}
                    >
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      {processSteps.length > 0 && (
        <section
          id="how-it-works"
          className="scroll-mt-24 py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50"
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight tracking-tight mb-12">
              How the engagement runs
            </h2>
            <ol className="grid md:grid-cols-4 gap-8 md:gap-6">
              {processSteps.map((step, idx) => (
                <li key={step.title} className="relative flex md:block gap-5" data-testid="service-process-step">
                  {/* Connector to the next step: down on phones, across from md.
                      Offsets match the gap-8 / md:gap-6 between items. */}
                  {idx < processSteps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-5 top-10 -bottom-8 w-px bg-blue-200 md:left-10 md:top-5 md:bottom-auto md:-right-6 md:w-auto md:h-px"
                    />
                  )}
                  <span className="relative z-10 inline-flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                    {idx + 1}
                  </span>
                  <div className="md:mt-6">
                    <h3 className="text-xl font-semibold text-brand-dark mb-2">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Deliverables + technology */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-7">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight tracking-tight mb-8">
              What's included
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {deliverables.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 text-gray-800 leading-snug"
                  data-testid="service-deliverable"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-gray-200 p-6 lg:p-8" data-testid="service-technology">
              <h2 className="text-xl font-bold text-brand-dark mb-5 tracking-tight">Technology we work with</h2>
              <ul className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <li
                    key={platform}
                    className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium"
                  >
                    {platform}
                  </li>
                ))}
              </ul>
              {brandList.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-gray-500 mt-8 mb-4">Hardware and platform partners</h3>
                  <ul className="grid grid-cols-3 gap-3">
                    {brandList.map((brand) => (
                      <li key={brand.slug}>
                        <Link
                          to={`/brands/${brand.slug}`}
                          className="card-interactive flex items-center justify-center h-14 rounded-xl border border-gray-200 bg-white"
                        >
                          <BrandLogo brand={brand} size="sm" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Related solutions and services */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark leading-tight tracking-tight">
              Keep exploring
            </h2>
            <Link
              to="/services"
              className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              All services
              <ArrowRight className="ml-1.5" size={16} />
            </Link>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {relatedSolutions.length > 0 && (
              <div className="lg:col-span-5 grid gap-6">
                {relatedSolutions.map((solution) => (
                  <Link
                    key={solution.id}
                    to={solution.link}
                    className="group relative overflow-hidden rounded-2xl min-h-[220px] flex items-end"
                    data-testid={`service-related-solution-${solution.id}`}
                  >
                    <ResponsiveImage
                      basePath={solution.imageBase}
                      widths={segmentImageWidths}
                      sizes="(min-width: 1024px) 460px, 92vw"
                      alt=""
                      className="image-zoom absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent" />
                    <div className="relative p-6">
                      <p className="text-sm font-medium text-fidelis-cyan mb-1">Solution</p>
                      <h3 className="text-xl font-bold text-white leading-snug">{solution.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <ul className={`${relatedSolutions.length > 0 ? "lg:col-span-7" : "lg:col-span-12"} grid gap-4 content-start`}>
              {relatedServices.map((related) => (
                <li key={related.slug}>
                  <Link
                    to={`/services/${related.slug}`}
                    className="card-interactive group flex items-center gap-5 rounded-2xl bg-white border border-gray-200 p-4"
                    data-testid={`service-related-${related.slug}`}
                  >
                    <div className="w-24 h-20 sm:w-32 sm:h-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      <ResponsiveImage
                        basePath={related.images.hero}
                        widths={[400]}
                        sizes="128px"
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ objectPosition: related.images.heroPosition }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-brand-dark leading-tight mb-1">
                        {related.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{related.oneLiner}</p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="hidden sm:block shrink-0 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-[transform,color] duration-200 ease-out-strong"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ: static per service, plus any added in the admin FAQ editor */}
      <FAQSection
        faqs={faqs}
        subtitle={`About ${service.name} for organisations in the UAE.`}
        testIdPrefix={`service-faq-${service.slug}`}
      />

      {/* Relevant case study — renders only once approved cases exist */}
      <CaseStudyStrip
        filter={{ service: service.slug }}
        limit={2}
        heading={`${service.name} in practice`}
        background="white"
        testIdPrefix={`service-cases-${service.slug}`}
      />

      {/* Service-specific enquiry (blueprint section 8, item 8) */}
      <CtaBand
        title={`Ready to talk about ${service.name}?`}
        ctaLabel={`Enquire about ${service.name}`}
        onClick={() =>
          analytics.serviceEnquiryClick({
            location: "service_footer",
            service: service.slug
          })
        }
        secondary={{
          label: "White-label this service",
          href: "/for-partners",
          testId: "service-footer-partner-cta"
        }}
        testId="service-footer-cta"
      >
        Share your context in a short call. If we can help, we&apos;ll say so. If we can&apos;t,
        we&apos;ll point you to who can.
      </CtaBand>
    </div>
  );
};
