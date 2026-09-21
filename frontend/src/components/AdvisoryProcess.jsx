import { advisoryStages } from "../data/audiences";
import { BlurFade } from "./magicui/blur-fade";
import { DeliveryModelBeam } from "./DeliveryModelBeam";

/**
 * The four-stage advisory model (blueprint Home section 5).
 *
 * It explains what makes the engagement different from buying from a catalogue
 * without characterising resellers or manufacturers negatively — stage 4 is the
 * partner's stage, and it is presented as part of the model rather than as a
 * fallback. Reused on /for-organisations so the process reads identically.
 *
 * Props:
 *  - background: "white" | "gray" | "dark"
 *  - heading / subheading / footnote: copy overrides
 *  - showModel: draw the delivery-model diagram above the footnote
 */
export const AdvisoryProcess = ({
  background = "white",
  label = "How it works",
  heading = "How the advisory model works",
  subheading = "Four stages, in order. The recommendation is written down before anyone is asked to quote.",
  footnote = "Your reseller or system integrator supplies and installs. We are not in the supply chain, so the recommendation stays about fit.",
  testIdPrefix = "advisory-process",
  showModel = false
}) => {
  const isDark = background === "dark";
  const bgClass =
    background === "gray" ? "bg-gray-50" : isDark ? "bg-brand-dark" : "bg-white";

  return (
    <section
      className={`py-16 lg:py-20 px-4 sm:px-6 lg:px-8 ${bgClass}`}
      data-testid={`${testIdPrefix}-section`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-12">
          {label && (
            <p className={`section-label mb-3 ${isDark ? "!text-fidelis-cyan" : ""}`}>
              {label}
            </p>
          )}
          <h2
            className={`text-3xl sm:text-4xl font-bold tracking-tight leading-tight ${
              isDark ? "text-white" : "text-brand-dark"
            }`}
            data-testid={`${testIdPrefix}-title`}
          >
            {heading}
          </h2>
          {subheading && (
            <p
              className={`mt-4 text-lg leading-relaxed ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {subheading}
            </p>
          )}
        </div>

        {/* Ordered list: the sequence is the point, so it is a real <ol>. */}
        <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advisoryStages.map((stage, index) => (
            // <li> keeps the ordered-list semantics; BlurFade inside it is the
            // card, so the whole card fades and <ol> > <li> stays valid.
            <li key={stage.step} className="h-full">
            <BlurFade
              inView
              delay={index * 0.08}
              className={`relative h-full rounded-2xl border p-6 lg:p-7 ${
                isDark
                  ? "border-white/15 bg-white/[0.04]"
                  : "border-gray-200 bg-white"
              }`}
              data-testid={`${testIdPrefix}-stage-${stage.step}`}
            >
              <span
                className={`inline-flex items-center justify-center w-11 h-11 rounded-lg text-sm font-bold mb-5 ${
                  isDark ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                }`}
                aria-hidden="true"
              >
                {stage.step}
              </span>
              <h3
                className={`text-lg font-semibold leading-snug ${
                  isDark ? "text-white" : "text-brand-dark"
                }`}
              >
                {stage.title}
              </h3>
              <p
                className={`mt-2.5 leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {stage.description}
              </p>
            </BlurFade>
            </li>
          ))}
        </ol>

        {showModel && (
          <BlurFade inView delay={0.1} className="mt-14">
            <DeliveryModelBeam />
          </BlurFade>
        )}

        {footnote && (
          <p
            className={`mt-8 max-w-3xl leading-relaxed ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
            data-testid={`${testIdPrefix}-footnote`}
          >
            {footnote}
          </p>
        )}
      </div>
    </section>
  );
};
