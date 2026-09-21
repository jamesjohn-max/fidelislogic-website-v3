"""
Server-side SEO pre-rendering for public marketing routes.

Purpose
-------
Crawlers, social scrapers and non-JS bots must be able to see route-specific
`<title>`, `<meta name="description">`, canonical URL, JSON-LD schema, H1 and
a summary paragraph BEFORE JavaScript hydrates. React Helmet only runs after
JS executes, so it does not solve this on its own.

Usage
-----
Mounted at `GET /api/prerender?path=/some/route` (see server.py).

- Returns an HTML document with SEO tags injected into `<head>` and a
  crawler-visible content block prepended to the React root.
- React hydrates over the block as normal (the block is inside `#root`, so
  ReactDOM will replace it on hydration).
- Deployment: route bot user-agents (or all HTML requests) through this endpoint
  at the edge (nginx `map $http_user_agent`, Cloudflare Worker, etc.).

Static routes are declared in `STATIC_ROUTES`. Dynamic blog posts are resolved
at request time by reading `blog_posts` from MongoDB.
"""

from datetime import datetime
from typing import Optional
import html as html_lib
import json
import os
import re

from motor.motor_asyncio import AsyncIOMotorDatabase

SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "https://fidelislogic.com").rstrip("/")
SITE_NAME = "Fidelis Logic"
DEFAULT_OG_IMAGE = "/Logo_Color_Large.png"  # Site-wide fallback served from /public
DEFAULT_OG_IMAGE_WIDTH = 1200
DEFAULT_OG_IMAGE_HEIGHT = 630


def _absolute_url(path_or_url: str) -> str:
    """Return an absolute URL. Accepts absolute URLs, protocol-relative, or paths."""
    if not path_or_url:
        return f"{SITE_BASE_URL}{DEFAULT_OG_IMAGE}"
    if path_or_url.startswith(("http://", "https://")):
        return path_or_url
    if path_or_url.startswith("//"):
        return f"https:{path_or_url}"
    if not path_or_url.startswith("/"):
        path_or_url = "/" + path_or_url
    return f"{SITE_BASE_URL}{path_or_url}"

# ---------------------------------------------------------------------------
# Reusable JSON-LD builders
# ---------------------------------------------------------------------------

def _organization_schema() -> dict:
    return {
        "@type": "Organization",
        "@id": f"{SITE_BASE_URL}/#organization",
        "name": "Fidelis Logic LLC",
        "url": SITE_BASE_URL,
        "logo": f"{SITE_BASE_URL}/favicon-192x192.png",
        # Keep in step with organizationSchema in
        # frontend/src/components/StructuredData.jsx and the footer links.
        "sameAs": [
            "https://www.linkedin.com/company/fidelis-logic/",
            "https://www.youtube.com/@fidelislogic",
            "https://www.instagram.com/fidelislogic/",
        ],
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Sharjah Media City Free Zone",
            "addressLocality": "Sharjah",
            "addressRegion": "Sharjah",
            "addressCountry": "AE",
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+971-52-360-7270",
            "email": "info@fidelislogic.com",
            "contactType": "customer service",
            "availableLanguage": ["en", "ar"],
        },
    }


def _website_schema() -> dict:
    return {
        "@type": "WebSite",
        "@id": f"{SITE_BASE_URL}/#website",
        "url": SITE_BASE_URL,
        "name": SITE_NAME,
        "publisher": {"@id": f"{SITE_BASE_URL}/#organization"},
    }


def _breadcrumb_schema(items: list[tuple[str, str]]) -> dict:
    """items = [(name, url_path), ...]"""
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": name,
                "item": f"{SITE_BASE_URL}{path}" if path else None,
            }
            for i, (name, path) in enumerate(items)
        ],
    }


# ---------------------------------------------------------------------------
# Routes that exist in the React app but are not publishable yet
# ---------------------------------------------------------------------------
# The content blueprint says new routes join the sitemap "only after they are
# publishable". These paths are reachable, but they have no STATIC_ROUTES entry,
# they are excluded from sitemap.xml (see server.py), and the React pages send
# `noindex`. Remove a path from here, add its STATIC_ROUTES entry, re-run
# backend/scripts/export_prerender_snapshot.py, and clear the matching flag in
# the frontend (CASE_STUDIES_PUBLISHED in src/data/caseStudies.js) to publish it.
UNPUBLISHED_ROUTES: frozenset[str] = frozenset({
    "/case-studies",
})


# ---------------------------------------------------------------------------
# Static route registry
# ---------------------------------------------------------------------------
# Each entry produces the full SEO payload for that path.

