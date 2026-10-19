# Room Planner — Audio Coverage & Wall Speakers

**Date:** 18-Oct-26
**Status:** Approved design, pending implementation plan
**Scope:** Sub-project 1 of 2. Sub-project 2 (theme / UI rearrangement) gets its own spec.

---

## 1. Purpose

The Room Planner is a pre-sales design tool. Its PDF export is a customer deliverable,
handed to a client or a distributor alongside a BOQ. Today that PDF lists which
microphones and speakers are in the room but says nothing about whether they actually
reach the people sitting in it.

This work makes audio coverage a first-class, editable property of the plan: a planner
can set a room-wide pickup and output range, override it on any individual device, see
the result on the floor plan while they work, and hand the customer a document that
states the coverage and names the gaps.

Success looks like: a planner can place a wall speaker, set its range, see which seats it
reaches, and export a PDF whose audio section a customer's AV integrator would accept as
a reasonable planning statement.

---

## 2. Scope

**In scope**

- Wall-mounted speakers as a placement option alongside ceiling and table/soundbar.
- A room-wide default range for microphone pickup and for speaker output.
- A per-device range override, set by selecting the device and using a range control.
- A coverage overlay on the 2D floor plan, shown while a device is selected and hidden
  when selection changes.
- Independent mic and speaker ranges on video bars and all-in-one displays.
- A dedicated audio coverage section in the exported PDF.

**Out of scope (deliberate, see §11)**

- Coverage rendering in the 3D viewer.
- SPL / acoustic simulation, reflection, reverberation, overlap summing.
- Directional dispersion cones.
- Changes to the planner's theme or layout.

---

## 3. Current state

Established by reading the code, not assumed:

| Area | Today |
|---|---|
| Mic coverage | Exists. `micCoverage()`, `micsToCover()` in `roomConfiguratorEngine.js`. |
| Mic reach | Derived from the single global `state.audioPreference`. Not editable, not per-device. |
| Ceiling correction | `dedicatedMicReach()` already slant-corrects a 5 m ceiling array for ceiling height. |
| Speaker coverage | **None.** `devices.speaker` places and drags; the only speaker logic is seat-count heuristics (`SOUNDBAR_SPEAKER_CAPACITY = 10`, "8+ seats → add a speaker"). |
| Video bar audio | **Not modelled.** `videoBar` carries only `fov`. Its mics and speaker are invisible to every coverage calculation. |
| All-in-one | Has a per-device `micReach`; no speaker range. |
| 360° camera | Fixed `TABLE_CAM_MIC_RANGE_M = 3`. No speaker (correct — it has none). |
| Speaker mount | **No `mount` field.** Ceiling grille vs soundbar is chosen in `buildRoomScene` from the global `audioPreference`. |
| Wall mount pattern | Exists for displays, cameras and touch panels: `nearestEdge`, `WALL_ANGLE`, `mount: "wall"`. Reusable. |
| Mic coverage overlay | **Exists**, as `MicRange` at `RoomCanvas.jsx:256`. Three call sites, two visibility rules: a 360° camera's 3 m ring (line 318) and an all-in-one's `micReach` ring (line 322, outline style) are **always-on**; a dedicated microphone's pickup (line 1111) is **already selection-scoped**. |
| Overlay clipping | **Already implemented.** `MicRange` clips its circle to a `<rect>` of the room via `clipPath`. Decision 2 is therefore pre-built on the 2D side; only the PDF needs new clip work. |
| Selection bar | Exists. Selecting a device shows a bar reading e.g. `Speakers selected at 2.17m, 1.83m` with a Delete control — the natural host for the range control. |
| PDF | Draws a native jsPDF vector plan, captures the live SVG canvas as an image, and embeds a 3D snapshot. Audio table lists device ref codes only. |
| Persistence | `roomPlannerDraft.js` — localStorage draft and a deflate-compressed shareable link, both stamped `DRAFT_VERSION`. |
| Tests | CRA jest (`craco test`). Existing suites: `roomConfiguratorEngine.test.js`, `roomPlanState.test.js`, `roomSightlines.test.js`. |

---

## 4. Decisions

Settled with the user before this spec was written:

1. **Overrides survive room-wide changes.** The room-wide value is a *default that is read*,
   never a value written into devices. A device the planner has tuned keeps its own range
   and ignores later room-wide edits.
2. **Coverage is a circle clipped to the room's walls**, with the existing ceiling-height
   slant correction applied to ceiling mounts. Not a plain circle (a wall speaker would
   visibly spill into the corridor), not a dispersion cone (doubles the controls).
