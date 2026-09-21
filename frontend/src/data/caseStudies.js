// Case-study library (blueprint sections 9 and 11).
//
// EMPTY ON PURPOSE. The blueprint forbids inventing customers, percentages,
// savings, quotations or project scale, and no case brief has been approved
// yet. Every surface that renders cases — the /case-studies library, the
// homepage case section, and the "relevant case study" slots on the audience,
// solution and service pages — checks for entries first and renders nothing
// (or an honest empty state) while this list is empty.
//
// Adding the first case:
//   1. Append an object below using the template in `caseStudyTemplate`.
//      Every field marked required must be filled with verified information.
//      An anonymous `customer` is fine; a vague one is not ("a Dubai-based
//      logistics operator with 14 meeting rooms", not "a large company").
//   2. Add `/case-studies` and `/case-studies/<slug>` to STATIC_ROUTES in
//      backend/seo_prerender.py, then re-run
//      `python backend/scripts/export_prerender_snapshot.py`.
//   3. Remove CASE_STUDIES_PUBLISHED = false below so the route stops sending
//      `noindex` and starts appearing in the navigation and sitemap.

// Flips the /case-studies routes from "built but not published" to live.
// While false: the pages render, but they are noindex, absent from the primary
// navigation, and absent from the sitemap.
export const CASE_STUDIES_PUBLISHED = false;

/**
 * The 11-field case-study template from blueprint section 11.
 * Kept in code (not a comment) so an editor can copy it verbatim.
 */
export const caseStudyTemplate = {
  // 1. Case title focused on the business situation, not the product bought.
  title: "",
  slug: "",
  // 2. Named customer, or a precise anonymous descriptor.
  customer: "",
  // 3. Location and sector — only when approved for publication.
  location: "",
  sector: "",
  // Which priority pillar this case belongs to: one of the ids in
  // caseStudyPillars below. Drives the library filter.
  pillar: "",
  // Which audience the case speaks to: "organisation" or "partner".
  audience: "",
  // 4. Challenge.
  challenge: "",
  // 5. Assessment and decision process.
  assessment: "",
  // 6. Recommended solution.
  recommendation: "",
  // 7. Partner and delivery model — name the reseller or integrator only with
  //    their written agreement; otherwise describe the model.
  deliveryModel: "",
  // 8. Scope delivered, as a list of concrete items.
  scope: [],
  // 9. Verified result. Evidence only. No invented percentages or savings.
  result: "",
  // 10. Related solutions, services and brands (paths and brand slugs).
  relatedSolutions: [],
  relatedServices: [],
  relatedBrands: [],
  // Short summary used on the library card.
  summary: ""
};

// Filter groups for the library. Kept aligned with the three priority pillars.
export const caseStudyPillars = [
  { id: "workspace", label: "ROOMZ & workspace management" },
  { id: "meeting-rooms", label: "Video conferencing & meeting rooms" },
  { id: "business-apps", label: "Business applications & AI" }
];

export const caseStudies = [];

export const hasCaseStudies = caseStudies.length > 0;

export const getCaseStudyBySlug = (slug) =>
  caseStudies.find((c) => c.slug === slug);

/** Cases for one pillar, or all of them when `pillar` is falsy/"all". */
export const getCaseStudiesByPillar = (pillar) =>
  !pillar || pillar === "all"
    ? caseStudies
    : caseStudies.filter((c) => c.pillar === pillar);

/** Cases for one audience id ("organisation" | "partner"). */
export const getCaseStudiesByAudience = (audience) =>
  !audience || audience === "all"
    ? caseStudies
    : caseStudies.filter((c) => c.audience === audience);

/**
 * Cases matching any of the given facets: a solution path, a service slug, a
 * brand slug, a pillar id, or an audience id. Passing no facet returns nothing,
 * so a caller that means "all cases" should read `caseStudies` directly.
 */
export const getRelatedCaseStudies = ({ solution, service, brand, pillar, audience } = {}) =>
  caseStudies.filter(
    (c) =>
      (solution && (c.relatedSolutions || []).includes(solution)) ||
      (service && (c.relatedServices || []).includes(service)) ||
      (brand && (c.relatedBrands || []).includes(brand)) ||
      (pillar && c.pillar === pillar) ||
      (audience && c.audience === audience)
  );
