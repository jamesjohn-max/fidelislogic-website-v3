// Static site content (company info, service page details, hero copy)
// Blog posts are served dynamically from the backend — do not store posts here.

export const stats = [
  {
    number: "100+",
    label: "Projects Delivered"
  },
  {
    number: "98%",
    label: "Client Satisfaction"
  },
  {
    number: "15+",
    label: "Years Experience"
  }
]; 

// The one label for the primary "talk to us" action. Every button that sends
// visitors to /contact to book a call uses this, so the offer reads the same
// in the header, heroes and closing CTAs.
export const consultationCta = "Book a Free Consultation";

// Homepage opening proposition (blueprint Home section 1). The headline states
// what Fidelis Logic is and who it serves; the subtitle states the working
// model, because the model is what the rest of the site depends on.
export const heroData = {
  title: "Independent modern workplace technology advice for the UAE and GCC",
  subtitle: "Fidelis Logic helps organisations and delivery partners choose, plan and document the right solution — and works through the reseller or system integrator you already trust.",
  ctaPrimary: "Book a Consultation",
  ctaSecondary: "Choose your journey",
  image: "/img/hero/workplace-1920.jpg",
  // Carousel slides. Order matters: the first is shown on initial paint.
  //
  // `basePath` points at the variants built by scripts/optimize-images.sh.
  // `objectPosition` is the focal point to keep in frame — the hero box is
  // ~2.2:1 on desktop but nearly portrait on a phone, so without this the
  // browser centre-crops and cuts the subject out of narrow viewports.
  images: [
    {
      basePath: "/img/hero/workplace",
      objectPosition: "60% 45%" // the meeting space and display, right of the headline
    },
    {
      basePath: "/img/hero/roomz",
      objectPosition: "72% 50%" // the booking panel
    },
    {
      basePath: "/img/hero/neat",
      objectPosition: "65% 42%" // the dual displays
    },
    {
      basePath: "/img/hero/logitech",
      objectPosition: "68% 48%" // the display and conference table
    },
    {
      basePath: "/img/hero/jabra",
      objectPosition: "62% 45%" // the participants, pushed clear of the headline
    }
  ],
  imageWidths: [768, 1280, 1920]
};

// `imageBase` names the responsive variants built by scripts/optimize-images.sh
// (`<imageBase>-<width>.webp` / `.jpg`). Each card image shows the category's
// actual hardware — a card selling AV that shows an empty room does not land.
export const segments = [
  {
    id: "meeting-rooms",
    title: "Meeting Rooms & AV Systems",
    description: "We help design and implement Microsoft Teams Rooms, Zoom Rooms, and BYOD Meeting spaces with professional audio-visual systems.",
    icon: "Presentation",
    imageBase: "/img/cards/meeting-rooms",
    link: "/solutions/meeting-rooms"
  },
  {
    id: "headsets",
    title: "Enterprise Headsets & Collaboration Devices",
    description: "Standardize communication devices across your organization - from Call Centers to Executive suites.",
    icon: "Headphones",
    imageBase: "/img/cards/headsets",
    link: "/solutions/headsets"
  },
  {
    id: "workspace-experience",
    title: "Room Booking & Workspace Experience",
    description: "Hot desking, Room booking panels, Visitor management, and Workplace analytics platforms.",
    icon: "Calendar",
    imageBase: "/img/cards/workspace-experience",
    link: "/solutions/workspace-experience"
  },
  {
    id: "business-apps",
    title: "Business Applications for Small Businesses",
    description: "Low-cost ERP, HRMS, CRM, and AI integration with quick setup, monthly plans, and ongoing support.",
    icon: "BarChart3",
    imageBase: "/img/cards/business-apps",
    link: "/solutions/business-apps"
  }
];

export const segmentImageWidths = [400, 800];

// Widths built for full-bleed / large hero images.
export const heroImageWidths = [768, 1280, 1920];

export const howWeHelp = [
  {
    step: "01",
    title: "Assess",
    description: "We analyze your current workplace setup, understand your business objectives, and identify gaps and opportunities."
  },
  {
    step: "02",
    title: "Design",
    description: "We create vendor-neutral solution architectures tailored to your needs, budget, and technical environment."
  },
  {
    step: "03",
    title: "Deliver",
    description: "We work alongside the customer’s preferred reseller or system integrator so the solution is deployed smoothly and successfully."
  },
  {
    step: "04",
    title: "Support",
    description: "We provide lifecycle support, user training, issue resolution, and continuous optimization."
  }
];

