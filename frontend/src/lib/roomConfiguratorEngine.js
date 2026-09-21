// Pure geometry + configuration logic for the Meeting Room / AV Configurator.
// Coordinate system: meters, origin top-left of room, x → right, y → down.
// Rotation angle convention: 0° = facing "up" (toward y=0), clockwise, matching compass bearing.

export const GRID_STEP = 0.5 / 3;
export const WALL_SNAP_DISTANCE = 0.55;
export const ROTATE_STEP = 15;
export const CORNER_GAP = 0.42;
export const ROOM_MARGIN = 0.75;

export const ROOM_LIMITS = { length: [3, 100], width: [2.5, 100], height: [2.2, 10] };
// Absolute floor/ceiling for table size, regardless of room size.
export const TABLE_LIMITS = { length: [1, 20], width: [0.6, 8] };
// Fewest chairs any layout can be set to (unless the room's occupancy allows fewer).
// There's no fixed maximum: a layout's ceiling is how many seats its geometry fits
// (see getMaxChairsForLayout), capped at the room's permitted occupancy.
export const MIN_CHAIRS = 2;

// Maximum occupancy, per the Dubai Building Code: one person per 1.5 m² of floor.
export const DBC_M2_PER_PERSON = 1.5;
export const occupancyLimit = (room) => Math.max(1, Math.floor((room.length * room.width) / DBC_M2_PER_PERSON + 1e-9));

// Meters of clearance reserved around the table (both ends of an axis combined) so
// chairs and a walkway always fit — the table's real usable range shrinks and grows
// with the room instead of using one fixed range for every room size.
const TABLE_ROOM_CLEARANCE = 2.0;

// U-shape furniture is specified the way a furniture plan specifies it: "Table
// length" is how long each leg runs (open end to back bar) and "Table width" is the
// span across the U. The table segments themselves are a fixed training-table depth.
const USHAPE_SEGMENT_DEPTH = 0.7;
// Two 0.7m legs plus a walkable 0.6m gap between them — anything narrower isn't a U.
export const USHAPE_MIN_WIDTH = 2.0;
// Classroom desks have their own depth (front to back), separate from the boardroom
// table's size: slim 0.4m training desks by default.
export const CLASSROOM_DESK_DEPTH = { default: 0.4, min: 0.4, max: 0.9 };

export function getTableLimits(room, layout) {
  const minWidth = layout === "ushape" ? USHAPE_MIN_WIDTH : TABLE_LIMITS.width[0];
  const maxLength = clamp(room.length - TABLE_ROOM_CLEARANCE, TABLE_LIMITS.length[0], TABLE_LIMITS.length[1]);
  const maxWidth = clamp(room.width - TABLE_ROOM_CLEARANCE, minWidth, TABLE_LIMITS.width[1]);
  // A D-shape is a small huddle table; a front-row table is long but only one seat deep.
  // Its flat end is against the wall, so only its round end needs the (half) clearance.
  if (layout === "dshape") {
    const maxAlongWall = room.length - TABLE_ROOM_CLEARANCE / 2;
    return { length: [1.2, clamp(maxAlongWall, 1.2, 2.6)], width: [0.9, clamp(maxWidth, 0.9, 1.5)] };
  }
  if (layout === "frontrow") return { length: [1.8, Math.max(1.8, maxLength)], width: [0.6, 1.0] };
  return {
    length: [TABLE_LIMITS.length[0], maxLength],
    width: [minWidth, maxWidth],
  };
}

// A newly chosen table starts at 60% of the room in each direction — its length along
// the way it runs, its width across — rounded to 10cm and kept within that layout's
// size rules (which leave room for chairs and a walkway).
export const DEFAULT_TABLE_SHARE = 0.6;
export function defaultTableSize(layout, room, orientation = 0) {
  const limits = getTableLimits(room, layout);
  const along = orientation === 0 ? room.length : room.width;
  const across = orientation === 0 ? room.width : room.length;
  const round = (v) => Math.round(v * 10) / 10;
  return {
    length: clamp(round(along * DEFAULT_TABLE_SHARE), limits.length[0], limits.length[1]),
    width: clamp(round(across * DEFAULT_TABLE_SHARE), limits.width[0], limits.width[1]),
  };
}

// Only these layouts have a table with dimensions of its own; the others are sized
// by the room, so their summaries describe the furniture instead of measuring it.
export const TABLE_SIZED_LAYOUTS = ["rectangular", "oval", "ushape", "dshape", "frontrow"];
export const TABLE_KIND_LABELS = {
  classroom: "Training desks",
  collaboration: "Round collaboration tables",
  theater: "None (theater seating)",
};

export const LAYOUTS = [
  { id: "rectangular", label: "Rectangular Boardroom", hint: "Classic long table, chairs on every side" },
  { id: "oval", label: "Oval Table", hint: "Softer boardroom shape, even seating" },
  { id: "dshape", label: "D-Shape Huddle", hint: "Flat end on the screen wall — ideal for small and huddle rooms" },
  { id: "ushape", label: "U-Shape", hint: "Open-front layout for workshops & training" },
  { id: "frontrow", label: "Front Row", hint: "One curved row facing an ultra-wide screen" },
  { id: "classroom", label: "Classroom / Training", hint: "Rows of desks, all facing the front" },
  { id: "theater", label: "Theater Rows", hint: "Chairs only, no tables" },
  { id: "collaboration", label: "Open Collaboration", hint: "Small pods for informal work" },
];

export const PLATFORMS = ["Microsoft Teams Rooms", "Zoom Rooms", "Google Meet", "Cisco Webex", "BYOD / Bring Your Own Device"];
export const AUDIO_PREFERENCES = ["Ceiling Microphone Array", "Table Microphone Pods", "Soundbar (Integrated Mic + Speaker)", "Wireless Boundary Microphones"];
// A soundbar is the room's speaker and microphones in one, good for a limited number of
// people: beyond these, extra speakers / microphones are needed.
export const SOUNDBAR_AUDIO = AUDIO_PREFERENCES[2];
export const SOUNDBAR_SPEAKER_CAPACITY = 10;
export const SOUNDBAR_MIC_CAPACITY = 8;
// Below this many seats a camera's or video bar's built-in microphones pick everyone up,
// so dedicated ceiling or table microphones are only suggested from here up.
export const DEDICATED_MIC_MIN_SEATS = 8;
// Multi-select: a room's walls are often mixed materials (e.g. a glass wall on one
// side, drywall on the rest), so more than one can be selected at once.
export const WALL_MATERIALS = ["Gypsum (Drywall)", "Concrete", "Glass", "Wood", "Brick", "Acoustic Fabric Panel"];
export const FLOOR_TYPES = ["Carpet", "Wood / Hardwood", "Tile", "Polished Concrete", "Vinyl / Laminate"];
export const CEILING_TYPES = ["Suspended (Drop) Ceiling", "Drywall (Hard Lid)", "Exposed / Open Ceiling", "Acoustic Tile", "Wood Slat"];
export const TABLE_TOP_MATERIALS = ["Wood Veneer", "Solid Wood", "Glass", "Marble", "Laminate"];
// Flat panels up to 110"; 136" and 163" are all-in-one LED walls, for town halls and
// other rooms deep enough that the back row needs a taller picture than any panel.
export const DISPLAY_SIZES = [32, 43, 50, 55, 65, 75, 85, 98, 110, 136, 163];
export const LED_WALL_MIN_SIZE = 136;
// Ultra-wide 21:9 screens, as used for front-row rooms.
export const ULTRAWIDE_DISPLAY_SIZES = [92, 105];
export const ULTRAWIDE = "21:9";
export const CAMERA_FOVS = [60, 78, 90, 120, 125, 180];

// All-in-one displays: a touch screen with the room's camera, microphones and speakers
// built in — Neat Board 50 / Board Pro, Logitech Rally Board 65, Cisco Board Pro G2,
// Yealink MeetingBoard, Microsoft Surface Hub 3, DTEN D7X, MAXHUB XBoard, Huawei
// IdeaHub and Google Series One Board 65. Across those brands the sizes on offer
// cluster at 50" and 55" (small rooms), 65" (the most common), 75", and 85"/86".
export const ALL_IN_ONE_SIZES = [50, 55, 65, 75, 86];
// Their built-in cameras are wide-angle, 112–120° across these models.
export const ALL_IN_ONE_FOV = 115;
// How far the built-in microphones pick people up depends on the model far more than
// its size — from ~2.3 m (Surface Hub 3 50", Teams-certified distance) and 4 m (Cisco
// Board Pro G2 55"/75") to 7–8 m (Rally Board 65, MeetingBoard) and 10 m (Neat Board
// Pro) — so it's set per device. Without a datasheet to go by, a typical reach for the
// size is assumed: 4 m up to 55", 7 m from 65".
export const ALL_IN_ONE_MIC_REACH_M = [3, 4, 5, 7, 10];
export const typicalAllInOneMicReach = (sizeInches) => (sizeInches <= 55 ? 4 : 7);

// Camera intelligence behaviors, in the spirit of the framing modes real conferencing
// cameras ship with today (Poly DirectorAI's speaker tracking / group framing, Jabra
// PanaCast's virtual director, Neat Symmetry's speaker and individual framing) — a
// room can combine more than one, since these are firmware behaviors a camera can
// often switch between live, not mutually exclusive hardware choices.
export const CAMERA_FEATURES = [
  {
    id: "trackActiveSpeaker",
    label: "Track Active Speaker",
    description: "Camera pans, tilts, and zooms to follow whoever is talking — static or moving around the room.",
  },
  {
    id: "staticWideView",
    label: "Single Static View",
    description: "One fixed wide shot keeps everyone in the room visible at once, no automatic movement.",
  },
  {
    id: "multiSpeakerFraming",
    label: "Frame Active Speakers",
    description: "Frames the most recent active speakers — two or more at a time — as the conversation moves around.",
  },
  {
    id: "individualTiles",
    label: "Individual Participant Frames",
    description: "Every participant gets their own individual frame, gallery-style, for the remote side.",
  },
];

export const DEVICE_ORDER = ["display", "allInOne", "camera", "videoBar", "microphone", "speaker", "touchPanel", "contentSharing", "door", "bookingPanel"];
export const DEVICE_LABELS = {
  display: "Display",
  allInOne: "All-in-one display",
  camera: "Camera",
  videoBar: "Video bar",
  microphone: "Microphones",
  speaker: "Speakers",
  touchPanel: "Touch panel",
  contentSharing: "Content sharing",
  door: "Door",
  bookingPanel: "Booking panel",
};

// Short reference codes shown as canvas labels and in the text brief (D1, C1, M1, SP1, ...).
export const DEVICE_REF_PREFIX = {
  display: "D",
  allInOne: "AIO",
  camera: "C",
  videoBar: "VB",
  microphone: "M",
  speaker: "SP",
  touchPanel: "TP",
  contentSharing: "CS",
  door: "DR",
  bookingPanel: "BP",
};
export const refCode = (category, index) => `${DEVICE_REF_PREFIX[category]}${index + 1}`;
// Full-name version used for on-canvas labels, e.g. "Booking panel 1".
export const refLabel = (category, index) => `${DEVICE_LABELS[category]} ${index + 1}`;

let uidCounter = 1;
export const uid = (prefix = "id") => `${prefix}-${(uidCounter++).toString(36)}-${Date.now().toString(36).slice(-4)}`;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const snap = (v, step = GRID_STEP) => Math.round(v / step) * step;
export const rotateBy = (angle, delta) => ((angle + delta) % 360 + 360) % 360;

// Angle (in our 0deg-is-up, clockwise convention) pointing from the origin toward (dx, dy).
export function angleFromVector(dx, dy) {
  let a = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (a < 0) a += 360;
  return a;
}

export function nearestGridPoint(x, y, room, step = GRID_STEP) {
  return {
    x: clamp(snap(x, step), 0, room.length),
    y: clamp(snap(y, step), 0, room.width),
  };
}

const ASPECT_RATIOS = { "16:9": [16, 9], "21:9": [21, 9] };
const aspectOf = (aspect) => ASPECT_RATIOS[aspect] || ASPECT_RATIOS["16:9"];

export function displayWidthMeters(sizeInches, aspect = "16:9") {
  const [w, h] = aspectOf(aspect);
  return sizeInches * 0.0254 * (w / Math.hypot(w, h));
}

export function displayImageHeight(sizeInches, aspect = "16:9") {
  const [w, h] = aspectOf(aspect);
  return sizeInches * 0.0254 * (h / Math.hypot(w, h));
}

// How a screen is described in lists and the report: `75"`, or `105" 21:9 ultra-wide`.
export const displaySpec = (d) => `${d.sizeInches}"${d.aspect === ULTRAWIDE ? " 21:9 ultra-wide" : ""}`;
// ...and an all-in-one display: `65" · mics ~7m`.
export const allInOneSpec = (d) => `${d.sizeInches}" · mics ~${d.micReach}m`;
// Everything on the walls people watch: displays and all-in-one displays.
export const screensOf = (devices) => [...devices.display, ...devices.allInOne];

// The room's main display: the biggest screen in it (the first of its size).
export function mainScreen(devices) {
  return screensOf(devices).reduce((best, d) => (!best || (d.sizeInches || 0) > (best.sizeInches || 0) ? d : best), null);
}

// How close another person's head can be to a sightline before they're in the way.
export const HEAD_CLEARANCE_M = 0.26;

