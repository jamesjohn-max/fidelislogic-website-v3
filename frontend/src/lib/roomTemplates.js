import {
  CLASSROOM_DESK_DEPTH,
  DEVICE_ORDER,
  DEFAULT_SEATING_DENSITY,
  SOUNDBAR_AUDIO,
  ULTRAWIDE,
  AUDIO_PREFERENCES,
  SPREAD_CATEGORIES,
  GRID_STEP,
  addSpreadDevices,
  createPlacedDevice,
  displayWidthMeters,
  frontWall,
  generateLayout,
  placedSeats,
  recommendedAllInOneSize,
  recommendedDeviceCount,
  recommendedDisplaySize,
  seatingArea,
  typicalAllInOneMicReach,
  uid,
  occupancyLimit,
} from "./roomConfiguratorEngine";

const CEILING_MIC_AUDIO = AUDIO_PREFERENCES[0];
// Ceiling arrays enough to put every seat within their ~5 m pickup.
const ceilingMicsForSeats = ({ room, layout, table, tableOffset, chairCount, seats, area }) =>
  recommendedDeviceCount("microphone", layout, room, chairCount, null, CEILING_MIC_AUDIO, { seats, seatArea: area, table, tableOffset });

// Points spread over a rectangle, `cols` across and `rows` deep, each in the middle of
// its cell.
const gridOver = (area, cols, rows) =>
  Array.from({ length: cols * rows }, (_, i) => ({
    x: area.x + (area.w * ((i % cols) + 0.5)) / cols,
    y: area.y + (area.h * (Math.floor(i / cols) + 0.5)) / rows,
  }));

export const emptyDevices = () => Object.fromEntries(DEVICE_ORDER.map((c) => [c, []]));

// Ready-made rooms to start a plan from. Each sets the room's size, a boardroom table
// and its seats, and a device kit sized for that room: the screen sizes and speaker and
// microphone counts come from the same rules the "+" buttons suggest, worked out for the
// room as it is now. Everything stays editable afterwards.
//
// A kit is a list of devices in the order they're placed, since some find their spot
// relative to others (a booking panel beside the door, a camera by the screen, a touch
// panel clear of the table microphones).
const CONTROL_KIT = [{ category: "door" }, { category: "touchPanel" }, { category: "bookingPanel" }];
const screenSize = ({ room, layout, table }) => ({ sizeInches: recommendedDisplaySize(room, frontWall(layout, table)) });

