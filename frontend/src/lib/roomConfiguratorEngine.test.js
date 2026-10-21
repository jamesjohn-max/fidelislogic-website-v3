import {
  autoPlacement,
  defaultTableSize,
  SOUNDBAR_AUDIO,
  buildDefaultDevices,
  clampTableOffset,
  frontWall,
  getChairLimits,
  ALL_IN_ONE_SIZES,
  ALL_IN_ONE_FOV,
  recommendedAllInOneSize,
  typicalAllInOneMicReach,
  DEDICATED_MIC_MIN_SEATS,
  refreshAutoDevices,
  spreadDevicePositions,
  tableSurface,
  ULTRAWIDE,
  ULTRAWIDE_DISPLAY_SIZES,
  buildRecommendations,
  cameraCoverage,
  generateLayout,
  CLASSROOM_DESK_DEPTH,
  recommendedDeviceCount,
  builtInMicCoverage,
  TABLE_CAM_MIC_RANGE_M,
  AUDIO_PREFERENCES,
  CEILING_MIC_AUDIO,
  dedicatedMicReach,
  micCoverage,
  placedSeats,
  seatingArea,
  getMaxChairsForLayout,
  occupancyLimit,
  seatsBlockedFromDisplay,
  deriveDesks,
  classroomLayout,
  effectiveSeatsPerDesk,
  CLASSROOM_BLOCK_SEATS,
  maxSeatsPerDesk,
  planSeatTotal,
} from "./roomConfiguratorEngine";
import { applyTemplate, fitOccupancy, initialPlan, settle } from "./roomPlanState";

const EMPTY_DEVICES = {
  display: [{ id: "d1", x: 0, y: 2, sizeInches: 98 }],
  allInOne: [],
  camera: [],
  videoBar: [],
  microphone: [],
  speaker: [],
  touchPanel: [{ id: "t1", x: 3, y: 2 }],
  contentSharing: [],
  door: [],
  bookingPanel: [],
};

// A 10 x 6 m room with a 360° camera in the middle (5, 3) and seats at known distances.
const tableCam = { id: "c1", x: 5, y: 3, isTableCam: true, fov: 360, angle: 0 };
const videoBar = { id: "v1", x: 0.2, y: 3, fov: 90, angle: 90 };
const seatsAt = (...distances) => distances.map((d) => ({ x: 5 + d, y: 3 }));

function makeState({ devices = {}, seats = seatsAt(1, 2), room = { length: 10, width: 6, height: 2.8 } } = {}) {
  return {
    room,
    table: { length: 3, width: 1.2, orientation: 0 },
    chairCount: seats.length,
    layout: "rectangular",
    devices: { ...EMPTY_DEVICES, ...devices },
    seats,
  };
}

const ids = (state) => buildRecommendations(state).map((r) => r.id);

describe("360° camera microphone coverage", () => {
  test("counts seats inside the ~3 m pickup", () => {
    const c = builtInMicCoverage(makeState({ devices: { camera: [tableCam] }, seats: seatsAt(1, 2.9, 3.5, 4.5) }));
    expect(TABLE_CAM_MIC_RANGE_M).toBe(3);
    expect(c).toEqual({ cams: 1, allInOnes: 0, sources: 1, seats: 4, micCovered: 2 });
  });

  test("a front-of-room camera gives no mic coverage", () => {
    const frontCam = { id: "c2", x: 0.2, y: 3, isTableCam: false, fov: 90, angle: 0 };
    expect(builtInMicCoverage(makeState({ devices: { camera: [frontCam] } })).cams).toBe(0);
  });
});

describe("a 360° camera must be paired with a video bar", () => {
  test("without one, that's an essential with a one-tap fix", () => {
    const rec = buildRecommendations(makeState({ devices: { camera: [tableCam] } })).find((r) => r.id === "table-cam-needs-bar");
    expect(rec).toMatchObject({ level: "essential", addCategories: ["videoBar", "allInOne"] });
    expect(rec.text).not.toMatch(/unless/);
  });

  test("with one, the essential clears", () => {
    expect(ids(makeState({ devices: { camera: [tableCam], videoBar: [videoBar] } }))).not.toContain("table-cam-needs-bar");
  });
});

