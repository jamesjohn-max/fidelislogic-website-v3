import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, CheckCircle2, Lock, Tag } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { SEO } from "../components/SEO";
import { StructuredData, organizationWithServicesSchema, breadcrumbSchema } from "../components/StructuredData";
import { FAQSchema, consultingFAQs } from "../components/FAQSchema";
import { FAQSection } from "../components/FAQSection";
import { CtaBand } from "../components/CtaBand";
import { TrustBand } from "../components/TrustBand";
import { AudienceGateway } from "../components/AudienceGateway";
import { AdvisoryProcess } from "../components/AdvisoryProcess";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { HeroCarousel } from "../components/HeroCarousel";
import { HomeServices } from "../components/HomeServices";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { ParallaxMedia } from "../components/ParallaxMedia";
import { siteImages } from "../data/siteImages";
import { BlurFade } from "../components/magicui/blur-fade";
import { BorderBeam } from "../components/magicui/border-beam";
import { analytics } from "../lib/analytics";
import { seoConfig } from "../data/seoConfig";
import { heroData, segmentImageWidths } from "../data/siteContent";
import { priorityPillars, supportingSolutions } from "../data/pillars";
import { partnerCapabilities, partnerSituations, partnerAudience } from "../data/audiences";
import { api, resolveApiAsset } from "../lib/api";
import { services, serviceCoverage } from "../data/services";

