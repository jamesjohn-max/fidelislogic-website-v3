import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Tag, X } from "lucide-react";
import { analytics } from "../lib/analytics";
import { useDismissedThisVisit } from "../hooks/use-dismissed-this-visit";

import { api } from "../lib/api";
// Floating CTA that surfaces Smart Deals on every public page.
// Hidden on /admin routes and on /deals itself. Dismissible until the next visit.
export const FloatingDealsButton = () => {
  const location = useLocation();
  const [dismissed, dismiss] = useDismissedThisVisit("deals");
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get(`/deals/active`);
        setActiveCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch {
        setActiveCount(0);
      }
    };
    fetchCount();
  }, []);

  const path = location.pathname;
  const isHidden =
    dismissed ||
    path.startsWith("/admin") ||
    path.startsWith("/deals") ||
    // Tools are focused, step-by-step tasks — and the button would sit over their Next button.
    path.startsWith("/tools/");

  if (isHidden) return null;

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dismiss();
  };

  return (
    <Link
      to="/deals"
      onClick={() => analytics.floatingDealsClick({ active_count: activeCount, source_path: path })}
      aria-label={`Smart Deals — ${activeCount} active`}
      data-testid="floating-deals-button"
      className="group"
    >
      <div className="relative flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full pl-4 pr-5 py-3 shadow-lg hover:shadow-xl transition-[transform,background-color,box-shadow] duration-150 ease-out group-active:scale-[0.97]">
        <Tag className="w-5 h-5" />
        <span className="font-semibold text-sm">Smart Deals</span>
        {activeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 bg-white text-blue-700 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-blue-600"
            data-testid="floating-deals-count"
          >
            {activeCount}
          </span>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="flex absolute -top-2 -left-2 w-6 h-6 items-center justify-center rounded-full bg-white text-gray-500 hover:text-gray-800 shadow border border-gray-200 opacity-80 hover:opacity-100 transition-opacity after:absolute after:-inset-2 after:content-['']"
          data-testid="floating-deals-dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </Link>
  );
};
