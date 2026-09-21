import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { consultationCta, contactInfo } from "../data/siteContent";
import { analytics } from "../lib/analytics";

/**
 * Closing call-to-action band used at the foot of every marketing page.
 *
 * Blueprint section 4 asks every page for ONE primary action matched to its
 * intent rather than the same generic button everywhere, so `ctaLabel` and
 * `ctaHref` are per-page (e.g. "Discuss your requirements" on a solution page,
 * "Discuss white-label support" on the partner page). The defaults keep the
 * original behaviour — the generic consultation button to /contact — for pages
 * that have not been given a specific action yet.
 *
 * Props:
 *  - title, children: headline and one supporting sentence
 *  - location: analytics location for the consultation click (e.g. "home_footer")
 *  - ctaLabel / ctaHref: the page's primary action
 *  - secondary: { label, href } rendered as an outline button beside it
 *  - showCall: add a tel: link (used where Book / Call / Enquire are all offered)
 *  - onClick: override the analytics call
 *  - testId: data-testid for the primary button
 */
export const CtaBand = ({
  title,
  children,
  location,
  ctaLabel = consultationCta,
  ctaHref = "/contact",
  secondary,
  showCall = false,
  onClick,
  testId
}) => (
  <section
    className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-brand-dark text-white"
    data-testid="cta-band-section"
  >
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight tracking-tight">{title}</h2>
      {children && <p className="text-gray-300 text-lg mb-8">{children}</p>}
      <div className="flex flex-col sm:flex-row gap-3 justify-center [&>*]:w-full sm:[&>*]:w-auto [&_button]:w-full sm:[&_button]:w-auto">
        <Link
          to={ctaHref}
          onClick={onClick || (() => analytics.consultationCtaClick({ location }))}
        >
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white" data-testid={testId}>
            {ctaLabel}
            <ArrowRight className="ml-2" size={18} />
          </Button>
        </Link>

        {secondary && (
          <Link to={secondary.href}>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              data-testid={secondary.testId}
            >
              {secondary.label}
            </Button>
          </Link>
        )}

        {showCall && (
          <a
            href={`tel:${contactInfo.phone.replace(/\s+/g, "")}`}
            onClick={() => analytics.phoneClick({ location })}
          >
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              data-testid="cta-band-call"
            >
              <Phone className="mr-2" size={18} aria-hidden="true" />
              {contactInfo.phone}
            </Button>
          </a>
        )}
      </div>
    </div>
  </section>
);