export const whyChooseUs = [
  {
    title: "Business-first, vendor-neutral guidance",
    description: "We recommend solutions based on your business needs, operational goals, and user requirements, not on a one-size-fits-all product push.",
    icon: "Shield"
  },
  {
    title: "Work through your trusted vendors",
    description: "We work with your preferred reseller or system integrator, so you keep existing relationships while gaining expert guidance and delivery support.",
    icon: "Handshake"
  },
  {
    title: "End-to-end delivery support",
    description: "From assessment and solution design to deployment and post-go-live support, we help make sure the solution is implemented successfully.",
    icon: "RefreshCw"
  },
  {
    title: "Outcomes that matter",
    description: "Better-fit solutions, smoother deployments, lower risk, and stronger results for both customers and delivery partners.",
    icon: "Target"
  }
];

export const testimonials = [
  {
    name: "Sarah Al-Mansouri",
    role: "IT Director",
    company: "Leading Financial Services Firm",
    content: "They simplified our Microsoft Teams Rooms deployment across 50+ locations. The structured approach and vendor-neutral guidance saved us significant time and budget.",
    rating: 5
  },
  {
    name: "Ahmed Hassan",
    role: "Operations Manager",
    company: "Healthcare Group",
    content: "Outstanding support in standardizing our headset infrastructure. The consultation process helped us make informed decisions aligned with our hybrid work model.",
    rating: 5
  },
  {
    name: "Lisa Chen",
    role: "CEO",
    company: "Small Business Technology Company",
    content: "Their business applications consulting transformed our operations. From ERP selection to training, they delivered a solution that actually works for our team.",
    rating: 5
  }
];

export const partners = {
  videoCollaboration: [
    { name: "Poly", logo: "https://via.placeholder.com/120x60?text=Poly" },
    { name: "Yealink", logo: "https://via.placeholder.com/120x60?text=Yealink" },
    { name: "Neat", logo: "https://via.placeholder.com/120x60?text=Neat" },
    { name: "Logitech", logo: "https://via.placeholder.com/120x60?text=Logitech" }
  ],
  audioSolutions: [
    { name: "Jabra", logo: "https://via.placeholder.com/120x60?text=Jabra" },
    { name: "Sennheiser", logo: "https://via.placeholder.com/120x60?text=Sennheiser" },
    { name: "EPOS", logo: "https://via.placeholder.com/120x60?text=EPOS" },
    { name: "Shure", logo: "https://via.placeholder.com/120x60?text=Shure" },
    { name: "QSYS", logo: "https://via.placeholder.com/120x60?text=QSYS" }
  ],
  displaySharing: [
    { name: "Barco", logo: "https://via.placeholder.com/120x60?text=Barco" },
    { name: "Crestron", logo: "https://via.placeholder.com/120x60?text=Crestron" },
    { name: "Extron", logo: "https://via.placeholder.com/120x60?text=Extron" },
    { name: "Samsung", logo: "https://via.placeholder.com/120x60?text=Samsung" }
  ],
  platforms: [
    { name: "Microsoft Teams", logo: "https://via.placeholder.com/120x60?text=MS+Teams" },
    { name: "Zoom", logo: "https://via.placeholder.com/120x60?text=Zoom" },
    { name: "Webex", logo: "https://via.placeholder.com/120x60?text=Webex" },
    { name: "Google Meet", logo: "https://via.placeholder.com/120x60?text=Meet" }
  ]
};

export const roomTypes = [
  {
    title: "Executive Board Rooms",
    description: "Premium AV for high-stakes meetings",
    icon: "Crown"
  },
  {
    title: "Huddle Rooms",
    description: "Compact solutions for quick collaboration",
    icon: "Users"
  },
  {
    title: "Training rooms",
    description: "Interactive learning environments",
    icon: "GraduationCap"
  },
  {
    title: "Auditoriums",
    description: "Large-scale presentation systems",
    icon: "Theater"
  },
  {
    title: "Townhall Spaces",
    description: "All-hands meeting solutions",
    icon: "Building"
  },
  {
    title: "Focus Rooms",
    description: "Private video calling booths",
    icon: "Video"
  }
];

