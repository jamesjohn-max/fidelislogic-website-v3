import { RotateCcw } from "lucide-react";
import { MIN_RANGE_M } from "../../lib/roomAudioCoverage";

// One audio range, as a native slider with the metres always spelled out beside it: the
// overlay on the plan is never the only way to read a range, and "Custom" / "Default" is
// a word, not a colour. Used for a selected device's own range and for the room-wide
// ones, which are the same control over a different field.
//
// `value` is the override as stored — a number, or null/undefined when the device (or the
// room) follows the default, which is what `fallback` shows. `onReset` deletes the field;
// it never writes the default in, or the device would stop following later changes.
export const RANGE_MAX_M = 12;
const STEP_M = 0.25;
const clampRange = (v) => Math.min(RANGE_MAX_M, Math.max(MIN_RANGE_M, v));

export function RangeControl({ id, label, value, fallback, isCustom = Number.isFinite(value), onChange, onReset }) {
  const shown = clampRange(Number.isFinite(value) ? value : fallback);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-xs font-medium text-white/60">{label}</label>
      <input
        id={id}
        type="range"
        min={MIN_RANGE_M}
        max={RANGE_MAX_M}
        step={STEP_M}
        value={shown}
        // A range input can only be moved, never typed into, so a non-numeric value
        // cannot reach the plan; the guard keeps a NaN out even so.
        onChange={(e) => {
          const next = Number(e.target.value);
          if (Number.isFinite(next)) onChange(clampRange(next));
        }}
        aria-valuetext={`${shown.toFixed(2)} metres${isCustom ? ", custom" : ", default"}`}
        className="h-9 min-w-0 flex-1 accent-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
      />
      <span className="shrink-0 text-xs font-semibold tabular-nums text-white/85">{shown.toFixed(2)}m</span>
      <span className={`shrink-0 text-xs ${isCustom ? "font-semibold text-cyan-200" : "text-white/45"}`}>{isCustom ? "Custom" : "Default"}</span>
      {isCustom && (
        <button
          type="button"
          onClick={onReset}
          aria-label={`Reset ${label} to the default`}
          className="flex min-h-[28px] shrink-0 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <RotateCcw aria-hidden="true" className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  );
}
