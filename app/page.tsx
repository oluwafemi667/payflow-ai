"use client";

import { useEffect, useState, useCallback } from "react";
import type { Invoice } from "@/lib/types";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoiceCard } from "@/components/InvoiceCard";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/invoices");
    const json = await res.json();
    if (res.ok) setInvoices(json.invoices);
    setLoaded(true);
  }, []);

  useEffect(() => {
    // Poll for status changes so a stamp appears live when a webhook
    // updates an invoice, without needing sockets for the MVP. The initial
    // load is deferred to a microtask to avoid calling setState
    // synchronously within the effect body.
    const timeout = setTimeout(refresh, 0);
    const interval = setInterval(refresh, 5000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [refresh]);

  const pendingTotal = invoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0);
  const paidTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
          PayFlow AI
        </p>
        <h1 className="font-display text-3xl italic mt-1">Get paid, without the chase.</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10 max-w-md">
        <div className="receipt rounded-b-md px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Pending</p>
          <p className="font-mono text-xl mt-1" style={{ color: "var(--color-amber)" }}>
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(pendingTotal)}
          </p>
        </div>
        <div className="receipt rounded-b-md px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Paid</p>
          <p className="font-mono text-xl mt-1" style={{ color: "var(--color-teal)" }}>
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(paidTotal)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[380px_1fr] gap-8">
        <InvoiceForm onCreated={(inv) => setInvoices((prev) => [inv, ...prev])} />

        <div className="space-y-5">
          {loaded && invoices.length === 0 && (
            <p className="text-sm text-[var(--color-ink-soft)] font-display italic">
              No invoices yet — create your first one.
            </p>
          )}
          {invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      </div>
    </main>
  );
}
