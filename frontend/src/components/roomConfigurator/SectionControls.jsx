import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Minus,
  Check,
  RectangleHorizontal,
  Circle,
  Users,
  Rows3,
  AlignJustify,
  Grid2x2,
  Monitor,
  MonitorSpeaker,
  Video,
  Mic,
  Speaker,
  Tablet,
  Share2,
  DoorOpen,
  CalendarCheck2,
  Radar,
  Wifi,
  Cable,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  LAYOUTS,
  PLATFORMS,
  AUDIO_PREFERENCES,
  WALL_MATERIALS,
  FLOOR_TYPES,
  CEILING_TYPES,
  TABLE_TOP_MATERIALS,
  DEVICE_LABELS,
  CAMERA_FEATURES,
  TABLE_CAM_MIC_RANGE_M,
  DISPLAY_SIZES,
  LED_WALL_MIN_SIZE,
  ULTRAWIDE_DISPLAY_SIZES,
  ULTRAWIDE,
  CAMERA_FOVS,
  ALL_IN_ONE_SIZES,
  ALL_IN_ONE_MIC_REACH_M,
  typicalAllInOneMicReach,
  micMount,
  micRangeLabel,
} from "../../lib/roomConfiguratorEngine";
import {
  TrackActiveSpeakerIllustration,
  StaticWideViewIllustration,
  MultiSpeakerFramingIllustration,
  IndividualTilesIllustration,
} from "./cameraFeatureIllustrations";
import { VideoBarGlyph } from "./VideoBarGlyph";
import { revealInPanel } from "./revealInPanel";

const CAMERA_FEATURE_ILLUSTRATIONS = {
  trackActiveSpeaker: TrackActiveSpeakerIllustration,
  staticWideView: StaticWideViewIllustration,
  multiSpeakerFraming: MultiSpeakerFramingIllustration,
  individualTiles: IndividualTilesIllustration,
};

// Lucide has no D-shaped table or curved front row, so these two are drawn to match.
function DShapeGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 4v16" />
      <path d="M6 7h8a5 5 0 0 1 0 10H6z" />
    </svg>
  );
}
function FrontRowGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 4h14" />
      <path d="M3 11c5.5 4 12.5 4 18 0" />
      <path d="M6 18.5h.01M12 20h.01M18 18.5h.01" />
    </svg>
  );
}

const LAYOUT_ICONS = {
  rectangular: RectangleHorizontal,
  oval: Circle,
  dshape: DShapeGlyph,
  frontrow: FrontRowGlyph,
  ushape: Users,
  classroom: Rows3,
  theater: AlignJustify,
  collaboration: Grid2x2,
};

const DEVICE_ICONS = {
  display: Monitor,
  allInOne: MonitorSpeaker,
  camera: Video,
  videoBar: VideoBarGlyph,
  microphone: Mic,
  speaker: Speaker,
  touchPanel: Tablet,
  contentSharing: Share2,
  door: DoorOpen,
  bookingPanel: CalendarCheck2,
};

// One line on what each device is for, so the list reads without AV jargon.
const DEVICE_DESCRIPTIONS = {
  display: "Wall-mounted or floor-stand screen",
  allInOne: "Screen with camera, mics and speakers built in",
  camera: "Front-of-room or 360° center-of-table camera",
  videoBar: "Camera, mics and speaker in one",
  microphone: "Ceiling or table pickup, added as a set",
  speaker: "Ceiling or wall audio, added as a set",
  touchPanel: "One-touch join and in-room control",
  contentSharing: "Share a laptop screen, wired or wireless",
  bookingPanel: "Shows availability outside the door",
  door: "Added on a wall — drag it into place on the plan next",
};

const CHOICE_BASE =
  "transition-[background-color,border-color,color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500";
const CHOICE_ON = "border-blue-500 bg-blue-500/10 text-cyan-100 shadow-[0_0_0_1px_rgba(59,130,246,1)]";
const CHOICE_OFF = "border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/15 hover:bg-white/[0.02]";