STATIC_ROUTES: dict[str, dict] = {
    "/": {
        "title": "UAE IT Consulting & Modern Workplace Solutions | Fidelis Logic",
        "description": (
            "Fidelis Logic helps UAE organisations plan, deploy, and support modern "
            "workplace technology — meeting rooms, collaboration devices, workspace "
            "platforms, and business applications. Vendor-neutral consulting across the UAE."
        ),
        "canonical": "/",
        # Keep in step with heroData in frontend/src/data/siteContent.js: the
        # React page replaces this block on hydration, and a crawler that sees a
        # different H1 to the rendered one is being told two stories.
        "h1": "Independent Modern Workplace Technology Advice for the UAE and GCC",
        "summary": (
            "Fidelis Logic helps organisations and delivery partners choose, plan "
            "and document the right solution — and works through the reseller or "
            "system integrator they already trust. Independent advice across ROOMZ "
            "and workspace management, video conferencing and meeting rooms, and "
            "ERP, CRM, HRMS and practical AI integration."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-home.jpg",
        "keywords": [
            "IT consulting UAE",
            "modern workplace technology",
            "meeting room solutions Dubai",
            "workspace experience platforms",
            "ERP consulting UAE",
        ],
        "structured_data": [
            _organization_schema(),
            _website_schema(),
        ],
    },
    "/solutions": {
        "title": "Modern Workplace Technology Solutions | Fidelis Logic",
        "description": (
            "Comprehensive UAE consulting for meeting rooms, collaboration devices, "
            "workspace experience platforms, and business applications. Vendor-neutral "
            "guidance from strategy through deployment and adoption."
        ),
        "canonical": "/solutions",
        "h1": "Start From the Decision You Are Trying to Make",
        "summary": (
            "Three priority areas lead: ROOMZ and workspace management, video "
            "conferencing and meeting rooms, and business applications with AI. "
            "Enterprise headsets, the Room Planner and lifecycle services support "
            "them. Every engagement stays independent and outcome-led."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-home.jpg",
        "keywords": [
            "workplace technology solutions",
            "IT consulting services UAE",
            "meeting room solutions",
            "collaboration technology",
            "business applications",
        ],
        "structured_data": [
            {
                "@type": "CollectionPage",
                "name": "Modern Workplace Solutions",
                "url": f"{SITE_BASE_URL}/solutions",
                "isPartOf": {"@id": f"{SITE_BASE_URL}/#website"},
            },
            _breadcrumb_schema([("Home", "/"), ("Solutions", "/solutions")]),
        ],
    },
    "/solutions/meeting-rooms": {
        "title": "Microsoft Teams Rooms & Zoom Rooms Deployment UAE | Fidelis Logic",
        "description": (
            "Expert consultation for Microsoft Teams Rooms, Zoom Rooms, and BYOD "
            "meeting spaces in the UAE. Professional AV system design, installation, "
            "commissioning, and post-deployment support."
        ),
        "canonical": "/solutions/meeting-rooms",
        "h1": "Meeting Rooms & AV Systems That Actually Get Used",
        "summary": (
            "Room design, device selection, cabling, commissioning and adoption "
            "for Microsoft Teams Rooms, Zoom Rooms and BYOD spaces. We stay vendor "
            "neutral across Poly, Neat, Logitech, Yealink and Jabra so the "
            "recommendation fits your calendar platform and estate — not a quota."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-meeting-rooms.jpg",
        "keywords": [
            "Microsoft Teams Rooms UAE",
            "Zoom Rooms Dubai",
            "meeting room technology",
            "AV systems UAE",
            "video conferencing deployment",
            "BYOD meeting rooms",
        ],
        "structured_data": [
            {
                "@type": "Service",
                "name": "Meeting Room & AV Systems Consulting",
                "provider": {"@id": f"{SITE_BASE_URL}/#organization"},
                "areaServed": "AE",
                "serviceType": "Meeting Room Technology Deployment",
                "url": f"{SITE_BASE_URL}/solutions/meeting-rooms",
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("Solutions", "/solutions"),
                ("Meeting Rooms", "/solutions/meeting-rooms"),
            ]),
        ],
    },
    "/solutions/headsets": {
        "title": "Enterprise Headsets & Collaboration Devices UAE | Fidelis Logic",
        "description": (
            "Standardise communication devices across your UAE organisation. "
            "Vendor-neutral guidance on enterprise headsets and UC endpoints for "
            "contact centres, hybrid workers, and executive users."
        ),
        "canonical": "/solutions/headsets",
        "h1": "Enterprise Headsets & Collaboration Devices",
        "summary": (
            "Standardise the audio and UC device stack across your organisation "
            "with a rollout plan that fits your calendar platform, roles and "
            "budget. Fleet management, replacement cycles and firmware policy "
            "included — across Jabra, Poly, Logitech and Yealink."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-headsets.jpg",
        "keywords": [
            "enterprise headsets UAE",
            "collaboration devices Dubai",
            "Jabra UAE",
            "Poly headsets UAE",
            "Logitech headsets",
            "contact centre headsets",
        ],
        "structured_data": [
            {
                "@type": "Service",
                "name": "Enterprise Headset & UC Device Consulting",
                "provider": {"@id": f"{SITE_BASE_URL}/#organization"},
                "areaServed": "AE",
                "serviceType": "Collaboration Device Standardisation",
                "url": f"{SITE_BASE_URL}/solutions/headsets",
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("Solutions", "/solutions"),
                ("Enterprise Headsets", "/solutions/headsets"),
            ]),
        ],
    },
    "/solutions/workspace-experience": {
        "title": "Room Booking, Hot Desking & Workspace Experience UAE | Fidelis Logic",
        "description": (
            "Optimise office utilisation with room booking, hot desking, occupancy "
            "sensing and workspace analytics. ROOMZ, Flowscape and leading platforms "
            "deployed and supported in the UAE by Fidelis Logic."
        ),
        "canonical": "/solutions/workspace-experience",
        "h1": "Room Booking, Hot Desking & Workspace Experience",
        "summary": (
            "Right-size your office footprint with honest occupancy data. We "
            "deploy wire-free room panels, desk booking, visitor management "
            "and analytics that integrate with Microsoft 365, Google Workspace "
            "and Exchange — so facilities and IT run off the same numbers."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-workspace-experience.jpg",
        "keywords": [
            "room booking system UAE",
            "hot desking Dubai",
            "workspace experience platform",
            "ROOMZ UAE",
            "occupancy analytics",
            "visitor management UAE",
        ],
        "structured_data": [
            {
                "@type": "Service",
                "name": "Workspace Experience Platform Deployment",
                "provider": {"@id": f"{SITE_BASE_URL}/#organization"},
                "areaServed": "AE",
                "serviceType": "Room Booking & Workspace Analytics",
                "url": f"{SITE_BASE_URL}/solutions/workspace-experience",
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("Solutions", "/solutions"),
                ("Workspace Experience", "/solutions/workspace-experience"),
            ]),
        ],
    },
    "/solutions/business-apps": {
        "title": "Low Cost ERP Solution, HRMS, CRM & AI ERP Integration UAE | Fidelis Logic",
        "description": (
            "Affordable ERP, HRMS and CRM for small UAE businesses. Near-zero license "
            "platforms, cloud or on-prem deployment, AI-assisted ERP updates, "
            "configuration, training and monthly plans from USD 10/month."
        ),
        "canonical": "/solutions/business-apps",
        "h1": "Low-Cost ERP, HRMS & CRM with AI Integration",
        "summary": (
            "Launch a practical business application platform with near-zero license "
            "cost, cloud or on-prem deployment, and AI-assisted ERP record keeping. "
            "Fidelis Logic delivers a live-in-a-week focused first phase followed by "
            "monthly optimisation, training and support tuned to lean teams."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-business-apps.jpg",
        "keywords": [
            "low cost ERP UAE",
            "affordable HRMS Dubai",
            "CRM for small business UAE",
            "AI ERP integration",
            "cloud ERP UAE",
            "on premise ERP UAE",
        ],
        "structured_data": [
            {
                "@type": "Service",
                "name": "Low-Cost ERP, HRMS & CRM Consulting",
                "provider": {"@id": f"{SITE_BASE_URL}/#organization"},
                "areaServed": "AE",
                "serviceType": "Business Application Consulting",
                "url": f"{SITE_BASE_URL}/solutions/business-apps",
                "description": (
                    "Configuration, deployment, AI integration and monthly support "
                    "for open-source and low-cost ERP, HRMS and CRM platforms."
                ),
                "offers": {
                    "@type": "Offer",
                    "priceCurrency": "USD",
                    "priceSpecification": {
                        "@type": "PriceSpecification",
                        "price": "10",
                        "priceCurrency": "USD",
                        "unitText": "MONTH",
                    },
                },
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("Solutions", "/solutions"),
                ("Business Applications", "/solutions/business-apps"),
            ]),
        ],
    },
    # ------------------------------------------------------------------
    # Audience journeys (content blueprint section 6)
    # ------------------------------------------------------------------
    "/for-organisations": {
        "title": "Independent Workplace Technology Advice for UAE Organisations | Fidelis Logic",
        "description": (
            "Independent assessment, solution selection and documentation for meeting "
            "rooms, workspace management and business applications — delivered with the "
            "reseller or system integrator you already use, across the UAE and GCC."
        ),
        "canonical": "/for-organisations",
        "h1": "Make a Technology Decision You Can Defend",
        "summary": (
            "Fidelis Logic assesses what your spaces and teams actually need, compares "
            "the credible approaches, and writes the recommendation down — then works "
            "alongside your existing reseller or system integrator to get it delivered. "
            "We do not sell the hardware, which is what keeps the advice about fit."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-home.jpg",
        "keywords": [
            "independent IT advice UAE",
            "workplace technology consultant UAE",
            "meeting room assessment Dubai",
            "vendor neutral AV consultant",
            "technology procurement support UAE",
        ],
        "content_sections": [
            {
                "heading": "Where workplace technology decisions get stuck",
                "items": [
                    "Every vendor's proposal looks the same, with no shared basis for comparison.",
                    "Nobody can say what the room actually needs, so the specification is a guess.",
                    "The decision has to survive scrutiny from IT, facilities, finance and procurement.",
                    "There is an existing reseller relationship nobody wants to replace.",
                ],
            },
            {
                "heading": "How an engagement runs",
                "items": [
                    "Understand the business and the space.",
                    "Assess requirements and current technology.",
                    "Recommend and document an appropriate solution.",
                    "Support delivery through your preferred partner.",
                ],
            },
            {
                "heading": "We work through your reseller, not around them",
                "paragraphs": [
                    "You keep the commercial relationship, the quotation, the supply and "
                    "the warranty where they are today. We provide the assessment, the "
                    "design and the documentation, and stay involved through delivery so "
                    "the solution that was agreed is the solution that gets installed.",
                    "Because we are not paid on the hardware, a more expensive room is not "
                    "a better outcome for us.",
                ],
            },
        ],
        "structured_data": [
            {
                "@type": "WebPage",
                "name": "For Organisations",
                "url": f"{SITE_BASE_URL}/for-organisations",
                "isPartOf": {"@id": f"{SITE_BASE_URL}/#website"},
                "about": "Independent workplace technology advisory for organisations",
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("For Organisations", "/for-organisations"),
            ]),
        ],
    },
    "/for-partners": {
        "title": "White-Label Assessment, Design & Delivery Support for Resellers | Fidelis Logic",
        "description": (
            "Confidential white-label capacity for UAE and GCC resellers and system "
            "integrators: discovery, site assessment, solution design, documentation, "
            "project management, deployment assistance, training and support."
        ),
        "canonical": "/for-partners",
        "h1": "Specialist Capacity Behind Your Brand",
        "summary": (
            "Fidelis Logic provides assessment, solution design, documentation, project "
            "management, deployment assistance, training and support as white-label "
            "capacity for resellers and system integrators. Your customer stays your "
            "customer: we do not supply the hardware and we do not compete for the order."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-home.jpg",
        "keywords": [
            "white label AV support UAE",
            "reseller design support",
            "system integrator subcontractor UAE",
            "AV project management UAE",
            "white label deployment GCC",
        ],
        "content_sections": [
            {
                "heading": "Situations where extra capacity is worth having",
                "items": [
                    "A tender needs a design there is no time to produce.",
                    "The requirement sits outside your core specialism.",
                    "Your project team is already committed elsewhere.",
                    "The customer wants an independent second opinion.",
                    "A multi-site rollout needs consistent documentation.",
                ],
            },
            {
                "heading": "Capabilities available under a white-label model",
                "items": [
                    "Discovery and requirement gathering.",
                    "Site assessment.",
                    "Solution design.",
                    "Documentation, including bills of quantity and as-built records.",
                    "Project management.",
                    "Deployment assistance.",
                    "Training and adoption.",
                    "Ongoing second-line support.",
                ],
            },
            {
                "heading": "How we work, and where we stop",
                "items": [
                    "The customer relationship stays yours.",
                    "We work under your brand.",
                    "Confidential by default: no references or marketing use without your written agreement.",
                    "We do not compete for the supply — the hardware and the order stay with you.",
                    "Scope agreed in writing before an engagement starts.",
                ],
            },
        ],
        "structured_data": [
            {
                "@type": "WebPage",
                "name": "For Resellers & System Integrators",
                "url": f"{SITE_BASE_URL}/for-partners",
                "isPartOf": {"@id": f"{SITE_BASE_URL}/#website"},
                "about": "White-label workplace technology support for channel partners",
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("For Resellers & Integrators", "/for-partners"),
            ]),
        ],
    },
    "/brands/roomz": {
        "title": "ROOMZ in the UAE — Wire-Free Room Booking & Occupancy | Fidelis Logic",
        "description": (
            "Swiss-engineered, battery-powered room booking panels and occupancy "
            "sensors. As ROOMZ's UAE distribution partner, Fidelis Logic delivers "
            "the full lifecycle — supply, configuration, integration and support."
        ),
        "canonical": "/brands/roomz",
        "h1": "ROOMZ — Wire-Free Room Booking for Hybrid Workplaces",
        "summary": (
            "ROOMZ combines e-paper booking panels, occupancy sensors and cloud "
            "analytics. It integrates natively with Microsoft 365, Google Workspace "
            "and Exchange — giving facilities and IT teams real-time visibility "
            "into room utilisation while ending double-bookings and no-shows. "
            "As ROOMZ's UAE Distribution Partner, Fidelis Logic owns the full "
            "in-region lifecycle."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-brand-roomz.jpg",
        "keywords": [
            "ROOMZ UAE",
            "wire-free room booking",
            "meeting room panels",
            "occupancy sensors",
            "hot desking Dubai",
            "workspace analytics",
        ],
        "structured_data": [
            {
                "@type": "Brand",
                "name": "ROOMZ",
                "url": f"{SITE_BASE_URL}/brands/roomz",
                "logo": f"{SITE_BASE_URL}/brand-logos/roomz.png",
                "description": (
                    "Swiss workspace experience platform for wire-free room booking "
                    "and occupancy intelligence."
                ),
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("Brands", "/brands"),
                ("ROOMZ", "/brands/roomz"),
            ]),
        ],
    },
}


# ---------------------------------------------------------------------------
# /brands hub + remaining brand pages
# ---------------------------------------------------------------------------
# Add every brand from the ecosystem to STATIC_ROUTES so each has its own
# pre-rendered HTML shell.

_BRAND_PAGES: dict[str, dict] = {
    "roomz": {
        "name": "ROOMZ",
        "tagline": "Wireless room booking and occupancy intelligence",
        "partnership": "Distribution Partner",
        "category": "Workspace Experience",
        "description": (
            "Plan and deploy ROOMZ wireless room booking panels, occupancy sensors "
            "and workplace analytics in the UAE with local consultation and support."
        ),
        "overview": (
            "ROOMZ helps organisations improve meeting-room availability without adding "
            "power or network cabling at every doorway. Fidelis Logic maps rooms, validates "
            "calendar integration and defines practical booking, check-in and release rules."
        ),
        "questions": [
            "Which Microsoft 365, Exchange or Google Workspace resources are in scope?",
            "Do you need booking visibility, occupancy evidence, or both?",
            "Which workplace decisions should the analytics support?",
        ],
        "image": "/img/social/og-brand-roomz.jpg",
        "image_alt": "ROOMZ wireless meeting room booking display in a modern office",
        "image_caption": (
            "ROOMZ combines a cable-free booking display with anonymous occupancy sensing "
            "for meeting-room availability and utilisation insight."
        ),
        "video": {
            "name": "ROOMZ workplace solutions overview",
            "description": "Official ROOMZ overview for hybrid offices and meeting spaces.",
            "contentUrl": "https://www.youtube.com/watch?v=-Z_NAOSVIig",
            "embedUrl": "https://www.youtube-nocookie.com/embed/-Z_NAOSVIig",
            "uploadDate": "2020-03-25T03:30:12-07:00",
        },
        "keywords": [
            "ROOMZ UAE", "wireless room booking system UAE",
            "meeting room booking panel Dubai", "occupancy sensor UAE",
            "workspace analytics Dubai", "Microsoft 365 room booking",
        ],
    },
    "morbit": {
        "name": "Morbit",
        "tagline": "Workspace monitoring and device management for IT operations",
        "partnership": "Channel Partner",
        "category": "Workspace Experience",
        "description": (
            "Monitor meeting-room devices, UC performance and workspace utilisation "
            "with Morbit in the UAE, supported by Fidelis Logic deployment services."
        ),
        "overview": (
            "Morbit gives IT, AV and workplace teams a consistent operational view across "
            "meeting rooms, collaboration services and connected building devices. Fidelis "
            "Logic connects the relevant systems, tunes alerts and maps incidents into support."
        ),
        "questions": [
            "Which services and devices create the most support demand?",
            "Who will act on each alert and escalation?",
            "Which utilisation and environmental metrics are genuinely useful?",
        ],
        "image": "/platform-images/morbit.png",
        "image_alt": "Morbit workspace and meeting room monitoring platform dashboard",
        "image_caption": "Morbit brings UC, AV, room and smart-building signals into one operational view.",
        "video": {
            "name": "Morbit Studio platform walkthrough",
            "description": "Official Morbit walkthrough of its cloud monitoring and analytics platform.",
            "contentUrl": "https://newsletter.morbit.co.uk/video/videos/2026/06/8b1c6ff3-b711-4557-a8e7-1b7055c5280a.mp4",
        },
        "keywords": [
            "Morbit UAE",
            "meeting room monitoring",
            "device management platform",
            "workspace analytics UAE",
            "IT operations dashboard",
        ],
    },
    "jabra": {
        "name": "Jabra",
        "tagline": "Enterprise audio and intelligent video for hybrid work",
        "partnership": "Channel Partner",
        "category": "Headsets & Devices",
        "description": (
            "Choose and deploy Jabra enterprise headsets and PanaCast video solutions "
            "in the UAE for contact centres, hybrid teams and meeting rooms."
        ),
        "overview": (
            "Jabra supports persona-led device standards for contact-centre agents, mobile "
            "managers and hybrid workers. Fidelis Logic validates connectivity and UC "
            "requirements, then plans firmware management and lifecycle support."
        ),
        "questions": [
            "What does each user persona do for most of the day?",
            "Which computers, phones and UC platforms must connect?",
            "How will firmware, spares and replacements be governed?",
        ],
        "image": "/img/social/og-brand-jabra.jpg",
        "image_alt": "Jabra professional audio and PanaCast video collaboration technology",
        "image_caption": "Jabra spans hybrid-work and contact-centre audio plus PanaCast meeting-room video.",
        "video": {
            "name": "Jabra PanaCast 50 intelligent video bar overview",
            "description": "Official Jabra overview of PanaCast 50 and its intelligent video features.",
            "contentUrl": "https://www.youtube.com/watch?v=KPKOyRGJKeQ",
            "embedUrl": "https://www.youtube-nocookie.com/embed/KPKOyRGJKeQ",
            "uploadDate": "2021-07-14T00:07:30-07:00",
        },
        "keywords": [
            "Jabra UAE",
            "enterprise headsets",
            "Jabra Engage",
            "Jabra Evolve2",
            "PanaCast UAE",
            "contact centre headsets",
        ],
    },
    "poly": {
        "name": "Poly",
        "tagline": "Professional audio, video, and headsets — engineered by HP",
        "partnership": "Channel Partner",
        "category": "Meeting Rooms & Headsets",
        "description": (
            "Design HP Poly meeting rooms and headset programmes in the UAE with Studio "
            "video systems, Voyager devices and Poly Lens management."
        ),
        "overview": (
            "HP Poly covers professional headsets and meeting-room systems in one "
            "collaboration portfolio. Fidelis Logic aligns room mode, camera and audio "
            "coverage, controllers and Poly Lens management with the support model."
        ),
        "questions": [
            "Is each room native, PC-based or BYOD?",
            "Can the camera and microphones cover the complete room layout?",
            "Will personal and room devices share one management policy?",
        ],
        "image": "https://i.ytimg.com/vi/8sDQv1RpVBU/maxresdefault.jpg",
        "image_alt": "HP Poly Studio X52 all-in-one video bar for meeting rooms",
        "image_caption": "Poly Studio supports USB, all-in-one and modular meeting-room designs.",
        "video": {
            "name": "HP Poly Studio X52 feature overview",
            "description": "Official HP Poly overview of the Studio X52 all-in-one video bar.",
            "contentUrl": "https://www.youtube.com/watch?v=8sDQv1RpVBU",
            "embedUrl": "https://www.youtube-nocookie.com/embed/8sDQv1RpVBU",
            "uploadDate": "2023-07-13T10:04:17-07:00",
        },
        "keywords": [
            "Poly UAE",
            "Poly Studio X",
            "Poly Voyager",
            "HP Poly Dubai",
            "video conferencing devices",
        ],
    },
    "neat": {
        "name": "Neat",
        "tagline": "Purpose-built video devices for Microsoft Teams and Zoom",
        "partnership": "Channel Partner",
        "category": "Meeting Rooms",
        "description": (
            "Design premium Microsoft Teams Rooms and Zoom Rooms in the UAE with Neat "
            "Bar, Neat Board, Neat Pad and local deployment support."
        ),
        "overview": (
            "Neat combines purpose-built room hardware, participant framing and integrated "
            "sensors for modern collaborative spaces. Fidelis Logic matches devices to room "
            "size, platform mode, display layout, mounting and the complete user journey."
        ),
        "questions": [
            "Which meeting platform will the room run natively?",
            "How large and visually demanding is the actual space?",
            "Which sensor and room insights have a clear owner?",
        ],
        "image": "/img/social/og-brand-neat.jpg",
        "image_alt": "Neat video meeting device in a modern Microsoft Teams or Zoom room",
        "image_caption": "Neat room devices pair design-led hardware with intelligent participant framing.",
        "video": {
            "name": "Neat Bar Pro virtual demonstration",
            "description": "Official Neat demonstration of Neat Bar Pro for larger meeting spaces.",
            "contentUrl": "https://www.youtube.com/watch?v=ZLLqU_YBD0I",
            "embedUrl": "https://www.youtube-nocookie.com/embed/ZLLqU_YBD0I",
            "uploadDate": "2024-02-06T10:19:12-08:00",
        },
        "keywords": [
            "Neat UAE",
            "Neat Bar Pro",
            "Neat Board",
            "Neat Pad",
            "Microsoft Teams Rooms devices",
        ],
    },
    "yealink": {
        "name": "Yealink",
        "tagline": "Scalable UC endpoints for multi-site deployments",
        "partnership": "Channel Partner",
        "category": "Meeting Rooms",
        "description": (
            "Deploy Yealink MeetingBar, MVC room systems, desk phones and headsets in "
            "the UAE with design, configuration and lifecycle support."
        ),
        "overview": (
            "Yealink covers all-in-one room bars, modular Teams Rooms kits, desk phones, "
            "headsets and scheduling accessories. Fidelis Logic turns that breadth into "
            "repeatable room standards, approved configurations and central management."
        ),
        "questions": [
            "How many repeatable room types are needed?",
            "Does each space need an all-in-one MeetingBar or modular MVC system?",
            "How will phones, headsets and room devices be managed together?",
        ],
        "image": "https://i.ytimg.com/vi/m64fzrAN_CM/maxresdefault.jpg",
        "image_alt": "Yealink MeetingBar all-in-one video conferencing system",
        "image_caption": "Yealink MeetingBar and MVC systems support repeatable UC room standards.",
        "video": {
            "name": "Yealink MeetingBar A20 overview",
            "description": "Official Yealink overview of its MeetingBar A20 collaboration system.",
            "contentUrl": "https://www.youtube.com/watch?v=m64fzrAN_CM",
            "embedUrl": "https://www.youtube-nocookie.com/embed/m64fzrAN_CM",
            "uploadDate": "2021-12-21T18:14:02-08:00",
        },
        "keywords": [
            "Yealink UAE",
            "MeetingBar A-series",
            "MVC room systems",
            "Yealink desk phones",
            "UC endpoints Dubai",
        ],
    },
    "logitech": {
        "name": "Logitech",
        "tagline": "Video, headsets, and peripherals across the hybrid workplace",
        "partnership": "Channel Partner",
        "category": "Meeting Rooms & Peripherals",
        "description": (
            "Standardise Logitech Rally room systems, MeetUp cameras, business headsets "
            "and webcams in the UAE with deployment and Sync management support."
        ),
        "overview": (
            "Logitech spans personal webcams and headsets through to MeetUp and Rally room "
            "systems. Fidelis Logic defines room standards, selects appliance or USB modes, "
            "plans audio coverage and brings supported devices into Logitech Sync."
        ),
        "questions": [
            "Which spaces need appliance mode and which need USB?",
            "Where do room size and audio coverage require expansion?",
            "Can desks and meeting rooms share a management approach?",
        ],
        "image": "/img/social/og-brand-logitech.jpg",
        "image_alt": "Logitech Rally video collaboration system for a hybrid meeting room",
        "image_caption": "Logitech offers a consistent collaboration portfolio across desks and meeting rooms.",
        "video": {
            "name": "Logitech Rally Bar overview",
            "description": "Official Logitech overview of Rally Bar for medium and large meeting rooms.",
            "contentUrl": "https://www.youtube.com/watch?v=lVlAzjRO7Qs",
            "embedUrl": "https://www.youtube-nocookie.com/embed/lVlAzjRO7Qs",
            "uploadDate": "2021-01-14T00:00:11-08:00",
        },
        "keywords": [
            "Logitech UAE",
            "Rally Bar",
            "Rally Plus",
            "Logitech Zone",
            "MeetUp camera",
            "hybrid workplace peripherals",
        ],
    },
}


# Keep the principal product families in the initial HTML response as well as
# the React experience. Search engines and no-JavaScript visitors should see
# the same useful category vocabulary, not just a generic brand introduction.
_BRAND_PRODUCT_CATEGORIES: dict[str, list[tuple[str, str, str]]] = {
    "roomz": [
        ("ROOMZ Display", "Meeting rooms needing clear, always-on availability without new cabling.", "Calendar mapping, Wi-Fi readiness, mounting and booking rules."),
        ("ROOMZ Room Sensor", "Reducing ghost meetings and measuring real room utilisation.", "Sensor placement, privacy communication, no-show policy and analytics baselines."),
        ("ROOMZ Desk Sensor", "Hybrid offices validating desk demand and neighbourhood capacity.", "Desk inventory, sensor placement, floor mapping and occupancy reporting."),
        ("ROOMZ Huddle Sensor", "Making small, unbooked spaces visible and easier to find.", "Space classification, live availability rules and wayfinding integration."),
        ("myROOMZ", "Flexible offices needing a practical employee booking experience.", "SSO, booking policies, floorplans, adoption and calendar integration."),
        ("ROOMZ Advanced Analytics", "Facilities and real-estate teams planning evidence-based space changes.", "Decision metrics, reporting ownership, tags, baselines and review cadence."),
    ],
    "morbit": [
        ("UC Platform Monitoring", "IT teams operating more than one collaboration platform or location.", "Tenant connections, permissions, service scope and alert ownership."),
        ("Device & Room Monitoring", "Reducing room downtime and repeat break-fix visits.", "Device discovery, manufacturer APIs, Morbit Hub placement and health thresholds."),
        ("Call Quality & Meeting Insights", "Support teams investigating poor calls that are difficult to reproduce.", "Quality baselines, escalation rules and service-desk evidence workflows."),
        ("Smart Building & Workspace Analytics", "Workplace teams comparing space demand with actual behaviour.", "Sensor integrations, floor hierarchy, reporting questions and data ownership."),
        ("Remote Device Management", "Distributed estates needing faster diagnosis and consistent configuration.", "Access controls, change governance, support boundaries and auditability."),
        ("MSP Multi-Tenant Operations", "Managed service providers standardising monitoring across customers.", "Tenant isolation, service tiers, reporting templates and escalation ownership."),
    ],
    "jabra": [
        ("Contact Centre — Engage & Biz", "Contact-centre agents and desk users with sustained call volumes.", "Softphone compatibility, wearing style, acoustic protection, spares and onboarding."),
        ("Hybrid Work — Evolve2", "Knowledge workers, managers and mobile professionals.", "UC certification, device pairing, charging, wearing preference and role standards."),
        ("Frontline Work — Perform", "Retail, warehouse and operational teams working away from a desk.", "Workflow fit, push-to-talk, hygiene, durability and shift handover."),
        ("Speakerphones — Speak2", "Mobile professionals, private offices and flexible small-group collaboration.", "Room acoustics, connection type, UC platform and shared-device policy."),
        ("Video Collaboration — PanaCast", "Personal video, huddle spaces and small-to-medium meeting rooms.", "Room coverage, mounting, platform mode, controller and network management."),
        ("Device Management — Jabra Xpress", "Organisations standardising and maintaining large device fleets.", "Firmware rings, configuration packages, ownership, reporting and change control."),
    ],
    "poly": [
        ("Room Video — Poly Studio", "Microsoft Teams Rooms, Zoom Rooms and professional BYOD spaces.", "Room mode, camera coverage, audio reach, controller, compute and mounting."),
        ("Mobile Audio — Voyager", "Executives, managers, sales teams and mobile hybrid workers.", "Wearing style, adapters, multi-device behaviour, charging and UC certification."),
        ("Desk Audio — Blackwire", "Office users who value reliable wired audio.", "Connector standard, wearing preference, acoustic policy and replacement stock."),
        ("Wireless Desk Audio — Savi", "High-call office roles that move away from the desk.", "Radio planning, base connectivity, density, security and charging."),
        ("Contact Centre — EncorePro", "Agents needing clear voice capture, comfort and serviceable accessories.", "QD or USB architecture, acoustic protection, hygiene, spares and personas."),
        ("Speakerphones — Poly Sync", "Private offices, mobile teams and small-group discussions.", "Expected group size, connectivity, portability and shared-device ownership."),
        ("Fleet Management — Poly Lens", "IT teams governing Poly devices across sites and user groups.", "Enrollment, firmware rings, configuration policy, inventory and support roles."),
    ],
    "neat": [
        ("Neat Bars", "Purpose-built Microsoft Teams, Zoom, Google Meet or BYOD rooms.", "Room reach, display count, platform mode, mounting and Neat Pad requirements."),
        ("Neat Boards", "Interactive meetings, whiteboarding and design-led multipurpose spaces.", "Screen size, room reach, mounting, platform and pen workflows."),
        ("Neat Pad & Neat Pad Pro", "Consistent room control and visible entrance scheduling.", "Controller role, scheduler placement, PoE, mounting and platform support."),
        ("Neat Center", "Medium and large rooms prioritising equitable participant coverage.", "Compatible front-of-room device, table position, cable route and sightlines."),
        ("Neat Frame", "Executive desks, personal meeting points and welcoming areas.", "Platform mode, placement, network, privacy and intended personal workflow."),
        ("Neat Pulse", "IT teams scaling Neat across rooms, offices or regions.", "Device enrollment, admin roles, standards, update policy and support tier."),
    ],
    "yealink": [
        ("MeetingBar", "Rooms needing a compact native Teams or Zoom appliance.", "Room size, platform license, display, controller, mounting and BYOD."),
        ("MVC Series", "Medium, large, boardroom and ProAV spaces needing modular design.", "Room geometry, camera strategy, microphones, speakers, compute and cabling."),
        ("MeetingBoard", "Collaborative rooms needing display, camera, audio and touch in one system.", "Display size, wall structure, platform, content workflow and room reach."),
        ("RoomPanel & Space IoT", "Making rooms easier to find, book and manage across an office.", "Calendar resources, panel placement, PoE, sensors and signage policy."),
        ("Business & Teams Phones", "Voice estates retaining handsets or moving from legacy telephony.", "Calling platform, persona, provisioning, network, power and accessories."),
        ("Business Headsets", "Organisations aligning personal audio with phones and UC platforms.", "Persona, wearing style, connectivity, certification, density and charging."),
        ("Yealink Management Cloud Service", "Multi-site IT teams standardising devices and reducing local administration.", "Tenant design, enrollment, templates, firmware policy, roles and remote support."),
    ],
    "logitech": [
        ("Rally Bar Family", "Repeatable room standards across Microsoft Teams, Zoom and Google Meet.", "Room size, mode, display, microphones, mounting and controller choice."),
        ("MeetUp 2", "Compact spaces needing professional BYOD or room-PC video.", "USB path, compute ownership, mounting, cable length and room acoustics."),
        ("Rally Plus", "Large rooms needing flexible camera and microphone placement.", "Camera sightline, mic-pod layout, speaker placement, compute and cables."),
        ("Sight & Scribe", "Rooms needing better remote views of people or physical whiteboards.", "Compatible room system, position, coverage, platform features and cabling."),
        ("Tap & Tap Scheduler", "A consistent join and booking experience across meeting rooms.", "Platform support, PoE, placement, mounting, cable route and calendars."),
        ("Personal Workspace Devices", "Hybrid workers, executives and standardised desk or home-office kits.", "Persona bundles, computer compatibility, UC certification, ergonomics and lifecycle."),
        ("Sync & CollabOS", "IT teams maintaining Logitech devices across multiple locations.", "Enrollment, admin roles, update channels, inventory, alerts and support."),
    ],
}


# Page titles for /brands/<slug>, matching brand.seoContent.title in
# frontend/src/data/brands.js so crawlers and browsers see the same title.
_BRAND_SEO_TITLES: dict[str, str] = {
    "roomz": "ROOMZ UAE | Wireless Room Booking & Occupancy Sensors",
    "morbit": "Morbit UAE | Meeting Room Monitoring & Workspace Analytics",
    "jabra": "Jabra UAE | Enterprise Headsets & PanaCast Video",
    "poly": "HP Poly UAE | Video Conferencing & Enterprise Headsets",
    "neat": "Neat UAE | Microsoft Teams & Zoom Room Devices",
    "yealink": "Yealink UAE | Teams Rooms, Zoom Rooms & UC Devices",
    "logitech": "Logitech UAE | Rally Bar, MeetUp & Business Headsets",
}


def _brand_route_entry(slug: str, spec: dict) -> dict:
    name = spec["name"]
    canonical = f"/brands/{slug}"
    image_url = _absolute_url(spec["image"])
    video_schema = {
        "@type": "VideoObject",
        "name": spec["video"]["name"],
        "description": spec["video"]["description"],
        "thumbnailUrl": [image_url],
        **spec["video"],
    }
    categories = [
        {
            "id": f"product-{slug}-{index}",
            "name": product_name,
            "description": f"Best fit: {best_for}",
            "best_for": best_for,
            "deployment_focus": deployment_focus,
        }
        for index, (product_name, best_for, deployment_focus) in enumerate(
            _BRAND_PRODUCT_CATEGORIES[slug], start=1
        )
    ]
    product_list_schema = {
        "@type": "ItemList",
        "name": f"{name} product categories",
        "numberOfItems": len(categories),
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": index,
                "item": {
                    "@type": "Thing",
                    "name": category["name"],
                    "description": category["description"],
                    "url": f"{SITE_BASE_URL}{canonical}#{category['id']}",
                },
            }
            for index, category in enumerate(categories, start=1)
        ],
    }
    return {
        "title": f"{_BRAND_SEO_TITLES.get(slug) or name + ' in the UAE'} | Fidelis Logic",
        "description": spec["description"],
        "canonical": canonical,
        "h1": f"{name} — {spec['tagline']}",
        "summary": spec["overview"],
        "og_type": "website",
        "og_image": spec["image"],
        "og_image_alt": spec["image_alt"],
        "keywords": spec["keywords"],
        "content_sections": [
            {
                "heading": f"Choosing {name} for a UAE deployment",
                "paragraphs": [spec["overview"]],
                "items": spec["questions"],
            },
            {
                "heading": f"{name} product families",
                "paragraphs": [
                    f"Explore the principal {name} product categories and the deployment decisions each one supports."
                ],
                "entries": categories,
            },
        ],
        "media": {
            "image": image_url,
            "alt": spec["image_alt"],
            "caption": spec["image_caption"],
            "video_url": spec["video"]["contentUrl"],
            "video_title": spec["video"]["name"],
            "video_description": spec["video"]["description"],
        },
        "structured_data": [
            {
                "@type": "Brand",
                "name": name,
                "url": f"{SITE_BASE_URL}{canonical}",
                "logo": f"{SITE_BASE_URL}/brand-logos/{slug}.png",
                "description": spec["description"],
            },
            {
                "@type": "ImageObject",
                "name": spec["image_alt"],
                "caption": spec["image_caption"],
                "contentUrl": image_url,
                "representativeOfPage": True,
            },
            video_schema,
            product_list_schema,
            _breadcrumb_schema([
                ("Home", "/"),
                ("Brands", "/brands"),
                (name, canonical),
            ]),
        ],
    }


