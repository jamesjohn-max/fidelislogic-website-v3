import {
  CLASSROOM_DESK_DEPTH,
  buildDefaultDevices,
  DEFAULT_SEATING_DENSITY,
  clamp,
  clampTableOffset,
  createDefaultDoor,
  generateLayout,
  getChairLimits,
  getTableLimits,
  mainScreen,
  refreshAutoDevices,
  respreadAutoDevices,
  seatingArea,
  tableCenterPoint,
  tableEdgeNearest,
} from "./roomConfiguratorEngine";
import { ROOM_TEMPLATES, buildTemplateDevices, buildTemplatePlan, emptyDevices } from "./roomTemplates";

// Everything Room Planner records about a room, in one object: what the steps set, what's
// been placed and moved on the plan, and who it's for. It's what undo steps back
// through and what the draft saved in this browser holds. (Which step is open, what's
// selected and the photos live outside it.)
//
// Every change goes through `planReducer`, which then puts the plan back in order in one
// pass (see `settle`): the table shrinks to fit a smaller room, the seat count to what
// fits, the table group stays inside the walls, devices follow the room.

export const EMPTY_DETAILS = { resellerName: "", contactName: "", customerName: "", roomName: "" };

// Room Planner starts blank: nothing is filled in until someone enters or picks it, so
// no value in the plan or the PDF can be mistaken for an answer. Until the room's size
// is entered the engine is handed this placeholder, which is never shown.
const PLACEHOLDER_ROOM = { length: 6.5, width: 4.5, height: 2.8 };
const NOTHING_ENTERED = { length: false, width: false, height: false };
// Nobody sits at the end facing the screen wall, so no one has their back to the
// display or blocks it for the rest of the table.
const DEFAULT_TABLE = { length: 3.0, width: 1.2, orientation: 0, screenEndFree: true, deskDepth: CLASSROOM_DESK_DEPTH.default };

export const initialPlan = () => ({
  audience: null,
  reportDetails: EMPTY_DETAILS,
  // Which template the plan started from ("small", "medium", "large"), "custom" for one
  // built by hand, or null before either is picked.
  template: null,
  // While true, the devices are the template's kit, laid out afresh for the room as it
  // changes. Moving, adding or removing any device takes them over by hand.
  templateDevices: false,
  room: PLACEHOLDER_ROOM,
  roomEntered: NOTHING_ENTERED,
  layout: null,
  table: DEFAULT_TABLE,
  chairCount: 0,
  seatingDensity: DEFAULT_SEATING_DENSITY,
  tableOffset: { x: 0, y: 0 },
  // Hand edits to the generated seating: chairs removed (by index), chairs moved or
  // turned, and Open Collaboration pods resized, moved or turned.
  removedChairs: [],
  chairOffsets: {},
  podOverrides: {},
  // Every room starts with a door on the back wall, to be moved where it really is.
  devices: { ...emptyDevices(), door: [createDefaultDoor(PLACEHOLDER_ROOM)] },
  platform: null,
  audioPreference: null,
  wallMaterials: [],
  floorType: null,
  ceilingType: null,
  tableTopMaterial: null,
  cameraFeatures: [],
  additionalNotes: "",
  // Counts the times hand edits to the seating were cleared because the seating itself
  // changed, so the page can say so.
  seatEditsCleared: 0,
});

const hasSeatEdits = (p) => p.removedChairs.length > 0 || Object.keys(p.chairOffsets).length > 0 || Object.keys(p.podOverrides).length > 0;

const EPS = 1e-6;
const sameChairs = (a, b) =>
  a.length === b.length && a.every((c, i) => Math.abs(c.x - b[i].x) < EPS && Math.abs(c.y - b[i].y) < EPS && (c.angle ?? 0) === (b[i].angle ?? 0));

// The template kit rebuilt keeps its devices' ids (by kind and position in the kit), so
// whatever is selected on the plan stays selected as the kit follows the room.
function keepIds(prevDevices, nextDevices) {
  return Object.fromEntries(
    Object.entries(nextDevices).map(([category, list]) => [
      category,
      list.map((item, i) => (prevDevices[category]?.[i] ? { ...item, id: prevDevices[category][i].id } : item)),
    ])
  );
}

