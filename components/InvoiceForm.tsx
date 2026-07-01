"use client";

import { useState, FormEvent } from "react";
import type { Invoice } from "@/lib/types";

export function InvoiceForm({ onCreated }: { onCreated: (invoice: Invoice) => void }) {
  const [businessName, setBusinessName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          customer_name: customerName,
          customer_email: customerEmail,
          description,
          amount: parseFloat(amount),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Could not create invoice");
      }

      onCreated(json.invoice);
      setCustomerName("");
      setCustomerEmail("");
      setDescription("");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-sm border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <form onSubmit={handleSubmit} className="receipt rounded-b-md p-6 space-y-4">
      <p className="font-display text-lg">New invoice</p>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
          Your business name
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
            Customer name
          </label>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
            style={{ borderColor: "var(--color-line)" }}
            placeholder="Tunde Bello"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
            Customer email
          </label>
          <input
            required
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className={inputClass}
            style={{ borderColor: "var(--color-line)" }}
            placeholder="tunde@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
          What&apos;s this for
        </label>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          style={{ borderColor: "var(--color-line)" }}
          placeholder="2 yards of Ankara fabric"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-1">
          Amount (NGN)
        </label>
        <input
          required
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputClass} font-mono`}
          style={{ borderColor: "var(--color-line)" }}
          placeholder="15000"
        />
      </div>

      {error && (
        <p className="text-sm font-mono" style={{ color: "var(--color-stamp-red)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--color-teal)" }}
      >
        {loading ? "Generating payment link…" : "Create invoice"}
      </button>
    </form>
  );
}