for _slug, _spec in _BRAND_PAGES.items():
    STATIC_ROUTES[f"/brands/{_slug}"] = _brand_route_entry(_slug, _spec)


# ---------------------------------------------------------------------------
# /brands hub
# ---------------------------------------------------------------------------

_BRAND_DISPLAY_NAMES: dict[str, str] = {
    "roomz": "ROOMZ",
    "morbit": "Morbit",
    "jabra": "Jabra",
    "poly": "Poly",
    "neat": "Neat",
    "yealink": "Yealink",
    "logitech": "Logitech",
}
_BRAND_ORDER: list[str] = ["roomz", "morbit", "jabra", "poly", "neat", "yealink", "logitech"]

STATIC_ROUTES["/brands"] = {
    "title": "Curated Brand Ecosystem for UAE Workplace Technology | Fidelis Logic",
    "description": (
        "A deliberately short list of Fidelis Logic's strategic partners — ROOMZ, "
        "Morbit, Jabra, Poly, Neat, Yealink and Logitech — covering workspace "
        "experience, meeting rooms, collaboration devices and enterprise headsets."
    ),
    "canonical": "/brands",
    "h1": "Our Curated Brand Ecosystem",
    "summary": (
        "We stay vendor neutral, but not vendor unaware. Fidelis Logic works with a "
        "small set of manufacturers we can stand behind — chosen for engineering "
        "quality, in-region support and honest commercial terms. Every brand below "
        "is one we deploy, service and back with UAE-local expertise."
    ),
    "og_type": "website",
    "og_image": "/img/social/og-headsets.jpg",
    "keywords": [
        "workplace technology brands UAE",
        "IT vendor partnerships Dubai",
        "ROOMZ Jabra Poly Neat UAE",
        "collaboration hardware UAE",
    ],
    "structured_data": [
        {
            "@type": "CollectionPage",
            "name": "Curated Brand Ecosystem",
            "url": f"{SITE_BASE_URL}/brands",
            "isPartOf": {"@id": f"{SITE_BASE_URL}/#website"},
            "hasPart": [
                {
                    "@type": "Brand",
                    "name": _BRAND_DISPLAY_NAMES[s],
                    "url": f"{SITE_BASE_URL}/brands/{s}",
                }
                for s in _BRAND_ORDER
            ],
        },
        _breadcrumb_schema([("Home", "/"), ("Brands", "/brands")]),
    ],
}

