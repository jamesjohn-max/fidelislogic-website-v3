import { Check, Play, ShieldCheck } from "lucide-react";
import { AudiencePicker } from "./AudiencePicker";
import { ResponsiveImage } from "../ResponsiveImage";

// The Room Planner's landing state, before a path is chosen: a dark stage carrying the
// headline and the 3D visual, and a light rail on the right holding Get Started, so the
// thing a visitor has to click is on the side their hand is already on.
//
// It is built to sit in one viewport with no scrolling at desktop sizes. The height
// chain that makes that work: the page's flex column gives this `h-full`, the grid row
// is `minmax(0,1fr)`, and the figure is `min-h-0 flex-1` — so the visual absorbs the
// slack instead of pushing the fold down. Breaking any link in that chain brings the
// scrollbar back.
//
// SWAPPING THE VISUAL FOR A VIDEO OR GIF:
// the <figure> below is a fixed 16/10 frame sized to the image in data/siteImages.js.
// To use motion, replace <ResponsiveImage> with, for example:
//
//   <video className="h-full w-full object-cover" poster={...} autoPlay muted loop
//          playsInline preload="metadata" aria-label="..." />
//
// Two things to keep when you do. Honour reduced motion — gate `autoPlay` on
// `window.matchMedia("(prefers-reduced-motion: reduce)")` and fall back to the poster,
// which is what the rest of the planner does. And keep the frame's aspect ratio, or the
// single-viewport fit above has to be re-measured.
export function PlannerIntroHero({ audience, onChoose, intro, highlights, privacyNote, image }) {
  return (
    <section className="grid gap-5 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,418px)] lg:gap-7">
      {/* Left: the stage. `rc-stage` flips the ink, line and panel tokens to their
          dark-surface values, so everything inside reads correctly without a single
          hardcoded white. */}
      <div className="rc-stage rc-step-enter relative flex min-h-0 flex-col justify-center overflow-hidden rounded-3xl border rc-border p-6 lg:p-8">
        {/* Brand glow. Decorative only, and behind everything. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 -top-40 h-[32rem] w-[32rem] rounded-full opacity-70"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.3), transparent 68%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-36 -right-24 h-96 w-96 rounded-full opacity-70"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.14), transparent 70%)" }}
        />

        <div className="relative">
          <h1>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[color:var(--rc-accent)]/30 bg-[color:var(--rc-accent)]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[color:var(--rc-accent)]">
              Room Planner 3D · Free tool
            </span>
            {/* The cap goes on the headline, not the <h1>: on the <h1> it also squeezed
                the pill above into a column. 20ch holds it to two lines here. */}
            <span className="mt-3.5 block max-w-[20ch] text-[32px] font-semibold leading-[1.07] tracking-[-0.02em] rc-ink xl:text-[38px]">
              Plan the room{" "}
              <span className="text-[color:var(--rc-accent)]">before</span> you quote it.
            </span>
          </h1>
          <p className="mt-3 max-w-[46ch] text-sm leading-relaxed rc-ink-soft">{intro}</p>
        </div>

        <figure className="relative mt-5 flex min-h-0 flex-1 overflow-hidden rounded-2xl border rc-border shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
          <ResponsiveImage
            basePath={image.base}
            widths={image.widths}
            sizes="(min-width: 1024px) 60vw, 100vw"
            width={image.width}
            height={image.height}
            alt={image.alt}
            className="h-full w-full object-cover"
            testId="room-planner-3d-preview"
            /* Above the fold and the page's largest element — lazy-loading it leaves an
               empty frame in the hero on first paint. */
            loading="eager"
            fetchPriority="high"
          />
          <figcaption className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border rc-border bg-[color:var(--rc-panel-bar)] px-2.5 py-1.5 text-[11px] font-semibold rc-ink-soft backdrop-blur-md">
            <Play aria-hidden="true" className="h-3 w-3 fill-current" />
            Your room in 3D — sit in any seat, then export the PDF
          </figcaption>
        </figure>
      </div>

      {/* Right: the rail. Get Started sits here so it is the nearest thing to the
          visitor's cursor, which is what the layout exists for. */}
      <div className="flex min-h-0 flex-col justify-center gap-4">
        <ul className="rc-step-enter flex flex-col gap-2.5">
          {highlights.map((point) => (
            <li key={point} className="flex gap-2.5 text-[13px] leading-snug rc-ink-soft">
              <span
                aria-hidden="true"
                className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--rc-accent)]/10 text-[color:var(--rc-accent-ink)]"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
              {point}
            </li>
          ))}
        </ul>

        <AudiencePicker audience={audience} onChoose={onChoose} stacked />

        <p className="rc-step-enter flex items-start gap-2 text-[12px] leading-snug rc-ink-muted">
          <ShieldCheck aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-700" />
          {privacyNote}
        </p>
      </div>
    </section>
  );
}
