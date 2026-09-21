import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Accessible desktop dropdown for the header (blueprint section 4: "Accessible
 * keyboard-operated menus").
 *
 * Keyboard: Enter / Space / ArrowDown open the menu and move focus to the first
 * item; ArrowUp opens it on the last item; ArrowUp/ArrowDown and Home/End move
 * between items; Escape closes it and returns focus to the trigger; Tab out of
 * the last item closes it and lets focus continue naturally.
 *
 * Pointer: hovering opens it, and closing is delayed briefly so a diagonal path
 * from the trigger to the panel (across the small gap between them) does not
 * dismiss it.
 *
 * `children` receives `{ close }` so each link can dismiss the panel on click.
 * Every focusable element inside the panel is treated as a menu item, so the
 * panel's own markup decides the arrow-key order.
 */
export const NavMenu = ({
  label,
  panelClassName = "w-[560px]",
  triggerClassName = "",
  testId,
  children
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimer = useRef(null);
  const panelId = useId();

  const items = () =>
    panelRef.current
      ? Array.from(
          panelRef.current.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
      : [];

  const openMenu = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeMenu = ({ restoreFocus = false } = {}) => {
    clearTimeout(closeTimer.current);
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Focus a menu item once the panel has rendered.
  const focusItem = (index) => {
    requestAnimationFrame(() => {
      const list = items();
      if (!list.length) return;
      const target = index < 0 ? list[list.length - 1] : list[index % list.length];
      target?.focus();
    });
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Click outside dismisses the panel.
  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocPointerDown);
    return () => document.removeEventListener("mousedown", onDocPointerDown);
  }, [open]);

  const onTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
      focusItem(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu();
      focusItem(-1);
    } else if (event.key === "Escape") {
      closeMenu();
    }
  };

  const onPanelKeyDown = (event) => {
    const list = items();
    const current = list.indexOf(document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      list[(current + 1) % list.length]?.focus();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      list[(current - 1 + list.length) % list.length]?.focus();
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      list[0]?.focus();
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      list[list.length - 1]?.focus();
      return;
    }
    // Tab past either end closes the panel so focus continues down the page
    // instead of being trapped in a menu the visitor has left.
    if (event.key === "Tab") {
      const leaving = event.shiftKey ? current <= 0 : current >= list.length - 1;
      if (leaving) setOpen(false);
    }
  };

  return (
    <div
      className="relative"
      ref={containerRef}
      onMouseEnter={openMenu}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        ref={triggerRef}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        className={`inline-flex items-center gap-1 ${triggerClassName}`}
        data-testid={testId && `${testId}-trigger`}
      >
        {label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-200 ease-out-strong ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          role="menu"
          aria-label={label}
          onKeyDown={onPanelKeyDown}
          className={`enter-pop absolute left-1/2 -translate-x-1/2 top-full mt-2 ${panelClassName} bg-white rounded-2xl shadow-2xl shadow-gray-900/15 border border-gray-100 overflow-hidden z-50`}
          data-testid={testId && `${testId}-panel`}
        >
          {typeof children === "function" ? children({ close: closeMenu }) : children}
        </div>
      )}
    </div>
  );
};
