import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { siteImages } from "../data/siteImages";
import { Link } from "react-router-dom";
import { Box, FileDown, Info, Loader2, Map as MapIcon } from "lucide-react";
import { SEO } from "../components/SEO";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { PlanStatusBar } from "../components/roomConfigurator/PlanStatusBar";
import { RoomCanvas } from "../components/roomConfigurator/RoomCanvas";
import { WorkflowStepper } from "../components/roomConfigurator/WorkflowStepper";
import { StepPanel, StepGroup, StepSection } from "../components/roomConfigurator/StepPanel";
import { RoomSizeFields, TableFields, SeatingFields } from "../components/roomConfigurator/DimensionFields";
import {
  LayoutPicker,
  FinishesFields,
  TableTopField,
  PlatformField,
  AudioPreferenceField,
  DeviceList,
  CameraFeaturePicker,
  NotesField,
  BuiltInMicNote,
  MicCoverageNote,
  needsChoice,
} from "../components/roomConfigurator/SectionControls";
import { RecommendationList, ReadinessCard } from "../components/roomConfigurator/RecommendationList";
import { ReviewSummary, UncheckedSections } from "../components/roomConfigurator/ReviewSummary";
import { RoomPhotos } from "../components/roomConfigurator/RoomPhotos";
import { DetailsForm, detailsValid } from "../components/roomConfigurator/DetailsForm";
import { AudiencePicker } from "../components/roomConfigurator/AudiencePicker";
import { TemplatePicker } from "../components/roomConfigurator/TemplatePicker";
import { AUDIENCES, STEPS_BY_AUDIENCE, RECOMMENDATION_STEP } from "../components/roomConfigurator/workflowSteps";
import { exportRoomConfigPdf } from "../lib/exportRoomConfigPdf";
import { analytics } from "../lib/analytics";
import { toast } from "../components/ui/sonner";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { api } from "../lib/api";
import { initialHistory, planReducer } from "../lib/roomPlanState";
import { ROOM_TEMPLATES, emptyDevices } from "../lib/roomTemplates";
import { loadDraft, saveDraft, clearDraft, loadPhotos, savePhotos, hasPlanLink, readPlanLink, planLink } from "../lib/roomPlannerDraft";
// three.js only loads when someone opens the 3D view.
const RoomViewer3D = lazy(() => import("../components/roomConfigurator/room3d/RoomViewer3D"));
import {
  DEVICE_LABELS,
  LAYOUTS,
  TABLE_SIZED_LAYOUTS,
  TABLE_KIND_LABELS,
  CAMERA_FEATURES,
  seatingDensityLabel,
  uid,
  clamp,
  rotateBy,
  generateLayout,
  getChairLimits,
  getPodRadiusLimits,
  POD_RADIUS_LIMITS,
  CLASSROOM_DESK_DEPTH,
  buildRecommendations,
  defaultTableSize,
  ULTRAWIDE,
  builtInMicCoverage,
  builtInPickups,
  micCoverage,
  dedicatedMicReach,
  micRangeLabel,
  recommendedAllInOneSize,
  recommendedDisplaySize,
  recommendedDeviceCount,
  seatingArea,
  SPREAD_CATEGORIES,
  frontWall,
  rotatePoint,
  placedSeats,
  createPlacedDevice,
  addSpreadDevices,
  resolvePlacement,
  followMountedCameras,
  refLabel,
} from "../lib/roomConfiguratorEngine";

// A customer's plan shows the room, its furniture, its doors and its screen, no other
// AV devices.
const NO_DEVICES = emptyDevices();
const customerDevices = (devices) => ({ ...NO_DEVICES, door: devices.door, display: devices.display, allInOne: devices.allInOne });
const CONTROL_DEVICES = ["touchPanel", "contentSharing", "bookingPanel"];
// Sections whose values a layout change resets (table size, seats), so they're
// marked as not checked again.
const LAYOUT_SECTIONS = ["table:size", "table:seats", "seating:table", "seating:seating"];
// Sections a template fills in, marked as not checked again when one is picked.
const TEMPLATE_SECTIONS = ["table:shape", "seating:layout", "video:devices", "audio:audio", "audio:control"];
// The plan joins the steps from the third (Layout / Seating) on: before that there's
// nothing to place yet, so the first steps are just a short form. A room started from a
// template has its furniture already, so there it shows from the room step.
const PLAN_FROM_STEP = 2;
// Sticky header (5rem) + stepper (4rem) + breathing room: where a step's panel should
// land when it's scrolled into view on a phone or tablet.
const STICKY_CHROME_PX = 160;
// Where each device's "+" lives, so an add started elsewhere (a recommendation on the
// review step, say) can open that device's options in its own row.
const DEVICE_HOME = {
  display: ["video", "devices"],
  allInOne: ["video", "devices"],
  camera: ["video", "devices"],
  videoBar: ["video", "devices"],
  microphone: ["audio", "audio"],
  speaker: ["audio", "audio"],
  bookingPanel: ["audio", "control"],
};
const INTRO =
  "Turn the customer's ask into a documented room plan, keeping sales, presales, implementation and the customer aligned before install, so no one hears \"This isn't what I asked for!\"";
const INTRO_POINTS = [
  "Capture the room's current design and the customer's requirements in one place",
  "Close the gap between what the customer needs and what gets installed",
  "Cut down on repeat site visits",
  "Produce a document ready to share with the customer and your technical team or distributor, so they can prepare a BOQ quickly",
  "Private by design: nothing you enter is sent anywhere. Your draft stays in this browser until you start over, and the PDF is built right here",
];

