import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { SEO } from "../components/SEO";
import { PageHeader } from "../components/PageHeader";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { CtaBand } from "../components/CtaBand";
import { TrustBand } from "../components/TrustBand";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { StructuredData, webPageSchema } from "../components/StructuredData";
import { seoConfig } from "../data/seoConfig";
import {
  partnerAudience,
  partnerCapabilities,
  partnerSituations,
  partnerPrinciples
} from "../data/audiences";
import { analytics } from "../lib/analytics";
import { siteImages } from "../data/siteImages";

/**
 * /for-partners — the reseller / system-integrator journey (blueprint section 6).
 *
 * Sequence, in order: white-label proposition, when support is useful, available
 * capabilities, working model and boundaries, confidentiality principles,
 * partner-delivered cases, credentials, partner enquiry.
 *
 * DELIBERATELY ABSENT, pending commercial approval (blueprint sections 5 and
 * 14): response times, territories, guaranteed availability, exclusivity,
 * margin or rate-card detail, and any named partner or end customer. Do not add
 * them here without written confirmation of the wording.
 */
export const ForPartners = () => {
  const audience = partnerAudience;
  const partnerEnquiryHref = "/contact?audience=partner";

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.forPartners.title}
        description={seoConfig.forPartners.description}
        keywords={seoConfig.forPartners.keywords}
      />
      <StructuredData
        data={webPageSchema(
          "For Resellers & System Integrators",
          seoConfig.forPartners.description,
          typeof window !== "undefined" ? window.location.origin + "/for-partners" : ""
        )}
      />
      <Breadcrumbs items={[{ name: "For Resellers & Integrators" }]} className="pt-24" />

      {/* 1 — White-label support proposition */}
      <PageHeader
        label="For resellers & system integrators"
        title="Specialist capacity behind your brand, not beside it"
        testId="for-partners-hero-title"
        image={siteImages.audiencePartner}
        actions={
          <Link
            to={partnerEnquiryHref}
            onClick={() =>
              analytics.partnerEnquiryStart({ location: "for_partners_hero" })
            }
          >
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              {audience.ctaLabel}
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
        }
      >
        <p>
          Fidelis Logic provides assessment, solution design, documentation, project
          management, deployment assistance, training and support as white-label capacity
          for resellers and system integrators in the UAE and GCC.
        </p>
        <p className="font-medium text-brand-dark">
          Your customer stays your customer. We do not supply the hardware and we do not
          compete for the order.
        </p>
      </PageHeader>

      {/* 2 — Situations in which support is useful */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="section-label mb-3">When partners call us</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              Situations where extra capacity is worth having
            </h2>
          </div>
          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerSituations.map((situation) => (
              <li
                key={situation.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
                data-testid="for-partners-situation"
              >
                <h3 className="text-lg font-semibold text-brand-dark leading-snug">
                  {situation.title}
                </h3>
                <p className="mt-2.5 text-gray-600 leading-relaxed">{situation.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3 — Available capabilities */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="section-label mb-3">What you can hand over</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              Capabilities available under a white-label model
            </h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Take the whole set or a single piece of it. Each engagement is scoped in
              writing before it starts.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerCapabilities.map((capability) => {
              const Icon = LucideIcons[capability.icon];
              return (
                <div
                  key={capability.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                  data-testid={`for-partners-capability-${capability.icon.toLowerCase()}`}
                >
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-5">
                    {Icon && <Icon size={20} aria-hidden="true" />}
                  </span>
                  <h3 className="text-base font-semibold text-brand-dark leading-snug">
                    {capability.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 & 5 — Working model, boundaries, confidentiality */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="section-label !text-fidelis-cyan mb-3">The working model</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              How we work, and where we stop
            </h2>
            <p className="mt-5 text-lg text-gray-300 leading-relaxed">
              White-label support only works if the boundaries are explicit. These are
              ours, and they are the same for every partner.
            </p>
            <div
              className="mt-8 flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-6"
              data-testid="for-partners-confidentiality"
            >
              <Lock className="w-5 h-5 mt-0.5 shrink-0 text-fidelis-cyan" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-white">Confidential by default</h3>
                <p className="mt-1.5 text-sm text-gray-300 leading-relaxed">
                  Your customers, pricing and proposals are not used as references or
                  marketing material without your written agreement. Where a case study
                  appears on this site, the partner agreed to it first.
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-400 leading-relaxed">
              Commercial terms, engagement rates and the exact scope of each deliverable
              are agreed per engagement rather than published here.
            </p>
          </div>

          <ul className="space-y-4">
            {partnerPrinciples.map((principle) => (
              <li
                key={principle.title}
                className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/[0.04] p-5"
                data-testid="for-partners-principle"
              >
                <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-fidelis-cyan" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-white">{principle.title}</h3>
                  <p className="mt-1 text-sm text-gray-300 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6 — Partner-delivered cases (renders only once cases exist) */}
      <CaseStudyStrip
        filter={{ audience: "partner" }}
        heading="Partner-delivered engagements"
        subheading="Anonymous unless the partner agreed to be named."
        background="white"
        testIdPrefix="for-partners-cases"
      />

      {/* 7 — Technical and project-management credentials */}
      <TrustBand
        background="gray"
        heading="Credentials you can put in front of your customer"
        subheading="Certified project management and technical certification in the platforms your customers are asking about."
        testIdPrefix="for-partners-trust"
      />

      {/* 8 — Partner enquiry */}
      <CtaBand
        title="Discuss white-label support"
        location="for_partners_footer"
        ctaLabel={audience.ctaLabel}
        ctaHref={partnerEnquiryHref}
        onClick={() => analytics.partnerEnquiryStart({ location: "for_partners_footer" })}
        showCall
        testId="for-partners-cta"
      >
        Tell us what the engagement looks like and who needs to see the output. We will
        come back with a written scope before any work starts.
      </CtaBand>
    </div>
  );
};