// A customer's plan always has a screen to plan the room around: a display sized for
// the room, on the front wall, that follows the room and layout until moved by hand (see
// refreshAutoDevices). It's marked `autoAdded`, so switching to the reseller path — where
// every device is chosen deliberately — takes it away again.
export function syncCustomerDisplay(p) {
  const customer = p.audience === "customer";
  if (!customer) {
    const display = p.devices.display.filter((d) => !d.autoAdded);
    return display.length === p.devices.display.length ? p : { ...p, devices: { ...p.devices, display } };
  }
  if (p.devices.display.length || p.devices.allInOne.length) return p;
  const [display] = buildDefaultDevices(p.room, p.layout, p.table).display;
  const devices = { ...p.devices, display: [{ ...display, autoAdded: true }] };
  return { ...p, devices: refreshAutoDevices(devices, p.room, p.layout, p.table, p.tableOffset) };
}

// Which side of a boardroom table is left clear of chairs: the one the room's main
// screen is on, re-read whenever that screen or the table moves. The seats are then
// laid out again around the other three sides, so the screen's side is empty and
// everyone has a clear view of it (see freeRectEdge).
function withScreenEdge(p) {
  if (p.layout !== "rectangular" || !p.table.screenEndFree) return p;
  const screen = mainScreen(p.devices);
  const screenEdge = screen ? tableEdgeNearest(p.table, tableCenterPoint(p.layout, p.room, p.table, p.tableOffset), screen) : undefined;
  return screenEdge === p.table.screenEdge ? p : { ...p, table: { ...p.table, screenEdge } };
}

// Puts a changed plan back in order, given what it was before the change. The screen's
// side of the table is read from where everything ended up (the table group is kept
// inside the walls first, and an auto-placed screen follows the room), so when it turns
// out to be a different side the plan is settled once more around the new seating.
export function settle(prev, next) {
  const p = syncCustomerDisplay(settleFurnitureAndDevices(prev, syncCustomerDisplay(next)));
  const reseated = withScreenEdge(p);
  return reseated === p ? p : syncCustomerDisplay(settleFurnitureAndDevices(p, reseated));
}

function settleFurnitureAndDevices(prev, next) {
  let p = next;
  const furnitureChanged =
    prev.room !== p.room || prev.layout !== p.layout || prev.table !== p.table || prev.chairCount !== p.chairCount || prev.seatingDensity !== p.seatingDensity;

  if (furnitureChanged) {
    // The table stays in proportion to the room: capped so there's always space for
    // chairs and a walkway (and never narrower than a U-shape needs).
    const limits = getTableLimits(p.room, p.layout);
    const length = clamp(p.table.length, limits.length[0], limits.length[1]);
    const width = clamp(p.table.width, limits.width[0], limits.width[1]);
    if (length !== p.table.length || width !== p.table.width) p = { ...p, table: { ...p.table, length, width } };
    // No more seats than the layout fits at this spacing.
    if (p.layout) {
      const [min, max] = getChairLimits(p.layout, p.room, p.table, p.seatingDensity);
      const chairCount = clamp(p.chairCount, min, max);
      if (chairCount !== p.chairCount) p = { ...p, chairCount };
    }
    // Hand edits refer to the generated seats by index, so they only stay while those
    // seats are unchanged. A bigger room around the same table keeps them.
    if (hasSeatEdits(p)) {
      const before = generateLayout(prev.layout, prev.room, prev.table, prev.chairCount, {}, prev.seatingDensity).chairs;
      const after = generateLayout(p.layout, p.room, p.table, p.chairCount, {}, p.seatingDensity).chairs;
      if (!sameChairs(before, after)) {
        p = { ...p, removedChairs: [], chairOffsets: {}, podOverrides: {}, seatEditsCleared: p.seatEditsCleared + 1 };
      }
    }
  }

  const layoutChanged = furnitureChanged || prev.podOverrides !== p.podOverrides;
  const layoutResult = generateLayout(p.layout, p.room, p.table, p.chairCount, p.podOverrides, p.seatingDensity);
  if (layoutChanged || prev.tableOffset !== p.tableOffset) {
    const tableOffset = clampTableOffset(p.tableOffset, p.room, layoutResult.groupBounds);
    if (tableOffset.x !== p.tableOffset.x || tableOffset.y !== p.tableOffset.y) p = { ...p, tableOffset };
  }

  const seatingChanged =
    layoutChanged || prev.tableOffset !== p.tableOffset || prev.removedChairs !== p.removedChairs || prev.chairOffsets !== p.chairOffsets;
  const templateStarted = p.templateDevices && (!prev.templateDevices || prev.template !== p.template);
  if (p.templateDevices && ROOM_TEMPLATES[p.template] && (seatingChanged || templateStarted)) {
    const devices = buildTemplateDevices(p.template, { ...p, removedChairIndices: new Set(p.removedChairs) });
    return { ...p, devices: keepIds(prev.devices, devices) };
  }

  let devices = p.devices;
  if (prev.room !== p.room) {
    // Keep placed devices inside the room when it shrinks.
    devices = Object.fromEntries(
      Object.entries(devices).map(([category, list]) => [
        category,
        list.map((item) => {
          const x = clamp(item.x, 0, p.room.length);
          const y = clamp(item.y, 0, p.room.width);
          return x === item.x && y === item.y ? item : { ...item, x, y };
        }),
      ])
    );
  }
  if (seatingChanged) {
    // The display and door follow the front and back walls until moved by hand, and
    // microphones and speakers nobody has dragged stay evenly spread.
    devices = refreshAutoDevices(devices, p.room, p.layout, p.table, p.tableOffset);
    const removed = new Set(p.removedChairs);
    const seats = seatingArea(layoutResult.chairs.filter((_, i) => !removed.has(i)), p.room, p.tableOffset);
    devices = respreadAutoDevices(devices, { layout: p.layout, room: p.room, table: p.table, tableOffset: p.tableOffset, seats });
  }
  return devices === p.devices ? p : { ...p, devices };
}

