// Services offered by Fidelis Logic. Single source of truth for the
// Services dropdown, footer, homepage services section, /services hub page,
// and each /services/:slug detail page.
//
// The content itself lives in services.json so the backend SEO prerender
// (backend/seo_prerender.py) can read the exact same copy for crawlers.
// Edit services.json, not this file, to change service content.
import data from "./services.json";

export const services = data.services;

// Lifecycle stages used to group services: Plan, Deliver, Operate.
export const serviceStages = data.stages;

// Where services are delivered. `label` is the human-readable phrase used in
// copy; `regions` feeds the areaServed field of the Service JSON-LD.
export const serviceCoverage = data.coverage;

// Widths built for service photography by scripts/optimize-images.sh.
export const serviceImageWidths = [400, 768, 1280, 1920];

export const getServiceBySlug = (slug) => services.find((s) => s.slug === slug);

export const getServicesByStage = (stageId) =>
  services.filter((s) => s.stage === stageId);