STATIC_ROUTES["/blog"] = {
    "title": "Blog | Modern Workplace Technology Insights | Fidelis Logic",
    "description": (
        "Expert insights on workplace technology, meeting rooms, collaboration "
        "devices and business applications. Practical guidance for UAE organisations."
    ),
    "canonical": "/blog",
    "h1": "Fidelis Logic Blog — Workplace Technology Insights",
    "summary": (
        "Field notes and buyer guidance from Fidelis Logic — meeting room "
        "technology, collaboration devices, ERP and HRMS decisions, room "
        "booking platforms and the practicalities of running modern UAE "
        "workplace programmes."
    ),
    "og_type": "website",
    "og_image": "/img/social/og-home.jpg",
    "keywords": [
        "workplace technology blog",
        "IT consulting insights UAE",
        "meeting room best practices",
        "collaboration technology tips",
    ],
    "structured_data": [
        {
            "@type": "Blog",
            "name": "Fidelis Logic Blog",
            "url": f"{SITE_BASE_URL}/blog",
            "publisher": {"@id": f"{SITE_BASE_URL}/#organization"},
        },
        _breadcrumb_schema([("Home", "/"), ("Blog", "/blog")]),
    ],
}

# Titles, descriptions, H1s and copy below match the React pages (About.jsx,
# Contact.jsx, SmartDeals.jsx, RoomConfigurator.jsx and seoConfig.js).

