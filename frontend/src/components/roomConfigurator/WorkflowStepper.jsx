import { Check } from "lucide-react";

// Sticky progress bar for the configurator's steps. Every step stays reachable —
// people can jump ahead or back at any point, and the track fills up to the furthest
// one opened. An opened step gets a tick once every section in it has been checked;
// until then its number sits in a dashed ring (`pending` counts the sections left). A
// step that still has an essential gap gets an amber dot once it's behind someone
// (opened, or skipped past), so nothing is flagged before they've had a chance to fill
// it in.
export function WorkflowStepper({ steps, current, visited, attention, pending = {}, onSelect }) {
  const furthest = Math.max(...visited);
  return (
    // Below lg it's a frosted bar pinned under the site header; on desktop it sits
    // inline in the configurator's title bar, which never scrolls away.
    <nav
      aria-label="Configuration steps"
      className="rc-material sticky top-20 z-30 border-b border-white/[0.08] bg-[color:var(--rc-panel-bar)] backdrop-blur-xl backdrop-saturate-150 lg:static lg:z-auto lg:min-w-0 lg:flex-1 lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:backdrop-saturate-100"
    >
      <ol className="flex h-16 items-center px-4 sm:px-6 lg:h-auto lg:px-0">
        {steps.map((step, i) => {
          const isCurrent = i === current;
          const left = pending[step.id] || 0;
          const isDone = visited.has(i) && !isCurrent && left === 0;
          const isPartial = visited.has(i) && !isCurrent && left > 0;
          const isReached = i <= furthest;
          const needsAttention = attention[step.id] && isReached && !isCurrent;
          const last = i === steps.length - 1;
          return (
            <li key={step.id} className={`flex items-center ${last ? "" : "flex-1"}`}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${step.label}${isDone ? ", checked" : ""}${
                  isPartial ? `, ${left} section${left === 1 ? "" : "s"} not checked` : ""
                }${needsAttention ? ", needs attention" : ""}`}
                className="group -mx-1.5 flex min-h-[44px] items-center gap-2.5 rounded-full px-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <span
                  className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out-strong group-active:scale-90 motion-reduce:transition-none ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.14)]"
                      : isDone
                      ? "bg-blue-500/10 text-cyan-300 group-hover:bg-blue-500/15"
                      : isPartial
                      ? "border-2 border-dashed border-amber-400/60 bg-white/[0.03] text-amber-200 group-hover:bg-amber-400/10"
                      : isReached
                      ? "border border-blue-400/40 bg-white/[0.03] text-cyan-300 group-hover:bg-blue-500/10"
                      : "border border-white/15 bg-white/[0.03] text-white/45 group-hover:border-white/20 group-hover:text-white/70"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
                  {needsAttention && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-500" />
                  )}
                </span>
                {/* Every label shows from xl; between md and xl only the current one does. */}
                <span
                  className={`hidden whitespace-nowrap text-sm ${isCurrent ? "md:inline" : "xl:inline"} ${
                    isCurrent ? "font-semibold text-white" : isReached ? "font-medium text-white/70" : "font-medium text-white/45"
                  } group-hover:text-white`}
                >
                  {step.label}
                </span>
              </button>
              {!last && (
                <span aria-hidden="true" className="relative mx-2 h-0.5 min-w-3 flex-1 overflow-hidden rounded-full bg-white/10 sm:mx-3">
                  <span
                    className="absolute inset-0 origin-left rounded-full bg-blue-500 transition-transform duration-500 ease-out-strong motion-reduce:transition-none"
                    style={{ transform: `scaleX(${i < furthest ? 1 : 0})` }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
