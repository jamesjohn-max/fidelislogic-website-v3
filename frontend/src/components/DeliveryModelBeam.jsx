import { forwardRef, useRef } from "react";
import { Building2, Truck } from "lucide-react";
import { AnimatedBeam } from "./magicui/animated-beam";
import { cn } from "../lib/utils";

const Node = forwardRef(({ className, children, label }, ref) => (
  <div className="flex flex-col items-center gap-2.5 z-10">
    <div
      ref={ref}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
    <span className="text-xs sm:text-sm font-medium text-gray-700 text-center leading-tight max-w-[7rem]">
      {label}
    </span>
  </div>
));
Node.displayName = "DeliveryModelNode";

// Brand blue into cyan, on a quiet slate track — not Magic UI's default
// orange/purple.
const beam = {
  pathColor: "#94A3B8",
  pathOpacity: 0.35,
  gradientStartColor: "#2563EB",
  gradientStopColor: "#22D3EE",
};

/**
 * The working model as a picture: requirements go from the organisation to
 * Fidelis Logic, a documented specification goes on to the organisation's own
 * reseller, and supply and installation come straight back from the reseller.
 * That last beam is the point — Fidelis Logic is not in the supply chain.
 */
export const DeliveryModelBeam = ({ className }) => {
  const containerRef = useRef(null);
  const orgRef = useRef(null);
  const flRef = useRef(null);
  const resellerRef = useRef(null);

  return (
    <figure className={cn("mx-auto w-full max-w-2xl", className)}>
      <div
        ref={containerRef}
        role="img"
        aria-label="Your organisation sends requirements to Fidelis Logic, which passes a documented specification to your reseller or system integrator. Supply and installation come directly from your reseller."
        className="relative flex items-start justify-between px-2 pt-2 pb-16"
      >
        <Node ref={orgRef} label="Your organisation">
          <Building2 className="h-6 w-6 text-slate-700" aria-hidden="true" />
        </Node>
        <Node ref={flRef} label="Fidelis Logic" className="border-blue-200 ring-4 ring-blue-50">
          <img src="/favicon-192x192.png" alt="" className="h-7 w-7" />
        </Node>
        <Node ref={resellerRef} label="Your reseller or integrator">
          <Truck className="h-6 w-6 text-slate-700" aria-hidden="true" />
        </Node>

        <AnimatedBeam containerRef={containerRef} fromRef={orgRef} toRef={flRef} duration={4} {...beam} />
        <AnimatedBeam containerRef={containerRef} fromRef={flRef} toRef={resellerRef} duration={4} delay={1} {...beam} />
        {/* Supply goes straight back to the customer, under the other two. */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={resellerRef}
          toRef={orgRef}
          curvature={-70}
          reverse
          duration={5}
          delay={2}
          {...beam}
        />
      </div>
      {/* One sequential caption: the flows run *between* the nodes, so a
          caption per column would sit under the wrong thing. */}
      <figcaption className="-mt-8 text-center text-xs sm:text-sm text-gray-500 leading-relaxed">
        Requirements <span aria-hidden="true">→</span> documented specification{" "}
        <span aria-hidden="true">→</span> supply and installation, direct from your reseller
      </figcaption>
    </figure>
  );
};
