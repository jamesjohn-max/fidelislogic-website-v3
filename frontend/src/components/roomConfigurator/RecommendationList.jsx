import { useState } from "react";
import { AlertTriangle, CheckCircle2, Lightbulb, Plus } from "lucide-react";
import { CONFIGURATION_COMPLETE_NOTE, DEVICE_LABELS } from "../../lib/roomConfiguratorEngine";

const LEVEL_ORDER = { essential: 0, suggestion: 1 };

export const sortRecommendations = (recs) => [...recs].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

function RecommendationItem({ rec, onAddDevice }) {
  const essential = rec.level === "essential";
  const Icon = essential ? AlertTriangle : Lightbulb;
  return (
    <li
      // Essentials sit in an amber box; optional suggestions read as a plain tip line.
      className={`rc-fade-in flex items-start gap-2 ${essential ? "rounded-xl border border-amber-400/25 bg-amber-400/10 px-2.5 py-2" : "px-0.5 py-0.5"}`}
    >
      <Icon className={`mt-px h-3.5 w-3.5 shrink-0 ${essential ? "text-amber-300" : "text-[color:var(--rc-accent)]"}`} />
      {/* The one-tap fixes flow on after the sentence rather than taking a line of their own. */}
      <p className={`min-w-0 flex-1 text-xs leading-[1.6] ${essential ? "text-amber-100" : "text-white/70"}`}>
        {essential && <span className="font-semibold">Essential · </span>}
        {rec.text}
        {rec.addCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onAddDevice(category)}
            className="ml-1.5 inline-flex h-6 items-center gap-0.5 whitespace-nowrap rounded-full border border-blue-400/30 bg-white/[0.03] px-2 align-middle text-xs font-semibold text-cyan-300 transition-[background-color,transform] duration-100 hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.96]"
          >
            <Plus className="h-3 w-3" />
            Add {DEVICE_LABELS[category].toLowerCase()}
          </button>
        ))}
      </p>
    </li>
  );
}

// The recommendations that belong to one step, shown right beside the controls that
// resolve them. Re-evaluated on every change, so an item disappears the moment the
// device it asks for is placed. The live region stays mounted even when empty so
// screen readers hear the list change.
export function RecommendationList({ recommendations, onAddDevice }) {
  return (
    <div role="status" aria-live="polite">
      {recommendations.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {sortRecommendations(recommendations).map((rec) => (
            <RecommendationItem key={rec.id} rec={rec} onAddDevice={onAddDevice} />
          ))}
        </ul>
      )}
    </div>
  );
}

// Review step: every open recommendation in one place, with a clear all-good state
// once nothing is left. Essentials always show; optional suggestions fold behind a
// toggle while there are essentials to deal with, so those never get buried.
export function ReadinessCard({ recommendations, onAddDevice }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const recs = sortRecommendations(recommendations);
  const essentialRecs = recs.filter((r) => r.level === "essential");
  const suggestionRecs = recs.filter((r) => r.level !== "essential");
  const suggestionsVisible = showSuggestions || essentialRecs.length === 0;

  if (!recs.length) {
    return (
      <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2.5">
        <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-emerald-300" />
        <p className="text-xs leading-snug text-emerald-100">{CONFIGURATION_COMPLETE_NOTE}</p>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1.5">
        {[...essentialRecs, ...(suggestionsVisible ? suggestionRecs : [])].map((rec) => (
          <RecommendationItem key={rec.id} rec={rec} onAddDevice={onAddDevice} />
        ))}
      </ul>
      {essentialRecs.length > 0 && suggestionRecs.length > 0 && (
        <button
          type="button"
          onClick={() => setShowSuggestions((v) => !v)}
          aria-expanded={showSuggestions}
          className="self-start rounded-lg px-1 py-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {showSuggestions ? "Hide suggestions" : `Show ${suggestionRecs.length} optional suggestion${suggestionRecs.length === 1 ? "" : "s"}`}
        </button>
      )}
    </div>
  );
}
