// What each seat sees: how far it is from each screen, at what angle, whether other
// people's heads are in the way, and whether a camera sees its face. Shared by the 3D
// view's scene (so screens and heads sit where the numbers say) and its read-out.
//
// Plan coordinates throughout: x along the room's length, y along its width (down the
// plan), angles 0° = up the plan, clockwise. Heights are metres above the floor.
import {
  ALL_IN_ONE_FOV,
  FARTHEST_VIEWER_TO_IMAGE_HEIGHT,
  cameraSeesSeat,
  displayImageHeight,
  displayWidthMeters,
  refCode,
} from "./roomConfiguratorEngine";

export const HEIGHTS = {
  table: 0.74,
  chairSeat: 0.46,
  seatedEye: 1.2,
  // Centre of a seated person's head, and how big it is for blocking a view.
  head: 1.18,
  headRadius: 0.11,
  // Screens hang with their bottom edge about here, raised or lowered to fit the ceiling.
  screenBottom: 0.95,
  ceilingClearance: 0.25,
  door: 2.1,
};

// AVIXA-style viewing distance bands, in multiples of the picture's height: detailed
// content (spreadsheets, small text) within 4×, general content within 6×, passive
// viewing (video, large text) within 8×.
const DISTANCE_BANDS = [
  { max: 4, rating: "good", label: "Detailed viewing" },
  { max: FARTHEST_VIEWER_TO_IMAGE_HEIGHT, rating: "good", label: "General viewing" },
  { max: 8, rating: "fair", label: "Video and large text only" },
  { max: Infinity, rating: "poor", label: "Too far for this screen" },
];
// Looking up at the top of a screen more than this is uncomfortable for a meeting.
const MAX_UPWARD_DEG = 30;
// How far off a screen's centre line someone can sit before the picture is skewed.
const GOOD_OFF_AXIS_DEG = 45;
const MAX_OFF_AXIS_DEG = 60;

const deg = (rad) => (rad * 180) / Math.PI;
const angleGap = (a, b) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);
// Bearing (0° = up the plan, clockwise) from one plan point to another.
const bearing = (from, to) => (deg(Math.atan2(to.x - from.x, -(to.y - from.y))) + 360) % 360;
export const dirVector = (angleDeg) => {
  const r = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(r), y: -Math.cos(r) };
};

// Every screen people watch, sized and hung: displays and all-in-one displays. A
// wall-mounted one hangs flat on its wall; a free-standing one stands on its cart.
export function placedScreens(devices, room) {
  const screen = (category, d, index) => {
    const aspect = category === "allInOne" ? "16:9" : d.aspect;
    const w = displayWidthMeters(d.sizeInches, aspect);
    const h = displayImageHeight(d.sizeInches, aspect);
    const ceiling = room.height - HEIGHTS.ceilingClearance;
    const bottom = HEIGHTS.screenBottom + h > ceiling ? Math.max(0.3, ceiling - h) : HEIGHTS.screenBottom;
    // Wall screens sit just proud of the wall, so they never sink into it.
    const n = dirVector(d.angle || 0);
    const inset = d.mount === "wall" ? 0.06 : 0;
    return {
      id: d.id,
      category,
      code: refCode(category, index),
      x: d.x + n.x * inset,
      y: d.y + n.y * inset,
      angle: d.angle || 0,
      mount: d.mount,
      width: w,
      height: h,
      bottom,
      center: bottom + h / 2,
      sizeInches: d.sizeInches,
      aspect,
    };
  };
  return [...devices.display.map((d, i) => screen("display", d, i)), ...devices.allInOne.map((d, i) => screen("allInOne", d, i))];
}

// Every camera, with where it is in 3D: a camera or video bar on a screen sits on the
// side of it its `mountSide` says (plans from before that: a camera on top, a video bar
// below), one built into an all-in-one in its top bezel, a 360° camera on the table,
// anything else on its wall at head height.
export function placedCameras(devices, screens) {
  const onScreen = (item) => screens.find((s) => s.id === item.mountedOn) || screens.find((s) => Math.hypot(s.x - item.x, s.y - item.y) < 0.15);
  const onEdge = (s, item, fallback, gap) => ((item.mountSide || fallback) === "above" ? s.bottom + s.height + gap : s.bottom - gap);
  const cams = [];
  devices.camera.forEach((c, i) => {
    const s = onScreen(c);
    const z = c.isTableCam ? HEIGHTS.table + 0.25 : s ? onEdge(s, c, "above", 0.07) : 1.8;
    cams.push({ id: c.id, code: refCode("camera", i), kind: c.isTableCam ? "tableCam" : "camera", x: c.x, y: c.y, z, angle: c.angle || 0, fov: c.isTableCam ? 360 : c.fov, onScreen: !!s });
  });
  devices.videoBar.forEach((v, i) => {
    const s = onScreen(v);
    const z = s ? onEdge(s, v, "below", 0.08) : 1.0;
    cams.push({ id: v.id, code: refCode("videoBar", i), kind: "videoBar", x: v.x, y: v.y, z, angle: v.angle || 0, fov: v.fov, onScreen: !!s });
  });
  devices.allInOne.forEach((d, i) => {
    const s = screens.find((x) => x.id === d.id);
    cams.push({ id: d.id, code: refCode("allInOne", i), kind: "allInOne", x: d.x, y: d.y, z: s ? s.bottom + s.height + 0.05 : 1.6, angle: d.angle || 0, fov: d.fov ?? ALL_IN_ONE_FOV, onScreen: true });
  });
  return cams;
}

