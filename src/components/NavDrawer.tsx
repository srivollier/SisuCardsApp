import { useEffect, useRef } from "react";
import { NAV_ITEMS, type NavSectionId } from "./NavGrid";

type NavDrawerProps = {
  open: boolean;
  activeId: NavSectionId;
  onSelect: (id: NavSectionId) => void;
  onClose: () => void;
};

export function NavDrawer({ open, activeId, onSelect, onClose }: NavDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleItemClick(id: NavSectionId) {
    onSelect(id);
    onClose();
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      className="nav-drawer-overlay"
      onClick={handleOverlayClick}
      aria-hidden="true"
    >
      <nav
        id="nav-drawer"
        className="nav-drawer-panel"
        aria-label="Main navigation"
        role="dialog"
        aria-modal="true"
      >
        <div className="nav-drawer-panel__list">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`nav-grid__btn ${activeId === id ? "active" : ""}`}
              onClick={() => handleItemClick(id)}
              aria-current={activeId === id ? "true" : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
