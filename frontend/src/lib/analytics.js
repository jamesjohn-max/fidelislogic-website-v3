/**
 * Thin GA4 event-tracking wrapper. Safely no-ops if gtag isn't loaded
 * (e.g., ad-blockers, dev/test environments).
 *
 * GA4 event naming convention: snake_case verbs, ≤40 chars.
 * Params: keep keys snake_case, values short strings/numbers.
 *
 * Reference: window.gtag('event', name, params).
 */

const isGtagAvailable = () =>
  typeof window !== "undefined" && typeof window.gtag === "function";

export const trackEvent = (name, params = {}) => {
  if (!isGtagAvailable()) return;
  try {
    window.gtag("event", name, params);
  } catch {
    /* swallow — analytics must never break UX */
  }
};

// Convenience helpers for the events we track across the site.
export const analytics = {
  consultationCtaClick: (params) => trackEvent("consultation_cta_click", params),
  partnerBriefingClick: (params) => trackEvent("partner_briefing_click", params),
  brandLeadSubmit: (params) => trackEvent("brand_lead_submit", params),
  brandLeadSubmitError: (params) => trackEvent("brand_lead_submit_error", params),
  brandLeadStart: (params) => trackEvent("brand_lead_start", params),
  contactFormSubmit: (params) => trackEvent("contact_form_submit", params),
  floatingDealsClick: (params) => trackEvent("floating_deals_click", params),
  floatingConfiguratorClick: (params) => trackEvent("floating_configurator_click", params),
  solutionBrandClick: (params) => trackEvent("solution_brand_click", params),

  // Blueprint section 13 — track the journey, not just page views.
  // Which of the two audience pathways a visitor chose.
  audiencePathwaySelect: (params) => trackEvent("audience_pathway_select", params),
  // A solution or service page's primary "discuss this" action.
  solutionEnquiryClick: (params) => trackEvent("solution_enquiry_click", params),
  serviceEnquiryClick: (params) => trackEvent("service_enquiry_click", params),
  // Consultation form lifecycle, kept separate from contactFormSubmit so a
  // started-but-abandoned form is visible.
  consultationFormStart: (params) => trackEvent("consultation_form_start", params),
  consultationFormError: (params) => trackEvent("consultation_form_error", params),
  // Direct contact routes.
  phoneClick: (params) => trackEvent("phone_click", params),
  emailClick: (params) => trackEvent("email_click", params),
  // Partner (reseller / system integrator) enquiries, separate from customer ones.
  partnerEnquiryStart: (params) => trackEvent("partner_enquiry_start", params),
  partnerEnquirySubmit: (params) => trackEvent("partner_enquiry_submit", params),
  // Room Planner funnel.
  roomPlannerStart: (params) => trackEvent("room_planner_start", params),
  roomPlannerProgress: (params) => trackEvent("room_planner_progress", params),
  roomPlannerPdf: (params) => trackEvent("room_planner_pdf", params),
  roomPlannerConsultation: (params) => trackEvent("room_planner_consultation", params),
  // Case studies and their onward journeys.
  caseStudyView: (params) => trackEvent("case_study_view", params),
  caseStudyEnquiryClick: (params) => trackEvent("case_study_enquiry_click", params),
  // Blog → solution / consultation journeys.
  blogSolutionClick: (params) => trackEvent("blog_solution_click", params),
  // Smart Deal enquiries stay separate from advisory enquiries so promotions
  // never inflate the advisory numbers.
  dealEnquiryClick: (params) => trackEvent("deal_enquiry_click", params),
};
