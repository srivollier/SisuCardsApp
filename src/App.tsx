import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseClient";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }
        if (error) {
          setAuthError(error.message);
        } else {
          setSession(data.session);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    } else {
      setSession(null);
    }
  }

  if (loading) {
    return (
      <div className="app-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-root">
      {authError ? <p className="error floating-error">{authError}</p> : null}
      {session ? (
        <Dashboard email={session.user.email ?? null} onSignOut={handleSignOut} />
      ) : (
        <div className="app-center">
          <AuthPage />
        </div>
      )}
    </div>
  );
}
