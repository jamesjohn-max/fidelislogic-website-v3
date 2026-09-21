// Brings an element that just unfolded in a step (a section, a device's options) into
// view without moving anything else. On desktop only the step panel's body scrolls: the
// workspace is one screen, and element.scrollIntoView would scroll the page too, sliding
// the stepper under the site header. Below that the page itself scrolls, so the element
// is kept clear of the sticky stepper above and the sticky footer below.
const PANEL_FOOTER_PX = 96;
const PAGE_TOP_CHROME_PX = 160;
const PAGE_FOOTER_PX = 80;

// How far to scroll so [top, bottom] sits inside [min, max], favouring its top.
const distanceToFit = (top, bottom, min, max) => (top < min ? top - min : bottom > max ? Math.min(bottom - max, top - min) : 0);

export function revealInPanel(el) {
  if (!el) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const rect = el.getBoundingClientRect();
  const body = el.closest(".rc-scroll-body");
  if (body && getComputedStyle(body).overflowY !== "visible") {
    const box = body.getBoundingClientRect();
    const by = distanceToFit(rect.top, rect.bottom, box.top + 8, box.bottom - PANEL_FOOTER_PX);
    if (by) body.scrollBy({ top: by, behavior });
    return;
  }
  const by = distanceToFit(rect.top, rect.bottom, PAGE_TOP_CHROME_PX, window.innerHeight - PAGE_FOOTER_PX);
  if (by) window.scrollBy({ top: by, behavior });
}
