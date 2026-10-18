# Room Planner Audio Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make microphone and speaker coverage an editable, per-device property of a room plan, add wall-mounted speakers, and record coverage in the exported PDF.

**Architecture:** All reach maths moves into one new tested module, `lib/roomAudioCoverage.js`, which the engine, the plan canvas and the PDF all read. Range resolution is `device override ?? room-wide default ?? derived`, so a room-wide edit never writes into a device and never clobbers an override. The existing `MicRange` renderer in `RoomCanvas.jsx` is extracted and widened to draw any coverage source rather than a second renderer being added beside it.

**Tech Stack:** React 18 (CRA + craco), jest (`craco test`), jsPDF, three.js 0.180. **No new dependencies.**

**Spec:** `docs/superpowers/specs/18-Oct-26-room-planner-audio-coverage-design.md`

## Global Constraints

- **No `DRAFT_VERSION` bump.** Absent `state.audio` and absent per-device override fields must reproduce today's numbers exactly, so existing localStorage drafts and shared links keep working.
- **An override is absence-based.** Reset deletes the field; it never writes the current default into the device.
- **No new dependency.** The range control is a native `<input type="range">`.
- **The numeric range is always present as text** — the overlay is never the only way to read it.
- **No animation on the overlay**; respect `prefers-reduced-motion` as the rest of the planner does.
- **Never colour alone** — coverage state is carried by value text and covered/uncovered counts too.
- **Default constants live in one commented block** in `roomAudioCoverage.js`, marked as tunable planning figures, not measured data.
- **The PDF section must state** that these are geometric planning ranges, not measured SPL coverage.
- **Existing suites pass unchanged.** If `roomConfiguratorEngine.test.js` needs edits, the consolidation changed behaviour — investigate, do not accommodate.
- **The repo has no component-test setup** (only `lib/*.test.js`). Do not add one. Push logic into the module where it can be tested; verify UI by hand.

## Review Focus

Input classes the spec implies but does not give a task; each has its test added to the owning task below.

1. **Range of 0, negative, or NaN** from the room-wide or per-device input — a user can type it. Expect: clamped to a sane floor, never NaN, never a negative radius. (Task 1)
2. **`audioPreference` still `null`** — `initialPlan()` starts that way, so a speaker can exist before an audio setup is chosen. Expect: a defined mount and a defined range, not `undefined`. (Task 4)
3. **Zero seats** — a plan can have devices before seating is generated. Expect: reports return `covered: 0, uncovered: []` without dividing by zero or claiming full coverage. (Task 2)
4. **Range larger than the room** — a 10 m range in a 4 m room. Expect: the disc clips, the covered count is every seat, and the label placement does not throw when no spot fits. (Task 5)
5. **Legacy plan carrying `allInOne.micReach`** — written by today's code. Expect: read as that device's override, not ignored. (Task 3)

---

### Task 1: Range resolution and default constants

**Files:**
- Create: `frontend/src/lib/roomAudioCoverage.js`
- Create: `frontend/src/lib/roomAudioCoverage.test.js`
- Modify: `frontend/src/lib/roomPlanState.js` (`initialPlan`, ~line 40)

**Interfaces:**
- Consumes: `CEILING_MIC_RANGE_M`, `TABLE_MIC_RANGE_M`, `TABLE_CAM_MIC_RANGE_M`, `typicalAllInOneMicReach`, `micMount` from `roomConfiguratorEngine.js`
- Produces:
  - `resolveMicRange(item, category, state) -> number`
  - `resolveSpeakerRange(item, category, state) -> number`
  - `derivedMicRange(item, category, state) -> number`
  - `derivedSpeakerRange(item, state) -> number`
  - `MIN_RANGE_M`, and the default constants block

Note `category` is an explicit parameter: a device item does not carry its own category anywhere in this codebase, and later tasks resolve ranges while iterating `devices[category]`.

- [ ] **Step 1: Write the failing tests**

```js
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
```

