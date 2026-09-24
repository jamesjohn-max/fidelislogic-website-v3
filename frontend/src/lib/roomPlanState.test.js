import { initialHistory, initialPlan, planReducer, settle } from "./roomPlanState";
import { ROOM_TEMPLATES, TEMPLATE_IDS, buildTemplatePlan, templateSeats } from "./roomTemplates";
import { buildRecommendations, classifyRoomType, generateLayout, getChairLimits, micCoverage, occupancyLimit, placedSeats } from "./roomConfiguratorEngine";

const update = (state, patch, extra = {}) => planReducer(state, { type: "update", patch, ...extra });
const template = (state, id) => planReducer(state, { type: "template", id });
const withRoom = (length, width) => (p) => ({ room: { ...p.room, length, width }, roomEntered: { length: true, width: true, height: true } });
const count = (devices) => Object.fromEntries(Object.entries(devices).filter(([, list]) => list.length).map(([k, list]) => [k, list.length]));

describe("room templates", () => {
  const recsFor = (plan) => {
    const { chairs } = generateLayout(plan.layout, plan.room, plan.table, plan.chairCount, {}, plan.seatingDensity);
    const seats = placedSeats(chairs, plan.room, plan.tableOffset);
    return buildRecommendations({ ...plan, seats, chairCount: seats.length });
  };

  test("each size is the room type it's named for, seats its people, and has the kit asked for", () => {
    expect(TEMPLATE_IDS.map((id) => classifyRoomType(ROOM_TEMPLATES[id]))).toEqual(["Small Room", "Medium Room", "Large Room"]);
    const kits = Object.fromEntries(TEMPLATE_IDS.map((id) => [id, count(buildTemplatePlan(id).devices)]));
    expect(kits.small).toEqual({ allInOne: 1, door: 1, touchPanel: 1, bookingPanel: 1 });
    expect(kits.medium).toEqual({ display: 1, videoBar: 1, microphone: 1, door: 1, touchPanel: 1, bookingPanel: 1 });
    expect(kits.large).toMatchObject({ display: 1, camera: 1, door: 1, touchPanel: 1, bookingPanel: 1 });
    // Ceiling arrays pick up ~5 m, so the large room needs few — but every seat heard.
    expect(kits.large.microphone).toBeGreaterThanOrEqual(1);
    const large = buildTemplatePlan("large");
    const { chairs } = generateLayout(large.layout, large.room, large.table, large.chairCount, {}, large.seatingDensity);
    expect(micCoverage({ ...large, seats: placedSeats(chairs, large.room, large.tableOffset) }).unheard).toEqual([]);
    expect(kits.large.speaker).toBeGreaterThan(1);
    // Started in the planner, a template seats no more than its room's occupancy.
    TEMPLATE_IDS.forEach((id) => {
      const plan = template(initialHistory(), id).present;
      expect(plan.chairCount).toBe(templateSeats(id));
      expect(plan.chairCount).toBeLessThanOrEqual(occupancyLimit(plan.room));
      expect(getChairLimits(plan.layout, plan.room, plan.table)[1]).toBeGreaterThanOrEqual(plan.chairCount);
    });
  });

  test("the video bar or camera is mounted on top of the display", () => {
    ["medium", "large"].forEach((id) => {
      const { display, camera, videoBar } = buildTemplatePlan(id).devices;
      const cam = [...camera, ...videoBar][0];
      expect(cam).toMatchObject({ x: display[0].x, y: display[0].y, mountedOn: display[0].id });
    });
  });

  test("start with no essentials missing and every seat seen face-on", () => {
    TEMPLATE_IDS.forEach((id) => {
      const recs = recsFor(buildTemplatePlan(id));
      expect(recs.filter((r) => r.level === "essential")).toEqual([]);
      expect(recs.map((r) => r.id)).not.toContain("camera-coverage");
    });
  });

  test("the kit is rebuilt for the real room until a device is changed by hand", () => {
    let state = template(update(initialHistory(), { audience: "reseller" }), "medium");
    const screenBefore = state.present.devices.display[0];
    state = update(state, withRoom(8, 5.5));
    const screenAfter = state.present.devices.display[0];
    expect(screenAfter.id).toBe(screenBefore.id);
    expect(screenAfter.y).toBeCloseTo(2.75);
    expect(state.present.templateDevices).toBe(true);

    state = update(state, (p) => ({ devices: { ...p.devices, display: [{ ...p.devices.display[0], x: 0, y: 1 }] } }));
    expect(state.present.templateDevices).toBe(false);
    state = update(state, withRoom(9, 6));
    expect(state.present.devices.display[0].y).toBe(1);
  });

  test("custom build after a template clears what the template set up; undo brings it back", () => {
    let state = template(initialHistory(), "large");
    state = update(state, { floorType: "Carpet" });
    state = template(state, "custom");
    expect(state.present).toMatchObject({ template: "custom", layout: null, chairCount: 0, floorType: "Carpet" });
    expect(count(state.present.devices)).toEqual({ door: 1 });
    state = planReducer(state, { type: "undo" });
    expect(state.present.template).toBe("large");
    expect(count(state.present.devices).camera).toBe(1);
  });
});

