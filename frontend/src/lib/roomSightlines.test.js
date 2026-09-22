import { placedScreens, placedCameras, seatExperience, roomSightlineSummary } from "./roomSightlines";

const room = { length: 8, width: 5, height: 2.8 };
const emptyDevices = () => ({
  display: [],
  allInOne: [],
  camera: [],
  videoBar: [],
  microphone: [],
  speaker: [],
  touchPanel: [],
  contentSharing: [],
  door: [],
  bookingPanel: [],
});

// A 75" screen centred on the left wall, facing into the room (90° = along +x).
const withScreen = () => ({ ...emptyDevices(), display: [{ id: "d1", x: 0, y: 2.5, angle: 90, sizeInches: 75, mount: "wall" }] });

describe("roomSightlines", () => {
  it("hangs a wall screen just off the wall, below the ceiling", () => {
    const [s] = placedScreens(withScreen(), room);
    expect(s.x).toBeCloseTo(0.06);
    expect(s.bottom + s.height).toBeLessThan(room.height);
    expect(s.width).toBeCloseTo(1.66, 1);
  });

  it("rates a close, straight-on seat as good and a far one as worse", () => {
    const devices = withScreen();
    const screens = placedScreens(devices, room);
    const seats = [
      { x: 2.5, y: 2.5, angle: 270 },
      { x: 7.8, y: 2.5, angle: 270 },
    ];
    const ctx = { seats, screens, cameras: [] };
    const near = seatExperience(0, ctx);
    expect(near.best.ratings.distance).toBe("good");
    expect(near.best.offAxis).toBeCloseTo(0);
    expect(near.best.turn).toBeCloseTo(0);
    // The far seat looks straight past the near seat's head.
    const far = seatExperience(1, ctx);
    expect(far.best.distance).toBeGreaterThan(near.best.distance);
    expect(far.best.blockedBy).toContain(0);
    expect(far.best.ratings.sightline).not.toBe("good");
  });

  it("says which camera sees a seat's face, and not one behind them", () => {
    const devices = { ...withScreen(), camera: [{ id: "c1", x: 0, y: 2.5, angle: 90, fov: 90, mountedOn: "d1" }] };
    const screens = placedScreens(devices, room);
    const cameras = placedCameras(devices, screens);
    expect(cameras[0].z).toBeGreaterThan(screens[0].bottom + screens[0].height);
    const seats = [
      { x: 3, y: 2.5, angle: 270 }, // facing the screen wall
      { x: 3, y: 1.5, angle: 90 }, // back to it
    ];
    const ctx = { seats, screens, cameras };
    expect(seatExperience(0, ctx).seenBy.map((c) => c.code)).toEqual(["C1"]);
    expect(seatExperience(1, ctx).cameraRating).toBe("poor");
    expect(roomSightlineSummary(ctx).unseen).toBe(1);
  });
});

describe("camera on the display", () => {
  const { bestMountSide, createPlacedDevice } = require("./roomConfiguratorEngine");
  const room = { length: 6, width: 4.5, height: 2.8 };
  const display = { id: "d1", x: 0, y: 2.25, angle: 90, mount: "wall", sizeInches: 65 };
  const ctx = { room, layout: "rectangular", table: { length: 3, width: 1.2, orientation: 0 }, tableOffset: { x: 0, y: 0 }, devices: { display: [display], allInOne: [], camera: [], videoBar: [] }, seats: [] };

  test("the first one goes on the edge nearer seated eye height, and the switch moves it", () => {
    const bar = createPlacedDevice("videoBar", ctx, { fov: 120 });
    expect(bar).toMatchObject({ mountedOn: "d1", mountSide: "below" });
    expect(bestMountSide(display, room, "dshape")).toBe("above");
    const screens = placedScreens({ display: [display], allInOne: [] }, room);
    const z = (side) => placedCameras({ camera: [], videoBar: [{ ...bar, mountSide: side }], allInOne: [] }, screens)[0].z;
    expect(z("above")).toBeGreaterThan(screens[0].bottom + screens[0].height);
    expect(z("below")).toBeLessThan(screens[0].bottom);
  });
});
