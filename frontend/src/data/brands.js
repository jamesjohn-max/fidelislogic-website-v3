// Brand ecosystem data for Fidelis Logic's curated strategic partners.
// Copy is written for premium B2B advisory positioning — concise, outcome-led,
// and free of vendor marketing fluff. Update via this file only (single source of truth).

export const brands = [
  {
    slug: "roomz",
    name: "ROOMZ",
    tagline: "Wire-free room booking for hybrid workplaces",
    featured: true,
    priority: 1,
    partnershipType: "Distribution Partner",
    category: "Workspace Experience",
    categorySlug: "workspace-experience",
    logoText: "ROOMZ",
    logoImages: [
      "/brand-logos/roomz.webp",
      "/brand-logos/roomz.png",
      "/brand-logos/roomz.svg"
    ],
    logoScale: 0.79, // 2.4:1 wordmark
    accentColor: "#5EA5E9",
    heroImage: "/img/social/og-brand-roomz.jpg",
    heroImages: [
      { basePath: "/img/brand-hero/roomz-1", objectPosition: "60% 50%" },
      { basePath: "/img/brand-hero/roomz-2", objectPosition: "50% 50%" },
      { basePath: "/img/brand-hero/roomz-3", objectPosition: "50% 50%" },
      { basePath: "/img/brand-hero/roomz-4", objectPosition: "72% 50%" }
    ],
    productVisuals: [
      "/product-images/roomz/display.webp",
      "/product-images/roomz/room-sensor.webp",
      "/product-images/roomz/desk-sensor.webp",
      "/product-images/roomz/huddle-sensor.webp",
      "/product-images/roomz/myroomz.webp",
      "/product-images/roomz/advanced-analytics.webp"
    ],
    seoContent: {
      title: "ROOMZ UAE | Wireless Room Booking & Occupancy Sensors",
      description:
        "Plan and deploy ROOMZ wireless room booking panels, occupancy sensors and workplace analytics in the UAE with local consultation and support.",
      keywords: [
        "ROOMZ UAE",
        "wireless room booking system UAE",
        "meeting room booking panel Dubai",
        "occupancy sensor UAE",
        "workspace analytics Dubai",
        "Microsoft 365 room booking"
      ],
      officialUrl: "https://roomz.io/meeting-room-solution/",
      image: {
        src: "/img/social/og-brand-roomz.jpg",
        alt: "ROOMZ wireless meeting room booking display in a modern office",
        caption:
          "ROOMZ combines a cable-free booking display with anonymous occupancy sensing, helping UAE workplaces compare scheduled meetings with actual room use."
      },
      overview: [
        "ROOMZ is a practical fit when an organisation wants to improve meeting-room availability without adding power or network cabling at every doorway. The display connects to the existing booking environment, while optional sensors add evidence about whether reserved rooms are actually being used.",
        "For UAE rollouts, Fidelis Logic helps map rooms, validate calendar integration, plan mounting positions and define the rules for instant booking, check-in and room release. The result is a deployment shaped around employee behaviour and facilities reporting—not simply a panel installation."
      ],
      buyingGuide: [
        {
          title: "Which calendars and resource accounts are in scope?",
          text: "Confirm Microsoft 365, Exchange or Google Workspace ownership, naming and permissions before the rollout begins."
        },
        {
          title: "Do you need booking visibility or occupancy evidence?",
          text: "Displays solve wayfinding and booking friction; sensors add actual-use data and can support no-show workflows."
        },
        {
          title: "What decisions should analytics support?",
          text: "Define whether the priority is releasing unused rooms, balancing demand or planning a future office footprint."
        }
      ],
      video: {
        type: "youtube",
        id: "-Z_NAOSVIig",
        uploadDate: "2020-03-25T03:30:12-07:00",
        title: "ROOMZ workplace solutions overview",
        description:
          "Official ROOMZ video introducing its meeting-room and workplace experience approach for hybrid offices."
      }
    },
    shortDescription:
      "Swiss-engineered, battery-powered room booking panels and occupancy sensors that make hybrid offices run on time — without cabling, calendar conflicts, or ghost meetings.",
    longDescription:
      "ROOMZ is a Swiss workspace experience platform combining e-paper booking panels, occupancy sensors, and cloud analytics. It integrates natively with Microsoft 365, Google Workspace, and Exchange — giving facilities and IT teams real-time visibility into room utilisation while ending the daily friction of double-bookings and no-shows. As ROOMZ's UAE Distribution Partner, Fidelis Logic owns the full lifecycle in-region.",
    keyStrengths: [
      {
        title: "Battery-powered, wire-free deployment",
        description:
          "Up to five years on a single battery — no cabling, no drilling, no electrician callouts. Twenty rooms can be live within forty-eight hours."
      },
      {
        title: "Calendar-native by design",
        description:
          "Direct sync with Microsoft 365, Google Workspace, and Exchange. No middleware, no user migrations, no IT rework."
      },
      {
        title: "Honest occupancy intelligence",
        description:
          "Embedded sensors measure real utilisation versus booked time — surfacing the data you need to right-size your real estate footprint."
      },
      {
        title: "Privacy-first, regulator-ready",
        description:
          "No cameras, no microphones, no personal data capture. GDPR-aligned and deployable in regulated environments without legal review delays."
      }
    ],
    productCategoryIntro:
      "Build a ROOMZ workplace stack around the spaces you need to book, sense and improve. Start with the employee interaction, then add occupancy evidence and analytics where it changes a decision.",
    products: [
      {
        name: "ROOMZ Display",
        imageAlt: "ROOMZ wireless e-paper meeting-room booking display",
        description:
          "Wireless e-paper booking panel for checking availability and booking, extending or releasing a meeting room at the door.",
        bestFor: "Meeting rooms that need clear, always-on availability without new cabling.",
        deploymentFocus: "Calendar resource mapping, Wi-Fi readiness, mounting position and booking rules.",
        officialUrl: "https://roomz.io/roomz_display/"
      },
      {
        name: "ROOMZ Room Sensor",
        imageAlt: "ROOMZ anonymous wireless room occupancy sensor mounted on a wall",
        description:
          "Anonymous presence sensing that compares bookings with actual use and can support automatic release of unattended rooms.",
        bestFor: "Reducing ghost meetings and understanding real room utilisation.",
        deploymentFocus: "Sensor placement, privacy communication, no-show policy and analytics baselines.",
        officialUrl: "https://roomz.io/roomz_sensor/"
      },
      {
        name: "ROOMZ Desk Sensor",
        imageAlt: "ROOMZ wireless desk occupancy sensor installed beneath a workstation",
        description:
          "Discreet occupancy sensing for shared desks, giving workplace teams real-time and historical evidence of desk use.",
        bestFor: "Hybrid offices validating desk demand and neighbourhood capacity.",
        deploymentFocus: "Desk inventory, sensor placement, floor mapping and occupancy reporting.",
        officialUrl: "https://roomz.io/roomz_sensor/"
      },
      {
        name: "ROOMZ Huddle Sensor",
        imageAlt: "ROOMZ Huddle Sensor for anonymous occupancy detection in small spaces",
        description:
          "Presence sensing for phone booths, one-to-one rooms and small collaboration spaces that are often used without formal bookings.",
        bestFor: "Making small, unbooked spaces visible and easier to find.",
        deploymentFocus: "Space classification, live availability rules and wayfinding integration.",
        officialUrl: "https://roomz.io/roomz_sensor/"
      },
      {
        name: "myROOMZ",
        imageAlt: "myROOMZ workplace application showing live desk and room availability",
        description:
          "Workplace application for reserving desks and spaces, planning office days and viewing availability across the workplace.",
        bestFor: "Flexible offices that need a practical employee booking experience.",
        deploymentFocus: "SSO, booking policies, floorplans, user adoption and calendar integration.",
        officialUrl: "https://roomz.io/intelligent-offices-solution/"
      },
      {
        name: "ROOMZ Advanced Analytics",
        imageAlt: "ROOMZ Advanced Analytics dashboard for workplace utilisation insights",
        description:
          "Power BI-based workplace analytics for comparing booked and actual use across rooms, desks, floors and buildings.",
        bestFor: "Facilities and real-estate teams planning evidence-based space changes.",
        deploymentFocus: "Decision metrics, reporting ownership, tags, baselines and review cadence.",
        officialUrl: "https://roomz.io/advanced-analytics/"
      }
    ],
    useCases: [
      "Meeting rooms and huddle spaces (4–20 people)",
      "Hot desks and focus booth management",
      "Multi-site portfolios with hybrid occupancy",
      "Regulated industries needing privacy-first sensing"
    ],
    fidelisRole:
      "As ROOMZ's UAE Distribution Partner, Fidelis Logic owns specification, procurement, and deployment in-region. We handle space assessment, panel placement strategy, Microsoft 365 calendar integration, rollout logistics, user enablement, and post-go-live analytics reviews — with lifecycle support aligned to your IT governance.",
    proofPoints: [
      "Swiss engineering, deployed across global enterprises",
      "Native Microsoft 365 and Google Workspace integration",
      "GDPR-compliant, privacy-first hardware",
      "Twenty rooms typically live within forty-eight hours"
    ],
    relatedSolutions: [
      { name: "Workspace Experience", href: "/solutions/workspace-experience" }
    ]
  },
  {
    slug: "morbit",
    name: "Morbit",
    tagline: "Workspace monitoring and device management for IT operations",
    featured: true,
    priority: 2,
    partnershipType: "Channel Partner",
    category: "Workspace Experience",
    categorySlug: "workspace-experience",
    logoText: "morbit",
    logoImages: [
      "/brand-logos/morbit.webp",
      "/brand-logos/morbit.png",
      "/brand-logos/morbit.svg"
    ],
    logoScale: 0.58, // 5.4:1 wordmark — widest, so the shortest
    accentColor: "#6366F1",
    heroImage: "/platform-images/morbit.png",
    heroImages: [
      "https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1664575601711-67110e027b9b?auto=format&fit=crop&w=2400&q=80"
    ],
    productVisuals: [
      "/product-images/morbit/uc-platform-monitoring.webp",
      "/product-images/morbit/device-room-monitoring.webp",
      "/product-images/morbit/call-quality-insights.webp",
      "/product-images/morbit/workspace-analytics.webp",
      "/product-images/morbit/remote-device-management.webp",
      "/product-images/morbit/msp-operations.webp"
    ],
    seoContent: {
      title: "Morbit UAE | Meeting Room Monitoring & Workspace Analytics",
      description:
        "Monitor meeting-room devices, UC performance and workspace utilisation with Morbit in the UAE, supported by Fidelis Logic deployment services.",
      keywords: [
        "Morbit UAE",
        "meeting room monitoring UAE",
        "Microsoft Teams device monitoring",
        "Zoom Rooms monitoring Dubai",
        "workspace analytics UAE",
        "AV device management"
      ],
      officialUrl: "https://www.morbit.co.uk/",
      image: {
        src: "/platform-images/morbit.png",
        alt: "Morbit workspace and meeting room monitoring platform dashboard",
        caption:
          "Morbit brings UC, AV, room and smart-building signals into one operational view so support teams can move from reactive tickets to earlier intervention."
      },
      overview: [
        "Morbit is designed for IT, AV and workplace teams that lack a consistent view across meeting rooms, collaboration services and connected building devices. It can surface device health, call-quality and room information without forcing teams to work through a different console for every manufacturer.",
        "Fidelis Logic helps UAE organisations define what should be monitored, connect the relevant cloud tenants and devices, tune alert thresholds and route actionable incidents into the existing support process. This keeps the implementation focused on service outcomes rather than dashboard volume."
      ],
      buyingGuide: [
        {
          title: "Which services and devices create the most support demand?",
          text: "Start with the rooms, endpoints and UC platforms responsible for repeat incidents or poor meeting starts."
        },
        {
          title: "Who will act on each alert?",
          text: "Map severity, ownership and escalation so monitoring produces decisions instead of another noisy inbox."
        },
        {
          title: "Which workplace metrics are genuinely useful?",
          text: "Agree the utilisation, occupancy and environmental questions before collecting more data."
        }
      ],
      video: {
        type: "html5",
        src: "https://newsletter.morbit.co.uk/video/videos/2026/06/8b1c6ff3-b711-4557-a8e7-1b7055c5280a.mp4",
        title: "Morbit Studio platform walkthrough",
        description:
          "Official Morbit walkthrough showing how its cloud platform presents device, meeting-room and workspace information."
      }
    },
    shortDescription:
      "A single pane of glass for meeting room devices, collaboration endpoints, and workspace infrastructure — fewer tickets, less downtime, smarter space decisions.",
    longDescription:
      "Morbit gives IT teams real-time visibility across every collaboration endpoint and meeting room device in the estate. Proactive alerting, utilisation analytics, and automated health checks reduce help-desk load and keep hybrid workspaces running without surprises. Fidelis Logic deploys Morbit as a managed service or alongside your existing IT operations team.",
    keyStrengths: [
      {
        title: "Unified device visibility",
        description:
          "Microsoft Teams Rooms, Zoom Rooms, and third-party collaboration devices on one dashboard — across every office, every region."
      },
      {
        title: "Proactive incident prevention",
        description:
          "Real-time alerts on offline devices, failing cameras, audio drops, and calendar sync issues — resolved before users notice."
      },
      {
        title: "Workspace utilisation analytics",
        description:
          "Room-level usage, peak-hour trends, and no-show rates — the evidence facilities and workplace strategy teams need to right-size space."
      },
      {
        title: "Operations-ready integration",
        description:
          "REST APIs, SNMP, and native connectors into ServiceNow and Jira. Slots into your existing operations stack without rework."
      }
    ],
    productCategoryIntro:
      "Use Morbit to connect collaboration, device and building signals into an operational model. The right starting point depends on whether the immediate problem is service reliability, meeting quality or space intelligence.",
    products: [
      {
        name: "UC Platform Monitoring",
        imageAlt: "Morbit Studio dashboard monitoring unified communications platforms",
        description:
          "Cloud visibility across Microsoft Teams, Zoom and Webex environments, including users, meetings, rooms and service health.",
        bestFor: "IT teams operating more than one collaboration platform or location.",
        deploymentFocus: "Tenant connections, permissions, service scope and alert ownership.",
        officialUrl: "https://www.morbit.co.uk/"
      },
      {
        name: "Device & Room Monitoring",
        imageAlt: "Morbit Studio asset register for meeting-room device monitoring",
        description:
          "Real-time monitoring and health visibility for meeting-room systems, AV endpoints and other network-connected devices.",
        bestFor: "Reducing room downtime and repeat break-fix support visits.",
        deploymentFocus: "Device discovery, manufacturer APIs, Morbit Hub placement and health thresholds.",
        officialUrl: "https://www.morbit.co.uk/device-management"
      },
      {
        name: "Call Quality & Meeting Insights",
        imageAlt: "Morbit Studio executive call-quality summary dashboard",
        description:
          "Meeting and participant-level quality data that helps teams isolate recurring audio, video, network and endpoint issues.",
        bestFor: "Support teams investigating poor calls that are difficult to reproduce.",
        deploymentFocus: "Quality baselines, escalation rules and service-desk evidence workflows.",
        officialUrl: "https://www.morbit.co.uk/"
      },
      {
        name: "Smart Building & Workspace Analytics",
        imageAlt: "Morbit Studio smart-building floor and workspace analytics view",
        description:
          "Occupancy, utilisation and environmental intelligence for desks, meeting rooms and connected workplace infrastructure.",
        bestFor: "Workplace teams comparing space demand with actual behaviour.",
        deploymentFocus: "Sensor integrations, floor hierarchy, reporting questions and data ownership.",
        officialUrl: "https://www.morbit.co.uk/"
      },
      {
        name: "Remote Device Management",
        imageAlt: "Morbit Studio secure remote connection management screen",
        description:
          "Secure access, configuration and remediation tools for supported devices without requiring a technician at every site.",
        bestFor: "Distributed estates that need faster diagnosis and consistent configuration.",
        deploymentFocus: "Access controls, change governance, support boundaries and auditability.",
        officialUrl: "https://www.morbit.co.uk/device-management"
      },
      {
        name: "MSP Multi-Tenant Operations",
        imageAlt: "Morbit Studio multi-service operational dashboard for managed estates",
        description:
          "Separated customer views and operational workflows for service providers managing multiple collaboration and workplace estates.",
        bestFor: "Managed service providers standardising monitoring across customers.",
        deploymentFocus: "Tenant isolation, service tiers, reporting templates and escalation ownership.",
        officialUrl: "https://www.morbit.co.uk/partners"
      }
    ],
    useCases: [
      "Enterprise meeting room estates (50+ rooms)",
      "Multi-site AV and collaboration device fleets",
      "Teams shifting from reactive to proactive support",
      "Workplace strategy and facilities decision-making"
    ],
    fidelisRole:
      "Fidelis Logic deploys Morbit as part of our managed workspace services — configuring monitors, tuning alert thresholds, integrating ServiceNow or Jira, and training your service-desk team. For customers without an in-house operations function, we run Morbit end-to-end as a fully managed service.",
    proofPoints: [
      "Vendor-agnostic — works with any collaboration platform",
      "UAE-based managed service option",
      "Deep ServiceNow and Jira integration",
      "Typical payback in three to six months via ticket reduction"
    ],
    relatedSolutions: [
      { name: "Workspace Experience", href: "/solutions/workspace-experience" },
      { name: "Meeting Rooms & AV", href: "/solutions/meeting-rooms" }
    ]
  },
  {
    slug: "jabra",
    name: "Jabra",
    tagline: "Enterprise audio and intelligent video for hybrid work",
    featured: false,
    priority: 3,
    partnershipType: "Channel Partner",
    category: "Headsets & Devices",
    categorySlug: "headsets",
    logoText: "Jabra",
    logoImages: [
      "/brand-logos/jabra.webp",
      "/brand-logos/jabra.png",
      "/brand-logos/jabra.svg"
    ],
    logoScale: 0.75, // 2.9:1 wordmark
    accentColor: "#E30613",
    heroImage: "/img/social/og-brand-jabra.jpg",
    heroImages: [
      { basePath: "/img/brand-hero/jabra-1", objectPosition: "55% 45%" },
      { basePath: "/img/brand-hero/jabra-2", objectPosition: "62% 45%" },
      { basePath: "/img/brand-hero/jabra-3", objectPosition: "50% 50%" }
    ],
    productVisuals: [
      "/product-images/jabra/engage-50-ii.webp",
      "/product-images/jabra/evolve2-65.webp",
      "/product-images/jabra/perform-frontline.webp",
      "/product-images/jabra/speak2-75.webp",
      "/product-images/jabra/panacast.webp",
      "/product-images/jabra/xpress.webp"
    ],
    seoContent: {
      title: "Jabra UAE | Enterprise Headsets & PanaCast Video",
      description:
        "Choose and deploy Jabra enterprise headsets and PanaCast video solutions in the UAE for contact centres, hybrid teams and meeting rooms.",
      keywords: [
        "Jabra UAE",
        "Jabra headsets Dubai",
        "contact centre headset UAE",
        "Jabra Evolve2 UAE",
        "Jabra Engage UAE",
        "Jabra PanaCast 50 Dubai"
      ],
      officialUrl: "https://www.jabra.com/business",
      image: {
        src: "/img/social/og-brand-jabra.jpg",
        alt: "Jabra professional audio and PanaCast video collaboration technology",
        caption:
          "Jabra covers professional audio from focused hybrid work and contact-centre calling through to PanaCast video collaboration for meeting spaces."
      },
      overview: [
        "Jabra is strongest when device choice needs to reflect distinct working personas. A contact-centre agent, mobile manager and focus-heavy hybrid worker place different demands on microphone performance, wearing style, connectivity and battery behaviour; treating them as one headset requirement usually creates avoidable compromises.",
        "Fidelis Logic helps UAE teams build that persona map, shortlist compatible Jabra models, validate Microsoft Teams or Zoom requirements and plan firmware management through Jabra Xpress. PanaCast can then extend the same programme into huddle and meeting-room video where a wide view and intelligent framing are priorities."
      ],
      buyingGuide: [
        {
          title: "What does each user do for most of the day?",
          text: "Separate high-call agents, mobile users, concentration workers and executives before selecting form factors."
        },
        {
          title: "Which devices and UC platforms must connect?",
          text: "Check computer, mobile and desk-phone needs together with Teams, Zoom or softphone certification."
        },
        {
          title: "How will firmware and replacements be governed?",
          text: "Plan central updates, approved configurations, spares and lifecycle ownership as part of the initial standard."
        }
      ],
      video: {
        type: "youtube",
        id: "KPKOyRGJKeQ",
        uploadDate: "2021-07-14T00:07:30-07:00",
        title: "Jabra PanaCast 50 intelligent video bar overview",
        description:
          "Official Jabra overview of PanaCast 50, including its 180-degree field of view, intelligent framing and meeting-room features."
      }
    },
    shortDescription:
      "Market-leading enterprise headsets and AI-powered video bars built for contact centres, hybrid workers, and executive collaboration — at the scale enterprise IT actually has to operate.",
    longDescription:
      "Jabra — part of GN Group — combines decades of acoustic engineering with fleet-management tooling that holds up in 5,000-device estates. From all-day contact-centre headsets to certified Microsoft Teams and Zoom video bars, the portfolio is curated for enterprises that need consistency across personas without compromising user experience.",
    keyStrengths: [
      {
        title: "All-day acoustic comfort",
        description:
          "Industry-leading ergonomics validated across contact-centre deployments — measurable reduction in fatigue on eight-hour shifts."
      },
      {
        title: "Teams and Zoom certified",
        description:
          "Certified echo cancellation, sidetone, and firmware reliability across every major UC platform — no surprises at scale."
      },
      {
        title: "Jabra Xpress fleet management",
        description:
          "Centralised firmware control, policy push, and utilisation analytics — essential once you cross 200+ devices."
      },
      {
        title: "Intelligent PanaCast video",
        description:
          "180° field of view, AI framing, and noise-suppressed audio for BYOD spaces and native Teams Rooms alike."
      }
    ],
    productCategoryIntro:
      "Choose Jabra by workstyle rather than by a single headset specification. Separate high-call contact-centre roles, hybrid knowledge workers, frontline teams, shared-room audio and video before standardising devices.",
    products: [
      {
        name: "Contact Centre — Engage & Biz",
        imageAlt: "Jabra Engage 50 II professional contact-centre headset",
        description:
          "Professional wired, wireless and quick-disconnect headsets designed for call-intensive service and support roles.",
        bestFor: "Contact-centre agents and desk-based users with sustained call volumes.",
        deploymentFocus: "Softphone compatibility, wearing style, acoustic protection, spares and agent onboarding.",
        officialUrl: "https://www.jabra.com/business/contact-center-headsets"
      },
      {
        name: "Hybrid Work — Evolve2",
        imageAlt: "Jabra Evolve2 65 wireless professional headset in black",
        description:
          "Wireless and corded professional headsets for calls, concentration and multi-device work across home, office and travel.",
        bestFor: "Knowledge workers, managers and mobile professionals.",
        deploymentFocus: "UC certification, device pairing, charging, wearing preference and role-based standards.",
        officialUrl: "https://www.jabra.com/business/office-headsets/jabra-evolve/jabra-evolve2-65"
      },
      {
        name: "Frontline Work — Perform",
        imageAlt: "Jabra professional headset used for frontline communication",
        description:
          "Purpose-built communication headsets for frontline environments where mobility, durability and team coordination matter.",
        bestFor: "Retail, warehouse and operational teams working away from a desk.",
        deploymentFocus: "Workflow fit, push-to-talk requirements, hygiene, durability and shift handover.",
        officialUrl: "https://www.jabra.com/business/frontline-worker-headsets"
      },
      {
        name: "Speakerphones — Speak2",
        imageAlt: "Jabra Speak2 75 portable USB and Bluetooth speakerphone",
        description:
          "Portable professional speakerphones for personal calls and small-group meetings when a headset is not the right format.",
        bestFor: "Mobile professionals, private offices and flexible small-group collaboration.",
        deploymentFocus: "Room acoustics, connection type, UC platform and shared-device policy.",
        officialUrl: "https://www.jabra.com/business/speakerphones/jabra-speak-series/jabra-speak2-75"
      },
      {
        name: "Video Collaboration — PanaCast",
        imageAlt: "Jabra PanaCast intelligent video collaboration system",
        description:
          "Personal cameras and intelligent room video systems for hybrid meetings, including wide-angle coverage and automated framing.",
        bestFor: "Personal video, huddle spaces and small-to-medium meeting rooms.",
        deploymentFocus: "Room coverage, mounting, platform mode, controller choice and network management.",
        officialUrl: "https://www.jabra.com/business/video-conferencing"
      },
      {
        name: "Device Management — Jabra Xpress",
        imageAlt: "Jabra Xpress enterprise device-management interface",
        description:
          "Central software for deploying approved settings, firmware and device packages across supported Jabra estates.",
        bestFor: "Organisations standardising and maintaining large device fleets.",
        deploymentFocus: "Firmware rings, configuration packages, ownership, reporting and change control.",
        officialUrl: "https://www.jabra.com/software-and-services/jabra-xpress"
      }
    ],
    useCases: [
      "Contact-centre standardisation at scale",
      "Hybrid workforce headset programmes",
      "BYOD and Teams-native meeting rooms",
      "Executive audio and video setups"
    ],
    fidelisRole:
      "Fidelis Logic advises on Jabra device selection by persona — call centre, hybrid worker, executive — coordinates bulk procurement through authorised UAE channels, and runs fleet onboarding via Jabra Xpress, including firmware baselining, pairing, and user enablement.",
    proofPoints: [
      "Authorised UAE procurement channels",
      "Persona-based standardisation frameworks",
      "Teams and Zoom certified across the lineup",
      "Fleet deployment via Jabra Xpress included"
    ],
    relatedSolutions: [
      { name: "Enterprise Headsets", href: "/solutions/headsets" },
      { name: "Meeting Rooms & AV", href: "/solutions/meeting-rooms" }
    ]
  },
  {
    slug: "poly",
    name: "Poly",
    tagline: "Professional audio, video, and headsets — engineered by HP",
    featured: false,
    priority: 4,
    partnershipType: "Channel Partner",
    category: "Meeting Rooms & Headsets",
    categorySlug: "meeting-rooms",
    logoText: "Poly",
    logoImages: [
      "/brand-logos/poly.webp",
      "/brand-logos/poly.png",
      "/brand-logos/poly.svg"
    ],
    logoScale: 0.92, // 1:1 icon — needs the most height, the least width
    accentColor: "#00A3E0",
    heroImage: "/img/social/og-home.jpg",
    heroImages: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=2400&q=80"
    ],
    productVisuals: [
      "/product-images/poly/studio.webp",
      "/product-images/poly/voyager-4300-uc.webp",
      "/product-images/poly/blackwire-5200.webp",
      "/product-images/poly/savi-8400-office.webp",
      "/product-images/poly/encorepro-500.webp",
      "/product-images/poly/sync-20.webp",
      "/product-images/poly/lens.webp"
    ],
    seoContent: {
      title: "HP Poly UAE | Video Conferencing & Enterprise Headsets",
      description:
        "Design HP Poly meeting rooms and headset programmes in the UAE with Studio video systems, Voyager devices and Poly Lens management.",
      keywords: [
        "HP Poly UAE",
        "Poly video conferencing Dubai",
        "Poly Studio X52 UAE",
        "Poly Voyager headset UAE",
        "Microsoft Teams Rooms Poly",
        "Poly Lens management"
      ],
      officialUrl: "https://www.hp.com/us-en/poly/video-conferencing.html",
      image: {
        src: "https://i.ytimg.com/vi/8sDQv1RpVBU/maxresdefault.jpg",
        alt: "HP Poly Studio X52 all-in-one video bar for meeting rooms",
        caption:
          "The Poly Studio family spans USB, all-in-one and modular room designs, while Poly Lens gives IT teams a path to central device visibility and control."
      },
      overview: [
        "HP Poly is a useful choice for organisations that want professional headsets and meeting-room systems within one collaboration portfolio. Studio video products cover different room sizes and deployment models, while Voyager, Savi and EncorePro address mobile, desk-based and contact-centre audio needs.",
        "Fidelis Logic helps UAE customers decide between native room appliances, PC-based Microsoft Teams Rooms, Zoom Rooms and USB/BYOD designs. We then align camera coverage, audio reach, controllers and Poly Lens management with the room standard and support model."
      ],
      buyingGuide: [
        {
          title: "Is the room native, PC-based or BYOD?",
          text: "The operating model determines the correct Studio family, controller, compute and platform licensing path."
        },
        {
          title: "Can the camera and microphones cover the whole room?",
          text: "Validate table layout, participant distance, field of view and expansion needs before choosing a bar or modular system."
        },
        {
          title: "Will personal and room devices share one policy?",
          text: "Decide how Poly Lens, firmware approvals and support ownership will work across the combined estate."
        }
      ],
      video: {
        type: "youtube",
        id: "8sDQv1RpVBU",
        uploadDate: "2023-07-13T10:04:17-07:00",
        title: "HP Poly Studio X52 feature overview",
        description:
          "Official HP Poly video introducing the Studio X52 all-in-one video bar and its meeting-room collaboration features."
      }
    },
    shortDescription:
      "Professional-grade video conferencing, voice devices, and headsets — Plantronics and Polycom heritage, now backed by HP's global enterprise reach.",
    longDescription:
      "Poly, now part of HP, brings decades of acoustic engineering into modern Microsoft Teams Rooms and Zoom Rooms deployments. The Studio video bar lineup and Voyager headset family are staples in enterprise UC programmes worldwide — chosen for clarity in noisy environments and depth of cloud management.",
    keyStrengths: [
      {
        title: "Plantronics acoustic pedigree",
        description:
          "Microphone and speaker performance that holds up in open-plan offices and noisy contact centres alike."
      },
      {
        title: "Studio X for Teams and Zoom",
        description:
          "Studio X and E-series video bars certified for native MTR and Zoom Rooms with DirectorAI auto-framing."
      },
      {
        title: "Poly Lens cloud management",
        description:
          "Single console for firmware, policy, and insights across Poly headsets and room systems."
      },
      {
        title: "End-to-end portfolio",
        description:
          "From desk phones to boardroom codecs — one vendor for the full enterprise collaboration stack."
      }
    ],
    productCategoryIntro:
      "HP Poly spans personal audio, contact-centre devices, room video, speakerphones and cloud management. Build standards by persona and room type, then manage the combined estate through a common lifecycle.",
    products: [
      {
        name: "Room Video — Poly Studio",
        imageAlt: "HP Poly Studio room video system for Microsoft Teams Rooms",
        description:
          "USB, all-in-one and modular video solutions covering focus rooms through to large collaboration spaces.",
        bestFor: "Microsoft Teams Rooms, Zoom Rooms and professional BYOD spaces.",
        deploymentFocus: "Room mode, camera coverage, audio reach, controller, compute and mounting.",
        officialUrl: "https://www.hp.com/us-en/poly/video-conferencing.html"
      },
      {
        name: "Mobile Audio — Voyager",
        imageAlt: "HP Poly Voyager 4300 UC Bluetooth office headset",
        description:
          "Bluetooth headsets and earbuds for professionals moving between calls, locations and connected devices.",
        bestFor: "Executives, managers, sales teams and mobile hybrid workers.",
        deploymentFocus: "Wearing style, adapters, multi-device behaviour, charging and UC certification.",
        officialUrl: "https://www.hp.com/us-en/poly/headsets.html"
      },
      {
        name: "Desk Audio — Blackwire",
        imageAlt: "HP Poly Blackwire 5200 corded USB stereo headset",
        description:
          "Corded USB headsets for consistent desk-based calling with straightforward connectivity and fleet deployment.",
        bestFor: "Office users who value reliability and do not require wireless mobility.",
        deploymentFocus: "Connector standard, wearing preference, acoustic policy and replacement stock.",
        officialUrl: "https://www.hp.com/us-en/poly/headsets.html"
      },
      {
        name: "Wireless Desk Audio — Savi",
        imageAlt: "HP Poly Savi 8400 Office wireless DECT headset with base",
        description:
          "DECT wireless headset systems for desk-based professionals who need secure mobility and connections across work devices.",
        bestFor: "High-call office roles that move away from the desk during conversations.",
        deploymentFocus: "Radio planning, base connectivity, density, security profile and charging.",
        officialUrl: "https://www.hp.com/us-en/poly/headsets.html"
      },
      {
        name: "Contact Centre — EncorePro",
        imageAlt: "HP Poly EncorePro 500 wired contact-centre headset",
        description:
          "Durable wired and quick-disconnect headset families for intensive customer-service and contact-centre environments.",
        bestFor: "Agents requiring clear voice capture, comfort and serviceable accessories.",
        deploymentFocus: "QD or USB architecture, acoustic protection, hygiene, spares and agent personas.",
        officialUrl: "https://www.hp.com/us-en/poly/headsets/contact-center-headsets.html"
      },
      {
        name: "Speakerphones — Poly Sync",
        imageAlt: "HP Poly Sync 20 USB and Bluetooth speakerphone",
        description:
          "USB and Bluetooth speakerphones for personal work, flexible collaboration areas and small meeting spaces.",
        bestFor: "Private offices, mobile teams and small-group discussions.",
        deploymentFocus: "Expected group size, connectivity, portability and shared-device ownership.",
        officialUrl: "https://www.hp.com/us-en/poly.html"
      },
      {
        name: "Fleet Management — Poly Lens",
        imageAlt: "HP Poly Lens cloud device-management interface",
        description:
          "Central visibility, configuration and update management for supported Poly personal and room devices.",
        bestFor: "IT teams governing Poly devices across multiple sites and user groups.",
        deploymentFocus: "Enrollment, firmware rings, configuration policy, inventory and support roles.",
        officialUrl: "https://www.hp.com/us-en/poly/software-and-services/poly-lens.html"
      }
    ],
    useCases: [
      "Microsoft Teams Rooms deployments",
      "Executive and boardroom video systems",
      "Enterprise contact-centre headset programmes",
      "Desk-phone to UC migration projects"
    ],
    fidelisRole:
      "Fidelis Logic delivers Poly across our Meeting Rooms and Headsets services — specifying the right Studio X model per room size, deploying Poly Lens for centralised management, and integrating with your existing MTR or Zoom Rooms infrastructure.",
    proofPoints: [
      "HP-backed global support footprint",
      "Microsoft Teams and Zoom certified across the range",
      "Poly Lens centralised cloud management",
      "Authorised UAE service partner"
    ],
    relatedSolutions: [
      { name: "Meeting Rooms & AV", href: "/solutions/meeting-rooms" },
      { name: "Enterprise Headsets", href: "/solutions/headsets" }
    ]
  },
  {
    slug: "neat",
    name: "Neat",
    tagline: "Purpose-built video devices for Microsoft Teams and Zoom",
    featured: false,
    priority: 5,
    partnershipType: "Channel Partner",
    category: "Meeting Rooms",
    categorySlug: "meeting-rooms",
    logoText: "Neat.",
    logoImages: [
      "/brand-logos/neat.webp",
      "/brand-logos/neat.png",
      "/brand-logos/neat.svg"
    ],
    logoScale: 0.67, // 3.5:1 wordmark
    accentColor: "#FF5500",
    heroImage: "/img/social/og-brand-neat.jpg",
    heroImages: [
      { basePath: "/img/brand-hero/neat-1", objectPosition: "60% 45%" },
      { basePath: "/img/brand-hero/neat-2", objectPosition: "55% 45%" },
      { basePath: "/img/brand-hero/neat-3", objectPosition: "50% 50%" },
      { basePath: "/img/brand-hero/neat-4", objectPosition: "65% 42%" }
    ],
    productVisuals: [
      "/product-images/neat/bar-gen-2.webp",
      "/product-images/neat/board-pro.webp",
      "/product-images/neat/pad-pro.webp",
      "/product-images/neat/center.webp",
      "/product-images/neat/frame.webp",
      "/product-images/neat/pulse.webp"
    ],
    seoContent: {
      title: "Neat UAE | Microsoft Teams & Zoom Room Devices",
      description:
        "Design premium Microsoft Teams Rooms and Zoom Rooms in the UAE with Neat Bar, Neat Board, Neat Pad and local deployment support.",
      keywords: [
        "Neat UAE",
        "Neat Bar Pro Dubai",
        "Neat Board UAE",
        "Neat Pad UAE",
        "Microsoft Teams Rooms devices",
        "Zoom Rooms hardware Dubai"
      ],
      officialUrl: "https://neat.no/products/",
      image: {
        src: "/img/social/og-brand-neat.jpg",
        alt: "Neat video meeting device in a modern Microsoft Teams or Zoom room",
        caption:
          "Neat combines purpose-built room hardware, participant framing and integrated sensors in a design intended for modern collaborative spaces."
      },
      overview: [
        "Neat suits organisations that treat room experience and physical design as part of the technology decision. Its bars, boards, controllers and companion devices are purpose-built for supported Microsoft Teams, Zoom and Google Meet room experiences, with intelligent framing designed to make in-room participants easier to follow remotely.",
        "Fidelis Logic helps UAE customers match each Neat device to the room size, display layout, platform mode and furniture plan. Commissioning also covers controller placement, mounting, network readiness, updates and the user journey from entering the room to joining a call."
      ],
      buyingGuide: [
        {
          title: "Which meeting platform will the room run natively?",
          text: "Confirm licensing and the supported feature set for Microsoft Teams, Zoom or Google Meet before hardware is ordered."
        },
        {
          title: "How large and visually demanding is the space?",
          text: "Match camera reach, microphone coverage, screen count and mounting to the actual room—not its capacity label alone."
        },
        {
          title: "Which sensors and room insights will be used?",
          text: "Identify the environmental or occupancy data that has an owner and a clear workplace decision attached to it."
        }
      ],
      video: {
        type: "youtube",
        id: "ZLLqU_YBD0I",
        uploadDate: "2024-02-06T10:19:12-08:00",
        title: "Neat Bar Pro virtual demonstration",
        description:
          "Official Neat demonstration of Neat Bar Pro for larger meeting spaces, covering the device, room experience and core capabilities."
      }
    },
    shortDescription:
      "Award-winning Norwegian-designed video devices that bring cinematic meeting experiences — and built-in workspace analytics — to Microsoft Teams Rooms and Zoom Rooms.",
    longDescription:
      "Neat, headquartered in Oslo, is redefining room systems with industrial design that belongs in executive spaces. Deep co-engineering relationships with Microsoft and Zoom unlock unique experiences such as Neat Symmetry auto-framing and Neat Sense environmental analytics — without bolt-on hardware.",
    keyStrengths: [
      {
        title: "Design-led aesthetics",
        description:
          "Purpose-built hardware that fits modern, premium offices — no industrial beige boxes on the wall."
      },
      {
        title: "Neat Symmetry framing",
        description:
          "Automatic intelligent framing equalises every participant on screen — local and remote — without manual adjustment."
      },
      {
        title: "Built-in Neat Sense analytics",
        description:
          "Environmental sensors capture humidity, CO₂, air quality, and occupancy. Workspace insight without extra hardware."
      },
      {
        title: "Microsoft and Zoom co-engineering",
        description:
          "First-class integration with native MTR and Zoom Rooms — certified from day one of major platform releases."
      }
    ],
    productCategoryIntro:
      "Neat organises its portfolio around video bars, collaborative boards, companion devices and cloud management. Match the family to the room experience first, then choose the model and mounting approach.",
    products: [
      {
        name: "Neat Bars",
        imageAlt: "Neat Bar Generation 2 all-in-one video collaboration device",
        description:
          "All-in-one video bars spanning BYOD, small-to-medium rooms and more demanding medium-to-large spaces.",
        bestFor: "Purpose-built Microsoft Teams, Zoom, Google Meet or BYOD rooms.",
        deploymentFocus: "Room reach, display count, platform mode, mounting and Neat Pad requirements.",
        officialUrl: "https://neat.no/products/"
      },
      {
        name: "Neat Boards",
        imageAlt: "Neat Board Pro all-in-one 65-inch touchscreen collaboration device",
        description:
          "All-in-one touchscreen collaboration devices for focus spaces through to medium and large meeting rooms.",
        bestFor: "Interactive meetings, whiteboarding and design-led multipurpose spaces.",
        deploymentFocus: "Screen size, room reach, stand or wall mounting, platform and pen workflows.",
        officialUrl: "https://neat.no/board-pro/"
      },
      {
        name: "Neat Pad & Neat Pad Pro",
        imageAlt: "Neat Pad Pro 10-inch meeting-room controller and scheduling display",
        description:
          "Touch devices for meeting control and room availability, positioned inside or outside the meeting space.",
        bestFor: "Consistent room control and visible scheduling at entrances.",
        deploymentFocus: "Controller role, scheduler placement, PoE, mounting and platform support.",
        officialUrl: "https://neat.no/pad-pro/"
      },
      {
        name: "Neat Center",
        imageAlt: "Neat Center tabletop companion camera and audio device",
        description:
          "Tabletop companion device that adds closer views and audio pickup for participants away from the front-of-room system.",
        bestFor: "Medium and large rooms where equitable participant coverage is a priority.",
        deploymentFocus: "Compatible front-of-room device, table position, cable route and sightlines.",
        officialUrl: "https://neat.no/center/"
      },
      {
        name: "Neat Frame",
        imageAlt: "Neat Frame portrait-oriented personal video collaboration device",
        description:
          "Portrait-oriented all-in-one video device for personal spaces, reception points and focused one-person collaboration.",
        bestFor: "Executive desks, personal meeting points and welcoming areas.",
        deploymentFocus: "Platform mode, placement, network, privacy and the intended personal workflow.",
        officialUrl: "https://neat.no/frame/"
      },
      {
        name: "Neat Pulse",
        imageAlt: "Neat Pulse cloud management platform shown on a laptop",
        description:
          "Cloud platform for remote configuration, updates, monitoring and support across a Neat device estate.",
        bestFor: "IT teams scaling Neat across rooms, offices or regions.",
        deploymentFocus: "Device enrollment, admin roles, configuration standards, update policy and support tier.",
        officialUrl: "https://neat.no/pulse/"
      }
    ],
    useCases: [
      "Executive boardrooms and design-forward offices",
      "Microsoft Teams Rooms flagship deployments",
      "Zoom Rooms premium experiences",
      "Workspace analytics pilots paired with booking systems"
    ],
    fidelisRole:
      "Fidelis Logic positions Neat for customers who care about room aesthetics as much as technical performance. We handle specification, procurement, commissioning, and integration with your UC platform of choice.",
    proofPoints: [
      "Award-winning Norwegian industrial design",
      "Native Microsoft Teams and Zoom certification",
      "Neat Sense workspace analytics included",
      "Flagship choice for executive spaces"
    ],
    relatedSolutions: [
      { name: "Meeting Rooms & AV", href: "/solutions/meeting-rooms" }
    ]
  },
  {
    slug: "yealink",
    name: "Yealink",
    tagline: "Scalable UC endpoints for multi-site deployments",
    featured: false,
    priority: 6,
    partnershipType: "Channel Partner",
    category: "Meeting Rooms",
    categorySlug: "meeting-rooms",
    logoText: "Yealink",
    logoImages: [
      "/brand-logos/yealink.webp",
      "/brand-logos/yealink.png",
      "/brand-logos/yealink.svg"
    ],
    logoScale: 0.58, // 4.7:1 wordmark
    accentColor: "#E30613",
    heroImage: "/img/social/og-home.jpg",
    heroImages: [
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2400&q=80",
      "https://images.unsplash.com/photo-1664575601711-67110e027b9b?auto=format&fit=crop&w=2400&q=80"
    ],
    productVisuals: [
      "/product-images/yealink/meetingbar-a40.webp",
      "/product-images/yealink/mvc-s90.webp",
      "/product-images/yealink/meetingboard.webp",
      "/product-images/yealink/roompanel-plus-e2.webp",
      "/product-images/yealink/mp58.webp",
      "/product-images/yealink/bh76-plus.webp",
      "/product-images/yealink/ymcs.webp"
    ],
    seoContent: {
      title: "Yealink UAE | Teams Rooms, Zoom Rooms & UC Devices",
      description:
        "Deploy Yealink MeetingBar, MVC room systems, desk phones and headsets in the UAE with design, configuration and lifecycle support.",
      keywords: [
        "Yealink UAE",
        "Yealink MeetingBar Dubai",
        "Yealink Teams Rooms UAE",
        "Yealink Zoom Rooms",
        "Yealink MVC room system",
        "Yealink business phones UAE"
      ],
      officialUrl: "https://www.yealink.com/en/solution-detail/microsoft-teams-rooms",
      image: {
        src: "https://i.ytimg.com/vi/m64fzrAN_CM/maxresdefault.jpg",
        alt: "Yealink MeetingBar all-in-one video conferencing system",
        caption:
          "Yealink offers all-in-one MeetingBar systems and modular MVC room kits alongside business phones, headsets and management tools."
      },
      overview: [
        "Yealink is often considered when a multi-site programme needs broad device coverage and consistent commercial planning. Its collaboration portfolio extends from all-in-one room bars and modular Microsoft Teams Rooms kits to desk phones, headsets and scheduling accessories.",
        "Fidelis Logic helps UAE organisations turn that breadth into a controlled standard: one approved design for each room type, a defined accessory list, repeatable configuration and central management. This reduces one-off room choices while keeping the deployment aligned with the required UC platform."
      ],
      buyingGuide: [
        {
          title: "How many repeatable room types are needed?",
          text: "Group spaces into a small set of standards based on layout, platform, capacity and collaboration behaviour."
        },
        {
          title: "All-in-one MeetingBar or modular MVC?",
          text: "Choose based on room coverage, expansion, compute ownership, serviceability and the desired installation model."
        },
        {
          title: "How will the wider UC estate be managed?",
          text: "Include phones, headsets, room panels, firmware and remote support in the same lifecycle plan."
        }
      ],
      video: {
        type: "youtube",
        id: "m64fzrAN_CM",
        uploadDate: "2021-12-21T18:14:02-08:00",
        title: "Yealink MeetingBar A20 overview",
        description:
          "Official Yealink overview of the MeetingBar A20 all-in-one video collaboration system and its room accessories."
      }
    },
    shortDescription:
      "Broad portfolio of Microsoft Teams and Zoom certified room systems, desk phones, and headsets — built for scale rollouts where commercial value matters as much as certification.",
    longDescription:
      "Yealink is a global top-three UC endpoint vendor — from MeetingBar video systems to DECT phones and Bluetooth headsets. Portfolio breadth and competitive commercial positioning make Yealink the go-to choice for multi-site, budget-conscious rollouts that still need full Teams and Zoom certification.",
    keyStrengths: [
      {
        title: "End-to-end portfolio",
        description:
          "Room systems, phones, headsets, and accessories from one vendor — simplified procurement, simplified support."
      },
      {
        title: "Strong commercial value",
        description:
          "Competitive pricing on certified devices makes large-estate rollouts and refresh cycles financially viable."
      },
      {
        title: "Teams and Zoom dual-certified",
        description:
          "Most models are certified on both platforms — reducing lock-in and easing dual-platform organisations."
      },
      {
        title: "Yealink Device Management",
        description:
          "Cloud and on-prem management for firmware, configuration, and diagnostics at scale."
      }
    ],
    productCategoryIntro:
      "Yealink covers Android appliances, Windows room kits, interactive boards, workspace IoT, phones, headsets and management. Use a small number of repeatable standards to make that breadth operationally manageable.",
    products: [
      {
        name: "MeetingBar",
        imageAlt: "Yealink MeetingBar A40 all-in-one video conferencing system",
        description:
          "Android-based all-in-one video bars for focus, huddle, small and medium meeting-room deployments.",
        bestFor: "Rooms that need a compact native Teams or Zoom appliance.",
        deploymentFocus: "Room size, platform license, display, controller, mounting and BYOD requirements.",
        officialUrl: "https://www.yealink.com/en/product-list/microsoft-zoom-device?filter=teams-room-system%2Czoom-rooms-kits"
      },
      {
        name: "MVC Series",
        imageAlt: "Yealink MVC S90 modular Microsoft Teams Rooms system",
        description:
          "Windows-based Microsoft Teams Rooms systems combining compute, touch control, cameras and scalable audio.",
        bestFor: "Medium, large, boardroom and ProAV spaces needing modular design.",
        deploymentFocus: "Room geometry, camera strategy, microphones, speakers, compute and cabling.",
        officialUrl: "https://www.yealink.com/en/product-list/microsoft-zoom-device?filter=teams-room-system"
      },
      {
        name: "MeetingBoard",
        imageAlt: "Yealink MeetingBoard interactive all-in-one collaboration display",
        description:
          "Interactive all-in-one meeting displays combining video conferencing, touch collaboration and digital whiteboarding.",
        bestFor: "Collaborative rooms that need a combined display, camera, audio and touch surface.",
        deploymentFocus: "Display size, wall structure, platform, content workflow and room reach.",
        officialUrl: "https://www.yealink.com/en/product-list/microsoft-zoom-device"
      },
      {
        name: "RoomPanel & Space IoT",
        imageAlt: "Yealink RoomPanel Plus E2 meeting-room scheduling display",
        description:
          "Scheduling panels, room sensors and workplace accessories for availability, booking and environmental context.",
        bestFor: "Making rooms easier to find, book and manage across an office.",
        deploymentFocus: "Calendar resources, panel placement, PoE, sensor use and signage policy.",
        officialUrl: "https://www.yealink.com/en/product-list/microsoft-zoom-device?filter=space-iot-devices"
      },
      {
        name: "Business & Teams Phones",
        imageAlt: "Yealink MP58 business desk phone for Microsoft Teams",
        description:
          "SIP and Microsoft Teams desk phones for shared areas, reception, general users and executive workspaces.",
        bestFor: "Voice estates retaining physical handsets or moving from legacy telephony.",
        deploymentFocus: "Calling platform, user persona, provisioning, network, power and accessories.",
        officialUrl: "https://www.yealink.com/en/product-list/ip-phone"
      },
      {
        name: "Business Headsets",
        imageAlt: "Yealink BH76 Plus wireless professional business headset",
        description:
          "Bluetooth, DECT and wired headset families for hybrid workers, desk users and contact-centre roles.",
        bestFor: "Organisations aligning personal audio with phones and UC platforms.",
        deploymentFocus: "Persona, wearing style, connectivity, certification, density and charging.",
        officialUrl: "https://www.yealink.com/en/product-list/headsets"
      },
      {
        name: "Yealink Management Cloud Service",
        imageAlt: "Official Yealink Management Cloud Service product graphic",
        description:
          "Central provisioning, monitoring, configuration and update management for supported Yealink device estates.",
        bestFor: "Multi-site IT teams standardising devices and reducing local administration.",
        deploymentFocus: "Tenant design, enrollment, templates, firmware policy, roles and remote support.",
        officialUrl: "https://www.yealink.com/en/product-list/management-platform"
      }
    ],
    useCases: [
      "Multi-site room standardisation at scale",
      "Budget-conscious MTR and Zoom Rooms deployments",
      "Desk-phone to UC migration programmes",
      "Mixed device estates across regional offices"
    ],
    fidelisRole:
      "Fidelis Logic recommends Yealink for customers prioritising commercial value and portfolio consistency across large estates. We handle design, procurement, deployment, and onboarding into Yealink Device Management.",
    proofPoints: [
      "Global top-three UC endpoint vendor",
      "Broad Teams and Zoom certified lineup",
      "Strong ROI on large-scale deployments",
      "Authorised UAE deployment partner"
    ],
    relatedSolutions: [
      { name: "Meeting Rooms & AV", href: "/solutions/meeting-rooms" },
      { name: "Enterprise Headsets", href: "/solutions/headsets" }
    ]
  },
  {
    slug: "logitech",
    name: "Logitech",
    tagline: "Video, headsets, and peripherals across the hybrid workplace",
    featured: false,
    priority: 7,
    partnershipType: "Channel Partner",
    category: "Meeting Rooms & Peripherals",
    categorySlug: "meeting-rooms",
    logoText: "Logitech",
    logoImages: [
      "/brand-logos/logitech.webp",
      "/brand-logos/logitech.png",
      "/brand-logos/logitech.svg"
    ],
    logoScale: 0.84, // 2.1:1 wordmark
    accentColor: "#00B8FC",
    heroImage: "/img/social/og-brand-logitech.jpg",
    heroImages: [
      { basePath: "/img/brand-hero/logitech-1", objectPosition: "50% 50%" },
      { basePath: "/img/brand-hero/logitech-2", objectPosition: "50% 50%" },
      { basePath: "/img/brand-hero/logitech-3", objectPosition: "68% 48%" }
    ],
    productVisuals: [
      "/product-images/logitech/rally-bar-family.webp",
      "/product-images/logitech/meetup-2.webp",
      "/product-images/logitech/rally-plus.webp",
      "/product-images/logitech/sight.webp",
      "/product-images/logitech/tap-scheduler.webp",
      "/product-images/logitech/personal-workspace.webp",
      "/product-images/logitech/sync.webp"
    ],
    seoContent: {
      title: "Logitech UAE | Rally Bar, MeetUp & Business Headsets",
      description:
        "Standardise Logitech Rally room systems, MeetUp cameras, business headsets and webcams in the UAE with deployment and Sync management support.",
      keywords: [
        "Logitech UAE",
        "Logitech Rally Bar Dubai",
        "Logitech MeetUp UAE",
        "Logitech video conferencing UAE",
        "Logitech business headsets",
        "Logitech Sync management"
      ],
      officialUrl: "https://www.logitech.com/en-us/business/video-collaboration.html",
      image: {
        src: "/img/social/og-brand-logitech.jpg",
        alt: "Logitech Rally video collaboration system for a hybrid meeting room",
        caption:
          "Logitech spans personal webcams and headsets through to Rally room systems, giving IT teams a consistent collaboration portfolio across desks and rooms."
      },
      overview: [
        "Logitech is a strong option when an organisation wants familiar personal devices and scalable meeting-room technology under one deployment programme. MeetUp and Rally products cover different room formats, while webcams, docks and Zone headsets support the hybrid worker outside the meeting room.",
        "Fidelis Logic helps UAE teams define room standards, choose appliance or USB deployment modes, plan microphones and mounting, and bring supported devices into Logitech Sync. The goal is a repeatable user experience with fewer exceptions for IT to maintain."
      ],
      buyingGuide: [
        {
          title: "Which spaces need appliance mode and which need USB?",
          text: "Decide how users will join meetings and which platforms must be supported before selecting room components."
        },
        {
          title: "Where does the base room kit stop being enough?",
          text: "Check camera distance, microphone pickup, table shape and speaker coverage for every standard room."
        },
        {
          title: "Can desks and rooms share a management approach?",
          text: "Plan Sync enrollment, update rings, inventory and ownership across webcams, headsets and room devices."
        }
      ],
      video: {
        type: "youtube",
        id: "lVlAzjRO7Qs",
        uploadDate: "2021-01-14T00:00:11-08:00",
        title: "Logitech Rally Bar overview",
        description:
          "Official Logitech video introducing Rally Bar for medium and large meeting rooms, including its camera, audio and deployment options."
      }
    },
    shortDescription:
      "Widely deployed collaboration peripherals — Rally video systems, Zone headsets, and MeetUp cameras — covering every form factor from personal desk to boardroom.",
    longDescription:
      "Logitech's collaboration portfolio spans video conferencing bars, premium headsets, and personal webcams. Deep certification across Microsoft Teams, Zoom, and Google Meet — combined with the Logitech Sync management platform — makes it a reliable choice for organisations standardising device experiences across every desk and every room.",
    keyStrengths: [
      {
        title: "Cross-platform certification",
        description:
          "Certified on Microsoft Teams, Zoom, and Google Meet — one portfolio covers every UC platform you run."
      },
      {
        title: "Logitech Sync management",
        description:
          "Cloud-based device management for cameras, video bars, and headsets from a single console."
      },
      {
        title: "Personal-to-room continuum",
        description:
          "From personal webcams to boardroom Rally Plus systems — consistent experience across every form factor."
      },
      {
        title: "Rally Bar AI viewer",
        description:
          "Native Teams and Zoom video bars with AI viewer for automatic framing and speaker focus."
      }
    ],
    productCategoryIntro:
      "Logitech spans compact rooms, modular large spaces, intelligent companion cameras, room control and personal collaboration. Standardise the room experience first, then connect devices through Sync and CollabOS.",
    products: [
      {
        name: "Rally Bar Family",
        imageAlt: "Logitech Rally Bar family of all-in-one room video systems",
        description:
          "All-in-one video bars for huddle, small, medium and large rooms with appliance, USB and BYOD deployment options.",
        bestFor: "Repeatable room standards across Microsoft Teams, Zoom and Google Meet.",
        deploymentFocus: "Room size, operating mode, display, microphones, mounting and controller choice.",
        officialUrl: "https://www.logitech.com/en-us/business/rally-family.html"
      },
      {
        name: "MeetUp 2",
        imageAlt: "Logitech MeetUp 2 USB conference camera for small rooms",
        description:
          "USB conference camera designed for huddle and small rooms, with flexible mounting and PC-based deployment.",
        bestFor: "Compact spaces that need professional BYOD or room-PC video without an appliance.",
        deploymentFocus: "USB path, compute ownership, mounting, cable length and room acoustics.",
        officialUrl: "https://www.logitech.com/en-us/products/video-conferencing/conference-cameras/meetup2-conferencecam.html"
      },
      {
        name: "Rally Plus",
        imageAlt: "Logitech Rally Plus modular video conferencing system",
        description:
          "Modular PTZ camera, speaker and microphone system that can extend coverage across larger formal rooms.",
        bestFor: "Large and extra-large rooms needing flexible camera and microphone placement.",
        deploymentFocus: "Camera sightline, mic-pod layout, speaker placement, compute and cable design.",
        officialUrl: "https://www.logitech.com/en-us/products/video-conferencing/room-solutions/rally-ultra-hd-conferencecam.html"
      },
      {
        name: "Sight & Scribe",
        imageAlt: "Logitech Sight intelligent tabletop companion camera",
        description:
          "Intelligent companion cameras for tabletop participant views and whiteboard content capture in hybrid meetings.",
        bestFor: "Rooms where remote participants need better views of people or physical whiteboards.",
        deploymentFocus: "Compatible room system, table or wall position, coverage, platform features and cabling.",
        officialUrl: "https://www.logitech.com/en-us/business/team-workspace.html"
      },
      {
        name: "Tap & Tap Scheduler",
        imageAlt: "Logitech Tap Scheduler room booking display mounted outside a meeting room",
        description:
          "Touch controllers for starting and managing meetings, plus scheduling displays for room availability and booking.",
        bestFor: "Creating a consistent join and booking experience across meeting rooms.",
        deploymentFocus: "Platform support, PoE, placement, mounting, cable route and calendar resources.",
        officialUrl: "https://www.logitech.com/en-us/business/video-collaboration/room-solutions.html"
      },
      {
        name: "Personal Workspace Devices",
        imageAlt: "Logitech business devices for a personal hybrid-work workspace",
        description:
          "Business webcams, Zone headsets, docks and peripherals for consistent collaboration away from shared rooms.",
        bestFor: "Hybrid workers, executives and standardised desk or home-office kits.",
        deploymentFocus: "Persona bundles, computer compatibility, UC certification, ergonomics and lifecycle.",
        officialUrl: "https://www.logitech.com/en-us/business/personal-workspace.html"
      },
      {
        name: "Sync & CollabOS",
        imageAlt: "Logitech Sync cloud management interface for collaboration devices",
        description:
          "Cloud management and device operating software for supported Logitech room and personal collaboration products.",
        bestFor: "IT teams deploying and maintaining Logitech devices across multiple locations.",
        deploymentFocus: "Enrollment, admin roles, update channels, inventory, alerts and support workflow.",
        officialUrl: "https://www.logitech.com/en-us/business/video-collaboration-management.html"
      }
    ],
    useCases: [
      "Hybrid work personal device standardisation",
      "Multi-platform UC environments (Teams + Zoom + Meet)",
      "Medium to large room video systems",
      "Boardroom and training room deployments"
    ],
    fidelisRole:
      "Fidelis Logic deploys Logitech across room and personal device programmes — specifying the right Rally or Zone model per use case, integrating with your preferred UC platform, and configuring Logitech Sync for ongoing fleet management.",
    proofPoints: [
      "Teams, Zoom, and Google Meet certified",
      "Logitech Sync cloud management",
      "Consistent personal-to-room device experience",
      "Authorised UAE deployment partner"
    ],
    relatedSolutions: [
      { name: "Meeting Rooms & AV", href: "/solutions/meeting-rooms" },
      { name: "Enterprise Headsets", href: "/solutions/headsets" }
    ]
  }
];

// Helpers
export const getBrandBySlug = (slug) => brands.find((b) => b.slug === slug);

export const getBrandsByCategorySlug = (categorySlug) =>
  brands.filter((b) => b.categorySlug === categorySlug);

export const getFeaturedBrands = () => brands.filter((b) => b.featured);

export const getBrandsSorted = () =>
  [...brands].sort((a, b) => a.priority - b.priority);

// Mapping from solution slug to relevant brand slugs (priority-ordered)
export const solutionBrandMap = {
  "workspace-experience": ["roomz", "morbit"],
  "meeting-rooms": ["poly", "neat", "logitech", "yealink"],
  "headsets": ["jabra", "poly", "logitech"]
};
