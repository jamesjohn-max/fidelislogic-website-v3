# Classroom seating — per-desk seat counts and movable desks

**Date:** 20-Oct-26
**Status:** Design approved in chat, pending review of this document
**Branch:** `classroom-per-desk-seating` (off `main`)

---

## 1. Purpose

In Classroom / Training layouts a planner can today choose a headcount and a density,
and the engine lays out rows of desks to fit. They cannot say how many seats sit at a
desk, and they cannot move one desk — the whole seating group moves together.

Real training rooms are not uniform. A room has a wide desk at the front and narrower
ones behind, or one desk pulled aside for a trainer. This work lets a planner say how
many seats a desk carries, and move any single desk with its seats attached.

Success: a planner can set up a 24-person training room at 3 seats per desk, then drag
the front desk aside and give it 2 seats, and the plan, the 3D view and the PDF all
reflect it.

## 2. Scope

**In scope**

- A seats-per-desk choice at setup, alongside headcount and density.
- Selecting a single desk and dragging it, with its seats following.
- Changing the seat count on a selected desk.
- The room's seat total derived from the desks rather than driving them.

- Adding and deleting individual desks.

**Out of scope (deliberate)**

- Rotating a desk. Pods rotate, desks face the front by definition; no one asked.
- Any change to Theater, Open Collaboration or the table-sized layouts.
- Per-desk overrides surviving a change of layout type.

## 3. Current state

Established by reading the code:

| Thing | Today |
|---|---|
| Classroom generation | `classroomLayout(room, deskDepth, count, density)` → `rowSeatingLayout`, which takes **no overrides** |
| Seats per desk | `CLASSROOM_LAYOUT.blockSeats = 6` — a constant. `rowBlocks(seatsInRow, sp)` splits each row into blocks of at most that many, and **one desk is emitted per block** |
| Desks | A flat array across all rows: `desks.push({ x, y, w: seatsInBlock * seatPitch, h: deskDepth })`. **A row can hold several desks**, separated by aisles |
| Chairs | Pushed with `{ x, y, angle }` and **no index tying them to a desk** |
| Physical capacity | `rowCapacity(room, spacing)` → `{ seatsPerRow, maxRows }`, from `maxUnitsInSpan(usableW, blockSeats, seatPitch, aisle)` |
| Seat total | `chairCount` on the plan drives everything. `fitOccupancy` hard-clamps it to `getChairLimits`, which is `min(layout fit, occupancyLimit(room))` |
| Precedent for this work | **Open Collaboration already does most of it.** `podOverrides[index] = { radius, dx, dy, angle }`, chairs tagged with `podIndex`, and the canvas moves a pod with its chairs |
| What the precedent does *not* do | Pods never carry a per-unit seat count. `podCount = ceil(count / SEATS_PER_POD)` and `seatsHere = min(perPod, remaining)` — geometry is overridable, seat counts are always derived from the total |

The last two rows are the shape of this work: copy the pod override machinery, and add
the one thing it deliberately does not have.

## 4. Decisions

Settled with the user:

1. **Per-desk seat counts are the truth; the room total is derived from them.** Adding a
   seat to a desk raises the room's total rather than taking a seat from another desk.
2. **Desk count comes from a target headcount at setup**, as now: the planner says
   roughly how many people and how many seats per desk, and the engine derives the desks.
   Per-desk edits adjust from there.
3. **Approach A** — extend the pod override pattern to desks, rather than merging pods
   and desks into one shared system (which would refactor working code nobody asked
   about).

Consequences accepted when those were chosen:

4. **The room capacity limit becomes advisory for Classroom.** `fitOccupancy` currently
   hard-clamps `chairCount` to `getChairLimits`. With the total derived, that clamp would
   either do nothing or fight the planner mid-edit. It becomes a visible warning instead.
   This applies **only to Classroom**; every other layout keeps the hard clamp.

Decided without spending a question, both following the pod precedent:

5. **Desks drag free-form, clamped to the room.** The user asked to move a desk "about";
   pods already behave this way.
6. **Overrides persist through room and density changes**, with geometry re-clamped, as
   `podOverrides` do.

## 5. Data model

### 5.1 A desk list, not an override bag

The obvious design — `deskOverrides[index] = { seats, dx, dy }`, mirroring
`podOverrides` — **does not survive deletion**. An index means "the Nth desk in the
generated order", so removing desk 1 silently shifts every override above it onto the
wrong desk. Pods get away with index keys precisely because a pod cannot be added or
deleted: `podCount` is always `ceil(count / SEATS_PER_POD)`.

