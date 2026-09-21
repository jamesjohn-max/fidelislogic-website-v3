import { Link } from "react-router-dom";
import { Linkedin, Youtube, Instagram, Mail, Phone, MapPin, ArrowRight, Globe2 } from "lucide-react";
import { contactInfo } from "../data/siteContent";
import { serviceCoverage } from "../data/services";
import { footerColumns } from "../data/navigation";
import { analytics } from "../lib/analytics";

/**
 * Site footer. Links are grouped under Solutions, Services, Who We Help,
 * Resources and Company (blueprint section 4), driven by the same navigation
 * data as the header so the two can never drift apart. Contact details,
 * geographic coverage, privacy information and a compact consultation action
 * sit below the columns.
 */
export const Footer = () => {
  const telHref = `tel:${contactInfo.phone.replace(/\s+/g, "")}`;

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Brand + compact consultation action */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 pb-12 mb-12 border-b border-gray-800">
          <div className="lg:col-span-5">
            <div className="flex items-center">
              <picture className="contents">
                <source type="image/webp" srcSet="/Logo_White_Large.webp" />
                <img
                  src="/Logo_White_Large.png"
                  alt="Fidelis Logic"
                  width="154"
                  height="28"
                  className="h-7 w-auto"
                />
              </picture>
            </div>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-md">
              Independent modern workplace technology advice for organisations and
              delivery partners across the UAE and GCC. We help you choose, plan and
              document the right solution — and work through the reseller or system
              integrator you already trust.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="https://www.linkedin.com/company/fidelis-logic/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fidelis Logic on LinkedIn"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Linkedin size={20} aria-hidden="true" />
              </a>
              <a
                href="https://www.youtube.com/@fidelislogic"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fidelis Logic on YouTube"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Youtube size={20} aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/fidelislogic/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fidelis Logic on Instagram"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Instagram size={20} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-white font-semibold mb-4">Contact</h2>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${contactInfo.email}`}
                  onClick={() => analytics.emailClick({ location: "footer" })}
                  className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
                  data-testid="footer-email"
                >
                  <Mail size={16} className="text-blue-400 shrink-0" aria-hidden="true" />
                  {contactInfo.email}
                </a>
              </li>
              <li>
                <a
                  href={telHref}
                  onClick={() => analytics.phoneClick({ location: "footer" })}
                  className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
                  data-testid="footer-phone"
                >
                  <Phone size={16} className="text-blue-400 shrink-0" aria-hidden="true" />
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin size={16} className="text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{contactInfo.location}</span>
              </li>
              {/* Geographic coverage, stated plainly */}
              <li className="flex items-start gap-2 text-sm">
                <Globe2 size={16} className="text-blue-400 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Serving {serviceCoverage.label}</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-white font-semibold mb-4">Talk to us</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              A short first conversation is usually enough to tell you what your
              next step should be.
            </p>
            <Link
              to="/contact"
              onClick={() => analytics.consultationCtaClick({ location: "footer" })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
              data-testid="footer-consultation-cta"
            >
              Book a Consultation
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Link columns — the same groupings as the primary navigation */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 mb-12"
        >
          {footerColumns.map((column) => (
            <div key={column.heading}>
              <h2 className="text-white font-semibold mb-4">
                {column.href ? (
                  <Link to={column.href} className="hover:text-blue-400 transition-colors">
                    {column.heading}
                  </Link>
                ) : (
                  column.heading
                )}
              </h2>
              <ul className="space-y-3">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="text-sm hover:text-blue-400 transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Privacy information. The Room Planner sentence is the statement
                the tool itself already makes — see DetailsForm.jsx. Do not
                broaden either claim without checking it first. */}
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              We use the details you send us only to answer your enquiry. In the Room
              Planner, nothing you enter is sent anywhere — your draft stays in your
              browser and the PDF is built there too.
            </p>
            <p className="text-sm text-gray-400 shrink-0">
              © 2026 Fidelis Logic LLC. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