STATIC_ROUTES["/about"] = {
    "title": "About Us | Leading IT Consulting Firm in the UAE | Fidelis Logic",
    "description": (
        "Learn about Fidelis Logic LLC - vendor-neutral IT consulting with deep UAE "
        "expertise in workplace technology, collaboration systems, and business "
        "applications."
    ),
    "canonical": "/about",
    "h1": "About us",
    "summary": (
        "We reduce complexity in modern workplace technology decisions, helping UAE "
        "organizations choose, implement, and optimize the right solutions with "
        "confidence through their trusted technology partners."
    ),
    "og_type": "website",
    "og_image": "/img/social/og-home.jpg",
    "keywords": [
        "IT consulting UAE",
        "Fidelis Logic",
        "technology consultants Dubai",
        "workplace technology experts",
    ],
    "content_sections": [
        {
            "heading": "Our mission",
            "paragraphs": [
                "We help organizations cut through the complexity of workplace "
                "technology by providing structured consulting, vendor-neutral "
                "guidance, and expert delivery support.",
                "The result is confident technology decisions and successful "
                "implementation through trusted resellers or system integrators.",
            ],
        },
        {
            "heading": "Our story",
            "paragraphs": [
                "Founded in the UAE, we recognized that organizations were making "
                "costly mistakes in workplace technology investments—not because of "
                "poor execution, but because of unclear requirements and vendor noise.",
                "Our consultative approach starts with understanding your business "
                "objectives, assessing your current environment, and designing "
                "solutions tailored to your needs. We then implement using the "
                "best-fit vendors available in the regional ecosystem—not based on "
                "partnerships, but on what actually works for you.",
                "Today, we serve organizations across the UAE—from SMBs implementing "
                "their first ERP system to enterprises deploying Microsoft Teams Rooms "
                "at scale. Our focus remains the same: clarity, reliability, and "
                "measurable results.",
            ],
        },
    ],
    "structured_data": [
        {
            "@type": "AboutPage",
            "name": "About Fidelis Logic",
            "url": f"{SITE_BASE_URL}/about",
            "isPartOf": {"@id": f"{SITE_BASE_URL}/#website"},
            "about": {"@id": f"{SITE_BASE_URL}/#organization"},
        },
        _organization_schema(),
        _breadcrumb_schema([("Home", "/"), ("About", "/about")]),
    ],
}

