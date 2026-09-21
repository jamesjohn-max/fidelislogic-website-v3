import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { SEO } from "../components/SEO";
import { PageHeader } from "../components/PageHeader";
import { StructuredData, organizationSchema } from "../components/StructuredData";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { TrustBand } from "../components/TrustBand";
import { seoConfig } from "../data/seoConfig";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Linkedin,
  Youtube,
  Instagram,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
  Handshake,
} from "lucide-react";
import { contactInfo, topicsByAudience } from "../data/siteContent";
import { audiences } from "../data/audiences";
import { analytics } from "../lib/analytics";
import { api } from "../lib/api";
import { sendLeadEmail } from "../lib/leadEmail";
import { siteImages } from "../data/siteImages";

const audienceIcons = { Building2, Handshake };

const emptyForm = {
  audience: "organisation",
  name: "",
  company: "",
  email: "",
  phone: "",
  topic: "",
  preferred_date: "",
  message: "",
};

/**
 * /contact — the consultation form (blueprint section 10).
 *
 * The form asks which audience the visitor belongs to first, and the topic list
 * changes to match: an organisation is offered customer topics, a reseller or
 * system integrator is offered white-label ones. A `?audience=partner` query
 * (used by every link from /for-partners) preselects the partner journey.
 *
 * Success, error and privacy states are explicit: a submission failure keeps
 * what was typed and shows the direct email and phone alternatives rather than
 * only a toast.
 */
