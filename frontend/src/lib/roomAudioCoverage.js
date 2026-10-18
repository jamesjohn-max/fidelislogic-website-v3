import { CEILING_MIC_RANGE_M, TABLE_MIC_RANGE_M, TABLE_CAM_MIC_RANGE_M, typicalAllInOneMicReach, micMount } from "./roomConfiguratorEngine";

// --- default pickup / throw ranges, in metres -----------------------------------------
// Planning figures, NOT measured data: each is a starting point a planner can override
// per device or room-wide, and is meant to be tuned here, in one place, once checked
// against real installs. Mic defaults for ceiling arrays, table pods, 360 cameras and
// all-in-ones come from roomConfiguratorEngine and are re-exported, not redeclared.
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
  if (category === "allInOne") return item?.micReach ?? typicalAllInOneMicReach(item?.sizeInches);
  if (category === "videoBar") return VIDEO_BAR_MIC_RANGE_M;
  return micMount(state.audioPreference) === "table" ? TABLE_MIC_RANGE_M : slantToFloor(CEILING_MIC_RANGE_M, state.room);
}

// `category` is optional: dedicated speakers key off item.mount (absent reads as ceiling).
export function derivedSpeakerRange(item, state, category = "speaker") {
  if (category === "videoBar") return VIDEO_BAR_SPEAKER_RANGE_M;
  if (category === "allInOne") return ALL_IN_ONE_SPEAKER_RANGE_M;
  const mount = item?.mount ?? "ceiling";
  if (mount === "wall") return WALL_SPEAKER_RANGE_M;
  if (mount === "table") return SOUNDBAR_RANGE_M;
  return slantToFloor(CEILING_SPEAKER_RANGE_M, state.room);
}

// First finite value wins at each level (a NaN falls through like null); then the floor
// applies. 0 and negatives are present but invalid, so they clamp rather than fall through.
const firstFinite = (...values) => values.find(Number.isFinite);
const clamp = (v) => Math.max(MIN_RANGE_M, v);

export const resolveMicRange = (item, category, state) =>
  clamp(firstFinite(item?.micRange, state.audio?.micRange, derivedMicRange(item, category, state)) ?? MIN_RANGE_M);

export const resolveSpeakerRange = (item, category, state) =>
  clamp(firstFinite(item?.speakerRange, state.audio?.speakerRange, derivedSpeakerRange(item, state, category)) ?? MIN_RANGE_M);
