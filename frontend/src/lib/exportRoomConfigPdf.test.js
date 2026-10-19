// The PDF's own pure helpers. Drawing is checked by exporting a report and looking at
// it; these two decide what the words say, which is worth pinning.
//
// jsPDF reaches fast-png at import time, which needs TextEncoder — jsdom has neither, so
// the globals go in before the module is required. That forces `require` over `import`
// here, since imports are hoisted above any statement.
const { TextEncoder, TextDecoder } = require("util");
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

const { rangeOrigin, coverageGapText } = require("./exportRoomConfigPdf");

describe("where a drawn range came from", () => {
  const source = (kind, isCustom) => ({ kind, isCustom });

  test("a range set on the device itself is custom, whatever the room says", () => {
    expect(rangeOrigin(source("mic", true), { audio: { micRange: 3 } })).toBe("Custom (this device)");
    expect(rangeOrigin(source("speaker", true), { audio: {} })).toBe("Custom (this device)");
  });

  test("otherwise a room-wide range, when one is set for that kind", () => {
    const state = { audio: { micRange: 3 } };
    expect(rangeOrigin(source("mic", false), state)).toBe("Room default");
    // The room-wide mic range says nothing about speakers.
    expect(rangeOrigin(source("speaker", false), state)).toBe("Device default");
  });

  test("otherwise what the device derives", () => {
    expect(rangeOrigin(source("mic", false), { audio: { micRange: null } })).toBe("Device default");
    // A plan saved before room-wide ranges existed has no `audio` at all.
    expect(rangeOrigin(source("speaker", false), {})).toBe("Device default");
  });
});

describe("the two gap lists", () => {
  const seats = [{ x: 1, y: 2 }, { x: 3.456, y: 4 }];

  test("names every uncovered seat with the coordinates that locate it on the plan", () => {
    const report = { sources: [{}], seats: 2, covered: 1, uncovered: [1] };
    expect(coverageGapText(report, seats, "microphone")).toBe("1 of 2 — seat 2 (3.46, 4.00 m)");
  });

  test("says so in words when nothing is missed", () => {
    expect(coverageGapText({ sources: [{}], seats: 2, covered: 2, uncovered: [] }, seats, "speaker")).toBe("none — all 2 seats are in range.");
  });

  test("a plan with no source of that kind is not a plan with full coverage", () => {
    expect(coverageGapText({ sources: [], seats: 2, covered: 0, uncovered: [] }, seats, "speaker")).toBe("no speaker in this plan.");
  });

  test("nor is a plan with no seats", () => {
    expect(coverageGapText({ sources: [{}], seats: 0, covered: 0, uncovered: [] }, [], "microphone")).toBe("no seats in this plan.");
  });
});
