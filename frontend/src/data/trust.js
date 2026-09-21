// Approved proof points for the reusable trust band (blueprint section 4).
//
// Only evidence the blueprint lists as approved appears here. Deliberately
// absent, because they are unverified: certification levels, partnership tiers,
// territorial rights, exclusivity, response times and project counts. Do not
// add any of those without written confirmation.
//
// `certifiedBrands` names the brands we hold technical certifications in. It is
// intentionally narrower than the brand ecosystem in data/brands.js — the badge
// strip shows the certified brands, the logo wall shows who we deliver.
export const certifiedBrands = ["poly", "jabra", "yealink", "neat", "logitech"];

export const trustPoints = [
  {
    id: "experience",
    value: "20+ years",
    // Animated by NumberTicker; `value` stays the plain-text form.
    count: 20,
    suffix: "+ years",
    label: "of modern workplace technology experience",
    icon: "CalendarClock"
  },
  {
    id: "project-management",
    value: "Certified",
    label: "project management",
    icon: "GanttChartSquare"
  },
  {
    id: "technical-certifications",
    value: "5 platforms",
    count: 5,
    suffix: " platforms",
    label: "technical certifications in Poly, Jabra, Yealink, Neat and Logitech solutions",
    icon: "Award"
  },
  {
    id: "coverage",
    value: "UAE & GCC",
    label: "advisory, delivery support and coverage",
    icon: "MapPin"
  }
];