Once desks are user-managed, the state has to travel *with* the desk:

```js
state.seatsPerDesk = null   // null = CLASSROOM_LAYOUT.blockSeats (today's 6)
state.desks = null          // null = derive from setup; otherwise an ordered list
                            // [{ id, seats, dx, dy }, ...]
```

This is simpler than the override bag, not harder. There is no key to go stale: delete
splices the list, add pushes onto it, and each desk carries its own seat count and
offset. `id` is a stable generated string so React keys and canvas selection survive a
reorder.

`null` for either field means "derive" — the behaviour a plan has today, though not
guaranteed to the pixel (§9).

### 5.2 Position comes from flow, offsets are deviations

Desks are **not** absolutely positioned. The generator lays the list out in rows exactly
as it does now — same row pitch, same aisles, same centring — and `dx`/`dy` offset a
desk from the position that flow gives it. So deleting a desk reflows the rest, and a
desk a planner dragged keeps its displacement relative to its new flowed home.

This is what keeps a classroom looking like a classroom after edits. Absolute positions
would let the grid dissolve into scattered desks after a few deletions.

### 5.3 Why not reuse `podOverrides`

Different arrays, different generators. Sharing one bag would mean a classroom edit
silently applying to a pod when the layout changes. `state.desks` is cleared on layout
change (§9).

## 6. Layout generation

`classroomLayout` takes the desk list instead of a headcount:

```js
classroomLayout(room, deskDepth, desks, density, seatsPerDesk)
```

`desks` is `state.desks`, or — when that is `null` — the list derived from the setup
headcount: `ceil(headcount / seatsPerDesk)` desks each carrying `seatsPerDesk` seats.
Deriving it in one place means the rest of the generator never has to care which case it
is in.

Inside `rowSeatingLayout`, three changes:

1. **`blockSeats` becomes a parameter, not a constant read.** `rowBlocks` and
   `rowCapacity` take the effective seats-per-desk instead of reading
   `CLASSROOM_LAYOUT.blockSeats`. Theater keeps passing its own constant, so
   `THEATER_LAYOUT` is untouched — the two share this code path and must not move
   together.
2. **Each emitted desk carries its id, and each chair is tagged with it.**
   `desks.push({ ..., deskId })` and `chairs.push({ ..., deskId })` — the same idea as
   `collaborationLayout` tagging `podIndex`, but keyed by the stable id rather than a
   position, so a delete cannot re-point a chair at a different desk.
3. **Each desk's own state applies after placement.** A desk carries its `seats`, and
   its position is the flowed `(x, y)` plus `(dx, dy)`, clamped to the room. Its chairs
   are laid out against its seat count and offset with it.
4. **Rows are packed from the list, not from a headcount.** Today `rowBlocks` splits a
   row's seats into desks. With an explicit list the direction reverses: desks are taken
   in order and packed into a row until the next one will not fit the usable width, then
   a new row starts. This is the one piece of genuinely new layout logic in the work.

### 6.1 The seat-count ceiling is physical, not policy

A desk cannot carry more seats than fit across the room. `rowCapacity` already computes
that from `usableW`, `seatPitch` and `aisle`. Per-desk seats clamp to it, and the UI
shows the ceiling rather than letting a planner set a number the room silently ignores.

### 6.2 Row widths stop being uniform

Today every desk in a row holds the same count, because `rowBlocks` splits evenly. With
per-desk overrides a row can hold a 2-seat and a 5-seat desk. Rows stay centred on the
room's midline, so a row's width is the sum of its desks plus aisles. The existing
centring code already computes `rowSpan` per row, so this falls out — but it is the
assumption most likely to surprise, and the tests pin it (§11).

## 7. Interaction

Reuse, do not rebuild. The canvas already hit-tests a pod group, drags table-plus-chairs
and commits via `commitPodMove`. Desks take the same path:

- A desk is selectable as a unit (`rc-table-group`, as pods are).
- Dragging moves the desk and every chair tagged with its `deskId`.
- The drag commits `dx`/`dy` onto that desk in `state.desks`, clamped to the room.
- A selected desk shows a seat-count stepper and a delete control in the existing
  selection bar — the same bar that holds a device's range control and its Delete, so
  both patterns are already on screen and already keyboard-reachable.
