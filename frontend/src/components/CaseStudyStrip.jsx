import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { caseStudies, getRelatedCaseStudies } from "../data/caseStudies";
import { analytics } from "../lib/analytics";

/**
 * Case-study cards for a page's "relevant case studies" slot.
 *
 * Renders NOTHING while data/caseStudies.js is empty, which it is until a case
 * brief has been approved. That keeps every page free of placeholder cases and
 * means no page has to be edited when the first real case is added.
 *
 * Props:
 *  - filter: { solution, service, brand } — narrow to related cases
 *  - limit: how many cards to show
 *  - heading / subheading: copy overrides
 *  - background: "white" | "gray"
 */
export const CaseStudyStrip = ({
  filter,
  limit = 3,
  heading = "Relevant case studies",
  subheading,
  background = "gray",
  testIdPrefix = "case-study-strip"
}) => {
  const pool = filter ? getRelatedCaseStudies(filter) : caseStudies;
  // Fall back to the newest cases when nothing matches the filter, so a page
  // with no exact match still shows evidence rather than an empty band.
  const shown = (pool.length ? pool : caseStudies).slice(0, limit);
  if (shown.length === 0) return null;

  const bgClass = background === "gray" ? "bg-gray-50" : "bg-white";

  return (
    <section
      className={`py-16 lg:py-20 px-4 sm:px-6 lg:px-8 ${bgClass}`}
      data-testid={`${testIdPrefix}-section`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div className="max-w-3xl">
            <p className="section-label mb-3">Delivered work</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              {heading}
            </h2>
            {subheading && (
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">{subheading}</p>
            )}
          </div>
          <Link
            to="/case-studies"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold shrink-0"
            data-testid={`${testIdPrefix}-all`}
          >
            All case studies
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((study) => (
            <Link
              key={study.slug}
              to={`/case-studies/${study.slug}`}
              onClick={() =>
                analytics.caseStudyView({ case_study: study.slug, location: testIdPrefix })
              }
              className="card-interactive group flex flex-col rounded-2xl border border-gray-200 bg-white p-6"
              data-testid={`${testIdPrefix}-card-${study.slug}`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-600">
                {study.customer}
              </p>
              <h3 className="mt-3 text-lg font-bold text-brand-dark leading-snug">
                {study.title}
              </h3>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed flex-1">
                {study.summary}
              </p>
              {study.deliveryModel && (
                <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                  Delivery: {study.deliveryModel}
                </p>
              )}
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                Read the case
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
