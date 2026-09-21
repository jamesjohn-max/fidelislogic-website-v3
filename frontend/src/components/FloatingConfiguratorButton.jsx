import { Link, useLocation } from "react-router-dom";
import { ArrowRight, LayoutGrid, Monitor, Ruler, Sparkles, Users, X } from "lucide-react";
import { analytics } from "../lib/analytics";
import { useDismissedThisVisit } from "../hooks/use-dismissed-this-visit";

// Blueprint grid laid over the blue gradient, like the Room Planner canvas.
const CARD_BACKGROUND = {
  backgroundImage: [
    "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
    "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)",
  ].join(", "),
  backgroundSize: "20px 20px, 20px 20px, 100% 100%",
};

const FEATURES = [
  { icon: Ruler, label: "Dimensions" },
  { icon: Users, label: "Seating" },
  { icon: Monitor, label: "Preview" },
];

// Floating CTA that surfaces Room Planner (the room configurator) on the homepage.
// A card on large screens, a pill on smaller ones where a card would cover the page
// (and the cookie banner). Stacks above the Smart Deals button. Dismissible until
// the next visit.
export const FloatingConfiguratorButton = () => {
  const location = useLocation();
  const [dismissed, dismiss] = useDismissedThisVisit("configurator");

  const path = location.pathname;
  if (dismissed || path !== "/") return null;

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dismiss();
  };

  const handleClick = () => analytics.floatingConfiguratorClick({ source_path: path });

  return (
    <>
      <Link
        to="/tools/room-configurator"
        onClick={handleClick}
        aria-label="Room Planner"
        data-testid="floating-configurator-button"
        className="group lg:hidden"
      >
        <div className="relative flex items-center gap-3 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-full pl-4 pr-5 py-3 shadow-lg hover:shadow-xl transition-[transform,background-color,box-shadow] duration-150 ease-out group-active:scale-[0.97]">
          <LayoutGrid className="w-5 h-5" />
          <span className="font-semibold text-sm">Room Planner</span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="flex absolute -top-2 -left-2 w-6 h-6 items-center justify-center rounded-full bg-white text-gray-500 hover:text-gray-800 shadow border border-gray-200 opacity-80 hover:opacity-100 transition-opacity after:absolute after:-inset-2 after:content-['']"
            data-testid="floating-configurator-dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </Link>

      <aside aria-label="Room Planner" className="enter-rise hidden lg:block w-[19rem]" data-testid="floating-configurator-card">
        <div
          style={CARD_BACKGROUND}
          className="group relative overflow-hidden rounded-2xl p-5 text-center text-white ring-1 ring-white/15 shadow-[0_24px_48px_-16px_rgba(30,64,175,0.6)] transition-[transform,box-shadow] duration-200 ease-out-strong hover:-translate-y-0.5 hover:shadow-[0_28px_56px_-16px_rgba(30,64,175,0.7)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            data-testid="floating-configurator-card-dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" aria-hidden="true" />
            Interactive tool · 100% free
          </span>

          <p className="mt-3 text-xl font-bold leading-tight tracking-tight">Design your meeting room</p>
          <p className="mt-1.5 text-balance text-[13px] leading-snug text-blue-100">
            Set the size, pick a layout and share the plan with our experts.
          </p>

          <ul className="mt-3.5 flex justify-center gap-4 text-xs font-medium text-blue-50">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>

          {/* The link's ::after stretches over the whole card, so anywhere on it opens Room Planner. */}
          <Link
            to="/tools/room-configurator"
            onClick={handleClick}
            data-testid="floating-configurator-card-link"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 shadow-lg transition-colors group-hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white after:absolute after:inset-0 after:content-['']"
          >
            Open Room Planner
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>

          <p className="mt-2.5 text-[11px] text-blue-200">No signup required · No commitment</p>
        </div>
      </aside>
    </>
  );
};
