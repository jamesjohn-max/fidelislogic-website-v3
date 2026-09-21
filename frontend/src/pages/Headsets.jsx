import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SEO } from "../components/SEO";
import { DetailHero } from "../components/DetailHero";
import { CtaBand } from "../components/CtaBand";
import { StructuredData, serviceSchema } from "../components/StructuredData";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FAQSection } from "../components/FAQSection";
import { FAQSchema, headsetsFAQs } from "../components/FAQSchema";
import { SolutionBrands } from "../components/SolutionBrands";
import { RelatedServices } from "../components/RelatedServices";
import { RelatedArticles } from "../components/RelatedArticles";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { analytics } from "../lib/analytics";
import { seoConfig } from "../data/seoConfig";
import { headsetDetails } from "../data/siteContent";
import { ArrowRight, CheckCircle2, Headphones } from "lucide-react";

export const Headsets = () => {
  const {
    hero,
    personas,
    whatWeSolve,
    environmentFactors,
    standardisation,
    evaluationSteps
  } = headsetDetails;

  const service = serviceSchema(
    "Enterprise Headsets & Collaboration Devices",
    "Standardize communication devices across your organization. Expert guidance on enterprise headsets for call centers, hybrid workers, and executives."
  );

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.headsets.title}
        description={seoConfig.headsets.description}
        keywords={seoConfig.headsets.keywords}
        ogImage={hero.ogImage}
      />
      <StructuredData data={service} />
      <FAQSchema faqs={headsetsFAQs} />
      <Breadcrumbs
        items={[
          { name: "Solutions", href: "/solutions" },
          { name: "Enterprise Headsets" }
        ]}
        className="pt-24"
      />
      <DetailHero
        image={hero.imageBase}
        imagePosition="65% 40%"
        icon={Headphones}
        label="Enterprise Headsets"
        title={hero.title}
        subtitle={hero.subtitle}
        testId="headsets-hero"
        actions={
          <>
            {/* Primary action for this page: a standardisation requirement. */}
            <Link
              to="/contact"
              onClick={() =>
                analytics.solutionEnquiryClick({ solution: "headsets", location: "headsets_hero" })
              }
            >
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40">
                Discuss a standardisation requirement
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </>
        }
      />

      {/* Personas Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Solutions for every user</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Different roles have different needs—we help you match devices to personas
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {personas.map((persona, index) => {
              const IconComponent = LucideIcons[persona.icon];
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="text-white" size={28} />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-dark mb-3">
                      {persona.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{persona.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Solve Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">What we solve</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Common challenges in enterprise headset deployments
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {whatWeSolve.map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <p className="text-lg text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Environment and compatibility */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" data-testid="headsets-environment">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="section-label mb-3">Environment and compatibility</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Six questions that decide the device
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Answer these and the shortlist writes itself. Skip them and you end up
              comparing specifications that do not matter for your users.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {environmentFactors.map((factor) => {
              const IconComponent = LucideIcons[factor.icon];
              return (
                <div
                  key={factor.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                  data-testid={`headsets-environment-${factor.icon.toLowerCase()}`}
                >
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-5">
                    {IconComponent && <IconComponent size={20} aria-hidden="true" />}
                  </span>
                  <h3 className="text-lg font-semibold text-brand-dark leading-snug">{factor.title}</h3>
                  <p className="mt-2.5 text-gray-600 leading-relaxed">{factor.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Standardisation and evaluation */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="headsets-standardisation">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="section-label mb-3">Standardisation</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              A short approved list beats an open catalogue
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Standardising is what turns headsets from a recurring purchasing argument into a
              managed asset: fewer models, one configuration, predictable spares and a support
              desk that knows what it is looking at.
            </p>
            <ul className="mt-6 space-y-3">
              {standardisation.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="section-label mb-3">Evaluation</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              How we get to the approved list
            </h2>
            <ol className="mt-6 space-y-4">
              {evaluationSteps.map((item) => (
                <li
                  key={item.step}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <span
                    className="inline-flex w-10 h-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm font-bold"
                    aria-hidden="true"
                  >
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-semibold text-brand-dark">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Approach Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-bold text-brand-dark mb-4 tracking-tight">Our approach</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-blue-100 mb-4">01</div>
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Assess user needs</h3>
                <p className="text-gray-600">
                  Survey your teams to understand work patterns, UC platform usage, and comfort preferences.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-blue-100 mb-4">02</div>
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Recommend a shortlist</h3>
                <p className="text-gray-600">
                  Provide 2-3 vendor-neutral options per persona with clear rationale and pricing.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-blue-100 mb-4">03</div>
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Deploy & support</h3>
                <p className="text-gray-600">
                  Coordinate procurement, provisioning, user training, and ongoing fleet management.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Brand Ecosystem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-brand-dark mb-6 tracking-tight">
            Brand & platform ecosystem
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mb-8">
            We work across leading collaboration device OEMs available in the UAE—including Poly, Jabra, Logitech, and others—recommending based on your UC platform, budget, and user requirements.
          </p>
        </div>
      </section>

      {/* Brand Ecosystem */}
      <SolutionBrands
        solutionSlug="headsets"
        title="Headset brands we standardize on"
        subtitle="Persona-fit recommendations backed by fleet-management tooling — so comfort, certification, and IT operations are all addressed."
      />

      {/* Deployment and lifecycle support */}
      <RelatedServices
        slugs={["consulting", "deployment-configuration", "managed-support", "technology-refresh"]}
        solution="headsets"
        heading="Deployment and lifecycle support"
        subheading="Provisioning, fleet management, support and the refresh cycle that keeps the estate current."
        background="gray"
        testIdPrefix="headsets-services"
      />

      {/* Renders only once approved cases exist */}
      <CaseStudyStrip
        filter={{ solution: "/solutions/headsets" }}
        heading="Headset standardisation engagements"
        background="white"
        testIdPrefix="headsets-cases"
      />

      <RelatedArticles
        categories={["headset", "device", "audio", "hybrid"]}
        topic="headsets"
        heading="More on collaboration devices"
        background="gray"
        testIdPrefix="headsets-articles"
      />

      {/* FAQ Section */}
      <FAQSection
        faqs={headsetsFAQs}
        subtitle="Answers to common questions about standardizing enterprise communication devices."
        testIdPrefix="headsets-faq"
      />

      <CtaBand
        title="Discuss a headset standardisation requirement"
        location="headsets_footer"
        ctaLabel="Discuss a standardisation requirement"
        testId="headsets-cta"
      >
        Tell us how many users, which platform and what the rooms and floors sound like — we
        will come back with profiles and a shortlist.
      </CtaBand>
    </div>
  );
};