Note `undefined` in the clamp case must resolve *through* to the derived default (`CEILING_SPEAKER_RANGE_M`), not to `MIN_RANGE_M` — `??` treats it as absent. The assertion is `>= MIN_RANGE_M` so both outcomes pass; that is deliberate, since absent and invalid are different states.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomAudioCoverage.test.js`
Expected: FAIL, "Cannot find module './roomAudioCoverage'"

- [ ] **Step 3: Implement the constants block in `frontend/src/lib/roomAudioCoverage.js`**

One commented block, each value on its own line with a one-line note that it is a planning figure. Values from spec §5.4:

`MIN_RANGE_M = 0.25`, `VIDEO_BAR_MIC_RANGE_M = 4`, `CEILING_SPEAKER_RANGE_M = 3`, `WALL_SPEAKER_RANGE_M = 6`, `SOUNDBAR_RANGE_M = 5`, `VIDEO_BAR_SPEAKER_RANGE_M = 5`, `ALL_IN_ONE_SPEAKER_RANGE_M = 5`.

Mic defaults are re-exported from the engine, not re-declared.

- [ ] **Step 4: Implement `derivedMicRange`, `derivedSpeakerRange`, `resolveMicRange`, `resolveSpeakerRange`**

Resolution is `item[field] ?? state.audio?.[field] ?? derived(...)`, then clamped. Mic derivation per spec §5.4; the ceiling slant correction is `sqrt(max(0, base² - drop²))` where `drop = max(0, room.height - 1.2)`, lifted from `dedicatedMicReach`. Speaker derivation keys off `item.mount` (Task 4 adds the field; until then treat absent as `"ceiling"`).

Clamp: a finite number below `MIN_RANGE_M` becomes `MIN_RANGE_M`; a non-finite value is treated as absent and falls through to the next level.

- [ ] **Step 5: Add `audio` to `initialPlan()` in `frontend/src/lib/roomPlanState.js`**

`audio: { micRange: null, speakerRange: null },` beside `audioPreference`. `null` means "not set, derive".

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomAudioCoverage.test.js src/lib/roomPlanState.test.js`
Expected: PASS, both suites.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/roomAudioCoverage.js frontend/src/lib/roomAudioCoverage.test.js frontend/src/lib/roomPlanState.js
git commit -m "feat(room-planner): add audio range resolution and default constants"
```

---

### Task 2: Coverage sources and reports

**Files:**
- Modify: `frontend/src/lib/roomAudioCoverage.js`
- Modify: `frontend/src/lib/roomAudioCoverage.test.js`

**Interfaces:**
- Consumes: Task 1's `resolveMicRange` / `resolveSpeakerRange`
- Produces:
  - `micSources(state) -> Source[]`
  - `speakerSources(state) -> Source[]`
  - `micCoverageReport(state) -> Report`
  - `speakerCoverageReport(state) -> Report`
  - `Source = { id, code, category, kind: "mic" | "speaker", mount, x, y, range, isCustom }`
  - `Report = { sources: Source[], seats: number, covered: number, uncovered: number[] }` where `uncovered` holds seat indices

Per spec §5.3, mic sources are `microphone`, `videoBar`, `allInOne`, and `camera` where `isTableCam`; speaker sources are `speaker`, `videoBar`, `allInOne`. A front `camera` and a 360° `camera` contribute no speaker.

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomAudioCoverage.test.js`
Expected: FAIL, `micSources is not a function`

- [ ] **Step 3: Implement the four functions**

Coverage is `hypot(seat.x - source.x, seat.y - source.y) <= source.range + 1e-6`, matching the existing `heardBy` epsilon in `roomConfiguratorEngine.js`. `code` comes from `refCode(category, index)`. `isCustom` is true when the device carries its own override field.

Seats are inside the room by construction, so clipping affects what is drawn, never what is counted (spec §6).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomAudioCoverage.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/roomAudioCoverage.js frontend/src/lib/roomAudioCoverage.test.js
git commit -m "feat(room-planner): add mic and speaker coverage sources and reports"
```

---

### Task 3: Consolidate engine mic reach onto the module

The regression-critical task. Spec §6.1: reach currently lives in `roomConfiguratorEngine.js` while the viewer reads `roomSightlines.js`; once ranges are editable, two copies will contradict each other on the same page.

**Files:**
- Modify: `frontend/src/lib/roomConfiguratorEngine.js` — `dedicatedMicReach` (~1617), `builtInPickups` (~1630), `micPickups` (~1636), `micCoverage` (~1645), `micsToCover` (~1652), `builtInMicCoverage` (~1586)
- Modify: `frontend/src/lib/roomAudioCoverage.test.js`

**Interfaces:**
- Consumes: Task 2's `micSources`
- Produces: `micCoverage(state)` and `micsToCover(...)` keep their existing exported signatures and return shapes. Callers do not change.

- [ ] **Step 1: Write the failing regression test** (spec §9.8, Review Focus 5)

```js
it("reproduces today's mic coverage for a plan with no audio key", () => {
  // Fixture written against the PRE-change micCoverage output; see Step 2.
  const legacy = { room, audioPreference: "Ceiling Microphone Array", seats: [{ x: 2, y: 2.5 }, { x: 6, y: 2.5 }],
    devices: { ...emptyDevices(), microphone: [{ id: "m1", x: 2, y: 2.5 }] } };
  expect(micCoverage(legacy)).toMatchObject({ seats: 2, dedicated: 1, heard: 1 });
  expect(micCoverage(legacy).unheard).toHaveLength(1);
});