// Starts on "Choose one" when nothing has been picked (value null), so an untouched
// field never passes for an answer.
function SelectField({ id, label, value, onChange, options, disabled }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${disabled ? "opacity-50" : ""}`}>
      <label htmlFor={id} className="text-xs font-medium text-white/60">{label}</label>
      <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="h-10 rounded-lg border-white/[0.08] bg-white/[0.03] text-sm text-white/85 shadow-sm data-[placeholder]:text-white/45">
          <SelectValue placeholder="Choose one" />
        </SelectTrigger>
        <SelectContent className="rc-theme">
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function LayoutPicker({ layout, onLayoutChange }) {
  const current = LAYOUTS.find((l) => l.id === layout);
  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label="Furniture layout" className="grid grid-cols-4 gap-1.5">
        {LAYOUTS.map((l) => {
          const Icon = LAYOUT_ICONS[l.id];
          const active = l.id === layout;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-describedby={active ? "rc-layout-hint" : undefined}
              title={l.hint}
              onClick={() => onLayoutChange(l.id)}
              className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2 text-center active:scale-[0.97] ${CHOICE_BASE} ${active ? CHOICE_ON : CHOICE_OFF}`}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? "text-[color:var(--rc-accent)]" : "text-white/35"}`} />
              <span className="text-xs font-semibold leading-tight">{l.label}</span>
            </button>
          );
        })}
      </div>
      <p id="rc-layout-hint" className="text-xs text-white/45">{current?.hint}</p>
    </div>
  );
}

export function FinishesFields({ wallMaterials, onToggleWallMaterial, floorType, onFloorTypeChange, ceilingType, onCeilingTypeChange, showWalls = true }) {
  return (
    <div className="flex flex-col gap-3">
      {showWalls && (
        <div className="flex flex-col gap-1.5">
          <span id="rc-walls-label" className="text-xs font-medium text-white/60">Walls — choose all that apply</span>
          <div role="group" aria-labelledby="rc-walls-label" className="flex flex-wrap gap-1.5">
            {WALL_MATERIALS.map((m) => {
              const active = wallMaterials.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onToggleWallMaterial(m)}
                  aria-pressed={active}
                  className={`flex min-h-[32px] items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium active:scale-[0.97] ${CHOICE_BASE} ${
                    active ? "border-blue-500 bg-blue-500/10 text-cyan-200" : CHOICE_OFF
                  }`}
                >
                  {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <SelectField id="rc-floor" label="Floor" value={floorType} onChange={onFloorTypeChange} options={FLOOR_TYPES} />
        <SelectField id="rc-ceiling" label="Ceiling" value={ceilingType} onChange={onCeilingTypeChange} options={CEILING_TYPES} />
      </div>
    </div>
  );
}

export function TableTopField({ value, onChange }) {
  return <SelectField id="rc-table-top" label="Table top" value={value} onChange={onChange} options={TABLE_TOP_MATERIALS} />;
}

export function PlatformField({ value, onChange }) {
  return <SelectField id="rc-platform" label="Conferencing platform" value={value} onChange={onChange} options={PLATFORMS} />;
}

export function AudioPreferenceField({ value, onChange }) {
  return <SelectField id="rc-audio" label="Preferred audio setup" value={value} onChange={onChange} options={AUDIO_PREFERENCES} />;
}

// Devices that need a choice before they're added — a screen size, a lens, or how many —
// made inline in the device's own row, so nothing covers the plan. Everything else is
// added the moment "+" is pressed. Either way the device lands on the plan by itself.
const CHOOSER_CATEGORIES = ["display", "allInOne", "camera", "videoBar", "microphone", "speaker", "bookingPanel"];
export const needsChoice = (category) => CHOOSER_CATEGORIES.includes(category);
const QUICK_COUNTS = [1, 2, 3, 4, 6, 8];

function OptionChip({ label, sub, highlighted, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[44px] flex-col items-center justify-center rounded-lg border px-1 py-1 leading-tight active:scale-[0.96] ${CHOICE_BASE} ${
        highlighted ? "border-blue-500 bg-blue-500/10 text-cyan-100" : "border-white/[0.08] bg-white/[0.03] text-white/85 hover:border-blue-400/40 hover:bg-blue-500/10"
      } ${className}`}
    >
      <span className="text-[13px] font-semibold tabular-nums">{label}</span>
      {sub && <span className={`text-xs ${highlighted ? "font-semibold text-[color:var(--rc-accent)]" : "text-white/45"}`}>{sub}</span>}
    </button>
  );
}