describe("all-in-one displays", () => {
  // On the left wall of a 10 x 6 m room, facing into it.
  const board = (sizeInches, micReach) => ({ id: "a1", x: 0, y: 3, angle: 90, mount: "wall", sizeInches, micReach, fov: ALL_IN_ONE_FOV });
  const noScreens = (devices) => makeState({ devices: { display: [], ...devices }, seats: seatsAt(1, 2, 3.5) });

  test("sizes follow what brands make, and the room gets the smallest that's big enough", () => {
    expect(ALL_IN_ONE_SIZES).toEqual([50, 55, 65, 75, 86]);
    expect(ALL_IN_ONE_SIZES).toContain(recommendedAllInOneSize({ length: 5, width: 4 }, "left"));
    expect(recommendedAllInOneSize({ length: 4, width: 3 }, "left")).toBe(50);
    expect(recommendedAllInOneSize({ length: 30, width: 8 }, "left")).toBe(86);
  });

  test("count as the screen, the camera and the room's sound — and pair with a 360° camera", () => {
    const recs = ids(noScreens({ allInOne: [board(65, 7)], camera: [tableCam] }));
    ["no-display", "no-camera", "no-speaker", "table-cam-needs-bar"].forEach((id) => expect(recs).not.toContain(id));
  });

  test("extra microphones depend on the device's mic reach, not the seat count", () => {
    // Ten seats 1–6.4 m from the board, all within 7 m of it: no dedicated mics needed.
    const ten = Array.from({ length: 10 }, (_, i) => ({ x: 1 + i * 0.6, y: 3 }));
    expect(ids(makeState({ devices: { display: [], allInOne: [board(65, 7)] }, seats: ten }))).not.toContain("no-microphone");
    expect(ids(makeState({ devices: { display: [], allInOne: [board(65, 7)] }, seats: ten }))).not.toContain("builtin-mic-range");
    // The same seats with a 4 m-reach model: the far ones need microphones.
    const rec = buildRecommendations(makeState({ devices: { display: [], allInOne: [board(55, 4)] }, seats: ten })).find((r) => r.id === "builtin-mic-range");
    expect(rec.text).toMatch(/^4 seats are beyond the all-in-one display's ~4m mic pickup/);
  });

  test("without a datasheet, the typical reach for its size is used", () => {
    expect(typicalAllInOneMicReach(50)).toBe(4);
    expect(typicalAllInOneMicReach(55)).toBe(4);
    expect(typicalAllInOneMicReach(65)).toBe(7);
    expect(typicalAllInOneMicReach(86)).toBe(7);
  });

  test("lands on the front wall, clear of the screens already there", () => {
    const ctx = { room: { length: 6, width: 4.5 }, layout: "rectangular", table: { length: 3, width: 1.2, orientation: 0 }, tableOffset: { x: 0, y: 0 }, seats: [] };
    const p = autoPlacement("allInOne", { ...ctx, devices: { ...EMPTY_DEVICES, display: [] } }, { sizeInches: 65 });
    expect(p).toEqual({ x: 0, y: 2.25 });
    const beside = autoPlacement("allInOne", { ...ctx, devices: { ...EMPTY_DEVICES, display: [{ id: "d", x: 0, y: 2.25, sizeInches: 65 }] } }, { sizeInches: 65 });
    expect(Math.abs(beside.y - 2.25)).toBeGreaterThan(1.4);
  });
});

describe("a 360° camera has no speaker", () => {
  test("it doesn't count as the room's sound — the video bar does", () => {
    const seats = seatsAt(1, 2, 3.5);
    // Camera alone: the one fix asked for is the video bar (which brings the speaker),
    // not a separate "add a speaker" essential on top.
    const alone = ids(makeState({ devices: { camera: [tableCam] }, seats }));
    expect(alone).toContain("table-cam-needs-bar");
    expect(alone).not.toContain("no-speaker");
    // Paired: the bar covers sound for a small room, so no speaker essential either.
    expect(ids(makeState({ devices: { camera: [tableCam], videoBar: [videoBar] }, seats }))).not.toContain("no-speaker");
  });

  test("speaker advice follows the video bar rules, however close the seats are to the camera", () => {
    const eightSeats = seatsAt(0.5, 1, 1.5, 2, -0.5, -1, -1.5, -2);
    const recs = ids(makeState({ devices: { camera: [tableCam], videoBar: [videoBar] }, seats: eightSeats }));
    expect(recs).toContain("videobar-extra-speaker");
    expect(recs.some((id) => /speaker-range/.test(id))).toBe(false);
  });

  test("speaker batch size ignores the camera", () => {
    const room = { length: 10, width: 6, height: 2.8 };
    const coverage = builtInMicCoverage(makeState({ devices: { camera: [tableCam] } }));
    expect(recommendedDeviceCount("speaker", "rectangular", room, 8, coverage)).toBe(recommendedDeviceCount("speaker", "rectangular", room, 8));
  });
});

describe("microphone advice with a 360° camera", () => {
  const paired = (extra = {}) => ({ camera: [tableCam], videoBar: [videoBar], ...extra });

  test("seats inside ~3 m need no dedicated mics, even in a large room", () => {
    const state = makeState({ devices: paired(), seats: seatsAt(1, 1.5, 2, 2.5, -1, -1.5, -2, -2.5) });
    expect(ids(state)).not.toContain("no-microphone");
    expect(ids(state)).not.toContain("builtin-mic-range");
  });

  test("seats beyond ~3 m get a suggestion, counted", () => {
    const recs = buildRecommendations(makeState({ devices: paired(), seats: seatsAt(1, 3.5, -4) }));
    const rec = recs.find((r) => r.id === "builtin-mic-range");
    expect(rec).toMatchObject({ level: "suggestion", addCategories: ["microphone"] });
    expect(rec.text).toMatch(/^2 seats are beyond/);
  });

  test("dedicated microphones clear the suggestion", () => {
    const state = makeState({ devices: paired({ microphone: [{ id: "m1", x: 9, y: 3 }] }), seats: seatsAt(1, 4.5) });
    expect(ids(state)).not.toContain("builtin-mic-range");
  });

  test("the mic batch size covers only the seats out of reach", () => {
    const room = { length: 10, width: 6, height: 2.8 };
    expect(recommendedDeviceCount("microphone", "rectangular", room, 8)).toBe(2);
    const coverage = builtInMicCoverage(makeState({ devices: paired(), seats: seatsAt(1, 2, 3.5, 3.6, 3.7, 3.8, 3.9) }));
    expect(recommendedDeviceCount("microphone", "rectangular", room, 7, coverage)).toBe(2); // 5 out of reach → 2
  });
});

describe("automatic placement of new devices", () => {
  const room = { length: 8, width: 5, height: 2.8 };
  // Landscape boardroom: the front wall (where screens go) is the left wall.
  const ctx = (devices = {}) => ({
    room,
    layout: "rectangular",
    table: { length: 3, width: 1.2, orientation: 0 },
    tableOffset: { x: 0, y: 0 },
    devices: { ...EMPTY_DEVICES, display: [], touchPanel: [], ...devices },
    seats: [],
  });
  const near = (p, x, y, tol = 0.2) => Math.abs(p.x - x) <= tol && Math.abs(p.y - y) <= tol;

  test("a screen goes in the middle of the front wall, the next one beside it if the wall is long enough", () => {
    const first = autoPlacement("display", ctx(), { sizeInches: 75 });
    expect(near(first, 0, 2.5)).toBe(true);
    const wide = { ...ctx(), room: { length: 8, width: 7, height: 2.8 } };
    const centered = autoPlacement("display", wide, { sizeInches: 75 });
    const second = autoPlacement("display", { ...wide, devices: { ...wide.devices, display: [{ id: "d1", ...centered, sizeInches: 75 }] } }, { sizeInches: 75 });
    expect(second.x).toBe(0);
    expect(Math.abs(second.y - 3.5)).toBeGreaterThanOrEqual(1.66 + 0.2 - 0.01);
  });

  test("a front camera or video bar sits just in front of the screens", () => {
    const bar = autoPlacement("videoBar", ctx(), { fov: 90 });
    expect(bar.x).toBeGreaterThan(0);
    expect(bar.x).toBeLessThan(0.3);
    expect(near(bar, bar.x, 2.5)).toBe(true);
    const cam = autoPlacement("camera", ctx({ videoBar: [{ id: "v1", ...bar }] }), { fov: 90 });
    expect(Math.hypot(cam.x - bar.x, cam.y - bar.y)).toBeGreaterThanOrEqual(0.5);
  });

  test("a 360° camera goes in the middle of the table, following it when it's moved", () => {
    expect(near(autoPlacement("camera", ctx(), { isTableCam: true }), 4, 2.5)).toBe(true);
    const moved = { ...ctx(), tableOffset: { x: 1, y: -0.5 } };
    expect(near(autoPlacement("camera", moved, { isTableCam: true }), 5, 2)).toBe(true);
  });

  test("a touch panel goes on the table at the end nearest the screens", () => {
    const p = autoPlacement("touchPanel", ctx());
    expect(p.x).toBeGreaterThan(2.5); // table runs 2.5–5.5 m
    expect(p.x).toBeLessThan(3.5);
    expect(near(p, p.x, 2.5)).toBe(true);
  });

  test("a booking panel goes on the wall right beside the door", () => {
    const door = { id: "door1", x: 7.2, y: 5, edge: "bottom" };
    const p = autoPlacement("bookingPanel", ctx({ door: [door] }));
    expect(p.y).toBe(5);
    expect(Math.abs(p.x - 7.2)).toBeLessThanOrEqual(0.8);
    expect(Math.abs(p.x - 7.2)).toBeGreaterThan(0.3);
  });

  test("a second door doesn't land on the first", () => {
    const first = autoPlacement("door", ctx());
    const second = autoPlacement("door", ctx({ door: [{ id: "door1", ...first, edge: "bottom" }] }));
    expect(Math.hypot(second.x - first.x, second.y - first.y)).toBeGreaterThan(1);
  });

  test("everything stays inside the room", () => {
    const tiny = { ...ctx(), room: { length: 2, width: 2, height: 2.4 }, table: { length: 1, width: 0.8, orientation: 0 } };
    ["display", "camera", "videoBar", "touchPanel", "contentSharing", "door", "bookingPanel"].forEach((c) => {
      const p = autoPlacement(c, tiny, { sizeInches: 110, fov: 90 });
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(2);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(2);
    });
  });
});

test("table-top devices stay on the table even when the best spots are taken", () => {
  const room = { length: 6.5, width: 4.5, height: 2.8 };
  const base = {
    room,
    layout: "rectangular",
    table: { length: 3, width: 1.2, orientation: 0 },
    tableOffset: { x: 0, y: 0 },
    seats: [],
  };
  const devices = {
    ...EMPTY_DEVICES,
    display: [],
    camera: [{ id: "c1", x: 3.33, y: 2.33, isTableCam: true }],
    touchPanel: [{ id: "t1", x: 2.17, y: 2.33, mount: "table" }],
  };
  const p = autoPlacement("contentSharing", { ...base, devices });
  // Table runs 1.75–4.75 m along the room and 1.65–2.85 m across it.
  expect(p.x).toBeGreaterThan(1.75);
  expect(p.x).toBeLessThan(4.75);
  expect(p.y).toBeGreaterThan(1.65);
  expect(p.y).toBeLessThan(2.85);
});

test("a second screen never hangs off the end of a wall", () => {
  const room = { length: 6.5, width: 4.5, height: 2.8 };
  const base = { room, layout: "rectangular", table: { length: 3, width: 1.2, orientation: 0 }, tableOffset: { x: 0, y: 0 }, seats: [] };
  const first = { id: "d1", x: 0, y: 2.25, sizeInches: 110, mount: "wall" };
  const p = autoPlacement("display", { ...base, devices: { ...EMPTY_DEVICES, display: [first] } }, { sizeInches: 75 });
  const half = (75 * 0.0254 * 16) / Math.hypot(16, 9) / 2;
  const onVerticalWall = p.x === 0 || p.x === room.length;
  const [pos, len] = onVerticalWall ? [p.y, room.width] : [p.x, room.length];
  expect(pos - half).toBeGreaterThanOrEqual(0);
  expect(pos + half).toBeLessThanOrEqual(len);
  // …and doesn't overlap the first one.
  expect(onVerticalWall && p.x === 0 ? Math.abs(p.y - 2.25) : Infinity).toBeGreaterThan(1.2);
});

describe("classroom rows and desks", () => {
  const table = { length: 3, width: 1.2, orientation: 0 };
  const deskWidths = (layoutResult) => layoutResult.tableShape.desks.map((d) => Math.round(d.w / 0.6));
  const rowsOf = (layoutResult) => {
    const byY = {};
    layoutResult.chairs.forEach((c) => { const k = c.y.toFixed(2); byY[k] = (byY[k] || 0) + 1; });
    return Object.keys(byY).sort((a, b) => a - b).map((k) => byY[k]);
  };

  // Theater still spreads a headcount across rows and splits each row into blocks.
  // The classroom packs an explicit desk list instead, so this now guards theater —
  // see "classroom rows packed from the desk list" for the classroom's own rule.
  test("when the room has space for another row, every row keeps its seats in one block", () => {
    // 7 m long room: up to 8 seats a row at standard spacing, with an aisle after 6.
    const r = generateLayout("theater", { length: 7, width: 6, height: 2.8 }, table, 13);
    expect(rowsOf(r)).toEqual([5, 4, 4]);
    // No row needed an aisle: every row's seats sit one seat pitch apart.
    const rows = {};
    r.chairs.forEach((c) => { (rows[c.y.toFixed(2)] ||= []).push(c.x); });
    Object.values(rows).forEach((xs) => {
      xs.sort((a, b) => a - b);
      xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeLessThan(0.8));
    });
  });

  test("a row takes the next desk whenever it still fits across the room", () => {
    // Room only deep enough for one row: a 6-seat desk and the 1-seat remainder
    // share it across an aisle (3.6 + 1.0 + 0.6 m, inside the 5.8 m usable width).
    const r = generateLayout("classroom", { length: 7, width: 2.6, height: 2.8 }, table, 7);
    expect(rowsOf(r)).toEqual([7]);
    expect(deskWidths(r)).toEqual([6, 1]);
  });

  test("a shallow room still fits the rows its depth allows", () => {
    // 6.5 x 3 m: two rows of desks fit once the front zone and back walkway give up
    // their extra space, and neither goes below its minimum.
    const room = { length: 6.5, width: 3, height: 2.8 };
    // What the furniture fits (occupancy caps the planner's count separately).
    const max = getMaxChairsForLayout("classroom", room, table);
    const r = generateLayout("classroom", room, table, max);
    expect(rowsOf(r)).toHaveLength(2);
    const deskFront = room.width / 2 + Math.min(...r.tableShape.desks.map((d) => d.y));
    const chairBack = room.width / 2 - Math.max(...r.chairs.map((c) => c.y + 0.3));
    expect(deskFront).toBeGreaterThanOrEqual(0.6 - 1e-9);
    expect(chairBack).toBeGreaterThanOrEqual(0.2 - 1e-9);
    // Theater rows too.
    const t = generateLayout("theater", room, table, getMaxChairsForLayout("theater", room, table));
    expect(new Set(t.chairs.map((c) => c.y.toFixed(2))).size).toBe(2);
  });

  test("with room to spare, rows keep the full front zone", () => {
    const room = { length: 7, width: 8, height: 2.8 };
    const r = generateLayout("classroom", room, table, 12);
    expect(room.width / 2 + Math.min(...r.tableShape.desks.map((d) => d.y))).toBeCloseTo(0.9);
  });

  test("deeper desks push the rows apart so chairs never overlap the desk behind", () => {
    const room = { length: 7, width: 8, height: 2.8 };
    const r = generateLayout("classroom", room, { ...table, deskDepth: 0.9 }, 12);
    const rowYs = [...new Set(r.chairs.map((c) => c.y))].sort((a, b) => a - b);
    const secondRowDeskFront = Math.min(...r.tableShape.desks.filter((d) => d.y > rowYs[0]).map((d) => d.y));
    expect(secondRowDeskFront).toBeGreaterThan(rowYs[0] + 0.3);
    // Each row's desk sits in front of its chairs, not under them.
    r.tableShape.desks.forEach((d) => expect(r.chairs.some((c) => Math.abs(c.y - (d.y + d.h + 0.1 + 0.15)) < 1e-9)).toBe(true));
  });

  test("seats spread evenly across rows instead of a short last row", () => {
    const r = generateLayout("classroom", { length: 7, width: 8, height: 2.8 }, table, 11);
    expect(rowsOf(r)).toEqual([6, 5]);
    expect(deskWidths(r)).toEqual([6, 5]);
  });

  test("desks are 0.4 m deep by default, and follow the desk depth setting", () => {
    const room = { length: 7, width: 6, height: 2.8 };
    expect(CLASSROOM_DESK_DEPTH.default).toBe(0.4);
    expect(generateLayout("classroom", room, table, 6).tableShape.desks[0].h).toBeCloseTo(0.4);
    expect(generateLayout("classroom", room, { ...table, deskDepth: 0.6 }, 6).tableShape.desks[0].h).toBeCloseTo(0.6);
  });
});

