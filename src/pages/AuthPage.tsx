import { FormEvent, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { FormFieldInput } from "../components/FormField";
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
    <Card
      title="SisuCards"
      description="Finnish learning datasets with Supabase"
      className="auth-card"
    >
      <div className="inline-actions" style={{ marginBottom: "var(--space-4)" }}>
        <Button
          variant={mode === "login" ? "primary" : "secondary"}
          type="button"
          onClick={() => setMode("login")}
        >
          Log in
        </Button>
        <Button
          variant={mode === "signup" ? "primary" : "secondary"}
          type="button"
          onClick={() => setMode("signup")}
        >
          Sign up
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <FormFieldInput
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <FormFieldInput
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />

        {error ? <p className="error">{error}</p> : null}
        {info ? <p className="success">{info}</p> : null}

        <Button type="submit" variant="primary" disabled={isSubmitting} style={{ marginTop: "var(--space-3)" }}>
          {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </Button>
      </form>
    </Card>
  );
}