- Adding a desk is a control on the Seating step, not on the canvas: a new desk has no
  meaningful position until it flows, so there is nothing to click on to create it.
  It appends to the list and the layout reflows.

### 7.1 Deleting the last desk

A classroom with no desks is not a classroom. Deleting the final desk is refused with
the reason given, rather than silently ignored or allowed to produce an empty room —
the same shape as the planner's existing minimum-chair handling.

## 8. The derived total, and what reads it

This is the part that reaches outside the layout engine.

For Classroom only, the plan's seat total becomes `sum(seats on each desk)`. Everything
downstream reads `state.seats`, which is built from the generated chairs, so the chairs
being the source of truth is already how most of the system works. The places that read
`chairCount` directly need checking, not rewriting:

- `fitOccupancy` — must not clamp Classroom (§4.4). It still clamps every other layout.
- `getChairLimits` — still computes the physical fit, now used for the **warning** and
  for the per-desk ceiling rather than a hard clamp.
- The capacity readout and the recommendations — read the derived total.
- Audio coverage, sightlines, the PDF and the 3D view — **verified safe.** They read
  `state.seats`, which `RoomConfigurator.jsx:498` builds from `layoutResult.chairs`. The
  chairs are already the source of truth for those consumers, so a derived total reaches
  them correctly with no change.

### 8.1 The recommendation copy is the real exposure

`chairCount` is read as "the number of people in the room" inside **user-visible
sentences**, and those are the call sites that will quote a stale number if the derived
total diverges from it. Found, not assumed:

| Site | What it does |
|---|---|
| `roomConfiguratorEngine.js:1766`, `:1768`, `:1773` | Decides how many microphones and speakers to recommend |
| `:2005`, `:2009` | *"A soundbar carries to about 10 people — add speakers so all {chairCount} can hear remote participants clearly."* |
| `:2015` | The `chairCount >= 8` threshold that triggers a speaker recommendation |
| `:2041`, `:2045` | The same pair for microphones |

Every one of these must read the derived total for Classroom. This matters more than it
looks: the audio-coverage work merged in `b5482d8` existed in large part to stop the
planner's advice contradicting its own plan, and this is the same defect class arriving
from the other direction — a room that seats 26 after per-desk edits while the advice
still says "so all 24 can hear".

The implementation should resolve this once, at the point the plan's seat total is read,
rather than patching eight call sites: a single accessor that returns the derived total
for Classroom and `chairCount` everywhere else.

## 9. Migration and compatibility

A saved plan has neither `seatsPerDesk` nor `desks`. Both `null` mean "derive":

- `seatsPerDesk ?? CLASSROOM_LAYOUT.blockSeats` is the existing constant, 6.
- `desks === null` derives the list from the setup headcount.

No `DRAFT_VERSION` bump — both fields are additive, so old drafts and shared links
still load.

**Pixel-identical output is explicitly not required.** The user has accepted that a
classroom layout in an existing shared link may render slightly differently after this
change. That matters because the new row packing distributes seats differently from the
old one at the edges: today `balancedSplit` spreads a row's seats evenly with the front
rows taking any remainder, while packing desks until one will not fit produces a
different tail. Reproducing the old distribution exactly would have been real work for
no benefit anyone wanted.

What is still required: an old plan must **load and render** without error, and a
planner's own in-progress draft must not be lost mid-session. A link that renders a
slightly different room is acceptable; one that throws is not.

**The list materialises on first edit, not on load** — and this is a UX requirement, not
a migration one. A plan stays on `desks: null`, and so keeps following its headcount,
until the planner adds, deletes, moves or re-seats a desk. If the list materialised the
moment Classroom was chosen, the headcount box would stop driving the layout before the
planner had used it once.

`desks` is **cleared when the layout type changes**, like the seating hand-edits the plan
already clears (`seatEditsCleared`). A desk list is meaningless once the room is a
U-shape.

## 10. Setup control

The seats-per-desk choice joins headcount and density on the Seating step, shown only
for Classroom. It is a small stepper with the physical ceiling from §6.1 as its maximum,
and a default that reads "6 (standard)" so the current behaviour is visibly the default
rather than an unlabelled starting number. An "Add desk" control sits beside it.

### 10.1 What happens to the headcount once desks are edited

Once `state.desks` materialises, the setup headcount stops driving the layout — the desk
list does. The headcount field must say so rather than sitting there looking live while
being ignored: it becomes a read-out of the derived total, with the per-desk controls as
the way to change it.