describe("cameras cover every seat, face-on", () => {
  // 6.5 x 4.5 m boardroom, table landscape, screen on the left wall.
  const room = { length: 6.5, width: 4.5, height: 2.8 };
  const table = { length: 3, width: 1.2, orientation: 0 };
  const layoutResult = generateLayout("rectangular", room, table, 8);
  const seats = layoutResult.chairs.map((c) => ({ x: room.length / 2 + c.x, y: room.width / 2 + c.y, angle: c.angle }));
  const frontBar = { id: "v1", x: 0.17, y: 2.25, angle: 90, fov: 120 };
  const state = (devices) => ({ room, table, layout: "rectangular", chairCount: seats.length, seats, devices: { ...EMPTY_DEVICES, ...devices } });

  test("a front video bar can't see the face of the person with their back to the screen", () => {
    const { unseen } = cameraCoverage(state({ videoBar: [frontBar] }));
    expect(unseen.length).toBe(1);
    expect(unseen[0].x).toBeLessThan(2); // the seat at the screen end, facing away
    expect(ids(state({ videoBar: [frontBar] }))).toContain("camera-coverage");
  });

  test("an added camera goes where it sees the missed seat face-on, and then everyone is covered", () => {
    const ctx = { room, layout: "rectangular", table, tableOffset: { x: 0, y: 0 }, seats, devices: { ...EMPTY_DEVICES, videoBar: [frontBar] } };
    const spot = autoPlacement("camera", ctx, { fov: 90 });
    expect(spot.x).toBeGreaterThan(room.length - 0.5); // far wall, opposite the screen
    const cam = { id: "c2", x: spot.x, y: spot.y, angle: spot.angle, fov: 90 };
    expect(cameraCoverage(state({ videoBar: [frontBar], camera: [cam] })).unseen).toHaveLength(0);
    expect(ids(state({ videoBar: [frontBar], camera: [cam] }))).not.toContain("camera-coverage");
  });

  test("the first camera system still goes with the screens", () => {
    const ctx = { room, layout: "rectangular", table, tableOffset: { x: 0, y: 0 }, seats, devices: { ...EMPTY_DEVICES } };
    expect(autoPlacement("videoBar", ctx, { fov: 120 }).x).toBeLessThan(0.3);
  });

  test("a 360° camera in the middle sees everyone seated around the table", () => {
    const cam360 = { id: "c1", x: 3.25, y: 2.25, isTableCam: true, fov: 360, angle: 0 };
    expect(cameraCoverage(state({ camera: [cam360], videoBar: [frontBar] })).unseen).toHaveLength(0);
  });
});

