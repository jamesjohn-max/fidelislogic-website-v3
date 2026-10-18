// Leaf declarations shared by roomConfiguratorEngine and roomAudioCoverage.
//
// This module exists to break an import cycle, so it must import NOTHING from either of
// them — or from anything that does. The engine re-exports every name here, so existing
// consumers keep importing them from the engine and nothing outside this pair changes.
//
// Why a cycle was not survivable: React Refresh's `registerExportsForReactRefresh`
// ENUMERATES a module's exports as that module evaluates, which reads every exported
// binding. With a cycle, a re-exported `const` from the half-initialised side is still in
// its TDZ at that moment, and the whole bundle dies with "Cannot access 'X' before
// initialization" — an empty <body>, not just a broken page. Jest and `craco build` never
// run React Refresh, so a full green suite and a clean production build both miss it. Keep
// this module a leaf and the problem cannot come back.

// --- audio preferences ----------------------------------------------------------------

export const AUDIO_PREFERENCES = ["Ceiling Microphone Array", "Table Microphone Pods", "Soundbar (Integrated Mic + Speaker)", "Wireless Boundary Microphones"];
// A soundbar is the room's speaker and microphones in one, good for a limited number of
// people: beyond these, extra speakers / microphones are needed.
export const SOUNDBAR_AUDIO = AUDIO_PREFERENCES[2];
export const CEILING_MIC_AUDIO = AUDIO_PREFERENCES[0];

// Whether the room's microphones hang from the ceiling or sit on the table (table
// pods and wireless boundary mics both do; so does an audio setup not yet chosen).
export const micMount = (audioPreference) => (audioPreference === CEILING_MIC_AUDIO ? "ceiling" : "table");

// A speaker's mount unless someone sets it: a soundbar setup's speaker sits on the
// table, everything else (including no setup chosen yet) is up in the ceiling.
export const defaultSpeakerMount = (audioPreference) => (audioPreference === SOUNDBAR_AUDIO ? "table" : "ceiling");

// --- default mic reaches, in metres ---------------------------------------------------

// How far dedicated microphones pick up a talker: a ceiling array about 5 m (straight
// line, from the ceiling down to a seated head), a table microphone about 5 ft.
export const CEILING_MIC_RANGE_M = 5;
export const TABLE_MIC_RANGE_M = 1.524; // 5 ft
// A 360° camera has microphones built in; an average pickup reach is used for planning.
export const TABLE_CAM_MIC_RANGE_M = 3;

// An all-in-one display's mic reach varies by model, from 3-5 m (Surface Hub, Board Pro
// G2 55"/75") to 7-8 m (Rally Board 65, MeetingBoard) and 10 m (Neat Board Pro) — so it's
// set per device. Without a datasheet to go by, a typical reach for the size is assumed:
// 4 m up to 55", 7 m from 65".
export const typicalAllInOneMicReach = (sizeInches) => (sizeInches <= 55 ? 4 : 7);

// --- device reference codes -----------------------------------------------------------

// Short reference codes shown as canvas labels and in the text brief (D1, C1, M1, SP1, ...).
export const DEVICE_REF_PREFIX = {
  display: "D",
  allInOne: "AIO",
  camera: "C",
  videoBar: "VB",
  microphone: "M",
  speaker: "SP",
  touchPanel: "TP",
  contentSharing: "CS",
  door: "DR",
  bookingPanel: "BP",
};
export const refCode = (category, index) => `${DEVICE_REF_PREFIX[category]}${index + 1}`;