// Distance from point p to the segment a→b (all 3D, {x, y, z} with z up).
function segmentDistance(p, a, b) {
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
  const len2 = ab.x * ab.x + ab.y * ab.y + ab.z * ab.z || 1;
  const t = Math.max(0, Math.min(1, (ap.x * ab.x + ap.y * ab.y + ap.z * ab.z) / len2));
  return Math.hypot(ap.x - ab.x * t, ap.y - ab.y * t, ap.z - ab.z * t);
}

// Points spread over a screen's picture, for judging how much of it a head hides.
function screenSamples(s) {
  const along = dirVector((s.angle + 90) % 360);
  const pts = [];
  for (const u of [-0.4, 0, 0.4]) {
    for (const v of [0.2, 0.5, 0.8]) {
      pts.push({ x: s.x + along.x * u * s.width, y: s.y + along.y * u * s.width, z: s.bottom + v * s.height });
    }
  }
  return pts;
}

const worst = (...ratings) => (ratings.includes("poor") ? "poor" : ratings.includes("fair") ? "fair" : "good");

// One seat's view of one screen.
function viewOfScreen(seat, seatIndex, screen, heads) {
  const eye = { x: seat.x, y: seat.y, z: HEIGHTS.seatedEye };
  const distance = Math.hypot(screen.x - seat.x, screen.y - seat.y);
  const multiple = distance / screen.height;
  const band = DISTANCE_BANDS.find((b) => multiple <= b.max);
  // Off the screen's centre line, seen from the screen (a free-standing screen faces
  // the way it's turned too).
  const offAxis = angleGap(screen.angle, bearing(screen, seat));
  const behind = offAxis > 90;
  const upward = deg(Math.atan2(screen.bottom + screen.height - eye.z, Math.max(distance, 0.1)));
  // How far someone turns from the way their chair faces to look at it.
  const turn = angleGap(seat.angle, bearing(seat, screen));

  const samples = screenSamples(screen);
  const blockers = new Map();
  let hidden = 0;
  samples.forEach((p) => {
    let blocked = false;
    heads.forEach((h) => {
      if (h.index === seatIndex) return;
      // Only heads between this seat and the screen can get in the way.
      if (segmentDistance(h, eye, p) < HEIGHTS.headRadius) {
        blocked = true;
        blockers.set(h.index, true);
      }
    });
    if (blocked) hidden++;
  });
  const blockedShare = hidden / samples.length;

  const ratings = {
    distance: band.rating,
    angle: behind ? "poor" : offAxis > MAX_OFF_AXIS_DEG ? "poor" : offAxis > GOOD_OFF_AXIS_DEG ? "fair" : "good",
    upward: upward > MAX_UPWARD_DEG + 10 ? "poor" : upward > MAX_UPWARD_DEG ? "fair" : "good",
    turn: turn > 110 ? "poor" : turn > 60 ? "fair" : "good",
    sightline: blockedShare > 0.34 ? "poor" : blockedShare > 0 ? "fair" : "good",
  };
  return {
    screen,
    distance,
    multiple,
    distanceLabel: band.label,
    offAxis,
    upward,
    turn,
    blockedShare,
    blockedBy: [...blockers.keys()],
    ratings,
    rating: worst(...Object.values(ratings)),
  };
}

const RATING_SCORE = { good: 0, fair: 1, poor: 2 };

// A seat's whole experience: every screen as seen from it (the one it's best placed to
// watch first), and which cameras see its face.
export function seatExperience(seatIndex, { seats, screens, cameras }) {
  const seat = seats[seatIndex];
  if (!seat) return null;
  const heads = seats.map((s, index) => ({ index, x: s.x, y: s.y, z: HEIGHTS.head }));
  const views = screens
    .map((s) => viewOfScreen(seat, seatIndex, s, heads))
    .sort((a, b) => RATING_SCORE[a.rating] - RATING_SCORE[b.rating] || a.distance - b.distance);
  const seenBy = cameras.filter((c) => cameraSeesSeat({ x: c.x, y: c.y, angle: c.angle, fov: c.fov }, seat));
  return {
    seat,
    index: seatIndex,
    views,
    best: views[0] || null,
    seenBy,
    cameraRating: cameras.length ? (seenBy.length ? "good" : "poor") : null,
  };
}

// The room at a glance: how many seats have a good, fair or poor view of their best
// screen, and how many no camera sees.
export function roomSightlineSummary(ctx) {
  const counts = { good: 0, fair: 0, poor: 0, unseen: 0 };
  ctx.seats.forEach((_, i) => {
    const e = seatExperience(i, ctx);
    if (e.best) counts[e.best.rating]++;
    if (e.cameraRating === "poor") counts.unseen++;
  });
  return counts;
}
