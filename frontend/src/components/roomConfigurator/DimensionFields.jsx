import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RectangleHorizontal, RectangleVertical } from "lucide-react";
import {
  clamp,
  ROOM_LIMITS,
  getTableLimits,
  getChairLimits,
  getMaxChairsForLayout,
  occupancyLimit,
  DBC_M2_PER_PERSON,
  POD_RADIUS_LIMITS,
  CLASSROOM_DESK_DEPTH,
  SEATING_DENSITIES,
  DEFAULT_SEATING_DENSITY,
  seatingSpacingSummary,
} from "../../lib/roomConfiguratorEngine";

const formatNum = (v, decimals) => {
  const n = Number(v.toFixed(decimals));
  return String(n);
};

const STEPPER_BUTTON =
  "flex h-full w-8 shrink-0 items-center justify-center text-white/45 transition-[background-color,transform] duration-100 hover:bg-white/[0.05] hover:text-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 active:scale-90 active:bg-white/10";

function FieldLabel({ htmlFor, id, children }) {
  return (
    <label htmlFor={htmlFor} id={id} className="text-xs font-medium text-white/60">
      {children}
    </label>
  );
}

// A controlled numeric input that still lets you type freely: the displayed text is
// local state, decoupled from the clamped committed value, so clamping on every
// keystroke can't fight what you're typing. The value is parsed and clamped on blur
// (or Enter), not on every change. With `empty` it shows blank until a value is
// entered — typed, or stepped up from the minimum.
function NumberField({ id, label, value, min, max, step, helper, onChange, decimals = 1, disabled = false, empty = false, error, inputRef, className = "" }) {
  const shown = (v) => (empty ? "" : formatNum(v, decimals));
  const [text, setText] = useState(() => shown(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) setText(empty ? "" : formatNum(value, decimals));
  }, [value, decimals, empty]);

  const commit = (raw) => {
    const n = parseFloat(raw);
    if (!Number.isFinite(n) && empty) { setText(""); return; }
    const next = Number.isFinite(n) ? clamp(Number(n.toFixed(decimals)), min, max) : value;
    onChange(next);
    setText(formatNum(next, decimals));
  };

  const bump = (delta) => {
    const next = empty ? min : clamp(Number((value + delta).toFixed(decimals)), min, max);
    onChange(next);
    setText(formatNum(next, decimals));
  };

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${disabled ? "opacity-40" : ""} ${className}`}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div
        className={`flex h-10 items-center overflow-hidden rounded-lg border bg-white/[0.03] shadow-sm transition-[border-color,box-shadow] focus-within:ring-2 ${
          error ? "border-red-400/50 focus-within:border-red-400/60 focus-within:ring-red-500/20" : "border-white/[0.08] focus-within:border-blue-400/60 focus-within:ring-blue-500/20"
        }`}
      >
        <button type="button" aria-label={`Decrease ${label || id}`} disabled={disabled || empty || value <= min} onClick={() => bump(-step)} className={STEPPER_BUTTON}>
          <Minus className="h-3.5 w-3.5" />
        </button>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={(e) => {
            focusedRef.current = true;
            e.currentTarget.select();
          }}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => {
            focusedRef.current = false;
            commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") { setText(shown(value)); e.currentTarget.blur(); }
          }}
          onWheel={(e) => e.currentTarget.blur()}
          className="h-full w-full min-w-0 border-x border-white/[0.06] bg-transparent text-center text-[15px] font-semibold tabular-nums text-white outline-none disabled:cursor-not-allowed"
        />
        <button type="button" aria-label={`Increase ${label || id}`} disabled={disabled || (!empty && value >= max)} onClick={() => bump(step)} className={STEPPER_BUTTON}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && (
        <span id={`${id}-error`} className="text-xs font-medium text-red-400">
          {error}
        </span>
      )}
      {helper && <span className="text-xs text-white/45">{helper}</span>}
    </div>
  );
}

// iOS-style segmented control: a white thumb slides along a grey track to the chosen
// option. Options share the width equally, so the thumb's position is just its index.
export function Segmented({ label, options, value, onChange, helper, disabledIds = [] }) {
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  const labelId = `rc-seg-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={labelId} className="text-xs font-medium text-white/60">{label}</span>
      <div role="radiogroup" aria-labelledby={labelId} className="relative flex h-10 rounded-lg bg-white/[0.05] p-1">
        <span
          aria-hidden="true"
          className="absolute bottom-1 left-1 top-1 rounded-md bg-white/[0.03] shadow-[0_1px_3px_rgba(15,23,42,0.12),0_0_0_0.5px_rgba(15,23,42,0.06)] transition-transform duration-300 ease-out-strong motion-reduce:transition-none"
          style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
        />
        {options.map((o) => {
          const active = o.id === value;
          const Icon = o.icon;
          const disabled = disabledIds.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={o.iconOnly ? o.label : undefined}
              title={o.iconOnly ? o.label : undefined}
              disabled={disabled}
              onClick={() => onChange(o.id)}
              className={`relative z-[1] flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
                active ? "text-white" : "text-white/45 hover:text-white/85"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {!o.iconOnly && o.label}
            </button>
          );
        })}
      </div>
      {helper && <span className="text-xs text-white/45">{helper}</span>}
    </div>
  );
}

const ROOM_FIELDS = [
  { key: "length", label: "Length (m)" },
  { key: "width", label: "Width (m)" },
  { key: "height", label: "Height (m)" },
];

// The room's measurements, blank until entered (`entered` says which have been). Each
// time the page reports an attempt to move on with one missing (`attempt`), the
// missing ones say so and the first takes focus.
export function RoomSizeFields({ room, entered, onRoomChange, attempt = 0 }) {
  const refs = useRef({});
  const latest = useRef(entered);
  latest.current = entered;

  useEffect(() => {
    if (!attempt) return;
    const missing = ROOM_FIELDS.find((f) => !latest.current[f.key]);
    if (missing) refs.current[missing.key]?.focus();
  }, [attempt]);

  return (
    <div className="grid grid-cols-3 gap-2">
      {ROOM_FIELDS.map(({ key, label }) => (
        <NumberField
          key={key}
          id={`rc-room-${key}`}
          label={label}
          value={room[key]}
          empty={!entered[key]}
          error={attempt > 0 && !entered[key] ? "Required" : null}
          inputRef={(el) => { refs.current[key] = el; }}
          min={ROOM_LIMITS[key][0]}
          max={ROOM_LIMITS[key][1]}
          step={0.1}
          onChange={(v) => onRoomChange({ ...room, [key]: v }, key)}
        />
      ))}
    </div>
  );
}

const ORIENTATIONS = [
  { id: 0, label: "Landscape", icon: RectangleHorizontal, iconOnly: true },
  { id: 90, label: "Portrait", icon: RectangleVertical, iconOnly: true },
];

// Table size and orientation. Only the dimensions that apply to the chosen layout are
// shown; in Open Collaboration, selecting a pod on the plan swaps these for that one
// pod's diameter so it can be resized on its own.
export function TableFields({
  room,
  table,
  layout,
  onTableChange,
  onOrientationChange,
  layoutSupportsTable,
  lengthApplicable,
  widthApplicable,
  deskDepthApplicable,
  selectedPodDiameter,
  selectedPodRadiusLimits = POD_RADIUS_LIMITS,
  onResizeSelectedPod,
}) {
  const tableLimits = getTableLimits(room, layout);
  const podSelected = selectedPodDiameter != null;
  if (podSelected) {
    return (
      <NumberField
        id="rc-pod-diameter"
        label="Selected pod diameter (m)"
        value={selectedPodDiameter}
        min={selectedPodRadiusLimits[0] * 2}
        max={selectedPodRadiusLimits[1] * 2}
        step={0.1}
        helper={`Max ${(selectedPodRadiusLimits[1] * 2).toFixed(1)} m in this room`}
        onChange={onResizeSelectedPod}
      />
    );
  }
  // U-shape: length runs along the legs, width is the span across the U. A front-row
  // table's width is how deep it is, front to back.
  const ushape = layout === "ushape";
  const frontRow = layout === "frontrow";
  // Rotating swaps which raw table dimension sits on which room axis. If the
  // swapped footprint is bigger than the room itself along that axis, the table
  // would stick out through the walls, so block the rotation instead.
  const orientationWouldOverflow = table.width > room.length || table.length > room.width;
  const otherOrientation = table.orientation === 0 ? 90 : 0;
  if (deskDepthApplicable) {
    return (
      <NumberField
        id="rc-desk-depth"
        label="Desk depth (m)"
        value={table.deskDepth ?? CLASSROOM_DESK_DEPTH.default}
        min={CLASSROOM_DESK_DEPTH.min}
        max={CLASSROOM_DESK_DEPTH.max}
        step={0.05}
        decimals={2}
        helper={`Front to back · ${CLASSROOM_DESK_DEPTH.min}–${CLASSROOM_DESK_DEPTH.max} m`}
        className="max-w-[180px]"
        onChange={(v) => onTableChange({ ...table, deskDepth: v })}
      />
    );
  }
  if (!lengthApplicable && !widthApplicable && !layoutSupportsTable) return null;
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {lengthApplicable && (
          <NumberField
            id="rc-table-length"
            label={ushape ? "Legs (m)" : "Length (m)"}
            value={table.length}
            min={tableLimits.length[0]}
            max={tableLimits.length[1]}
            step={0.1}
            helper={`Max ${tableLimits.length[1].toFixed(1)}`}
            onChange={(v) => onTableChange({ ...table, length: v })}
          />
        )}
        {widthApplicable && (
          <NumberField
            id="rc-table-width"
            label={ushape ? "Across (m)" : frontRow ? "Depth (m)" : "Width (m)"}
            value={table.width}
            min={tableLimits.width[0]}
            max={tableLimits.width[1]}
            step={0.1}
            helper={`Max ${tableLimits.width[1].toFixed(1)}`}
            onChange={(v) => onTableChange({ ...table, width: v })}
          />
        )}
        {layoutSupportsTable && (
          <Segmented
            label="Orientation"
            options={ORIENTATIONS}
            value={table.orientation}
            onChange={onOrientationChange}
            disabledIds={orientationWouldOverflow ? [otherOrientation] : []}
            helper={orientationWouldOverflow ? "Too long to turn" : table.orientation === 0 ? "Landscape" : "Portrait"}
          />
        )}
      </div>
      {/* Boardroom tables: nobody sits with their back to the screen and camera. */}
      {layout === "rectangular" && (
        <label className="flex min-h-[32px] cursor-pointer items-center gap-2 text-xs font-medium text-white/70">
          <input
            type="checkbox"
            checked={!!table.screenEndFree}
            onChange={(e) => onTableChange({ ...table, screenEndFree: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-blue-500"
          />
          No seats at the screen end
        </label>
      )}
    </>
  );
}

export function SeatingFields({ room, table, layout, chairCount, onChairCountChange, seatingDensity = DEFAULT_SEATING_DENSITY, onSeatingDensityChange }) {
  const chairLimits = getChairLimits(layout, room, table, seatingDensity);
  // When the room's occupancy, not the furniture, sets the most seats, say so.
  const occupancy = occupancyLimit(room);
  const cappedByCode = chairLimits[1] === occupancy && getMaxChairsForLayout(layout, room, table, seatingDensity) > occupancy;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <label htmlFor="rc-chairs" className="block text-sm font-semibold text-white/85">Chairs</label>
          <span className="block text-xs text-white/45">
            {cappedByCode
              ? `Up to ${occupancy}: Dubai Building Code allows 1 person per ${DBC_M2_PER_PERSON} m² (${(room.length * room.width).toFixed(1)} m² room)`
              : `Up to ${chairLimits[1]} fit this layout`}
          </span>
        </div>
        <NumberField
          id="rc-chairs"
          value={chairCount}
          min={chairLimits[0]}
          max={chairLimits[1]}
          step={1}
          decimals={0}
          className="w-[120px] shrink-0"
          onChange={(v) => onChairCountChange(Math.round(v))}
        />
      </div>
      {/* How tightly seats are packed — changes how many chairs fit (the Chairs max). */}
      <Segmented
        label="Seating spacing"
        options={SEATING_DENSITIES}
        value={seatingDensity}
        onChange={onSeatingDensityChange}
        helper={seatingSpacingSummary(layout, seatingDensity)}
      />
    </div>
  );
}
