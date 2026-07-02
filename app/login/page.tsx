"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmMessage(null);
    setLoading(true);

    const supabase = supabaseBrowser();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { business_name: businessName } },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          // Email confirmation is required before a session exists.
          setConfirmMessage("Check your email to confirm your account, then sign in.");
          setMode("signin");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-sm border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            PayFlow AI
          </p>
          <h1 className="font-display text-2xl italic mt-1">
            {mode === "signin" ? "Welcome back." : "Get started."}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="receipt rounded-b-md p-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
                Business name
              </label>
              <input
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inputClass}
                style={{ borderColor: "var(--color-line)" }}
                placeholder="Ada's Fabrics"
              />
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              style={{ borderColor: "var(--color-line)" }}
              placeholder="you@business.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
              Password
            </label>
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              style={{ borderColor: "var(--color-line)" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm font-mono" style={{ color: "var(--color-stamp-red)" }}>
              {error}
            </p>
          )}
          {confirmMessage && (
            <p className="text-sm font-mono" style={{ color: "var(--color-teal)" }}>
              {confirmMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-teal)" }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setConfirmMessage(null);
            }}
            className="w-full text-center text-xs text-[var(--color-ink-soft)] underline"
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