describe("D-shape huddle table", () => {
  const room = { length: 4, width: 3.5, height: 2.7 };
  const table = { length: 1.8, width: 1.2, orientation: 0 }; // landscape: flat end on the left wall

  test("seats as many as the spacing allows — no fixed cap — none against the screen wall", () => {
    const max = getMaxChairsForLayout("dshape", room, table);
    expect(max).toBe(7); // ~4.3 m of seating path at 0.61 m a seat
    expect(getMaxChairsForLayout("dshape", room, { ...table, length: 2.4 })).toBeGreaterThan(max);
    const r = generateLayout("dshape", room, table, max);
    expect(r.chairs).toHaveLength(max);
    r.chairs.forEach((c) => expect(c.x + room.length / 2).toBeGreaterThan(0.45));
  });

  test("its flat end sits on the screen wall and it can only slide along that wall", () => {
    const r = generateLayout("dshape", room, table, 4);
    const minX = Math.min(...r.tableShape.points.map((p) => p.x));
    expect(minX + room.length / 2).toBeCloseTo(0); // touching the left wall
    expect(frontWall("dshape", table)).toBe("left");
    const moved = clampTableOffset({ x: 1, y: 0.4 }, room, r.groupBounds);
    expect(moved.x).toBe(0);
    expect(moved.y).toBeCloseTo(0.4);
  });

  test("the screen stays above its flat end as it slides", () => {
    const devices = buildDefaultDevices(room, "dshape", table);
    const next = refreshAutoDevices(devices, room, "dshape", table, { x: 0, y: 0.4 });
    expect(next.display[0].x).toBe(0);
    expect(next.display[0].y).toBeCloseTo(room.width / 2 + 0.4);
  });
});

describe("front-row seating", () => {
  const room = { length: 7, width: 6, height: 2.8 };
  const table = { length: 4, width: 0.8, orientation: 0 }; // landscape: row faces the top wall

  test("everyone sits on the far side of a curved table, facing the screen wall", () => {
    expect(frontWall("frontrow", table)).toBe("top");
    const r = generateLayout("frontrow", room, table, 6);
    const tableMaxY = Math.max(...r.tableShape.points.map((p) => p.y));
    r.chairs.forEach((c) => {
      expect(c.y).toBeGreaterThan(tableMaxY - 0.3); // behind the table, away from the screen
      expect(Math.min(c.angle, 360 - c.angle)).toBeLessThan(35); // looking roughly at the top wall
    });
    // The ends wrap toward the screen: the outer seats sit nearer the wall than the middle ones.
    const ys = r.chairs.map((c) => c.y);
    expect(ys[0]).toBeLessThan(ys[2]);
    expect(ys[5]).toBeLessThan(ys[3]);
  });

  test("its screen is an ultra-wide by default", () => {
    const devices = refreshAutoDevices(buildDefaultDevices(room, "rectangular", table), room, "frontrow", table);
    expect(devices.display[0].aspect).toBe(ULTRAWIDE);
    expect(ULTRAWIDE_DISPLAY_SIZES).toContain(devices.display[0].sizeInches);
    expect(devices.display[0].y).toBe(0); // on the top wall it faces
  });

  test("table mics run along the curve", () => {
    const pts = spreadDevicePositions("microphone", 3, { layout: "frontrow", room, table, tableOffset: { x: 0, y: 0 }, seats: null });
    const surface = tableSurface("frontrow", room, table);
    pts.forEach((p) => expect(surface.contains({ x: p.x - room.length / 2, y: p.y - room.width / 2 })).toBe(true));
  });
});

test("the first camera system lines up with the screen, even when a D-shape has slid it along the wall", () => {
  const room = { length: 4, width: 3.5, height: 2.7 };
  const table = { length: 1.8, width: 1.2, orientation: 0 };
  const tableOffset = { x: 0, y: -0.45 };
  const devices = refreshAutoDevices(buildDefaultDevices(room, "dshape", table), room, "dshape", table, tableOffset);
  const p = autoPlacement("videoBar", { room, layout: "dshape", table, tableOffset, devices, seats: [] }, { fov: 120 });
  expect(p.x).toBeLessThan(0.3);
  expect(p.y).toBeCloseTo(devices.display[0].y, 1);
});

test("a portrait D-shape sits against the top wall instead", () => {
  const room = { length: 4, width: 3.5, height: 2.7 };
  const table = { length: 1.8, width: 1.2, orientation: 90 };
  expect(frontWall("dshape", table)).toBe("top");
  const r = generateLayout("dshape", room, table, 4);
  expect(Math.min(...r.tableShape.points.map((p) => p.y)) + room.width / 2).toBeCloseTo(0);
  expect(clampTableOffset({ x: 0.3, y: 1 }, room, r.groupBounds)).toEqual({ x: 0.3, y: 0 });
  r.chairs.forEach((c) => expect(c.y + room.width / 2).toBeGreaterThan(0.45));
});

describe("starting empty and choosing a table", () => {
  test("with no layout chosen there's no table and no chairs, and choosing one is flagged", () => {
    const r = generateLayout(null, { length: 6.5, width: 4.5, height: 2.8 }, { length: 3, width: 1.2, orientation: 0 }, 8);
    expect(r.chairs).toHaveLength(0);
    expect(r.tableShape.type).toBe("none");
    const recs = buildRecommendations({ ...makeState({ seats: [] }), layout: null, chairCount: 0 });
    expect(recs.find((x) => x.id === "no-layout")).toMatchObject({ level: "essential" });
  });

  test("a new table is 60% of the room each way, within that layout's size rules", () => {
    const room = { length: 10, width: 8, height: 2.8 };
    expect(defaultTableSize("rectangular", room, 0)).toEqual({ length: 6, width: 4.8 });
    expect(defaultTableSize("rectangular", room, 90)).toEqual({ length: 4.8, width: 6 });
    // Kept to the room's clearance for chairs: 8 m − 2 m.
    expect(defaultTableSize("rectangular", { length: 6.5, width: 4.5, height: 2.8 }, 0)).toEqual({ length: 3.9, width: 2.5 });
    // Front row: 60% long, but no deeper than a front-row table gets.
    expect(defaultTableSize("frontrow", room, 0)).toEqual({ length: 6, width: 1 });
    expect(defaultTableSize("dshape", { length: 4, width: 3.5, height: 2.7 }, 0)).toEqual({ length: 2.4, width: 1.5 });
  });
});

describe("dedicated microphones", () => {
  const seats = (n) => Array.from({ length: n }, (_, i) => ({ x: 1 + (i % 6), y: 1 + Math.floor(i / 6), angle: 0 }));
  const withBar = (n) => makeState({ devices: { videoBar: [videoBar] }, seats: seats(n) });

  test("aren't suggested below 8 seats — built-in mics cover a small room", () => {
    expect(DEDICATED_MIC_MIN_SEATS).toBe(8);
    expect(ids(withBar(7))).not.toContain("no-microphone");
  });

  test("are suggested from 8 seats up", () => {
    const rec = buildRecommendations(withBar(8)).find((r) => r.id === "no-microphone");
    expect(rec.text).toMatch(/8\+ seats/);
  });
});