export const whyChooseUsAdvantages = [
  {
    title: "Turnkey Meeting Room Deployment",
    description: "From design to installation, we handle complete Meeting Room Deployment for MTR, Zoom Rooms, and hybrid spaces.",
    icon: "CheckCircle2"
  },
  {
    title: "BYOD & BYOM Ready",
    description: "Enable Hybrid Working with seamless BYOD and BYOM solutions, supporting any device or platform.",
    icon: "Smartphone"
  },
  {
    title: "Rapid Response Support",
    description: "Annual Maintenance Contracts and Support Contracts ensure minimal downtime with priority response times.",
    icon: "Headphones"
  },
  {
    title: "Vendor-Agnostic Expertise",
    description: "Certified partners for Poly, Jabra, Yealink, Neat, Barco, Sennheiser, QSYS, and Shure solutions.",
    icon: "Award"
  }
];

export const contactInfo = {
  email: "info@fidelislogic.com",
  phone: "+971 52 360 7270",
  location: "Sharjah, United Arab Emirates",
  linkedin: "#",
  youtube: "#",
  instagram: "#"
};

// Topic list kept for anything that still reads a flat list of topics.
export const formTopics = [
  "Meeting Room Assessment",
  "Headset Consultation",
  "Workplace Experience Platform",
  "Business Applications (ERP/HRMS/CRM)",
  "General Inquiry",
  "Request Quote",
  "Request Site Survey"
];

// Topics offered per audience (blueprint section 10, Contact). The Contact form
// shows the list matching the selected audience, so a reseller is not asked to
// pick from a customer's menu. Values are stored as-is on the enquiry, so keep
// them readable in the admin inbox.
export const topicsByAudience = {
  organisation: [
    "Meeting Room Assessment",
    "ROOMZ / Workspace Management",
    "Headset Standardisation",
    "Business Applications (ERP/HRMS/CRM)",
    "AI Integration",
    "Room Planner Follow-up",
    "Technology Refresh or Office Move",
    "Support or Maintenance",
    "Request Site Survey",
    "Request Quote",
    "General Enquiry"
  ],
  partner: [
    "White-label Site Assessment",
    "White-label Solution Design",
    "Documentation or BOQ Support",
    "Project Management Capacity",
    "Deployment Assistance",
    "Training & Adoption Delivery",
    "Second-line Support Capacity",
    "Tender or Bid Support",
    "General Partner Enquiry"
  ]
};

export const meetingRoomDetails = {
  hero: {
    title: "Meeting Rooms & AV Systems",
    subtitle: "Design, implement, and commission professional meeting spaces with Teams Rooms, Zoom Rooms, and BYOD capabilities.",
    imageBase: "/img/page-hero/meeting-rooms",
    ogImage: "/img/social/og-meeting-rooms.jpg"
  },
  useCases: [
    {
      title: "Huddle spaces",
      image: "huddle", // photo slot in data/siteImages.js → meetingRoomTypes
      description: "4-6 person informal collaboration rooms with single display and USB conferencing bar.",
      icon: "Users"
    },
    {
      title: "Meeting rooms",
      image: "meeting", // photo slot in data/siteImages.js → meetingRoomTypes
      description: "8-12 person rooms with dual displays, ceiling microphones, and professional cameras.",
      icon: "Video"
    },
    {
      title: "Boardrooms",
      image: "boardroom", // photo slot in data/siteImages.js → meetingRoomTypes
      description: "Executive spaces with premium AV, wireless presentation, and full DSP audio systems.",
      icon: "Crown"
    },
    {
      title: "Training rooms",
      image: "training", // photo slot in data/siteImages.js → meetingRoomTypes
      description: "Flexible spaces supporting instruction, recording, and remote participation.",
      icon: "GraduationCap"
    }
  ],
  // Design considerations (blueprint section 7): how audio, camera, lighting,
  // content sharing and room control have to work together.
  designConsiderations: [
    {
      title: "Audio before anything else",
      description: "Microphone coverage, speaker placement and the room's own acoustics decide whether a call is bearable. Reverberant glass and hard ceilings change the answer.",
      icon: "AudioLines"
    },
    {
      title: "Camera framing and sightlines",
      description: "Field of view against room depth, seating layout and viewing distance — so everyone is in frame and everyone can read the display.",
      icon: "Video"
    },
    {
      title: "Lighting on faces, not behind them",
      description: "Backlit windows and downlights above the table are the two most common reasons a room looks worse than its camera should allow.",
      icon: "Sun"
    },
    {
      title: "Content sharing that works first time",
      description: "Wired HDMI, wireless sharing or both, chosen against who actually walks into the room — staff, guests, or both.",
      icon: "MonitorUp"
    },
    {
      title: "Room control people can use",
      description: "One touch panel, a consistent layout across rooms, and no laminated instructions taped to the table.",
      icon: "TabletSmartphone"
    },
    {
      title: "Network, power and cable routes",
      description: "Switch ports, PoE budget, containment and the physical route from table to display — confirmed before anyone orders hardware.",
      icon: "Network"
    }
  ],
  capabilities: [
    "Microsoft Teams Rooms (MTR) design & deployment",
    "Zoom Rooms implementation",
    "BYOD meeting room solutions",
    "Acoustic analysis & treatment",
    "Network readiness assessment",
    "Professional installation & commissioning",
    "User training & documentation",
    "Ongoing support & optimization"
  ]
};

