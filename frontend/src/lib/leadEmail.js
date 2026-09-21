/**
 * Emails a lead to info@fidelislogic.com through Web3Forms, from the browser.
 *
 * It has to be sent client-side: Web3Forms' free plan rejects server-side
 * submissions ("Server side usage requires paid plan + server IP whitelisting"),
 * so the backend's own attempt in email_service.py never reaches the inbox. The
 * access key is a public, client-side key by design.
 *
 * Every lead form uses this so their emails share one format: the same subject
 * line and the same fields, in the same order, as the free-consultation form.
 */
const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = "99d6039b-83fa-461a-9eac-331206d2f378";

// Field order as it appears in the email (matches the Contact page's form).
// `audience` leads so the inbox can tell a customer enquiry from a reseller's at
// a glance; forms that don't collect it simply send an empty value.
const FIELDS = ["audience", "topic", "name", "company", "email", "phone", "preferred_date", "message"];

export async function sendLeadEmail(lead) {
  const data = new FormData();
  FIELDS.forEach((field) => data.append(field, lead[field] ?? ""));
  data.append("access_key", WEB3FORMS_ACCESS_KEY);
  const audienceLabel = lead.audience === "partner" ? "Partner" : "Customer";
  data.append("subject", `New ${audienceLabel} Enquiry from ${lead.name}`);
  const response = await fetch(WEB3FORMS_URL, { method: "POST", body: data });
  if (!response.ok) throw new Error(`Web3Forms responded ${response.status}`);
}