describe("soundbar as the preferred audio setup", () => {
  const seats = (n) => Array.from({ length: n }, (_, i) => ({ x: 1 + (i % 6), y: 1 + Math.floor(i / 6), angle: 0 }));
  const withSoundbar = (n) => ({ ...makeState({ seats: seats(n) }), audioPreference: SOUNDBAR_AUDIO });

  test("covers a small room on its own", () => {
    const recs = ids(withSoundbar(8));
    expect(recs).not.toContain("no-speaker");
    expect(recs).not.toContain("no-microphone");
    expect(recs).not.toContain("soundbar-microphones");
    expect(recs).not.toContain("soundbar-speakers");
  });

  test("asks for more microphones above 8 people and more speakers above 10", () => {
    expect(ids(withSoundbar(9))).toContain("soundbar-microphones");
    expect(ids(withSoundbar(9))).not.toContain("soundbar-speakers");
    const eleven = buildRecommendations(withSoundbar(11));
    expect(eleven.find((r) => r.id === "soundbar-speakers")).toMatchObject({ level: "suggestion", addCategories: ["speaker"] });
    expect(eleven.find((r) => r.id === "soundbar-microphones")).toMatchObject({ addCategories: ["microphone"] });
  });

  test("suggests just enough extra devices for the people beyond the soundbar", () => {
    const room = { length: 10, width: 6, height: 2.8 };
    expect(recommendedDeviceCount("microphone", "rectangular", room, 16, null, SOUNDBAR_AUDIO)).toBe(2); // 8 beyond → 2
    expect(recommendedDeviceCount("speaker", "rectangular", room, 20, null, SOUNDBAR_AUDIO)).toBe(2); // half the room → 30 m² → 2
    expect(recommendedDeviceCount("speaker", "rectangular", room, 20)).toBe(4);
  });
});

test("theater rows keep no more than 6 chairs together, split evenly", () => {
  const table = { length: 3, width: 1.2, orientation: 0 };
  [[10, 8, 40], [6.5, 4.5, 20], [14, 10, 90]].forEach(([length, width, count]) => {
    const room = { length, width, height: 2.8 };
    const max = getChairLimits("theater", room, table)[1];
    const r = generateLayout("theater", room, table, Math.min(count, max));
    const rows = {};
    r.chairs.forEach((c) => { (rows[c.y.toFixed(2)] ||= []).push(c.x); });
    Object.values(rows).forEach((xs) => {
      xs.sort((a, b) => a - b);
      // Blocks are runs of chairs one seat apart; an aisle is a bigger gap.
      const blocks = [1];
      for (let i = 1; i < xs.length; i++) {
        if (xs[i] - xs[i - 1] > 0.8) blocks.push(1);
        else blocks[blocks.length - 1]++;
      }
      blocks.forEach((b) => expect(b).toBeLessThanOrEqual(6));
      expect(Math.max(...blocks) - Math.min(...blocks)).toBeLessThanOrEqual(1);
    });
  });
});

describe("dedicated microphone pickup range", () => {
  const room = { length: 12, width: 6, height: 3 };
  const table = { length: 8, width: 1.5, orientation: 0 };
  const layout = "rectangular";
  const { chairs } = generateLayout(layout, room, table, 20);
  const seats = placedSeats(chairs, room);
  const cover = { seats, seatArea: seatingArea(chairs, room), table, tableOffset: { x: 0, y: 0 } };

  test("a ceiling array reaches ~5 m on the slant to a seated head; a table mic ~5 ft", () => {
    expect(dedicatedMicReach(CEILING_MIC_AUDIO, room)).toBeCloseTo(Math.sqrt(25 - 1.8 ** 2), 5);
    expect(dedicatedMicReach(AUDIO_PREFERENCES[1], room)).toBeCloseTo(1.524, 3);
    // A higher ceiling reaches less far across the room.
    expect(dedicatedMicReach(CEILING_MIC_AUDIO, { ...room, height: 4 })).toBeLessThan(dedicatedMicReach(CEILING_MIC_AUDIO, room));
  });

  test("counts the fewest mics that put every seat in range: few ceiling arrays, more table mics", () => {
    const ceiling = recommendedDeviceCount("microphone", layout, room, seats.length, null, CEILING_MIC_AUDIO, cover);
    const tableMics = recommendedDeviceCount("microphone", layout, room, seats.length, null, AUDIO_PREFERENCES[1], cover);
    expect(ceiling).toBeLessThan(tableMics);
    [
      [ceiling, CEILING_MIC_AUDIO],
      [tableMics, AUDIO_PREFERENCES[1]],
    ].forEach(([n, audioPreference]) => {
      const microphone = spreadDevicePositions("microphone", n, { layout, room, table, tableOffset: { x: 0, y: 0 }, seats: cover.seatArea }).map((p, i) => ({ id: `m${i}`, ...p }));
      const state = { ...makeState({ devices: { display: [], microphone }, seats, room }), audioPreference };
      expect(micCoverage(state).unheard).toEqual([]);
    });
  });

  const micCoverageRec = (state) => buildRecommendations(state).find((r) => r.id === "mic-coverage");

  test("flags seats beyond the microphones' pickup", () => {
    const state = { ...makeState({ devices: { display: [], microphone: [{ id: "m1", x: 2, y: 3 }] }, seats, room }), audioPreference: AUDIO_PREFERENCES[1] };
    const rec = micCoverageRec(state);
    expect(rec).toMatchObject({ level: "suggestion", addCategories: ["microphone"] });
    // The range in force, as resolveMicRange returns it — a table pod's 1.524 m. The
    // advice used to quote the catalogue label ("~1.5 m (5 ft)"), which the plan's discs
    // and the PDF's coverage table could both contradict.
    expect(rec.text).toMatch(/~1\.52 m pickup/);
  });

  test("the pickup it quotes follows a room-wide range, not the catalogue figure", () => {
    const state = {
      ...makeState({ devices: { display: [], microphone: [{ id: "m1", x: 2, y: 3 }] }, seats, room }),
      audioPreference: AUDIO_PREFERENCES[1],
      audio: { micRange: 1 },
    };
    expect(micCoverageRec(state).text).toMatch(/~1 m pickup/);
  });
});

describe("maximum occupancy (Dubai Building Code: 1 person per 1.5 m²)", () => {
  test("caps the chairs at one per 1.5 m² of floor, however many the furniture fits", () => {
    const room = { length: 3, width: 2.5, height: 2.8 }; // 7.5 m² → 5 people
    const table = { length: 2.2, width: 1, orientation: 0 };
    expect(occupancyLimit(room)).toBe(5);
    expect(getMaxChairsForLayout("rectangular", room, table)).toBeGreaterThan(5);
    expect(getChairLimits("rectangular", room, table)).toEqual([2, 5]);
  });

  test("leaves roomier layouts to their furniture", () => {
    const room = { length: 9, width: 6, height: 3 }; // 54 m² → 36 people
    const table = { length: 5.4, width: 1.5, orientation: 0 };
    const fits = getMaxChairsForLayout("rectangular", room, table);
    expect(fits).toBeLessThan(occupancyLimit(room));
    expect(getChairLimits("rectangular", room, table)[1]).toBe(fits);
  });

  test("a room too small for two people allows a single seat", () => {
    const room = { length: 2, width: 1.2, height: 2.4 }; // 2.4 m²
    expect(getChairLimits("rectangular", room, { length: 1.2, width: 0.8, orientation: 0 })).toEqual([1, 1]);
  });
});

