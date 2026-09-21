import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SEO } from "../components/SEO";
import { DetailHero } from "../components/DetailHero";
import { CtaBand } from "../components/CtaBand";
import { StructuredData, serviceSchema, webPageSchema } from "../components/StructuredData";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { FAQSection } from "../components/FAQSection";
import { FAQSchema, businessAppsFAQs, businessAppsSeoFAQs } from "../components/FAQSchema";
import { RelatedServices } from "../components/RelatedServices";
import { RelatedArticles } from "../components/RelatedArticles";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { analytics } from "../lib/analytics";
import { seoConfig } from "../data/seoConfig";
import { businessAppsDetails } from "../data/siteContent";
import * as LucideIcons from "lucide-react";
import { AlertTriangle, ArrowRight, Bot, BrainCircuit, CheckCircle2, Cloud, Database, FileSpreadsheet, Puzzle, Server, ShieldCheck, TrendingDown, BarChart3 } from "lucide-react";

const valueCards = [
  {
    icon: Database,
    title: "One connected platform",
    description: "Consolidate finance, HR, sales, and operations into a single low-cost system that grows with your team."
  },
  {
    icon: BrainCircuit,
    title: "AI-assisted data entry",
    description: "Free and paid AI tools help your team keep ERP records accurate without a dedicated admin function."
  },
  {
    icon: TrendingDown,
    title: "Predictable monthly cost",
    description: "Starter plans from USD 10/month and phased implementation so cash flow is never a surprise."
  },
  {
    icon: Cloud,
    title: "Deploy your way",
    description: "Cloud, on-premise, or hybrid — pick the model that matches your control, data, and connectivity needs."
  },
  {
    icon: ShieldCheck,
    title: "UAE support on the ground",
    description: "Configuration, training, and monthly optimization delivered by a Dubai-based team that knows local workflows."
  }
];

const aiFeatures = [
  {
    title: "Routine entry & classification",
    description: "AI drafts and categorizes invoices, expenses, and journal entries — the owner approves in one click."
  },
  {
    title: "Automated reminders & follow-ups",
    description: "AI monitors overdue receivables, low stock, and approvals pending, then nudges the right person at the right time."
  },
  {
    title: "Reporting & insight generation",
    description: "Ask questions in plain English and get instant ERP-backed dashboards, variance summaries, and trend commentary."
  }
];

const deploymentOptions = [
  {
    title: "Cloud (SaaS)",
    description: "Lowest upfront cost with automatic updates and anywhere access. Ideal for lean teams and multi-location businesses.",
    bullets: [
      "Zero infrastructure to manage",
      "Rapid go-live in less than a week",
      "Predictable monthly subscription"
    ]
  },
  {
    title: "On-premise",
    description: "Full data control and one-time license option. Best when connectivity is variable or compliance requires local hosting.",
    bullets: [
      "Your data stays inside your network",
      "One-time or perpetual licensing options",
      "Works fully offline for local operations"
    ]
  },
  {
    title: "Hybrid",
    description: "Sensitive workloads on-prem, collaborative modules in the cloud. A pragmatic middle path for growing SMEs.",
    bullets: [
      "Mix cloud collaboration with on-prem control",
      "Scale specific modules independently",
      "Secure sync with role-based access"
    ]
  }
];

const seoHighlights = [
  "ERP configuration for finance, inventory, procurement, and multi-entity operations",
  "HRMS deployments covering payroll, attendance, leave, and employee self-service",
  "CRM setup with lead capture, pipeline management, and quotation-to-invoice flow",
  "AI integrations that automate routine ERP updates with owner-in-the-loop approvals",
  "Cloud, on-prem, and hybrid deployment models tuned to your budget and control needs",
  "Live-in-a-week focused first phase followed by monthly optimization and training"
];

