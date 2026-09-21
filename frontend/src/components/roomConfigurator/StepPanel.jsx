import { forwardRef, useEffect, useId, useRef } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, ChevronDown, Circle, CircleCheck, CircleDashed } from "lucide-react";
import { revealInPanel } from "./revealInPanel";
import "./roomConfigurator.css";

// The card every step is shown in. Its body re-enters on each step change — from the
// right going forward, from the left going back, matching where that step sits in the
// stepper. On desktop the card is exactly as tall as the workspace: the body is the
// only thing that could ever scroll, and it slides under a frosted footer holding
// Back/Next. With `fitContent` (a step shown on its own, without the plan) it's only as
// tall as its content, up to the workspace. On smaller screens the card grows with its
// content and the footer sticks to the bottom of the screen instead. `progress`
// ({ done, total }) counts the sections finished so far.
export const StepPanel = forwardRef(function StepPanel(
  { step, index, total, direction, headingRef, onBack, onNext, nextLabel, primaryAction, progress, fitContent = false, children },
  ref
) {
  return (
    <section
      ref={ref}
      aria-labelledby="rc-step-title"
      className={`relative flex scroll-mt-40 flex-col overflow-x-clip rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-sm lg:min-h-0 lg:overflow-hidden ${
        fitContent ? "lg:max-h-full lg:self-start" : "lg:h-full"
      }`}
    >
      <div key={step.id} data-dir={direction} className="rc-step-enter flex min-h-0 flex-1 flex-col">
        <header className="shrink-0 px-5 pt-4">
          <p className="section-label lg:sr-only">
            Step {index + 1} of {total}
          </p>
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id="rc-step-title"
              ref={headingRef}
              tabIndex={-1}
              className="mt-0.5 text-lg font-semibold leading-tight tracking-[-0.01em] text-white outline-none lg:mt-0"
            >
              {step.title}
            </h2>
            {progress && progress.total > 1 && (
              <span className={`shrink-0 text-xs font-medium tabular-nums ${progress.done === progress.total ? "text-emerald-300" : "text-white/60"}`}>
                {progress.done} of {progress.total} done
              </span>
            )}
          </div>
          {/* On short desktop windows the stepper already names the step, so the line goes. */}
          <p className="mt-1 text-[13px] leading-snug text-white/45 lg:[@media(max-height:760px)]:hidden">{step.description}</p>
        </header>
        <div className={`rc-scroll-body mt-1 min-h-0 flex-1 px-5 pb-2 lg:overflow-y-auto lg:pt-1 lg:pb-20`}>{children}</div>
      </div>

      <footer className="rc-material sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-b-2xl border-t border-white/[0.08] bg-[color:var(--rc-panel)]/75 px-5 py-3 backdrop-blur-xl backdrop-saturate-150 lg:absolute lg:inset-x-0">
        {index > 0 ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-3 flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-white/60 transition-[background-color,transform] duration-100 hover:bg-white/[0.05] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97] active:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <span />
        )}
        {primaryAction || (
          <button
            type="button"
            onClick={onNext}
            className="flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-100 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.97] active:bg-blue-600"
          >
            {nextLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </footer>
    </section>
  );
});

// Where a section stands, shown with an icon and a word (never colour alone): checked
// once it's been opened, "Not checked" while it still shows only the starting values,
// "Optional" for the ones that can be left, and a warning while an essential is open.
function SectionStatus({ status }) {
  if (status === "attention") return <AlertCircle aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-amber-300" />;
  if (status === "checked") return <CircleCheck aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-emerald-300" />;
  if (status === "optional") return <Circle aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-white/65" />;
  return <CircleDashed aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-amber-300" />;
}

const STATUS_WORDS = { checked: "checked", unchecked: "not checked", optional: "optional", attention: "needs attention" };

// One section of a step. Only the section in focus is open; the rest fold down to a
// single line that still shows their current values (and how many essentials are
// open), so the step stays short enough to take in at a glance. A folded section that
// hasn't been opened yet says so, and labels its values as the defaults they are.
// Folded content stays mounted but inert, so its state survives and nothing hidden can
// take focus.
// `error` says what the section still needs, after an attempt to move on without it.
export function StepGroup({ title, description, summary, alerts = 0, error = null, open, onToggle, checked = true, optional = false, defaults = false, children }) {
  const contentId = useId();
  const ref = useRef(null);
  const wasOpen = useRef(open);
  const status = alerts > 0 || error ? "attention" : checked ? "checked" : optional ? "optional" : "unchecked";
  // `defaults` is true for a layout's starting values, or names where they came from ("Template").
  const shownSummary = !open && !checked && defaults ? `${defaults === true ? "Default" : defaults}: ${summary}` : summary;

  // Opened (by its header, or by "Next" walking through the step): bring it into view
  // once it has unfolded.
  useEffect(() => {
    const opened = open && !wasOpen.current;
    wasOpen.current = open;
    if (!opened) return undefined;
    const t = setTimeout(() => revealInPanel(ref.current), 240);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div ref={ref} className="scroll-mt-2 border-b border-white/[0.06] last:border-b-0">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={contentId}
          className="group -mx-2 flex min-h-[48px] w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <SectionStatus status={status} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-semibold text-white">
              {title}
              {(status === "unchecked" || status === "optional") && (
                <span
                  className={`rounded-md px-1.5 py-px text-xs font-semibold ${
                    status === "unchecked" ? "bg-amber-400/15 text-amber-200" : "bg-white/[0.05] text-white/60"
                  }`}
                >
                  {status === "unchecked" ? "Not checked" : "Optional"}
                </span>
              )}
              <span className="sr-only">, {STATUS_WORDS[status]}</span>
            </span>
            <span className="line-clamp-2 block text-xs leading-snug text-white/60">{open ? description || shownSummary : shownSummary}</span>
          </span>
          {alerts > 0 && (
            <span className="shrink-0 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-200">
              {alerts} to fix
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-white/35 transition-transform duration-300 ease-out-strong group-hover:text-white/60 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <div id={contentId} className="rc-collapse" data-open={open}>
        {/* The negative margin/padding pair leaves room for focus rings inside the clip. */}
        <div className="-mx-1 min-h-0 overflow-hidden px-1">
          <div inert={!open} className="flex flex-col gap-3 pb-3.5 pt-1">
            {error && (
              <p role="alert" className="rc-banner-in flex items-start gap-1.5 rounded-lg border border-amber-400/25 bg-amber-400/10 px-2.5 py-2 text-xs font-medium leading-snug text-amber-100">
                <AlertCircle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0 text-amber-300" />
                {error}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// A part of a step that's always shown (the review step's), headed like a section.
export function StepSection({ title, children }) {
  return (
    <section className="border-b border-white/[0.06] pb-3.5 pt-2 last:border-b-0">
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      {children}
    </section>
  );
}