// How far a seat can be turned from the display and still count as facing it.
const FACING_DISPLAY_DEG = 50;
// Seated eye height, the top of a seated head, and where a screen hangs — the same
// figures the 3D view builds with.
const SEATED_EYE_M = 1.2;
const SEATED_HEAD_TOP_M = 1.29;
const SCREEN_BOTTOM_M = 0.95;
const SCREEN_CEILING_CLEARANCE_M = 0.25;

// The height of a screen's middle: hung at SCREEN_BOTTOM_M unless the ceiling makes it
// sit lower.
export function screenCentreHeight(screen, room) {
  const h = displayImageHeight(screen.sizeInches ?? 65, screen.aspect);
  const ceiling = (room?.height ?? 2.8) - SCREEN_CEILING_CLEARANCE_M;
  const bottom = SCREEN_BOTTOM_M + h > ceiling ? Math.max(0.3, ceiling - h) : SCREEN_BOTTOM_M;
  return bottom + h / 2;
}

// Seats that face the main display but look at it through someone else: another seat
// within a head's width of the line to the screen, and nearer the screen than they are.
// Seats turned away from it (a boardroom's sides, facing across the table) aren't
// judged on this — they turn to watch.
export function seatsBlockedFromDisplay(state) {
  const screen = mainScreen(state.devices);
  const seats = state.seats || [];
  if (!screen || seats.length < 2) return [];
  // A screen hung above head height is seen over the heads further along the
  // sightline; only someone in the near part of it is in the way.
  const rise = screenCentreHeight(screen, state.room) - SEATED_EYE_M;
  const nearShare = rise <= 0.02 ? 1 : Math.min(1, (SEATED_HEAD_TOP_M - SEATED_EYE_M) / rise);
  return seats.filter((seat, i) => {
    const dx = screen.x - seat.x, dy = screen.y - seat.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) return false;
    if (seat.angle != null && angleGap(seat.angle, angleFromVector(dx, dy)) > FACING_DISPLAY_DEG) return false;
    return seats.some((other, j) => {
      if (i === j) return false;
      const along = ((other.x - seat.x) * dx + (other.y - seat.y) * dy) / len;
      if (along <= 0.15 || along >= len * nearShare) return false; // beside, behind, or seen over
      const across = Math.abs((other.x - seat.x) * dy - (other.y - seat.y) * dx) / len;
      return across <= HEAD_CLEARANCE_M;
    });
  });
}

// --- direction / facing helpers -------------------------------------------------

function dirVector(angleDeg) {
  const r = (angleDeg * Math.PI) / 180;
  return { dx: Math.sin(r), dy: -Math.cos(r) };
}

