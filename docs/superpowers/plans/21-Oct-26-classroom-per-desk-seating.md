# Classroom Per-Desk Seating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a planner set how many seats a classroom desk carries, and add, delete, move and re-seat any single desk, with the room's seat total derived from the desks.

**Architecture:** `state.desks` becomes an ordered list of `{ id, seats, dx, dy }` that owns its state, replacing the index-keyed override bag that could not survive a deletion. The generator lays the list out in rows exactly as it does now and `dx`/`dy` displace a desk from its flowed position, so a classroom still looks like one after edits. The list materialises on first edit, so a plan nobody touches behaves exactly as today.

**Tech Stack:** React 18 (CRA + craco), jest (`craco test`), no new dependencies.

**Spec:** `docs/superpowers/specs/20-Oct-26-classroom-per-desk-seating-design.md`

## Global Constraints

- **No new dependency.**
- **No `DRAFT_VERSION` bump.** Both new fields are additive, so old drafts and shared links still load.
- **Pixel-identical output is NOT required.** The user has accepted that a classroom room in an existing shared link may render slightly differently, so the new packing may distribute a row's seats differently from `balancedSplit`. What is still required: an old plan **loads and renders without throwing**, and a planner's own in-progress draft is never lost mid-session. A link showing a slightly different room is fine; one that errors is not.
- **Classroom only.** Theater shares `rowSeatingLayout` and must keep `THEATER_LAYOUT.blockSeats`. No other layout changes behaviour.
- **Desks flow; they are not absolutely positioned.** `dx`/`dy` displace a desk from the position row-flow gives it.
- **A desk's seat count is capped by physics, not policy** — `rowCapacity(room, sp).seatsPerRow`, which is what actually fits across the room.
- **Deleting the last desk is refused**, with the reason shown.
- **The capacity limit is advisory for Classroom only.** `fitOccupancy` still hard-clamps every other layout.
- **The repo has no component-test setup** (only `lib/*.test.js`). Do not add one. UI tasks are verified by hand.
- **A green suite is not evidence the app runs.** Every task verifies with a cold dev-server load in a brand-new browser tab; an existing tab's console holds stale hot-module errors. This project has had one case where every test passed and the site rendered blank.

## Review Focus

Input classes the spec implies but does not give a task. Each has its test added to the owning task.

1. **A desk driven to 0 seats** — the stepper's lower bound. A desk with no seats is furniture, not seating. Expect: clamped to 1. (Task 3)
2. **`seatsPerDesk` of 0, negative or NaN** — reachable by a hand-edited shared link, and the stepper must not produce it either. Expect: falls back to the default rather than generating an empty or infinite layout. (Task 1)
3. **A shared link whose desks no longer fit the room** — the room was shrunk after the link was made. Expect: desks still render, packed into as many rows as the room allows, with no overlap and no crash. (Task 2)
4. **`desks: []` arriving from a link** — materialised then emptied outside the UI's guard. Expect: treated as "derive", not as an empty classroom. (Task 1)
5. **A desk displaced entirely outside the room** by a hand-edited `dx`/`dy`. Expect: clamped back to the room, as pod offsets are. (Task 3)

---

### Task 1: Desk list state and derivation

**Files:**
- Modify: `frontend/src/lib/roomPlanState.js` (`initialPlan` ~line 40, `hasSeatEdits` :78, the clearing sites :156 and :220)
- Modify: `frontend/src/lib/roomConfiguratorEngine.js` (new `deriveDesks`)
- Test: `frontend/src/lib/roomConfiguratorEngine.test.js`

**Interfaces:**
- Consumes: `uid(prefix)` from `roomConfiguratorEngine.js:194`; `CLASSROOM_LAYOUT.blockSeats` (6)
- Produces:
  - `deriveDesks(headcount, seatsPerDesk) -> [{ id, seats, dx: 0, dy: 0, seatsSetByHand: false }]` — `seatsSetByHand` is written here, not bolted on in Task 6, so every desk has the field from birth and Task 6's re-seat rule never meets an undefined
  - `effectiveSeatsPerDesk(seatsPerDesk) -> number` — the fallback guard
  - `state.seatsPerDesk` and `state.desks`, both `null` initially

- [ ] **Step 1: Write the failing tests**