export const BusinessApps = () => {
  const { hero, painPoints, offer, dataAndIntegration, aiUseCases } = businessAppsDetails;

  const service = serviceSchema(
    "Low-Cost ERP, HRMS, and CRM for Small Businesses",
    "Affordable ERP, HRMS, CRM, and AI ERP integration with near-zero license cost platform options, cloud or on-prem deployment, configuration support, training, and monthly payment plans."
  );

  const canonicalUrl = "https://fidelislogic.com/solutions/business-apps";
  const webPage = webPageSchema(
    seoConfig.businessApps.title,
    seoConfig.businessApps.description,
    canonicalUrl
  );

  const offerCatalogSchema = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Low-Cost ERP, HRMS, CRM, and AI Integration Plans for Small Businesses",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Small Business Cloud ERP, HRMS, CRM, and AI Integration",
        priceCurrency: "USD",
        price: "10",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          priceCurrency: "USD",
          price: "10",
          unitText: "MONTH"
        },
        description: "Starter monthly plan for small businesses from USD 10/month, with configuration, AI-assisted ERP integration, and support scoped after discovery."
      },
      {
        "@type": "Offer",
        name: "On-Premise ERP, HRMS, and CRM Deployment",
        description: "Self-hosted business application deployment with implementation, configuration, training, and support available on monthly payment plans."
      }
    ]
  };

  const allBusinessAppsFAQs = [...businessAppsFAQs, ...businessAppsSeoFAQs];

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.businessApps.title}
        description={seoConfig.businessApps.description}
        keywords={seoConfig.businessApps.keywords}
        ogImage={hero.ogImage}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData data={webPage} />
      <StructuredData data={service} />
      <StructuredData data={offerCatalogSchema} />
      <FAQSchema faqs={allBusinessAppsFAQs} />
      <Breadcrumbs
        items={[
          { name: "Solutions", href: "/solutions" },
          { name: "Business Applications" }
        ]}
        className="pt-24"
      />
      <DetailHero
        image={hero.imageBase}
        imagePosition="70% 45%"
        icon={BarChart3}
        label="Business Applications"
        title={hero.title}
        subtitle={hero.subtitle}
        facts={[
          { label: "From", value: "USD 10/month", helper: "starter plan" },
          { label: "License", value: "Almost Zero", helper: "for eligible platforms" },
          { label: "Go Live", value: "< 1 Week", helper: "lean first phase" }
        ]}
        testId="businessapps-hero"
        actions={
          <>
              {/* Primary action for this page: a process consultation. */}
              <Link
                to="/contact"
                onClick={() =>
                  analytics.solutionEnquiryClick({ solution: "business-apps", location: "business_apps_hero" })
                }
              >
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40">
                  Request a process consultation
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
              <a href="#deployment-models">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  Compare Cloud vs On-Prem
                </Button>
              </a>
          </>
        }
      />

      {/* Value Proposition Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Business software without enterprise license shock
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
              Start with the modules you need today, keep your monthly spend predictable, and add depth when your operations are ready.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {valueCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="text-white" size={28} />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-dark mb-3">
                      {card.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI ERP Integration Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Bot className="text-white" size={28} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6 tracking-tight">
                AI integration as a core ERP advantage
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Fidelis Logic connects ERP platforms with paid and free AI tools so small-business owners can keep records moving even with entry-level staff or no dedicated admin team. AI can assist with routine entries, updates, classifications, reminders, and reporting while approval controls keep the owner in charge.
              </p>
            </div>
            <div className="grid gap-6">
              {aiFeatures.map((feature) => (
                <Card key={feature.title} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold text-brand-dark mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Common small business challenges
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Pain points we help organizations overcome
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {painPoints.map((pain, index) => {
              const IconComponent = LucideIcons[pain.icon];
              return (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="text-white" size={28} />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-dark mb-3">
                      {pain.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{pain.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">What we offer</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              End-to-end business application consulting and support
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {offer.map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <p className="text-lg text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Types Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-bold text-brand-dark mb-4 tracking-tight">
              Application categories
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-brand-dark mb-4">ERP systems</h3>
                <p className="text-gray-600 mb-4">
                  Centralize accounting, inventory, purchasing, sales orders, projects, and operations in one low-cost system.
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Accounting & Financial Management</li>
                  <li>• Inventory & Supply Chain</li>
                  <li>• Procurement & Vendor Management</li>
                  <li>• Multi-Currency & Multi-Entity</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-brand-dark mb-4">HRMS platforms</h3>
                <p className="text-gray-600 mb-4">
                  Automate employee records, onboarding, leave, attendance, payroll workflows, and approvals.
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Employee Records & Self-Service</li>
                  <li>• Payroll & Benefits Administration</li>
                  <li>• Time & Attendance Tracking</li>
                  <li>• Performance & Goal Management</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-brand-dark mb-4">CRM solutions</h3>
                <p className="text-gray-600 mb-4">
                  Manage leads, opportunities, quotations, customer follow-up, service tickets, and sales reporting.
                </p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• Lead & Opportunity Management</li>
                  <li>• Sales Pipeline & Forecasting</li>
                  <li>• Customer Support & Ticketing</li>
                  <li>• Marketing Automation & Campaigns</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Deployment Options Section */}
      <section id="deployment-models" className="scroll-mt-24 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Cloud, on-prem, or hybrid</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Choose the deployment model that matches your budget, control needs, and growth plan.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {deploymentOptions.map((option, index) => {
              const bullets = option.bullets;
              return (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-brand-dark mb-4">{option.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{option.description}</p>
                  <ul className="space-y-3">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-gray-600">
                        <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 max-w-4xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Affordable ERP, HRMS, CRM, and AI ERP integration in the UAE
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Fidelis Logic helps small businesses move away from spreadsheets and disconnected tools into an integrated business application platform. We configure ERP for finance and operations, HRMS for people workflows, CRM for sales and customer follow-up, and AI integrations that help owners maintain ERP records with fewer manual admin hours. Cloud and on-premise deployment options are designed for lean monthly budgets, with a focused first phase that can go live in less than a week.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {seoHighlights.map((highlight) => (
              <div key={highlight} className="flex items-start space-x-4">
                <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-1" size={22} />
                <p className="text-lg text-gray-700">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Approach Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Our approach</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Structured methodology for successful deployments
            </p>
          </div>
          <div className="space-y-6 max-w-4xl">
            {[
              {
                step: "01",
                title: "Discovery & requirements",
                description:
                  "Workshop sessions to understand your business processes, pain points, and success criteria."
              },
              {
                step: "02",
                title: "Low-cost platform selection",
                description:
                  "Evaluate open-source and affordable platforms based on functional fit, total cost of ownership, deployment model, and UAE support needs."
              },
              {
                step: "03",
                title: "Implementation in less than a week",
                description:
                  "Launch a lean first phase with core setup, users, roles, essential forms, basic reports, and handover in less than a week when the scope is focused."
              },
              {
                step: "04",
                title: "Training & change management",
                description:
                  "User training, documentation, and support to ensure adoption across your organization."
              },
              {
                step: "05",
                title: "Monthly managed support",
                description:
                  "Ongoing support, hosting reviews, report tuning, module additions, and continuous improvement under predictable monthly plans."
              }
            ].map((phase, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="text-5xl font-bold text-blue-100">{phase.step}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-brand-dark mb-2">
                        {phase.title}
                      </h3>
                      <p className="text-gray-600">{phase.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data and integration */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50" data-testid="business-apps-data">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="section-label mb-3">Data and integration</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              The part that decides whether go-live is calm
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Most implementations are not derailed by the software. They are derailed by
              migrating data nobody agreed on, from a system nobody wanted to reconcile.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataAndIntegration.map((item) => {
              const IconComponent = LucideIcons[item.icon];
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                  data-testid={`business-apps-data-${item.icon.toLowerCase()}`}
                >
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-5">
                    {IconComponent && <IconComponent size={20} aria-hidden="true" />}
                  </span>
                  <h3 className="text-lg font-semibold text-brand-dark leading-snug">{item.title}</h3>
                  <p className="mt-2.5 text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI use cases, tied to workflows that already exist */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="business-apps-ai">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="section-label mb-3">AI, where it earns its place</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Applied to the work your team already repeats
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Each of these sits inside an existing workflow and produces a draft a person
              approves. That is deliberate: assistance you can check is worth more than
              automation you have to audit.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiUseCases.map((useCase) => (
              <div
                key={useCase.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
                data-testid="business-apps-ai-case"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-600">
                  {useCase.workflow}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-brand-dark leading-snug">
                  {useCase.title}
                </h3>
                <p className="mt-2.5 text-gray-600 leading-relaxed">{useCase.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-gray-600 leading-relaxed">
            We scope AI against a process you can name and a volume you can count. If neither
            exists yet, the honest recommendation is to fix the process first.
          </p>
        </div>
      </section>

      {/* Deployment and support */}
      <RelatedServices
        slugs={["consulting", "training-adoption", "managed-support"]}
        solution="business-apps"
        heading="Deployment and ongoing support"
        subheading="Discovery and platform selection, user training, and the monthly support that keeps the system in use."
        background="gray"
        testIdPrefix="business-apps-services"
      />

      {/* Renders only once approved cases exist */}
      <CaseStudyStrip
        filter={{ solution: "/solutions/business-apps", pillar: "business-apps" }}
        heading="Business application engagements"
        background="white"
        testIdPrefix="business-apps-cases"
      />

      <RelatedArticles
        categories={["erp", "business application", "crm", "hrms", "ai"]}
        topic="business-apps"
        heading="More on business applications"
        background="gray"
        testIdPrefix="business-apps-articles"
      />

      {/* FAQ Section */}
      <FAQSection
        faqs={businessAppsFAQs}
        subtitle="Answers to common questions about low-cost ERP, HRMS, CRM, and AI integration for small businesses."
        testIdPrefix="business-apps-faq"
      />
      <FAQSection
        faqs={businessAppsSeoFAQs}
        title="Low-cost ERP questions"
        subtitle="Search-focused answers for small businesses comparing affordable ERP, HRMS, CRM, cloud, on-premise, and AI ERP integration options."
        testIdPrefix="business-apps-seo-faq"
      />

      <CtaBand
        title="Which process should you fix first?"
        location="business_apps_footer"
        ctaLabel="Request a process consultation"
        secondary={{ label: "Compare cloud vs on-prem", href: "/solutions/business-apps#deployment-models", testId: "business-apps-cta-deployment" }}
        testId="business-apps-cta"
      >
        Tell us which part of the business consumes the most manual effort. We will scope the
        modules, the deployment model and a monthly plan around that.
      </CtaBand>
    </div>
  );
};