export const headsetDetails = {
  hero: {
    title: "Enterprise Headsets & Collaboration Devices",
    subtitle: "Standardize communication devices across your organization with expert guidance on comfort, compatibility, and performance.",
    imageBase: "/img/page-hero/headsets",
    ogImage: "/img/social/og-headsets.jpg"
  },
  personas: [
    {
      title: "Call center agents",
      description: "Comfortable all-day wear, noise cancellation, quick disconnect, fleet management.",
      icon: "Headphones"
    },
    {
      title: "Hybrid workers",
      description: "Versatile headsets for video calls, focus work, and mobility across office and home.",
      icon: "Laptop"
    },
    {
      title: "Executives",
      description: "Premium devices with superior audio quality, professional aesthetics, and seamless connectivity.",
      icon: "Briefcase"
    }
  ],
  // Environment and compatibility (blueprint section 7).
  environmentFactors: [
    {
      title: "How noisy is the room?",
      description: "An open contact-centre floor, a shared office and a private room each call for a different microphone and a different level of passive isolation.",
      icon: "Volume2"
    },
    {
      title: "Which UC platform is certified?",
      description: "Teams, Zoom or Webex certification affects call control, mute sync and how support handles a fault. It is a procurement detail worth checking, not a marketing badge.",
      icon: "BadgeCheck"
    },
    {
      title: "Wired, DECT or Bluetooth?",
      description: "Density, roaming range and charging habits decide this more than preference does. A busy floor of Bluetooth headsets behaves differently from a handful.",
      icon: "Radio"
    },
    {
      title: "What are they plugging into?",
      description: "Laptop, docking station, desk phone or softphone on a thin client — including whether USB-A or USB-C is what actually reaches the user.",
      icon: "Usb"
    },
    {
      title: "How long is it worn?",
      description: "A device worn for six hours a day is judged on weight, clamping force and ear-cushion material, not on frequency response.",
      icon: "Clock"
    },
    {
      title: "Who manages the fleet?",
      description: "Firmware, settings and asset visibility need an owner and a tool, otherwise every device drifts to its own configuration.",
      icon: "Settings"
    }
  ],
  // Standardisation (blueprint section 7).
  standardisation: [
    "A short list of approved models per user profile, rather than an open catalogue",
    "One configuration baseline per model, so support is troubleshooting a known state",
    "A single management tool for firmware and settings across the fleet",
    "Consistent accessories and spares, so a replacement is same-day rather than a project",
    "A documented refresh cycle, so budget is predictable",
    "A clear exception route for the users who genuinely need something different"
  ],
  // Evaluation (blueprint section 7).
  evaluationSteps: [
    {
      step: "01",
      title: "Define the profiles",
      description: "Group users by environment and workload rather than by job title, and agree how many profiles the organisation actually needs."
    },
    {
      step: "02",
      title: "Shortlist against the profiles",
      description: "Two or three candidate models per profile, with the reason each one is on the list written down."
    },
    {
      step: "03",
      title: "Trial with real users",
      description: "A short pilot with the people who will wear the device all day, on the platform they actually use."
    },
    {
      step: "04",
      title: "Standardise and roll out",
      description: "Confirm the approved list, the configuration baseline and the management tool before volume ordering."
    }
  ],
  whatWeSolve: [
    "Comfort & ergonomics for extended use",
    "Microphone clarity & background noise control",
    "Device standardization & compatibility",
    "Fleet provisioning & management",
    "Integration with UC platforms (Teams, Zoom, etc.)",
    "Budget optimization across user personas"
  ]
};

