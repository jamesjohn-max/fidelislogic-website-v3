// Primary navigation (blueprint section 2) — the single source of truth for the
// desktop menus, the grouped mobile menu and the footer link columns.
//
// Six items, in this order: Solutions, Services, Who We Help, Resources,
// Brands, About. "Book a Consultation" is the persistent primary action and is
// rendered separately by the header, not listed here.
import { priorityPillars, supportingSolutions } from "./pillars";
import { audiences } from "./audiences";
import { serviceStages, getServicesByStage } from "./services";
import { getBrandsSorted } from "./brands";
import { CASE_STUDIES_PUBLISHED } from "./caseStudies";

const solutionsNav = {
  id: "solutions",
  label: "Solutions",
  href: "/solutions",
  // What the item is for, per the blueprint's navigation table.
  purpose: "Find an answer by business need",
  overviewLabel: "All solutions",
  groups: [
    {
      // The three priority pillars lead the menu.
      label: "Priority solutions",
      items: priorityPillars.map((pillar) => ({
        label: pillar.title,
        href: pillar.href,
        description: pillar.tagline
      }))
    },
    {
      label: "Also from us",
      items: supportingSolutions
        .filter((s) => s.id !== "services" && s.id !== "brands")
        .map((s) => ({
          label: s.title,
          href: s.href,
          description: s.description
        }))
    }
  ]
};

const servicesNav = {
  id: "services",
  label: "Services",
  href: "/services",
  purpose: "How we support the technology lifecycle",
  overviewLabel: "All services",
  // Plan / Deliver / Operate, straight from services.json.
  groups: serviceStages.map((stage) => ({
    label: stage.label,
    items: getServicesByStage(stage.id).map((service) => ({
      label: service.name,
      href: `/services/${service.slug}`,
      description: service.oneLiner
    }))
  }))
};

const whoWeHelpNav = {
  id: "who-we-help",
  label: "Who We Help",
  // No hub page of its own: the two audience pages are the destinations, and
  // neither is the parent of the other.
  href: null,
  purpose: "Two audience journeys, one website",
  groups: [
    {
      label: null,
      items: audiences.map((audience) => ({
        label: audience.navLabel,
        href: audience.href,
        description: audience.gatewayBlurb
      }))
    }
  ]
};

const resourcesNav = {
  id: "resources",
  label: "Resources",
  href: null,
  purpose: "Tools and expertise in one predictable place",
  groups: [
    {
      label: null,
      items: [
        {
          label: "Room Planner",
          href: "/tools/room-configurator",
          description: "Document a room, check sightlines, export a report"
        },
        // Hidden until the first case study is approved for publication.
        ...(CASE_STUDIES_PUBLISHED
          ? [
              {
                label: "Case studies",
                href: "/case-studies",
                description: "Delivered work, by solution pillar and audience"
              }
            ]
          : []),
        {
          label: "Blog",
          href: "/blog",
          description: "Practical guidance on rooms, workspace and applications"
        },
        {
          label: "Smart Deals",
          href: "/deals",
          description: "Current promotions, with validity and geography stated"
        }
      ]
    }
  ]
};

const brandsNav = {
  id: "brands",
  label: "Brands",
  href: "/brands",
  purpose: "Manufacturer discovery",
  overviewLabel: "All brands",
  groups: [
    {
      label: null,
      items: getBrandsSorted().map((brand) => ({
        label: brand.name,
        href: `/brands/${brand.slug}`,
        description: brand.category
      }))
    }
  ]
};

const aboutNav = {
  id: "about",
  label: "About",
  href: "/about",
  purpose: "Credibility and delivery philosophy",
  groups: []
};

export const primaryNav = [
  solutionsNav,
  servicesNav,
  whoWeHelpNav,
  resourcesNav,
  brandsNav,
  aboutNav
];

/** Flat list of every destination in the menus — used by the footer columns. */
export const navItemsFor = (id) => {
  const entry = primaryNav.find((n) => n.id === id);
  if (!entry) return [];
  return entry.groups.flatMap((group) => group.items);
};

// Footer columns (blueprint section 4, "Footer"): the same five groupings as
// the navigation, plus Company.
export const footerColumns = [
  { heading: "Solutions", href: "/solutions", items: navItemsFor("solutions") },
  { heading: "Services", href: "/services", items: navItemsFor("services") },
  { heading: "Who We Help", href: null, items: navItemsFor("who-we-help") },
  { heading: "Resources", href: null, items: navItemsFor("resources") },
  {
    heading: "Company",
    href: null,
    items: [
      { label: "About", href: "/about" },
      { label: "Brands", href: "/brands" },
      { label: "Contact", href: "/contact" }
    ]
  }
];