// Rotates (x, y) about the origin by angleDeg, clockwise on screen (y points down) —
// the same sense as every item's rotation angle.
export function rotatePoint(x, y, angleDeg) {
  const r = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

function faceCenterAngle(dx, dy) {
  let a = (Math.atan2(-dx, dy) * 180) / Math.PI;
  if (a < 0) a += 360;
  return a;
}

function toLocal(absX, absY, room) {
  return { x: absX - room.length / 2, y: absY - room.width / 2 };
}

// --- perimeter distribution helpers ---------------------------------------------

// --- seating spacing ----------------------------------------------------------------

// How tightly seats are packed, chosen per room. Everything capacity-related reads its
// spacing from here, so the three settings stay consistent across layouts.
//   tableSeat  chair center-to-center around a table (boardroom, oval, U-shape).
//              Office-planning guides: 760mm (30") generous, 610mm (24") the usual
//              minimum, 550mm (~22") compact — still clears a ~0.5m-wide chair.
//   classroom  seat width at the desks / row-to-row spacing. 0.6m is a standard
//              training desk (a 1.8m table seats 3); 0.75m is two to a 1.5m table.
//   theater    seat width / row spacing for loose event seating (0.5–0.6m seats,
//              0.8–1.0m rows).
//   podGap     walking gap between the chair backs of neighbouring collaboration tables.
export const SEATING_DENSITIES = [
  { id: "comfortable", label: "Comfortable" },
  { id: "standard", label: "Standard" },
  { id: "compact", label: "Compact" },
];
export const DEFAULT_SEATING_DENSITY = "standard";
const DENSITY_SPACING = {
  comfortable: { tableSeat: 0.76, classroom: { seatPitch: 0.75, rowPitch: 1.35 }, theater: { seatPitch: 0.6, rowPitch: 1.0 }, podGap: 0.6 },
  standard: { tableSeat: 0.61, classroom: { seatPitch: 0.6, rowPitch: 1.2 }, theater: { seatPitch: 0.55, rowPitch: 0.9 }, podGap: 0.3 },
  compact: { tableSeat: 0.55, classroom: { seatPitch: 0.55, rowPitch: 1.1 }, theater: { seatPitch: 0.5, rowPitch: 0.8 }, podGap: 0.15 },
};
const densitySpacing = (density) => DENSITY_SPACING[density] || DENSITY_SPACING[DEFAULT_SEATING_DENSITY];

export const seatingDensityLabel = (density) =>
  (SEATING_DENSITIES.find((d) => d.id === density) || SEATING_DENSITIES.find((d) => d.id === DEFAULT_SEATING_DENSITY)).label;

// Plain-language version of the current spacing for a layout, e.g. "0.61 m per seat".
export function seatingSpacingSummary(layout, density) {
  const d = densitySpacing(density);
  const m = (v) => `${v.toFixed(2).replace(/0$/, "")} m`;
  if (layout === "classroom") return `${m(d.classroom.seatPitch)} per seat, ${m(d.classroom.rowPitch)} rows`;
  if (layout === "theater") return `${m(d.theater.seatPitch)} per seat, ${m(d.theater.rowPitch)} rows`;
  if (layout === "collaboration") return `${m(d.podGap)} between tables`;
  return `${m(d.tableSeat)} per seat`;
}

// A boardroom table's short end nearest the screen (the front wall faces it): the left
// edge of a landscape table, the top edge of a portrait one. With `screenEndFree` set,
// no one sits there with their back to the screen and camera.
const rectScreenEdge = (table) => (table.orientation === 0 ? "left" : "top");
const screenEndLength = (table, inset = 0.4) => Math.max(table.width + inset * 2 - 2 * CORNER_GAP, 0.2);

function rectPerimeterLength(w, h, inset = 0.4, cornerGap = CORNER_GAP) {
  const W = w + inset * 2;
  const H = h + inset * 2;
  const topLen = Math.max(W - 2 * cornerGap, 0.2);
  const sideLen = Math.max(H - 2 * cornerGap, 0.2);
  return topLen * 2 + sideLen * 2;
}

function ellipsePerimeterLength(rx, ry, inset = 0.4) {
  const a = rx + inset;
  const b = ry + inset;
  // Ramanujan's approximation — exact ellipse circumference has no closed form.
  const h = (a - b) ** 2 / (a + b) ** 2;
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

// U-shape seats run along the whole outside of the U: each leg's outer side from its
// open tip to the back corner, and the back bar's outer side corner to corner. Only
// a chair's half-width is held back at each open tip (so a chair doesn't overhang
// the end of the leg), and a small clearance at each outer corner, where a leg chair
// and a back-bar chair meet at right angles and can't both sit right at the corner.
const USHAPE_TIP_CLEARANCE = 0.3;
const USHAPE_OUTER_CORNER_CLEARANCE = 0.15;

function uShapeOuterRuns(across, depth) {
  const leg = Math.max(depth - USHAPE_TIP_CLEARANCE - USHAPE_OUTER_CORNER_CLEARANCE, 0.15);
  const back = Math.max(across - 2 * USHAPE_OUTER_CORNER_CLEARANCE, 0.15);
  return { leg, back };
}

function uShapePerimeterLength(across, depth) {
  const { leg, back } = uShapeOuterRuns(across, depth);
  return leg * 2 + back;
}

function rectPerimeterPositions(w, h, count, inset = 0.4, cornerGap = CORNER_GAP, freeEdge = null) {
  if (count <= 0) return [];
  const W = w + inset * 2;
  const H = h + inset * 2;
  // Shorten each edge by cornerGap at both ends so no chair lands at/near a corner.
  const topLen = Math.max(W - 2 * cornerGap, 0.2);
  const sideLen = Math.max(H - 2 * cornerGap, 0.2);
  const bottomLen = topLen;
  const leftLen = sideLen;
  const total = topLen + sideLen + bottomLen + leftLen;
  const pts = [];
  if (freeEdge) {
    // One short end kept free (the screen end): the chairs share the other three edges
    // evenly, running from one corner of the free end round to the other.
    const edges = [
      { id: "top", len: topLen, at: (t) => ({ x: -topLen / 2 + t, y: -H / 2, angle: 180 }) },
      { id: "right", len: sideLen, at: (t) => ({ x: W / 2, y: -sideLen / 2 + t, angle: 270 }) },
      { id: "bottom", len: bottomLen, at: (t) => ({ x: bottomLen / 2 - t, y: H / 2, angle: 0 }) },
      { id: "left", len: leftLen, at: (t) => ({ x: -W / 2, y: leftLen / 2 - t, angle: 90 }) },
    ];
    const start = edges.findIndex((e) => e.id === freeEdge) + 1;
    const path = [0, 1, 2].map((k) => edges[(start + k) % 4]);
    const length = path.reduce((sum, e) => sum + e.len, 0);
    for (let i = 0; i < count; i++) {
      let d = (length * (i + 0.5)) / count;
      const edge = path.find((e) => (d < e.len ? true : ((d -= e.len), false))) || path[2];
      pts.push(edge.at(Math.min(d, edge.len)));
    }
    return pts;
  }
  for (let i = 0; i < count; i++) {
    let d = (total * i) / count + topLen / 2;
    d %= total;
    let x, y, angle;
    if (d < topLen) {
      x = -topLen / 2 + d; y = -H / 2; angle = 180;
    } else if (d < topLen + sideLen) {
      const t = d - topLen; x = W / 2; y = -sideLen / 2 + t; angle = 270;
    } else if (d < topLen + sideLen + bottomLen) {
      const t = d - (topLen + sideLen); x = bottomLen / 2 - t; y = H / 2; angle = 0;
    } else {
      const t = d - (topLen + sideLen + bottomLen); x = -W / 2; y = leftLen / 2 - t; angle = 90;
    }
    pts.push({ x, y, angle });
  }
  return pts;
}

// Chairs are spaced evenly by distance along the ring, not by angle — stepping the
// angle evenly bunches chairs up at the ends of a long oval (the ring moves least
// per degree there), which squeezed them into each other at full capacity.
const ELLIPSE_SAMPLES = 720;
function ellipsePerimeterPositions(rx, ry, count, inset = 0.4) {
  if (count <= 0) return [];
  const a = rx + inset;
  const b = ry + inset;
  const pointAt = (t) => ({ x: a * Math.cos(t), y: b * Math.sin(t) });
  // Cumulative arc length at evenly spaced angles, starting from the top (-90deg).
  const start = -Math.PI / 2;
  const cumulative = [0];
  let prev = pointAt(start);
  for (let k = 1; k <= ELLIPSE_SAMPLES; k++) {
    const p = pointAt(start + (2 * Math.PI * k) / ELLIPSE_SAMPLES);
    cumulative.push(cumulative[k - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
    prev = p;
  }
  const total = cumulative[ELLIPSE_SAMPLES];
  const pts = [];
  let k = 0;
  for (let i = 0; i < count; i++) {
    const target = (total * i) / count;
    while (k < ELLIPSE_SAMPLES && cumulative[k + 1] < target) k++;
    const span = cumulative[k + 1] - cumulative[k] || 1;
    const t = start + (2 * Math.PI * (k + (target - cumulative[k]) / span)) / ELLIPSE_SAMPLES;
    const p = pointAt(t);
    pts.push({ x: p.x, y: p.y, angle: faceCenterAngle(p.x, p.y) });
  }
  return pts;
}

function uShapeSegments(boxW, boxH, thickness) {
  return [
    { x: -boxW / 2, y: -boxH / 2, w: thickness, h: boxH }, // left leg
    { x: boxW / 2 - thickness, y: -boxH / 2, w: thickness, h: boxH }, // right leg
    { x: -boxW / 2, y: boxH / 2 - thickness, w: boxW, h: thickness }, // back bar
  ];
}

// Built with the U opening toward the top (-y): chairs go down the outside of the
// left leg, across the outside of the back bar, and up the outside of the right leg.
function uShapePositions(across, depth, count, inset = 0.4) {
  if (count <= 0) return [];
  const { leg, back } = uShapeOuterRuns(across, depth);
  const legStart = -depth / 2 + USHAPE_TIP_CLEARANCE;
  const backStart = -across / 2 + USHAPE_OUTER_CORNER_CLEARANCE;
  const total = leg * 2 + back;
  const pts = [];
  for (let i = 0; i < count; i++) {
    const d = (total * (i + 0.5)) / count;
    let x, y, angle;
    if (d < leg) {
      x = -across / 2 - inset; y = legStart + d; angle = 90;
    } else if (d < leg + back) {
      x = backStart + (d - leg); y = depth / 2 + inset; angle = 0;
    } else {
      x = across / 2 + inset; y = legStart + leg - (d - leg - back); angle = 270;
    }
    pts.push({ x, y, angle });
  }
  return pts;
}

function uShapeDims(table) {
  const thickness = USHAPE_SEGMENT_DEPTH;
  return {
    thickness,
    across: Math.max(table.width, USHAPE_MIN_WIDTH),
    depth: Math.max(table.length, thickness + 1.2),
  };
}

// The U is built opening toward the top wall (legs running up/down), which is how it
// sits in portrait. Landscape turns it a quarter-turn so the legs run along the room's
// length and the open end faces the left wall — "Table length" always follows the
// legs, matching what landscape/portrait mean for every other table.
function orientUShapePoint(p, orientation) {
  return orientation === 0 ? { x: p.y, y: -p.x } : p;
}
function orientUShapeRect(s, orientation) {
  return orientation === 0 ? { x: s.y, y: -(s.x + s.w), w: s.h, h: s.w } : s;
}

function uShapeLayout(table, chairCount) {
  const { across, depth, thickness } = uShapeDims(table);
  const o = table.orientation;
  const segments = uShapeSegments(across, depth, thickness).map((s) => orientUShapeRect(s, o));
  const chairs = uShapePositions(across, depth, chairCount, 0.42).map((p) => ({
    ...orientUShapePoint(p, o),
    angle: o === 0 ? rotateBy(p.angle, -90) : p.angle,
  }));
  const w = o === 0 ? depth : across;
  const h = o === 0 ? across : depth;
  return { segments, chairs, w, h };
}

// Evenly spaced points along the centerline of the U's three table segments (open
// tip of one leg, round the back bar, out to the other tip), relative to the U's
// center — where table microphones naturally sit on U-shape furniture.
function uShapeCenterlinePoints(table, count) {
  const { across, depth, thickness } = uShapeDims(table);
  const legX = across / 2 - thickness / 2;
  const backY = depth / 2 - thickness / 2;
  const path = [
    { x: -legX, y: -depth / 2 + 0.2 },
    { x: -legX, y: backY },
    { x: legX, y: backY },
    { x: legX, y: -depth / 2 + 0.2 },
  ];
  const segLens = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y));
  const total = segLens.reduce((a, b) => a + b, 0);
  const pts = [];
  for (let i = 0; i < count; i++) {
    let d = (total * (i + 0.5)) / count;
    let s = 0;
    while (s < segLens.length - 1 && d > segLens[s]) { d -= segLens[s]; s++; }
    const t = segLens[s] ? d / segLens[s] : 0;
    const a = path[s], b = path[s + 1];
    pts.push(orientUShapePoint({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, table.orientation));
  }
  return pts;
}

// Row-seating spacing is fixed and realistic (not compressed to force a count to
// fit) — rows/seats-per-row are capped by how many actually fit the room at that
// spacing, so "how many chairs can this room hold" is a real, well-defined number.
//
// Seats are grouped into blocks: after `blockSeats` seats across a row there's an
// aisle, and after `blockRows` rows there's a cross-aisle (both `aisle` wide), so a
// large room gets walkways instead of one endless row or column.
//   seatPitch  seat-to-seat spacing across a row
//   rowPitch   row-to-row spacing, front of one row to front of the next
//   marginX    clear space kept to the side walls
//   front      clear zone between the front wall (screen, presenter) and the first row
//   back       walkway between the last row and the back wall
//   rowFront / rowBack  how far a row reaches ahead of / behind its row line
//
// The front zone and back walkway each have a preferred size and a minimum: rows sit
// at the preferred sizes when the room has space, and a shallow room gives some of it
// up to fit another row rather than leaving a row's worth of floor empty.
//
// Seat and row pitch come from the seating-spacing setting (DENSITY_SPACING); the
// aisles and clearances below are the same at every setting.
// Classroom: an aisle every 6 seats (two 3-seat tables), a cross-aisle every 6 rows.
const CLASSROOM_LAYOUT = { blockSeats: 6, blockRows: 6, aisle: 1.0, marginX: 0.6, front: { min: 0.6, preferred: 0.9 }, back: { min: 0.2, preferred: 0.6 } };
// Theater: no more than 6 chairs side by side before an aisle, so people can move
// around the room easily (blocks are split evenly — see rowBlocks), and a
// cross-aisle every 10 rows.
const THEATER_LAYOUT = { blockSeats: 6, blockRows: 10, aisle: 1.0, marginX: 0.6, front: { min: 0.6, preferred: 0.9 }, back: { min: 0.2, preferred: 0.6 } };
// A classroom desk's back edge sits this far ahead of its row line, and the chairs
// this far behind it (half tucked in).
const DESK_GAP = 0.1;
const DESK_CHAIR_SETBACK = 0.15;
const CHAIR_REACH = 0.3; // a chair's half-depth

const classroomDeskDepth = (table) =>
  clamp(table?.deskDepth ?? CLASSROOM_DESK_DEPTH.default, CLASSROOM_DESK_DEPTH.min, CLASSROOM_DESK_DEPTH.max);

function rowSpacing(layout, density, deskDepth = CLASSROOM_DESK_DEPTH.default) {
  if (layout !== "classroom") {
    return { ...THEATER_LAYOUT, ...densitySpacing(density).theater, rowFront: CHAIR_REACH, rowBack: CHAIR_REACH };
  }
  const { seatPitch, rowPitch } = densitySpacing(density).classroom;
  return {
    ...CLASSROOM_LAYOUT,
    seatPitch,
    // A deeper desk pushes every row behind it back by the extra depth.
    rowPitch: rowPitch + (deskDepth - CLASSROOM_DESK_DEPTH.default),
    rowFront: DESK_GAP + deskDepth,
    rowBack: DESK_CHAIR_SETBACK + CHAIR_REACH,
  };
}

// How many `pitch`-sized units fit end-to-end in `span`, inserting a `gap`-sized
// aisle every time a run reaches `groupSize` units — how many seats fit across a row.
function maxUnitsInSpan(span, groupSize, pitch, gap) {
  let n = 0;
  let used = 0;
  for (;;) {
    const startsNewGroup = n > 0 && n % groupSize === 0;
    const next = used + (startsNewGroup ? gap : 0) + pitch;
    if (next > span + 1e-6) break;
    used = next;
    n++;
  }
  return n;
}

// Offset (from the seating area's front edge) of row index r, in meters — leaves a
// cross-aisle every `blockRows` rows.
function rowBandY(r, sp) {
  const band = Math.floor(r / sp.blockRows);
  const withinBand = r % sp.blockRows;
  return band * (sp.blockRows * sp.rowPitch + sp.aisle) + withinBand * sp.rowPitch;
}

// Splits `total` into `parts` near-equal whole numbers (differing by at most one),
// with the larger ones toward the middle so the result reads symmetrically — e.g.
// 7 seats over 2 desks → [4, 3], 13 over 3 → [4, 5, 4].
function balancedSplit(total, parts) {
  const base = Math.floor(total / parts);
  let extra = total % parts;
  const sizes = Array(parts).fill(base);
  const centerOut = Array.from({ length: parts }, (_, i) => i).sort(
    (a, b) => Math.abs(a - (parts - 1) / 2) - Math.abs(b - (parts - 1) / 2) || a - b
  );
  for (const i of centerOut) {
    if (!extra) break;
    sizes[i]++;
    extra--;
  }
  return sizes;
}

// A row's seats split into desk-sized blocks with an aisle between them. Blocks are
// kept as even as possible — 7 seats become desks of 4 and 3 rather than 6 and a lone
// 1 — using the fewest blocks the `blockSeats` limit allows, so the row is no wider
// than before.
function rowBlocks(seatsInRow, sp) {
  return balancedSplit(seatsInRow, Math.max(1, Math.ceil(seatsInRow / sp.blockSeats)));
}

// Front-to-back depth of `rows` rows, from the first row's front edge to the last
// row's back edge (the last row needs only its own depth, not a full row pitch).
const rowsDepth = (rows, sp) => sp.rowFront + rowBandY(rows - 1, sp) + sp.rowBack;

function rowCapacity(room, sp) {
  const usableW = Math.max(0, room.length - sp.marginX * 2);
  const seatsPerRow = Math.max(1, maxUnitsInSpan(usableW, sp.blockSeats, sp.seatPitch, sp.aisle));
  let maxRows = 1;
  while (sp.front.min + rowsDepth(maxRows + 1, sp) + sp.back.min <= room.width + 1e-6) maxRows++;
  return { seatsPerRow, maxRows };
}

// Where the first row's line sits, from the front wall: the front zone gets its
// preferred size if the rows leave room for it, otherwise whatever is spare over the
// minimums; anything beyond that is left behind the last row.
function firstRowLine(room, rows, sp) {
  const spare = Math.max(0, room.width - (sp.front.min + rowsDepth(rows, sp) + sp.back.min));
  return sp.front.min + Math.min(spare, sp.front.preferred - sp.front.min) + sp.rowFront;
}

export function getMaxChairsForLayout(layout, room, table, density = DEFAULT_SEATING_DENSITY) {
  if (layout === "classroom" || layout === "theater") {
    const { seatsPerRow, maxRows } = rowCapacity(room, rowSpacing(layout, density, classroomDeskDepth(table)));
    return seatsPerRow * maxRows;
  }
  // Rectangular/oval/U-shape seat chairs around the table's own perimeter — cap the
  // count so chairs are never squeezed tighter than the ergonomic minimum spacing.
  if (table && (layout === "rectangular" || layout === "oval" || layout === "ushape")) {
    const boxW = table.orientation === 0 ? table.length : table.width;
    const boxH = table.orientation === 0 ? table.width : table.length;
    let perimeter;
    if (layout === "oval") {
      perimeter = ellipsePerimeterLength(boxW / 2, boxH / 2, 0.42);
    } else if (layout === "ushape") {
      const { across, depth } = uShapeDims(table);
      perimeter = uShapePerimeterLength(across, depth);
    } else {
      perimeter = rectPerimeterLength(boxW, boxH, 0.4) - (table.screenEndFree ? screenEndLength(table) : 0);
    }
    return Math.max(MIN_CHAIRS, Math.floor(perimeter / densitySpacing(density).tableSeat));
  }
  if (table && layout === "dshape") {
    const { f } = dShapePlaced(room, table);
    return Math.max(MIN_CHAIRS, Math.floor(f.seatPathLength / densitySpacing(density).tableSeat));
  }
  if (table && layout === "frontrow") return Math.max(MIN_CHAIRS, Math.floor(frontRowFrame(table).seatArc / densitySpacing(density).tableSeat));
  // Open Collaboration: as many 4-seat pods as fit the room's floor without any
  // pod's chairs reaching a neighbor's.
  if (layout === "collaboration") return Math.max(MIN_CHAIRS, maxPodCount(room, densitySpacing(density).podGap) * SEATS_PER_POD);
  return MIN_CHAIRS;
}

// The range a layout's chair count can be set to: up to as many as fit, but never more
// people than the room's permitted occupancy (see occupancyLimit).
export function getChairLimits(layout, room, table, density = DEFAULT_SEATING_DENSITY) {
  const fits = Math.max(MIN_CHAIRS, getMaxChairsForLayout(layout, room, table, density));
  const max = Math.min(fits, occupancyLimit(room));
  return [Math.min(MIN_CHAIRS, max), max];
}

function rowSeatingLayout(room, count, spacing, { withDesks, deskDepth } = {}) {
  const { seatsPerRow, maxRows } = rowCapacity(room, spacing);
  const fewestRows = Math.min(maxRows, Math.max(1, Math.ceil(count / seatsPerRow)));
  // If the fewest rows would need an aisle splitting a row, but one more row (when the
  // room has space for it) lets every row be a single centered desk, use that — it
  // reads far more evenly than a split front row behind or ahead of a whole one.
  const singleDeskRows = Math.ceil(count / spacing.blockSeats);
  const rows = singleDeskRows > fewestRows && singleDeskRows <= Math.min(maxRows, fewestRows + 1) ? singleDeskRows : fewestRows;
  // Seats spread as evenly as the rows allow (front rows take any extra), so the last
  // row isn't a short stub behind full ones.
  const perRow = balancedSplit(Math.min(count, seatsPerRow * rows), rows).sort((a, b) => b - a);
  const chairs = [], desks = [];
  const firstRowY = firstRowLine(room, rows, spacing);
  perRow.forEach((seatsInRow, r) => {
    if (seatsInRow <= 0) return;
    const rowY = firstRowY + rowBandY(r, spacing);
    const blocks = rowBlocks(seatsInRow, spacing);
    const rowSpan = seatsInRow * spacing.seatPitch + (blocks.length - 1) * spacing.aisle;
    // Every row is centred on the same line, so classroom and theatre seating
    // reads as a uniform grid. Rows used to sit half a seat across from the one
    // in front to clear sightlines; that is now left to the visitor, who can
    // drag individual chairs, and the sightline check still flags any seat that
    // ends up directly behind another (see seatsBlockedFromDisplay).
    let x = room.length / 2 - rowSpan / 2;
    blocks.forEach((seatsInBlock) => {
      // One desk strip per block of seats, so a desk never spans an aisle.
      if (withDesks) {
        const deskLocal = toLocal(x, rowY - DESK_GAP - deskDepth, room);
        desks.push({ x: deskLocal.x, y: deskLocal.y, w: seatsInBlock * spacing.seatPitch, h: deskDepth });
      }
      for (let s = 0; s < seatsInBlock; s++) {
        const abs = { x: x + (s + 0.5) * spacing.seatPitch, y: withDesks ? rowY + DESK_CHAIR_SETBACK : rowY };
        chairs.push({ ...toLocal(abs.x, abs.y, room), angle: 0 });
      }
      x += seatsInBlock * spacing.seatPitch + spacing.aisle;
    });
  });
  return { chairs, desks };
}

function classroomLayout(room, deskDepth, count, density) {
  return rowSeatingLayout(room, count, rowSpacing("classroom", density, deskDepth), { withDesks: true, deskDepth });
}

function theaterLayout(room, count, density) {
  return rowSeatingLayout(room, count, rowSpacing("theater", density), { withDesks: false });
}

// Absolute floor/ceiling a pod can be resized to. The real per-arrangement ceiling
// is tighter — see maxSafePodRadius — this is just the outer sane range.
export const POD_RADIUS_LIMITS = [0.3, 1.2];

// Clearance from a pod's edge to the ring its chairs sit on — same role as the
// `inset` used for the other perimeter layouts.
export const POD_CHAIR_RING_INSET = 0.32;

const SEATS_PER_POD = 4;
// Beyond a pod's chair ring: how far a chair's back reaches past its center, plus
// half the walking gap (`podGap`, from the seating-spacing setting) kept between
// the chair backs of neighbouring pods.
const POD_CHAIR_BACK_REACH = 0.2;
const podClearance = (podGap) => POD_CHAIR_RING_INSET + POD_CHAIR_BACK_REACH + podGap / 2;
// Space kept between the outermost pods' chair backs and the walls.
const COLLAB_WALL_MARGIN = 0.2;
// Smallest grid cell that still holds a minimum-size pod with its chairs.
const minPodCell = (podGap) => 2 * (POD_RADIUS_LIMITS[0] + podClearance(podGap));

function collaborationFloor(room) {
  return { w: Math.max(room.length - COLLAB_WALL_MARGIN * 2, 0.1), h: Math.max(room.width - COLLAB_WALL_MARGIN * 2, 0.1) };
}

// How many pods the room can hold — the full floor, gridded into the smallest
// cells a pod and its chairs fit in.
function maxPodCount(room, podGap) {
  const { w, h } = collaborationFloor(room);
  const cell = minPodCell(podGap);
  return Math.max(1, Math.floor(w / cell) * Math.floor(h / cell));
}

// Grid placement for `podCount` pods in the room — shared by the layout generator
// and the resize limits, so they always agree on what fits. Picks the rows x cols
// split that gives each pod the most room; for any count up to maxPodCount that's
// at least minPodCell.
function collaborationGrid(room, podCount) {
  const { w, h } = collaborationFloor(room);
  let best = null;
  for (let cols = 1; cols <= podCount; cols++) {
    const rows = Math.ceil(podCount / cols);
    const cell = Math.min(w / cols, h / rows);
    if (!best || cell > best.cell + 1e-9) best = { cols, rows, cell };
  }
  return { cols: best.cols, rows: best.rows, cellW: w / best.cols, cellH: h / best.rows, marginX: COLLAB_WALL_MARGIN, marginY: COLLAB_WALL_MARGIN };
}

// The largest a pod can be while it and its chairs stay inside its own grid cell,
// so two pods sized at or under this never have overlapping chairs.
function maxSafePodRadius(cellW, cellH, podGap) {
  return Math.min(cellW, cellH) / 2 - podClearance(podGap);
}

// The radius range a specific pod can be resized to without its chairs reaching
// into a neighboring pod's cell, for the given room/chair count.
export function getPodRadiusLimits(room, chairCount, density = DEFAULT_SEATING_DENSITY) {
  const { podGap } = densitySpacing(density);
  const podCount = Math.max(1, Math.ceil(chairCount / SEATS_PER_POD));
  const { cellW, cellH } = collaborationGrid(room, podCount);
  const safeMax = clamp(maxSafePodRadius(cellW, cellH, podGap), POD_RADIUS_LIMITS[0], POD_RADIUS_LIMITS[1]);
  return [POD_RADIUS_LIMITS[0], safeMax];
}

// podOverrides[index] = { radius?, dx?, dy?, angle? } — a pod someone has resized,
// dragged, or turned. Its chairs follow it: they're placed on the pod's own ring,
// then moved and rotated with the table, and tagged with podIndex so the canvas
// can move/turn them together with their table.
function collaborationLayout(room, count, podOverrides = {}, density = DEFAULT_SEATING_DENSITY) {
  const { podGap } = densitySpacing(density);
  const perPod = SEATS_PER_POD;
  const podCount = Math.max(1, Math.ceil(count / perPod));
  const { cols, rows, cellW, cellH, marginX, marginY } = collaborationGrid(room, podCount);
  // Size pods to fill their cell as much as ergonomic chair spacing allows, so
  // seating stays generous without ever reaching into a neighboring pod's chairs.
  const defaultPodRadius = clamp(maxSafePodRadius(cellW, cellH, podGap), POD_RADIUS_LIMITS[0], 0.6);
  const overrideMax = clamp(maxSafePodRadius(cellW, cellH, podGap), POD_RADIUS_LIMITS[0], POD_RADIUS_LIMITS[1]);
  const chairs = [], tables = [];
  let remaining = count, idx = 0;
  for (let r = 0; r < rows && idx < podCount; r++) {
    // A short last row is centered rather than left-aligned.
    const inRow = Math.min(cols, podCount - r * cols);
    const shift = (cols - inRow) / 2;
    for (let c = 0; c < cols && idx < podCount; c++) {
      const absX = marginX + cellW * (c + shift + 0.5);
      const absY = marginY + cellH * (r + 0.5);
      const local = toLocal(absX, absY, room);
      const seatsHere = Math.min(perPod, remaining);
      remaining -= seatsHere;
      // A manual resize is capped at this cell's safe radius too, or its chairs
      // would overlap the neighboring pod's.
      const o = podOverrides[idx] || {};
      const podRadius = o.radius != null ? clamp(o.radius, POD_RADIUS_LIMITS[0], overrideMax) : defaultPodRadius;
      const podX = local.x + (o.dx || 0);
      const podY = local.y + (o.dy || 0);
      const podAngle = o.angle || 0;
      tables.push({ x: podX, y: podY, radius: podRadius, angle: podAngle });
      const podIndex = idx;
      ellipsePerimeterPositions(podRadius, podRadius, seatsHere, POD_CHAIR_RING_INSET).forEach((p) => {
        const r = rotatePoint(p.x, p.y, podAngle);
        chairs.push({ x: podX + r.x, y: podY + r.y, angle: rotateBy(p.angle, podAngle), podIndex });
      });
      idx++;
    }
  }
  return { chairs, tables };
}

// --- main layout generator --------------------------------------------------------

// groupBounds is how far the table group reaches from its center in each direction
// (room-center-relative, like the layout's own coordinates) — what the group has to
// keep inside the walls when it's dragged. Table layouts are symmetric around the
// table; row and pod layouts use the real extent of their seats and desks, so the
// whole seating block can be moved anywhere it fits instead of snapping back.
// --- D-shape huddle table and front-row seating ---------------------------------------

const TABLE_CHAIR_INSET = 0.42;
// Quarter-turn used by the tables below: they're built with the screen wall at the top,
// and turned so it's on the left wall when that's the front (landscape).
const turnToLeftWall = (p) => ({ x: p.y, y: -p.x });

function pointInPolygon(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function polygonBox(poly) {
  const xs = poly.map((p) => p.x), ys = poly.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// A D-shaped huddle table: its flat end sits against the screen wall and it runs out
// into the room, finishing in a half-round. People sit along its sides and round the
// end — as many as the seat spacing allows — the nearest one kept clear of the screen.
// Built with the screen wall along y = wallY and the table running down from it.
const DSHAPE_SCREEN_CLEARANCE = 0.55;

function dShapeFrame(table, wallY) {
  const r = table.width / 2;
  const length = Math.max(table.length, r + 0.3);
  const roundY = wallY + length - r; // center of the half-round end
  const outline = [{ x: -r, y: wallY }, { x: -r, y: roundY }];
  for (let k = 1; k < 24; k++) {
    const a = Math.PI - (Math.PI * k) / 24;
    outline.push({ x: r * Math.cos(a), y: roundY + r * Math.sin(a) });
  }
  outline.push({ x: r, y: roundY }, { x: r, y: wallY });
  // Seats: down one side, round the end, back up the other.
  const R = r + TABLE_CHAIR_INSET;
  const side = Math.max(0, roundY - (wallY + DSHAPE_SCREEN_CLEARANCE));
  const arc = Math.PI * R;
  const seatAt = (d) => {
    if (d < side) return { x: -R, y: wallY + DSHAPE_SCREEN_CLEARANCE + d, angle: 90 };
    if (d < side + arc) {
      const a = Math.PI - (d - side) / R;
      const p = { x: R * Math.cos(a), y: roundY + R * Math.sin(a) };
      return { ...p, angle: faceCenterAngle(p.x, p.y - roundY) };
    }
    return { x: R, y: roundY - (d - side - arc), angle: 270 };
  };
  return { outline, seatAt, seatPathLength: side * 2 + arc, center: { x: 0, y: wallY + length / 2 } };
}

// The D's frame placed in the room: flat end on the front wall, relative to the room's
// center (the table group's resting point) — it's pinned to that wall.
function dShapePlaced(room, table) {
  const turn = frontWall("dshape", table) === "left";
  const f = dShapeFrame(table, -(turn ? room.length : room.width) / 2);
  const place = (p) => (turn ? turnToLeftWall(p) : p);
  return { f, turn, place, outline: f.outline.map(place), center: place(f.center) };
}

function dShapeLayout(room, table, count) {
  const { f, turn, place, outline } = dShapePlaced(room, table);
  const chairs = Array.from({ length: count }, (_, i) => {
    const seat = f.seatAt((f.seatPathLength * (i + 0.5)) / count);
    return { ...place(seat), angle: turn ? rotateBy(seat.angle, -90) : seat.angle };
  });
  return { outline, chairs, pin: turn ? "x" : "y" };
}

// Front-row seating: one gently curved table with everyone on the far side of it, all
// facing the screen wall. The curve's center lies behind the screen, so the table's
// ends wrap toward it and every seat looks at the screen. Built screen-at-the-top,
// with the middle of the table at the group's center.
const FRONTROW_MIN_RADIUS = 3.2;

function frontRowFrame(table) {
  const length = table.length, depth = table.width;
  const front = Math.max(FRONTROW_MIN_RADIUS, length * 1.1); // radius of the screen-side edge
  const back = front + depth;
  const cy = -(front + depth / 2); // curve center
  const half = Math.asin(Math.min(0.95, length / 2 / (front + depth / 2)));
  const at = (r, a) => ({ x: r * Math.sin(a), y: cy + r * Math.cos(a) });
  const outline = [];
  for (let k = 0; k <= 24; k++) outline.push(at(front, -half + (2 * half * k) / 24));
  for (let k = 24; k >= 0; k--) outline.push(at(back, -half + (2 * half * k) / 24));
  const seatR = back + TABLE_CHAIR_INSET;
  const seatHalf = Math.max(0, half - 0.3 / seatR);
  return { outline, at, cy, half, mid: front + depth / 2, seatR, seatHalf, seatArc: 2 * seatHalf * seatR };
}

function frontRowPlaced(table) {
  const turn = frontWall("frontrow", table) === "left";
  const f = frontRowFrame(table);
  return { f, turn, place: (p) => (turn ? turnToLeftWall(p) : p) };
}

function frontRowLayout(table, count) {
  const { f, turn, place } = frontRowPlaced(table);
  const chairs = Array.from({ length: count }, (_, i) => {
    const p = f.at(f.seatR, -f.seatHalf + (2 * f.seatHalf * (i + 0.5)) / count);
    const angle = faceCenterAngle(p.x, p.y - f.cy);
    return { ...place(p), angle: turn ? rotateBy(angle, -90) : angle };
  });
  return { outline: f.outline.map(place), chairs };
}

// The table top as the devices on it see it, relative to the table group's center:
// its middle, bounding box, a point-inside test, and (for the curved front-row table)
// evenly spaced points along its middle — where table mics and panels go.
export function tableSurface(layout, room, table) {
  const boxW = table.orientation === 0 ? table.length : table.width;
  const boxH = table.orientation === 0 ? table.width : table.length;
  if (layout === "dshape" || layout === "frontrow") {
    let outline, center, centerline = null;
    if (layout === "dshape") {
      ({ outline, center } = dShapePlaced(room, table));
    } else {
      const { f, place } = frontRowPlaced(table);
      outline = f.outline.map(place);
      center = place(f.at(f.mid, 0));
      centerline = (count) => Array.from({ length: count }, (_, i) => place(f.at(f.mid, -f.half * 0.9 + (1.8 * f.half * (i + 0.5)) / count)));
    }
    const box = polygonBox(outline);
    const contains = (p, margin = 0) =>
      [[0, 0], [margin, 0], [-margin, 0], [0, margin], [0, -margin]].every(([dx, dy]) => pointInPolygon({ x: p.x + dx, y: p.y + dy }, outline));
    return { center, w: box.w, h: box.h, box, contains, centerline, outline };
  }
  return {
    center: { x: 0, y: 0 },
    w: boxW,
    h: boxH,
    box: { x: -boxW / 2, y: -boxH / 2, w: boxW, h: boxH },
    contains: (p, margin = 0) => Math.abs(p.x) <= boxW / 2 - margin && Math.abs(p.y) <= boxH / 2 - margin,
    centerline: null,
  };
}

// The table's middle in room coordinates — what cameras aim at and table-top devices
// gather around.
export function tableCenterPoint(layout, room, table, tableOffset = { x: 0, y: 0 }) {
  const c = tableSurface(layout, room, table).center;
  return { x: room.length / 2 + tableOffset.x + c.x, y: room.width / 2 + tableOffset.y + c.y };
}

function symmetricBounds(w, h) {
  return { minX: -w / 2, maxX: w / 2, minY: -h / 2, maxY: h / 2 };
}

const SEAT_FOOTPRINT_REACH = 0.3; // chair half-size, so the block's edge chairs stay clear of the walls

function contentBounds(chairs, rects = [], circles = []) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const grow = (x0, y0, x1, y1) => {
    minX = Math.min(minX, x0); maxX = Math.max(maxX, x1);
    minY = Math.min(minY, y0); maxY = Math.max(maxY, y1);
  };
  chairs.forEach((c) => grow(c.x - SEAT_FOOTPRINT_REACH, c.y - SEAT_FOOTPRINT_REACH, c.x + SEAT_FOOTPRINT_REACH, c.y + SEAT_FOOTPRINT_REACH));
  rects.forEach((r) => grow(r.x, r.y, r.x + r.w, r.y + r.h));
  circles.forEach((t) => grow(t.x - t.radius, t.y - t.radius, t.x + t.radius, t.y + t.radius));
  return Number.isFinite(minX) ? { minX, maxX, minY, maxY } : symmetricBounds(0, 0);
}

export function generateLayout(layoutType, room, table, chairCount, podOverrides = {}, density = DEFAULT_SEATING_DENSITY) {
  // Nothing chosen yet: an empty room, no table or chairs.
  if (!layoutType) return { tableShape: { type: "none" }, chairs: [], groupBounds: symmetricBounds(0, 0) };
  const boxW = table.orientation === 0 ? table.length : table.width;
  const boxH = table.orientation === 0 ? table.width : table.length;

  switch (layoutType) {
    case "oval": {
      const chairs = ellipsePerimeterPositions(boxW / 2, boxH / 2, chairCount, 0.42);
      return { tableShape: { type: "ellipse", w: boxW, h: boxH }, chairs, groupBounds: symmetricBounds(boxW + 1.7, boxH + 1.7) };
    }
    case "ushape": {
      const { segments, chairs, w, h } = uShapeLayout(table, chairCount);
      return { tableShape: { type: "segments", segments, w, h }, chairs, groupBounds: symmetricBounds(w + 1.7, h + 1.7) };
    }
    case "dshape": {
      const { outline, chairs, pin } = dShapeLayout(room, table, chairCount);
      const box = polygonBox(outline);
      return { tableShape: { type: "polygon", points: outline }, chairs, groupBounds: { ...contentBounds(chairs, [box]), pin } };
    }
    case "frontrow": {
      const { outline, chairs } = frontRowLayout(table, chairCount);
      return { tableShape: { type: "polygon", points: outline }, chairs, groupBounds: contentBounds(chairs, [polygonBox(outline)]) };
    }
    case "classroom": {
      const { chairs, desks } = classroomLayout(room, classroomDeskDepth(table), chairCount, density);
      return { tableShape: { type: "desks", desks }, chairs, groupBounds: contentBounds(chairs, desks) };
    }
    case "theater": {
      const { chairs } = theaterLayout(room, chairCount, density);
      return { tableShape: { type: "none" }, chairs, groupBounds: contentBounds(chairs) };
    }
    case "collaboration": {
      const { chairs, tables } = collaborationLayout(room, chairCount, podOverrides, density);
      return { tableShape: { type: "pods", tables }, chairs, groupBounds: contentBounds(chairs, [], tables) };
    }
    case "rectangular":
    default: {
      const chairs = rectPerimeterPositions(boxW, boxH, chairCount, 0.4, CORNER_GAP, table.screenEndFree ? rectScreenEdge(table) : null);
      return { tableShape: { type: "rect", w: boxW, h: boxH }, chairs, groupBounds: symmetricBounds(boxW + 1.7, boxH + 1.7) };
    }
  }
}

// Keeps the whole group inside the walls. On an axis where the group is bigger than
// the room it can't move at all, and stays where it was generated (offset 0).
// Keeps the table group inside the room. A group pinned on an axis (the D-shape, held
// against its wall) can't move along that axis at all.
export function clampTableOffset(offset, room, groupBounds) {
  const axis = (value, half, min, max) => {
    const lo = -half - min;
    const hi = half - max;
    return lo > hi ? 0 : clamp(value, lo, hi);
  };
  return {
    x: groupBounds.pin === "x" ? 0 : axis(offset.x, room.length / 2, groupBounds.minX, groupBounds.maxX),
    y: groupBounds.pin === "y" ? 0 : axis(offset.y, room.width / 2, groupBounds.minY, groupBounds.maxY),
  };
}

// --- device placement --------------------------------------------------------------

export function snapToNearestEdge(x, y, room) {
  const d = { top: y, bottom: room.width - y, left: x, right: room.length - x };
  const edge = Object.entries(d).sort((a, b) => a[1] - b[1])[0][0];
  const clampedX = clamp(x, 0.3, room.length - 0.3);
  const clampedY = clamp(y, 0.3, room.width - 0.3);
  let nx = x, ny = y, angle = 0;
  switch (edge) {
    case "top": ny = 0; nx = clampedX; angle = 180; break;
    case "bottom": ny = room.width; nx = clampedX; angle = 0; break;
    case "left": nx = 0; ny = clampedY; angle = 90; break;
    default: nx = room.length; ny = clampedY; angle = 270; break;
  }
  return { x: nx, y: ny, angle, edge };
}

export function resolvePlacement(category, x, y, room) {
  if (category === "door" || category === "bookingPanel") {
    const e = snapToNearestEdge(x, y, room);
    return { x: e.x, y: e.y, angle: e.angle, edge: e.edge, mount: "wall" };
  }
  if (category === "display" || category === "allInOne" || category === "touchPanel") {
    const distToEdge = Math.min(x, room.length - x, y, room.width - y);
    if (distToEdge < WALL_SNAP_DISTANCE) {
      const e = snapToNearestEdge(x, y, room);
      return { x: e.x, y: e.y, angle: e.angle, mount: "wall" };
    }
    const g = nearestGridPoint(x, y, room);
    return { x: g.x, y: g.y, angle: 0, mount: category === "touchPanel" ? "table" : "free" };
  }
  const g = nearestGridPoint(x, y, room);
  return { x: g.x, y: g.y, angle: 0 };
}

export function cameraFacingToward(camAbs, targetAbs) {
  return faceCenterAngle(camAbs.x - targetAbs.x, camAbs.y - targetAbs.y);
}

const WALL_ANGLE = { top: 180, bottom: 0, left: 90, right: 270 };

export function nearestEdge(x, y, room) {
  const d = { top: y, bottom: room.width - y, left: x, right: room.length - x };
  return Object.entries(d).sort((a, b) => a[1] - b[1])[0][0];
}

// The wall everyone faces: row seating (classroom/theater) and the Open Collaboration
// grid face the top wall; a boardroom table faces its short end, so in landscape
// (table running along the room's length) that's the left wall — also where a
// landscape U-shape's open end points.
export function frontWall(layout, table) {
  // Front row: the row runs along the table, so a landscape table faces the top wall.
  if (layout === "frontrow") return table.orientation === 0 ? "top" : "left";
  const tableLayout = layout === "rectangular" || layout === "oval" || layout === "ushape" || layout === "dshape";
  return tableLayout && table.orientation === 0 ? "left" : "top";
}

// Display sizing per the "4/6/8 rule" used across AVIXA-aligned design guides: for
// general meeting-room content (presentations, shared documents) the farthest viewer
// should sit no more than 6x the screen's image height away. Viewing distance is the
// room's depth from the display's wall, less ~0.8m of clearance behind the last seat.
export const FARTHEST_VIEWER_TO_IMAGE_HEIGHT = 6;
const MIN_RECOMMENDED_DISPLAY = 50;

// The smallest screen (of the given shape) whose picture is tall enough for the
// farthest viewer; the biggest on offer when none quite is.
function smallestFitting(sizes, room, wall, aspect) {
  const depth = wall === "left" || wall === "right" ? room.length : wall === "top" || wall === "bottom" ? room.width : Math.max(room.length, room.width);
  const viewingDistance = Math.max(depth - 0.8, 1);
  const neededHeight = viewingDistance / FARTHEST_VIEWER_TO_IMAGE_HEIGHT;
  return sizes.find((s) => displayImageHeight(s, aspect) >= neededHeight - 1e-9) ?? sizes[sizes.length - 1];
}

export function recommendedDisplaySize(room, wall, aspect = "16:9") {
  const sizes = aspect === ULTRAWIDE ? ULTRAWIDE_DISPLAY_SIZES : DISPLAY_SIZES.filter((s) => s >= MIN_RECOMMENDED_DISPLAY);
  return smallestFitting(sizes, room, wall, aspect);
}

// The same, from the sizes all-in-one displays come in.
export function recommendedAllInOneSize(room, wall) {
  return smallestFitting(ALL_IN_ONE_SIZES, room, wall, "16:9");
}

// The wall a placed display actually hangs on (a free-standing one has none).
export function displayWall(item, room) {
  return item.mount === "wall" ? nearestEdge(item.x, item.y, room) : null;
}

// Centered on the front wall — or, for a D-shape, on the wall right above its flat end,
// following it as it slides along the wall.
function defaultDisplayPlacement(room, layout, table, tableOffset = { x: 0, y: 0 }) {
  const wall = frontWall(layout, table);
  const along = layout === "dshape" ? tableOffset : { x: 0, y: 0 };
  const x = wall === "left" ? 0 : room.length / 2 + along.x;
  const y = wall === "left" ? room.width / 2 + along.y : 0;
  return { x, y, angle: WALL_ANGLE[wall], mount: "wall" };
}

// Back wall, near the right-hand corner — away from the display on either front wall.
function defaultDoorPlacement(room) {
  return { x: clamp(room.length - 0.8, 0.5, room.length), y: room.width, angle: WALL_ANGLE.bottom, edge: "bottom" };
}

// Every new configuration starts with a display sized for the room and a door. Both
// are flagged autoPlace so they follow the room/layout until someone moves them by
// hand; the display is also flagged autoSize so its size keeps tracking the
// recommendation for whichever wall it ends up on.
export function buildDefaultDevices(room, layout, table) {
  const display = { id: uid("display"), ...defaultDisplayPlacement(room, layout, table), autoPlace: true, autoSize: true };
  display.sizeInches = recommendedDisplaySize(room, displayWall(display, room));
  const door = { id: uid("door"), ...defaultDoorPlacement(room), autoPlace: true };
  return {
    display: [display],
    allInOne: [],
    camera: [],
    videoBar: [],
    microphone: [],
    speaker: [],
    touchPanel: [],
    contentSharing: [],
    door: [door],
    bookingPanel: [],
  };
}

// --- automatic placement --------------------------------------------------------------

const INWARD = { top: { x: 0, y: 1 }, bottom: { x: 0, y: -1 }, left: { x: 1, y: 0 }, right: { x: -1, y: 0 } };
const OPPOSITE_WALL = { top: "bottom", bottom: "top", left: "right", right: "left" };
const ALONG_WALL = { top: { x: 1, y: 0 }, bottom: { x: 1, y: 0 }, left: { x: 0, y: 1 }, right: { x: 0, y: 1 } };

// A point `inset` meters into the room from `wall`, `offset` meters along it from its
// middle.
function wallPoint(wall, room, offset = 0, inset = 0) {
  const mid = {
    top: { x: room.length / 2, y: 0 },
    bottom: { x: room.length / 2, y: room.width },
    left: { x: 0, y: room.width / 2 },
    right: { x: room.length, y: room.width / 2 },
  }[wall];
  return { x: mid.x + ALONG_WALL[wall].x * offset + INWARD[wall].x * inset, y: mid.y + ALONG_WALL[wall].y * offset + INWARD[wall].y * inset };
}

// 0, +step, -step, +2·step, -2·step, … — spots fanning out from a preferred one.
const fanOffsets = (step, count = 9) => Array.from({ length: count }, (_, i) => (i === 0 ? 0 : Math.ceil(i / 2) * step * (i % 2 ? 1 : -1)));

// Which already-placed devices a new one has to keep clear of: things that share the
// same kind of spot (the front wall, the table top, the doorway wall).
const PLACEMENT_NEIGHBOURS = {
  display: ["display", "allInOne"],
  allInOne: ["display", "allInOne"],
  camera: ["camera", "videoBar"],
  videoBar: ["camera", "videoBar"],
  tableCamera: ["camera", "touchPanel", "contentSharing"],
  touchPanel: ["camera", "touchPanel", "contentSharing", "bookingPanel", "microphone"],
  contentSharing: ["camera", "touchPanel", "contentSharing", "microphone"],
  door: ["door", "bookingPanel"],
  bookingPanel: ["door", "bookingPanel", "touchPanel"],
};

// Where a newly added device goes, so it can be dropped straight onto the plan rather
// than placed by hand — it can be dragged anywhere afterwards. Each kind has a sensible
// home: screens centered on the front wall, a front camera or video bar just in front
// of them, a 360° camera in the middle of the table, a touch panel at the front end of
// the table, a booking panel on the wall beside the door. Candidate spots fan out from
// that home until one is clear of similar devices already there. Returns a raw point
// (plus an `angle` when the aim was chosen for coverage); the caller snaps it with
// resolvePlacement.
export function autoPlacement(category, { room, layout, table, tableOffset, devices, seats }, payload = {}) {
  const front = frontWall(layout, table);
  const groupCenter = { x: room.length / 2 + (tableOffset?.x || 0), y: room.width / 2 + (tableOffset?.y || 0) };
  const surface = tableSurface(layout, room, table);
  const tableCenter = { x: groupCenter.x + surface.center.x, y: groupCenter.y + surface.center.y };
  const hasTableTop = TABLE_SIZED_LAYOUTS.includes(layout);
  const boxW = surface.w;
  const boxH = surface.h;
  // Spots along the middle of a curved front-row table, from its center outward.
  const alongCurve = () => {
    const pts = surface.centerline(15).map((p) => ({ x: groupCenter.x + p.x, y: groupCenter.y + p.y }));
    return pts.map((p, i) => ({ p, d: Math.abs(i - 7) })).sort((a, b) => a.d - b.d).map((e) => e.p);
  };
  const inRoom = (p) => ({ x: clamp(p.x, 0, room.length), y: clamp(p.y, 0, room.width) });
  // How far along the front wall to go to clear the widest screen on it.
  const besideScreens = Math.max(1.2, ...screensOf(devices).map((d) => displayWidthMeters(d.sizeInches, d.aspect) / 2 + 0.4));

  const family = category === "camera" && payload.isTableCam ? "tableCamera" : category;
  const neighbours = (PLACEMENT_NEIGHBOURS[family] || [category]).flatMap((c) => devices[c] || []);
  const minGap = family === "door" ? 1.1 : 0.5;
  const clear = (p) => neighbours.every((d) => Math.hypot(d.x - p.x, d.y - p.y) >= minGap);
  // The first candidate clear of its neighbours; if none is, the roomiest one.
  const spaceAround = (p) => Math.min(Infinity, ...neighbours.map((d) => Math.hypot(d.x - p.x, d.y - p.y)));
  const firstClear = (candidates, isClear = clear) => {
    const pts = candidates.map(inRoom);
    return pts.find(isClear) || pts.reduce((best, p) => (spaceAround(p) > spaceAround(best) ? p : best), pts[0]);
  };
  // Table-top devices only consider spots on the table surface itself, across its width
  // as well as along it.
  const onTable = (p) => surface.contains({ x: p.x - groupCenter.x, y: p.y - groupCenter.y }, 0.15);
  const across = (p, d) => (boxW >= boxH ? { x: p.x, y: p.y + d } : { x: p.x + d, y: p.y });
  const firstClearOnTable = (candidates) => {
    const spread = candidates.flatMap((p) => [p, across(p, 0.3), across(p, -0.3)]).filter(onTable);
    return firstClear(spread.length ? spread : candidates);
  };

  // Middle of whatever people sit around: the table, or the seats themselves.
  const seatingCenter = () => {
    if (hasTableTop || !seats?.length) return tableCenter;
    const xs = seats.map((s) => s.x);
    const ys = seats.map((s) => s.y);
    return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  };
  // Along the table's long axis from its center, e.g. to space out table-top items.
  const alongTable = (center, d) => (boxW >= boxH ? { x: center.x + d, y: center.y } : { x: center.x, y: center.y + d });
  // Toward the front wall from the table's center, stopping `margin` short of its edge.
  const towardFront = (margin, end = "front") => {
    const half = front === "left" || front === "right" ? boxW / 2 : boxH / 2;
    const dir = INWARD[end === "front" ? front : OPPOSITE_WALL[front]];
    return { x: tableCenter.x - dir.x * (half - margin), y: tableCenter.y - dir.y * (half - margin) };
  };

  switch (family) {
    case "display":
    case "allInOne": {
      // Along the front wall only where the whole screen fits; failing that, on a side
      // wall close to the front.
      const half = displayWidthMeters(payload.sizeInches || 65, payload.aspect) / 2;
      const wallLen = (wall) => (wall === "top" || wall === "bottom" ? room.length : room.width);
      const fits = (wall, o) => Math.abs(o) + half <= wallLen(wall) / 2 - 0.1;
      // Screens keep a 20cm gap edge to edge, whatever their sizes.
      const clearOfScreens = (p) =>
        screensOf(devices).every((d) => Math.hypot(d.x - p.x, d.y - p.y) >= half + displayWidthMeters(d.sizeInches, d.aspect) / 2 + 0.2);
      const onFront = fanOffsets(0.25, 41).filter((o) => fits(front, o)).map((o) => wallPoint(front, room, o));
      const sides = front === "left" || front === "right" ? ["top", "bottom"] : ["left", "right"];
      // Side-wall offsets run from its middle toward the front corner.
      const towardFrontCorner = front === "left" || front === "top" ? -1 : 1;
      const onSides = sides.flatMap((wall) => {
        const o = towardFrontCorner * (wallLen(wall) / 2 - half - 0.6);
        return fits(wall, o) ? [wallPoint(wall, room, o)] : [];
      });
      return firstClear([...onFront, ...onSides, wallPoint(front, room, 0)], clearOfScreens);
    }
    case "camera":
    case "videoBar": {
      // The first camera system goes with the screens. Any after that (an all-in-one
      // display has one built in) goes wherever it sees the most people the others
      // miss, face-on — typically the far wall, facing the seats whose backs are to the
      // screen.
      if (devices.camera.length || devices.videoBar.length || devices.allInOne.length) {
        const spot = bestCoveragePlacement(payload.fov || 90, { room, devices, seats: seats || [] }, clear);
        if (spot) return spot;
      }
      // Mounted on top of the main display, the way a front camera or video bar is
      // installed: at the same spot on the wall, so it moves with the display (see
      // `mountedOn`). With no display on the front wall, centered on that wall.
      const display = devices.display.find((d) => d.mount === "wall" && nearestEdge(d.x, d.y, room) === front);
      const displayTaken = display && [...devices.camera, ...devices.videoBar].some((c) => c.mountedOn === display.id);
      if (display && !displayTaken) return { x: display.x, y: display.y, onScreen: display.id };
      // A further camera, when the first already sees everyone: a side view from near
      // the front of a side wall, as larger rooms and boardrooms use.
      if (displayTaken) {
        const sides = front === "left" || front === "right" ? ["top", "bottom"] : ["left", "right"];
        const towardFrontCorner = front === "left" || front === "top" ? -1 : 1;
        const wallLen = (wall) => (wall === "top" || wall === "bottom" ? room.length : room.width);
        return firstClear(sides.map((wall) => wallPoint(wall, room, towardFrontCorner * (wallLen(wall) / 2 - 1.2), GRID_STEP)));
      }
      return firstClear(fanOffsets(0.7).map((o) => wallPoint(front, room, o, GRID_STEP)));
    }
    case "tableCamera": {
      if (surface.centerline) return firstClearOnTable(alongCurve());
      const c = seatingCenter();
      return firstClear(fanOffsets(1.5).map((o) => alongTable(c, o)));
    }
    case "touchPanel": {
      // On the table at the end nearest the screen (the closed end, for a U-shape);
      // wall-mounted by the front wall where there's no table to put it on.
      if (!hasTableTop) return firstClear(fanOffsets(0.6).map((o) => wallPoint(front, room, -besideScreens + o)));
      if (surface.centerline) return firstClearOnTable(alongCurve());
      const home = towardFront(0.35, layout === "ushape" ? "back" : "front");
      return firstClearOnTable(fanOffsets(0.5).map((o) => (front === "left" || front === "right" ? { x: home.x, y: home.y + o } : { x: home.x + o, y: home.y })));
    }
    case "contentSharing": {
      if (!hasTableTop) return firstClear(fanOffsets(0.6).map((o) => wallPoint(front, room, besideScreens + o, 0.5)));
      if (surface.centerline) return firstClearOnTable(alongCurve());
      const home = towardFront(0.9, layout === "ushape" ? "back" : "front");
      return firstClearOnTable(fanOffsets(0.5, 13).map((o) => alongTable(home, o)));
    }
    case "door": {
      const back = OPPOSITE_WALL[front];
      const sides = front === "left" || front === "right" ? ["top", "bottom"] : ["left", "right"];
      const half = (wall) => ((wall === "top" || wall === "bottom" ? room.length : room.width) / 2) - 0.8;
      return firstClear([
        { x: clamp(room.length - 0.8, 0.5, room.length), y: room.width },
        wallPoint(back, room, half(back)),
        wallPoint(back, room, -half(back)),
        wallPoint(sides[0], room, half(sides[0])),
        wallPoint(sides[1], room, half(sides[1])),
        wallPoint(back, room, 0),
      ]);
    }
    case "bookingPanel": {
      // On the wall just beside the door, where people see it before walking in.
      const door = devices.door[devices.door.length - 1];
      if (!door) return firstClear(fanOffsets(0.6).map((o) => wallPoint(OPPOSITE_WALL[front], room, o)));
      const wall = door.edge || nearestEdge(door.x, door.y, room);
      const along = ALONG_WALL[wall];
      // Only spots that stay clear of the corners, so one beside a door near a corner
      // goes on the door's other side rather than being pushed back onto the door.
      const onWall = (p) => (along.x ? p.x >= 0.3 && p.x <= room.length - 0.3 : p.y >= 0.3 && p.y <= room.width - 0.3);
      const spots = fanOffsets(0.75, 5).slice(1).map((o) => ({ x: door.x + along.x * o, y: door.y + along.y * o }));
      return firstClear(spots.filter(onWall).length ? spots.filter(onWall) : spots);
    }
    default:
      return inRoom(tableCenter);
  }
}

// The chairs actually in the room, in room coordinates and with the way each faces:
// the generated seats less any removed, plus any moved or turned by hand.
export function placedSeats(chairs, room, tableOffset = { x: 0, y: 0 }, removedIndices = new Set(), chairOffsets = {}) {
  const cx = room.length / 2 + tableOffset.x;
  const cy = room.width / 2 + tableOffset.y;
  return chairs.flatMap((c, i) => {
    if (removedIndices.has(i)) return [];
    const o = chairOffsets[i] || {};
    return [{ x: cx + c.x + (o.dx || 0), y: cy + c.y + (o.dy || 0), angle: o.angle ?? c.angle ?? 0 }];
  });
}

// A new device of `category`, dropped at its automatic spot (see autoPlacement) and
// set up for its kind: a screen's size and mount, a camera's lens and aim, a door's wall.
// `ctx` is { room, layout, table, tableOffset, devices, seats }.
export function createPlacedDevice(category, ctx, payload = {}) {
  const { room, layout, table, tableOffset } = ctx;
  const raw = autoPlacement(category, ctx, payload);
  // A camera or video bar on top of a display takes the display's exact spot.
  const resolved = raw.onScreen ? { x: raw.x, y: raw.y } : resolvePlacement(category, raw.x, raw.y, room);
  let item = { id: uid(category), x: resolved.x, y: resolved.y, angle: resolved.angle ?? 0 };
  if (category === "display") item = { ...item, sizeInches: payload.sizeInches, aspect: payload.aspect, mount: resolved.mount };
  if (category === "allInOne") item = { ...item, sizeInches: payload.sizeInches, micReach: payload.micReach, fov: ALL_IN_ONE_FOV, mount: resolved.mount };
  if (category === "touchPanel") item = { ...item, mount: resolved.mount };
  if (category === "door") item = { ...item, edge: resolved.edge };
  // Booking panels come wireless (a ROOMZ room display) or wired (a generic panel fed
  // by a cable from the ceiling).
  if (category === "bookingPanel") item = { ...item, edge: resolved.edge, wired: !!payload.wired };
  if (category === "camera" || category === "videoBar") {
    const tableCenter = tableCenterPoint(layout, room, table, tableOffset);
    // Aimed for coverage when it was placed to fill a gap; otherwise at the table.
    const angle = payload.isTableCam ? 0 : raw.angle ?? cameraFacingToward({ x: resolved.x, y: resolved.y }, tableCenter);
    item = { ...item, fov: payload.fov, isTableCam: !!payload.isTableCam, angle, ...(raw.onScreen && { mountedOn: raw.onScreen }) };
  }
  return item;
}

// Cameras and video bars mounted on a display (`mountedOn`) moved to where it now is,
// still aimed at the table. Called after the display itself is moved.
export function followMountedCameras(devices, display, { room, layout, table, tableOffset }) {
  const tableCenter = tableCenterPoint(layout, room, table, tableOffset);
  const follow = (item) =>
    item.mountedOn === display.id
      ? { ...item, x: display.x, y: display.y, angle: cameraFacingToward(display, tableCenter), autoPlace: false }
      : item;
  return { ...devices, camera: devices.camera.map(follow), videoBar: devices.videoBar.map(follow) };
}

// A door on the back wall that follows the room's size until someone moves it: every
// plan starts with one, so there's always an entrance to plan cable runs and
// clearances around.
export function createDefaultDoor(room) {
  return { id: uid("door"), ...defaultDoorPlacement(room), autoPlace: true };
}

// Adds `count` microphones or speakers as an evenly spread set. Any of that kind still
// where the last set put them are spread again together with the new ones, so the whole
// set stays even; ones someone has dragged stay put.
export function addSpreadDevices(devices, category, count, spreadCtx) {
  const list = devices[category];
  const autoCount = list.filter((item) => item.autoSpread).length;
  const pts = spreadDevicePositions(category, autoCount + count, spreadCtx);
  let slot = 0;
  const respread = list.map((item) => (item.autoSpread ? { ...item, ...pts[slot++] } : item));
  const added = pts.slice(slot).map((p) => ({ id: uid(category), x: p.x, y: p.y, angle: 0, autoSpread: true }));
  return { ...devices, [category]: [...respread, ...added] };
}

const sameFields = (a, b) => Object.keys(b).every((k) => a[k] === b[k]);

// Re-derives the position/size of any auto-managed display or door after the room,
// layout, or table orientation changes. Returns the same object when nothing moved.
export function refreshAutoDevices(devices, room, layout, table, tableOffset) {
  let changed = false;
  const update = (item, patch) => {
    if (sameFields(item, patch)) return item;
    changed = true;
    return { ...item, ...patch };
  };
  // A front-row room's own screen is ultra-wide; everywhere else it's 16:9.
  const aspect = layout === "frontrow" ? ULTRAWIDE : undefined;
  const display = devices.display.map((d) => {
    let next = d.autoPlace ? update(d, defaultDisplayPlacement(room, layout, table, tableOffset)) : d;
    if (next.autoSize) next = update(next, { aspect, sizeInches: recommendedDisplaySize(room, displayWall(next, room), aspect) });
    return next;
  });
  const door = devices.door.map((d) => (d.autoPlace ? update(d, defaultDoorPlacement(room)) : d));
  return changed ? { ...devices, display, door } : devices;
}

// --- 360° cameras ---------------------------------------------------------------------

// A 360° camera sits in the middle of the table and films everyone around it. Several
// brands make one, so it's named generically. It has microphones built in (an average
// pickup reach is used for planning) but no speaker, and it only works paired with a
// video bar at the display — which is also where the room's sound comes from.
export const TABLE_CAM_LABEL = "360° camera";
export const TABLE_CAM_MIC_RANGE_M = 3;

// How many seats (room coordinates, from `state.seats`) the built-in microphones of
// 360° cameras (~3 m around them) and all-in-one displays (each its own reach) pick up.
export function builtInMicCoverage(state) {
  const cams = state.devices.camera.filter((c) => c.isTableCam);
  const allInOnes = state.devices.allInOne || [];
  const pickups = [
    ...cams.map((c) => ({ x: c.x, y: c.y, reach: TABLE_CAM_MIC_RANGE_M })),
    ...allInOnes.map((d) => ({ x: d.x, y: d.y, reach: d.micReach ?? typicalAllInOneMicReach(d.sizeInches) })),
  ];
  const seats = state.seats || [];
  return {
    cams: cams.length,
    allInOnes: allInOnes.length,
    sources: pickups.length,
    seats: seats.length,
    micCovered: seats.filter((s) => pickups.some((p) => Math.hypot(s.x - p.x, s.y - p.y) <= p.reach)).length,
  };
}

// --- dedicated microphone pickup ------------------------------------------------------

// How far dedicated microphones pick up a talker: a ceiling array about 5 m (straight
// line, from the ceiling down to a seated head), a table microphone about 5 ft.
export const CEILING_MIC_RANGE_M = 5;
export const TABLE_MIC_RANGE_M = 1.524; // 5 ft
export const CEILING_MIC_AUDIO = AUDIO_PREFERENCES[0];
const SEATED_HEAD_M = 1.2;

// Whether the room's microphones hang from the ceiling or sit on the table (table
// pods and wireless boundary mics both do; so does an audio setup not yet chosen).
export const micMount = (audioPreference) => (audioPreference === CEILING_MIC_AUDIO ? "ceiling" : "table");

// A dedicated microphone's pickup as a radius across the floor plan. A ceiling array's
// 5 m is measured on the slant down to people's heads, so a higher ceiling reaches a
// little less far across the room.
export function dedicatedMicReach(audioPreference, room) {
  if (micMount(audioPreference) === "table") return TABLE_MIC_RANGE_M;
  const drop = Math.max(0, (room?.height ?? 2.8) - SEATED_HEAD_M);
  return Math.sqrt(Math.max(0, CEILING_MIC_RANGE_M ** 2 - drop ** 2));
}

// How the pickup is described: "~5 m" for ceiling arrays, "~1.5 m (5 ft)" for table mics.
export const micRangeLabel = (audioPreference) => (micMount(audioPreference) === "ceiling" ? `~${CEILING_MIC_RANGE_M} m` : "~1.5 m (5 ft)");

// The built-in mic pickups in the room: 360° cameras and all-in-one displays.
export const builtInPickups = (devices) => [
  ...devices.camera.filter((c) => c.isTableCam).map((c) => ({ x: c.x, y: c.y, reach: TABLE_CAM_MIC_RANGE_M })),
  ...(devices.allInOne || []).map((d) => ({ x: d.x, y: d.y, reach: d.micReach ?? typicalAllInOneMicReach(d.sizeInches) })),
];

// Every microphone pickup in the room: the built-in ones, and each dedicated
// microphone at its mount's reach.
function micPickups(state) {
  const reach = dedicatedMicReach(state.audioPreference, state.room);
  return [...builtInPickups(state.devices), ...state.devices.microphone.map((m) => ({ x: m.x, y: m.y, reach }))];
}
const heardBy = (seat, pickups) => pickups.some((p) => Math.hypot(seat.x - p.x, seat.y - p.y) <= p.reach + 1e-6);

// Seats no microphone picks up — dedicated or built in.
export function micCoverage(state) {
  const seats = state.seats || [];
  const pickups = micPickups(state);
  const unheard = seats.filter((s) => !heardBy(s, pickups));
  return { seats: seats.length, dedicated: state.devices.microphone.length, heard: seats.length - unheard.length, unheard, reach: dedicatedMicReach(state.audioPreference, state.room) };
}

// The fewest dedicated microphones, laid out the way a set is spread (see
// spreadDevicePositions), that pick up every seat the built-in mics (`builtIn`
// pickups) don't. 0 when those already cover everyone.
export function micsToCover({ layout, room, table, tableOffset, seats, seatArea, audioPreference, builtIn = [], max = 24 }) {
  const reach = dedicatedMicReach(audioPreference, room);
  const need = (seats || []).filter((s) => !heardBy(s, builtIn));
  if (!need.length) return 0;
  for (let n = 1; n <= max; n++) {
    const pts = spreadDevicePositions("microphone", n, { layout, room, table, tableOffset, seats: seatArea });
    if (need.every((s) => pts.some((p) => Math.hypot(s.x - p.x, s.y - p.y) <= reach + 1e-6))) return n;
  }
  return max;
}

// --- camera coverage ---------------------------------------------------------------

// A camera sees someone properly when their seat is inside its field of view and
// they're turned toward it — within this many degrees of the way they face — so it
// gets their face rather than the back of their head.
export const FACE_VISIBLE_DEG = 90;

const angleGap = (a, b) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);

// Every camera system in the room: front cameras, 360° cameras, video bars and the
// cameras built into all-in-one displays.
export const cameraSystems = (devices) => [
  ...devices.camera.map((c) => ({ x: c.x, y: c.y, angle: c.angle || 0, fov: c.isTableCam ? 360 : c.fov })),
  ...devices.videoBar.map((v) => ({ x: v.x, y: v.y, angle: v.angle || 0, fov: v.fov })),
  ...devices.allInOne.map((d) => ({ x: d.x, y: d.y, angle: d.angle || 0, fov: d.fov ?? ALL_IN_ONE_FOV })),
];

export function cameraSeesSeat(cam, seat) {
  const bearing = angleFromVector(seat.x - cam.x, seat.y - cam.y);
  if (cam.fov < 360 && angleGap(bearing, cam.angle) > cam.fov / 2 + 1e-6) return false;
  if (seat.angle == null) return true;
  return angleGap(seat.angle, (bearing + 180) % 360) <= FACE_VISIBLE_DEG;
}

// Seats (from `state.seats`, with the way each faces) that no camera system sees
// face-on — outside every field of view, or seen only from behind.
export function cameraCoverage(state) {
  const cams = cameraSystems(state.devices);
  const seats = state.seats || [];
  const unseen = seats.filter((seat) => !cams.some((cam) => cameraSeesSeat(cam, seat)));
  return { cameras: cams.length, seats: seats.length, unseen };
}

// Where an extra front camera or video bar should go so it sees the most people the
// existing cameras miss, face-on: every spot along the walls, aimed every 5°. Ties go
// to the spot that also keeps the best view of everyone else, then to the middle of a
// wall. Returns null when every seat is already covered (or there are no seats).
function bestCoveragePlacement(fov, { room, devices, seats }, isClear) {
  const unseen = cameraCoverage({ devices, seats }).unseen;
  if (!unseen.length) return null;
  const perimeter = 2 * (room.length + room.width);
  const spacing = Math.max(0.5, perimeter / 80);
  const candidates = [];
  ["top", "bottom", "left", "right"].forEach((wall) => {
    const len = wall === "top" || wall === "bottom" ? room.length : room.width;
    for (let o = -len / 2 + 0.3; o <= len / 2 - 0.3 + 1e-6; o += spacing) {
      candidates.push({ ...wallPoint(wall, room, o, GRID_STEP), offMiddle: Math.abs(o) / len });
    }
  });
  let best = null;
  candidates.forEach((p) => {
    if (!isClear(p)) return;
    for (let angle = 0; angle < 360; angle += 5) {
      const cam = { x: p.x, y: p.y, angle, fov };
      const gained = unseen.filter((seat) => cameraSeesSeat(cam, seat)).length;
      if (!gained) continue;
      const alsoSees = seats.filter((seat) => cameraSeesSeat(cam, seat)).length;
      const score = gained * 1000 + alsoSees - p.offMiddle;
      if (!best || score > best.score) best = { x: p.x, y: p.y, angle, score };
    }
  });
  return best && { x: best.x, y: best.y, angle: best.angle };
}

// Suggested quantities for the multi-add dialog: roughly one microphone per four
// seats around a table (one per ~25m² for audience seating, where most people only
// listen), and one ceiling speaker per ~15m² of floor for even coverage. With a 360°
// camera or an all-in-one display in the room, only the seats their built-in mics don't
// reach count.
//
// Given where people actually sit (`cover`: { seats, seatArea, table, tableOffset,
// builtIn }), microphones are counted by pickup range instead: the fewest that, spread
// as a set, put every seat the built-in mics miss within a ceiling array's ~5 m or a
// table mic's ~5 ft (see micsToCover).
export function recommendedDeviceCount(category, layout, room, chairCount, coverage = null, audioPreference = null, cover = null) {
  const area = room.length * room.width;
  const soundbar = audioPreference === SOUNDBAR_AUDIO;
  if (category === "microphone" && cover && !soundbar) {
    return clamp(micsToCover({ layout, room, audioPreference, ...cover }), 1, 24);
  }
  if (category === "microphone") {
    if (coverage?.sources > 0) return clamp(Math.ceil((coverage.seats - coverage.micCovered) / 4), 1, 24);
    // A soundbar picks up its first 8 people; mics cover the rest, one per four.
    if (soundbar) return clamp(Math.ceil((chairCount - SOUNDBAR_MIC_CAPACITY) / 4), 1, 24);
    const rowSeating = layout === "classroom" || layout === "theater";
    return clamp(Math.ceil(rowSeating ? area / 25 : chairCount / 4), 1, 24);
  }
  if (category === "speaker") {
    // A soundbar carries to its first 10 people; speakers cover the share of the room
    // beyond that, one per ~15m².
    if (soundbar && chairCount > 0) return clamp(Math.ceil((area * Math.max(0, chairCount - SOUNDBAR_SPEAKER_CAPACITY)) / chairCount / 15), 1, 24);
    return clamp(Math.ceil(area / 15), 1, 24);
  }
  return 1;
}

// `count` points spread evenly over a w x h rectangle (relative to its top-left): a
// rows x cols grid picked so each cell is as close to square as possible, with a
// short final row centered rather than left-aligned.
function evenGridPoints(count, w, h) {
  const safeW = Math.max(w, 0.1);
  const safeH = Math.max(h, 0.1);
  let best = null;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const emptySlots = rows * cols - count;
    const score = Math.abs(Math.log(safeW / cols / (safeH / rows))) + emptySlots * 0.5;
    if (!best || score < best.score) best = { cols, rows, score };
  }
  const pts = [];
  for (let r = 0; r < best.rows; r++) {
    const inRow = Math.min(best.cols, count - r * best.cols);
    const shift = (best.cols - inRow) / 2;
    for (let c = 0; c < inRow; c++) {
      pts.push({ x: (safeW * (c + shift + 0.5)) / best.cols, y: (safeH * (r + 0.5)) / best.rows });
    }
  }
  return pts;
}

// The rectangle (room coordinates) the chairs actually occupy, padded by half a
// seat — where microphones go for row and pod layouts.
export function seatingArea(chairs, room, tableOffset) {
  if (!chairs.length) return null;
  const cx = room.length / 2 + (tableOffset?.x || 0);
  const cy = room.width / 2 + (tableOffset?.y || 0);
  const xs = chairs.map((c) => cx + c.x);
  const ys = chairs.map((c) => cy + c.y);
  const pad = 0.3;
  const x = Math.max(0, Math.min(...xs) - pad);
  const y = Math.max(0, Math.min(...ys) - pad);
  return { x, y, w: Math.min(room.length, Math.max(...xs) + pad) - x, h: Math.min(room.width, Math.max(...ys) + pad) - y };
}

// Where a batch of microphones/speakers lands before anyone drags them: speakers
// cover the whole room evenly (ceiling speakers), microphones cover where people
// sit — on the table for a boardroom, along the U for U-shape, or over the seated
// area (`seats`, from seatingArea) for row and pod layouts. Points are snapped to
// the placement grid.
export function spreadDevicePositions(category, count, { layout, room, table, tableOffset, seats }) {
  if (count <= 0) return [];
  const center = { x: room.length / 2 + (tableOffset?.x || 0), y: room.width / 2 + (tableOffset?.y || 0) };
  let pts;
  const surface = category === "microphone" ? tableSurface(layout, room, table) : null;
  if (category === "microphone" && layout === "ushape") {
    pts = uShapeCenterlinePoints(table, count).map((p) => ({ x: center.x + p.x, y: center.y + p.y }));
  } else if (category === "microphone" && surface.centerline) {
    // Front row: along the middle of the curved table.
    pts = surface.centerline(count).map((p) => ({ x: center.x + p.x, y: center.y + p.y }));
  } else {
    let area;
    if (category === "microphone" && (layout === "rectangular" || layout === "oval" || layout === "dshape")) {
      const { box } = surface;
      area = { x: center.x + box.x, y: center.y + box.y, w: box.w, h: box.h };
    } else if (category === "microphone") {
      area = seats || { x: 0.6, y: 1.2, w: room.length - 1.2, h: room.width - 1.8 };
    } else {
      area = { x: 0, y: 0, w: room.length, h: room.width };
    }
    pts = evenGridPoints(count, area.w, area.h).map((p) => ({ x: area.x + p.x, y: area.y + p.y }));
  }
  return pts.map((p) => nearestGridPoint(p.x, p.y, room));
}

// Microphones/speakers still where their batch put them (autoSpread) are re-spread
// whenever the room, layout, or table changes, so the set stays evenly laid out
// over the new space; ones someone has dragged keep their spot. Returns the same
// object when nothing moved.
export const SPREAD_CATEGORIES = ["microphone", "speaker"];
export function respreadAutoDevices(devices, ctx) {
  let changed = false;
  const next = { ...devices };
  SPREAD_CATEGORIES.forEach((category) => {
    const list = devices[category];
    const autoCount = list.filter((item) => item.autoSpread).length;
    if (!autoCount) return;
    const pts = spreadDevicePositions(category, autoCount, ctx);
    let slot = 0;
    next[category] = list.map((item) => {
      if (!item.autoSpread) return item;
      const p = pts[slot++];
      if (p.x === item.x && p.y === item.y) return item;
      changed = true;
      return { ...item, x: p.x, y: p.y };
    });
  });
  return changed ? next : devices;
}

// --- camera field-of-view geometry --------------------------------------------------

function rayRoomIntersection(x, y, angleDeg, room) {
  const { dx, dy } = dirVector(angleDeg);
  const eps = 1e-9;
  let tMin = Infinity;
  const candidates = [];
  if (dx > eps) candidates.push((room.length - x) / dx);
  if (dx < -eps) candidates.push((0 - x) / dx);
  if (dy > eps) candidates.push((room.width - y) / dy);
  if (dy < -eps) candidates.push((0 - y) / dy);
  candidates.forEach((t) => { if (t > 0 && t < tMin) tMin = t; });
  if (!isFinite(tMin)) tMin = 0;
  return { x: x + dx * tMin, y: y + dy * tMin };
}

// The covered area is the fan of rays from the camera to the walls. Sampling rays at
// even angles alone cuts straight across any room corner that falls between two
// samples (leaving an uncovered triangle there), so the ray toward every corner
// inside the field of view is included too — that makes the polygon exact, since
// the walls are straight between corners.
export function generateFovPolygon(x, y, facingDeg, fovDeg, room, segments = 28) {
  const full = fovDeg >= 360;
  const half = full ? 180 : fovDeg / 2;
  const n = full ? segments : Math.max(6, Math.round((segments * fovDeg) / 180));
  const offsets = [];
  for (let i = 0; i <= n; i++) offsets.push(-half + (2 * half * i) / n);
  [[0, 0], [room.length, 0], [room.length, room.width], [0, room.width]].forEach(([cx, cy]) => {
    if (Math.hypot(cx - x, cy - y) < 1e-6) return;
    // Corner's bearing relative to where the camera faces, in (-180, 180].
    let rel = ((angleFromVector(cx - x, cy - y) - facingDeg) % 360 + 540) % 360 - 180;
    if (rel <= -180) rel += 360;
    if (Math.abs(rel) <= half) offsets.push(rel);
  });
  offsets.sort((a, b) => a - b);
  const pts = full ? [] : [{ x, y }];
  offsets.forEach((o) => pts.push(rayRoomIntersection(x, y, facingDeg + o, room)));
  return pts;
}

export function fovEdgeRays(x, y, facingDeg, fovDeg, room) {
  const half = fovDeg / 2;
  return [
    rayRoomIntersection(x, y, facingDeg - half, room),
    rayRoomIntersection(x, y, facingDeg + half, room),
  ];
}

// --- room classification -------------------------------------------------------------

// Layout shapes that are functionally distinct regardless of floor area get their own
// label; everything else (boardroom-style layouts) is classified by floor area.
export function classifyRoomType({ layout, room }) {
  if (layout === "classroom") return "Classroom";
  if (layout === "theater") return "Auditorium";
  if (layout === "collaboration") return "Collaboration Space";
  const area = room.length * room.width;
  if (area < 12) return "Huddle Room";
  if (area < 25) return "Small Room";
  if (area < 45) return "Medium Room";
  if (area < 80) return "Large Room";
  return "Extra-Large Room";
}

// --- recommendations ----------------------------------------------------------------

export const CONFIGURATION_COMPLETE_NOTE = "Configuration looks complete — confirm exact placements during the site survey.";

// Live recommendations for the current configuration, re-evaluated on every change so
// the configurator can show them while someone works (and the report lists them).
// `state.seats` (the chairs' room coordinates) lets a 360° camera's mics be judged per seat.
// `level` is "essential" for gaps that stop the room working as a video meeting room
// and "suggestion" for improvements; `addCategories` lists the devices whose "+"
// would resolve it, so the panel can offer a one-click add.
export function buildRecommendations(state) {
  const { room, chairCount, layout, devices } = state;
  const recs = [];
  const add = (id, level, text, addCategories = []) => recs.push({ id, level, text, addCategories });
  // An all-in-one display is a screen, a camera, microphones and speakers in one.
  const videoDevices = [...devices.camera, ...devices.videoBar, ...devices.allInOne];
  const soundSources = devices.videoBar.length + devices.allInOne.length;
  const coverage = builtInMicCoverage(state);
  const seatsWord = (n) => `${n} ${n === 1 ? "seat is" : "seats are"}`;

  if (!layout) add("no-layout", "essential", "Choose a furniture layout so the table and seating can be planned.");
  if (screensOf(devices).length === 0)
    add("no-display", "essential", "Add at least one display — none is currently placed in this room.", ["display", "allInOne"]);
  // The first screen that's too small for the room's viewing distance, if any.
  const undersized = ["display", "allInOne"]
    .flatMap((category) => devices[category].map((d, i) => ({ category, d, i })))
    .find(({ category, d }) =>
      d.sizeInches < (category === "allInOne" ? recommendedAllInOneSize(room, displayWall(d, room)) : recommendedDisplaySize(room, displayWall(d, room), d.aspect))
    );
  if (undersized) {
    const { category, d, i } = undersized;
    const better = category === "allInOne" ? recommendedAllInOneSize(room, displayWall(d, room)) : recommendedDisplaySize(room, displayWall(d, room), d.aspect);
    add(
      "display-undersized",
      "suggestion",
      `${refCode(category, i)} (${displaySpec(d)}) is below the ${displaySpec({ ...d, sizeInches: better })} recommended for this room's viewing distance — consider a larger or second display.`
    );
  }
  if (videoDevices.length === 0)
    add("no-camera", "essential", "Add a camera, video bar or all-in-one display to enable video conferencing.", ["camera", "videoBar", "allInOne"]);
  // Every seat should be seen face-on by some camera — not out of view, and not only
  // from behind (e.g. the seats at the screen end of a boardroom table).
  const unseen = videoDevices.length ? cameraCoverage(state).unseen.length : 0;
  if (unseen)
    add(
      "camera-coverage",
      "suggestion",
      `${unseen} ${unseen === 1 ? "seat isn't" : "seats aren't"} seen face-on by any camera — add another camera; it'll be placed facing ${unseen === 1 ? "that seat" : "those seats"}.`,
      ["camera"]
    );
  // A 360° camera only works paired with a video bar or an all-in-one display, and has
  // no speaker of its own — that device supplies the room's sound. So while it's
  // missing, that's the one fix to ask for (it also covers "no speaker" below).
  const tableCamWithoutBar = coverage.cams > 0 && soundSources === 0;
  if (tableCamWithoutBar)
    add(
      "table-cam-needs-bar",
      "essential",
      "A 360° camera only works paired with a video bar or all-in-one display at the front of the room — add one. It also gives the room its sound, since the camera has no speaker.",
      ["videoBar", "allInOne"]
    );
  // A soundbar (as the preferred audio setup) is the room's speaker and microphones: it
  // carries to 10 people and picks up 8, so only rooms beyond that need more.
  const soundbar = state.audioPreference === SOUNDBAR_AUDIO;
  // Video bars and all-in-one displays have speakers built in: on their own they cover
  // remote audio for a room of up to 7 seats, so a separate speaker is only suggested
  // from 8 seats up.
  if (devices.speaker.length === 0) {
    if (soundbar) {
      if (chairCount > SOUNDBAR_SPEAKER_CAPACITY)
        add(
          "soundbar-speakers",
          "suggestion",
          `A soundbar carries to about ${SOUNDBAR_SPEAKER_CAPACITY} people — add speakers so all ${chairCount} can hear remote participants clearly.`,
          ["speaker"]
        );
    } else if (soundSources === 0) {
      if (!tableCamWithoutBar)
        add("no-speaker", "essential", "Add at least one speaker so remote audio is audible throughout the room.", ["speaker"]);
    } else if (chairCount >= 8)
      add(
        "videobar-extra-speaker",
        "suggestion",
        `With 8+ seats, add a speaker alongside the ${devices.videoBar.length ? "video bar" : "all-in-one display"} so remote audio reaches the far end of the room.`,
        ["speaker"]
      );
  }
  // Built-in mics: a 360° camera picks up ~3m around itself and an all-in-one display
  // as far as its model reaches, so with either in the room dedicated microphones are
  // only suggested for the seats they don't reach — however many seats there are.
  if (devices.microphone.length === 0) {
    const outOfReach = coverage.seats - coverage.micCovered;
    if (coverage.sources) {
      const reaches = devices.allInOne.map((d) => d.micReach ?? typicalAllInOneMicReach(d.sizeInches));
      const pickup =
        coverage.cams && coverage.allInOnes
          ? "the built-in mics' pickup"
          : coverage.cams
          ? `the 360° camera's ~${TABLE_CAM_MIC_RANGE_M}m mic pickup`
          : `the all-in-one display's ~${Math.max(...reaches)}m mic pickup`;
      if (outOfReach > 0)
        add("builtin-mic-range", "suggestion", `${seatsWord(outOfReach)} beyond ${pickup} — add table or ceiling microphones to cover them.`, ["microphone"]);
    } else if (soundbar) {
      if (chairCount > SOUNDBAR_MIC_CAPACITY)
        add(
          "soundbar-microphones",
          "suggestion",
          `A soundbar picks up about ${SOUNDBAR_MIC_CAPACITY} people — add microphones so all ${chairCount} are heard.`,
          ["microphone"]
        );
    } else if (chairCount >= DEDICATED_MIC_MIN_SEATS)
      add(
        "no-microphone",
        "suggestion",
        `Rooms with ${DEDICATED_MIC_MIN_SEATS}+ seats usually need dedicated ceiling or table microphones for even pickup.`,
        ["microphone"]
      );
  }
  // Dedicated microphones in the room: every seat should be within one's pickup
  // (~5 m for a ceiling array, ~5 ft for a table mic), or a built-in mic's.
  if (devices.microphone.length > 0) {
    const mics = micCoverage(state);
    if (mics.unheard.length > 0) {
      const kind = micMount(state.audioPreference) === "ceiling" ? "ceiling microphones'" : "table microphones'";
      add(
        "mic-coverage",
        "suggestion",
        `${seatsWord(mics.unheard.length)} beyond the ${kind} ${micRangeLabel(state.audioPreference)} pickup — add microphones or move them closer to those seats.`,
        ["microphone"]
      );
    }
  }
  // Everyone should see the main display without looking past the person in front.
  const blockedSeats = seatsBlockedFromDisplay(state);
  if (blockedSeats.length) {
    const main = mainScreen(devices);
    const asDisplay = devices.display.indexOf(main);
    const code = asDisplay >= 0 ? refCode("display", asDisplay) : refCode("allInOne", devices.allInOne.indexOf(main));
    add(
      "seats-block-display",
      "suggestion",
      `${seatsWord(blockedSeats.length)} in line behind another seat for ${code} — move those chairs off the sightline, or stagger the rows.`,
      []
    );
  }
  if (devices.touchPanel.length === 0)
    add("no-touch-panel", "suggestion", "A touch panel is recommended for one-touch join and in-room control.", ["touchPanel"]);
  if (layout === "rectangular" && chairCount > 12)
    add("large-boardroom", "suggestion", "For 12+ seats, an oval table or dual displays can improve sightlines from the far end.");
  if (devices.door.length === 0)
    add("no-door", "suggestion", "No door position marked — confirm egress and cable-path clearance during the site survey.", ["door"]);
  if (devices.door.length > 0 && devices.bookingPanel.length === 0)
    add("no-booking-panel", "suggestion", "Consider a booking panel outside the door to show live room availability.", ["bookingPanel"]);
  return recs;
}

// Plain-text form for the brief and the report.
export function recommendationNotes(state) {
  const recs = buildRecommendations(state);
  return recs.length ? recs.map((r) => r.text) : [CONFIGURATION_COMPLETE_NOTE];
}
