import {
  resolveMicRange, resolveSpeakerRange, MIN_RANGE_M, micSources, speakerSources, speakerCoverageReport, micCoverageReport,
  VIDEO_BAR_MIC_RANGE_M, TABLE_MIC_RANGE_M, TABLE_CAM_MIC_RANGE_M, WALL_SPEAKER_RANGE_M, SOUNDBAR_RANGE_M,
  VIDEO_BAR_SPEAKER_RANGE_M, ALL_IN_ONE_SPEAKER_RANGE_M,
} from "./roomAudioCoverage";
import { typicalAllInOneMicReach } from "./roomConfiguratorEngine";

const room = { length: 8, width: 5, height: 2.8 };
const base = (audio = {}) => ({ room, audioPreference: "Ceiling Microphone Array", audio: { micRange: null, speakerRange: null, ...audio } });

// Later tasks add tests to this file that need an empty device bag. Copy `emptyDevices`
// from `roomSightlines.test.js:4` — every category as an empty array — rather than
// importing it; the existing suites each keep their own local copy.
const emptyDevices = () => ({ display: [], allInOne: [], camera: [], videoBar: [], microphone: [], speaker: [], touchPanel: [], contentSharing: [], door: [], bookingPanel: [] });

describe("range resolution", () => {
  it("prefers a device override over the room-wide default", () => {
    expect(resolveMicRange({ micRange: 2 }, "microphone", base({ micRange: 6 }))).toBe(2);
  });

  it("uses the room-wide default when the device has no override", () => {
    expect(resolveMicRange({}, "microphone", base({ micRange: 6 }))).toBe(6);
  });

  it("derives when neither is set", () => {
    // ceiling array, 2.8 m ceiling, 1.2 m seated head => sqrt(25 - 1.6^2)
    expect(resolveMicRange({}, "microphone", base())).toBeCloseTo(4.736, 2);
  });

  it("leaves an overridden device alone when the room-wide default changes", () => {
    const device = { micRange: 2 };
    expect(resolveMicRange(device, "microphone", base({ micRange: 6 }))).toBe(2);
    expect(resolveMicRange(device, "microphone", base({ micRange: 9 }))).toBe(2);
  });

  it("follows the room-wide default again once the override is deleted", () => {
    const { micRange, ...reset } = { micRange: 2 };
    expect(resolveMicRange(reset, "microphone", base({ micRange: 9 }))).toBe(9);
  });

  it("shrinks a ceiling source's floor radius as the ceiling rises", () => {
    const low = resolveMicRange({}, "microphone", { ...base(), room: { ...room, height: 2.6 } });
    const high = resolveMicRange({}, "microphone", { ...base(), room: { ...room, height: 3.4 } });
    expect(high).toBeLessThan(low);
  });

  // Review Focus 1
  it.each([0, -3, NaN, undefined])("clamps a bad room-wide range (%p) to the floor", (bad) => {
    expect(resolveSpeakerRange({}, "speaker", base({ speakerRange: bad }))).toBeGreaterThanOrEqual(MIN_RANGE_M);
  });

  it("clamps a bad device override to the floor", () => {
    expect(resolveSpeakerRange({ speakerRange: -1 }, "speaker", base())).toBe(MIN_RANGE_M);
  });
});