Changing seats-per-desk after the list has materialised is a **re-seat of every desk
that has not been individually changed**, leaving hand-set desks alone. That is the only
reading consistent with the per-desk edits being the truth; the alternative — silently
resetting a planner's hand-set desks — would lose work.

## 11. Testing

New tests in `roomConfiguratorEngine.test.js`, matching the suite's existing idiom:

1. **Shape guard** — a classroom plan with `seatsPerDesk: null` and `desks: null` still
   produces a sane classroom: the requested number of chairs, `tableShape.type ===
   "desks"`, every desk inside the walls, and no two desks in a row overlapping. It
   deliberately does **not** assert exact coordinates — §9 released that — so it catches
   a broken rewrite without failing on a legitimately different seat distribution.
2. `seatsPerDesk: 3` with a 12-person target produces 4 desks of 3.
3. A per-desk `seats` change affects only that desk, and the room total rises by the
   difference.
4. A per-desk `seats` value above the physical fit clamps to `rowCapacity`'s ceiling.
5. Every chair carries the `deskId` of the desk it belongs to, and the counts per id
   match the desks.
6. A `dx`/`dy` moves the desk and all of its chairs by the same vector, and clamps at
   the room edge.
7. **Mixed-width rows** — a row holding a 2-seat and a 5-seat desk stays centred on the
   room midline (§6.2).
8. Theater is unaffected by `seatsPerDesk` — it keeps `THEATER_LAYOUT.blockSeats`.
9. `fitOccupancy` does not clamp a Classroom plan, and still clamps a rectangular one.
10. **Advice matches the plan** (§8.1) — a Classroom plan whose per-desk edits raise the
    total past `SOUNDBAR_SPEAKER_CAPACITY` produces advice quoting the *derived* total,
    not the setup headcount. The guard against the same contradiction the audio work
    was merged to remove.
11. **Deleting a desk does not move another desk's state** — the test that earns the
    move from index keys to ids. Set distinct seat counts and offsets on three desks,
    delete the first, and assert the remaining two keep *their own* values. Under the
    rejected `deskOverrides[index]` design this fails.
12. Adding a desk appends it with `seatsPerDesk` seats and reflows the rows.
13. Deleting the last remaining desk is refused and leaves the plan unchanged (§7.1).
14. **Materialise-on-first-edit** (§9) — a plan with `desks: null` still follows its
    headcount; the first desk edit writes the list, and the headcount stops driving.
15. Changing `seatsPerDesk` after materialisation re-seats untouched desks and leaves a
    hand-set desk alone (§10.1).

## 12. Known ceilings and follow-ups

| Simplification | Ceiling | Revisit when |
|---|---|---|
| No desk rotation | A desk cannot be angled | A room needs angled training pods |
| Capacity is advisory for Classroom | A planner can exceed the room's fire-safe occupancy and only sees a warning | If the warning proves too easy to ignore |
| Desk list cleared on layout change | Switching to U-shape and back loses desk edits | If planners switch layouts to compare and expect edits to survive |
| Desks flow; they are not freely placed | `dx`/`dy` displace a desk from its flowed position, so deleting an earlier desk shifts it. A desk cannot be pinned to an absolute spot | If planners want a fixed trainer's desk that never reflows |
| New desks append | A desk is always added at the end of the list, then flows. There is no "insert before this one" | If ordering turns out to matter to planners |

## 13. Files touched

| File | Change |
|---|---|
| `lib/roomConfiguratorEngine.js` | `blockSeats` as a parameter; `classroomLayout` takes a desk list; row packing from the list (§6.4); `deskId` tagging; `fitOccupancy` exemption; the single derived-total accessor (§8.1) |
| `lib/roomPlanState.js` | `seatsPerDesk` and `desks` in `initialPlan`; materialise on first edit; clear `desks` on layout change |
| `lib/roomConfiguratorEngine.test.js` | §11 |
| `components/roomConfigurator/RoomCanvas.jsx` | Desk selection and drag, reusing the pod path; delete in the selection bar |
| `components/roomConfigurator/SectionControls.jsx` | Seats-per-desk stepper and Add desk on the Seating step; per-desk seat stepper in the selection bar; headcount becomes a read-out once materialised |
| `pages/RoomConfigurator.jsx` | Thread the new state; capacity warning for Classroom |