STATIC_ROUTES["/contact"] = {
    "title": "Contact Us | Schedule a Free IT Consultation | Fidelis Logic",
    "description": (
        "Book a free consultation to discuss your modern workplace technology needs. "
        "Expert guidance for UAE organizations on meeting rooms, collaboration "
        "devices, and business applications."
    ),
    "canonical": "/contact",
    "h1": "Let's talk about your technology needs",
    "summary": (
        "Schedule a free consultation to discuss how we can help simplify your modern "
        "workplace technology decisions. Get expert advice, completely free, with "
        "zero obligation to proceed."
    ),
    "og_type": "website",
    "og_image": "/img/social/og-home.jpg",
    "keywords": [
        "IT consultation UAE",
        "contact Fidelis Logic",
        "technology consulting Dubai",
        "free consultation",
    ],
    "content_sections": [
        {
            "heading": "Contact details",
            "paragraphs": [
                "Email: info@fidelislogic.com",
                "Phone: +971 52 360 7270",
                "Location: Sharjah Media City Free Zone, Sharjah, United Arab Emirates",
            ],
        },
    ],
    "structured_data": [
        {
            "@type": "ContactPage",
            "name": "Contact Fidelis Logic",
            "url": f"{SITE_BASE_URL}/contact",
            "isPartOf": {"@id": f"{SITE_BASE_URL}/#website"},
            "about": {"@id": f"{SITE_BASE_URL}/#organization"},
        },
        _organization_schema(),
        _breadcrumb_schema([("Home", "/"), ("Contact", "/contact")]),
    ],
}

STATIC_ROUTES["/deals"] = {
    "title": "Smart Deals | Best IT Technology Deals | Fidelis Logic",
    "description": (
        "Discover the best deals on IT solutions, meeting room technology, enterprise "
        "headsets, and business applications from top brands."
    ),
    "canonical": "/deals",
    "h1": "Smart Deals",
    "summary": (
        "Curated deals on premium IT solutions and technology from trusted brands. "
        "Save on meeting room systems, headsets, software, and more."
    ),
    "og_type": "website",
    "og_image": "/img/social/og-home.jpg",
    "keywords": [
        "IT deals",
        "technology discounts",
        "meeting room deals",
        "enterprise headset offers",
        "business software deals",
    ],
    "structured_data": [
        {
            "@type": "CollectionPage",
            "name": "Smart Deals",
            "url": f"{SITE_BASE_URL}/deals",
            "isPartOf": {"@id": f"{SITE_BASE_URL}/#website"},
        },
        _breadcrumb_schema([("Home", "/"), ("Smart Deals", "/deals")]),
    ],
}

STATIC_ROUTES["/tools/room-configurator"] = {
    "title": "Room Planner | Fidelis Logic",
    "description": (
        "Plan a meeting room with Fidelis Logic's Room Planner: capture the room's "
        "design and requirements, cut repeat site visits, and share a BOQ-ready plan "
        "with your customer or technology partner."
    ),
    "canonical": "/tools/room-configurator",
    "h1": "Room Planner",
    "summary": (
        "Turn the customer's ask into a documented room plan, keeping sales, "
        "presales, implementation and the customer aligned before install — so no "
        "one hears \"This isn't what I asked for!\""
    ),
    "og_type": "website",
    "og_image": "/img/social/og-meeting-rooms.jpg",
    "keywords": [
        "Room Planner",
        "meeting room configurator",
        "AV room design tool",
        "conference room planner",
        "BOQ",
    ],
    "content_sections": [
        {
            "heading": "What Room Planner does",
            "items": [
                "Capture the room's current design and the customer's requirements in one place",
                "Close the gap between what the customer needs and what gets installed",
                "Cut down on repeat site visits",
                "Produce a document ready to share with the customer and your technical "
                "team or distributor, so they can prepare a BOQ quickly",
            ],
        },
    ],
    "structured_data": [
        {
            "@type": "WebApplication",
            "name": "Room Planner",
            "url": f"{SITE_BASE_URL}/tools/room-configurator",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Any",
            "isAccessibleForFree": True,
            "publisher": {"@id": f"{SITE_BASE_URL}/#organization"},
        },
        _breadcrumb_schema([
            ("Home", "/"),
            ("Solutions", "/solutions"),
            ("Room Planner", "/tools/room-configurator"),
        ]),
    ],
}

# ---------------------------------------------------------------------------
# /services hub and /services/<slug> detail pages
# ---------------------------------------------------------------------------
# Content is read from the frontend's services.json so crawlers get exactly the
# copy the React pages render. The repo is deployed whole, so the file sits
# next to backend/. If it is missing the service routes are simply not
# pre-rendered (they still appear in the sitemap via SITEMAP_EXTRA_PAGES).

SERVICES_JSON_PATH = os.environ.get(
    "SERVICES_JSON_PATH",
    os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "frontend", "src", "data", "services.json",
    ),
)

_SOLUTION_NAMES: dict[str, str] = {
    "/solutions/meeting-rooms": "Meeting Rooms & AV Systems",
    "/solutions/headsets": "Enterprise Headsets & Collaboration Devices",
    "/solutions/workspace-experience": "Room Booking & Workspace Experience",
    "/solutions/business-apps": "Business Applications for Small Businesses",
}


def _load_services_data(path: str = SERVICES_JSON_PATH) -> Optional[dict]:
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return None


def _service_area(coverage: dict) -> list[dict]:
    return [
        *({"@type": "AdministrativeArea", "name": name} for name in coverage.get("regions", [])),
        {"@type": "Country", "name": "United Arab Emirates"},
    ]


