import { useMemo, useState } from "react";
import { DatasetTable } from "../components/DatasetTable";
import { ImportPage } from "./ImportPage";
import { ReviewPage } from "./ReviewPage";
import { DATASET_CONFIGS, DatasetName } from "../types/datasets";

type DashboardTab = DatasetName | "import" | "review";

type DashboardProps = {
  email: string | null;
  onSignOut: () => Promise<void>;
};

export function Dashboard({ email, onSignOut }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("words");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "words" as const, label: "Words" },
      { id: "verbs" as const, label: "Verbs" },
      { id: "pikkusanat" as const, label: "Pikkusanat" },
      { id: "review" as const, label: "Review" },
      { id: "import" as const, label: "Import" }
    ],
    []
  );

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

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main>
        {activeTab === "import" ? (
          <ImportPage />
        ) : activeTab === "review" ? (
          <ReviewPage />
        ) : (
          <DatasetTable config={DATASET_CONFIGS[activeTab]} />
        )}
      </main>
    </div>
  );
}
