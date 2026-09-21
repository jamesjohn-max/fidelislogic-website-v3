import { useState } from "react";

// Floating promos closed with their × stay closed while someone moves around the site,
// and come back on their next visit. Held in memory for the life of the page, not in
// sessionStorage: browsers restore sessionStorage along with tabs (reopening a closed
// tab, or "continue where you left off" after a restart), so a promo closed once could
// stay hidden for good.
const dismissed = new Set();

export function useDismissedThisVisit(id) {
  const [isDismissed, setIsDismissed] = useState(() => dismissed.has(id));
  const dismiss = () => {
    dismissed.add(id);
    setIsDismissed(true);
  };
  return [isDismissed, dismiss];
}