describe("seeing the main display", () => {
  const room = { length: 8, width: 7, height: 2.8 };
  const table = { length: 3, width: 1.2, orientation: 0 };

  test.each(["theater", "classroom"])("%s rows line up, with no stagger", (layout) => {
    const r = generateLayout(layout, room, table, 18);
    const rows = {};
    r.chairs.forEach((c) => { (rows[c.y.toFixed(2)] ||= []).push(c.x); });
    const ys = Object.keys(rows).sort((a, b) => a - b);
    expect(ys.length).toBeGreaterThan(1);
    // Rows holding the same number of seats sit on exactly the same lines, so
    // the block reads as a uniform grid rather than a staggered one.
    const sameSize = ys.map((y) => rows[y].slice().sort((a, b) => a - b)).filter((xs, _, all) => xs.length === all[0].length);
    expect(sameSize.length).toBeGreaterThan(1);
    sameSize.forEach((xs) => {
      xs.forEach((x, i) => expect(x).toBeCloseTo(sameSize[0][i], 5));
    });
  });

  test("flags seats that look at the main display through the seat in front", () => {
    const devices = { ...EMPTY_DEVICES, display: [{ id: "d1", x: 4, y: 0, angle: 0, sizeInches: 85 }] };
    const inLine = [{ x: 4, y: 2, angle: 0 }, { x: 4, y: 2.9, angle: 0 }, { x: 4, y: 3.8, angle: 0 }];
    expect(seatsBlockedFromDisplay({ devices, seats: inLine })).toHaveLength(2);
    // Staggered across, everyone sees it.
    const staggered = [{ x: 4, y: 2, angle: 0 }, { x: 4.4, y: 2.9, angle: 0 }, { x: 4, y: 3.8, angle: 0 }];
    expect(seatsBlockedFromDisplay({ devices, seats: staggered })).toEqual([]);
    // A boardroom's side seats face across the table, so they aren't judged on this.
    const sides = [{ x: 4, y: 2, angle: 90 }, { x: 4, y: 2.9, angle: 90 }, { x: 4, y: 3.8, angle: 90 }];
    expect(seatsBlockedFromDisplay({ devices, seats: sides })).toEqual([]);
  });

  test("raises it as advice, naming the display", () => {
    const state = makeState({
      devices: { display: [{ id: "d1", x: 5, y: 0, angle: 0, sizeInches: 85 }] },
      seats: [{ x: 5, y: 2, angle: 0 }, { x: 5, y: 2.9, angle: 0 }],
    });
    const rec = buildRecommendations(state).find((r) => r.id === "seats-block-display");
    expect(rec).toMatchObject({ level: "suggestion" });
    expect(rec.text).toMatch(/D1/);
  });
});

describe("classroom desk list", () => {
  it("derives one desk per full seat group from the headcount", () => {
    const desks = deriveDesks(12, 3);
    expect(desks).toHaveLength(4);
    expect(desks.map((d) => d.seats)).toEqual([3, 3, 3, 3]);
    expect(new Set(desks.map((d) => d.id)).size).toBe(4); // ids are unique
    expect(desks[0]).toMatchObject({ dx: 0, dy: 0, seatsSetByHand: false });
  });

  it("puts the remainder on the last desk rather than dropping it", () => {
    expect(deriveDesks(11, 3).map((d) => d.seats)).toEqual([3, 3, 3, 2]);
  });

  it.each([NaN, Infinity, -Infinity, undefined, null])("derives no desks from a non-finite headcount (%p)", (bad) => {
    expect(deriveDesks(bad, 3)).toEqual([]);
  });

  it.each([0, -3, NaN, undefined, null])("falls back to the default for a bad seatsPerDesk (%p)", (bad) => {
    expect(effectiveSeatsPerDesk(bad)).toBe(CLASSROOM_BLOCK_SEATS);
  });

  it("starts a plan with both fields null", () => {
    const p = initialPlan();
    expect(p.seatsPerDesk).toBeNull();
    expect(p.desks).toBeNull();
  });

  describe("through settle", () => {
    const entered = { length: true, width: true, height: true };
    const base = initialPlan();
    const classroom = { ...base, room: { length: 9, width: 7, height: 2.8 }, roomEntered: entered, layout: "classroom", chairCount: 12 };
    // Desks are edited on a plan whose layout is already settled, as the editor will.
    const settled = settle(base, classroom);
    const prev = settle(settled, { ...settled, desks: deriveDesks(12, 3) });

    it("clears the desk list when the layout type changes", () => {
      expect(prev.desks).not.toBeNull();
      const next = settle(prev, { ...prev, layout: "ushape" });
      expect(next.desks).toBeNull();
      expect(next.seatEditsCleared).toBe(prev.seatEditsCleared + 1);
    });

    it("keeps the desk list when the room is resized", () => {
      const next = settle(prev, { ...prev, room: { ...prev.room, length: 11, width: 8 } });
      expect(next.desks).toBe(prev.desks);
      expect(next.seatEditsCleared).toBe(prev.seatEditsCleared);
    });

    it("clears the desk list when a template is applied", () => {
      expect(applyTemplate(prev, "small").desks).toBeNull();
      expect(applyTemplate({ ...prev, template: "small" }, "custom").desks).toBeNull();
    });
  });
});