3. **2D floor plan now, 3D later.** The range control and overlay live in the plan, where
   selection and dragging already work.
4. **The PDF gets its own audio coverage section** — a plan with all coverage drawn, a
   per-device table, and a gaps verdict.
5. **Overlay is show-on-select, plus a "show all coverage" toggle.** Per §3, dedicated
   mics are *already* selection-scoped, so this is the existing behaviour generalised
   rather than a new one. The real change is that the two always-on rings — the 360°
   camera's and the all-in-one's — become selection-scoped too, which the toggle
   restores on demand. The show-all mode is required by the PDF anyway, so the toggle is
   nearly free.

Two calls made in the design review and accepted:

6. The 360° camera's fixed 3 m becomes an editable range like every other source.
7. The engine's existing mic-reach logic is consolidated into the new coverage module
   rather than left in place.

---

## 5. Data model

### 5.1 Room-wide defaults

```js
state.audio = {
  micRange: null,      // metres; null = derive per device, today's behaviour
  speakerRange: null,  // metres; null = derive per device
}
```

`null` is meaningful and is the initial value: it means "no room-wide default set, derive
each source from its own kind and mount". This is what makes migration a no-op (§8).

### 5.2 Per-device overrides

A range override is a field on the device item. **Absent means "follow the room-wide
default"**; it is not initialised to a number. Resetting a device to default deletes the
field rather than writing the current default into it — otherwise the override would
silently stop following later room-wide changes.

```js
resolveMicRange(item, state)     = item.micRange     ?? state.audio.micRange     ?? derivedMicRange(item, state)
resolveSpeakerRange(item, state) = item.speakerRange ?? state.audio.speakerRange ?? derivedSpeakerRange(item, state)
```

Decision 1 falls out of this precedence for free: no code path writes a room-wide value
into a device, so no room-wide edit can clobber an override.

### 5.3 Which devices carry which range

| Category | Mic range | Speaker range |
|---|---|---|
| `microphone` | yes | — |
| `speaker` | — | yes |
| `videoBar` | **new** | **new** |
| `allInOne` | `micReach` as its **derived default**, not an override — see correction below | **new** |
| `camera` where `isTableCam` | yes (replaces the fixed 3 m) | — (has no speaker) |
| `camera` (front) | — | — |

Video bars and all-in-ones therefore expose two independent controls. This is the
"independently" requirement.

### 5.4 Derived defaults

All default constants live in one block in the new coverage module, named and commented,
because they are planning figures that will need tuning against real rooms:

| Source | Default range |
|---|---|
| Dedicated mic, ceiling mount | slant-corrected `CEILING_MIC_RANGE_M = 5` (existing maths, unchanged) |
| Dedicated mic, table mount | `TABLE_MIC_RANGE_M = 1.524` (5 ft, existing) |
| 360° camera mic | `TABLE_CAM_MIC_RANGE_M = 3` (existing value, now a default rather than a constant) |
| All-in-one mic | `d.micReach ?? typicalAllInOneMicReach(d.sizeInches)` (existing) |
| Video bar mic | `VIDEO_BAR_MIC_RANGE_M = 4` — **new**, a planning figure for a beamforming bar |
| Ceiling speaker | `CEILING_SPEAKER_RANGE_M = 3`, slant-corrected — **new** |
| Wall speaker | `WALL_SPEAKER_RANGE_M = 6` — **new** |
| Soundbar / table speaker | `SOUNDBAR_RANGE_M = 5` — **new** |
| Video bar speaker | `VIDEO_BAR_SPEAKER_RANGE_M = 5` — **new** |
| All-in-one speaker | `ALL_IN_ONE_SPEAKER_RANGE_M = 5` — **new** |

> The five new speaker figures and the video bar mic figure are starting points, not
> measured data. They are editable by the planner, which is the point of this feature;
> they are grouped and commented so they can be tuned in one place once checked against
> real installs.

### 5.5 Speaker mount

```js
speaker.mount: "ceiling" | "wall" | "table"
```

New field. Defaults from `audioPreference` so no existing plan shifts: soundbar preference
→ `"table"`, otherwise `"ceiling"`. Wall mount reuses the existing edge-snapping path
(`nearestEdge`, `WALL_ANGLE`), the same one touch panels use.

---

## 6. Coverage geometry — new module

New file: `frontend/src/lib/roomAudioCoverage.js`, sibling to `roomSightlines.js`. It owns
**all** reach maths. Exports:

