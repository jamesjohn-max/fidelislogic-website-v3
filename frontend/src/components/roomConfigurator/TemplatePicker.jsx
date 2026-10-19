import { PencilRuler, Users } from "lucide-react";
import { ROOM_TEMPLATES, TEMPLATE_IDS, templateSeats } from "../../lib/roomTemplates";

const OPTIONS = [
  // People as the planner will seat them: capped at the room's permitted occupancy.
  ...TEMPLATE_IDS.map((id) => {
    const n = templateSeats(id);
    return { id, label: ROOM_TEMPLATES[id].label, sub: `Up to ${n} ${n === 1 ? "person" : "people"}`, Icon: Users };
  }),
  { id: "custom", label: "Custom build", sub: "Start from an empty room", Icon: PencilRuler },
];

// The room step opens with a choice of starting point: a ready-made small, medium or
// large room (furniture, and for a reseller its device kit) to adjust to the real room,
// or a custom build from an empty room. Picking one fills the plan straight away.
export function TemplatePicker({ template, audience, onChoose }) {
  const current = ROOM_TEMPLATES[template];
  // A customer's plan holds the room, its furniture and door, so only a reseller's lists the kit.
  const includes = current && [`Table and ${templateSeats(template)} ${templateSeats(template) === 1 ? "chair" : "chairs"}`, ...(audience === "reseller" ? current.includes : []), "Door"];
  return (
    <div className="flex flex-col gap-2 border-b rc-border pb-3.5 pt-1">
      <span id="rc-template-label" className="text-xs font-medium rc-ink-muted">
        Start from
      </span>
      <div role="radiogroup" aria-labelledby="rc-template-label" className="grid grid-cols-2 gap-1.5">
        {OPTIONS.map(({ id, label, sub, Icon }) => {
          const active = template === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChoose(id)}
              className={`flex min-h-[56px] items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97] ${
                active
                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,1)]"
                  : "rc-border rc-fill hover:rc-border rc-fill-hover"
              }`}
            >
              <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${active ? "text-[color:var(--rc-accent)]" : "rc-ink-muted"}`} />
              <span className="min-w-0">
                <span className={`block text-[13px] font-semibold leading-tight ${active ? "text-blue-700" : "rc-ink"}`}>{label}</span>
                <span className="mt-0.5 block text-xs leading-tight rc-ink-muted">{sub}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-snug rc-ink-muted" aria-live="polite">
        {current
          ? `Includes: ${includes.join(", ")}. Enter the real measurements below and the plan adjusts to fit.`
          : template === "custom"
          ? "Enter the room's measurements, then add its furniture in the next step."
          : "A ready-made room gets you to a full plan in one tap. Everything stays editable."}
      </p>
    </div>
  );
}
