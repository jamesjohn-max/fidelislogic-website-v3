import { ArrowRight, Briefcase, Building2 } from "lucide-react";
import { AUDIENCES } from "./workflowSteps";

const ICONS = { customer: Building2, reseller: Briefcase };

// Where Room Planner starts: who's planning the room decides which steps follow and
// what the report holds. Shown in the same kind of card as the steps, the two paths side
// by side where there's room.
export function AudiencePicker({ audience, onChoose }) {
  return (
    <section
      aria-labelledby="rc-start-title"
      className="rc-step-enter flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.03] shadow-sm lg:max-h-full lg:min-h-0 lg:self-start lg:overflow-y-auto"
    >
      <header className="px-5 pt-5">
        <p className="section-label">Get started</p>
        <h2 id="rc-start-title" className="mt-0.5 text-lg font-semibold leading-tight tracking-[-0.01em] text-white">
          Who's planning this room?
        </h2>
        <p className="mt-1 text-[13px] leading-snug text-white/45">Pick the path that fits you — you can switch at any time.</p>
      </header>
      <div role="radiogroup" aria-labelledby="rc-start-title" className="flex flex-col gap-2.5 px-5 pb-5 pt-4 md:grid md:grid-cols-2">
        {Object.entries(AUDIENCES).map(([id, a]) => {
          const Icon = ICONS[id];
          const active = audience === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChoose(id)}
              className={`group flex items-start gap-3.5 rounded-xl border p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.99] ${
                active
                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,1)]"
                  : "border-white/[0.08] bg-white/[0.03] hover:border-blue-400/40 hover:bg-blue-500/10 hover:shadow-sm"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold uppercase tracking-wide text-cyan-300">{a.label}</span>
                <span className="mt-0.5 block text-[15px] font-semibold leading-snug text-white">{a.title}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-white/60">{a.description}</span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="mt-2.5 h-4 w-4 shrink-0 text-white/35 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5 group-hover:text-[color:var(--rc-accent)] motion-reduce:transition-none"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
