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
import { FAQSchema, meetingRoomsFAQs } from "../components/FAQSchema";
import { SolutionBrands } from "../components/SolutionBrands";
import { RelatedServices } from "../components/RelatedServices";
import { RelatedArticles } from "../components/RelatedArticles";
import { CaseStudyStrip } from "../components/CaseStudyStrip";
import { analytics } from "../lib/analytics";
import { seoConfig } from "../data/seoConfig";
import { meetingRoomDetails } from "../data/siteContent";
import { ArrowRight, CheckCircle2, Presentation } from "lucide-react";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { siteImages } from "../data/siteImages";

export const MeetingRooms = () => {
  const { hero, useCases, capabilities, designConsiderations } = meetingRoomDetails;

  const service = serviceSchema(
    "Meeting Rooms & AV Systems",
    "Expert consultation for Microsoft Teams Rooms, Zoom Rooms, and BYOD meeting spaces. Professional AV system design, installation, and commissioning."
  );

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.meetingRooms.title}
        description={seoConfig.meetingRooms.description}
        keywords={seoConfig.meetingRooms.keywords}
        ogImage={hero.ogImage}
      />
      <StructuredData data={service} />
      <FAQSchema faqs={meetingRoomsFAQs} />
      <Breadcrumbs
        items={[
          { name: "Solutions", href: "/solutions" },
          { name: "Meeting Rooms & AV" }
        ]}
        className="pt-24"
      />
      <DetailHero
        image={hero.imageBase}
        imagePosition="60% 50%"
        icon={Presentation}
        label="Meeting Rooms & AV"
        title={hero.title}
        subtitle={hero.subtitle}
        testId="meetingrooms-hero"
        actions={
          <>
              {/* Primary action for this page (blueprint section 7): plan a
                  room or discuss a project — not the generic consultation CTA. */}
              <Link
                to="/tools/room-configurator"
                onClick={() => analytics.roomPlannerStart({ location: "meeting_rooms_hero" })}
              >
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40">
                  Start planning your room
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
              <Link
                to="/contact"
                onClick={() =>
                  analytics.solutionEnquiryClick({ solution: "meeting-rooms", location: "meeting_rooms_hero" })
                }
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-white/40 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
                >
                  Discuss a project
                </Button>
              </Link>
          </>
        }
      />

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Meeting room types</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Tailored solutions for every collaboration scenario
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase) => {
              const photo = siteImages.meetingRoomTypes[useCase.image];
              return (
                <Card key={useCase.title} className="h-full overflow-hidden border-0 shadow-lg" data-testid={`meeting-room-type-${useCase.image}`}>
                  {photo && (
                    <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                      <ResponsiveImage
                        basePath={photo.base}
                        widths={photo.widths}
                        sizes="(min-width: 1024px) 300px, (min-width: 768px) 45vw, 100vw"
                        width={photo.width}
                        height={photo.height}
                        alt={photo.alt}
                        className="w-full h-full object-cover"
                        style={photo.position ? { objectPosition: photo.position } : undefined}
                      />
                    </div>
                  )}
                  <CardContent className="p-6 lg:p-7">
                    <h3 className="text-xl font-semibold text-brand-dark mb-3">
                      {useCase.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{useCase.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">Our capabilities</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              End-to-end meeting room consultation and delivery
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {capabilities.map((capability, index) => (
              <div key={index} className="flex items-start space-x-4">
                <CheckCircle2 className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <p className="text-lg text-gray-700">{capability}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-bold text-brand-dark mb-4 tracking-tight">
              Platform expertise
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl">
              We work across leading OEMs and distributors in the UAE. Solutions delivered based on project fit, availability, and support ecosystem.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Microsoft Teams Rooms</h3>
                <p className="text-gray-600">
                  Certified MTR design and deployment for seamless Microsoft 365 integration.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">Zoom Rooms</h3>
                <p className="text-gray-600">
                  Expert implementation of Zoom's native room systems and appliances.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-brand-dark mb-3">BYOD solutions</h3>
                <p className="text-gray-600">
                  Platform-agnostic rooms supporting laptops, wireless presentation, and any UC client.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Design considerations — how the parts have to work together */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" data-testid="meeting-rooms-design">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <p className="section-label mb-3">Design considerations</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              How audio, camera, lighting, sharing and control fit together
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              A room is a system. Most disappointing rooms are not the result of a bad
              product choice but of one of these six being decided last.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designConsiderations.map((item) => {
              const IconComponent = LucideIcons[item.icon];
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                  data-testid={`meeting-rooms-design-${item.icon.toLowerCase()}`}
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

      {/* Assessment and the Room Planner */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
        data-testid="meeting-rooms-assessment"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="section-label mb-3">Assessment</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Start with the room you actually have
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Before a product shortlist there is a room: its dimensions, seating, glass,
              ceiling, power and network. A short assessment records all of it, and the
              Room Planner lets you do the first pass yourself.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Dimensions, seating layout and viewing distances",
                "Sightline check against the display size",
                "Acoustics, lighting and existing devices",
                "Network readiness, power and cable routes",
                "A written output your vendor can quote against"
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <Link
              to="/tools/room-configurator"
              onClick={() => analytics.roomPlannerStart({ location: "meeting_rooms_preview" })}
              className="group block border-b border-gray-200 bg-brand-dark"
              aria-label="Open the Room Planner"
            >
              <ResponsiveImage
                basePath={siteImages.roomPlanner3d.base}
                widths={siteImages.roomPlanner3d.widths}
                sizes="(min-width: 1024px) 600px, 100vw"
                width={siteImages.roomPlanner3d.width}
                height={siteImages.roomPlanner3d.height}
                alt={siteImages.roomPlanner3d.alt}
                className="image-zoom block w-full h-auto"
                testId="meeting-rooms-planner-preview"
              />
            </Link>
            <div className="p-7 lg:p-9">
            <h3 className="text-xl font-bold text-brand-dark tracking-tight">Room Planner</h3>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Enter the room and the planner draws it in 2D and 3D, checks sightlines
              against the seats you entered, and exports a PDF report you can hand to a
              technical team or use as the basis of a BOQ.
            </p>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              Nothing you enter is sent anywhere. Your draft stays in this browser, and the
              PDF is built here too.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/tools/room-configurator"
                onClick={() => analytics.roomPlannerStart({ location: "meeting_rooms_assessment" })}
              >
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  Start planning your room
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
              <Link to="/services/workspace-audits">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 w-full sm:w-auto">
                  Book a site assessment
                </Button>
              </Link>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Ecosystem */}
      <SolutionBrands
        solutionSlug="meeting-rooms"
        title="Meeting room brands we deliver"
        subtitle="From premium boardroom systems to cost-optimized multi-site rollouts — we specify, deploy, and support the right stack per room."
      />

      {/* Delivery services */}
      <RelatedServices
        slugs={["consulting", "deployment-configuration", "video-conferencing-rentals", "training-adoption"]}
        solution="meeting-rooms"
        heading="How a meeting room project gets delivered"
        background="gray"
        testIdPrefix="meeting-rooms-services"
      />

      {/* Renders only once approved cases exist */}
      <CaseStudyStrip
        filter={{ solution: "/solutions/meeting-rooms", pillar: "meeting-rooms" }}
        heading="Meeting room engagements"
        background="white"
        testIdPrefix="meeting-rooms-cases"
      />

      {/* Related articles */}
      <RelatedArticles
        categories={["meeting room", "video", "collaboration", "av"]}
        topic="meeting-rooms"
        heading="More on meeting rooms"
        background="gray"
        testIdPrefix="meeting-rooms-articles"
      />

      {/* FAQ Section */}
      <FAQSection
        faqs={meetingRoomsFAQs}
        subtitle="Everything you need to know about designing and deploying modern meeting rooms."
        testIdPrefix="meeting-rooms-faq"
      />

      <CtaBand
        title="Plan a room, or discuss a project"
        location="meeting_rooms_footer"
        ctaLabel="Discuss your requirements"
        secondary={{ label: "Start planning your room", href: "/tools/room-configurator", testId: "meeting-rooms-cta-planner" }}
        testId="meeting-rooms-cta"
      >
        Tell us how many rooms, which platform, and what is already installed — that is
        usually enough for a useful first conversation.
      </CtaBand>
    </div>
  );
};