def _service_route_entry(service: dict, by_slug: dict, coverage: dict) -> dict:
    slug = service["slug"]
    canonical = f"/services/{slug}"
    url = f"{SITE_BASE_URL}{canonical}"
    faqs = service.get("faqs", [])

    related_links = [
        {
            "path": f"/services/{other}",
            "title": by_slug[other]["name"],
            "description": by_slug[other]["oneLiner"],
        }
        for other in service.get("relatedServices", [])
        if other in by_slug
    ] + [
        {"path": path, "title": _SOLUTION_NAMES[path]}
        for path in service.get("relatedSolutions", [])
        if path in _SOLUTION_NAMES
    ] + [{"path": "/services", "title": "All workplace technology services"}]

    structured_data = [
        {
            "@type": "Service",
            "@id": f"{url}#service",
            "name": service["name"],
            "serviceType": service["name"],
            "description": service["shortDescription"],
            "url": url,
            "image": _absolute_url(f"/img/social/og-service-{slug}.jpg"),
            "provider": {"@id": f"{SITE_BASE_URL}/#organization"},
            "areaServed": _service_area(coverage),
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": f"{service['name']} deliverables",
                "itemListElement": [
                    {"@type": "Offer", "itemOffered": {"@type": "Service", "name": item}}
                    for item in service.get("deliverables", [])
                ],
            },
        },
        _breadcrumb_schema([
            ("Home", "/"),
            ("Services", "/services"),
            (service["name"], canonical),
        ]),
    ]
    if faqs:
        structured_data.append({
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": faq["question"],
                    "acceptedAnswer": {"@type": "Answer", "text": faq["answer"]},
                }
                for faq in faqs
            ],
        })

    return {
        "title": f"{service['seo']['title']} | {SITE_NAME}",
        "description": service["seo"]["description"],
        "canonical": canonical,
        "h1": service["h1"],
        "summary": f"{service['tagline']} {service['shortDescription']}",
        "og_type": "website",
        "og_image": f"/img/social/og-service-{slug}.jpg",
        "og_image_alt": service.get("images", {}).get("heroAlt"),
        "keywords": [k.strip() for k in service["seo"].get("keywords", "").split(",") if k.strip()],
        "content_sections": [
            {
                "heading": service.get("overviewHeading") or service["name"],
                "paragraphs": [service["longDescription"]],
            },
            {
                "heading": "Common challenges",
                "paragraphs": [
                    f"{c['title']}. {c['description']}" for c in service.get("challenges", [])
                ],
            },
            {
                "heading": "How the engagement runs",
                "items": [f"{p['title']}: {p['description']}" for p in service.get("process", [])],
            },
            {
                "heading": "What's included",
                "items": service.get("deliverables", []),
            },
            {
                "heading": "Best fit for",
                "items": service.get("idealFor", []),
            },
            {
                "heading": "Service area",
                "paragraphs": [
                    f"{service['name']} for organisations across {coverage.get('label', 'the UAE')}."
                ],
            },
            {
                "heading": "Frequently asked questions",
                "faqs": faqs,
            },
        ],
        "crawler_links": related_links,
        "crawler_links_heading": "Related services and solutions",
        "structured_data": structured_data,
    }


def _services_hub_entry(services: list[dict], coverage: dict) -> dict:
    return {
        "title": f"Workplace Technology Services UAE | {SITE_NAME}",
        "description": (
            "Consulting, audits, deployment, rentals, relocations, managed support, "
            "refresh programmes and training for meeting rooms and workspace "
            "technology across the UAE."
        ),
        "canonical": "/services",
        "h1": "Workplace technology services, under one accountable partner",
        "summary": (
            "From the first audit to day-90 adoption reviews, Fidelis Logic plans, "
            "delivers and operates workplace technology for organisations across "
            f"{coverage.get('label', 'the UAE')}."
        ),
        "og_type": "website",
        "og_image": "/img/social/og-home.jpg",
        "keywords": [
            "workplace technology services UAE",
            "AV services Dubai",
            "meeting room deployment",
            "managed AV support",
            "video conferencing rental",
        ],
        "crawler_links": [
            {"path": f"/services/{s['slug']}", "title": s["name"], "description": s["oneLiner"]}
            for s in services
        ],
        "crawler_links_heading": "Our services",
        "structured_data": [
            {
                "@type": "ItemList",
                "name": "Workplace technology services",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": index,
                        "name": s["name"],
                        "url": f"{SITE_BASE_URL}/services/{s['slug']}",
                    }
                    for index, s in enumerate(services, start=1)
                ],
            },
            _breadcrumb_schema([("Home", "/"), ("Services", "/services")]),
        ],
    }


def _register_service_routes() -> None:
    data = _load_services_data()
    if not data or not data.get("services"):
        return
    services = data["services"]
    coverage = data.get("coverage", {})
    by_slug = {s["slug"]: s for s in services}

    STATIC_ROUTES["/services"] = _services_hub_entry(services, coverage)
    for service in services:
        STATIC_ROUTES[f"/services/{service['slug']}"] = _service_route_entry(
            service, by_slug, coverage
        )

    # Surface every service on the homepage too, so the prerendered "/" links
    # to each service page and carries the catalogue in its Organization schema.
    home = STATIC_ROUTES["/"]
    home["crawler_links"] = [
        {"path": f"/services/{s['slug']}", "title": s["name"], "description": s["oneLiner"]}
        for s in services
    ]
    home["crawler_links_heading"] = "Workplace technology services"
    for schema in home["structured_data"]:
        if schema.get("@type") == "Organization":
            schema["areaServed"] = _service_area(coverage)
            schema["hasOfferCatalog"] = {
                "@type": "OfferCatalog",
                "name": "Workplace technology services",
                "itemListElement": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": s["name"],
                            "url": f"{SITE_BASE_URL}/services/{s['slug']}",
                        },
                    }
                    for s in services
                ],
            }


_register_service_routes()

# Slug of blog-post routes matches `^/blog/[a-z0-9-]+/?$`
BLOG_POST_RE = re.compile(r"^/blog/([a-z0-9][a-z0-9-]*)/?$")
DEAL_POST_RE = re.compile(r"^/deals/([a-z0-9][a-z0-9-]*)/?$")


# ---------------------------------------------------------------------------
# Blog post resolver
# ---------------------------------------------------------------------------

def _strip_html(raw: str, max_len: int = 320) -> str:
    """Strip HTML tags and collapse whitespace for use in meta/summary."""
    text = re.sub(r"<[^>]+>", " ", raw or "")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_len:
        text = text[: max_len - 1].rsplit(" ", 1)[0] + "…"
    return text


async def _blog_post_meta(db: AsyncIOMotorDatabase, slug: str) -> Optional[dict]:
    post = await db.blog_posts.find_one({"slug": slug, "published": True})
    if not post:
        return None

    title = post.get("seo_title") or post.get("title") or "Blog post"
    description = (
        post.get("seo_description")
        or post.get("excerpt")
        or _strip_html(post.get("content", ""))
    )
    canonical = f"/blog/{slug}"
    date_pub = post.get("published_at") or post.get("created_at")
    date_mod = post.get("updated_at") or date_pub
    og_image = (
        post.get("cover_image")
        or post.get("hero_image")
        or post.get("featured_image")
        or "/img/social/og-home.jpg"
    )
    # Featured images are stored as base64 data URIs. A data URI is not a path,
    # so _absolute_url would emit "https://<site>/data:image/png;base64,..." —
    # an invalid og:image megabytes long. Point at the image endpoint instead.
    if og_image.startswith("data:"):
        post_id = post.get("id")
        og_image = (
            f"/api/blog/posts/{post_id}/image" if post_id else "/img/social/og-home.jpg"
        )
    og_image_abs = _absolute_url(og_image)

    def _iso(value):
        if not value:
            return None
        try:
            return value.isoformat()
        except AttributeError:
            return str(value)

    return {
        "title": f"{title} | Fidelis Logic",
        "description": description[:300],
        "canonical": canonical,
        "h1": post.get("title") or title,
        "summary": _strip_html(post.get("content", ""), max_len=500) or description,
        "og_type": "article",
        "og_image": og_image,
        "og_image_alt": post.get("title") or title,
        "keywords": post.get("tags") or [],
        "structured_data": [
            {
                "@type": "BlogPosting",
                "headline": post.get("title"),
                "description": description[:300],
                "image": [og_image_abs],
                "url": f"{SITE_BASE_URL}{canonical}",
                "datePublished": _iso(date_pub),
                "dateModified": _iso(date_mod),
                "author": {
                    "@type": "Person",
                    "name": post.get("author") or "Fidelis Logic",
                },
                "publisher": {"@id": f"{SITE_BASE_URL}/#organization"},
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": f"{SITE_BASE_URL}{canonical}",
                },
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("Blog", "/blog"),
                (post.get("title") or title, canonical),
            ]),
        ],
    }


async def _deal_meta(db: AsyncIOMotorDatabase, slug: str) -> Optional[dict]:
    """Head tags and copy for /deals/<slug>, matching DealPost.jsx."""
    deal = await db.deals.find_one({"slug": slug, "published": True})
    if not deal:
        return None

    title = deal.get("seo_title") or deal.get("title") or "Deal"
    description = (
        deal.get("seo_description")
        or deal.get("excerpt")
        or _strip_html(deal.get("content", ""))
    )
    canonical = f"/deals/{slug}"
    # Deal images are stored inline as base64 data URIs, which can't be an
    # og:image; fall back to the site preview image.
    og_image = deal.get("featured_image") or "/img/social/og-home.jpg"
    if og_image.startswith("data:"):
        og_image = "/img/social/og-home.jpg"

    def _iso(value):
        try:
            return value.isoformat() if value else None
        except AttributeError:
            return str(value)

    return {
        "title": f"{title} | Smart Deals - Fidelis Logic",
        "description": description[:300],
        "canonical": canonical,
        "h1": deal.get("title") or title,
        "summary": _strip_html(deal.get("content", ""), max_len=500) or description,
        "og_type": "product",
        "og_image": og_image,
        "og_image_alt": deal.get("title") or title,
        "keywords": deal.get("tags") or [],
        "structured_data": [
            {
                "@type": "Offer",
                "name": title,
                "description": description[:300],
                "image": _absolute_url(og_image),
                "url": f"{SITE_BASE_URL}{canonical}",
                "validFrom": _iso(deal.get("start_date")),
                "validThrough": _iso(deal.get("end_date")),
                "seller": {"@id": f"{SITE_BASE_URL}/#organization"},
            },
            _breadcrumb_schema([
                ("Home", "/"),
                ("Smart Deals", "/deals"),
                (deal.get("title") or title, canonical),
            ]),
        ],
    }


# ---------------------------------------------------------------------------
# Resolver — path → SEO metadata (or None)
# ---------------------------------------------------------------------------