```js
it("derives one desk per full seat group from the headcount", () => {
  const desks = deriveDesks(12, 3);
  expect(desks).toHaveLength(4);
  expect(desks.map((d) => d.seats)).toEqual([3, 3, 3, 3]);
  expect(new Set(desks.map((d) => d.id)).size).toBe(4); // ids are unique
});

it("puts the remainder on the last desk rather than dropping it", () => {
  expect(deriveDesks(11, 3).map((d) => d.seats)).toEqual([3, 3, 3, 2]);
});

// Review Focus 2
it.each([0, -3, NaN, undefined, null])("falls back to the default for a bad seatsPerDesk (%p)", (bad) => {
  expect(effectiveSeatsPerDesk(bad)).toBe(CLASSROOM_LAYOUT_BLOCK_SEATS);
});

it("starts a plan with both fields null", () => {
  const p = initialPlan();
  expect(p.seatsPerDesk).toBeNull();
  expect(p.desks).toBeNull();
});

it("clears the desk list when the layout type changes", () => {
  // settle() from prev (classroom, with desks) to next (ushape)
  // Expect: desks back to null, seatEditsCleared incremented.
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomConfiguratorEngine.test.js`
Expected: FAIL, `deriveDesks is not defined`

- [ ] **Step 3: Implement `deriveDesks` and `effectiveSeatsPerDesk` in `roomConfiguratorEngine.js`**

Export `CLASSROOM_LAYOUT.blockSeats` under a name the test can import. `effectiveSeatsPerDesk` returns the default for anything non-finite or below 1. `deriveDesks` builds `ceil(headcount / perDesk)` desks, each `perDesk` seats except the last which takes the remainder, every desk with `id: uid("desk")` and zero offsets.

- [ ] **Step 4: Add `seatsPerDesk: null` and `desks: null` to `initialPlan`, and wire the clearing**

