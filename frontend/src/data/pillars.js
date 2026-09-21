// The three priority commercial pillars (blueprint section 1) plus the
// supporting solutions that follow them.
//
// `segments` in data/siteContent.js still describes all four solution areas as
// equal cards and is unchanged — the solution pages and their copy depend on
// it. This file is the ordered, weighted view: three pillars lead, everything
// else is a supporting link. Home section 3 and the /solutions hub both read it
// so the emphasis is identical in both places.

export const priorityPillars = [
  {
    id: "workspace",
    order: 1,
    title: "ROOMZ and Workspace Management",
    // Kept short — it sits under a large heading on the homepage.
    tagline: "Booking, hot desking, occupancy insight and workplace analytics",
    description:
      "Room and desk booking, hot desking, occupancy insight, analytics and the day-to-day workplace experience — so space decisions rest on what the building is actually doing.",
    bullets: [
      "Room booking panels and calendar integration",
      "Desk booking and hot desking",
      "Occupancy sensors and utilisation analytics",
      "Wayfinding, visitor flow and workplace experience"
    ],
    href: "/solutions/workspace-experience",
    // Manufacturer page for the platform itself, kept distinct from the
    // solution page (blueprint section 3).
    brandHref: "/brands/roomz",
    brandLabel: "ROOMZ platform and products",
    imageBase: "/img/cards/workspace-experience",
    icon: "CalendarCheck",
    ctaLabel: "Discuss a workspace requirement",
    // Related content, so each pillar links out to the services, brands and
    // tools that belong to it (blueprint section 7, Solutions hub).
    relatedServices: ["workspace-audits", "deployment-configuration", "managed-support"],
    // Brand slugs — see solutionBrandMap in data/brands.js.
    brandSolutionKey: "workspace-experience"
  },
  {
    id: "meeting-rooms",
    order: 2,
    title: "Video Conferencing and Meeting Rooms",
    tagline: "Teams Rooms, Zoom Rooms, BYOD spaces, audio, cameras and sharing",
    description:
      "Microsoft Teams Rooms, Zoom Rooms and BYOD spaces, with the audio, cameras, content sharing and room control specified as one system rather than a parts list.",
    bullets: [
      "Microsoft Teams Rooms and Zoom Rooms",
      "BYOD and BYOM meeting spaces",
      "Professional audio, cameras and content sharing",
      "Room control, commissioning and adoption"
    ],
    href: "/solutions/meeting-rooms",
    imageBase: "/img/cards/meeting-rooms",
    icon: "Presentation",
    ctaLabel: "Plan a room or discuss a project",
    toolHref: "/tools/room-configurator",
    toolLabel: "Start planning your room",
    relatedServices: ["consulting", "deployment-configuration", "video-conferencing-rentals", "training-adoption"],
    brandSolutionKey: "meeting-rooms"
  },
  {
    id: "business-apps",
    order: 3,
    title: "Business Applications and AI",
    tagline: "ERP, CRM, HRMS and practical AI integration",
    description:
      "ERP, CRM, HRMS and workflow improvement, with AI applied to the processes that actually consume your team's time rather than to a demonstration.",
    bullets: [
      "ERP, CRM and HRMS selection and configuration",
      "Phased implementation around live operations",
      "Data migration and integration between systems",
      "AI integration grounded in real workflows"
    ],
    href: "/solutions/business-apps",
    imageBase: "/img/cards/business-apps",
    icon: "BarChart3",
    ctaLabel: "Request a process consultation",
    relatedServices: ["consulting", "training-adoption", "managed-support"],
    // No brand page group: the application platforms are not part of the
    // curated hardware brand ecosystem.
    brandSolutionKey: null
  }
];

// Supporting capabilities: present, discoverable, but not competing with the
// three pillars for attention.
export const supportingSolutions = [
  {
    id: "headsets",
    title: "Enterprise Headsets",
    description:
      "Device standardisation for call centres, office users, hybrid workers and executives.",
    href: "/solutions/headsets",
    icon: "Headphones",
    ctaLabel: "Discuss a headset standardisation requirement"
  },
  {
    id: "room-planner",
    title: "Room Planner",
    description:
      "Document a room, check sightlines and produce a report you can hand to a technical team.",
    href: "/tools/room-configurator",
    icon: "LayoutDashboard",
    ctaLabel: "Start planning your room"
  },
  {
    id: "brands",
    title: "Brands we deliver",
    description:
      "ROOMZ, Poly, Jabra, Yealink, Neat, Logitech and the rest of the curated ecosystem.",
    href: "/brands",
    icon: "Boxes",
    ctaLabel: "Request a brand consultation"
  },
  {
    id: "services",
    title: "Lifecycle services",
    description:
      "Consulting, assessments, deployment, rentals, moves, support, refresh and training.",
    href: "/services",
    icon: "Wrench",
    ctaLabel: "Discuss your requirements"
  }
];

export const getPillar = (id) => priorityPillars.find((p) => p.id === id);
