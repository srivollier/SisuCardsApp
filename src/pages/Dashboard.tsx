import { useState } from "react";
import { DatasetTable } from "../components/DatasetTable";
import { NavDrawer } from "../components/NavDrawer";
import { NavGrid, type NavSectionId } from "../components/NavGrid";
import { TopBar } from "../components/TopBar";
import { DATASET_CONFIGS } from "../types/datasets";
import { ImportPage } from "./ImportPage";
import { ReviewPage } from "./ReviewPage";
import { VerbReviewPage } from "./VerbReviewPage";

type DashboardProps = {
  email: string | null;
  onSignOut: () => Promise<void>;
};

export function Dashboard({ email, onSignOut }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<NavSectionId>("review");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleSectionSelect(id: NavSectionId) {
    setActiveSection(id);
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <TopBar
        email={email}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
        menuOpen={mobileMenuOpen}
        onMenuToggle={() => setMobileMenuOpen((open) => !open)}
      />
      <NavGrid activeId={activeSection} onSelect={setActiveSection} />
      <NavDrawer
        open={mobileMenuOpen}
        activeId={activeSection}
        onSelect={handleSectionSelect}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main>
        {activeSection === "review" ? <ReviewPage /> : null}
        {activeSection === "verb-review" ? <VerbReviewPage /> : null}
        {activeSection === "words" ? <DatasetTable config={DATASET_CONFIGS.words} /> : null}
        {activeSection === "verbs" ? <DatasetTable config={DATASET_CONFIGS.verbs} /> : null}
        {activeSection === "pikkusanat" ? (
          <DatasetTable config={DATASET_CONFIGS.pikkusanat} />
        ) : null}
        {activeSection === "import" ? <ImportPage /> : null}
      </main>
    </div>
  );
}