> **Correction (made during Task 1's review).** This step originally said `hasSeatEdits` should gain `p.desks != null`. **Do not do that** — it was wrong, and it is the only defect the plan shipped with. `hasSeatEdits` feeds the chairs-changed wipe at `roomPlanState.js:153-160`, which sits inside `if (furnitureChanged)` — true for a room resize, a density change, a table change or a headcount change. Routing desks through it means a planner resizing the room silently loses every desk edit. Spec §5.2 makes `dx`/`dy` relative to the **flowed** position precisely so desks survive a reflow, and §9 scopes the clear to a layout-**type** change.

Leave `hasSeatEdits` as it was. Clear `desks` on a genuine layout-type change (`prev.layout !== p.layout`), keeping the `seatEditsCleared` increment so the UI still reports the reset. The `applyTemplate` clearing sites are correct as they stand — a template sets a new layout.

Two tests pin the distinction: a room resize **preserves** desks; a layout-type change **clears** them.

**Review Focus 4:** wherever `desks` is read, `desks == null || desks.length === 0` means "derive". An empty array from a hand-edited link is not an empty classroom.

- [ ] **Step 5: Run tests and the full suite**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS, all suites. The three pre-existing suites must pass unedited.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/roomPlanState.js frontend/src/lib/roomConfiguratorEngine.js frontend/src/lib/roomConfiguratorEngine.test.js
git commit -m "feat(room-planner): add the classroom desk list to plan state"
```

---

### Task 2: Pack rows from the desk list

The one piece of genuinely new layout logic. Today `rowBlocks` splits a row's seats into desks; now desks are taken in order and packed until the next will not fit.

**Files:**
- Modify: `frontend/src/lib/roomConfiguratorEngine.js` (`classroomLayout` :804, `rowSeatingLayout`, `generateLayout` :1090)
- Test: `frontend/src/lib/roomConfiguratorEngine.test.js`

**Interfaces:**
- Consumes: Task 1's `deriveDesks`, `effectiveSeatsPerDesk`
- Produces:
  - `classroomLayout(room, deskDepth, desks, density) -> { chairs, desks }`
  - `generateLayout(layoutType, room, table, chairCount, podOverrides, density, classroom = {})` where `classroom` is `{ desks, seatsPerDesk }`
  - Every emitted desk carries `deskId`; every chair carries the `deskId` of its desk

- [ ] **Step 1: Write the failing tests**

```js
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

it("centres a row of unequal desks on the room midline", () => {
  // A 2-seat and a 5-seat desk in one row. Assert the row's left margin equals
  // its right margin to within 1e-6 — spec §6.2.
});

// Review Focus 3
it("still lays out desks that no longer fit the room, without overlapping", () => {
  // 10 desks in a room that now fits 2 per row: expect 5 rows, every desk inside
  // the walls, and no two desks in a row overlapping on x.
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
  // every desk within the walls, and no two desks in the same row overlapping on x
});

// Spec §11.8 — Theater shares rowSeatingLayout and must not move.
it("leaves theater seating unchanged by seatsPerDesk", () => {
  const a = generateLayout("theater", room, table, 20, {}, "standard");
  const b = generateLayout("theater", room, table, 20, {}, "standard", { seatsPerDesk: 2 });
  expect(b.chairs).toEqual(a.chairs);
});
```

- [ ] **Step 2: Run the shape guard against the generator before touching it**

Run the "still produces a sane classroom" test against **unmodified** code. It must PASS before any edit — a guard that only passes after your changes is a description of whatever you happened to build, not a guard.

It asserts shape, not coordinates: the user has accepted that an existing shared link may render slightly differently, so the new packing is allowed to distribute a row's seats differently from `balancedSplit`. Do **not** tighten this into a coordinate snapshot — that would fail on a legitimate change and tell you nothing about correctness.

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomConfiguratorEngine.test.js -t "sane classroom"`
Expected: PASS, before any edit to `classroomLayout`.

- [ ] **Step 3: Run the rest of the tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomConfiguratorEngine.test.js`
Expected: FAIL — `classroomLayout` takes a count, not a list.

- [ ] **Step 4: Make `blockSeats` a parameter rather than a constant read**

`rowBlocks` and `rowCapacity` take the effective seats-per-desk. Theater keeps passing `THEATER_LAYOUT.blockSeats`, so `rowSeatingLayout`'s other caller is unchanged.

- [ ] **Step 5: Implement packing in `classroomLayout`**

Walk the desk list in order, accumulating a row until the next desk's width (`seats * seatPitch`, plus `sp.aisle` between desks) would exceed the usable width; then start a row. Reuse `firstRowLine` and `rowBandY` for row positions and the existing centring, so rows stay on the room midline. Emit `deskId` on each desk and on each of its chairs.

- [ ] **Step 6: Thread the list through `generateLayout`**

The `classroom` case derives the list when `classroom.desks` is absent or empty, using `deriveDesks(chairCount, effectiveSeatsPerDesk(classroom.seatsPerDesk))`.

- [ ] **Step 7: Run tests and the full suite**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS. **If a pre-existing suite needs editing, stop** — that means Theater or another layout moved, which this task must not do.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/roomConfiguratorEngine.js frontend/src/lib/roomConfiguratorEngine.test.js
git commit -m "feat(room-planner): pack classroom rows from an explicit desk list"
```

---

### Task 3: Per-desk seats and offsets

**Files:**
- Modify: `frontend/src/lib/roomConfiguratorEngine.js` (`classroomLayout`)
- Test: `frontend/src/lib/roomConfiguratorEngine.test.js`

**Interfaces:**
- Consumes: Task 2's `classroomLayout`
- Produces: `maxSeatsPerDesk(room, density) -> number` — `rowCapacity(room, sp).seatsPerRow`, the physical ceiling

- [ ] **Step 1: Write the failing tests**

```js
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

// Review Focus 1
it("clamps a desk to at least one seat", () => {
  const [d] = deriveDesks(3, 3);
  const { chairs } = classroomLayout(room, 0.5, [{ ...d, seats: 0 }], "standard");
  expect(chairs).toHaveLength(1);
});

it("moves a desk and all of its chairs by the same vector", () => {
  // dx: 0.4, dy: 0.3 — assert the desk and every chair with its deskId shift by
  // exactly that, against the same list with zero offsets.
});

// Review Focus 5
it("clamps a desk displaced outside the room back inside", () => {
  // dx: 99 — assert the desk's right edge is at or inside room.length.
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomConfiguratorEngine.test.js`
Expected: FAIL, `maxSeatsPerDesk is not defined`

- [ ] **Step 3: Implement the clamps in `classroomLayout`**

A desk's seats are `clamp(d.seats, 1, maxSeatsPerDesk(room, density))`. Its position is the flowed `(x, y)` plus `(dx, dy)`, clamped so the desk's box stays within the room — the same shape as the pod offset clamp in `collaborationLayout`.

- [ ] **Step 4: Run tests and the full suite**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/roomConfiguratorEngine.js frontend/src/lib/roomConfiguratorEngine.test.js
git commit -m "feat(room-planner): per-desk seat counts and offsets"
```

---

### Task 4: Add and delete a desk

The task that earns the move from index keys to ids.

**Files:**
- Modify: `frontend/src/lib/roomPlanState.js`
- Test: `frontend/src/lib/roomConfiguratorEngine.test.js`

**Interfaces:**
- Consumes: Task 1's `deriveDesks`
- Produces:
  - `addDesk(desks, seatsPerDesk) -> desks'`
  - `removeDesk(desks, id) -> desks'` — returns the list unchanged when it holds one desk
  - `canRemoveDesk(desks) -> boolean`

- [ ] **Step 1: Write the failing tests**

```js
// The test that fails under the rejected deskOverrides[index] design.
it("leaves the other desks' own state untouched when one is deleted", () => {
  const [a, b, c] = deriveDesks(9, 3);
  const list = [{ ...a, seats: 2, dx: 0.1 }, { ...b, seats: 5, dx: 0.2 }, { ...c, seats: 4, dx: 0.3 }];
  const after = removeDesk(list, a.id);
  expect(after).toHaveLength(2);
  expect(after[0]).toMatchObject({ id: b.id, seats: 5, dx: 0.2 });
  expect(after[1]).toMatchObject({ id: c.id, seats: 4, dx: 0.3 });
});

it("appends a new desk carrying the default seat count", () => {
  const list = deriveDesks(6, 3);
  const after = addDesk(list, 3);
  expect(after).toHaveLength(3);
  expect(after[2].seats).toBe(3);
  expect(new Set(after.map((d) => d.id)).size).toBe(3);
});

it("refuses to remove the last desk", () => {
  const list = deriveDesks(3, 3);
  expect(canRemoveDesk(list)).toBe(false);
  expect(removeDesk(list, list[0].id)).toEqual(list);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomConfiguratorEngine.test.js`
Expected: FAIL, `removeDesk is not defined`

- [ ] **Step 3: Implement the three list operations**

Pure functions over the list; `addDesk` uses `uid("desk")` and zero offsets.

- [ ] **Step 4: Run tests and the full suite**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/roomPlanState.js frontend/src/lib/roomConfiguratorEngine.test.js
git commit -m "feat(room-planner): add and delete classroom desks"
```

---

### Task 5: The derived total, through one accessor

Spec §8.1. The highest-risk task: these call sites print numbers to customers.

**Files:**
- Modify: `frontend/src/lib/roomConfiguratorEngine.js` (`:1766`, `:1768`, `:1773`, `:2005`, `:2009`, `:2015`, `:2041`, `:2045`), `frontend/src/lib/roomPlanState.js` (`fitOccupancy`)
- Test: `frontend/src/lib/roomConfiguratorEngine.test.js`

**Interfaces:**
- Consumes: Tasks 1–3
- Produces: `planSeatTotal(state) -> number` — the sum of the desks' seats for a materialised Classroom plan, `state.chairCount` otherwise

- [ ] **Step 1: Write the failing tests**

```js
it("quotes the derived total in the advice, not the setup headcount", () => {
  // Classroom, soundbar audio, desks edited so the total exceeds
  // SOUNDBAR_SPEAKER_CAPACITY while chairCount still reads the old headcount.
  // Assert the recommendation text contains the derived total and not chairCount.
});

it("reports the derived total for a materialised classroom plan", () => {
  // desks summing to 14 against a chairCount of 12 -> 14
});

it("reports chairCount for every other layout", () => {
  // rectangular, chairCount 8, desks present but irrelevant -> 8
});

it("does not clamp a classroom plan's total, and still clamps a rectangular one", () => {
  // fitOccupancy: classroom above occupancyLimit is left alone; rectangular is clamped.
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomConfiguratorEngine.test.js`
Expected: FAIL, `planSeatTotal is not defined`

- [ ] **Step 3: Implement `planSeatTotal` and route every call site through it**

Replace each of the eight `chairCount` reads listed under **Files** with `planSeatTotal(state)`. Resolve it **once** per function rather than per sentence. Do not change the sentences' wording.

- [ ] **Step 4: Exempt Classroom from the `fitOccupancy` clamp**

`fitOccupancy` returns the plan unchanged for `layout === "classroom"`; every other layout keeps the existing clamp.

- [ ] **Step 5: Run tests and the full suite**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS. An edit needed in a pre-existing suite means a non-classroom layout changed — stop and investigate.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/roomConfiguratorEngine.js frontend/src/lib/roomPlanState.js frontend/src/lib/roomConfiguratorEngine.test.js
git commit -m "feat(room-planner): derive the classroom seat total through one accessor"
```

---

### Task 6: Materialise the list on first edit

**Files:**
- Modify: `frontend/src/lib/roomPlanState.js`
- Test: `frontend/src/lib/roomConfiguratorEngine.test.js`

**Interfaces:**
- Consumes: Tasks 1–4
- Produces: `materialiseDesks(plan) -> plan` — writes the derived list into `plan.desks` when it is `null`, otherwise returns the plan unchanged

- [ ] **Step 1: Write the failing tests**

```js
it("leaves desks null until a desk is edited", () => {
  // A plan whose chairCount changes keeps desks null and follows the headcount.
});

it("writes the derived list on the first desk edit", () => {
  // materialiseDesks on a null-desks plan produces a list matching deriveDesks,
  // and is a no-op on a plan that already has one.
});

it("re-seats untouched desks when seatsPerDesk changes, leaving a hand-set desk alone", () => {
  // Three desks; desk 1 hand-set to 5. Change seatsPerDesk 3 -> 4.
  // Expect: [4, 5, 4] — spec §10.1.
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx craco test --watchAll=false src/lib/roomConfiguratorEngine.test.js`
Expected: FAIL, `materialiseDesks is not defined`

- [ ] **Step 3: Implement materialisation and the re-seat rule**

A desk is "hand-set" when its `seats` differs from the `seatsPerDesk` in force when it was created; track that with a boolean on the desk (`seatsSetByHand`) rather than inferring it, which would make a desk that coincidentally matches the default lose its edit.

- [ ] **Step 4: Run tests and the full suite**

Run: `cd frontend && npx craco test --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/roomPlanState.js frontend/src/lib/roomConfiguratorEngine.test.js
git commit -m "feat(room-planner): materialise the desk list on first edit"
```

---

### Task 7: Select, drag and delete a desk on the plan

**Files:**
- Modify: `frontend/src/components/roomConfigurator/RoomCanvas.jsx` (`commitPodMove` :750, the keyboard handler :874, the chair render :1094 and :1102, `rc-table-group` :1063)
- Modify: `frontend/src/pages/RoomConfigurator.jsx` (handlers)

**Interfaces:**
- Consumes: Tasks 2–4
- Produces: no new exports. Selection for a desk is `{ category: "desk", id }` — **an id, not an index**, unlike the pod selection beside it

- [ ] **Step 1: Mirror the pod path, keyed by id**

A desk is selectable as a unit and drags with every chair carrying its `deskId`, committing `dx`/`dy`. The existing pod code keys on `selection.index` and `c.podIndex`; desks key on `selection.id` and `c.deskId`, because an index would re-point after a deletion — the defect the data model exists to avoid.

- [ ] **Step 2: Add delete to the selection bar**

The selected-desk bar gains a Delete, disabled when `canRemoveDesk` is false, with the reason as its title.

- [ ] **Step 3: Verify by hand**

Run: `cd frontend && npx craco test --watchAll=false` — expected PASS (no new tests; no component-test setup by constraint).

Then on a **cold dev server in a brand-new tab**, with a Classroom plan: select a desk and confirm only it highlights; drag it and confirm its chairs move with it and it stops at the wall; delete a middle desk and confirm the remaining desks keep their own seat counts and offsets; confirm Delete is disabled on the last desk. Paste what you observed and confirm the errors-only console read is clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/roomConfigurator/RoomCanvas.jsx frontend/src/pages/RoomConfigurator.jsx
git commit -m "feat(room-planner): select, move and delete a classroom desk"
```

---

### Task 8: Setup and per-desk controls

**Files:**
- Modify: `frontend/src/components/roomConfigurator/SectionControls.jsx`
- Modify: `frontend/src/pages/RoomConfigurator.jsx`

**Interfaces:**
- Consumes: Tasks 1–6

- [ ] **Step 1: Add the Seating-step controls, Classroom only**

A seats-per-desk stepper with `maxSeatsPerDesk` as its maximum and a default reading "6 (standard)", and an Add desk control beside it.

- [ ] **Step 2: Make the headcount a read-out once the list materialises**

Per spec §10.1, the headcount stops driving once `desks` is set. It shows `planSeatTotal` and says the per-desk controls now set it, rather than sitting there looking editable while being ignored.

- [ ] **Step 3: Add the per-desk seat stepper to the selection bar**

Bounded 1 to `maxSeatsPerDesk`, in the same bar as Task 7's Delete.

- [ ] **Step 4: Verify by hand**

Run: `cd frontend && npx craco test --watchAll=false` — expected PASS.

Then on a **cold dev server in a brand-new tab**: set seats-per-desk and confirm the layout re-seats; add a desk and confirm it appends and the rows reflow; change one desk's seats and confirm the headcount read-out rises by the difference; confirm the stepper will not go below 1 or above the room's ceiling; confirm the advice quotes the new total. Paste what you observed.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/roomConfigurator/SectionControls.jsx frontend/src/pages/RoomConfigurator.jsx
git commit -m "feat(room-planner): classroom desk setup and per-desk controls"
```
