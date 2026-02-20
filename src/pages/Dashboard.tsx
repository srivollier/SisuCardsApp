import { useState } from "react";
import { DatasetTable } from "../components/DatasetTable";
import { DATASET_CONFIGS } from "../types/datasets";
import { ImportPage } from "./ImportPage";
import { ReviewPage } from "./ReviewPage";

type DashboardProps = {
  email: string | null;
  onSignOut: () => Promise<void>;
};

export function Dashboard({ email, onSignOut }: DashboardProps) {
  const [activeSection, setActiveSection] = useState<"review" | "words" | "verbs" | "pikkusanat" | "import">(
    "review"
  );
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>SisuCards</h1>
          <p className="muted">{email ?? "Authenticated user"}</p>
        </div>
        <button onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </header>

      <nav className="top-menu">
        <button
          type="button"
          className={activeSection === "review" ? "active" : ""}
          onClick={() => setActiveSection("review")}
        >
          Review
        </button>
        <button
          type="button"
          className={activeSection === "words" ? "active" : ""}
          onClick={() => setActiveSection("words")}
        >
          Words
        </button>
        <button
          type="button"
          className={activeSection === "verbs" ? "active" : ""}
          onClick={() => setActiveSection("verbs")}
        >
          Verbs
        </button>
        <button
          type="button"
          className={activeSection === "pikkusanat" ? "active" : ""}
          onClick={() => setActiveSection("pikkusanat")}
        >
          Pikkusanat
        </button>
        <button
          type="button"
          className={activeSection === "import" ? "active" : ""}
          onClick={() => setActiveSection("import")}
        >
          Import
        </button>
      </nav>

      <main>
        {activeSection === "review" ? <ReviewPage /> : null}
        {activeSection === "words" ? <DatasetTable config={DATASET_CONFIGS.words} /> : null}
        {activeSection === "verbs" ? <DatasetTable config={DATASET_CONFIGS.verbs} /> : null}
        {activeSection === "pikkusanat" ? <DatasetTable config={DATASET_CONFIGS.pikkusanat} /> : null}
        {activeSection === "import" ? <ImportPage /> : null}
      </main>
    </div>
  );
}
