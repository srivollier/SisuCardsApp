import { FormEvent, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type AuthMode = "login" | "signup";

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    const sanitizedEmail = email.trim();
    const sanitizedPassword = password.trim();

    try {
      if (!sanitizedEmail || !sanitizedPassword) {
        throw new Error("Email and password are required.");
      }

      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password: sanitizedPassword
        });
        if (signInError) {
          throw signInError;
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password: sanitizedPassword
        });
        if (signUpError) {
          throw signUpError;
        }
        setInfo("Account created. You can now log in.");
        setMode("login");
      }
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Unexpected authentication error.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card auth-card">
      <h1>SisuCards</h1>
      <p className="muted">Finnish learning datasets with Supabase</p>

      <div className="inline-actions">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </label>

        {error ? <p className="error">{error}</p> : null}
        {info ? <p className="success">{info}</p> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