async def _blog_hub_links(db: AsyncIOMotorDatabase) -> list[dict]:
    """Return every published blog post as a list of anchor-link dicts."""
    cursor = (
        db.blog_posts.find(
            {"published": True},
            {"_id": 0, "slug": 1, "title": 1, "excerpt": 1},
        )
        .sort("published_at", -1)
    )
    links: list[dict] = []
    async for post in cursor:
        slug = post.get("slug")
        title = post.get("title")
        if not slug or not title:
            continue
        links.append(
            {
                "path": f"/blog/{slug}",
                "title": title,
                "description": (post.get("excerpt") or "")[:200],
            }
        )
    return links


async def _deal_hub_links(db: AsyncIOMotorDatabase) -> list[dict]:
    """Return every published, unexpired deal as a list of anchor-link dicts."""
    now = datetime.utcnow()
    cursor = db.deals.find(
        {
            "published": True,
            "$or": [
                {"end_date": {"$exists": False}},
                {"end_date": None},
                {"end_date": {"$gte": now}},
            ],
        },
        {"_id": 0, "slug": 1, "title": 1, "excerpt": 1},
    ).sort("created_at", -1)
    links: list[dict] = []
    async for deal in cursor:
        slug = deal.get("slug")
        title = deal.get("title")
        if not slug or not title:
            continue
        links.append(
            {
                "path": f"/deals/{slug}",
                "title": title,
                "description": (deal.get("excerpt") or "")[:200],
            }
        )
    return links


async def list_dynamic_routes(db: AsyncIOMotorDatabase) -> list[str]:
    """Published blog posts and deals — the routes that live in the database."""
    posts = await db.blog_posts.find(
        {"published": True}, {"slug": 1, "_id": 0}
    ).to_list(length=1000)
    deals = await db.deals.find(
        {"published": True}, {"slug": 1, "_id": 0}
    ).to_list(length=1000)
    return [f"/blog/{p['slug']}" for p in posts if p.get("slug")] + [
        f"/deals/{d['slug']}" for d in deals if d.get("slug")
    ]


async def resolve_route_meta(path: str, db: AsyncIOMotorDatabase) -> Optional[dict]:
    """Return the SEO metadata for `path`, or None if not a pre-rendered route."""
    # Normalise (strip trailing slash except for "/")
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")

    if path == "/blog":
        # Enrich the /blog hub with anchor links so non-JS crawlers can
        # discover every published post from the initial HTML response.
        meta = {**STATIC_ROUTES["/blog"]}
        meta["crawler_links"] = await _blog_hub_links(db)
        meta["crawler_links_heading"] = "Latest posts"
        return meta

    if path == "/deals":
        meta = {**STATIC_ROUTES["/deals"]}
        meta["crawler_links"] = await _deal_hub_links(db)
        meta["crawler_links_heading"] = "Current deals"
        return meta

    if path in STATIC_ROUTES:
        return STATIC_ROUTES[path]

    match = BLOG_POST_RE.match(path)
    if match:
        return await _blog_post_meta(db, match.group(1))

    match = DEAL_POST_RE.match(path)
    if match:
        return await _deal_meta(db, match.group(1))

    return None


# ---------------------------------------------------------------------------
# HTML shell renderer
# ---------------------------------------------------------------------------

_HTML_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#2563eb" />
<meta name="author" content="Fidelis Logic LLC" />
<title>{title}</title>
<meta name="description" content="{description}" />
{keywords_tag}
<link rel="canonical" href="{canonical_url}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:url" content="{canonical_url}" />
<meta property="og:type" content="{og_type}" />
<meta property="og:site_name" content="{site_name}" />
<meta property="og:image" content="{og_image_url}" />
<meta property="og:image:secure_url" content="{og_image_url}" />
<meta property="og:image:width" content="{og_image_width}" />
<meta property="og:image:height" content="{og_image_height}" />
<meta property="og:image:alt" content="{og_image_alt}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="{og_image_url}" />
<meta name="twitter:image:alt" content="{og_image_alt}" />
<meta name="robots" content="index, follow" />
{structured_data_scripts}
</head>
<body>
<main id="__seo_prerender" data-prerendered="true">
<h1>{h1}</h1>
<p>{summary}</p>
{body_content}
{crawler_links_html}
</main>
<noscript>
<p>This site requires JavaScript for the full experience. The core content above
is served for crawlers and users without JavaScript enabled.
Contact: <a href="{site_url}/contact">{site_name} contact page</a>.</p>
</noscript>
</body>
</html>
"""


def _esc(value) -> str:
    if value is None:
        return ""
    return html_lib.escape(str(value), quote=True)


def _render_body_content(meta: dict) -> str:
    """Render extra static route copy and media as safe, crawler-readable HTML."""
    parts = []
    for section in meta.get("content_sections", []) or []:
        heading = _esc(section.get("heading") or "")
        paragraphs = "".join(
            f"<p>{_esc(paragraph)}</p>"
            for paragraph in section.get("paragraphs", []) or []
        )
        items = section.get("items", []) or []
        item_html = (
            "<ol>" + "".join(f"<li>{_esc(item)}</li>" for item in items) + "</ol>"
            if items else ""
        )
        entries_html = "".join(
            '<article'
            f' id="{_esc(entry.get("id"))}">'
            f'<h3>{_esc(entry.get("name"))}</h3>'
            f'<p>{_esc(entry.get("description"))}</p>'
            f'<p><strong>Best fit:</strong> {_esc(entry.get("best_for"))}</p>'
            f'<p><strong>Deployment focus:</strong> {_esc(entry.get("deployment_focus"))}</p>'
            '</article>'
            for entry in section.get("entries", []) or []
        )
        faqs_html = "".join(
            f'<h3>{_esc(faq.get("question"))}</h3><p>{_esc(faq.get("answer"))}</p>'
            for faq in section.get("faqs", []) or []
        )
        if not (paragraphs or item_html or entries_html or faqs_html):
            continue
        parts.append(
            f"<section><h2>{heading}</h2>{paragraphs}{item_html}{entries_html}{faqs_html}</section>"
        )

    media = meta.get("media") or {}
    if media:
        parts.append(
            '<figure>'
            f'<img src="{_esc(media.get("image"))}" '
            f'alt="{_esc(media.get("alt"))}" width="1200" height="675" loading="lazy" />'
            f'<figcaption>{_esc(media.get("caption"))}</figcaption>'
            '</figure>'
            '<section>'
            f'<h2>{_esc(media.get("video_title"))}</h2>'
            f'<p>{_esc(media.get("video_description"))}</p>'
            f'<p><a href="{_esc(media.get("video_url"))}">Watch the official product video</a></p>'
            '</section>'
        )
    return "\n".join(parts)


def render_seo_html(path: str, meta: dict) -> str:
    """Render a full HTML document with SEO tags baked in."""
    canonical_path = meta.get("canonical") or path
    canonical_url = f"{SITE_BASE_URL}{canonical_path}"

    keywords = meta.get("keywords") or []
    keywords_tag = (
        f'<meta name="keywords" content="{_esc(", ".join(keywords))}" />'
        if keywords else ""
    )

    og_image_url = _absolute_url(meta.get("og_image"))
    og_image_alt = meta.get("og_image_alt") or meta.get("title") or SITE_NAME

    scripts = []
    for schema in meta.get("structured_data", []) or []:
        payload = {"@context": "https://schema.org", **schema}
        # Drop keys with None values for cleanliness
        cleaned = json.loads(json.dumps(payload, default=str))
        scripts.append(
            '<script type="application/ld+json">'
            + json.dumps(cleaned, separators=(",", ":"), ensure_ascii=False)
            + "</script>"
        )
    structured_data_scripts = "\n".join(scripts)

    # Optional list of internal anchor links that crawlers can follow directly
    # from this page. Used primarily by /blog to expose every published post to
    # non-JS bots.
    crawler_links_html = ""
    links = meta.get("crawler_links") or []
    if links:
        items = "\n".join(
            f'<li><a href="{_esc(link["path"])}">{_esc(link["title"])}</a>'
            + (
                f' — <span>{_esc(link["description"])}</span>'
                if link.get("description")
                else ""
            )
            + "</li>"
            for link in links
        )
        heading = _esc(meta.get("crawler_links_heading") or "Explore")
        crawler_links_html = (
            f'<section aria-label="{heading}">'
            f"<h2>{heading}</h2>"
            f"<ul>{items}</ul>"
            f"</section>"
        )

    return _HTML_TEMPLATE.format(
        title=_esc(meta.get("title") or SITE_NAME),
        description=_esc(meta.get("description") or ""),
        keywords_tag=keywords_tag,
        canonical_url=_esc(canonical_url),
        og_type=_esc(meta.get("og_type") or "website"),
        og_image_url=_esc(og_image_url),
        og_image_width=DEFAULT_OG_IMAGE_WIDTH,
        og_image_height=DEFAULT_OG_IMAGE_HEIGHT,
        og_image_alt=_esc(og_image_alt),
        site_name=_esc(SITE_NAME),
        site_url=SITE_BASE_URL,
        h1=_esc(meta.get("h1") or ""),
        summary=_esc(meta.get("summary") or ""),
        body_content=_render_body_content(meta),
        crawler_links_html=crawler_links_html,
        structured_data_scripts=structured_data_scripts,
    )


def list_static_routes() -> list[str]:
    return sorted(STATIC_ROUTES.keys())