- `micSources(state)` / `speakerSources(state)` → `[{ code, category, mount, x, y, range, isCustom }]`
- `micCoverageReport(state)` / `speakerCoverageReport(state)` → `{ sources, seats, covered, uncovered }`
- the default constants of §5.4
- the generalised ceiling slant correction, lifted out of `dedicatedMicReach`

**Clipping needs no polygon maths.** A circle plus a rectangular clip region: SVG does it
with `clipPath`, jsPDF does it with `doc.clip()`. The same primitive serves both surfaces.
`MicRange` already clips exactly this way (§3), so the 2D side is proven; only the PDF
needs the equivalent written.
For the *seat* calculation, a seat is covered when it is within the radius — seats are
inside the room by construction, so clipping affects only what is drawn, not what is
counted.

### 6.1 Consolidation

`micCoverage()` and `micsToCover()` in `roomConfiguratorEngine.js` are refactored to call
this module instead of keeping their own reach logic.

This is the part worth insisting on. Reach currently lives in `roomConfiguratorEngine.js`
while the 3D viewer reads `roomSightlines.js`. Once ranges are user-editable, two copies
will disagree, and the recommendation engine will tell a customer "add a speaker so all 12
can hear" while the overlay on the same page shows all 12 already covered. One source of
truth means the advice, the overlay and the PDF cannot drift.

Recommendations automatically respect custom ranges, because they resolve through the same
functions.

---

## 7. UI

### 7.1 Coverage overlay

**A coverage renderer already exists** — `MicRange` at `RoomCanvas.jsx:256`, drawing the
shaded pickup region and its label for cameras and dedicated mics. This work *generalises
that one*; it does not add a second renderer beside it.

Extract it to `frontend/src/components/roomConfigurator/CoverageOverlay.jsx`, widened to
take any coverage source (mic or speaker), apply the room clip, and label itself from the
source's kind. `RoomCanvas` then renders the layer instead of owning the geometry — which
also takes ~50 lines out of a 1,325-line file rather than adding to it.

Adding a parallel speaker renderer was the obvious move and is the wrong one: two
renderers with two copies of the clip and label logic will drift, and the PDF would then
have to pick one. One renderer, three modes:

- **selected** — the selected device's coverage only (default)
- **all** — every source at once; drives both the "show all coverage" toggle and the PDF
- **off** — nothing drawn

Per decision 5, the default is **selected**. Dedicated mics already behave this way, so
for them nothing changes. The visible change is to the 360° camera and all-in-one rings,
which stop being always-on; the "show all coverage" toggle restores them on demand. That
is the one user-facing regression in this work and must be called out in the
implementation plan, not slipped in.

### 7.2 Per-device control

Selecting a microphone or speaker in the 2D plan reveals a range control in the existing
selection bar — the one that today reads `Speakers selected at 2.17m, 1.83m` beside a
Delete control — with a live numeric readout. Dragging updates the overlay live. Changing
selection hides the overlay, as specified.

A device with an override shows a **custom** marker and a reset control that deletes the
override field (§5.2).

### 7.3 Room-wide control

Two range inputs on the Audio step beside `audioPreference`: microphone range and speaker
range. Each shows whether it is currently at default, and each can be returned to default
(`null`).

### 7.4 Accessibility

- Native `<input type="range">` (keyboard-operable, correct semantics, no library).
- The numeric value is always present as text — the overlay is never the only way to know
  a device's range.
- The overlay does not animate, and respects `prefers-reduced-motion` like the rest of the
  planner.
- Coverage state is conveyed by the value text and the covered/uncovered counts, not by
  colour alone.

### 7.5 3D

Out of scope for coverage rendering — but `buildSmallDevice` in `buildRoomScene.js` must
read `speaker.mount` so a wall speaker renders on the wall rather than the ceiling.
Without that, wall speakers are invisible in the 3D view and in the PDF's 3D snapshot.

---

## 8. Migration and compatibility

An absent `state.audio` and absent per-device override fields derive exactly today's
numbers. Therefore:

- No `DRAFT_VERSION` bump.
- Existing localStorage drafts load unchanged.
- Existing shareable links resolve unchanged.
- `allInOne.micReach` keeps working — it supplies that device's derived default.

