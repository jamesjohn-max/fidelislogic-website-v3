import { useEffect, useRef, useState } from "react";
import { jpegWidths, jpegFallback } from "../lib/images";

/**
 * Full-bleed background image carousel for hero sections.
 *
 * Behaviour:
 *  - Cross-fades between images with a slow easing (low-distraction).
 *  - Auto-advances every `interval` ms (default 6s).
 *  - Optional dot navigation lets users jump to any slide; clicking a dot
 *    resets the auto-advance timer.
 *  - Honours prefers-reduced-motion: shows the first image only.
 *  - Pauses when the tab is hidden to avoid wasted work.
 *
 * Loading:
 *  - First paint mounts exactly one slide, so the hero costs one image request.
 *    Once it has painted, the neighbouring slides mount too — at most three are
 *    ever in the DOM (the one fading out, the active one, the one due next).
 *  - `loading="lazy"` cannot do this job: the whole stack sits inside the
 *    viewport, so every slide would be fetched during first paint regardless.
 *    Mounting is what gates the request.
 *  - Slide 0 is eager + high priority; it is usually the Largest Contentful Paint.
 *
 * Slides:
 *  Each entry is either a plain URL string, or an object:
 *    { basePath, widths?, objectPosition? }
 *  where `basePath` names the responsive variants built by
 *  scripts/optimize-images.sh (`<basePath>-<width>.webp` / `.jpg`).
 *  `objectPosition` is the focal point to hold in frame across aspect ratios.
 *
 * Layout:
 *  - Image stack positioned absolutely to fill the parent (`absolute inset-0`).
 *  - The parent MUST be `relative` and clip overflow.
 *  - Decorative image stack: `aria-hidden`, empty alt.
 *  - Dots render as an accessible <nav> in a subtle glass pill.
 */

const DEFAULT_WIDTHS = [768, 1280, 1920];

const normalizeSlide = (slide, fallbackWidths) => {
  if (typeof slide === "string") {
    return { src: slide, key: slide, objectPosition: "center" };
  }
  const widths = slide.widths || fallbackWidths || DEFAULT_WIDTHS;
  return {
    basePath: slide.basePath,
    widths,
    key: slide.basePath,
    objectPosition: slide.objectPosition || "center",
  };
};

const HeroSlide = ({ slide, isActive, isFirst, transitionMs, onLoad }) => {
  const style = {
    opacity: isActive ? 1 : 0,
    objectPosition: slide.objectPosition,
    transition: `opacity ${transitionMs}ms cubic-bezier(0.23, 1, 0.32, 1)`,
    willChange: "opacity",
  };

  const imgProps = {
    alt: "",
    // The first slide is the LCP candidate — fetch it up front. What keeps the
    // rest off the critical path is that they are not mounted yet, not this
    // attribute: an in-viewport lazy image is fetched immediately.
    loading: isFirst ? "eager" : "lazy",
    fetchPriority: isFirst ? "high" : "low",
    decoding: "async",
    onLoad,
    className: "absolute inset-0 w-full h-full object-cover",
    style,
  };

  // Plain URL slide (used by service and brand detail pages).
  if (slide.src) {
    return <img src={slide.src} {...imgProps} />;
  }

  const build = (list, ext) =>
    list.map((w) => `${slide.basePath}-${w}.${ext} ${w}w`).join(", ");
  const srcSet = (ext) =>
    ext === "webp" ? build(slide.widths, ext) : build(jpegWidths(slide.widths), ext);

  return (
    <picture className="contents">
      <source type="image/webp" srcSet={srcSet("webp")} sizes="100vw" />
      <img
        src={jpegFallback(slide.basePath, slide.widths)}
        srcSet={srcSet("jpg")}
        sizes="100vw"
        {...imgProps}
      />
    </picture>
  );
};

export const HeroCarousel = ({
  images = [],
  widths,
  interval = 6000,
  transitionMs = 2400,
  showDots = false,
  className = "",
  testId,
}) => {
  const [active, setActive] = useState(0);
  // Flips once the first slide has painted. Until then we mount nothing else,
  // so the hero costs exactly one image request on load.
  const [warm, setWarm] = useState(false);
  const timerRef = useRef(null);

  const slides = images.map((image) => normalizeSlide(image, widths));
  const count = slides.length;

  const shouldAutoplay = () => {
    if (count <= 1) return false;
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return false;
    }
    return true;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    if (!shouldAutoplay()) return;
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, interval);
  };

  // Belt-and-braces for `warm`: if the first slide comes straight from cache
  // its load event can fire before React attaches the handler, which would
  // leave the neighbours unmounted. Warm up regardless shortly after mount.
  useEffect(() => {
    const id = setTimeout(() => setWarm(true), 1200);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    startTimer();
    const onVisibility = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, interval]);

  const goTo = (idx) => {
    if (idx === active) return;
    setActive(idx);
    startTimer(); // reset auto-rotate so the next change is a full interval away
  };

  if (count === 0) return null;

  // Keep the outgoing slide mounted so its fade-out can finish, and mount the
  // next one so it is decoded before its turn. Everything else stays out of
  // the DOM — and therefore off the network — until it is needed. Note that
  // `loading="lazy"` would not help: every slide sits inside the viewport, so
  // an unmounted-but-rendered stack would all be fetched during first paint.
  const mounted = new Set([active]);
  if (warm) {
    mounted.add((active + 1) % count);
    mounted.add((active - 1 + count) % count);
  }

  return (
    <>
      <div
        className={`absolute z-0 ${className || "inset-0"}`}
        aria-hidden="true"
        data-testid={testId}
      >
        {slides.map((slide, idx) =>
          mounted.has(idx) ? (
            <HeroSlide
              key={slide.key}
              slide={slide}
              isActive={idx === active}
              isFirst={idx === 0}
              transitionMs={transitionMs}
              onLoad={idx === active && !warm ? () => setWarm(true) : undefined}
            />
          ) : null
        )}
      </div>

      {showDots && count > 1 && (
        <nav
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15 shadow-lg"
          aria-label="Hero carousel navigation"
          data-testid={testId ? `${testId}-dots` : "hero-carousel-dots"}
        >
          {slides.map((_, idx) => {
            const isActive = idx === active;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => goTo(idx)}
                aria-label={`Show slide ${idx + 1} of ${count}`}
                aria-current={isActive ? "true" : "false"}
                className={`h-2 rounded-full transition-[width,background-color,transform] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] active:scale-90 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-black/30 ${
                  isActive
                    ? "w-8 bg-white"
                    : "w-2 bg-white/45 hover:bg-white/75"
                }`}
                data-testid={testId ? `${testId}-dot-${idx}` : `hero-carousel-dot-${idx}`}
              />
            );
          })}
        </nav>
      )}
    </>
  );
};
