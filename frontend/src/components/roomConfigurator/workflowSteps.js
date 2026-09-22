// Room Planner is used two ways. A customer captures their own room to hand to a
// technology partner; a reseller or integrator gathers everything their technical team
// needs, device plan included. Each has its own path through the steps.
export const AUDIENCES = {
  customer: {
    label: "Customer",
    title: "I'm planning my own meeting room",
    description:
      "Capture your meeting room's details in one place, ready to pass to your preferred technology partner so they can design the best solution for you.",
  },
  reseller: {
    label: "Reseller / Integrator",
    title: "I'm planning a room for a client",
    description:
      "Gather every detail in a single visit, so your technical team has all it needs to design the best solution — with no repeat site visits.",
  },
};

// The flow: each step covers one part of the room. From the third step on — once there's
// furniture to place — the plan stays on screen beside every step, so a choice made
// here shows up there. Each step's sections fold
// away except one; `defaultGroup` is the one open on arrival.
const ABOUT = {
  customer: {
    id: "about",
    label: "About",
    title: "You and your room",
    description: "Who's sending this and which room it's for — shown at the top of the report.",
    defaultGroup: "details",
  },
  reseller: {
    id: "about",
    label: "Project",
    title: "Project details",
    description: "Who's preparing this plan and who it's for — shown at the top of the report.",
    defaultGroup: "details",
  },
};

const ROOM = {
  id: "room",
  label: "Room",
  title: "Room dimensions and finishes",
  description: "Seating and display sizes all follow from the room itself.",
  defaultGroup: "dimensions",
};

const DETAILS = {
  id: "details",
  label: "Site details",
  title: "Photos and notes",
  description: "Anything the survey and install teams should know that the plan can't show.",
  defaultGroup: "photos",
  planHint: "Photos and notes are added to the PDF report alongside this plan.",
};

export const STEPS_BY_AUDIENCE = {
  customer: [
    ABOUT.customer,
    {
      ...ROOM,
      title: "Room size and finishes",
      description: "Measured wall to wall, plus what the floor and ceiling are made of.",
    },
    {
      id: "table",
      label: "Layout",
      title: "Tables and layout",
      description: "How the room is furnished — its tables, their size and top — as it is today, or as you'd like it.",
      defaultGroup: "shape",
      planHint: "Drag the tables, seating, door or display to where they are in the room.",
    },
    {
      ...DETAILS,
      label: "Photos & notes",
      description: "Show and tell your technology partner anything the plan can't.",
      planHint: "Photos and notes are added to the PDF alongside this plan.",
    },
    {
      id: "review",
      label: "Review",
      title: "Review and export",
      description: "Check the details, then download them as a PDF to share with your technology partner.",
      planHint: "This plan goes into the report exactly as shown.",
    },
  ],
  reseller: [
    ABOUT.reseller,
    ROOM,
    {
      id: "seating",
      label: "Seating",
      title: "Seating and furniture",
      description: "Pick a layout, then size the table and seating.",
      defaultGroup: "layout",
      // No planHint: the plan's own hint already covers moving tables and chairs.
    },
    {
      id: "video",
      label: "Video",
      title: "Video and displays",
      description: "The screens people watch and the cameras that see them.",
      defaultGroup: "devices",
      planHint: "Drag any device to move it. Select a camera, video bar or all-in-one display, then drag its round handle to aim it.",
    },
    {
      id: "audio",
      label: "Audio & control",
      title: "Audio and room control",
      description: "Clear sound, and easy ways to join, share and book.",
      defaultGroup: "audio",
      planHint: "Microphones and speakers spread out evenly on their own — drag any one to fine-tune it.",
    },
    DETAILS,
    {
      id: "review",
      label: "Review",
      title: "Review and export",
      description: "Check the plan, then download it as a branded PDF.",
      // No fixed defaultGroup: opens on what's still missing, or on the summary.
      planHint: "This plan goes into the report exactly as shown.",
    },
  ],
};

// Which step each recommendation belongs to, so it's raised beside the controls
// that resolve it. Anything unmapped still appears on the review step.
export const RECOMMENDATION_STEP = {
  "no-door": "room",
  "no-layout": "seating",
  "large-boardroom": "seating",
  "seats-block-display": "seating",
  "no-display": "video",
  "display-undersized": "video",
  "no-camera": "video",
  "camera-coverage": "video",
  "table-cam-needs-bar": "video",
  "no-speaker": "audio",
  "videobar-extra-speaker": "audio",
  "no-microphone": "audio",
  "builtin-mic-range": "audio",
  "mic-coverage": "audio",
  "soundbar-speakers": "audio",
  "soundbar-microphones": "audio",
  "no-touch-panel": "audio",
  "no-booking-panel": "audio",
};