> **Correction (made during Task 6's review).** §5.3 and this line originally called
> `micReach` "the per-device override", on the assumption it was legacy data carried by
> old plans. That assumption was wrong, and it was never checked when written: `micReach`
> is written at creation for **every** all-in-one (`SectionControls.jsx:353` when the
> planner picks a size, `roomTemplates.js:66` for templates). It is the device's
> size-derived capability, not a planner's choice. Treating it as an override made every
> all-in-one born "Custom", silently excluded it from the room-wide range, and — because
> reset deletes an override — put `~undefinedm` into the review screen and the client
> PDF. Precedence is therefore `micRange` → room-wide → derived (which consults
> `micReach`), and `isCustom` tracks only `micRange`, because "Custom" must mean the
> planner changed it.

This is proved by a regression test (§9), not by inspection.

New plans created after this change also start with `state.audio = { micRange: null,
speakerRange: null }`, which derives identically — so new and old plans behave the same
until a planner edits a range.

---

## 9. Testing

New suite: `frontend/src/lib/roomAudioCoverage.test.js`.

1. **Precedence** — per-device beats room-wide beats derived, for both mic and speaker.
2. **Override survival** — changing the room-wide range leaves an overridden device's
   range untouched; a non-overridden device follows it.
3. **Reset** — resetting a device deletes the field, and that device then follows later
   room-wide changes.
4. **Slant correction** — a ceiling source's floor radius shrinks as ceiling height grows.
5. **Clipping** — a wall speaker's drawn coverage is bounded by the room; its covered-seat
   count never includes a point outside the room.
6. **Independence** — a video bar contributes exactly one mic source and one speaker
   source, and changing one does not change the other.
7. **Mount** — a speaker's derived default changes with `mount`; wall mount snaps to the
   nearest edge.
8. **Regression guard** — a plan with no `audio` key and no override fields reproduces
   today's `micCoverage()` output exactly. This is the test that protects every saved
   draft and every shared link.
9. **Overlay parity** — the source list the "all" mode renders is exactly the union of
   what every "selected" mode would render, so the PDF cannot show coverage the plan
   never did.

Existing suites must keep passing unchanged; if `roomConfiguratorEngine.test.js` needs
edits, that is a signal the consolidation changed behaviour and must be investigated
rather than accommodated.

---

## 10. PDF

New audio coverage section in `exportRoomConfigPdf.js`:

- **Plan** — the native vector plan with every coverage disc drawn at once, clipped to the
  room. Mic coverage and speaker coverage are visually distinguishable and separately
  labelled, not merged into one blob.
- **Table** — device code, category, mount, range, and whether the range is the room
  default or custom.
- **Verdict** — seats no microphone hears, and seats no speaker reaches, listed
  **separately**. They are different problems with different fixes, and merging them would
  make the document less useful to the integrator reading it.
- **Caveat line** — the section states that these are geometric planning ranges, not
  measured SPL coverage. The PDF goes to customers; it should not imply an acoustic
  survey it did not perform.

---

## 11. Known ceilings and follow-ups

Deliberate simplifications, each with its upgrade path:

| Simplification | Ceiling | Upgrade when |
|---|---|---|
| Circle, not dispersion cone | A wall speaker's real pattern is directional; a circle overstates coverage behind and beside it. | A customer disputes a wall speaker's stated coverage. |
| No SPL, no overlap summing | Two half-reaching speakers show as two gaps, where in reality they may sum to adequate level. | The tool is used for rooms where level, not placement, is the question. |
| Geometric reach only | Ignores absorption, furniture, open-plan bleed. | Never, probably — this is a planning tool, not a survey tool. |
| 2D only | Coverage is not visible in the 3D walkthrough, which is the view customers find most persuasive. | Straight after this ships — it is the natural next piece. |
| New default constants unvalidated | §5.4's six new figures are reasoned, not measured. | First real install they can be checked against. |

**Named follow-up:** coverage rendering in the 3D viewer (translucent floor discs in the
orbit view), once the maths in §6 is proven in 2D.

---

## 12. Files touched

| File | Change |
|---|---|
| `lib/roomAudioCoverage.js` | **new** — all reach maths, sources, reports, constants |
| `lib/roomAudioCoverage.test.js` | **new** — §9 |
| `lib/roomConfiguratorEngine.js` | consolidate mic reach into the module; speaker `mount`; video bar mic/speaker; 360° cam range |
| `lib/roomPlanState.js` | `state.audio`; override set/reset actions |
| `lib/exportRoomConfigPdf.js` | §10 section |
| `components/roomConfigurator/CoverageOverlay.jsx` | **new file, extracted not invented** — `MicRange` generalised to any source, §7.1 |
| `components/roomConfigurator/RoomCanvas.jsx` | remove `MicRange` (line 256), render the overlay layer, add the range control to the selection bar and the "show all coverage" toggle. Net smaller, no coverage geometry left here |
| `components/roomConfigurator/SectionControls.jsx` | per-device range control, speaker mount switch |
| `components/roomConfigurator/room3d/buildRoomScene.js` | read `speaker.mount` for wall speakers |