describe("keeping the plan in order", () => {
  const boardroom = () => update(template(initialHistory(), "medium"), { templateDevices: false });

  test("a smaller room shrinks the table and the seats to fit", () => {
    const state = update(boardroom(), withRoom(4, 3));
    const { table, chairCount, room, layout, seatingDensity } = state.present;
    expect(table.length).toBeLessThanOrEqual(room.length - 2);
    expect(chairCount).toBeLessThanOrEqual(getChairLimits(layout, room, table, seatingDensity)[1]);
  });

  test("chairs removed by hand survive a bigger room, but not a new seat count", () => {
    let state = update(boardroom(), { removedChairs: [0] });
    state = update(state, withRoom(8, 6));
    expect(state.present.removedChairs).toEqual([0]);
    expect(state.present.seatEditsCleared).toBe(0);
    state = update(state, { chairCount: 6 });
    expect(state.present.removedChairs).toEqual([]);
    expect(state.present.seatEditsCleared).toBe(1);
  });

  test("the table group stays inside the walls", () => {
    const state = update(boardroom(), { tableOffset: { x: 50, y: -50 } });
    const { tableOffset, room, table } = state.present;
    expect(Math.abs(tableOffset.x)).toBeLessThan(room.length / 2);
    expect(Math.abs(tableOffset.y)).toBeLessThan(room.width / 2);
    expect(settle(state.present, state.present)).toBe(state.present);
    expect(table).toBe(state.present.table);
  });
});

describe("a new plan", () => {
  test("starts with a door on the back wall that follows the room until moved", () => {
    expect(count(initialPlan().devices)).toEqual({ door: 1 });
    const state = update(initialHistory(), withRoom(8, 5));
    expect(state.present.devices.door[0]).toMatchObject({ y: 5, edge: "bottom", autoPlace: true });
  });
});

describe("undo history", () => {
  test("undo and redo step through changes, and a new change clears redo", () => {
    let state = update(initialHistory(), { platform: "Zoom Rooms" });
    state = update(state, { platform: "Google Meet" });
    state = planReducer(state, { type: "undo" });
    expect(state.present.platform).toBe("Zoom Rooms");
    state = planReducer(state, { type: "redo" });
    expect(state.present.platform).toBe("Google Meet");
    state = planReducer(state, { type: "undo" });
    state = update(state, { floorType: "Tile" });
    expect(state.future).toEqual([]);
  });

  test("typing in one field is one step, and a change that changes nothing isn't a step", () => {
    let state = initialHistory();
    ["N", "No", "Not"].forEach((text, i) => {
      state = update(state, { additionalNotes: text }, { coalesce: "notes", now: 1000 + i * 100 });
    });
    expect(state.past).toHaveLength(1);
    expect(update(state, { additionalNotes: "Not" }, { coalesce: "notes", now: 1500 })).toBe(state);
    expect(planReducer(state, { type: "undo" }).present.additionalNotes).toBe(initialPlan().additionalNotes);
  });
});