function IntroText({ className = "" }) {
  return (
    <div className={className}>
      <p>{INTRO}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-[color:var(--rc-accent)]">
        {INTRO_POINTS.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}

const countList = (devices, categories) =>
  categories
    .filter((c) => devices[c].length)
    .map((c) => `${devices[c].length} × ${DEVICE_LABELS[c]}`)
    .join(", ") || "None added";

// Usage stats for the admin dashboard: one "open" per browser-tab session (a reload
// in the same tab doesn't count again) and one "export" per PDF. Fire-and-forget:
// a failed stats call must never get in the way of using the configurator.
const USAGE_SESSION_KEY = "rc_usage_recorded";
function recordUsage(event) {
  api.post("/analytics/room-configurator", { event }).catch(() => {});
}

// The devices a room can't work without, named for "Still needed: …".
const ESSENTIAL_NEEDS = {
  "no-display": "a display",
  "no-camera": "a camera, video bar or all-in-one display",
  "table-cam-needs-bar": "a video bar or all-in-one display for the 360° camera",
  "no-speaker": "a speaker",
};
const joinList = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

// Whether a plan has anything worth an undo notice if a template replaces it. The door
// every plan starts with doesn't count until it's been moved.
const planHasContent = (p) =>
  Object.values(p.roomEntered).some(Boolean) ||
  !!p.layout ||
  Object.entries(p.devices).some(([category, list]) => list.some((d) => !(category === "door" && d.autoPlace)));
// Room Planner's notices sit at the bottom middle, clear of the step panel's buttons.
const notify = (message, options) => toast(message, { position: "bottom-center", className: "rc-theme", ...options });
const isTyping = (el) => !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);

// Switches the review step's plan between the 2D drawing and the 3D view.
function PlanViewToggle({ value, onChange }) {
  const options = [
    { id: "2d", label: "2D plan", icon: MapIcon },
    { id: "3d", label: "3D view", icon: Box },
  ];
  return (
    <div role="radiogroup" aria-label="Plan view" className="mb-3 flex w-fit shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5 lg:mb-2">
      {options.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          onClick={() => onChange(id)}
          className={`flex min-h-[32px] items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-[background-color,color,transform] duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97] ${
            value === id ? "bg-blue-600 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// Which side of its display each camera or video bar mounted on one sits on.
function MountSideSwitch({ devices, onChange }) {
  const mounted = ["camera", "videoBar"].flatMap((category) =>
    devices[category]
      .map((item, i) => ({ item, label: refLabel(category, i), category, side: item.mountSide || (category === "videoBar" ? "below" : "above") }))
      .filter(({ item }) => item.mountedOn)
  );
  if (!mounted.length) return null;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {mounted.map(({ category, item, label, side: current }) => (
        <div key={item.id} className="flex items-center justify-between gap-3 text-xs font-medium text-white/70">
          <span>{label} on the display</span>
          <div role="radiogroup" aria-label={`${label} position on the display`} className="flex shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
            {["above", "below"].map((side) => (
              <button
                key={side}
                type="button"
                role="radio"
                aria-checked={current === side}
                onClick={() => onChange(category, item.id, side)}
                className={`min-h-[28px] rounded-md px-3 text-xs font-semibold capitalize transition-[background-color,color] duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  current === side ? "bg-blue-600 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// A contextual next step on the review screen: the plan is done, so offer the
// conversation rather than a generic promotion (blueprint sections 4 and 9).
// The link carries no plan content — only the fact that it came from the planner.
const ConsultationHandoff = ({ audience }) => (
  <Link
    to={`/contact?audience=${audience === "reseller" ? "partner" : "organisation"}`}
    onClick={() => analytics.roomPlannerConsultation({ audience })}
    className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-white/70 transition-colors hover:border-blue-500/60 hover:text-white"
    data-testid="room-planner-consultation"
  >
    <span>
      Want a second opinion on this room?{" "}
      <span className="font-semibold text-blue-300">Book a consultation</span> — we'll
      review the plan with you. Nothing is sent until you choose to share it.
    </span>
  </Link>
);

// `with3d` adds the 3D view of the room on the
// review step where you can sit in each seat and check its sightlines.
export const RoomConfigurator = ({ with3d = false }) => {
  // A draft saved in this browser picks up where the last visit left off, unless this
  // visit came from a shared link, which loads that plan instead (see below).
  const [openedFromLink] = useState(hasPlanLink);
  const [draft] = useState(() => (openedFromLink ? null : loadDraft()));
  const [history, dispatch] = useReducer(planReducer, draft?.plan, (plan) => initialHistory(plan));
  const plan = history.present;
  const {
    audience,
    reportDetails,
    template,
    room,
    roomEntered,
    table,
    chairCount,
    layout,
    platform,
    audioPreference,
    wallMaterials,
    floorType,
    ceilingType,
    tableTopMaterial,
    cameraFeatures,
    seatingDensity,
    additionalNotes,
    tableOffset,
    devices,
    chairOffsets,
    podOverrides,
  } = plan;
  const removedChairIndices = useMemo(() => new Set(plan.removedChairs), [plan.removedChairs]);
  // Every change to the plan: `patch` is an object or (plan) => object.
  const update = useCallback((patch, options = {}) => dispatch({ type: "update", patch, ...options }), []);
  // What the last change was, so a notice only follows an edit (not undo or redo).
  const lastActionRef = useRef(null);
  const undo = useCallback(() => {
    lastActionRef.current = "undo";
    dispatch({ type: "undo" });
  }, []);
  const redo = useCallback(() => {
    lastActionRef.current = "redo";
    dispatch({ type: "redo" });
  }, []);

  // Bumped each time someone tries to go past the room step without its size.
  const [roomAttempt, setRoomAttempt] = useState(0);
  const [selection, setSelection] = useState(null);
  // The device whose inline options (size, lens or quantity) are open in its row.
  const [chooser, setChooser] = useState(null);
  const [exporting, setExporting] = useState(false);
  // Whether the PDF has its Recommendations section (reseller reports only).
  const [includeRecommendations, setIncludeRecommendations] = useState(() => draft?.ui.includeRecommendations ?? true);
  // v2's review step: the 2D plan or the 3D view.
  const [planView, setPlanView] = useState("2d");
  // Guided flow: the step on screen, the steps opened so far (the stepper ticks those
  // off and fills its track up to the furthest), and which way the last move went (so
  // the new step slides in from the side it sits on in the stepper).
  const [stepIndex, setStepIndex] = useState(() => draft?.ui.stepIndex ?? 0);
  const [visitedSteps, setVisitedSteps] = useState(() => new Set(draft?.ui.visitedSteps ?? [0]));
  const [stepDirection, setStepDirection] = useState("forward");
  const stepPanelRef = useRef(null);
  const stepHeadingRef = useRef(null);
  const stepMovedRef = useRef(false);
  // Which section is open in each step (null = all folded); a step not in here yet
  // opens its default section. Only one section per step is open at a time.
  const [openGroups, setOpenGroups] = useState(() => draft?.ui.openGroups ?? {});
  // Sections ("step:section") that have been opened, so their values have been seen.
  // The rest still show starting values, and are marked as not checked.
  const [checkedSections, setCheckedSections] = useState(() => new Set(draft?.ui.checkedSections ?? []));
  // Bumped each time someone tries to move past (or export without) the required
  // details, so the form can show its errors and focus the first one.
  const [detailsAttempt, setDetailsAttempt] = useState(0);
  // Sections ("step:section") where someone tried to move on with a choice still to
  // make, so they say what's missing.
  const [shownErrors, setShownErrors] = useState(() => new Set());
  const [roomImages, setRoomImages] = useState([]);
  const diagramRef = useRef(null);
  const planRef = useRef(null);
  // Blob preview URLs need revoking on removal/unmount; a ref keeps the cleanup
  // effect below from needing roomImages in its dependency array.
  const roomImagesRef = useRef(roomImages);
  useEffect(() => { roomImagesRef.current = roomImages; }, [roomImages]);
  useEffect(() => () => { roomImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl)); }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(USAGE_SESSION_KEY)) return;
      sessionStorage.setItem(USAGE_SESSION_KEY, "1");
    } catch {
      // Storage blocked: still count the visit, just without per-tab de-duplication.
    }
    recordUsage("open");
    // Blueprint section 13: the planner funnel is tracked as starts, audience
    // choice, progress milestones, PDF generation and consultation handoff.
    // None of these carry the room's own content — only which step was reached.
    analytics.roomPlannerStart({ resumed: Boolean(draft) });
    // `draft` is read once from localStorage at mount and never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- draft ------------------------------------------------------------------------

  // The plan and where someone is in the steps are saved shortly after each change.
  useEffect(() => {
    const t = setTimeout(() => {
      saveDraft(plan, { stepIndex, visitedSteps: [...visitedSteps], openGroups, checkedSections: [...checkedSections], includeRecommendations });
    }, 400);
    return () => clearTimeout(t);
  }, [plan, stepIndex, visitedSteps, openGroups, checkedSections, includeRecommendations]);

  // Photos are saved as they're added or removed. `photosReady` holds off saving until
  // the draft's photos have loaded, so an empty list never overwrites them.
  const photosReady = useRef(false);
  useEffect(() => {
    if (photosReady.current) savePhotos(roomImages.map(({ id, file }) => ({ id, file })));
  }, [roomImages]);

  const handleReset = useCallback(() => {
    dispatch({ type: "reset" });
    clearDraft();
    setRoomAttempt(0);
    setSelection(null);
    setChooser(null);
    roomImagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setRoomImages([]);
    setStepDirection("back");
    setStepIndex(0);
    setVisitedSteps(new Set([0]));
    setOpenGroups({});
    setCheckedSections(new Set());
    setShownErrors(new Set());
    setDetailsAttempt(0);
    setIncludeRecommendations(true);
    stepMovedRef.current = true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (openedFromLink) {
      // The shared plan replaces this browser's draft, photos included.
      photosReady.current = true;
      readPlanLink().then((shared) => {
        if (cancelled) return;
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        const sharedSteps = STEPS_BY_AUDIENCE[shared?.plan.audience];
        if (!sharedSteps) {
          notify("Couldn't open that room plan", { description: "The link looks incomplete. Ask for it to be sent again." });
          return;
        }
        dispatch({ type: "reset", plan: shared.plan });
        setRoomImages([]);
        setCheckedSections(new Set(shared.checkedSections));
        setStepIndex(sharedSteps.length - 1);
        setVisitedSteps(new Set(sharedSteps.map((_, i) => i)));
        if (with3d) setPlanView("3d");
        stepMovedRef.current = true;
        notify("Shared room plan opened", { id: "rc-link-opened", description: "It's now saved in this browser. Photos aren't included in links." });
      });
      return () => { cancelled = true; };
    }
    loadPhotos().then((photos) => {
      if (cancelled) return;
      if (photos.length) setRoomImages(photos.map(({ id, file }) => ({ id, file, previewUrl: URL.createObjectURL(file) })));
      photosReady.current = true;
    });
    if (draft?.plan.audience) {
      notify("Picked up where you left off", {
        id: "rc-draft-restored",
        description: "Your plan was saved in this browser.",
        action: { label: "Start fresh", onClick: handleReset },
      });
    }
    return () => { cancelled = true; };
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- undo -------------------------------------------------------------------------


  useEffect(() => {
    function onKeyDown(e) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || isTyping(document.activeElement)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  // After each change to the plan. Undo and redo can bring back a plan where the
  // selected item or open options no longer exist, so both are cleared. An edit to the
  // table, seats or room can reshuffle the generated seating, which clears any chairs
  // removed or moved by hand: that's said, with a way back.
  const seatEditsCleared = useRef(plan.seatEditsCleared);
  useEffect(() => {
    const steppedThroughHistory = lastActionRef.current === "undo" || lastActionRef.current === "redo";
    lastActionRef.current = null;
    const cleared = history.present.seatEditsCleared > seatEditsCleared.current;
    seatEditsCleared.current = history.present.seatEditsCleared;
    if (steppedThroughHistory) {
      setSelection(null);
      setChooser(null);
    } else if (cleared) {
      notify("Chair changes reset", {
        description: "The seating changed, so chairs you removed or moved are back in their places.",
        action: { label: "Undo", onClick: undo },
      });
    }
  }, [history, undo]);

  const layoutResult = useMemo(
    () => generateLayout(layout, room, table, chairCount, podOverrides, seatingDensity),
    [layout, room, table, chairCount, podOverrides, seatingDensity]
  );

  // A regenerated seating plan's chairs and pods aren't the ones that were selected.
  useEffect(() => {
    setSelection((s) => (s?.category === "chair" || s?.category === "tablePod" ? null : s));
  }, [layout, chairCount, table, room, seatingDensity]);

  // Where microphones/speakers get spread: the room, the table, and the area the
  // (remaining) chairs actually cover.
  const spreadContext = useMemo(
    () => ({
      layout,
      room,
      table,
      tableOffset,
      seats: seatingArea(layoutResult.chairs.filter((_, i) => !removedChairIndices.has(i)), room, tableOffset),
    }),
    [layout, room, table, tableOffset, layoutResult.chairs, removedChairIndices]
  );

  // Choosing a layout sets up its furniture fresh: a table at 60% of the room (see
  // defaultTableSize), centered, and the standard number of chairs: as many as that
  // layout seats in this room at the current spacing.
  const handleLayoutChange = (next) => {
    if (next === layout) return;
    update((p) => {
      const nextTable = TABLE_SIZED_LAYOUTS.includes(next) ? { ...p.table, ...defaultTableSize(next, p.room, p.table.orientation) } : p.table;
      return { layout: next, table: nextTable, chairCount: getChairLimits(next, p.room, nextTable, p.seatingDensity)[1], tableOffset: { x: 0, y: 0 } };
    });
    // The new layout's table and seats start afresh, so they need looking at again.
    setCheckedSections((prev) => new Set([...prev].filter((key) => !LAYOUT_SECTIONS.includes(key))));
  };

  const setTable = (next) => update((p) => ({ table: typeof next === "function" ? next(p.table) : next }));

  const handleRemoveChair = (index) => update((p) => ({ removedChairs: [...p.removedChairs, index] }));

  const handleChairDragCommit = (index, dx, dy) => {
    update((p) => ({ chairOffsets: { ...p.chairOffsets, [index]: { ...p.chairOffsets[index], dx, dy } } }));
  };

  const handleSetChairAngle = (index, angle) => {
    update((p) => ({ chairOffsets: { ...p.chairOffsets, [index]: { dx: 0, dy: 0, ...p.chairOffsets[index], angle } } }));
  };

  // "+" on a device: the ones that need a choice first (size, lens, how many) open it
  // inline in their row (pressing "+" again closes it); everything else goes straight
  // onto the plan.
  const handleAddDevice = (category) => {
    if (!needsChoice(category)) { addDevice(category); return; }
    if (chooser === category) { setChooser(null); return; }
    const [stepId, groupId] = DEVICE_HOME[category];
    if (step.id !== stepId) goToStepId(stepId);
    setOpenGroups((g) => ({ ...g, [stepId]: groupId }));
    setChooser(category);
  };

  // Adds a device and drops it on the plan at a sensible spot for its kind (see
  // autoPlacement), selected so it's easy to spot and drag somewhere else.
  // Microphones and speakers are added as an evenly spread set instead.
  const addDevice = (category, payload = {}) => {
    setChooser(null);
    if (SPREAD_CATEGORIES.includes(category)) {
      update((p) => ({ devices: addSpreadDevices(p.devices, category, payload.count, spreadContext) }));
      setSelection(null);
      return;
    }
    const item = createPlacedDevice(category, { room, layout, table, tableOffset, devices, seats }, payload);
    update((p) => ({ devices: { ...p.devices, [category]: [...p.devices[category], item] } }));
    setSelection({ category, id: item.id });
  };

  const handleRemoveDevice = (category) => {
    const arr = devices[category];
    if (!arr.length) return;
    let idToRemove = arr[arr.length - 1].id;
    if (selection?.category === category && arr.some((i) => i.id === selection.id)) idToRemove = selection.id;
    update((p) => ({ devices: { ...p.devices, [category]: p.devices[category].filter((i) => i.id !== idToRemove) } }));
    if (selection?.category === category && selection.id === idToRemove) setSelection(null);
  };

  // Changes one device, by id.
  const updateDevice = (category, id, change) =>
    update((p) => ({ devices: { ...p.devices, [category]: p.devices[category].map((item) => (item.id === id ? change(item) : item)) } }));

  const handleDeviceDragCommit = (category, id, rawX, rawY) => {
    const resolved = resolvePlacement(category, rawX, rawY, room);
    update((p) => {
      const item = p.devices[category].find((d) => d.id === id);
      if (!item) return null;
      // Once moved by hand, an item is no longer re-positioned automatically, and a
      // camera or video bar moved off its display is no longer mounted on it.
      const next = { ...item, x: resolved.x, y: resolved.y, autoPlace: false, autoSpread: false, mountedOn: undefined };
      if (category === "door" || category === "bookingPanel") { next.angle = resolved.angle; next.edge = resolved.edge; }
      if (category === "display" || category === "allInOne" || category === "touchPanel") {
        next.mount = resolved.mount;
        if (resolved.mount === "wall") next.angle = resolved.angle;
      }
      const devices = { ...p.devices, [category]: p.devices[category].map((d) => (d.id === id ? next : d)) };
      // A display carries the cameras mounted on it.
      return { devices: category === "display" ? followMountedCameras(devices, next, p) : devices };
    });
  };

  const handleTableDragCommit = (rawOffset) => update({ tableOffset: rawOffset });

  const handleRotateSelected = (delta) => {
    if (!selection || selection.category === "table" || selection.category === "tablePod") return;
    updateDevice(selection.category, selection.id, (item) => ({ ...item, angle: rotateBy(item.angle || 0, delta), autoPlace: false }));
  };

  const handleSetItemAngle = (category, id, angle) => updateDevice(category, id, (item) => ({ ...item, angle, autoPlace: false }));

  // Open Collaboration: moving a pod carries its chairs with it (their positions are
  // generated relative to the pod), so only the pod's own offset is stored.
  const handlePodDragCommit = (index, dx, dy) => {
    update((p) => {
      const o = p.podOverrides[index] || {};
      return { podOverrides: { ...p.podOverrides, [index]: { ...o, dx: (o.dx || 0) + dx, dy: (o.dy || 0) + dy } } };
    });
  };

  // Turning a pod turns its chair ring with it. Chairs of that pod that were
  // individually nudged or turned keep that adjustment relative to their table, so
  // their stored offset/angle turns by the same amount.
  const handleSetPodAngle = (index, angle) => {
    const delta = angle - (podOverrides[index]?.angle || 0);
    if (!delta) return;
    update((p) => {
      const nextOffsets = { ...p.chairOffsets };
      layoutResult.chairs.forEach((c, i) => {
        const o = p.chairOffsets[i];
        if (c.podIndex !== index || !o) return;
        const r = rotatePoint(o.dx || 0, o.dy || 0, delta);
        nextOffsets[i] = { ...o, dx: r.x, dy: r.y, ...(o.angle != null ? { angle: rotateBy(o.angle, delta) } : {}) };
      });
      return { podOverrides: { ...p.podOverrides, [index]: { ...p.podOverrides[index], angle } }, chairOffsets: nextOffsets };
    });
  };

  const handleRemoveSelected = () => {
    if (!selection || selection.category === "table" || selection.category === "tablePod") return;
    update((p) => ({ devices: { ...p.devices, [selection.category]: p.devices[selection.category].filter((i) => i.id !== selection.id) } }));
    setSelection(null);
  };

  // Open Collaboration only: the selected pod's live diameter, and a setter that
  // stores an override for it, read by the Table length/width controls so a pod
  // can be resized individually once selected, instead of resizing every table.
  // The radius range is capped per the room's actual grid, not just the pod's own
  // absolute bounds, so a resize can never grow a pod into its neighbor's chairs.
  const selectedPod = selection?.category === "tablePod" ? layoutResult.tableShape.tables?.[selection.index] : null;
  const selectedPodDiameter = selectedPod ? selectedPod.radius * 2 : null;
  const selectedPodRadiusLimits = selectedPod ? getPodRadiusLimits(room, chairCount, seatingDensity) : POD_RADIUS_LIMITS;
  const handleResizeSelectedPod = (diameter) => {
    if (selection?.category !== "tablePod") return;
    const radius = clamp(diameter / 2, selectedPodRadiusLimits[0], selectedPodRadiusLimits[1]);
    const index = selection.index;
    update((p) => ({ podOverrides: { ...p.podOverrides, [index]: { ...p.podOverrides[index], radius } } }));
  };

  const toggleIn = (key, value) => update((p) => ({ [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value] }));

  const handleAddRoomImages = (files) => {
    const next = files.map((file) => ({ id: uid("photo"), file, previewUrl: URL.createObjectURL(file) }));
    setRoomImages((prev) => [...prev, ...next]);
  };

  const handleRemoveRoomImage = (id) => {
    setRoomImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  // Starting from a template replaces the room, furniture and devices. When there was
  // something there already, that can be undone.
  const handleChooseTemplate = (id) => {
    if (id === template) return;
    const replacing = planHasContent(plan);
    dispatch({ type: "template", id });
    setSelection(null);
    setChooser(null);
    // Its table, seats and devices are the template's until someone opens them.
    setCheckedSections((prev) => new Set([...prev].filter((key) => !LAYOUT_SECTIONS.includes(key) && !TEMPLATE_SECTIONS.includes(key))));
    if (replacing) {
      notify(id === "custom" ? "Starting from an empty room" : `${ROOM_TEMPLATES[id].label} template applied`, {
        action: { label: "Undo", onClick: undo },
      });
    }
  };

  const effectiveChairCount = Math.max(0, chairCount - removedChairIndices.size);
  // The chairs actually in the room, in room coordinates (as the plan draws them) and
  // with the way each one faces, so microphone pickup and camera coverage (who's seen
  // face-on) can be judged seat by seat.
  const seats = useMemo(
    () => placedSeats(layoutResult.chairs, room, tableOffset, removedChairIndices, chairOffsets),
    [layoutResult.chairs, room, tableOffset, removedChairIndices, chairOffsets]
  );
  const state = {
    room,
    table,
    chairCount: effectiveChairCount,
    layout,
    platform,
    audioPreference,
    devices,
    tableOffset,
    wallMaterials,
    floorType,
    ceilingType,
    tableTopMaterial,
    cameraFeatures,
    additionalNotes,
    seatingDensity,
    seats,
  };

  const handleExport = async ({ roomName, customerName, createdBy }) => {
    const customer = audience === "customer";
    // Mounts the print copy of the plan the report's diagram is taken from (see the
    // end of the page), then lets it render.
    setExporting(true);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      // v2 adds 3D pictures of the room: from outside its entrance, and the whole room.
      // Rendered off screen, with three.js loaded only now; if the browser can't do 3D,
      // the report simply goes without them.
      let views3d = [];
      if (with3d) {
        try {
          const { renderRoomSnapshots } = await import("../components/roomConfigurator/room3d/renderRoomSnapshot");
          const shots = await renderRoomSnapshots({
            room,
            layoutResult,
            tableOffset,
            seats,
            devices: devices3d,
            finishes: finishes3d,
            audioPreference,
            roomName,
            defaultScheduler: !customer,
          });
          views3d = [
            shots?.outside && { title: "3D View: Outside the Room", canvas: shots.outside },
            shots?.overview && { title: "3D View: The Whole Room", canvas: shots.overview },
          ].filter(Boolean);
        } catch {
          views3d = [];
        }
      }
      // Without link support (an old browser) the report goes without one.
      const shareUrl = await planLink(plan, [...checkedSections]).catch(() => null);
      await exportRoomConfigPdf({
        shareUrl,
        views3d,
        includeRecommendations,
        state: customer ? { ...state, devices: customerDevices(state.devices) } : state,
        audience,
        unconfirmed: new Set(unchecked.filter(({ section }) => section.defaults).map(({ step: st, section }) => `${st.id}:${section.id}`)),
        layoutResult,
        removedChairIndices,
        chairOffsets,
        roomName,
        customerName,
        createdBy,
        diagramElement: diagramRef.current,
        images: roomImages.map((img) => img.file),
      });
      toast.success("PDF downloaded");
      recordUsage("export");
      analytics.roomPlannerPdf({ audience, with_3d: views3d.length > 0 });
    } catch {
      toast.error("Couldn't generate the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // --- Guided flow -----------------------------------------------------------------

  const steps = audience ? STEPS_BY_AUDIENCE[audience] : null;

  const roomComplete = roomEntered.length && roomEntered.width && roomEntered.height;
  const handleRoomChange = (next, key) => {
    update((p) => ({ room: next, roomEntered: p.roomEntered[key] ? p.roomEntered : { ...p.roomEntered, [key]: true } }));
  };
  // Asks for what a section still needs: opens it and says what's missing. The details
  // form and the room's measurements flag their own fields.
  const demand = (stepId, sectionId) => {
    setOpenGroups((g) => ({ ...g, [stepId]: sectionId }));
    if (stepId === "about") setDetailsAttempt((n) => n + 1);
    else if (sectionId === "dimensions") setRoomAttempt((n) => n + 1);
    else setShownErrors((prev) => new Set(prev).add(`${stepId}:${sectionId}`));
  };

  // Moving forward needs every step before the destination finished, so the wizard
  // stops at the first one that isn't and says what it still needs. Going back is free.
  const goToStep = (next) => {
    if (!steps) return;
    let i = clamp(next, 0, steps.length - 1);
    if (i > stepIndex) {
      const blocked = steps.slice(0, i).findIndex((st) => firstIncomplete(st.id));
      if (blocked !== -1) {
        i = blocked;
        demand(steps[blocked].id, firstIncomplete(steps[blocked].id).id);
      }
    }
    if (i === stepIndex) return;
    setStepDirection(i > stepIndex ? "forward" : "back");
    setStepIndex(i);
    // First time this step is reached: a meaningful progress milestone. Fired
    // here rather than inside the state updater, which React may run twice.
    if (!visitedSteps.has(i)) {
      analytics.roomPlannerProgress({
        step: steps[i].id,
        step_number: i + 1,
        step_count: steps.length,
        audience,
      });
    }
    setVisitedSteps((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
    setChooser(null);
    stepMovedRef.current = true;
  };
  const goToStepId = (id) => goToStep(steps.findIndex((s) => s.id === id));

  // Picking (or switching) who's planning starts that path from its first step, keeping
  // everything entered so far.
  const chooseAudience = (next) => {
    analytics.roomPlannerProgress({ step: "audience", audience: next });
    update({ audience: next });
    setStepDirection("forward");
    setStepIndex(0);
    setVisitedSteps(new Set([0]));
    setOpenGroups({});
    setCheckedSections(new Set());
    setShownErrors(new Set());
    setChooser(null);
    stepMovedRef.current = true;
  };

  // Next waits until the open section's choices are made, then walks through the step's
  // other sections that haven't been opened or still need something, then moves on.
  const handleNext = () => {
    const open = sectionsFor(step.id).find((sec) => sec.id === openGroup && !sec.optional);
    if (open && missingIn(step.id, open.id).length) {
      demand(step.id, open.id);
      return;
    }
    if (nextSection) {
      setOpenGroups((g) => ({ ...g, [step.id]: nextSection.id }));
      return;
    }
    goToStep(stepIndex + 1);
  };

  // After a step change: move focus to the new step's heading (so keyboard and screen
  // reader users land on it). On desktop the workspace is exactly one screen, so just
  // make sure it's at the top; on smaller screens bring the panel into view if it's
  // off screen, e.g. on a phone, where it sits below the plan.
  useEffect(() => {
    if (!stepMovedRef.current) return;
    stepMovedRef.current = false;
    // Unless something in the new step (a field needing attention) already has focus.
    if (!stepPanelRef.current?.contains(document.activeElement)) stepHeadingRef.current?.focus({ preventScroll: true });
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (window.matchMedia("(min-width: 1024px)").matches) {
      if (window.scrollY > 0) window.scrollTo({ top: 0, behavior });
      return;
    }
    const panel = stepPanelRef.current;
    if (!panel) return;
    const top = panel.getBoundingClientRect().top;
    if (top < STICKY_CHROME_PX || top > window.innerHeight * 0.6) panel.scrollIntoView({ block: "start", behavior });
  }, [stepIndex, audience]);

  const step = steps ? steps[stepIndex] : null;
  const isReview = step?.id === "review";
  const isCustomer = audience === "customer";
  const showPlan = !!steps && (stepIndex >= PLAN_FROM_STEP || (step.id === "room" && !!layout));

  // Recommendations are re-evaluated on every render and raised on the step whose
  // controls resolve them; a step with an open essential gets flagged in the stepper.
  // They're about the AV plan, so only the reseller path has them.
  const recommendations = audience === "reseller" ? buildRecommendations(state) : [];
  const camCoverage = builtInMicCoverage(state);
  // What the inline options suggest: the screen size for this room's viewing distance,
  // and how many more microphones/speakers it needs (the 360° camera's mics included).
  // Microphones are counted by pickup range over the seats as they are.
  const micCover = { seats, seatArea: spreadContext.seats, table, tableOffset, builtIn: builtInPickups(devices) };
  const suggestedMore = (category) =>
    clamp(recommendedDeviceCount(category, layout, room, effectiveChairCount, camCoverage, audioPreference, category === "microphone" ? micCover : null) - devices[category].length, 1, 24);
  const deviceListProps = {
    devices,
    onAddDevice: handleAddDevice,
    onRemoveDevice: handleRemoveDevice,
    chooser,
    onChoose: addDevice,
    onCloseChooser: () => setChooser(null),
    chooserInfo: {
      displaySize: recommendedDisplaySize(room, frontWall(layout, table)),
      ultraWideSize: recommendedDisplaySize(room, frontWall(layout, table), ULTRAWIDE),
      allInOneSize: recommendedAllInOneSize(room, frontWall(layout, table)),
      preferUltraWide: layout === "frontrow",
      micCount: suggestedMore("microphone"),
      speakerCount: suggestedMore("speaker"),
    },
  };
  const recsFor = (stepId) => recommendations.filter((r) => RECOMMENDATION_STEP[r.id] === stepId);
  const essentials = (recs) => recs.filter((r) => r.level === "essential").length;
  const attention = Object.fromEntries((steps || []).map((s) => [s.id, essentials(recsFor(s.id)) > 0]));
  const isControlRec = (r) => r.addCategories.some((c) => CONTROL_DEVICES.includes(c));
  const audioRecs = recsFor("audio").filter((r) => !isControlRec(r));
  const controlRecs = recsFor("audio").filter(isControlRec);
  const openEssentials = essentials(recommendations);

  // What a section still needs before the wizard moves past it: the choices on it not
  // yet made, and any device the room can't work without.
  const needsFrom = (recs) => recs.filter((r) => r.level === "essential" && ESSENTIAL_NEEDS[r.id]).map((r) => ESSENTIAL_NEEDS[r.id]);
  const missingIn = (stepId, sectionId) => {
    switch (`${stepId}:${sectionId}`) {
      case "about:details":
        return detailsValid(audience, reportDetails) ? [] : ["your details"];
      case "room:dimensions":
        return roomComplete ? [] : ["the room's measurements"];
      case "room:finishes":
        return [!isCustomer && !wallMaterials.length && "the walls", !floorType && "the floor", !ceilingType && "the ceiling"].filter(Boolean);
      case "table:shape":
      case "seating:layout":
        return layout ? [] : ["a layout"];
      case "table:size":
      case "seating:table":
        return tableTopMaterial ? [] : ["the table top"];
      case "video:platform":
        return platform ? [] : ["the conferencing platform"];
      case "video:devices":
        return needsFrom(recsFor("video"));
      case "audio:audio":
        return [!audioPreference && "the audio setup", ...needsFrom(audioRecs)].filter(Boolean);
      case "audio:control":
        return needsFrom(controlRecs);
      default:
        return [];
    }
  };

  // Every section of a step on this path, as renderStep draws them: what it's called,
  // whether it can be left unopened, and whether its folded summary shows starting
  // values rather than answers: the table and seats a chosen layout sets up, and
  // everything a template filled in. They drive the "Not checked" markers, the step
  // counts, where Next goes, and the review's list of what hasn't been looked at.
  const fromTemplate = ROOM_TEMPLATES[template] ? "Template" : false;
  const tableTitle = layout === "classroom" ? "Desks" : layout === "collaboration" ? "Tables" : isCustomer ? "Size and top" : "Table";
  const sectionsFor = (stepId) => {
    const table = layout && layout !== "theater" ? [{ id: isCustomer ? "size" : "table", title: tableTitle, defaults: fromTemplate || true }] : [];
    const seats = layout ? [{ id: isCustomer ? "seats" : "seating", title: "Seats", defaults: fromTemplate || true }] : [];
    switch (stepId) {
      case "about":
        return [{ id: "details", title: isCustomer ? "Your details" : "Who it's for" }];
      case "room":
        return [
          { id: "dimensions", title: "Dimensions" },
          { id: "finishes", title: isCustomer ? "Floor and ceiling" : "Finishes" },
        ];
      case "table":
        return [{ id: "shape", title: "Layout", defaults: fromTemplate }, ...table, ...seats];
      case "seating":
        return [{ id: "layout", title: "Layout", defaults: fromTemplate }, ...table, ...seats];
      case "video":
        return [
          { id: "platform", title: "Platform" },
          { id: "devices", title: "Screens and cameras", defaults: fromTemplate },
          { id: "camera", title: "Camera behavior", optional: true },
        ];
      case "audio":
        return [
          { id: "audio", title: "Audio", defaults: fromTemplate },
          { id: "control", title: "Room control", defaults: fromTemplate },
        ];
      case "details":
        return [
          { id: "photos", title: "Room photos", optional: true },
          { id: "notes", title: "Notes for the team", optional: true },
        ];
      default:
        return [];
    }
  };
  const isChecked = (stepId, sectionId) => checkedSections.has(`${stepId}:${sectionId}`);
  const uncheckedIn = (stepId) => sectionsFor(stepId).filter((sec) => !sec.optional && !isChecked(stepId, sec.id));
  // Required sections not yet opened, or opened with a choice still to make.
  const incompleteIn = (stepId) => sectionsFor(stepId).filter((sec) => !sec.optional && (!isChecked(stepId, sec.id) || missingIn(stepId, sec.id).length));
  // The first section of a step with a choice still to make, if any.
  const firstIncomplete = (stepId) => sectionsFor(stepId).find((sec) => !sec.optional && missingIn(stepId, sec.id).length);

  const openGroup = step && step.id in openGroups ? openGroups[step.id] : step?.defaultGroup;
  const group = (id) => {
    const sec = sectionsFor(step.id).find((x) => x.id === id) || {};
    const missing = shownErrors.has(`${step.id}:${id}`) ? missingIn(step.id, id) : [];
    return {
      error: missing.length ? `Still needed: ${joinList(missing)}.` : null,
      open: openGroup === id,
      onToggle: () => setOpenGroups((g) => ({ ...g, [step.id]: openGroup === id ? null : id })),
      checked: isChecked(step.id, id),
      optional: !!sec.optional,
      defaults: sec.defaults || false,
    };
  };

  // A section counts as checked once it has been open, so its values have been seen.
  useEffect(() => {
    if (!step || !openGroup) return;
    const key = `${step.id}:${openGroup}`;
    setCheckedSections((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, [step, openGroup]);

  // Where Next goes: the step's first required section not yet opened, or still needing
  // a choice, if any.
  const nextSection = step ? incompleteIn(step.id).find((sec) => sec.id !== openGroup) : null;
  const stepSections = step ? sectionsFor(step.id).filter((sec) => !sec.optional) : [];
  const stepProgress = { done: stepSections.length - incompleteIn(step?.id).length, total: stepSections.length };
  const pendingByStep = Object.fromEntries((steps || []).map((st) => [st.id, incompleteIn(st.id).length]));
  // Everything not yet checked, for the review, and marked "(default)" in the PDF.
  const unchecked = (steps || []).flatMap((st) => uncheckedIn(st.id).map((sec) => ({ step: st, section: sec })));
  const checkSection = (stepId, sectionId) => {
    goToStepId(stepId);
    setOpenGroups((g) => ({ ...g, [stepId]: sectionId }));
  };

  // Exporting needs every step finished; if one isn't (a draft from before a choice
  // became required, say), go back there.
  const requestExport = () => {
    if (exporting) return;
    const blocked = steps.findIndex((st) => firstIncomplete(st.id));
    if (blocked !== -1) {
      goToStep(blocked);
      demand(steps[blocked].id, firstIncomplete(steps[blocked].id).id);
      return;
    }
    setSelection(null);
    handleExport({
      roomName: reportDetails.roomName.trim(),
      customerName: reportDetails.customerName.trim(),
      createdBy: (audience === "reseller" ? reportDetails.resellerName : reportDetails.contactName).trim(),
    });
  };

  const layoutLabel = LAYOUTS.find((l) => l.id === layout)?.label;
  const notesPreview = additionalNotes.trim();
  const topSummary = tableTopMaterial ? `${tableTopMaterial} top` : "top not chosen";
  const roomSizeSummary = roomComplete ? `${room.length.toFixed(1)} × ${room.width.toFixed(1)} × ${room.height.toFixed(1)} m` : "Not entered yet";
  // What's been picked so far, or "Not chosen yet" when nothing has.
  const picked = (...values) => values.filter(Boolean).join(" · ") || "Not chosen yet";
  const tableSummary = TABLE_SIZED_LAYOUTS.includes(layout)
    ? `${table.length.toFixed(1)} × ${table.width.toFixed(1)} m · ${table.orientation === 0 ? "Landscape" : "Portrait"} · ${topSummary}`
    : layout === "classroom"
    ? `${TABLE_KIND_LABELS[layout]} · ${(table.deskDepth ?? CLASSROOM_DESK_DEPTH.default).toFixed(2)} m deep · ${topSummary}`
    : `${TABLE_KIND_LABELS[layout]} · ${topSummary}`;
  const tableGroupDescription = selectedPod
    ? "Resizing just the selected pod."
    : layout === "dshape"
    ? "Flat end against the screen wall. Drag it along the wall on the plan."
    : layout === "frontrow"
    ? "Curves so everyone in the row faces the screen."
    : layout === "collaboration"
    ? "Pods size themselves. Select one on the plan to resize it."
    : layout === "classroom"
    ? "Desks sit in rows facing the front, split evenly across each row."
    : "Capped to leave room for chairs and a walkway.";

  const templatePicker = <TemplatePicker template={template} audience={audience} onChoose={handleChooseTemplate} />;

  // The layout, its table and its seats: the customer's Layout step and the reseller's
  // Seating step, with their own section ids and wording.
  const renderFurniture = () => {
    const ids = isCustomer ? { layout: "shape", table: "size", seats: "seats" } : { layout: "layout", table: "table", seats: "seating" };
    const seatingRecs = isCustomer ? [] : recsFor("seating");
    return (
      <>
        <StepGroup
          title="Layout"
          summary={layoutLabel || (isCustomer ? "Not chosen yet. Pick how the room is furnished" : "Not chosen yet. Pick one to add a table and chairs")}
          alerts={layout ? 0 : essentials(seatingRecs)}
          {...group(ids.layout)}
        >
          <LayoutPicker layout={layout} onLayoutChange={handleLayoutChange} />
        </StepGroup>
        {layout && layout !== "theater" && (
          <StepGroup title={tableTitle} description={tableGroupDescription} summary={tableSummary} {...group(ids.table)}>
            <TableFields
              room={room}
              table={table}
              layout={layout}
              onTableChange={setTable}
              onOrientationChange={(orientation) => setTable((t) => ({ ...t, orientation }))}
              layoutSupportsTable={TABLE_SIZED_LAYOUTS.includes(layout)}
              lengthApplicable={TABLE_SIZED_LAYOUTS.includes(layout)}
              widthApplicable={TABLE_SIZED_LAYOUTS.includes(layout)}
              deskDepthApplicable={layout === "classroom"}
              selectedPodDiameter={selectedPodDiameter}
              selectedPodRadiusLimits={selectedPodRadiusLimits}
              onResizeSelectedPod={handleResizeSelectedPod}
            />
            <TableTopField value={tableTopMaterial} onChange={(v) => update({ tableTopMaterial: v })} />
          </StepGroup>
        )}
        {layout && (
          <StepGroup
            title="Seats"
            description={isCustomer ? "Starts at the most that fit. Set it to how many people use the room." : undefined}
            summary={`${chairCount} ${isCustomer ? "seats" : "chairs"} · ${seatingDensityLabel(seatingDensity)} spacing`}
            alerts={essentials(seatingRecs)}
            {...group(ids.seats)}
          >
            <SeatingFields
              room={room}
              table={table}
              layout={layout}
              chairCount={chairCount}
              onChairCountChange={(v) => update({ chairCount: v })}
              seatingDensity={seatingDensity}
              onSeatingDensityChange={(v) => update({ seatingDensity: v })}
            />
            {!isCustomer && <RecommendationList recommendations={seatingRecs} onAddDevice={handleAddDevice} />}
          </StepGroup>
        )}
      </>
    );
  };

  const renderStep = () => {
    switch (step.id) {
      case "about":
        return (
          <StepGroup
            title={isCustomer ? "Your details" : "Who it's for"}
            description="Shown at the top of the PDF."
            summary={[isCustomer && reportDetails.contactName, reportDetails.customerName, reportDetails.roomName].filter(Boolean).map((v) => v.trim()).filter(Boolean).join(" · ") || "Not added yet"}
            {...group("details")}
          >
            <DetailsForm
              key={audience}
              audience={audience}
              details={reportDetails}
              onChange={(details) => update({ reportDetails: details }, { coalesce: "details" })}
              onSubmit={handleNext}
              attempt={detailsAttempt}
            />
          </StepGroup>
        );
      case "table":
      case "seating":
        return renderFurniture();
      case "room":
        return (
          <>
            {templatePicker}
            <StepGroup
              title="Dimensions"
              description="Measured wall to wall."
              summary={!isCustomer && roomComplete ? `${roomSizeSummary} · ${devices.door.length} door${devices.door.length === 1 ? "" : "s"}` : roomSizeSummary}
              alerts={isCustomer ? 0 : essentials(recsFor("room"))}
              {...group("dimensions")}
            >
              <RoomSizeFields room={room} entered={roomEntered} onRoomChange={handleRoomChange} attempt={roomAttempt} />
              {!isCustomer && <DeviceList categories={["door"]} {...deviceListProps} />}
              {!isCustomer && <RecommendationList recommendations={recsFor("room")} onAddDevice={handleAddDevice} />}
            </StepGroup>
            <StepGroup
              title={isCustomer ? "Floor and ceiling" : "Finishes"}
              description={isCustomer ? undefined : "Hard surfaces like glass reflect sound."}
              summary={picked(!isCustomer && wallMaterials.join(", "), floorType && `${floorType} floor`, ceilingType)}
              {...group("finishes")}
            >
              <FinishesFields
                showWalls={!isCustomer}
                wallMaterials={wallMaterials}
                onToggleWallMaterial={(m) => toggleIn("wallMaterials", m)}
                floorType={floorType}
                onFloorTypeChange={(v) => update({ floorType: v })}
                ceilingType={ceilingType}
                onCeilingTypeChange={(v) => update({ ceilingType: v })}
              />
            </StepGroup>
          </>
        );
      case "video":
        return (
          <>
            <StepGroup title="Platform" summary={platform || "Not chosen yet"} {...group("platform")}>
              <PlatformField value={platform} onChange={(v) => update({ platform: v })} />
            </StepGroup>
            <StepGroup
              title="Screens and cameras"
              description="Tap + to pick a size or lens. It lands on the plan."
              summary={countList(devices, ["display", "allInOne", "camera", "videoBar"])}
              alerts={essentials(recsFor("video"))}
              {...group("devices")}
            >
              <DeviceList categories={["display", "allInOne", "camera", "videoBar"]} {...deviceListProps} />
              <MountSideSwitch devices={devices} onChange={(category, id, side) => updateDevice(category, id, (item) => ({ ...item, mountSide: side }))} />
              <RecommendationList recommendations={recsFor("video")} onAddDevice={handleAddDevice} />
            </StepGroup>
            <StepGroup
              title="Camera behavior"
              description="How cameras frame people. Choose any."
              summary={
                cameraFeatures.length
                  ? cameraFeatures.map((id) => CAMERA_FEATURES.find((f) => f.id === id)?.label).join(", ")
                  : "None selected"
              }
              {...group("camera")}
            >
              <CameraFeaturePicker cameraFeatures={cameraFeatures} onToggleCameraFeature={(id) => toggleIn("cameraFeatures", id)} />
            </StepGroup>
          </>
        );
      case "audio":
        return (
          <>
            <StepGroup
              title="Audio"
              description="Mics and speakers are added as a set and spread evenly."
              summary={`${audioPreference || "Setup not chosen"} · ${countList(devices, ["microphone", "speaker"])}`}
              alerts={essentials(audioRecs)}
              {...group("audio")}
            >
              <AudioPreferenceField value={audioPreference} onChange={(v) => update({ audioPreference: v })} />
              <BuiltInMicNote coverage={camCoverage} reaches={devices.allInOne.map((d) => d.micReach)} />
              <MicCoverageNote coverage={micCoverage(state)} audioPreference={audioPreference} />
              <DeviceList categories={["microphone", "speaker"]} {...deviceListProps} />
              <RecommendationList recommendations={audioRecs} onAddDevice={handleAddDevice} />
            </StepGroup>
            <StepGroup
              title="Room control"
              description="Each lands on the plan. Drag it where it goes."
              summary={countList(devices, CONTROL_DEVICES)}
              alerts={essentials(controlRecs)}
              {...group("control")}
            >
              <DeviceList categories={CONTROL_DEVICES} {...deviceListProps} />
              <RecommendationList recommendations={controlRecs} onAddDevice={handleAddDevice} />
            </StepGroup>
          </>
        );
      case "details":
        return (
          <>
            <StepGroup
              title="Room photos"
              description="Optional, but they save the survey team guesswork."
              summary={roomImages.length ? `${roomImages.length} photo${roomImages.length === 1 ? "" : "s"} added` : "None added"}
              {...group("photos")}
            >
              <RoomPhotos images={roomImages} onAddImages={handleAddRoomImages} onRemoveImage={handleRemoveRoomImage} />
            </StepGroup>
            <StepGroup
              title="Notes for the team"
              description="Included in the PDF report."
              summary={notesPreview || "None added"}
              {...group("notes")}
            >
              <NotesField value={additionalNotes} onChange={(v) => update({ additionalNotes: v }, { coalesce: "notes" })} />
            </StepGroup>
          </>
        );
      default: {
        // Review: what still needs a look first, then everything that goes in the PDF.
        // Both always show; nothing here folds away.
        const uncheckedList = unchecked.length > 0 && <UncheckedSections items={unchecked} onCheck={checkSection} />;
        const summary = <ReviewSummary state={state} audience={audience} details={reportDetails} photoCount={roomImages.length} onEditStep={goToStepId} />;
        if (isCustomer) {
          return (
            <>
              {uncheckedList && <StepSection title="Before you export">{uncheckedList}</StepSection>}
              <StepSection title="Your room">{summary}</StepSection>
              <StepSection title="Next step"><ConsultationHandoff audience={audience} /></StepSection>
            </>
          );
        }
        return (
          <>
            <StepSection title={openEssentials ? `Before you export · ${openEssentials} essential${openEssentials === 1 ? "" : "s"} missing` : "Before you export"}>
              <div className="flex flex-col gap-2">
                {uncheckedList}
                {(recommendations.length > 0 || !unchecked.length) && <ReadinessCard recommendations={recommendations} onAddDevice={handleAddDevice} />}
              </div>
            </StepSection>
            <StepSection title="Your configuration">{summary}</StepSection>
            <StepSection title="PDF options">
              <label className="flex min-h-[32px] cursor-pointer items-center gap-2 text-xs font-medium text-white/70">
                <input
                  type="checkbox"
                  checked={includeRecommendations}
                  onChange={(e) => setIncludeRecommendations(e.target.checked)}
                  className="h-4 w-4 cursor-pointer accent-blue-500"
                />
                Include recommendations in the PDF
              </label>
            </StepSection>
            <StepSection title="Next step"><ConsultationHandoff audience={audience} /></StepSection>
          </>
        );
      }
    }
  };

  // What the 3D view is built from, kept stable so it only rebuilds on a real change.
  const devices3d = useMemo(() => (isCustomer ? customerDevices(devices) : devices), [isCustomer, devices]);
  const finishes3d = useMemo(() => ({ wallMaterials, floorType, ceilingType, tableTopMaterial }), [wallMaterials, floorType, ceilingType, tableTopMaterial]);
  const show3d = with3d && isReview && planView === "3d";

  // One status bar for both views: the room read-out and Start Over, plus undo
  // and redo in 2D only. 2D passes it into RoomCanvas as its header; 3D renders
  // it itself.
  const planStatusBarProps = {
    room,
    layout,
    capacity: effectiveChairCount,
    onReset: handleReset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    onUndo: undo,
    onRedo: redo,
  };

  const canvasProps = {
    room,
    table,
    chairCount,
    layout,
    layoutResult,
    tableOffset,
    devices: isCustomer ? customerDevices(devices) : devices,
    removedChairIndices,
    chairOffsets,
    micPickup: { reach: dedicatedMicReach(audioPreference, room), label: micRangeLabel(audioPreference) },
  };

  return (
    // Desktop: the configurator is exactly one screen below the fixed site header (a
    // title bar with the stepper, then the plan and the step panel filling the rest),
    // so nothing needs a scroll. Below lg it flows as a normal page instead.
    // The working planner is an app shell locked to one viewport, so the plan and
    // the step panel fill the screen side by side. The start screen is an
    // ordinary page — intro, path picker, 3D preview — and must scroll, so the
    // height lock applies only once a path is chosen.
    <div
      className={`rc-theme rc-surface lg:flex lg:flex-col lg:pt-20 ${
        steps ? "lg:h-dvh lg:min-h-[640px]" : "lg:min-h-dvh"
      }`}
    >
      <SEO
        title="Room Planner"
        description="Plan a meeting room with Fidelis Logic's Room Planner: capture the room's design and requirements, cut repeat site visits, and share a BOQ-ready plan with your customer or technology partner."
        keywords="Room Planner, meeting room configurator, AV room design tool, conference room planner, BOQ"
      />

      {/* On desktop the title and stepper share one bar; below lg this wrapper
          dissolves (display: contents) so the stepper can stick to the page. The start
          screen is an introduction instead: the title and what Room Planner is for. */}
      <div
        className={`max-lg:contents lg:mx-auto lg:flex lg:w-full lg:shrink-0 lg:items-center lg:px-8 ${
          steps ? "lg:max-w-[1600px] lg:gap-10 lg:pb-1 lg:pt-3" : "lg:max-w-[1184px] lg:pb-1 lg:pt-5"
        }`}
      >
        <div className={`px-4 pt-24 sm:px-6 lg:p-0 ${steps ? "pb-3 lg:shrink-0" : "pb-5"}`}>
          <Breadcrumbs
            compact
            tone="dark"
            items={[{ name: "Solutions", href: "/solutions" }, { name: "Room Planner" }]}
          />
          <div className="mt-3 flex items-center gap-1.5 lg:mt-0.5">
            <h1
              className={`text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[34px] ${
                steps ? "lg:text-xl lg:font-semibold lg:tracking-[-0.01em]" : "lg:text-[30px]"
              }`}
            >
              Room Planner
            </h1>
            {with3d && (
              <span className="whitespace-nowrap rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">3D</span>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="About Room Planner"
                  className={`h-8 w-8 items-center justify-center rounded-full text-white/35 transition-colors hover:bg-white/10 hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    steps ? "flex" : "hidden"
                  }`}
                >
                  <Info className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="rc-theme w-[min(24rem,calc(100vw-2rem))] rounded-xl border-white/[0.08] bg-[color:var(--rc-panel-glass)] text-[13px] leading-relaxed text-white/60 shadow-xl backdrop-blur-xl">
                <IntroText />
              </PopoverContent>
            </Popover>
            {audience && (
              <button
                type="button"
                onClick={() => update({ audience: null })}
                className="ml-1 flex min-h-[28px] items-center gap-1 whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs font-medium text-white/60 transition-[background-color,border-color,transform] duration-100 hover:border-blue-400/40 hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97]"
              >
                {AUDIENCES[audience].label}
                <span className="text-white/35">· Change</span>
              </button>
            )}
          </div>
          {/* Once a path is chosen the introduction moves into the info button, so the
              steps start right below the title on a phone too. */}
          {!steps && <IntroText className="mt-2.5 max-w-3xl text-[15px] leading-relaxed text-white/45 lg:text-sm" />}
        </div>
        {steps && <WorkflowStepper steps={steps} current={stepIndex} visited={visitedSteps} attention={attention} pending={pendingByStep} onSelect={goToStep} />}
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-20 pt-5 sm:px-6 lg:min-h-0 lg:flex-1 lg:px-8 lg:pb-5 lg:pt-3">
        <div
          className={`grid grid-cols-1 gap-6 lg:h-full ${
            !steps
              ? "lg:mx-auto lg:max-w-[1120px] lg:content-start"
              : showPlan
              ? "lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-8"
              : "lg:mx-auto lg:max-w-[560px] lg:grid-rows-[minmax(0,1fr)]"
          }`}
        >
          {/* Once it appears, the plan stays beside every step, and fully interactive,
              so each choice shows up on it immediately. */}
          {showPlan && (
            <section ref={planRef} aria-label="Room plan" className="rc-plan-enter flex min-w-0 flex-col lg:min-h-0">
              {with3d && isReview && <PlanViewToggle value={planView} onChange={setPlanView} />}
              {show3d ? (
                /* 2D gets the bar through RoomCanvas, whose stage sizing budgets
                   for it; 3D has no such frame, so it sits directly above. */
                <div className="flex min-h-0 flex-col lg:flex-1">
                  {/* No undo/redo here: the 3D view only shows the room, so an
                      undo would change something the visitor cannot see. */}
                  <PlanStatusBar {...planStatusBarProps} showHistory={false} />
                  <div className="h-[min(78vh,640px)] min-h-[520px] lg:h-auto lg:min-h-0 lg:flex-1">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center gap-2 rounded-3xl border border-white/[0.08] bg-[color:var(--rc-panel)] text-sm text-white/55">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Building the 3D room…
                      </div>
                    }
                  >
                    <RoomViewer3D
                      room={room}
                      layoutResult={layoutResult}
                      tableOffset={tableOffset}
                      seats={seats}
                      devices={devices3d}
                      finishes={finishes3d}
                      audioPreference={audioPreference}
                      roomName={reportDetails.roomName}
                      analysis={!isCustomer}
                      defaultScheduler={!isCustomer}
                    />
                  </Suspense>
                  </div>
                </div>
              ) : (
                <RoomCanvas
                  {...canvasProps}
                  header={<PlanStatusBar {...planStatusBarProps} />}
                  selection={selection}
                  onSelect={setSelection}
                  onTableDragCommit={handleTableDragCommit}
                  onDeviceDragCommit={handleDeviceDragCommit}
                  onRotateSelected={handleRotateSelected}
                  onSetItemAngle={handleSetItemAngle}
                  onRemoveSelected={handleRemoveSelected}
                  onRemoveChair={handleRemoveChair}
                  onChairDragCommit={handleChairDragCommit}
                  onSetChairAngle={handleSetChairAngle}
                  onPodDragCommit={handlePodDragCommit}
                  onSetPodAngle={handleSetPodAngle}
                  hint={!layout && (step.id === "seating" || step.id === "table") ? "Pick a layout to add its furniture to the plan." : step.planHint}
                />
              )}
            </section>
          )}

          {!steps ? (
            <>
              <AudiencePicker audience={audience} onChoose={chooseAudience} />
              {/* What the visitor ends up with, before they commit to a path.
                  Swap the image in data/siteImages.js (roomPlanner3d). */}
              <figure className="rc-step-enter overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03]">
                <ResponsiveImage
                  basePath={siteImages.roomPlanner3d.base}
                  widths={siteImages.roomPlanner3d.widths}
                  sizes="(min-width: 1120px) 1120px, 100vw"
                  width={siteImages.roomPlanner3d.width}
                  height={siteImages.roomPlanner3d.height}
                  alt={siteImages.roomPlanner3d.alt}
                  className="block w-full h-auto"
                  testId="room-planner-3d-preview"
                />
                <figcaption className="px-5 py-3.5 text-[13px] leading-relaxed text-white/60">
                  Where you'll end up: your room in 3D. Sit in any seat to check its view of the
                  screen, then export everything as a PDF.
                </figcaption>
              </figure>
            </>
          ) : (
            <StepPanel
              fitContent={!showPlan}
              ref={stepPanelRef}
              headingRef={stepHeadingRef}
              step={step}
              index={stepIndex}
              total={steps.length}
              direction={stepDirection}
              onBack={() => goToStep(stepIndex - 1)}
              onNext={handleNext}
              nextLabel={isReview ? null : `Next: ${nextSection ? nextSection.title : steps[stepIndex + 1].label}`}
              progress={isReview ? null : stepProgress}
              primaryAction={
                isReview && (
                  <div className="flex items-center gap-2">
                  {/* The same as picking "3D view" above the plan, brought into view on
                      a phone, where the plan sits above this panel. */}
                  {with3d && planView !== "3d" && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlanView("3d");
                        if (!window.matchMedia("(min-width: 1024px)").matches) planRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
                      }}
                      className="flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg border border-blue-500/50 bg-blue-500/10 px-3.5 text-sm font-semibold text-blue-200 transition-[background-color,border-color,transform] duration-100 hover:border-blue-400 hover:bg-blue-500/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97]"
                    >
                      <Box aria-hidden="true" className="h-4 w-4" />
                      3D view
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={requestExport}
                    disabled={exporting}
                    className="flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-[background-color,transform] duration-100 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-70 active:scale-[0.97] active:bg-blue-600"
                  >
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    {exporting ? "Generating PDF…" : "Export PDF"}
                  </button>
                  </div>
                )
              }
            >
              {renderStep()}
            </StepPanel>
          )}
        </div>
      </div>

      {/* While a PDF is being made: an off-screen copy of the plan in print colours, with
          nothing selected, that the report's diagram is taken from. */}
      {exporting && (
        <div aria-hidden="true" inert className="pointer-events-none fixed -left-[10000px] top-0 w-[1000px]">
          <RoomCanvas {...canvasProps} theme="print" selection={null} onSelect={() => {}} diagramRef={diagramRef} />
        </div>
      )}
    </div>
  );
};