// An all-in-one display: how far its built-in mics reach (it decides whether the room
// needs extra microphones, and varies by model), then its size — which adds it.
function AllInOneChooser({ info, onChoose }) {
  const [reach, setReach] = useState(null); // null: the typical reach for the size picked
  const reachFor = (size) => reach ?? typicalAllInOneMicReach(size);
  const reachChip = (value, label) => (
    <button
      key={label}
      type="button"
      role="radio"
      aria-checked={reach === value}
      onClick={() => setReach(value)}
      className={`flex min-h-[36px] items-center justify-center rounded-lg border px-1 text-[12px] font-semibold tabular-nums active:scale-[0.96] ${CHOICE_BASE} ${
        reach === value ? CHOICE_ON : CHOICE_OFF
      }`}
    >
      {label}
    </button>
  );
  return (
    <>
      <p className="mb-1 text-xs font-medium text-white/45">Built-in mic reach — from the model's datasheet, if you know it</p>
      <div role="radiogroup" aria-label="Built-in mic reach" className="grid grid-cols-6 gap-1">
        {reachChip(null, "Typical")}
        {ALL_IN_ONE_MIC_REACH_M.map((m) => reachChip(m, `${m} m`))}
      </div>
      <p className="mb-1.5 mt-2 text-xs text-white/45">
        Pick a size — {info.allInOneSize}" suits this room's viewing distance. Seats beyond the mics' reach get extra microphones suggested.
      </p>
      <div className="grid grid-cols-5 gap-1">
        {ALL_IN_ONE_SIZES.map((size) => {
          const best = size === info.allInOneSize;
          return (
            <OptionChip
              key={size}
              label={`${size}"`}
              sub={best ? "Best fit" : `mics ~${reachFor(size)}m`}
              highlighted={best}
              onClick={() => onChoose({ sizeInches: size, micReach: reachFor(size) })}
            />
          );
        })}
      </div>
    </>
  );
}

