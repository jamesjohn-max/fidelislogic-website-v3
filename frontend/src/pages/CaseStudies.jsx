import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "../components/ui/button";
import { SEO } from "../components/SEO";
import { PageHeader } from "../components/PageHeader";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CtaBand } from "../components/CtaBand";
import { AudienceGateway } from "../components/AudienceGateway";
import { seoConfig } from "../data/seoConfig";
import { audiences } from "../data/audiences";
import {
  CASE_STUDIES_PUBLISHED,
  caseStudies,
  caseStudyPillars
} from "../data/caseStudies";
import { analytics } from "../lib/analytics";

/**
 * /case-studies — the case-study library (blueprint section 9).
 *
 * The filters are deliberately simple: one row for the solution pillar, one for
 * the audience. Both are client-side over a small in-repo list.
 *
 * While data/caseStudies.js is empty the page renders an honest empty state
 * rather than sample cases, and (because CASE_STUDIES_PUBLISHED is false) sends
 * `noindex` so an empty library is not indexed. The route is absent from the
 * primary navigation and the sitemap until the flag is flipped.
 */
export const CaseStudies = () => {
  const [pillar, setPillar] = useState("all");
  const [audience, setAudience] = useState("all");

  const shown = caseStudies.filter(
    (study) =>
      (pillar === "all" || study.pillar === pillar) &&
      (audience === "all" || study.audience === audience)
  );

  const filterButton = (active, label, onClick, testId) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:text-blue-700"
      }`}
      data-testid={testId}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.caseStudies.title}
        description={seoConfig.caseStudies.description}
        keywords={seoConfig.caseStudies.keywords}
      />
      {/* Unpublished library: keep it out of the index until there is something
          to index. SEO.jsx always emits index,follow, so override it here. */}
      {!CASE_STUDIES_PUBLISHED && (
        <Helmet>
          <meta name="robots" content="noindex, follow" />
          <meta name="googlebot" content="noindex, follow" />
        </Helmet>
      )}
      <Breadcrumbs items={[{ name: "Case Studies" }]} className="pt-24" />

      <PageHeader
        label="Resources"
        title="Case studies"
        testId="case-studies-hero-title"
      >
        <p>
          How organisations and delivery partners across the UAE and GCC arrived at a
          workplace technology decision — the situation, the assessment, the recommendation,
          the delivery model and the verified result.
        </p>
      </PageHeader>

      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {caseStudies.length > 0 && (
            <div className="space-y-4 mb-10" data-testid="case-studies-filters">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Solution area</p>
                <div className="flex flex-wrap gap-2">
                  {filterButton(pillar === "all", "All areas", () => setPillar("all"), "case-filter-pillar-all")}
                  {caseStudyPillars.map((p) =>
                    filterButton(
                      pillar === p.id,
                      p.label,
                      () => setPillar(p.id),
                      `case-filter-pillar-${p.id}`
                    )
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Audience</p>
                <div className="flex flex-wrap gap-2">
                  {filterButton(audience === "all", "Everyone", () => setAudience("all"), "case-filter-audience-all")}
                  {audiences.map((a) =>
                    filterButton(
                      audience === a.id,
                      a.navLabel,
                      () => setAudience(a.id),
                      `case-filter-audience-${a.id}`
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {shown.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="case-studies-grid">
              {shown.map((study) => (
                <Link
                  key={study.slug}
                  to={`/case-studies/${study.slug}`}
                  onClick={() =>
                    analytics.caseStudyView({ case_study: study.slug, location: "library" })
                  }
                  className="card-interactive group flex flex-col rounded-2xl border border-gray-200 bg-white p-6"
                  data-testid={`case-studies-card-${study.slug}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-600">
                    {study.customer}
                  </p>
                  {(study.sector || study.location) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {[study.sector, study.location].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <h2 className="mt-3 text-lg font-bold text-brand-dark leading-snug">
                    {study.title}
                  </h2>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed flex-1">
                    {study.summary}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                    Read the case
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            /* Honest empty state. No sample cases, no invented numbers. */
            <div
              className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 lg:p-14 text-center max-w-3xl"
              data-testid="case-studies-empty"
            >
              <span className="inline-flex w-14 h-14 items-center justify-center rounded-xl bg-white border border-gray-200 text-blue-600 mb-6">
                <FileText size={26} aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-bold text-brand-dark tracking-tight">
                {caseStudies.length === 0
                  ? "Written case studies are being prepared"
                  : "No cases match those filters yet"}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {caseStudies.length === 0
                  ? "We publish a case only once the customer or delivery partner has approved what it says, so this library is filling up slowly and deliberately. In the meantime we are happy to talk through comparable work on a call."
                  : "Try a wider solution area or audience."}
              </p>
              {caseStudies.length === 0 && (
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to="/contact">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                      Discuss a similar requirement
                      <ArrowRight className="ml-2" size={18} />
                    </Button>
                  </Link>
                  <Link to="/solutions">
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto"
                    >
                      Explore solutions
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <AudienceGateway
        background="gray"
        heading="Looking for cases from your side of the table?"
        subheading="Customer engagements and partner-delivered work are labelled separately."
        location="case_studies"
        testIdPrefix="case-studies-gateway"
      />

      <CtaBand
        title="Discuss a similar requirement"
        location="case_studies_footer"
        ctaLabel="Discuss a similar requirement"
        testId="case-studies-cta"
      >
        Describe what you are planning and we will tell you what comparable work involved.
      </CtaBand>
    </div>
  );
};
