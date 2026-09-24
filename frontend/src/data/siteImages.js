// Every photo slot that isn't owned by another data file, in one place.
//
// Service photography lives in services.json, brand photography in brands.js,
// and blog/deal images come from the admin. Everything else — page headers,
// the audience cards, the Room Planner preview — is registered here, so
// changing an image never means hunting through page components.
//
// To change an image
// ------------------
// 1. Easiest: point `base` at any other variant set already in public/img.
//    A set is `<base>-<width>.webp` and `<base>-<width>.jpg`; `widths` must
//    list widths that exist for it (JPEG stops at 1280).
// 2. New photo: put the original in image-sources/<folder>/, add it to
//    scripts/optimize-images.sh, run the script, then point `base` at it.
//
// `width`/`height` are the intrinsic size of the largest variant and reserve
// layout space; update them when the new image has a different shape.
// `alt` is empty where surrounding text already says what the image shows.
//
// Several slots currently reuse service photography as placeholders — noted
// on each entry. Those photos also appear lower down their own service page.

export const siteImages = {
  // The real 3D Room Planner, captured from the app itself and cropped to
  // the 3D view and review panel (see image-sources/room-planner/). Used on
  // the homepage and the planner's start screen.
  roomPlanner3d: {
    base: "/img/room-planner/preview",
    widths: [768, 1280],
    width: 1280,
    height: 800,
    alt: "The Room Planner's 3D view of a nine-seat boardroom, with a sightline from one seat to the display, beside the review panel listing the room's configuration, ready to export as a PDF.",
  },

  // Audience journeys: shown on the gateway cards and as the header image of
  // the matching audience page, so the card previews where it leads.
  audienceOrganisation: {
    // Placeholder: reuses services/consulting-2.
    base: "/img/services/consulting-2",
    widths: [400, 768, 1280, 1920],
    width: 1920,
    height: 1280,
    alt: "",
    position: "50% 40%",
  },
  audiencePartner: {
    // Placeholder: reuses services/deployment-configuration-2.
    base: "/img/services/deployment-configuration-2",
    widths: [400, 768, 1280, 1920],
    width: 1920,
    height: 1280,
    alt: "",
    position: "50% 50%",
  },

  // Meeting Rooms & AV page: one photo per room type, keyed by the `image`
  // field on meetingRoomDetails.useCases in siteContent.js.
  // Placeholders: manufacturer photography from brand-hero/, which the brand
  // pages also use.
  meetingRoomTypes: {
    huddle: {
      base: "/img/brand-hero/jabra-2",
      widths: [768, 1280, 1920],
      width: 1920,
      height: 1280,
      alt: "Four colleagues at a small table on a video call, with one wall display and a video bar.",
      position: "50% 45%",
    },
    meeting: {
      base: "/img/brand-hero/neat-2",
      widths: [768, 1280, 1920],
      width: 1920,
      height: 1278,
      alt: "A mid-size meeting room on a video call, with dual displays in front of about ten people.",
      position: "50% 40%",
    },
    boardroom: {
      base: "/img/brand-hero/neat-4",
      widths: [768, 1280, 1920],
      width: 1920,
      height: 1277,
      alt: "A long boardroom table with executive chairs, facing dual displays on the far wall.",
      position: "55% 50%",
    },
    training: {
      base: "/img/brand-hero/logitech-1",
      widths: [768, 1280, 1920],
      width: 1920,
      height: 1080,
      alt: "A training room with flexible mobile seating and a display on a mobile stand.",
      position: "45% 50%",
    },
  },

  // Page header images (PageHeader `image` prop).
  headerSolutions: {
    // Placeholder: reuses services/video-conferencing-rentals-2.
    base: "/img/services/video-conferencing-rentals-2",
    widths: [400, 768, 1280, 1920],
    width: 1920,
    height: 1280,
    alt: "A long boardroom with a wall display at the far end and leather chairs along a wooden table.",
    position: "50% 55%",
  },
  headerServices: {
    // Placeholder: reuses services/training-adoption-2.
    base: "/img/services/training-adoption-2",
    widths: [400, 768, 1280, 1920],
    width: 1920,
    height: 1080,
    alt: "A presenter taking questions from a small team around a meeting table.",
    position: "60% 45%",
  },
  headerContact: {
    // Placeholder: reuses services/technology-refresh-2.
    base: "/img/services/technology-refresh-2",
    widths: [400, 768, 1280, 1920],
    width: 1920,
    height: 1280,
    alt: "A small meeting room with a wall-mounted display, a wooden table and chairs.",
    position: "40% 50%",
  },
};