// Review Focus 5
it("reads a legacy allInOne.micReach as that device's override", () => {
  const state = { ...base(), seats: [{ x: 4, y: 2.5 }],
    devices: { ...emptyDevices(), allInOne: [{ id: "a1", x: 4, y: 0.2, sizeInches: 75, micReach: 1 }] } };
  // 1 m override beats the 7 m typical for a 75", so the seat 2.3 m away is unheard.
  expect(micCoverageReport(state).uncovered).toEqual([0]);
});
```

- [ ] **Step 2: Capture the pre-change baseline**

Before editing the engine, run the first test above against current `main` and record the actual values it prints. Those recorded values are what the test asserts. If the test passes against unchanged code, the baseline is correct and the guard is real.

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomAudioCoverage.test.js -t "reproduces today"`
Expected: PASS before any engine edit.

- [ ] **Step 3: Rewrite `micPickups`, `micCoverage` and `micsToCover` to call `micSources`**

Delete the duplicated reach maths. `dedicatedMicReach` and `builtInPickups` stay exported (the viewer and PDF import them) but become thin wrappers over the module. `micsToCover` keeps using `spreadDevicePositions` for candidate placement and only takes its reach from the module.

- [ ] **Step 4: Run the whole suite**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS, all five suites. **`roomConfiguratorEngine.test.js`, `roomPlanState.test.js` and `roomSightlines.test.js` must pass without edits.** An edit needed there means behaviour changed — stop and investigate.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/roomConfiguratorEngine.js frontend/src/lib/roomAudioCoverage.js frontend/src/lib/roomAudioCoverage.test.js
git commit -m "refactor(room-planner): consolidate mic reach into roomAudioCoverage"
```

---

### Task 4: Wall speakers

**Files:**
- Modify: `frontend/src/lib/roomConfiguratorEngine.js` — device construction (~1498-1520), `defaultMountFor` logic near `nearestEdge`/`WALL_ANGLE` (~1230-1240)
- Modify: `frontend/src/components/roomConfigurator/room3d/buildRoomScene.js` — `buildSmallDevice` speaker branch (~464)
- Modify: `frontend/src/lib/roomAudioCoverage.test.js`

**Interfaces:**
- Consumes: Task 1's `derivedSpeakerRange`
- Produces: `speaker.mount` is `"ceiling" | "wall" | "table"` on every speaker item

- [ ] **Step 1: Write the failing tests**

```js
it("defaults a speaker to table mount under a soundbar setup and ceiling otherwise", () => {
  expect(defaultSpeakerMount("Soundbar (Integrated Mic + Speaker)")).toBe("table");
  expect(defaultSpeakerMount("Ceiling Microphone Array")).toBe("ceiling");
});

// Review Focus 2
it("gives a speaker a defined mount and range before an audio setup is chosen", () => {
  expect(defaultSpeakerMount(null)).toBe("ceiling");
  const state = { ...base(), audioPreference: null, seats: [], devices: { ...emptyDevices(), speaker: [{ id: "s1", x: 4, y: 2.5, mount: "ceiling" }] } };
  expect(Number.isFinite(speakerSources(state)[0].range)).toBe(true);
});

it("derives a different range per mount", () => {
  const at = (mount) => resolveSpeakerRange({ mount }, "speaker", base());
  expect(at("wall")).toBe(WALL_SPEAKER_RANGE_M);
  expect(at("table")).toBe(SOUNDBAR_RANGE_M);
  expect(at("ceiling")).toBeLessThan(CEILING_SPEAKER_RANGE_M); // slant-corrected
});