export const ROOM_TEMPLATES = {
  small: {
    label: "Small room",
    people: "Up to 6 people",
    includes: ["All-in-one display", "Touch panel", "Booking panel"],
    room: { length: 4.5, width: 3.6, height: 2.7 },
    layout: "rectangular",
    table: { length: 2.4, width: 1.2, orientation: 0 },
    chairCount: 6,
    audioPreference: SOUNDBAR_AUDIO,
    kit: [
      {
        category: "allInOne",
        payload: ({ room, layout, table }) => {
          const sizeInches = recommendedAllInOneSize(room, frontWall(layout, table));
          return { sizeInches, micReach: typicalAllInOneMicReach(sizeInches) };
        },
      },
      ...CONTROL_KIT,
    ],
  },
  medium: {
    label: "Medium room",
    people: "Up to 10 people",
    includes: ["Display", "Video bar", "Table microphone", "Touch panel", "Booking panel"],
    room: { length: 6.5, width: 4.5, height: 2.8 },
    layout: "rectangular",
    table: { length: 3.6, width: 1.2, orientation: 0, screenEndFree: true },
    chairCount: 10,
    audioPreference: SOUNDBAR_AUDIO,
    kit: [
      { category: "display", payload: screenSize },
      { category: "videoBar", payload: () => ({ fov: 120 }) },
      { category: "microphone", count: () => 1 },
      ...CONTROL_KIT,
    ],
  },
  large: {
    label: "Large room",
    people: "Up to 16 people",
    includes: ["Display", "Camera", "Ceiling microphones", "Ceiling speakers", "Touch panel", "Booking panel"],
    room: { length: 9, width: 6, height: 3 },
    layout: "rectangular",
    table: { length: 5.4, width: 1.5, orientation: 0, screenEndFree: true },
    chairCount: 16,
    audioPreference: CEILING_MIC_AUDIO,
    kit: [
      { category: "display", payload: screenSize },
      { category: "camera", payload: () => ({ fov: 120 }) },
      { category: "speaker", count: ({ room, layout, chairCount }) => recommendedDeviceCount("speaker", layout, room, chairCount) },
      { category: "microphone", count: ceilingMicsForSeats },
      ...CONTROL_KIT,
    ],
  },
  // Beyond the Room Planner's three starting points: rooms the Meeting Rooms page draws
  // with the planner's canvas. Sizes follow Microsoft's Teams Rooms guidance (a focus
  // room seats four or fewer; its reference Signature Teams Boardroom seats 20-25 in
  // 700-900 sq ft, with more than one camera).
  focus: {
    label: "Focus room",
    people: "2 to 4 people",
    includes: ["Display", "Video bar", "Touch panel", "Booking panel"],
    room: { length: 3.6, width: 2.8, height: 2.7 },
    layout: "rectangular",
    table: { length: 1.6, width: 0.8, orientation: 0, screenEndFree: true },
    chairCount: 4,
    audioPreference: SOUNDBAR_AUDIO,
    kit: [{ category: "display", payload: screenSize }, { category: "videoBar", payload: () => ({ fov: 120 }) }, ...CONTROL_KIT],
  },
  boardroom: {
    label: "Boardroom",
    people: "16 to 25 people",
    includes: ["21:9 ultrawide display", "Two cameras", "Ceiling microphones", "Ceiling speakers", "Touch panel", "Booking panel"],
    room: { length: 11, width: 7, height: 3.2 },
    layout: "rectangular",
    table: { length: 7.2, width: 1.8, orientation: 0, screenEndFree: true },
    chairCount: 22,
    audioPreference: CEILING_MIC_AUDIO,
    kit: [
      { category: "display", payload: ({ room, layout, table }) => ({ sizeInches: recommendedDisplaySize(room, frontWall(layout, table), ULTRAWIDE), aspect: ULTRAWIDE }) },
      { category: "camera", payload: () => ({ fov: 90 }) },
      { category: "camera", payload: () => ({ fov: 90 }) },
      { category: "speaker", count: ({ room, layout, chairCount }) => recommendedDeviceCount("speaker", layout, room, chairCount) },
      { category: "microphone", count: ceilingMicsForSeats },
      ...CONTROL_KIT,
    ],
  },
  // A presenter-led hall: a stage zone in front of an LED wall, rows of seats set back
  // from it, a camera on the screen for the audience and one on the back wall for the
  // stage, presenter microphones on stage, ceiling microphones over the audience for
  // questions, and speakers either side of the screen with ceiling speakers over the
  // seats. Placed deliberately (see `positions`) rather than spread over the whole room.
  auditorium: {
    label: "Town hall",
    people: "25+ people",
    includes: ["LED wall", "Stage and audience cameras", "Presenter microphones", "Ceiling microphones", "Speakers", "Touch panel"],
    room: { length: 14, width: 10, height: 4.5 },
    layout: "theater",
    table: { length: 3, width: 1.2, orientation: 0 },
    chairCount: 96,
    // Rows start about 4 m back, leaving the front of the room as the stage.
    tableOffset: { x: 0, y: 2.8 },
    audioPreference: CEILING_MIC_AUDIO,
    kit: [
      { category: "display", payload: screenSize },
      { category: "camera", payload: () => ({ fov: 120 }) },
      // Stage camera: back wall, centred, looking at the presenter.
      { category: "camera", positions: ({ room }) => [{ x: room.length / 2, y: room.width - GRID_STEP, angle: 0, fov: 60 }] },
      // Presenters' wireless microphones, on the stage either side of the centre.
      { category: "microphone", positions: ({ room }) => [-1.5, 1.5].map((dx) => ({ x: room.length / 2 + dx, y: 1.8 })) },
      // Ceiling microphones over the audience for questions: three across, two deep.
      { category: "microphone", positions: ({ area }) => gridOver(area, 3, 2) },
      // Front speakers either side of the screen, then ceiling speakers over the seats,
      // four across and two deep, between the microphones.
      {
        category: "speaker",
        positions: ({ room, devices }) => {
          const screen = devices.display[0];
          const reach = (screen ? displayWidthMeters(screen.sizeInches, screen.aspect) / 2 : 1.5) + 0.8;
          return [-reach, reach].map((dx) => ({ x: room.length / 2 + dx, y: GRID_STEP, angle: 180 }));
        },
      },
      { category: "speaker", positions: ({ area }) => gridOver(area, 4, 2) },
      { category: "door" },
      // The operator's touch panel at the back, by the door.
      { category: "touchPanel", positions: ({ room }) => [{ x: room.length - 2.4, y: room.width - 0.5 }] },
    ],
  },
};