// Starting a template: its room, furniture, audio setup and device kit, keeping who the
// plan is for and anything noted about the room's finishes, photos or notes.
export function applyTemplate(plan, templateId) {
  if (templateId === "custom") {
    const blank = initialPlan();
    const hadTemplate = ROOM_TEMPLATES[plan.template];
    return {
      ...plan,
      template: "custom",
      templateDevices: false,
      // Leaving a template clears what it set up, so the room is built from scratch.
      ...(hadTemplate && {
        room: blank.room,
        roomEntered: blank.roomEntered,
        layout: null,
        table: blank.table,
        chairCount: 0,
        seatingDensity: blank.seatingDensity,
        tableOffset: blank.tableOffset,
        removedChairs: [],
        chairOffsets: {},
        podOverrides: {},
        devices: blank.devices,
        audioPreference: null,
      }),
    };
  }
  const { devices, ...rest } = buildTemplatePlan(templateId);
  return {
    ...plan,
    ...rest,
    template: templateId,
    templateDevices: true,
    roomEntered: { length: true, width: true, height: true },
    removedChairs: [],
    chairOffsets: {},
    podOverrides: {},
  };
}

// --- history ----------------------------------------------------------------------

const HISTORY_LIMIT = 60;
// Typing in one field (notes, a name) within this long counts as a single step to undo.
const COALESCE_MS = 1200;

// A plan (a restored draft, say) with more seats than its room's permitted occupancy
// allows, brought down to that limit.
export function fitOccupancy(plan) {
  if (!plan.layout) return plan;
  const max = getChairLimits(plan.layout, plan.room, plan.table, plan.seatingDensity)[1];
  return plan.chairCount > max ? settle(plan, { ...plan, chairCount: max }) : plan;
}

export const initialHistory = (plan = initialPlan()) => ({ past: [], present: syncCustomerDisplay(fitOccupancy(plan)), future: [], coalesce: null });

// Actions:
//   { type: "update", patch }       patch is an object or (plan) => object. A patch
//                                   touching `devices` hands them over from the template
//                                   unless it says otherwise. `coalesce` (a key) merges
//                                   quick repeats into one undo step.
//   { type: "template", id }        start from a template, or "custom"
//   { type: "undo" } / { type: "redo" }
//   { type: "reset", plan? }        a fresh plan (or a restored draft), with no history
export function planReducer(state, action) {
  switch (action.type) {
    case "update":
    case "template": {
      const { present } = state;
      let next;
      if (action.type === "template") {
        next = applyTemplate(present, action.id);
      } else {
        const patch = typeof action.patch === "function" ? action.patch(present) : action.patch;
        if (!patch) return state;
        next = { ...present, ...patch };
        if ("devices" in patch && !("templateDevices" in patch)) next.templateDevices = false;
      }
      next = settle(present, next);
      if (Object.keys(next).every((k) => next[k] === present[k])) return state;
      const now = action.now ?? Date.now();
      const merge = action.coalesce && state.coalesce && state.coalesce.key === action.coalesce && now - state.coalesce.at < COALESCE_MS;
      return {
        past: merge ? state.past : [...state.past, present].slice(-HISTORY_LIMIT),
        present: next,
        future: [],
        coalesce: action.coalesce ? { key: action.coalesce, at: now } : null,
      };
    }
    case "undo": {
      if (!state.past.length) return state;
      return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future], coalesce: null };
    }
    case "redo": {
      if (!state.future.length) return state;
      return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1), coalesce: null };
    }
    case "reset":
      return initialHistory(action.plan || initialPlan());
    default:
      return state;
  }
}