it("snaps a wall-mounted speaker to the nearest edge", () => {
  const snapped = placeSpeakerOnWall({ x: 0.3, y: 2.5 }, room);
  expect(snapped.x).toBe(0);
  expect(snapped.angle).toBe(WALL_ANGLE.left);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomAudioCoverage.test.js`
Expected: FAIL, `defaultSpeakerMount is not a function`

- [ ] **Step 3: Implement `defaultSpeakerMount(audioPreference)` and wall placement**

`defaultSpeakerMount` returns `"table"` for `SOUNDBAR_AUDIO` and `"ceiling"` for everything else including `null`. Wall snapping reuses the existing path at `roomConfiguratorEngine.js:1240` — the one touch panels use — rather than a new one. Set `mount` when a speaker is constructed, defaulting from `audioPreference` so no existing plan shifts (spec §5.5).

- [ ] **Step 4: Render wall speakers in 3D**

In `buildSmallDevice`'s speaker branch, switch on `item.mount` instead of `ctx.audioPreference`: `"ceiling"` keeps the existing grille at `room.height - 0.01`; `"table"` keeps the existing soundbar box at `0.8`; `"wall"` is a new small box on the wall face at roughly `1.8 m`, oriented into the room via `facingIntoRoom`.

Without this step a wall speaker is invisible in the 3D view and in the PDF's 3D snapshot (spec §7.5).

- [ ] **Step 5: Run tests, then verify in the app**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS, all suites.

Then at `localhost:3000/tools/room-configurator`: add a speaker, set it to wall mount, confirm it snaps to a wall in the 2D plan and appears on that wall in the 3D view.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/roomConfiguratorEngine.js frontend/src/components/roomConfigurator/room3d/buildRoomScene.js frontend/src/lib/roomAudioCoverage.test.js
git commit -m "feat(room-planner): add wall-mounted speakers"
```

---

### Task 5: Extract and generalise the coverage overlay

Spec §7.1. `MicRange` already exists at `RoomCanvas.jsx:256` and **already clips to the room** via `clipPath`. This extracts it; it does not rewrite it.

**Files:**
- Create: `frontend/src/components/roomConfigurator/CoverageOverlay.jsx`
- Modify: `frontend/src/components/roomConfigurator/RoomCanvas.jsx` — remove `MicRange` (256-313), update its three call sites (318, 322, 1111)

**Interfaces:**
- Consumes: Task 2's `Source[]`
- Produces: `<CoverageOverlay sources={Source[]} room labelScale mode />` where `mode` is `"selected" | "all" | "off"`

- [ ] **Step 1: Move `MicRange` into `CoverageOverlay.jsx` unchanged**

Copy the function verbatim first, export it, import it back into `RoomCanvas` and confirm the app renders identically. Moving and changing in one step makes a rendering regression impossible to bisect.

Verify at `localhost:3000/tools/room-configurator`: the 360° camera ring, the all-in-one outline ring and the selected-microphone ring all look exactly as before.

- [ ] **Step 2: Widen it to any source**

Replace the `cam` prop with a `source`, take the label text from `source.kind` (`Mic pickup ~Nm` / `Speaker ~Nm`), and keep `outline` keyed off the source rather than passed in. Add the `CoverageOverlay` wrapper that maps `sources` to one renderer each and honours `mode`.

Label placement already returns `null` when no spot fits inside the room — keep that. (Review Focus 4: a range larger than the room must clip and must not throw.)

- [ ] **Step 3: Rewire the three call sites**

The 360° camera ring (318) and all-in-one ring (322) stop being always-on and become part of the `sources` the overlay receives, so `mode` governs them. The selected-microphone block (1111) is replaced by the same path. **This is the one user-facing regression in the work** (spec §7.1) — those two rings are no longer visible unless the device is selected or show-all is on.

- [ ] **Step 4: Verify by hand**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS (no new tests here — no component-test setup, by constraint).

At `localhost:3000/tools/room-configurator`: with nothing selected the plan shows no rings; selecting a mic, a speaker, a 360° camera or an all-in-one shows that device's ring only; changing selection hides the previous one. Set a range larger than the room and confirm the disc clips at the walls and nothing throws in the console.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/roomConfigurator/CoverageOverlay.jsx frontend/src/components/roomConfigurator/RoomCanvas.jsx
git commit -m "refactor(room-planner): extract MicRange into a general coverage overlay"
```

---

### Task 6: Range controls and the show-all toggle

**Files:**
- Modify: `frontend/src/components/roomConfigurator/RoomCanvas.jsx` — selection bar (~1302), show-all toggle
- Modify: `frontend/src/components/roomConfigurator/SectionControls.jsx` — audio section, speaker mount switch
- Modify: `frontend/src/pages/RoomConfigurator.jsx` — replace the `micPickup` prop (line 1320) with overlay sources

**Interfaces:**
- Consumes: Tasks 1, 2 and 5
- Produces: no new exports; `micPickup` is removed from `RoomCanvas`'s props

- [ ] **Step 1: Add the per-device range control**

A native `<input type="range">` plus a numeric readout in the selection bar that today reads `Speakers selected at 2.17m, 1.83m`. Range edits dispatch the existing `{ type: "update", patch }` action — **no new action type.** Pass `coalesce: "audio-range"` so a drag collapses into one undo entry instead of fifty; the reducer already supports this (`roomPlanState.js:283`).

A device with an override shows a **custom** marker and a reset control. Reset dispatches a patch that **deletes** the field (global constraint), it does not write the default in.

- [ ] **Step 2: Add the room-wide controls and the mount switch**

Two inputs on the Audio step beside the `Preferred audio setup` dropdown, writing `state.audio.micRange` and `state.audio.speakerRange`, each showing whether it is at default and each resettable to `null`. Add a ceiling / wall / table mount switch to a selected speaker, writing `speaker.mount` from Task 4.

- [ ] **Step 3: Add the show-all toggle**

A toggle on the plan setting the overlay `mode` to `"all"`, restoring the at-a-glance view the always-on rings used to give (spec decision 5).

- [ ] **Step 4: Verify by hand**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS

At `localhost:3000/tools/room-configurator`, confirm each of these:
- dragging a device's range redraws its ring live, and one drag is one undo
- setting the room-wide range moves every non-overridden device and leaves an overridden one alone
- resetting an overridden device makes it follow the room-wide value again
- typing `0`, `-5` and letters into a range input never produces NaN or a vanished ring
- the range is readable as a number without hovering or selecting
- tabbing to the slider and using arrow keys works

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/roomConfigurator/RoomCanvas.jsx frontend/src/components/roomConfigurator/SectionControls.jsx frontend/src/pages/RoomConfigurator.jsx
git commit -m "feat(room-planner): add per-device and room-wide audio range controls"
```

---

### Task 7: PDF audio coverage section

**Files:**
- Modify: `frontend/src/lib/exportRoomConfigPdf.js` — new `drawAudioCoverage`, called from `exportRoomConfigPdf` (~1199-1211)

**Interfaces:**
- Consumes: Task 2's `micCoverageReport` / `speakerCoverageReport`
- Produces: `drawAudioCoverage(doc, y, state, layoutResult) -> number` (the new `y`), matching the `drawSectionTitle` / `drawKeyValueColumn` convention already in the file

- [ ] **Step 1: Draw the coverage plan**

Reuse the native vector plan from `drawDiagram` (~339) and add every source's disc, clipped to the room rect with `doc.clip()` — the jsPDF equivalent of the `clipPath` `MicRange` already uses. Mic and speaker coverage must be separately distinguishable and separately labelled, not merged into one blob.

- [ ] **Step 2: Draw the table and the verdict**

Table columns: device code, category, mount, range, and whether the range is the room default or custom — `isCustom` from Task 2's `Source`. Then seats no mic hears and seats no speaker reaches, **listed separately** (spec §10): different problems, different fixes.

- [ ] **Step 3: Add the caveat line**

Exact copy, fixed by the spec:

> These are geometric planning ranges, not measured SPL coverage.

- [ ] **Step 4: Verify by hand**

Export a PDF from a plan with a wall speaker, a ceiling mic, a video bar and one deliberately out-of-reach seat. Confirm the section appears, the discs clip at the walls, the table's custom/default column is right, both gap lists are correct and separate, and the caveat is present.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/exportRoomConfigPdf.js
git commit -m "feat(room-planner): add audio coverage section to the exported PDF"
```