export const workspaceExperienceDetails = {
  hero: {
    title: "Room Booking & Workspace Experience Platforms",
    subtitle: "Optimize office utilization with hot desking, room booking panels, visitor management, and workplace analytics.",
    imageBase: "/img/page-hero/workspace-experience",
    ogImage: "/img/social/og-workspace-experience.jpg"
  },
  // Challenges the page opens with (blueprint section 7).
  challenges: [
    {
      title: "Rooms look booked and stand empty",
      description: "Recurring invitations and abandoned meetings hold space that nobody is using, while people walk the floor looking for a room.",
      icon: "CalendarX"
    },
    {
      title: "Nobody knows how the office is really used",
      description: "Attendance is discussed from anecdotes and badge counts, neither of which says which spaces are working.",
      icon: "HelpCircle"
    },
    {
      title: "Desks are allocated for a pattern that has changed",
      description: "Fixed seating designed for five days a week now sits half empty, and teams have no way to sit together on the days they come in.",
      icon: "Armchair"
    },
    {
      title: "Cabling makes every panel a project",
      description: "Power and network at every doorway turns a booking rollout into a construction job, so it gets postponed.",
      icon: "Cable"
    },
    {
      title: "A lease decision is coming",
      description: "Renewal or fit-out conversations need evidence about how much space is actually required.",
      icon: "Building"
    },
    {
      title: "Platforms all demo well",
      description: "Every vendor shows the same dashboard. The differences only appear in integration, mounting and day-two administration.",
      icon: "Layers"
    }
  ],
  // Sensors and analytics (blueprint section 7).
  sensorsAndAnalytics: [
    {
      title: "Room occupancy sensing",
      description: "Detects whether a booked room is actually occupied, which is what makes no-show release and honest utilisation reporting possible."
    },
    {
      title: "Desk-level sensing",
      description: "Shows which desks are used and how often, so allocations can follow the real pattern rather than the org chart."
    },
    {
      title: "Wire-free deployment",
      description: "Battery-powered displays and sensors avoid running power and network to every door, which is usually what decides whether a rollout happens at all."
    },
    {
      title: "Booked versus used",
      description: "The comparison that matters: scheduled time against occupied time, per room and per period."
    },
    {
      title: "Reporting for a real decision",
      description: "Define the question first — release unused rooms, rebalance demand, or size a future floor — and report against that."
    },
    {
      title: "Calendar integration",
      description: "Microsoft 365, Exchange or Google Workspace resource accounts, with ownership and permissions confirmed before rollout."
    }
  ],
  // Privacy considerations (blueprint section 7). Written as the questions to
  // settle, not as a claim about any particular product's behaviour.
  privacyConsiderations: [
    "Choose sensing that counts presence rather than identifying people, and confirm in writing what each sensor records.",
    "Agree what is reported at individual level, if anything, and who can see it.",
    "Decide retention periods for occupancy data before the first sensor is installed.",
    "Tell employees what is being measured and why — a workplace analytics rollout that surprises people rarely survives.",
    "Check where data is stored and processed, and whether that satisfies your own policies.",
    "Keep desk-level data aggregated for reporting unless there is a specific, agreed reason not to."
  ],
  capabilities: [
    {
      title: "Room booking systems",
      description: "Panel displays outside meeting rooms showing real-time availability and reservations.",
      icon: "CalendarCheck"
    },
    {
      title: "Hot desking solutions",
      description: "Enable flexible workspace reservations and optimize seating in hybrid work environments.",
      icon: "Laptop"
    },
    {
      title: "Visitor management",
      description: "Digital check-in, badge printing, host notifications, and compliance tracking.",
      icon: "UserCheck"
    },
    {
      title: "Workplace analytics",
      description: "Occupancy data, space utilization reports, and insights to optimize real estate costs.",
      icon: "BarChart3"
    },
    {
      title: "Wayfinding",
      description: "Digital signage and maps to help employees and visitors navigate office spaces.",
      icon: "Map"
    },
    {
      title: "Monitoring & device management",
      description: "Real-time monitoring and analytics to reduce downtime, prevent incidents, and increase productivity.",
      icon: "Binoculars"
    }
  ],
  platforms: [
   {
   name: "ROOMZ",
    href: "https://roomz.io",
    logo: "/platform-images/roomz.png"
   },
   {
    name: "morbit",
    href: "https://www.morbit.co.uk",
    logo: "/platform-images/morbit.png"
   }
  ]
};

