import { resolveMicRange, resolveSpeakerRange, MIN_RANGE_M } from "./roomAudioCoverage";

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
