import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { ResponsiveImage } from "./ResponsiveImage";
import {
  services,
  serviceStages,
  serviceCoverage,
  getServicesByStage,
  serviceImageWidths
} from "../data/services";
import { getServiceIcon } from "../lib/serviceIcons";

/**
 * Homepage services section.
 *
 * Every service is a real <Link> with its name as an <h3> and its one-liner as
 * visible text, so the full catalogue and its internal links are in the DOM
 * for crawlers regardless of which item is highlighted.
 *
 * Desktop: services listed by lifecycle stage on the left; hovering or
 * focusing one cross-fades the preview panel on the right. Phones and tablets
 * skip the panel and show a thumbnail on each row instead.
 *
 * Loading: only the first preview image mounts up front. The rest mount the
 * first time the pointer or keyboard enters the list, so they have usually
 * finished loading by the time they are shown. The panel keeps showing the
 * previous image until the next one has loaded, which avoids a blank flash.
 */
export const HomeServices = () => {
  const [activeSlug, setActiveSlug] = useState(services[0].slug);
  const [shownSlug, setShownSlug] = useState(services[0].slug);
  const [warm, setWarm] = useState(false);
  const loaded = useRef(new Set());
  const activeRef = useRef(services[0].slug);

  const activate = (slug) => {
    activeRef.current = slug;
    setActiveSlug(slug);
    setWarm(true);
    if (loaded.current.has(slug)) setShownSlug(slug);
  };

  const handleLoad = (slug) => {
    loaded.current.add(slug);
    if (activeRef.current === slug) setShownSlug(slug);
  };

  const active = services.find((s) => s.slug === activeSlug) || services[0];
  const activeHighlights = (active.deliverables || []).slice(0, 3);
  const mountedServices = warm ? services : services.slice(0, 1);

  return (
    <section
      id="services"
      aria-labelledby="home-services-title"
      className="relative overflow-hidden bg-brand-dark text-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8"
      data-testid="home-services-section"
    >
      {/* Soft brand-blue glow so the band has depth without an image behind the copy */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-[120px]"
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12 lg:mb-16">
          <h2
            id="home-services-title"
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]"
          >
            Workplace technology services, from first audit to everyday support
          </h2>
          <p className="mt-5 text-lg text-gray-300 leading-relaxed max-w-2xl">
            Eight services that plan, deliver and operate meeting rooms, headsets and
            workspace platforms for organisations across {serviceCoverage.label}.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Service list, grouped by lifecycle stage */}
          <div
            className="lg:col-span-5 space-y-9"
            onPointerEnter={() => setWarm(true)}
            onFocusCapture={() => setWarm(true)}
          >
            {serviceStages.map((stage) => {
              const stageServices = getServicesByStage(stage.id);
              return (
                <div key={stage.id} data-testid={`home-services-stage-${stage.id}`}>
                  <div className="flex items-baseline gap-3 pb-3 mb-2 border-b border-white/10">
                    <p className="text-sm font-semibold text-fidelis-cyan">{stage.label}</p>
                    <p className="text-sm text-gray-400">{stage.description}</p>
                  </div>
                  <ul className="space-y-1">
                    {stageServices.map((service) => {
                      const Icon = getServiceIcon(service.icon);
                      const isActive = service.slug === activeSlug;
                      return (
                        <li key={service.slug}>
                          <Link
                            to={`/services/${service.slug}`}
                            onMouseEnter={() => activate(service.slug)}
                            onFocus={() => activate(service.slug)}
                            className={`group flex items-center gap-4 rounded-xl p-3 -mx-3 transition-colors duration-200 ease-out-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-fidelis-cyan ${
                              isActive ? "lg:bg-white/[0.07]" : "hover:bg-white/[0.04]"
                            }`}
                            data-testid={`home-services-item-${service.slug}`}
                          >
                            {/* Thumbnail stands in for the preview panel below lg */}
                            <div className="lg:hidden w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-lg bg-gray-800">
                              <ResponsiveImage
                                basePath={service.images.hero}
                                widths={[400]}
                                sizes="80px"
                                alt=""
                                className="w-full h-full object-cover"
                                style={{ objectPosition: service.images.heroPosition }}
                              />
                            </div>
                            <div
                              className={`hidden lg:inline-flex w-10 h-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 ${
                                isActive
                                  ? "bg-blue-600 border-blue-500 text-white"
                                  : "bg-white/5 border-white/10 text-fidelis-cyan"
                              }`}
                            >
                              <Icon size={18} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
                                {service.name}
                              </h3>
                              <p className="mt-0.5 text-sm text-gray-400 leading-relaxed">
                                {service.oneLiner}
                              </p>
                            </div>
                            <ArrowRight
                              size={18}
                              aria-hidden="true"
                              className={`shrink-0 transition-[transform,opacity,color] duration-200 ease-out-strong ${
                                isActive
                                  ? "text-gray-500 lg:text-fidelis-cyan lg:translate-x-0 lg:opacity-100"
                                  : "text-gray-500 lg:-translate-x-1 lg:opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                              }`}
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Preview panel (desktop only) */}
          <div className="hidden lg:block lg:col-span-7">
            <div className="sticky top-28" data-testid="home-services-preview">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-800 ring-1 ring-white/10 shadow-2xl shadow-black/40">
                {mountedServices.map((service) => (
                  <ResponsiveImage
                    key={service.slug}
                    basePath={service.images.hero}
                    widths={serviceImageWidths}
                    sizes="(min-width: 1280px) 700px, 56vw"
                    alt={service.slug === shownSlug ? service.images.heroAlt : ""}
                    onLoad={() => handleLoad(service.slug)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out-strong motion-reduce:transition-none ${
                      service.slug === shownSlug ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ objectPosition: service.images.heroPosition }}
                  />
                ))}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-dark/60 to-transparent"
                />
              </div>

              <div className="mt-7" aria-live="polite">
                <p className="text-2xl font-semibold leading-snug text-white">
                  {active.tagline}
                </p>
                <ul className="mt-5 grid sm:grid-cols-3 gap-4">
                  {activeHighlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-fidelis-cyan" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={`/services/${active.slug}`}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-fidelis-cyan hover:text-white transition-colors"
                  data-testid="home-services-preview-link"
                >
                  Explore {active.name}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <p className="text-gray-300 max-w-xl">
            Not sure where to start? An audit or a short consulting engagement usually
            gives the clearest next step.
          </p>
          <Link to="/services" className="shrink-0">
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              View All Services
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
