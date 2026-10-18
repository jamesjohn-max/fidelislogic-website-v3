// From the roomPlannerShared leaf, never from roomConfiguratorEngine: the engine imports
// this module, so importing it back would be a cycle, and React Refresh kills the whole
// bundle on one (see the note at the top of roomPlannerShared).
import { CEILING_MIC_RANGE_M, TABLE_MIC_RANGE_M, TABLE_CAM_MIC_RANGE_M, typicalAllInOneMicReach, micMount, defaultSpeakerMount, refCode } from "./roomPlannerShared";

// --- default pickup / throw ranges, in metres -----------------------------------------
// Planning figures, NOT measured data: each is a starting point a planner can override
// per device or room-wide, and is meant to be tuned here, in one place, once checked
// against real installs. Mic defaults for ceiling arrays, table pods, 360 cameras and
// all-in-ones come from roomPlannerShared and are re-exported, not redeclared.
export { CEILING_MIC_RANGE_M, TABLE_MIC_RANGE_M, TABLE_CAM_MIC_RANGE_M };
export const MIN_RANGE_M = 0.25; // floor: no source covers less than this (planning figure)
export const VIDEO_BAR_MIC_RANGE_M = 4; // beamforming bar mic (planning figure)
export const CEILING_SPEAKER_RANGE_M = 3; // slant-corrected like a ceiling mic (planning figure)
export const WALL_SPEAKER_RANGE_M = 6; // (planning figure)
export const SOUNDBAR_RANGE_M = 5; // soundbar / table speaker (planning figure)
export const VIDEO_BAR_SPEAKER_RANGE_M = 5; // (planning figure)
export const ALL_IN_ONE_SPEAKER_RANGE_M = 5; // (planning figure)

const SEATED_HEAD_M = 1.2;

// A range measured on the slant from the ceiling to a seated head, as a floor radius.
// Same maths as dedicatedMicReach in the engine.
const slantToFloor = (slantM, room) => {
  const drop = Math.max(0, (room?.height ?? 2.8) - SEATED_HEAD_M);
  return Math.sqrt(Math.max(0, slantM ** 2 - drop ** 2));
};

export function derivedMicRange(item, category, state) {
  if (category === "camera") return TABLE_CAM_MIC_RANGE_M;
  if (category === "allInOne") return typicalAllInOneMicReach(item?.sizeInches);
  if (category === "videoBar") return VIDEO_BAR_MIC_RANGE_M;
  return micMount(state.audioPreference) === "table" ? TABLE_MIC_RANGE_M : slantToFloor(CEILING_MIC_RANGE_M, state.room);
}

// `category` is optional: dedicated speakers key off item.mount. A plan saved before speakers
// had a mount reads as the setup's default, which is how it was drawn.
export function derivedSpeakerRange(item, state, category = "speaker") {
  if (category === "videoBar") return VIDEO_BAR_SPEAKER_RANGE_M;
  if (category === "allInOne") return ALL_IN_ONE_SPEAKER_RANGE_M;
  const mount = item?.mount ?? defaultSpeakerMount(state.audioPreference);
  if (mount === "wall") return WALL_SPEAKER_RANGE_M;
  if (mount === "table") return SOUNDBAR_RANGE_M;
  return slantToFloor(CEILING_SPEAKER_RANGE_M, state.room);
}

// First finite value wins at each level (a NaN falls through like null); then the floor
// applies. 0 and negatives are present but invalid, so they clamp rather than fall through.
const firstFinite = (...values) => values.find(Number.isFinite);
const clamp = (v) => Math.max(MIN_RANGE_M, v);

// `allInOne.micReach` predates this module and is a per-device figure, so it resolves at the
// item-override level, not below the room-wide one (spec §5.3, §8): a room-wide range must
// not silently beat a reach already set on the device. Precedence for an all-in-one is
// micRange -> legacy micReach -> room-wide -> typical for its size.
const itemMicOverride = (item, category) => (category === "allInOne" ? firstFinite(item?.micRange, item?.micReach) : item?.micRange);

export const resolveMicRange = (item, category, state) =>
  clamp(firstFinite(itemMicOverride(item, category), state.audio?.micRange, derivedMicRange(item, category, state)) ?? MIN_RANGE_M);

export const resolveSpeakerRange = (item, category, state) =>
  clamp(firstFinite(item?.speakerRange, state.audio?.speakerRange, derivedSpeakerRange(item, state, category)) ?? MIN_RANGE_M);

// --- coverage sources and reports --------------------------------------------------------
// One Source per physical emitter/pickup. `code` indexes the device within its WHOLE
// category array (so a 360 camera after a front camera is C2, matching the canvas label).
// `mount` is what the engine would read: a speaker's own, else the setup's default; a dedicated mic's
// follows the room's audio preference; other devices have none.
// `isCustom` means "this device does not follow the room-wide default", so `overrideOf`
// is the same item-level resolver the range uses — a legacy allInOne `micReach` reads as
// custom, because a room-wide range does not move it and the badge has to say why.
const sourcesOf = (state, kind, categories, include, rangeOf, overrideOf) =>
  categories.flatMap((category) =>
    (state.devices?.[category] ?? []).flatMap((item, index) =>
      include(category, item)
        ? [{
            id: item.id,
            code: refCode(category, index),
            category,
            kind,
            mount: category === "speaker" ? item.mount ?? defaultSpeakerMount(state.audioPreference) : category === "microphone" ? micMount(state.audioPreference) : null,
            x: item.x,
            y: item.y,
            range: rangeOf(item, category, state),
            isCustom: Number.isFinite(overrideOf(item, category)),
          }]
        : []
    )
  );

export const micSources = (state) =>
  sourcesOf(state, "mic", ["microphone", "videoBar", "allInOne", "camera"], (category, item) => category !== "camera" || item.isTableCam, resolveMicRange, itemMicOverride);

export const speakerSources = (state) =>
  sourcesOf(state, "speaker", ["speaker", "videoBar", "allInOne"], () => true, resolveSpeakerRange, (item) => item?.speakerRange);

// Seats are inside the room by construction, so clipping a source's disc to the walls
// changes what is drawn, never what is counted. 1e-6 matches `heardBy` in the engine.
const report = (state, sources) => {
  const seats = state.seats ?? [];
  const uncovered = seats.flatMap((seat, i) => (sources.some((s) => Math.hypot(seat.x - s.x, seat.y - s.y) <= s.range + 1e-6) ? [] : [i]));
  return { sources, seats: seats.length, covered: seats.length - uncovered.length, uncovered };
};

export const micCoverageReport = (state) => report(state, micSources(state));
export const speakerCoverageReport = (state) => report(state, speakerSources(state));