function DeviceChooser({ category, info, onChoose }) {
  const choose = (payload) => onChoose(category, payload);
  if (category === "allInOne") return <AllInOneChooser info={info} onChoose={choose} />;
  if (category === "display") {
    const ultra = info.preferUltraWide;
    return (
      <>
        <p className="mb-1.5 text-xs text-white/45">
          Pick a size — {ultra ? `a ${info.ultraWideSize}" ultra-wide` : `${info.displaySize}"`} suits this room's viewing distance.
        </p>
        <div className="grid grid-cols-5 gap-1">
          {DISPLAY_SIZES.map((size) => {
            const best = !ultra && size === info.displaySize;
            return <OptionChip key={size} label={`${size}"`} sub={best ? "Best fit" : size >= LED_WALL_MIN_SIZE ? "LED wall" : null} highlighted={best} onClick={() => choose({ sizeInches: size })} />;
          })}
        </div>
        <p className="mb-1 mt-2 text-xs font-medium text-white/45">Ultra-wide 21:9 — for front-row rooms</p>
        <div className="grid grid-cols-5 gap-1">
          {ULTRAWIDE_DISPLAY_SIZES.map((size) => {
            const best = ultra && size === info.ultraWideSize;
            return (
              <OptionChip
                key={size}
                label={`${size}"`}
                sub={best ? "Best fit" : "21:9"}
                highlighted={best}
                onClick={() => choose({ sizeInches: size, aspect: ULTRAWIDE })}
              />
            );
          })}
        </div>
      </>
    );
  }
  if (category === "camera" || category === "videoBar") {
    return (
      <>
        <p className="mb-1.5 text-xs text-white/45">
          {category === "camera" ? "Pick a front-of-room lens, or a 360° camera for the table." : "Pick the video bar's field of view."}
        </p>
        <div className="grid grid-cols-6 gap-1">
          {CAMERA_FOVS.map((fov) => (
            <OptionChip key={fov} label={`${fov}°`} sub="FOV" onClick={() => choose({ fov })} />
          ))}
        </div>
        {category === "camera" && (
          <button
            type="button"
            onClick={() => choose({ fov: 360, isTableCam: true })}
            className={`mt-1 flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left active:scale-[0.99] ${CHOICE_BASE} ${CHOICE_OFF}`}
          >
            <Radar className="h-4 w-4 shrink-0 text-[color:var(--rc-accent)]" />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-white/85">360° camera</span>
              <span className="block text-xs leading-snug text-white/45">
                Middle of the table · built-in mics (~{TABLE_CAM_MIC_RANGE_M}m), no speaker · needs a video bar or all-in-one
              </span>
            </span>
          </button>
        )}
      </>
    );
  }
  if (category === "bookingPanel") {
    const option = (title, description, payload, Glyph) => (
      <button
        type="button"
        onClick={() => choose(payload)}
        className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left active:scale-[0.99] ${CHOICE_BASE} ${CHOICE_OFF}`}
      >
        <Glyph className="h-4 w-4 shrink-0 text-[color:var(--rc-accent)]" />
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-white/85">{title}</span>
          <span className="block text-xs leading-snug text-white/45">{description}</span>
        </span>
      </button>
    );
    return (
      <>
        <p className="mb-1.5 text-xs text-white/45">How is the panel outside the door powered and connected?</p>
        <div className="flex flex-col gap-1">
          {option("Wireless", "ROOMZ wireless room display — battery powered, no cabling to the door", { wired: false }, Wifi)}
          {option("Wired", "Generic room display — power and network cable dropped from the ceiling", { wired: true }, Cable)}
        </div>
      </>
    );
  }
  // Microphones and speakers: added as a set, spread evenly, each draggable afterwards.
  const suggested = category === "microphone" ? info.micCount : info.speakerCount;
  const counts = [...new Set([...QUICK_COUNTS, suggested])].sort((x, y) => x - y);
  return (
    <>
      <p className="mb-1.5 text-xs text-white/45">
        How many? {suggested} suit{suggested === 1 ? "s" : ""} this room — they spread out evenly.
      </p>
      <div className="flex flex-wrap gap-1">
        {counts.map((n) => (
          <OptionChip key={n} label={n} sub={n === suggested ? "Suggested" : null} highlighted={n === suggested} className="min-w-[52px] flex-1" onClick={() => choose({ count: n })} />
        ))}
      </div>
    </>
  );
}

function DeviceRow({ category, count, onAdd, onRemove, choosing, onChoose, onCloseChooser, chooserInfo }) {
  const Icon = DEVICE_ICONS[category];
  const label = DEVICE_LABELS[category];
  const chooserRef = useRef(null);
  const hasChooser = needsChoice(category);

  // Once the options have unfolded, make sure they're in view in the step panel.
  useEffect(() => {
    if (!choosing) return undefined;
    const t = setTimeout(() => revealInPanel(chooserRef.current), 180);
    return () => clearTimeout(t);
  }, [choosing]);

  return (
    <li className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors duration-200 ${
              count ? "bg-blue-600 text-white" : "bg-white/[0.05] text-white/45"
            }`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white/85">{label}</span>
            <span className="line-clamp-2 block text-xs leading-snug text-white/45">{DEVICE_DESCRIPTIONS[category]}</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={`Remove ${label}`}
            onClick={() => onRemove(category)}
            disabled={count === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-white/45 transition-[background-color,transform] duration-100 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100 active:scale-90 active:bg-white/10"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span aria-live="polite" className="w-6 text-center text-[15px] font-semibold tabular-nums text-white">{count}</span>
          <button
            type="button"
            aria-label={choosing ? `Close ${label} options` : `Add ${label}`}
            aria-expanded={hasChooser ? choosing : undefined}
            onClick={() => onAdd(category)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-[background-color,color,transform] duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-90 ${
              choosing ? "bg-white/10 text-white/70 hover:bg-white/15" : "bg-blue-500/10 text-cyan-300 hover:bg-blue-500/15 active:bg-blue-500/25"
            }`}
          >
            {/* The plus turns into a close cross while the options are open. */}
            <Plus className={`h-4 w-4 transition-transform duration-200 ease-out-strong motion-reduce:transition-none ${choosing ? "rotate-45" : ""}`} />
          </button>
        </div>
      </div>
      {hasChooser && (
        <div className="rc-collapse" data-open={choosing}>
          <div className="-mx-1 min-h-0 overflow-hidden px-1">
            <div
              ref={chooserRef}
              inert={!choosing}
              className="pb-1 pt-2.5"
              onKeyDown={(e) => {
                if (e.key === "Escape") onCloseChooser();
              }}
            >
              <DeviceChooser category={category} info={chooserInfo} onChoose={onChoose} />
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

// Add/remove counters for a set of device categories. "+" adds the device straight onto
// the plan — after an inline choice for the ones that need one; "-" removes the
// selected (or most recently added) one.
export function DeviceList({ categories, devices, onAddDevice, onRemoveDevice, chooser, onChoose, onCloseChooser, chooserInfo }) {
  return (
    <ul className="-my-2 divide-y divide-white/[0.07]">
      {categories.map((cat) => (
        <DeviceRow
          key={cat}
          category={cat}
          count={devices[cat].length}
          onAdd={onAddDevice}
          onRemove={onRemoveDevice}
          choosing={chooser === cat}
          onChoose={onChoose}
          onCloseChooser={onCloseChooser}
          chooserInfo={chooserInfo}
        />
      ))}
    </ul>
  );
}

export function CameraFeaturePicker({ cameraFeatures, onToggleCameraFeature }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {CAMERA_FEATURES.map((feature) => {
        const Illustration = CAMERA_FEATURE_ILLUSTRATIONS[feature.id];
        const active = cameraFeatures.includes(feature.id);
        return (
          <button
            key={feature.id}
            type="button"
            onClick={() => onToggleCameraFeature(feature.id)}
            aria-pressed={active}
            aria-description={feature.description}
            title={feature.description}
            className={`relative flex flex-col gap-1.5 rounded-xl border p-1.5 text-left active:scale-[0.98] ${CHOICE_BASE} ${active ? CHOICE_ON : CHOICE_OFF}`}
          >
            <div className="h-12 w-full overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.03]">
              <Illustration />
            </div>
            <span
              aria-hidden="true"
              className={`absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full border shadow-sm transition-colors ${
                active ? "border-blue-500 bg-blue-600 text-white" : "border-white/15 bg-[color:var(--rc-panel-glass)]"
              }`}
            >
              {active && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
            </span>
            <span className={`px-0.5 text-xs font-semibold leading-tight ${active ? "text-cyan-100" : "text-white/85"}`}>{feature.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function NotesField({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="rc-notes" className="sr-only">Notes</label>
      <textarea
        id="rc-notes"
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cable routes, power points, furniture staying in the room, access times…"
        className="w-full resize-y rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-white/85 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-white/35 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/20"
      />
      <span className="text-xs text-white/45">Included in the PDF report.</span>
    </div>
  );
}

// Audio step: how many seats a 360° camera's built-in microphones already reach, so
// the microphones added here only need to fill the gaps. (It has no speaker — sound
// comes from the video bar it's paired with.) Hidden when there's no 360° camera.
// How many seats the built-in mics of 360° cameras and all-in-one displays reach.
export function BuiltInMicNote({ coverage, reaches }) {
  if (!coverage.sources) return null;
  const from = [
    coverage.cams && `the 360° camera (~${TABLE_CAM_MIC_RANGE_M}m)`,
    coverage.allInOnes && `the all-in-one display (~${Math.max(...reaches)}m)`,
  ].filter(Boolean);
  return (
    <div className="flex items-start gap-2 rounded-xl bg-blue-500/10 px-2.5 py-2 text-xs leading-snug text-white/70">
      <Radar aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0 text-[color:var(--rc-accent)]" />
      <p>
        Built-in mics in {from.join(" and ")} reach{" "}
        <span className="font-semibold text-white">
          {coverage.micCovered} of {coverage.seats}
        </span>{" "}
        seats.
      </p>
    </div>
  );
}

// Audio step, once microphones are in: how many seats are within a microphone's
// pickup (a ceiling array's ~5 m, a table mic's ~5 ft, or a built-in mic's reach).
export function MicCoverageNote({ coverage, audioPreference }) {
  if (!coverage.dedicated || !coverage.seats) return null;
  const all = coverage.heard === coverage.seats;
  return (
    <div className={`flex items-start gap-2 rounded-xl px-2.5 py-2 text-xs leading-snug text-white/70 ${all ? "bg-emerald-500/10" : "bg-amber-400/10"}`}>
      <Radar aria-hidden="true" className={`mt-px h-3.5 w-3.5 shrink-0 ${all ? "text-emerald-300" : "text-amber-300"}`} />
      <p>
        Microphones pick up{" "}
        <span className="font-semibold text-white">
          {coverage.heard} of {coverage.seats}
        </span>{" "}
        seats · {micMount(audioPreference) === "ceiling" ? "ceiling arrays reach" : "table mics reach"} {micRangeLabel(audioPreference)}.
      </p>
    </div>
  );
}
