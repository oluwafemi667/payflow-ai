"use client";

import { useState, FormEvent } from "react";
import type { Invoice } from "@/lib/types";

export function InvoiceForm({
  defaultBusinessName = "",
  onCreated,
}: {
  defaultBusinessName?: string;
  onCreated: (invoice: Invoice) => void;
}) {
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quickText, setQuickText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [justParsed, setJustParsed] = useState(false);

  async function handleParse() {
    if (!quickText.trim()) return;
    setParsing(true);
    setParseError(null);
    setJustParsed(false);

    try {
      const res = await fetch("/api/invoices/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: quickText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not parse that");

      const { parsed } = json;
      if (parsed.customer_name) setCustomerName(parsed.customer_name);
      if (parsed.customer_email) setCustomerEmail(parsed.customer_email);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.amount) setAmount(String(parsed.amount));
      setJustParsed(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Could not parse that");
    } finally {
      setParsing(false);
    }
  }

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
      setQuickText("");
      setJustParsed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-sm border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <div className="receipt rounded-b-md p-6 space-y-5">
      <p className="font-display text-lg">New invoice</p>

      <div className="rounded-sm border border-dashed p-4 space-y-2" style={{ borderColor: "var(--color-line)" }}>
        <label className="block text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          Describe the sale
        </label>
        <textarea
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-sm border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none"
          style={{ borderColor: "var(--color-line)" }}
          placeholder="Invoice Tunde Bello 15k for 2 yards of ankara fabric, tunde@email.com"
        />
        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || !quickText.trim()}
          className="w-full rounded-sm py-2 text-sm font-medium transition hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
          style={{ background: "var(--color-line)", color: "var(--color-ink)" }}
        >
          {parsing ? "Reading that…" : "Fill in details"}
        </button>
        {parseError && (
          <p className="text-xs font-mono" style={{ color: "var(--color-stamp-red)" }}>
            {parseError}
          </p>
        )}
        {justParsed && !parseError && (
          <p className="text-xs font-mono" style={{ color: "var(--color-teal)" }}>
            Filled in below — check it over before creating.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full rounded-sm py-2.5 text-sm font-medium text-white transition hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
          style={{ background: "var(--color-teal)" }}
        >
          {loading ? "Generating payment link…" : "Create invoice"}
        </button>
      </form>
    </div>
  );
}