// How many people a template seats in the planner: its chairs, capped at the room's
// permitted occupancy (1 person per 1.5 m², Dubai Building Code).
export const templateSeats = (id) => Math.min(ROOM_TEMPLATES[id].chairCount, occupancyLimit(ROOM_TEMPLATES[id].room));

// The templates offered in the Room Planner's "Start from" choice.
export const TEMPLATE_IDS = ["small", "medium", "large"];

// A template's device kit laid out in the room as it is now: its size, table, seats
// (less any removed or moved), and where the table has been dragged. Rebuilt whenever
// those change, for as long as nobody has moved or changed a device by hand.
export function buildTemplateDevices(templateId, { room, layout, table, chairCount, seatingDensity = DEFAULT_SEATING_DENSITY, tableOffset = { x: 0, y: 0 }, podOverrides = {}, removedChairIndices = new Set(), chairOffsets = {} }) {
  const template = ROOM_TEMPLATES[templateId];
  if (!template) return emptyDevices();
  const { chairs } = generateLayout(layout, room, table, chairCount, podOverrides, seatingDensity);
  const seats = placedSeats(chairs, room, tableOffset, removedChairIndices, chairOffsets);
  const spreadCtx = { layout, room, table, tableOffset, seats: seatingArea(chairs.filter((_, i) => !removedChairIndices.has(i)), room, tableOffset) };
  const count = seats.length;
  return template.kit.reduce((devices, { category, payload, count: howMany, positions }) => {
    const ctx = { room, layout, table, tableOffset, devices, seats, chairCount: count, area: spreadCtx.seats };
    // Devices at spots the template picks itself (a town hall's stage microphones, say).
    if (positions) {
      const placed = positions(ctx).map(({ x, y, angle = 0, ...extra }) => ({ id: uid(category), x, y, angle, ...extra }));
      return { ...devices, [category]: [...devices[category], ...placed] };
    }
    if (SPREAD_CATEGORIES.includes(category)) return addSpreadDevices(devices, category, howMany(ctx), spreadCtx);
    return { ...devices, [category]: [...devices[category], createPlacedDevice(category, ctx, payload ? payload(ctx) : {})] };
  }, emptyDevices());
}

// Everything a template sets on a plan: the room, its furniture and seats, the audio
// setup its kit is built around, and the kit itself.
export function buildTemplatePlan(templateId) {
  const t = ROOM_TEMPLATES[templateId];
  const furniture = {
    room: { ...t.room },
    layout: t.layout,
    table: { deskDepth: CLASSROOM_DESK_DEPTH.default, ...t.table },
    chairCount: t.chairCount,
    seatingDensity: DEFAULT_SEATING_DENSITY,
    tableOffset: { ...(t.tableOffset || { x: 0, y: 0 }) },
  };
  return { ...furniture, audioPreference: t.audioPreference, devices: buildTemplateDevices(templateId, furniture) };
}