describe("customer display", () => {
  test("a customer's plan gets a display sized for the room, and it follows the room", () => {
    const start = update(initialHistory(), { audience: "customer" });
    const [display] = start.present.devices.display;
    expect(display).toMatchObject({ autoPlace: true, autoSize: true, mount: "wall" });
    const bigger = update(start, withRoom(12, 8));
    expect(bigger.present.devices.display[0].sizeInches).toBeGreaterThan(display.sizeInches);
  });

  test("a reseller's plan still starts without one", () => {
    expect(update(initialHistory(), { audience: "reseller" }).present.devices.display).toHaveLength(0);
  });
});

describe("chairs and the screen", () => {
  const { faceChairsToScreen } = require("./roomConfiguratorEngine");
  const room = { length: 6, width: 4, height: 2.8 };
  // Two chairs either side of the middle, facing each other across a table: the first
  // looks down the plan, the second up it.
  const chairs = [{ x: 0, y: -1, angle: 180 }, { x: 0, y: 1, angle: 0 }];

  test("a chair with its back to the moved screen is turned to face it, the other left alone", () => {
    // Screen moved to the top wall: the first chair has its back to it, the second sees it.
    const offsets = faceChairsToScreen({ chairs, room, chairOffsets: {} }, { x: 3, y: 0.2 });
    expect(offsets[0].angle).toBe(0);
    expect(offsets[1]).toBeUndefined();
    // Moved to the bottom wall instead: now the second chair is the one turned.
    const other = faceChairsToScreen({ chairs, room, chairOffsets: {} }, { x: 3, y: 3.8 });
    expect(other[0]).toBeUndefined();
    expect(other[1].angle).toBe(180);
    // A chair keeps any place it was nudged to; only its facing changes.
    const nudged = faceChairsToScreen({ chairs, room, chairOffsets: { 0: { dx: 0.3, dy: 0.2 } } }, { x: 3, y: 0.2 });
    expect(nudged[0]).toMatchObject({ dx: 0.3, dy: 0.2 });
  });
});

describe("audience switch", () => {
  test("switching to the reseller path takes the automatic display away again", () => {
    const customer = update(initialHistory(), { audience: "customer" });
    expect(customer.present.devices.display).toHaveLength(1);
    expect(update(customer, { audience: "reseller" }).present.devices.display).toHaveLength(0);
  });
});

describe("the screen's side of the table", () => {
  const { freeRectEdge, generateLayout } = require("./roomConfiguratorEngine");
  // A boardroom with its display on the left-hand wall, as a landscape table starts.
  const start = () =>
    update(initialHistory(), (p) => ({
      audience: "reseller",
      layout: "rectangular",
      room: { length: 8, width: 5, height: 2.8 },
      roomEntered: { length: true, width: true, height: true },
      table: { ...p.table, length: 3.6, width: 1.4, orientation: 0, screenEndFree: true },
      chairCount: 8,
      devices: { ...p.devices, display: [{ id: "d1", x: 0, y: 2.5, angle: 90, mount: "wall", sizeInches: 75 }] },
    }));
  // How many chairs sit along the given side, by the way they face: a chair on the
  // left-hand side of the table looks right across it, and so on.
  const EDGE_FACING = { top: 180, right: 270, bottom: 0, left: 90 };
  const onEdge = (plan, edge) => {
    const { chairs } = generateLayout(plan.layout, plan.room, plan.table, plan.chairCount, {}, plan.seatingDensity);
    return chairs.filter((c) => c.angle === EDGE_FACING[edge]).length;
  };

  test("the side the screen is on has no chairs, wherever the screen is moved", () => {
    const state = start();
    expect(freeRectEdge(state.present.table)).toBe("left");
    expect(onEdge(state.present, "left")).toBe(0);
    expect(onEdge(state.present, "bottom")).toBeGreaterThan(0);

    // Moved to the wall down the side of the room: that long side empties instead, and
    // every chair it held moves round to the other three.
    const moved = update(state, (p) => ({ devices: { ...p.devices, display: [{ ...p.devices.display[0], x: 4, y: 5, angle: 0 }] } }));
    expect(freeRectEdge(moved.present.table)).toBe("bottom");
    expect(onEdge(moved.present, "bottom")).toBe(0);
    expect(onEdge(moved.present, "left")).toBeGreaterThan(0);
    // No seats are lost on the way — the count only drops if that side can't hold them.
    expect(moved.present.chairCount).toBe(state.present.chairCount);
  });
});
