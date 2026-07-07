"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Logo } from "@/components/Logo";

export function Settings({
  userEmail,
  defaultBusinessName,
}: {
  userEmail: string;
  defaultBusinessName: string;
}) {
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const supabase = supabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { business_name: businessName },
      });
      if (updateError) throw updateError;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-sm border px-3 py-2 text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <main className="max-w-lg mx-auto px-6 py-12">
      <header className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
              PayFlow AI
            </p>
            <h1 className="font-display text-3xl italic mt-0.5">Settings</h1>
          </div>
        </div>
        <Link href="/" className="text-xs underline text-[var(--color-ink-soft)] mt-1">
          Back to dashboard
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="receipt rounded-b-md p-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
            Account email
          </label>
          <input
            disabled
            value={userEmail}
            className={`${inputClass} bg-black/[0.03] text-[var(--color-ink-soft)]`}
            style={{ borderColor: "var(--color-line)" }}
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
            Default business name
          </label>
          <input
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={inputClass}
            style={{ borderColor: "var(--color-line)" }}
            placeholder="Ada's Fabrics"
          />
          <p className="text-xs text-[var(--color-ink-soft)] mt-1">
            This pre-fills automatically whenever you create a new invoice.
          </p>
        </div>

        {error && (
          <p className="text-sm font-mono" style={{ color: "var(--color-stamp-red)" }}>
            {error}
          </p>
        )}
        {saved && (
          <p className="text-sm font-mono" style={{ color: "var(--color-teal)" }}>
            Saved.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-sm py-2.5 text-sm font-medium text-white transition hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
          style={{ background: "var(--color-teal)" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </main>
  );
}
