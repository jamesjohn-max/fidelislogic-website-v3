import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SEO } from "../components/SEO";
import { StructuredData, organizationSchema } from "../components/StructuredData";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { PageHeader } from "../components/PageHeader";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { TrustedBrands } from "../components/TrustedBrands";
import { TrustBand } from "../components/TrustBand";
import { AdvisoryProcess } from "../components/AdvisoryProcess";
import { AudienceGateway } from "../components/AudienceGateway";
import { CtaBand } from "../components/CtaBand";
import { seoConfig } from "../data/seoConfig";
import { whyChooseUs } from "../data/siteContent";
import { serviceCoverage } from "../data/services";

export const About = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.about.title}
        description={seoConfig.about.description}
        keywords={seoConfig.about.keywords}
      />
      <StructuredData data={organizationSchema} />
      <Breadcrumbs items={[{ name: "About" }]} className="pt-24" />
      <PageHeader
        label="About Fidelis Logic"
        title="An independent adviser, not another vendor in the queue"
        testId="about-hero-title"
        actions={
          <Link to="/contact">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Book a Consultation
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
        }
      >
        <p>
          Fidelis Logic helps organisations across {serviceCoverage.label} decide what
          workplace technology they actually need — and then works through the reseller or
          system integrator they already trust to get it delivered.
        </p>
        <p>
          Twenty years of modern workplace projects, certified project management, and
          technical certification in the platforms we put forward. We are not in the supply
          chain, which is what keeps the advice about fit.
        </p>
      </PageHeader>

      {/* The approved evidence, immediately under the proposition */}
      <TrustBand
        background="gray"
        heading="What stands behind the advice"
        subheading="Experience, certification and coverage — stated plainly, with nothing implied about tiers or exclusivity."
        showLinks={false}
        testIdPrefix="about-trust"
      />

      {/* How we work — the same four stages shown on the homepage */}
      <AdvisoryProcess
        background="white"
        label="How we work"
        heading="The delivery philosophy, in four stages"
        subheading="Understand, assess, recommend in writing, then support delivery through the customer's own partner."
        testIdPrefix="about-process"
      />

      {/* Existing positioning copy, retained */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="section-label mb-3">Why customers work with us</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Guidance that respects your vendors and your budget
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We deliver outcomes, not just implementations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item) => {
              const IconComponent = LucideIcons[item.icon];
              return (
                <Card key={item.title} className="border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                      {IconComponent && <IconComponent className="text-white" size={28} aria-hidden="true" />}
                    </div>
                    <h3 className="text-xl font-semibold text-brand-dark mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <ResponsiveImage
                basePath="/img/about/mission"
                widths={[768, 1280]}
                sizes="(min-width: 1024px) 600px, 92vw"
                alt="Two business partners shaking hands in an office"
                className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight">Our mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                We help organizations cut through the complexity of workplace technology by providing structured consulting, vendor-neutral guidance, and expert delivery support.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                The result is confident technology decisions and successful implementation through trusted resellers or system integrators.
               </p> 
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-8 tracking-tight">Our story</h2>
          <div className="space-y-6 text-lg text-gray-600 leading-relaxed max-w-3xl">
            <p>
              Founded in the UAE, we recognized that organizations were making costly mistakes in workplace technology investments—not because of poor execution, but because of unclear requirements and vendor noise.
            </p>
            <p>
              Our consultative approach starts with understanding your business objectives, assessing your current environment, and designing solutions tailored to your needs. We then implement using the best-fit vendors available in the regional ecosystem—not based on partnerships, but on what actually works for you.
            </p>
            <p>
              Today, we serve organizations across the UAE—from SMBs implementing their first ERP system to enterprises deploying Microsoft Teams Rooms at scale. Our focus remains the same: clarity, reliability, and measurable results.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Our values</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Principles that guide how we work
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Clarity</h3>
                <p className="text-gray-600">
                  We simplify complex technology decisions with clear frameworks and honest guidance.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Reliability</h3>
                <p className="text-gray-600">
                  We deliver on commitments with structured project management and quality assurance.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Partnership</h3>
                <p className="text-gray-600">
                  We act as an extension of your team—aligned with your success, not vendor quotas.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Long-term support</h3>
                <p className="text-gray-600">
                  We stay beyond go-live to ensure your investment continues delivering value.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Trusted partner ecosystem
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
              We work with leading OEMs and distributors in the UAE, supporting solutions that are chosen based on customer requirements, project fit, availability, and delivery readiness.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold text-brand-dark">Microsoft ecosystem</h3>
                <p className="text-gray-600 mt-2">Teams Rooms, Microsoft 365, Azure</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold text-brand-dark">Collaboration platforms</h3>
                <p className="text-gray-600 mt-2">Zoom, Webex, Google Workspace</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold text-brand-dark">AV & devices</h3>
                <p className="text-gray-600 mt-2">Poly, Logitech, Neat, Yealink, Jabra, Lenovo, Crestron etc.</p>
              </CardContent>
            </Card>
             <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold text-brand-dark">Workspace experience</h3>
                <p className="text-gray-600 mt-2">ROOMZ, Morbit.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partner Ecosystem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="about-partner-ecosystem-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 mb-14">
            <div className="lg:col-span-2">
              <p className="section-label mb-3">Partner ecosystem</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-6 leading-tight tracking-tight">
                A curated ecosystem, not a vendor catalog.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Fidelis Logic is a UAE-based advisory and delivery partner with a
                deliberately short list of strategic brand partners. Each one earns its
                place because it solves a specific problem better than the alternatives.
              </p>
              <p className="text-gray-600 leading-relaxed">
                That discipline lets us stay honest with customers. If none of our partners
                is the right fit for your problem, we'll tell you — and help you find the
                one that is.
              </p>
            </div>
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Strategic, not transactional",
                  body: "We co-invest in relationships with vendors whose roadmaps align with our customers' futures — not whoever has the biggest margin this quarter."
                },
                {
                  title: "Authorized and accountable",
                  body: "We are authorized deployment partners for the brands we represent, with certifications, direct vendor support escalation, and lifecycle ownership."
                },
                {
                  title: "Vendor-neutral recommendations",
                  body: "Our advisory layer is not locked to any single brand. Recommendations are driven by your business case, not a quota sheet."
                },
                {
                  title: "Work through your channels",
                  body: "We integrate with your preferred resellers and system integrators — or deliver directly. Either way, the buck stops with us."
                }
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                  data-testid={`about-ecosystem-pillar-${item.title.toLowerCase().replace(/[^a-z]+/g, '-')}`}
                >
                  <h3 className="text-base font-semibold text-brand-dark mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Detailed brand grid */}
      <AudienceGateway
        background="white"
        heading="Working with us"
        subheading="Organisations engage us directly. Resellers and system integrators engage us under their own brand."
        location="about"
        testIdPrefix="about-gateway"
      />

      <TrustedBrands
        title="Meet the brands behind our deliveries."
        subtitle="Each partner is chosen for a specific role in the modern workplace stack — from room booking and device management to headsets and video collaboration."
        variant="detailed"
        background="gray"
        testIdPrefix="about-brand-ecosystem"
      />
      <CtaBand
        title="Start with a conversation"
        location="about_footer"
        ctaLabel="Book a Consultation"
        showCall
        testId="about-cta"
      >
        Tell us what you are trying to decide. If we are not the right help, we will say so.
      </CtaBand>

    {/* Hiding it for now  
       Team Section 
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Leadership Team</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Experienced professionals with deep regional expertise
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-brand-dark mb-1">Team Member {i}</h3>
                  <p className="text-gray-600 mb-2">Position Title</p>
                  <p className="text-sm text-gray-500">
                    Brief bio highlighting expertise and experience in workplace technology consulting.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}
    </div>
  );
};