export const Contact = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error" | null
  // Fired once, the first time someone actually starts filling the form.
  const startedRef = useRef(false);

  // Preselect the audience from the query string, e.g. /contact?audience=partner
  useEffect(() => {
    const requested = searchParams.get("audience");
    if (requested && audiences.some((a) => a.id === requested)) {
      setFormData((prev) => ({ ...prev, audience: requested, topic: "" }));
    }
  }, [searchParams]);

  const isPartner = formData.audience === "partner";
  const topics = topicsByAudience[formData.audience] || topicsByAudience.organisation;

  const noteStart = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    analytics.consultationFormStart({ audience: formData.audience });
    if (isPartner) analytics.partnerEnquiryStart({ location: "contact_form" });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    noteStart();
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAudienceChange = (audience) => {
    noteStart();
    // The topic list changes with the audience, so a topic chosen from the other
    // audience's list must not survive the switch.
    setFormData((prev) => ({ ...prev, audience, topic: "" }));
  };

  const handleTopicChange = (value) => {
    noteStart();
    setFormData((prev) => ({ ...prev, topic: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      // Save to the database first — this is the primary action.
      await api.post(`/contact`, {
        audience: formData.audience,
        name: formData.name,
        company: formData.company || null,
        email: formData.email,
        phone: formData.phone || null,
        topic: formData.topic,
        preferred_date: formData.preferred_date || null,
        message: formData.message,
      });

      // Email notification via Web3Forms. It may fail in the preview
      // environment (CORS); the enquiry is already stored either way.
      try {
        await sendLeadEmail(formData);
      } catch {
        console.log("Email notification skipped (preview environment)");
      }

      setStatus("success");
      toast.success("Thank you for your enquiry. We'll be in touch within one business day.");
      analytics.contactFormSubmit({
        topic: formData.topic || "general",
        audience: formData.audience,
      });
      if (isPartner) analytics.partnerEnquirySubmit({ topic: formData.topic || "general" });

      const audience = formData.audience;
      setFormData({ ...emptyForm, audience });
      startedRef.current = false;
    } catch (error) {
      console.error("Form submission error:", error);
      setStatus("error");
      toast.error("We couldn't send that. Please try again, or email us directly.");
      analytics.consultationFormError({ audience: formData.audience });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SEO
        title={seoConfig.contact.title}
        description={seoConfig.contact.description}
        keywords={seoConfig.contact.keywords}
      />
      <StructuredData data={organizationSchema} />
      <Breadcrumbs items={[{ name: "Contact" }]} className="pt-24" />
      <PageHeader title="Let's talk about what you're trying to decide" image={siteImages.headerContact}>
        <p>
          Book a consultation to discuss a requirement, a project, or white-label capacity
          for a customer of your own.
        </p>
        <p className="font-medium text-brand-dark">
          Expert advice, free, with no obligation to proceed.
        </p>
      </PageHeader>

      <section id="enquiry" className="scroll-mt-24 py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Enquiry form */}
            <div>
              <Card className="border-0 shadow-2xl">
                <CardContent className="p-6 sm:p-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-6 tracking-tight">
                    {isPartner ? "Discuss white-label support" : "Book a consultation"}
                  </h2>

                  {/* Success state — replaces nothing, sits above the form so a
                      second enquiry is still possible. */}
                  {status === "success" && (
                    <div
                      className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4"
                      role="status"
                      data-testid="contact-success"
                    >
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-green-600" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-green-900">Enquiry received</p>
                        <p className="mt-1 text-sm text-green-800 leading-relaxed">
                          We'll reply within one business day. If it's urgent, call{" "}
                          <a href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`} className="underline font-medium">
                            {contactInfo.phone}
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error state — keeps what was typed and offers the direct routes. */}
                  {status === "error" && (
                    <div
                      className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                      role="alert"
                      data-testid="contact-error"
                    >
                      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-red-900">That didn't go through</p>
                        <p className="mt-1 text-sm text-red-800 leading-relaxed">
                          Your details are still here — try again, or email{" "}
                          <a href={`mailto:${contactInfo.email}`} className="underline font-medium">
                            {contactInfo.email}
                          </a>{" "}
                          or call{" "}
                          <a href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`} className="underline font-medium">
                            {contactInfo.phone}
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Audience — asked first, because it changes the topic list. */}
                    <fieldset>
                      <legend className="text-sm font-medium text-brand-dark mb-3">
                        Which describes you? *
                      </legend>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {audiences.map((audience) => {
                          const Icon = audienceIcons[audience.icon] || Building2;
                          const selected = formData.audience === audience.id;
                          return (
                            <label
                              key={audience.id}
                              className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                                selected
                                  ? "border-blue-600 bg-blue-50"
                                  : "border-gray-200 hover:border-blue-300"
                              }`}
                              data-testid={`contact-audience-${audience.id}`}
                            >
                              <input
                                type="radio"
                                name="audience"
                                value={audience.id}
                                checked={selected}
                                onChange={() => handleAudienceChange(audience.id)}
                                className="sr-only"
                              />
                              <Icon
                                size={20}
                                aria-hidden="true"
                                className={`mt-0.5 shrink-0 ${selected ? "text-blue-600" : "text-gray-400"}`}
                              />
                              <span>
                                <span className={`block text-sm font-semibold ${selected ? "text-blue-900" : "text-brand-dark"}`}>
                                  {audience.id === "partner" ? "Reseller / System Integrator" : "Organisation"}
                                </span>
                                <span className="block mt-0.5 text-xs text-gray-600 leading-relaxed">
                                  {audience.id === "partner"
                                    ? "I need capacity behind my own brand"
                                    : "I'm planning technology for my own workplace"}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    <div>
                      <Label htmlFor="topic">
                        {isPartner ? "What do you need from us? *" : "Topic of interest *"}
                      </Label>
                      <Select value={formData.topic} onValueChange={handleTopicChange} required>
                        <SelectTrigger className="mt-2" data-testid="contact-topic-trigger">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="name">Full name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                        placeholder="John Smith"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company">
                        {isPartner ? "Your company *" : "Company"}
                      </Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        required={isPartner}
                        className="mt-2"
                        placeholder={isPartner ? "Your reseller or SI business" : "Your company name"}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                        placeholder="john@company.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="mt-2"
                        placeholder="+971 X XXXX XXXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="preferred_date">Preferred date/time</Label>
                      <Input
                        id="preferred_date"
                        name="preferred_date"
                        value={formData.preferred_date}
                        onChange={handleInputChange}
                        className="mt-2"
                        placeholder="e.g. next week, afternoon"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">
                        {isPartner ? "What's the engagement?" : "Message"}
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        className="mt-2"
                        rows={4}
                        placeholder={
                          isPartner
                            ? "Scope, timeline, and who needs to see the output."
                            : "Tell us about your requirement..."
                        }
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                      disabled={isSubmitting}
                      data-testid="contact-submit"
                    >
                      {isSubmitting
                        ? "Sending..."
                        : isPartner
                        ? "Send partner enquiry"
                        : "Request a consultation"}
                    </Button>

                    {/* Privacy state */}
                    <p className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                      <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                      We use these details only to answer your enquiry.
                      {isPartner
                        ? " Partner enquiries, and any customer detail in them, are treated as confidential and never used as a reference without your written agreement."
                        : " We don't sell or share them, and we won't add you to a mailing list."}
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Direct alternatives and context */}
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-6 tracking-tight">
                  Or reach us directly
                </h2>
                <div className="space-y-5">
                  <a
                    href={`mailto:${contactInfo.email}`}
                    onClick={() => analytics.emailClick({ location: "contact_page" })}
                    className="group flex items-start gap-4"
                    data-testid="contact-email-link"
                  >
                    <span className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors">
                      <Mail className="text-blue-600 group-hover:text-white transition-colors" size={22} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold text-brand-dark">Email</span>
                      <span className="block text-gray-600 group-hover:text-blue-600 transition-colors">
                        {contactInfo.email}
                      </span>
                    </span>
                  </a>

                  <a
                    href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`}
                    onClick={() => analytics.phoneClick({ location: "contact_page" })}
                    className="group flex items-start gap-4"
                    data-testid="contact-phone-link"
                  >
                    <span className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors">
                      <Phone className="text-blue-600 group-hover:text-white transition-colors" size={22} aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold text-brand-dark">Phone</span>
                      <span className="block text-gray-600 group-hover:text-blue-600 transition-colors">
                        {contactInfo.phone}
                      </span>
                    </span>
                  </a>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-4 tracking-tight">
                  {isPartner ? "What happens next" : "Why is it free?"}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {isPartner
                    ? "We come back with a written scope before any work starts, so it is clear what we produce, what you produce, and who speaks to the customer."
                    : "We believe in earning your trust first. A first consultation includes:"}
                </p>
                <ul className="mt-4 space-y-3 text-gray-700">
                  {(isPartner
                    ? [
                        "A short call to understand the engagement",
                        "A written scope and deliverable list",
                        "Confirmation of how we are introduced to your customer",
                        "Confidentiality agreed before anything is shared"
                      ]
                    : [
                        "An expert read on what you actually need",
                        "Tailored recommendations with the reasoning",
                        "A transparent view of what it tends to cost",
                        "No pressure, and no obligation"
                      ]
                  ).map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-brand-dark mb-4">Follow us</h2>
                <div className="flex space-x-4">
                  <a
                    href="https://www.linkedin.com/company/fidelis-logic/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Fidelis Logic on LinkedIn"
                    className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Linkedin size={22} aria-hidden="true" />
                  </a>
                  <a
                    href="https://www.youtube.com/@fidelislogic"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Fidelis Logic on YouTube"
                    className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Youtube size={22} aria-hidden="true" />
                  </a>
                  <a
                    href="https://www.instagram.com/fidelislogic/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Fidelis Logic on Instagram"
                    className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Instagram size={22} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustBand
        variant="strip"
        background="gray"
        showLinks={false}
        testIdPrefix="contact-trust"
      />
    </div>
  );
};