export const businessAppsDetails = {
  hero: {
    title: "Low-cost ERP, HRMS & CRM for small businesses",
    subtitle: "Launch a practical business application platform with near-zero license cost, cloud or on-prem deployment, AI-assisted ERP updates, and Fidelis Logic support for configuration, training, and monthly optimization.",
    imageBase: "/img/page-hero/business-apps",
    ogImage: "/img/social/og-business-apps.jpg"
  },
  painPoints: [
    {
      title: "Fragmented tools",
      description: "Multiple disconnected systems creating data silos and manual rework.",
      icon: "Puzzle"
    },
    {
      title: "Manual processes",
      description: "Time-consuming spreadsheet-based workflows limiting growth and accuracy.",
      icon: "FileSpreadsheet"
    },
    {
      title: "Lack of reporting",
      description: "No real-time visibility into financials, operations, or customer data.",
      icon: "TrendingDown"
    },
    {
      title: "Scaling challenges",
      description: "Systems that can't keep pace with business growth and complexity.",
      icon: "AlertTriangle"
    }
  ],
  // Data and integration (blueprint section 7).
  dataAndIntegration: [
    {
      title: "Decide what data actually moves",
      description: "Opening balances, the customer and supplier master, open transactions and a defined amount of history — rather than \"everything\", which is how migrations stall.",
      icon: "Database"
    },
    {
      title: "Clean it before it moves",
      description: "Duplicate customers and half-finished item codes are cheaper to fix in a spreadsheet than in a live system.",
      icon: "Brush"
    },
    {
      title: "Agree the system of record",
      description: "For each entity — customer, employee, invoice, stock item — one system owns it and the others follow.",
      icon: "GitBranch"
    },
    {
      title: "Connect what has to be connected",
      description: "Accounting, payroll, e-commerce, bank feeds and reporting. Anything else can wait for a later phase.",
      icon: "Plug"
    },
    {
      title: "Reconcile before go-live",
      description: "Balances and counts checked against the old system, signed off by whoever owns the numbers.",
      icon: "Scale"
    },
    {
      title: "Keep an export route",
      description: "Know how to get your data out again. It is the simplest protection against being locked into a platform.",
      icon: "Download"
    }
  ],
  // AI use cases (blueprint section 7): grounded in workflows that exist, not
  // in demonstrations. Each is framed as assistance with a human check.
  aiUseCases: [
    {
      title: "Reading documents into the system",
      description: "Supplier invoices, delivery notes and expense receipts turned into draft entries for a person to approve, instead of being typed in by hand.",
      workflow: "Accounts payable"
    },
    {
      title: "Drafting the routine replies",
      description: "Quotation follow-ups and standard customer responses drafted from the record, then sent by the person who owns the relationship.",
      workflow: "Sales and service"
    },
    {
      title: "Asking the database in plain language",
      description: "\"Which customers have not ordered since March?\" answered without waiting for someone to build a report.",
      workflow: "Reporting"
    },
    {
      title: "Catching the entries that look wrong",
      description: "Flagging duplicates, unusual amounts and missing references for review before they reach the ledger.",
      workflow: "Finance controls"
    },
    {
      title: "Keeping records current with a lean team",
      description: "Assisted data entry so a small team can keep an ERP up to date, which is the usual reason an ERP quietly stops being trusted.",
      workflow: "Operations"
    },
    {
      title: "Summarising a long thread",
      description: "Case and email history condensed so whoever picks up a ticket does not start from the beginning.",
      workflow: "Support"
    }
  ],
  offer: [
    "Near-zero license cost ERP, HRMS, and CRM platform options",
    "Starter plans from USD 10 per month for small businesses",
    "Cloud-hosted and on-premise deployment models",
    "AI platform integrations to help maintain ERP entries with entry-level or lean staffing",
    "Configuration support for accounting, HR, sales, inventory, and service workflows",
    "Monthly payment plans for implementation, hosting, and support",
    "User training, data migration, reporting, and continuous optimization"
  ]
};
