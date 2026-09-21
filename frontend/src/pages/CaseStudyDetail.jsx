import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { SEO } from "../components/SEO";
import { PageHeader } from "../components/PageHeader";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CtaBand } from "../components/CtaBand";
import { StructuredData } from "../components/StructuredData";
import { getBrandBySlug } from "../data/brands";
import { getServiceBySlug } from "../data/services";
import {
  CASE_STUDIES_PUBLISHED,
  caseStudyPillars,
  getCaseStudyBySlug
} from "../data/caseStudies";
import { analytics } from "../lib/analytics";

const caseStudySchema = (study) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: study.title,
    description: study.summary,
    url: `${origin}/case-studies/${study.slug}`,
    about: study.recommendation,
    publisher: {
      "@type": "Organization",
      name: "Fidelis Logic LLC",
      url: origin
    }
  };
};

/**
 * /case-studies/:slug — one case, rendered from the 11-field template in
 * blueprint section 11. Every field is optional in the markup so a case can be
 * published with the sections that have been approved and nothing more; missing
 * fields simply do not render rather than showing a placeholder.
 */
export const CaseStudyDetail = () => {
  const { slug } = useParams();
  const study = getCaseStudyBySlug(slug);

  useEffect(() => {
    if (study) analytics.caseStudyView({ case_study: study.slug, location: "detail" });
  }, [study]);

  if (!study) {
    return (
      <div className="min-h-screen">
        <SEO
          title="Case study not found"
          description="This case study is not available."
        />
        <Helmet>
          <meta name="robots" content="noindex, follow" />
        </Helmet>
        <Breadcrumbs
          items={[{ name: "Case Studies", href: "/case-studies" }, { name: "Not found" }]}
          className="pt-24"
        />
        <PageHeader title="We couldn't find that case study">
          <p>
            It may not have been published yet. The library lists everything that is
            available today.
          </p>
        </PageHeader>
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Link to="/case-studies">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <ArrowLeft className="mr-2" size={18} />
                Back to case studies
              </Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const pillarLabel = caseStudyPillars.find((p) => p.id === study.pillar)?.label;
  const meta = [study.customer, study.sector, study.location].filter(Boolean).join(" · ");

  // The narrative sections, in blueprint order.
  const sections = [
    { id: "challenge", heading: "Challenge", body: study.challenge },
    { id: "assessment", heading: "Assessment and decision process", body: study.assessment },
    { id: "recommendation", heading: "Recommended solution", body: study.recommendation },
    { id: "delivery", heading: "Partner and delivery model", body: study.deliveryModel },
    { id: "result", heading: "Verified result", body: study.result }
  ].filter((section) => section.body);

  const relatedBrands = (study.relatedBrands || []).map(getBrandBySlug).filter(Boolean);
  const relatedServices = (study.relatedServices || []).map(getServiceBySlug).filter(Boolean);

  return (
    <div className="min-h-screen">
      <SEO title={study.title} description={study.summary} ogType="article" />
      {!CASE_STUDIES_PUBLISHED && (
        <Helmet>
          <meta name="robots" content="noindex, follow" />
          <meta name="googlebot" content="noindex, follow" />
        </Helmet>
      )}
      <StructuredData data={caseStudySchema(study)} />
      <Breadcrumbs
        items={[{ name: "Case Studies", href: "/case-studies" }, { name: study.title }]}
        className="pt-24"
      />

      <PageHeader label={pillarLabel} title={study.title} testId="case-study-title">
        {meta && <p className="font-medium text-brand-dark">{meta}</p>}
        {study.summary && <p>{study.summary}</p>}
      </PageHeader>

      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-10">
            {sections.map((section) => (
              <div key={section.id} data-testid={`case-study-${section.id}`}>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
                  {section.heading}
                </h2>
                <p className="mt-4 text-lg text-gray-600 leading-relaxed">{section.body}</p>
              </div>
            ))}

            {(study.scope || []).length > 0 && (
              <div data-testid="case-study-scope">
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
                  Scope delivered
                </h2>
                <ul className="mt-4 space-y-3">
                  {study.scope.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Related solutions, services and brands */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-6">
              {(study.relatedSolutions || []).length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Related solutions
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {study.relatedSolutions.map((href) => (
                      <li key={href}>
                        <Link
                          to={href}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {href.split("/").pop().replace(/-/g, " ")}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {relatedServices.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Services involved
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {relatedServices.map((service) => (
                      <li key={service.slug}>
                        <Link
                          to={`/services/${service.slug}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {service.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {relatedBrands.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Brands delivered
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {relatedBrands.map((brand) => (
                      <li key={brand.slug}>
                        <Link
                          to={`/brands/${brand.slug}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {brand.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link to="/case-studies" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600">
                <ArrowLeft size={16} aria-hidden="true" />
                All case studies
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <CtaBand
        title="Discuss a similar requirement"
        location="case_study_footer"
        ctaLabel="Discuss a similar requirement"
        onClick={() =>
          analytics.caseStudyEnquiryClick({ case_study: study.slug, location: "case_study_footer" })
        }
        secondary={{ label: "See all case studies", href: "/case-studies" }}
        testId="case-study-cta"
      >
        If your situation resembles this one, a short call is usually enough to say
        whether the same approach fits.
      </CtaBand>
    </div>
  );
};
