export type NavSectionId =
  | "review"
  | "verb-review"
  | "words"
  | "verbs"
  | "pikkusanat"
  | "import";

export const NAV_ITEMS: { id: NavSectionId; label: string }[] = [
  { id: "review", label: "Review" },
  { id: "verb-review", label: "Verb review" },
  { id: "words", label: "Words" },
  { id: "verbs", label: "Verbs" },
  { id: "pikkusanat", label: "Pikkusanat" },
  { id: "import", label: "Import" }
];

type NavGridProps = {
  activeId: NavSectionId;
  onSelect: (id: NavSectionId) => void;
};

export function NavGrid({ activeId, onSelect }: NavGridProps) {
  return (
    <nav className="nav-grid" aria-label="Main navigation">
      {NAV_ITEMS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`nav-grid__btn ${activeId === id ? "active" : ""}`}
          onClick={() => onSelect(id)}
          aria-current={activeId === id ? "true" : undefined}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
