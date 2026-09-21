import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { SEO } from "../components/SEO";
import { PageHeader } from "../components/PageHeader";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CtaBand } from "../components/CtaBand";
import { TrustBand } from "../components/TrustBand";
import { AdvisoryProcess } from "../components/AdvisoryProcess";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { StructuredData, webPageSchema } from "../components/StructuredData";
import { seoConfig } from "../data/seoConfig";
import { priorityPillars, supportingSolutions } from "../data/pillars";
import { organisationProblems, organisationAudience } from "../data/audiences";
import { analytics } from "../lib/analytics";
import { siteImages } from "../data/siteImages";

/**
 * /for-organisations — the customer-side audience journey (blueprint section 6).
 *
 * Sequence, in order: proposition, decision problems, priority solution areas,
 * advisory process, how we work with the customer's reseller, relevant case
 * studies, certifications and experience, consultation action.
 */
export const ForOrganisations = () => {
  const audience = organisationAudience;

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.forOrganisations.title}
        description={seoConfig.forOrganisations.description}
        keywords={seoConfig.forOrganisations.keywords}
      />
      <StructuredData
        data={webPageSchema(
          "For Organisations",
          seoConfig.forOrganisations.description,
          typeof window !== "undefined" ? window.location.origin + "/for-organisations" : ""
        )}
      />
      <Breadcrumbs items={[{ name: "For Organisations" }]} className="pt-24" />

      {/* 1 — Organisation-specific proposition */}
      <PageHeader
        label="For organisations"
        title="Make a technology decision you can defend — without replacing your supplier"
        testId="for-organisations-hero-title"
        image={siteImages.audienceOrganisation}
        actions={
          <>
            <Link
              to="/contact?audience=organisation"
              onClick={() =>
                analytics.consultationCtaClick({
                  location: "for_organisations_hero",
                  audience: "organisation"
                })
              }
            >
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                {audience.ctaLabel}
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
          Fidelis Logic assesses what your spaces and teams actually need, compares the
          credible approaches, and writes the recommendation down — then works alongside
          the reseller or system integrator you already use to get it delivered.
        </p>
        <p className="font-medium text-brand-dark">
          We do not sell the hardware. That is what keeps the advice about fit.
        </p>
      </PageHeader>

      {/* 2 — Common decision problems */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="section-label mb-3">The usual starting point</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              Where workplace technology decisions get stuck
            </h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              If more than one of these sounds familiar, the problem is usually the
              requirement rather than the product.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {organisationProblems.map((problem) => {
              const Icon = LucideIcons[problem.icon];
              return (
                <div
                  key={problem.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                  data-testid={`for-organisations-problem-${problem.icon.toLowerCase()}`}
                >
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-5">
                    {Icon && <Icon size={20} aria-hidden="true" />}
                  </span>
                  <h3 className="text-lg font-semibold text-brand-dark leading-snug">
                    {problem.title}
                  </h3>
                  <p className="mt-2.5 text-gray-600 leading-relaxed">{problem.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 — Priority solution areas */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="section-label mb-3">What we are asked about most</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              Three areas where independent advice changes the outcome
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {priorityPillars.map((pillar) => {
              const Icon = LucideIcons[pillar.icon];
              return (
                <div
                  key={pillar.id}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7"
                  data-testid={`for-organisations-pillar-${pillar.id}`}
                >
                  <span className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-6">
                    {Icon && <Icon size={24} aria-hidden="true" />}
                  </span>
                  <h3 className="text-xl font-bold text-brand-dark tracking-tight leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">{pillar.description}</p>
                  <ul className="mt-5 space-y-2 flex-1">
                    {pillar.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={pillar.href}
                    onClick={() =>
                      analytics.solutionEnquiryClick({
                        solution: pillar.id,
                        location: "for_organisations_pillars",
                        audience: "organisation"
                      })
                    }
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {pillar.ctaLabel}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {supportingSolutions.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600"
              >
                {item.title}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Advisory process */}
      <AdvisoryProcess
        background="gray"
        label="Our process"
        heading="How an engagement runs"
        subheading="Four stages. You get a written recommendation before anyone is asked for a price."
        testIdPrefix="for-organisations-process"
      />

      {/* 5 — How we work with the customer's reseller */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="section-label mb-3">Your existing supplier</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              We work through your reseller, not around them
            </h2>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Most organisations already have a reseller or system integrator they trust
              with supply, installation and warranty. Replacing that relationship to get
              better advice is a poor trade, so we do not ask you to.
            </p>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              You keep the commercial relationship. We provide the assessment, the design
              and the documentation, and stay involved through delivery so the solution
              that was agreed is the solution that gets installed.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              {
                title: "You keep your supplier and your terms",
                body: "Quotation, supply, installation and warranty stay where they are today."
              },
              {
                title: "Your supplier gets a clear specification",
                body: "A documented design is easier and cheaper to quote against than a conversation."
              },
              {
                title: "One comparable basis for every quote",
                body: "When each vendor prices the same specification, the differences are real."
              },
              {
                title: "Someone independent at handover",
                body: "We check the installed result against the design that was signed off."
              },
              {
                title: "No supply revenue on our side",
                body: "We are not paid on the hardware, so a more expensive room is not a better outcome for us."
              }
            ].map((item) => (
              <li
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-5"
              >
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-brand-dark">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6 — Relevant case studies (renders only once cases exist) */}
      <CaseStudyStrip
        filter={{ audience: "organisation" }}
        heading="Comparable engagements"
        subheading="Assessments and designs delivered for organisations, with the delivery partner's role stated."
        testIdPrefix="for-organisations-cases"
      />

      {/* 7 — Certifications and experience */}
      <TrustBand
        background="gray"
        heading="The experience behind the recommendation"
        subheading="Two decades of modern workplace projects, certified project management, and technical certification in the platforms we put forward."
        testIdPrefix="for-organisations-trust"
      />

      {/* 8 — Consultation action */}
      <CtaBand
        title="Book an independent consultation"
        location="for_organisations_footer"
        ctaLabel={audience.ctaLabel}
        ctaHref="/contact?audience=organisation"
        showCall
        testId="for-organisations-cta"
      >
        Tell us what you are trying to decide. A first conversation is enough for us to
        say what the assessment would involve — or that you do not need one.
      </CtaBand>
    </div>
  );
};