export const Home = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Only three cards are rendered, and cards need no post body — ask for
        // summaries. The unsummarized form carries every post's base64 featured
        // image inline and runs to tens of megabytes.
        const response = await api.get(`/blog/posts`, {
          params: { summary: true, limit: 3 },
        });
        const apiPosts = response.data.map(post => ({
          ...post,
          image: resolveApiAsset(post.featured_image || post.image),
        }));
        setBlogPosts(apiPosts);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        setBlogPosts([]);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  const breadcrumbs = [
    { name: "Home", url: typeof window !== "undefined" ? window.location.origin : "" }
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.home.title}
        description={seoConfig.home.description}
        keywords={seoConfig.home.keywords}
        ogImage="/img/social/og-home.jpg"
      />
      <StructuredData data={organizationWithServicesSchema(services, serviceCoverage)} />
      <StructuredData data={breadcrumbSchema(breadcrumbs)} />
      <FAQSchema faqs={consultingFAQs} />

      {/* ── 1 · Opening proposition ──────────────────────────────────────────
          What we are, who we serve, and what to do next — inside the first
          viewport. */}
      <section className="relative min-h-[500px] lg:min-h-[560px] flex items-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <HeroCarousel
          images={heroData.images}
          widths={heroData.imageWidths}
          testId="home-hero-carousel"
        />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/80 via-black/52 to-black/10 lg:from-black/82 lg:via-black/44 lg:to-black/0" />
        {/* Subtle bottom fade so the hero doesn't compete with the gateway below */}
        <div className="absolute inset-x-0 bottom-0 z-[1] h-32 bg-gradient-to-b from-transparent to-white/70" />

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-3xl space-y-7" data-testid="home-hero-content">
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-white backdrop-blur-sm">
              Independent modern workplace technology advice · UAE &amp; GCC
            </span>

            <h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.08] tracking-tight drop-shadow-[0_6px_24px_rgba(0,0,0,0.9)]"
              data-testid="home-hero-title"
            >
              {heroData.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-100 leading-relaxed max-w-2xl drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]">
              {heroData.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/contact"
                onClick={() => analytics.consultationCtaClick({ location: "home_hero" })}
              >
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40 w-full sm:w-auto">
                  Book a Consultation
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              {/* Secondary action: the gateway immediately below. */}
              <a href="#choose-your-journey">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm w-full sm:w-auto"
                  data-testid="home-hero-journey-cta"
                >
                  Choose your journey
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · Choose your journey ─────────────────────────────────────────── */}
      <div id="choose-your-journey" className="scroll-mt-24">
        <AudienceGateway
          background="white"
          heading="Choose your journey"
          subheading="Organisations and delivery partners get the same expertise, entered from different sides of the table. Neither route is the afterthought."
          location="home"
          testIdPrefix="home-audience-gateway"
        />
      </div>

      {/* ── 3 · Priority solutions ──────────────────────────────────────────
          Three dominant pillars, not a grid of equals. Headsets and the rest
          follow as supporting links. */}
      <section
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        data-testid="home-priority-solutions"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <p className="section-label mb-3">What we are asked about most</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              Three areas where the right decision is worth the most
            </h2>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Each starts from the problem rather than the product, and each has a page
              that says what the options actually are.
            </p>
          </div>

          <div className="space-y-6">
            {priorityPillars.map((pillar, index) => {
              const Icon = LucideIcons[pillar.icon];
              return (
                <BlurFade key={pillar.id} inView inViewMargin="-80px">
                <article
                  className="grid lg:grid-cols-12 gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white"
                  data-testid={`home-pillar-${pillar.id}`}
                >
                  {/* Alternate the image side so three stacked bands don't read
                      as one repeated template. */}
                  <ParallaxMedia
                    className={`lg:col-span-5 min-h-[220px] lg:min-h-[300px] bg-gray-100 ${
                      index % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <ResponsiveImage
                      basePath={pillar.imageBase}
                      widths={segmentImageWidths}
                      sizes="(min-width: 1024px) 560px, 100vw"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </ParallaxMedia>

                  <div className="lg:col-span-7 p-7 lg:p-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex w-11 h-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        {Icon && <Icon size={22} aria-hidden="true" />}
                      </span>
                      <p className="text-sm font-semibold text-blue-600">{pillar.tagline}</p>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-brand-dark tracking-tight leading-snug">
                      {pillar.title}
                    </h3>
                    <p className="mt-4 text-gray-600 leading-relaxed max-w-2xl">
                      {pillar.description}
                    </p>
                    <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                      {pillar.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
                      <Link
                        to={pillar.href}
                        onClick={() =>
                          analytics.solutionEnquiryClick({
                            solution: pillar.id,
                            location: "home_pillars"
                          })
                        }
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {pillar.ctaLabel}
                        <ArrowRight size={18} aria-hidden="true" />
                      </Link>
                      {pillar.brandHref && (
                        <Link
                          to={pillar.brandHref}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600"
                        >
                          {pillar.brandLabel}
                          <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      )}
                      {pillar.toolHref && (
                        <Link
                          to={pillar.toolHref}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-blue-600"
                        >
                          {pillar.toolLabel}
                          <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
                </BlurFade>
              );
            })}
          </div>

          {/* Supporting capabilities — present and discoverable, not competing. */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-500 mb-5">
              Also from us
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {supportingSolutions.map((item, index) => {
                const Icon = LucideIcons[item.icon];
                return (
                  <BlurFade key={item.id} inView delay={index * 0.06} className="h-full">
                  <Link
                    to={item.href}
                    className="card-interactive group flex h-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-5"
                    data-testid={`home-supporting-${item.id}`}
                  >
                    <span className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {Icon && <Icon size={18} aria-hidden="true" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-brand-dark group-hover:text-blue-700">
                        {item.title}
                      </span>
                      <span className="block mt-1 text-xs text-gray-500 leading-relaxed">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                  </BlurFade>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 · Room Planner demonstration ─────────────────────────────────── */}
      <section
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white"
        data-testid="home-room-planner"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <p className="section-label mb-3">Room Planner</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
              Document the room before anyone quotes it
            </h2>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Enter the dimensions, seating and platform, and the planner draws the room in
              2D and 3D, checks whether everyone can actually see the display, and produces
              a report you can hand to a technical team or use as the basis of a BOQ.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "A drawn room and equipment list instead of a verbal brief",
                "Sightline and viewing-distance checks against the seats you entered",
                "A shared reference so IT, facilities and finance discuss the same room",
                "A PDF report ready for a technical review or a request for quotation"
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            {/* Privacy wording matches the statement the tool itself makes. */}
            <p className="mt-6 flex items-start gap-2 text-sm text-gray-500 leading-relaxed">
              <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              Nothing you enter is sent anywhere. Your draft stays in this browser, and the
              PDF is built here too.
            </p>
            <div className="mt-8">
              <Link
                to="/tools/room-configurator"
                onClick={() => analytics.roomPlannerStart({ location: "home" })}
              >
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="home-room-planner-cta">
                  Open Room Planner
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Interface preview — a capture of the planner itself, not an illustration. */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <Link
              to="/tools/room-configurator"
              onClick={() => analytics.roomPlannerStart({ location: "home_preview" })}
              className="group relative block rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-xl shadow-gray-900/10"
              aria-label="Open the Room Planner"
            >
              {/* A real capture of the planner's 3D review screen, produced by
                  scripts/optimize-images.sh from image-sources/room-planner/. */}
              <ResponsiveImage
                basePath={siteImages.roomPlanner3d.base}
                widths={siteImages.roomPlanner3d.widths}
                sizes="(min-width: 1024px) 620px, 100vw"
                width={siteImages.roomPlanner3d.width}
                height={siteImages.roomPlanner3d.height}
                alt={siteImages.roomPlanner3d.alt}
                className="image-zoom w-full h-auto"
                testId="home-room-planner-preview"
              />
              {/* The page's one looping element: a slow highlight round the
                  tool. Brand blue into cyan; not rendered under reduced motion. */}
              <BorderBeam size={220} duration={9} colorFrom="#2563EB" colorTo="#22D3EE" borderWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5 · How the advisory model works ───────────────────────────────── */}
      <AdvisoryProcess background="gray" testIdPrefix="home-advisory-process" showModel />

      {/* ── 6 · Evidence and certifications ───────────────────────────────── */}
      <TrustBand background="white" testIdPrefix="home-trust-band" />

      {/* ── 7 · Partner support ───────────────────────────────────────────── */}
      <section
        className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-brand-dark text-white"
        data-testid="home-partner-support"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="section-label !text-fidelis-cyan mb-3">Partner support</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              White-label capacity for resellers and system integrators
            </h2>
            <p className="mt-5 text-lg text-gray-300 leading-relaxed">
              Assessment, design, documentation, project management, deployment assistance
              and support, delivered under your brand. Your customer stays your customer —
              we do not supply the hardware and we do not compete for the order.
            </p>
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-5">
              <Lock className="w-5 h-5 mt-0.5 shrink-0 text-fidelis-cyan" aria-hidden="true" />
              <p className="text-sm text-gray-300 leading-relaxed">
                Confidential by default: your customers, pricing and proposals are never
                used as references or marketing material without your written agreement.
              </p>
            </div>
            <div className="mt-8">
              <Link
                to={partnerAudience.href}
                onClick={() => analytics.audiencePathwaySelect({ audience: "partner", location: "home_partner_section" })}
              >
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="home-partner-cta">
                  Explore Partner Support
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
            <BlurFade inView className="rounded-2xl border border-white/15 bg-white/[0.04] p-6">
              <h3 className="font-semibold text-white mb-4">When partners call us</h3>
              <ul className="space-y-3">
                {partnerSituations.slice(0, 3).map((situation) => (
                  <li key={situation.title} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-fidelis-cyan" aria-hidden="true" />
                    <span>{situation.title}</span>
                  </li>
                ))}
              </ul>
            </BlurFade>
            <BlurFade inView delay={0.08} className="rounded-2xl border border-white/15 bg-white/[0.04] p-6">
              <h3 className="font-semibold text-white mb-4">What you can hand over</h3>
              <ul className="space-y-3">
                {partnerCapabilities.slice(0, 5).map((capability) => (
                  <li key={capability.title} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-fidelis-cyan" aria-hidden="true" />
                    <span>{capability.title}</span>
                  </li>
                ))}
              </ul>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ── 8 · Case studies ───────────────────────────────────────────────
          Renders only once data/caseStudies.js has approved entries. */}
      <CaseStudyStrip
        limit={3}
        heading="Recent engagements"
        subheading="Each case states the situation, the scope, who delivered it, and the outcome we can evidence."
        background="white"
        testIdPrefix="home-cases"
      />

      {/* ── 9 · Supporting services (Plan · Deliver · Operate) ─────────────── */}
      <HomeServices />

      {/* ── 10 · Insights, then Smart Deals as a separate module ───────────── */}
      <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
            <div className="max-w-3xl">
              <p className="section-label mb-3">Insights</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark tracking-tight leading-tight">
                Practical guidance on rooms, workspace and applications
              </h2>
            </div>
            <Link to="/blog">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                View all articles
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>

          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {blogPosts.slice(0, 3).map((post, index) => (
                <BlurFade key={post.id} inView delay={index * 0.08} className="h-full">
                <Link to={`/blog/${post.slug}`} className="block h-full">
                  <Card className="card-interactive h-full border-0">
                    <CardContent className="p-0">
                      {post.image ? (
                        <img
                          src={post.image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-48 object-cover rounded-t-2xl"
                        />
                      ) : (
                        <div
                          className="w-full h-48 rounded-t-2xl bg-gradient-to-br from-gray-100 to-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {typeof post.date === 'string' && post.date.includes('-')
                              ? new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : post.date
                            }
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-brand-dark mb-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm">{post.excerpt}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                </BlurFade>
              ))}
            </div>
          )}

          {/* Smart Deals: a clearly separate commercial module, so promotions
              never read as the reason behind an advisory recommendation. */}
          <div
            className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-7 lg:p-8 flex flex-col lg:flex-row lg:items-center gap-6"
            data-testid="home-smart-deals"
          >
            <span className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-white border border-amber-200 text-amber-600 shrink-0">
              <Tag size={22} aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-dark tracking-tight">Smart Deals</h3>
              <p className="mt-2 text-gray-700 leading-relaxed max-w-2xl">
                Current promotions on devices and platforms, each with its availability,
                validity period and applicable geography stated. Separate from our advice
                on purpose: a deal is never the reason we recommend something.
              </p>
            </div>
            <Link to="/deals" className="shrink-0">
              <Button
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900 w-full lg:w-auto"
                data-testid="home-smart-deals-cta"
              >
                See current deals
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FAQSection
        faqs={consultingFAQs}
        subtitle="Common questions about how we work"
        testIdPrefix="home-faq"
      />

      {/* ── 11 · Final consultation invitation ─────────────────────────────── */}
      <CtaBand
        title="Start with a conversation, not a quotation"
        location="home_footer"
        ctaLabel="Book a Consultation"
        secondary={{ label: "Send an enquiry", href: "/contact#enquiry", testId: "home-footer-enquire" }}
        showCall
        testId="home-footer-cta"
      >
        Tell us what you are trying to decide. If we are not the right help, we will say so.
      </CtaBand>
    </div>
  );
};
