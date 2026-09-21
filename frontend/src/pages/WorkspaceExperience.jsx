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
import { FAQSchema, workspaceFAQs } from "../components/FAQSchema";
import { SolutionBrands } from "../components/SolutionBrands";
import { RelatedServices } from "../components/RelatedServices";
import { RelatedArticles } from "../components/RelatedArticles";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { analytics } from "../lib/analytics";
import { seoConfig } from "../data/seoConfig";
import { workspaceExperienceDetails } from "../data/siteContent";
import { ArrowRight, CalendarCheck, CheckCircle2, ShieldCheck } from "lucide-react";

export const WorkspaceExperience = () => {
  const {
    hero,
    capabilities,
    platforms,
    challenges,
    sensorsAndAnalytics,
    privacyConsiderations
  } = workspaceExperienceDetails;

  const service = serviceSchema(
    "Room Booking & Workspace Experience Platforms",
    "Optimize office utilization with hot desking, room booking panels, visitor management, and workplace analytics platforms."
  );

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.workspaceExperience.title}
        description={seoConfig.workspaceExperience.description}
        keywords={seoConfig.workspaceExperience.keywords}
        ogImage={hero.ogImage}
      />
      <StructuredData data={service} />
      <FAQSchema faqs={workspaceFAQs} />
      <Breadcrumbs
        items={[
          { name: "Solutions", href: "/solutions" },
          { name: "Workspace Experience" }
        ]}
        className="pt-24"
      />
      <DetailHero
        image={hero.imageBase}
        imagePosition="center"
        icon={CalendarCheck}
        label="Workspace Experience"
        title={hero.title}
        subtitle={hero.subtitle}
        testId="workspaceexperience-hero"
        actions={
          <>
            {/* Primary action for this page: discuss a workspace requirement. */}
            <Link
              to="/contact"
              onClick={() =>
                analytics.solutionEnquiryClick({ solution: "workspace-experience", location: "workspace_hero" })
              }
            >
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40">
                Discuss a workspace requirement
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
            {/* The ROOMZ platform page keeps its own distinct role. */}
            <Link to="/brands/roomz">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                See the ROOMZ platform
              </Button>
            </Link>
          </>
        }
      />

      {/* Challenges — the problems that bring people to this page */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="workspace-challenges">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="section-label mb-3">The problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              What usually prompts a workspace project
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Booking friction, missing utilisation data and a lease decision are the three
              reasons this conversation normally starts.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const IconComponent = LucideIcons[challenge.icon];
              return (
                <div
                  key={challenge.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                  data-testid={`workspace-challenge-${challenge.icon.toLowerCase()}`}
                >
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-5">
                    {IconComponent && <IconComponent size={20} aria-hidden="true" />}
                  </span>
                  <h3 className="text-lg font-semibold text-brand-dark leading-snug">
                    {challenge.title}
                  </h3>
                  <p className="mt-2.5 text-gray-600 leading-relaxed">{challenge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Workspace experience solutions
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive platforms for modern hybrid workplaces
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((capability, index) => {
              const IconComponent = LucideIcons[capability.icon];
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="text-white" size={28} />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-dark mb-3">
                      {capability.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{capability.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Common use cases</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-brand-dark mb-4">
                  Hybrid work enablement
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Support flexible work arrangements with hot desking, advance booking, and real-time space availability.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Book desks in advance or check-in on arrival</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Find colleagues and sit near your team</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Optimize office footprint based on usage data</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-brand-dark mb-4">
                  Meeting room optimization
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Reduce no-shows, ghost meetings, and underutilized spaces with smart booking panels.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Real-time availability at room entrance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Automatic release of no-show bookings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span>Usage analytics to right-size meeting space inventory</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Examples Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-bold text-brand-dark mb-4 tracking-tight">
              Leading platforms we partner with
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl">
              We work with leading workspace experience platforms available in the UAE, recommending based on your specific requirements, integration needs, and budget.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {platforms.map((platform, index) => (
            
           /* <div
      key={index}
      className="bg-white px-8 py-4 rounded-xl shadow-md text-gray-700 font-medium"
            >
              <a
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {platform.name}
              </a>
              </div> */

             <a
                key={index}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card-interactive bg-white px-6 py-4 rounded-xl border border-transparent shadow-md text-gray-700 font-medium flex items-center gap-3"
              >
                <img
                  src={platform.logo}
                  alt={`${platform.name} logo`}
                  className="h-12 w-13 object-contain"
                  loading="lazy"
                />
              
              </a> 

            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Business benefits</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Cost savings</h3>
                <p className="text-gray-600">
                  Reduce real estate costs by optimizing space utilization based on actual occupancy data.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Employee experience</h3>
                <p className="text-gray-600">
                  Seamless booking, wayfinding, and workplace services improve satisfaction and productivity.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Data-driven decisions</h3>
                <p className="text-gray-600">
                  Analytics and reporting enable evidence-based workplace strategy and design.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Less downtime</h3>
                <p className="text-gray-600">
                  Proactive monitoring detects and diagnoses problems early, so IT resolves incidents faster with fewer escalations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sensors and analytics */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" data-testid="workspace-sensors">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="section-label mb-3">Sensors and analytics</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Turning "we think the office is busy" into evidence
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Booking data alone shows intent. Occupancy sensing shows what happened, and the
              gap between the two is usually where the saving is.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensorsAndAnalytics.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-brand-dark leading-snug">{item.title}</h3>
                <p className="mt-2.5 text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy considerations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="workspace-privacy">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="section-label mb-3">Privacy</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Settle the privacy questions before the first sensor goes up
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Occupancy data is about people, even when it is anonymous. Deciding what is
              measured, what is reported and how long it is kept is part of the design, not
              a follow-up task.
            </p>
            <p className="mt-4 text-gray-600 leading-relaxed">
              We help write these answers down so IT, HR and facilities are agreeing to the
              same thing, and so employees can be told plainly what is being measured.
            </p>
          </div>
          <ul className="space-y-3">
            {privacyConsiderations.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-5"
              >
                <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                <span className="text-gray-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ROOMZ capability, and honest guidance on when something else fits better */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" data-testid="workspace-roomz">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 lg:p-9">
            <p className="section-label mb-3">ROOMZ capability</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
              Where ROOMZ fits
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              ROOMZ suits organisations that want to improve room availability without
              adding power and network cabling at every doorway. The display works with the
              existing booking environment, and optional room, desk and huddle sensors add
              evidence about whether reserved space is actually used.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Wire-free displays, so a rollout is not a construction project",
                "Microsoft 365, Exchange or Google Workspace resource accounts",
                "Anonymous occupancy sensing for rooms, desks and huddle spaces",
                "Analytics comparing booked time against occupied time"
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/brands/roomz"
              className="mt-6 inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700"
            >
              ROOMZ platform, products and use cases
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-7 lg:p-9">
            <p className="section-label mb-3">When something else fits better</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
              We will say so
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              No booking platform is right for every estate. These are the situations where we
              would point you somewhere else rather than at a product we distribute.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Your calendar platform or resource-account model is not supported",
                "The real requirement is visitor management or wayfinding, not room booking",
                "You need deep integration with an existing facilities or IWMS platform",
                "Desk allocation is a policy problem rather than a technology one",
                "Cabling is already in place and a wired panel is simply cheaper"
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              onClick={() =>
                analytics.solutionEnquiryClick({ solution: "workspace-experience", location: "workspace_fit" })
              }
              className="mt-6 inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700"
            >
              Discuss a workspace requirement
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Ecosystem */}
      <SolutionBrands
        solutionSlug="workspace-experience"
        title="Featured workspace platforms"
        subtitle="Our strategic partners for room booking, workspace analytics, and device management — chosen for reliability at enterprise scale."
      />

      {/* Deployment */}
      <RelatedServices
        slugs={["workspace-audits", "consulting", "deployment-configuration", "managed-support"]}
        solution="workspace-experience"
        heading="How a workspace rollout gets delivered"
        subheading="Assessment, platform selection, installation and the ongoing administration that keeps the data trustworthy."
        background="gray"
        testIdPrefix="workspace-services"
      />

      {/* Renders only once approved cases exist */}
      <CaseStudyStrip
        filter={{ solution: "/solutions/workspace-experience", pillar: "workspace" }}
        heading="Workspace engagements"
        background="white"
        testIdPrefix="workspace-cases"
      />

      <RelatedArticles
        categories={["workspace", "roomz", "booking", "hybrid"]}
        topic="workspace-experience"
        heading="More on workspace management"
        background="gray"
        testIdPrefix="workspace-articles"
      />

      {/* FAQ Section */}
      <FAQSection
        faqs={workspaceFAQs}
        subtitle="Answers to common questions about room booking, hot desking, and workspace platforms."
        testIdPrefix="workspace-faq"
      />

      <CtaBand
        title="Discuss a workspace requirement"
        location="workspace_experience_footer"
        ctaLabel="Discuss a workspace requirement"
        secondary={{ label: "See the ROOMZ platform", href: "/brands/roomz", testId: "workspace-cta-roomz" }}
        testId="workspace-cta"
      >
        Tell us how many rooms and desks are in scope and which calendar platform you run —
        that is enough to say what an assessment would cover.
      </CtaBand>
    </div>
  );
};