describe("classroom rows packed from the desk list", () => {
  const room = { length: 9, width: 7, height: 2.8 };
  const table = { length: 3, width: 1.2, orientation: 0 };
  // Desks are laid out in rows; two desks share a row when their x spans overlap.
  const rowsOfDesks = (desks) => {
    const byY = {};
    desks.forEach((d) => { (byY[d.y.toFixed(4)] ||= []).push(d); });
    return Object.keys(byY).sort((a, b) => a - b).map((k) => byY[k].slice().sort((a, b) => a.x - b.x));
  };
  const expectSaneDesks = (r, desks) => {
    desks.forEach((d) => {
      expect(d.x + r.length / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(d.x + d.w + r.length / 2).toBeLessThanOrEqual(r.length + 1e-6);
      expect(d.y + r.width / 2).toBeGreaterThanOrEqual(-1e-6);
      expect(d.y + d.h + r.width / 2).toBeLessThanOrEqual(r.width + 1e-6);
    });
    rowsOfDesks(desks).forEach((rowDesks) => {
      rowDesks.slice(1).forEach((d, i) => expect(d.x).toBeGreaterThanOrEqual(rowDesks[i].x + rowDesks[i].w - 1e-6));
    });
  };

  it("lays out one desk per group with the seats it carries", () => {
    const { desks, chairs } = classroomLayout(room, 0.5, deriveDesks(12, 3), "standard");
    expect(desks).toHaveLength(4);
    expect(chairs).toHaveLength(12);
  });

  it("tags every chair with the id of its desk", () => {
    const list = deriveDesks(12, 3);
    const { chairs } = classroomLayout(room, 0.5, list, "standard");
    list.forEach((d) => expect(chairs.filter((c) => c.deskId === d.id)).toHaveLength(d.seats));
    expect(chairs.every((c) => c.deskId)).toBe(true);
  });

  it("gives every desk the id of the desk it was laid out from", () => {
    const list = deriveDesks(12, 3);
    const { desks } = classroomLayout(room, 0.5, list, "standard");
    expect(desks.map((d) => d.deskId)).toEqual(list.map((d) => d.id));
  });

  it("centres a row of unequal desks on the room midline", () => {
    // A 2-seat and a 5-seat desk: 4.2 m of seats plus a 1 m aisle fits one row of a
    // 9 m room (7.8 m usable), so the pair is centred as a unit — spec §6.2.
    const list = [
      { id: "a", seats: 2, dx: 0, dy: 0, seatsSetByHand: true },
      { id: "b", seats: 5, dx: 0, dy: 0, seatsSetByHand: true },
    ];
    const { desks } = classroomLayout(room, 0.4, list, "standard");
    expect(rowsOfDesks(desks)).toHaveLength(1);
    const left = Math.min(...desks.map((d) => d.x)) + room.length / 2;
    const right = room.length / 2 - Math.max(...desks.map((d) => d.x + d.w));
    expect(left).toBeCloseTo(right, 6);
  });

  it("starts a new row rather than squeezing a desk that will not fit", () => {
    // 6.5 m long (5.3 m usable) fits two 3-seat desks and an aisle (4.6 m), not three.
    const narrow = { length: 6.5, width: 8, height: 2.8 };
    const { desks } = classroomLayout(narrow, 0.4, deriveDesks(30, 3), "standard");
    expect(rowsOfDesks(desks).map((r) => r.length)).toEqual([2, 2, 2, 2, 2]);
  });

  // Review Focus 3
  it("still lays out desks that no longer fit the room, without overlapping", () => {
    const narrow = { length: 6.5, width: 8, height: 2.8 };
    const { desks, chairs } = classroomLayout(narrow, 0.4, deriveDesks(30, 3), "standard");
    expect(desks).toHaveLength(10);
    expect(chairs).toHaveLength(30);
    expect(rowsOfDesks(desks)).toHaveLength(5);
    expectSaneDesks(narrow, desks);
  });

  it("derives the desk list from the headcount when the plan has none", () => {
    const fromNull = generateLayout("classroom", room, table, 12, {}, "standard", { desks: null, seatsPerDesk: 3 });
    const fromEmpty = generateLayout("classroom", room, table, 12, {}, "standard", { desks: [], seatsPerDesk: 3 });
    // An empty array from a hand-edited shared link is not an empty classroom.
    expect(fromNull.tableShape.desks).toHaveLength(4);
    expect(fromEmpty.tableShape.desks).toHaveLength(4);
    expect(fromNull.chairs).toHaveLength(12);
  });

  it("lays out the plan's own desk list when it has one", () => {
    const list = [
      { id: "a", seats: 2, dx: 0, dy: 0, seatsSetByHand: true },
      { id: "b", seats: 4, dx: 0, dy: 0, seatsSetByHand: true },
    ];
    const r = generateLayout("classroom", room, table, 12, {}, "standard", { desks: list, seatsPerDesk: 3 });
    expect(r.tableShape.desks.map((d) => d.deskId)).toEqual(["a", "b"]);
    expect(r.chairs).toHaveLength(6); // the list wins over the headcount
  });

  describe("per-desk seats and offsets", () => {
    // 9 x 7 m, standard density: wide enough for several desks, deep enough that a
    // single centred desk has slack to be moved in every direction.
    it("changes only the desk whose seat count changed", () => {
      const list = deriveDesks(12, 3);
      const edited = list.map((d, i) => (i === 1 ? { ...d, seats: 5 } : d));
      const { chairs } = classroomLayout(room, 0.5, edited, "standard");
      expect(chairs).toHaveLength(14);
      expect(chairs.filter((c) => c.deskId === edited[1].id)).toHaveLength(5);
      expect(chairs.filter((c) => c.deskId === edited[0].id)).toHaveLength(3);
    });

    it("clamps a desk's seats to what fits across the room", () => {
      const max = maxSeatsPerDesk(room, "standard");
      const [d] = deriveDesks(3, 3);
      const { chairs } = classroomLayout(room, 0.5, [{ ...d, seats: max + 5 }], "standard");
      expect(chairs).toHaveLength(max);
    });

    // Review Focus 1 — a clamp, not a filter: the desk must stay on the canvas to be selectable.
    it("clamps a desk to at least one seat", () => {
      const [d] = deriveDesks(3, 3);
      const { chairs, desks } = classroomLayout(room, 0.5, [{ ...d, seats: 0 }], "standard");
      expect(chairs).toHaveLength(1);
      expect(desks.map((x) => x.deskId)).toEqual([d.id]);
    });

    it("moves a desk and all of its chairs by the same vector", () => {
      const [d] = deriveDesks(3, 3);
      const base = classroomLayout(room, 0.5, [d], "standard");
      const moved = classroomLayout(room, 0.5, [{ ...d, dx: 0.4, dy: 0.3 }], "standard");
      expect(moved.desks[0].x - base.desks[0].x).toBeCloseTo(0.4, 6);
      expect(moved.desks[0].y - base.desks[0].y).toBeCloseTo(0.3, 6);
      expect(moved.chairs).toHaveLength(base.chairs.length);
      moved.chairs.forEach((c, i) => {
        expect(c.deskId).toBe(d.id);
        expect(c.x - base.chairs[i].x).toBeCloseTo(0.4, 6);
        expect(c.y - base.chairs[i].y).toBeCloseTo(0.3, 6);
      });
    });

    // Review Focus 5 — all four walls, for the desk and its chairs.
    it.each([[99, 99], [-99, -99], [99, -99], [-99, 99]])("clamps a desk displaced by (%s, %s) back inside the room", (dx, dy) => {
      const [d] = deriveDesks(3, 3);
      const { desks, chairs } = classroomLayout(room, 0.5, [{ ...d, dx, dy }], "standard");
      const [desk] = desks;
      const e = 1e-6;
      expect(desk.x + room.length / 2).toBeGreaterThanOrEqual(-e);
      expect(desk.x + desk.w + room.length / 2).toBeLessThanOrEqual(room.length + e);
      expect(desk.y + room.width / 2).toBeGreaterThanOrEqual(-e);
      expect(desk.y + desk.h + room.width / 2).toBeLessThanOrEqual(room.width + e);
      expect(chairs).toHaveLength(3);
      chairs.forEach((c) => {
        expect(c.x).toBeGreaterThanOrEqual(desk.x - e);
        expect(c.x).toBeLessThanOrEqual(desk.x + desk.w + e);
        expect(c.y - 0.3 + room.width / 2).toBeGreaterThanOrEqual(-e);
        expect(c.y + 0.3 + room.width / 2).toBeLessThanOrEqual(room.width + e);
      });
    });

    it("treats a non-finite offset as no offset", () => {
      const [d] = deriveDesks(3, 3);
      const base = classroomLayout(room, 0.5, [d], "standard");
      const bad = classroomLayout(room, 0.5, [{ ...d, dx: NaN, dy: Infinity }], "standard");
      expect(bad.desks[0].x).toBeCloseTo(base.desks[0].x, 6);
      expect(bad.desks[0].y).toBeCloseTo(base.desks[0].y, 6);
    });
  });

  // Spec §11.1 — a shape guard, not a pixel guard. The user has accepted that an
  // existing shared link may render slightly differently, so this deliberately does
  // NOT assert coordinates: the new packing distributes a row's seats differently
  // from balancedSplit at the edges, and that is allowed. It still catches a rewrite
  // that produces an overlapping, empty or out-of-bounds room.
  it("still produces a sane classroom for a plan with both fields null", () => {
    const { chairs, tableShape } = generateLayout("classroom", room, table, 12, {}, "standard");
    expect(chairs).toHaveLength(12);
    expect(tableShape.type).toBe("desks");
    expect(tableShape.desks.length).toBeGreaterThan(0);
    expectSaneDesks(room, tableShape.desks);
  });

  // A whole desk can be neither split across rows nor hung over a wall, so the seat
  // count the planner is offered has to be counted in desks.
  describe("the seat count the room is offered never overflows it", () => {
    // 9 x 3 m held 2 rows but was offered 18 seats, which derive as desks of 6, 6, 6 —
    // two of those need 8.2 m against 7.8 m usable, so they packed into 3 rows and the
    // back row's desks landed outside the back wall.
    const shallow = { length: 9, width: 3, height: 2.8 };

    it("offers only the seats whole desks fit, and lays them out inside the walls", () => {
      const max = getMaxChairsForLayout("classroom", shallow, table);
      expect(max).toBe(17); // 2 rows x one 6-seat desk, plus the 5-seat remainder desk
      const r = generateLayout("classroom", shallow, table, max);
      expect(r.chairs).toHaveLength(17);
      expect(rowsOfDesks(r.tableShape.desks)).toHaveLength(2);
      expectSaneDesks(shallow, r.tableShape.desks);
    });

    it("holds for every seat count up to that limit", () => {
      const max = getMaxChairsForLayout("classroom", shallow, table);
      for (let n = 2; n <= max; n++) {
        const r = generateLayout("classroom", shallow, table, n);
        expect(r.chairs).toHaveLength(n);
        expectSaneDesks(shallow, r.tableShape.desks);
      }
    });

    // Too narrow for a full desk, an oversized desk is capped to the row's width and drawn,
    // so depth buys rows. The figure is checked against the renderer, not a hand count:
    // one capped desk per row, that many rows, all inside the four walls.
    describe("in a room too narrow for a full desk", () => {
      const rooms = [[3, 6], [3, 9], [4.5, 6], [4.5, 9], [2.5, 7], [4, 8]].map(([length, width]) => ({ length, width, height: 2.8 }));
      const depth = CLASSROOM_DESK_DEPTH.default;
      const drawnAt = (r, cap) => {
        const across = maxSeatsPerDesk(r, "standard");
        const list = Array.from({ length: Math.ceil(cap / across) }, (_, i) => ({ id: `d${i}`, seats: across }));
        return classroomLayout(r, depth, list, "standard");
      };

      it.each(rooms.map((r) => [`${r.length} x ${r.width} m`, r]))("%s: every seat offered is drawn inside the walls", (_, r) => {
        const max = getMaxChairsForLayout("classroom", r, table);
        const { chairs, desks } = drawnAt(r, max);
        expect(chairs).toHaveLength(max);
        expectSaneDesks(r, desks);
        chairs.forEach((c) => {
          expect(Math.abs(c.x)).toBeLessThanOrEqual(r.length / 2 + 1e-6);
          expect(Math.abs(c.y)).toBeLessThanOrEqual(r.width / 2 + 1e-6);
        });
      });

      it("offers more seats the deeper the room, at the same width", () => {
        const at = (width) => getMaxChairsForLayout("classroom", { length: 3, width, height: 2.8 }, table);
        expect(at(9)).toBeGreaterThan(at(6));
        expect(at(6)).toBeGreaterThan(at(3));
      });

      it("offers 18 in 3 x 9 m, and the renderer draws all 18", () => {
        const r = { length: 3, width: 9, height: 2.8 };
        expect(getMaxChairsForLayout("classroom", r, table)).toBe(18);
        expect(drawnAt(r, 18).chairs).toHaveLength(18);
      });
    });

    it("still renders a hand-edited list that overflows, rather than dropping desks", () => {
      // The one case that can still look wrong: a shared link carrying more desks than
      // the room holds. Losing seats silently would be worse, so they all render.
      const list = deriveDesks(30, 6);
      const r = generateLayout("classroom", shallow, table, 30, {}, "standard", { desks: list });
      expect(r.tableShape.desks).toHaveLength(list.length);
      expect(r.chairs).toHaveLength(30);
    });
  });

  it("loads a plan saved before per-desk seating, which has neither field", () => {
    const base = initialPlan();
    const old = { ...base, room, roomEntered: { length: true, width: true, height: true }, layout: "classroom", chairCount: 12 };
    delete old.desks;
    delete old.seatsPerDesk;
    const p = settle(base, old);
    const r = generateLayout(p.layout, p.room, p.table, p.chairCount, p.podOverrides, p.seatingDensity, {
      desks: p.desks,
      seatsPerDesk: p.seatsPerDesk,
    });
    expect(r.chairs).toHaveLength(12);
    expectSaneDesks(p.room, r.tableShape.desks);
  });

  // Spec §11.8 — Theater shares rowSeatingLayout and must not move.
  it("leaves theater seating unchanged by seatsPerDesk", () => {
    const a = generateLayout("theater", room, table, 20, {}, "standard");
    const b = generateLayout("theater", room, table, 20, {}, "standard", { seatsPerDesk: 2 });
    expect(b.chairs).toEqual(a.chairs);
  });
});

// Spec §8.1 — the recommendation engine quotes the seats the desks actually carry, not
// the headcount the room was set up with, and a classroom's total isn't clamped on load.
describe("the derived classroom seat total", () => {
  const room = { length: 12, width: 8, height: 2.8 };
  const desksOf = (...seats) => seats.map((n, i) => ({ id: `desk-${i}`, seats: n, dx: 0, dy: 0, seatsSetByHand: true }));
  const gridSeats = (n) => Array.from({ length: n }, (_, i) => ({ x: 1 + (i % 6), y: 1 + Math.floor(i / 6), angle: 0 }));
  const classroomSoundbar = (headcount, desks) => ({
    ...makeState({ seats: gridSeats(headcount), room }),
    layout: "classroom",
    audioPreference: SOUNDBAR_AUDIO,
    desks,
    seatsPerDesk: 6,
  });

  it("quotes the derived total in the advice, not the setup headcount", () => {
    // 14 seats on the desks while chairCount still reads the old headcount of 8.
    const recs = buildRecommendations(classroomSoundbar(8, desksOf(6, 6, 2)));
    const speakers = recs.find((r) => r.id === "soundbar-speakers");
    const mics = recs.find((r) => r.id === "soundbar-microphones");
    expect(speakers.text).toContain("all 14 can hear");
    expect(mics.text).toContain("all 14 are heard");
    expect(speakers.text).not.toMatch(/\b8\b/);
  });

  it("reports the derived total for a materialised classroom plan", () => {
    expect(planSeatTotal({ layout: "classroom", chairCount: 12, desks: desksOf(6, 6, 2) })).toBe(14);
  });

  it("reports chairCount for every other layout", () => {
    expect(planSeatTotal({ layout: "rectangular", chairCount: 8, desks: desksOf(6, 6, 2) })).toBe(8);
  });

  // A plan saved before per-desk seating, or one hand-edited into nonsense, must still
  // give a number: no desk list means "not materialised", and a bad desk is worth 0.
  it("falls back to chairCount when the desk list isn't materialised", () => {
    expect(planSeatTotal({ layout: "classroom", chairCount: 12, desks: null })).toBe(12);
    expect(planSeatTotal({ layout: "classroom", chairCount: 12, desks: [] })).toBe(12);
    expect(planSeatTotal({ layout: "classroom", chairCount: 12 })).toBe(12);
    // A malformed desk is worth one seat, not none — see seatsOnDesk.
    expect(planSeatTotal({ layout: "classroom", chairCount: 12, desks: [{ seats: 6 }, null, { seats: "x" }] })).toBe(8);
  });

  // A shared link's desk list is whatever it was hand-edited to, and it prints. What it
  // prints has to be the number of chairs on the diagram beside it, so the quote is
  // asserted against the layout rather than against a hand-computed figure: one rule,
  // one place (seatsOnDesk), and this is what catches the two drifting apart again.
  describe("agrees with the chairs the classroom draws, however the list was edited", () => {
    const deskTable = { length: 3, width: 1.2, orientation: 0, deskDepth: CLASSROOM_DESK_DEPTH.default };
    const quoted = (desks, r = room) => planSeatTotal({ layout: "classroom", chairCount: 12, desks, room: r, seatingDensity: "standard" });
    const drawn = (desks, r = room) => classroomLayout(r, deskTable.deskDepth, desks, "standard").chairs.length;
    const agree = (desks, r = room) => {
      expect(quoted(desks, r)).toBe(drawn(desks, r));
      return quoted(desks, r);
    };

    it("on a malformed desk among good ones — one seat, not none", () => {
      expect(agree([{ id: "a", seats: 6 }, { id: "b", seats: "x" }])).toBe(7);
    });

    it("on a list where every desk is malformed — one seat each, no fallback", () => {
      expect(agree([null, { seats: "x" }, {}])).toBe(3);
      expect(agree(desksOf(-6, -2))).toBe(2);
    });

    it("on fractional seats — floored, not rounded", () => {
      expect(agree(desksOf(6.5, 8.5))).toBe(14);
    });

    it("on an oversized desk — capped to what the room's rows hold", () => {
      const narrow = { length: 6.5, width: 4.5, height: 2.8 };
      const cap = maxSeatsPerDesk(narrow, "standard");
      expect(cap).toBeLessThan(40); // the cap has to bite for this to test anything
      expect(agree(desksOf(40), narrow)).toBe(cap);
    });

    // buildRecommendations is called with bare states all over these suites, and the
    // report's own state can reach planSeatTotal before a room is entered.
    it("skips the cap, rather than throwing, when the state carries no room", () => {
      expect(planSeatTotal({ layout: "classroom", chairCount: 12, desks: desksOf(40) })).toBe(40);
      expect(planSeatTotal({ layout: "classroom", chairCount: 12, desks: desksOf(6, 6), room })).toBe(12);
    });
  });

  it("does not clamp a classroom plan's total, and still clamps a rectangular one", () => {
    const base = initialPlan();
    const small = { length: 4, width: 3, height: 2.8 };
    const over = (layout) => {
      const max = getChairLimits(layout, small, base.table, base.seatingDensity, base.seatsPerDesk)[1];
      return { plan: { ...base, room: small, layout, chairCount: max + 6 }, max };
    };
    const classroom = over("classroom");
    expect(fitOccupancy(classroom.plan).chairCount).toBe(classroom.max + 6);
    const rectangular = over("rectangular");
    expect(fitOccupancy(rectangular.plan).chairCount).toBe(rectangular.max);
  });
});