describe("coverage sources and reports", () => {
  it("gives a video bar one mic source and one speaker source, ranged independently", () => {
    const state = { ...base(), seats: [], devices: { ...emptyDevices(), videoBar: [{ id: "v1", x: 4, y: 0.2, micRange: 3, speakerRange: 8 }] } };
    expect(micSources(state).map((s) => s.range)).toEqual([3]);
    expect(speakerSources(state).map((s) => s.range)).toEqual([8]);
  });

  it("counts a 360 camera as a mic source and never as a speaker source", () => {
    const state = { ...base(), seats: [], devices: { ...emptyDevices(), camera: [{ id: "c1", x: 4, y: 2.5, isTableCam: true }] } };
    expect(micSources(state)).toHaveLength(1);
    expect(speakerSources(state)).toHaveLength(0);
  });

  it("marks a device with an override as custom", () => {
    const state = { ...base(), seats: [], devices: { ...emptyDevices(), speaker: [{ id: "s1", x: 4, y: 2.5, speakerRange: 7 }, { id: "s2", x: 2, y: 2.5 }] } };
    expect(speakerSources(state).map((s) => s.isCustom)).toEqual([true, false]);
  });

  it("reports the seats a source does not reach", () => {
    const seats = [{ x: 1, y: 2.5 }, { x: 7, y: 2.5 }];
    const state = { ...base(), seats, devices: { ...emptyDevices(), speaker: [{ id: "s1", x: 1, y: 2.5, speakerRange: 1 }] } };
    const report = speakerCoverageReport(state);
    expect(report.covered).toBe(1);
    expect(report.uncovered).toEqual([1]);
  });

  it("reports mic coverage from every mic source", () => {
    const seats = [{ x: 1, y: 1 }, { x: 7, y: 1 }];
    const state = { ...base(), seats, devices: { ...emptyDevices(), microphone: [{ id: "m1", x: 1, y: 1, micRange: 2 }] } };
    expect(micCoverageReport(state)).toMatchObject({ seats: 2, covered: 1, uncovered: [1] });
  });

  // Review Focus 3
  it("handles a plan with no seats without claiming coverage", () => {
    const state = { ...base(), seats: [], devices: { ...emptyDevices(), speaker: [{ id: "s1", x: 4, y: 2.5 }] } };
    expect(speakerCoverageReport(state)).toMatchObject({ seats: 0, covered: 0, uncovered: [] });
  });

  // Spec §9.5 — a wall source's reach past the wall must not become coverage
  it("never counts a point outside the room as covered", () => {
    // A wall speaker at x=0 with an 8 m range in an 8x5 room: its disc extends well past
    // every wall, but only real seats count.
    const seats = [{ x: 1, y: 2.5 }, { x: 7.5, y: 2.5 }];
    const state = { ...base(), seats, devices: { ...emptyDevices(), speaker: [{ id: "s1", x: 0, y: 2.5, mount: "wall", speakerRange: 8 }] } };
    const report = speakerCoverageReport(state);
    expect(report.covered).toBe(2);
    expect(report.seats).toBe(2);
  });

  // Spec §9.9 — overlay parity
  it("renders in show-all exactly the union of every per-device source", () => {
    const state = { ...base(), seats: [], devices: { ...emptyDevices(), speaker: [{ id: "s1", x: 2, y: 2 }, { id: "s2", x: 6, y: 3 }], microphone: [{ id: "m1", x: 4, y: 2.5 }] } };
    const all = [...micSources(state), ...speakerSources(state)].map((s) => s.id).sort();
    expect(all).toEqual(["m1", "s1", "s2"]);
  });
});

describe("derived ranges reached through the sources", () => {
  const withDevices = (devices, extra = {}) => ({ ...base(), ...extra, seats: [], devices: { ...emptyDevices(), ...devices } });
  const mic = (devices, extra) => micSources(withDevices(devices, extra)).map((s) => s.range);
  const spk = (devices, extra) => speakerSources(withDevices(devices, extra)).map((s) => s.range);

  it("uses an all-in-one's explicit micReach", () => {
    expect(mic({ allInOne: [{ id: "a1", x: 1, y: 1, micReach: 2.5 }] })).toEqual([2.5]);
  });
  it("falls back to the typical all-in-one reach for its size", () => {
    expect(mic({ allInOne: [{ id: "a1", x: 1, y: 1, sizeInches: 75 }] })).toEqual([typicalAllInOneMicReach(75)]);
  });
  it("derives a video bar mic range", () => {
    expect(mic({ videoBar: [{ id: "v1", x: 1, y: 1 }] })).toEqual([VIDEO_BAR_MIC_RANGE_M]);
  });
  it("derives a table-preference dedicated mic range", () => {
    expect(mic({ microphone: [{ id: "m1", x: 1, y: 1 }] }, { audioPreference: "Table Microphone Pods" })).toEqual([TABLE_MIC_RANGE_M]);
  });
  it("derives a 360 camera mic range and skips a front camera", () => {
    expect(mic({ camera: [{ id: "c1", x: 1, y: 1 }, { id: "c2", x: 2, y: 1, isTableCam: true }] })).toEqual([TABLE_CAM_MIC_RANGE_M]);
  });

  it("derives wall, table, video bar and all-in-one speaker ranges", () => {
    expect(spk({ speaker: [{ id: "s1", x: 0, y: 1, mount: "wall" }] })).toEqual([WALL_SPEAKER_RANGE_M]);
    expect(spk({ speaker: [{ id: "s1", x: 0, y: 1, mount: "table" }] })).toEqual([SOUNDBAR_RANGE_M]);
    expect(spk({ videoBar: [{ id: "v1", x: 1, y: 1 }] })).toEqual([VIDEO_BAR_SPEAKER_RANGE_M]);
    expect(spk({ allInOne: [{ id: "a1", x: 1, y: 1 }] })).toEqual([ALL_IN_ONE_SPEAKER_RANGE_M]);
  });

  it("falls through a non-finite device override to the room-wide value", () => {
    const state = withDevices({ speaker: [{ id: "s1", x: 1, y: 1, speakerRange: NaN }] }, { audio: { micRange: null, speakerRange: 6 } });
    expect(speakerSources(state).map((s) => s.range)).toEqual([6]);
    expect(speakerSources(state)[0].isCustom).toBe(false);
  });

  it("codes a source by its index in the whole category, not the filtered list", () => {
    const state = withDevices({ camera: [{ id: "c1", x: 1, y: 1 }, { id: "c2", x: 2, y: 1, isTableCam: true }] });
    expect(micSources(state)[0].code).toBe("C2");
  });
});
