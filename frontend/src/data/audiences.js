// The two audience journeys from the content blueprint (section 1).
//
// Both audiences carry equal weight: the gateway renders them side by side and
// neither is labelled secondary. This file is the single source of truth for
// the gateway component, the /for-organisations and /for-partners pages, the
// header "Who We Help" menu, the footer and the Contact form's audience field.

export const audiences = [
  {
    id: "organisation",
    // Used by the Contact form's audience field and analytics params.
    value: "organisation",
    href: "/for-organisations",
    navLabel: "For Organisations",
    // First person, as the visitor would say it — used in the gateway.
    selfLabel: "I represent an organisation",
    summary:
      "Assess requirements, compare approaches, plan the solution and coordinate delivery with a trusted vendor.",
    gatewayBlurb:
      "Independent planning and solution-selection support, delivered with the reseller you already trust.",
    bullets: [
      "Structured assessment of what your spaces and teams actually need",
      "Comparison of platforms and approaches without a product quota behind it",
      "Documented recommendations your stakeholders and finance team can review",
      "Delivery coordinated through your preferred reseller or system integrator"
    ],
    ctaLabel: "Book an independent consultation",
    icon: "Building2"
  },
  {
    id: "partner",
    value: "partner",
    href: "/for-partners",
    navLabel: "For Resellers & Integrators",
    selfLabel: "I am a reseller or system integrator",
    summary:
      "Add confidential assessment, solution-design, project-management, deployment and support capacity under a white-label model.",
    gatewayBlurb:
      "Confidential white-label capacity that strengthens your own customer relationship.",
    bullets: [
      "Discovery and assessment carried out under your brand",
      "Solution design and documentation you can put straight into a proposal",
      "Project management and deployment assistance when your team is committed elsewhere",
      "Training and ongoing support, with the customer relationship staying yours"
    ],
    ctaLabel: "Discuss white-label support",
    icon: "Handshake"
  }
];

export const getAudience = (id) => audiences.find((a) => a.id === id);

export const organisationAudience = getAudience("organisation");
export const partnerAudience = getAudience("partner");

// Four-stage advisory model (blueprint section 5, Home section 5). Reused on
// /for-organisations so the process reads identically in both places.
export const advisoryStages = [
  {
    step: "01",
    title: "Understand the business and space",
    description:
      "We start with how your teams work, what the rooms and desks are used for, and which decisions are already committed — not with a product list."
  },
  {
    step: "02",
    title: "Assess requirements and current technology",
    description:
      "We review the estate you already own, the calendar and collaboration platforms in use, and the gaps between what exists and what is needed."
  },
  {
    step: "03",
    title: "Recommend and document an appropriate solution",
    description:
      "You receive a written recommendation with the reasoning, the trade-offs we considered, and enough detail for a technical team or a BOQ."
  },
  {
    step: "04",
    title: "Support delivery through your preferred partner",
    description:
      "Your reseller or system integrator quotes, supplies and installs. We stay involved so the design that was agreed is the design that gets built."
  }
];

// White-label capabilities (blueprint section 6, /for-partners sequence item 3).
// Deliberately free of response times, territories, exclusivity or availability
// promises — those need commercial approval before publication.
export const partnerCapabilities = [
  {
    title: "Discovery and requirement gathering",
    description:
      "We run the discovery conversation with your customer's stakeholders and hand you structured notes you can quote from.",
    icon: "Search"
  },
  {
    title: "Site assessment",
    description:
      "Room-by-room assessment of dimensions, sightlines, acoustics, power, network and existing devices.",
    icon: "ClipboardCheck"
  },
  {
    title: "Solution design",
    description:
      "Platform and device selection with the reasoning written down, so your proposal explains itself.",
    icon: "PencilRuler"
  },
  {
    title: "Documentation",
    description:
      "Room schedules, bills of quantity, cable schedules and as-built documentation, produced under your brand.",
    icon: "FileText"
  },
  {
    title: "Project management",
    description:
      "A certified project manager to run the programme when your own team is committed elsewhere.",
    icon: "GanttChartSquare"
  },
  {
    title: "Deployment assistance",
    description:
      "Installation, configuration and commissioning support alongside your engineers.",
    icon: "Wrench"
  },
  {
    title: "Training and adoption",
    description:
      "End-user and IT handover sessions so the rooms get used the way they were designed to be.",
    icon: "GraduationCap"
  },
  {
    title: "Ongoing support",
    description:
      "Second-line support capacity behind your own service desk.",
    icon: "Headphones"
  }
];

// When a partner typically calls us in (blueprint /for-partners item 2).
export const partnerSituations = [
  {
    title: "A tender needs a design you don't have time to produce",
    description:
      "The deadline is close and the room design, device list and documentation still have to be written."
  },
  {
    title: "The requirement sits outside your core specialism",
    description:
      "You lead with networking, furniture or IT services and the customer has asked about meeting rooms, room booking or workspace analytics."
  },
  {
    title: "Your project team is already committed",
    description:
      "The order is won but every project manager and engineer is on another site."
  },
  {
    title: "The customer wants an independent second opinion",
    description:
      "An assessment that is visibly not tied to a single manufacturer strengthens the recommendation you are making."
  },
  {
    title: "A multi-site rollout needs consistent documentation",
    description:
      "Several buildings, several room types, and one standard that has to hold across all of them."
  }
];

// Working model and boundaries (blueprint /for-partners items 4 and 5).
export const partnerPrinciples = [
  {
    title: "The customer relationship stays yours",
    description:
      "You own the account, the commercial conversation and the contract. We work to your instructions and introduce ourselves the way you ask us to."
  },
  {
    title: "We work under your brand",
    description:
      "Assessments, designs and documentation are prepared so you can issue them as your own deliverables."
  },
  {
    title: "Confidential by default",
    description:
      "Your customer names, pricing and proposals are not used as references, case studies or marketing material without your written agreement."
  },
  {
    title: "We do not compete for the supply",
    description:
      "We advise, design and support delivery. The hardware, licences and the order stay with you."
  },
  {
    title: "Scope agreed in writing first",
    description:
      "Each engagement starts with a written scope so it is clear what we are producing, what you are producing, and who is speaking to the customer."
  }
];

// Decision problems /for-organisations opens with (blueprint item 2).
export const organisationProblems = [
  {
    title: "Every vendor's proposal looks the same",
    description:
      "Three quotes, three different product families, and no shared basis on which to compare them.",
    icon: "Layers"
  },
  {
    title: "Nobody can say what the room actually needs",
    description:
      "Room size, seating, acoustics and sightlines are rarely written down, so the specification is a guess.",
    icon: "Ruler"
  },
  {
    title: "The decision has to survive scrutiny",
    description:
      "IT, facilities, finance and procurement each need a reason to approve, and a feature list is not a reason.",
    icon: "ShieldCheck"
  },
  {
    title: "Changing supplier is not an option",
    description:
      "There is an existing reseller relationship that works, and no appetite to replace it to get better advice.",
    icon: "Handshake"
  }
];
