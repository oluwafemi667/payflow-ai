"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/types";
import { InvoiceForm } from "@/components/InvoiceForm";
import { InvoiceCard } from "@/components/InvoiceCard";
import { Logo } from "@/components/Logo";
import { supabaseBrowser } from "@/lib/supabase-browser";

function ReceiptSkeleton() {
  return (
    <div className="receipt rounded-b-md px-6 pt-6 pb-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-2.5 w-24 rounded" style={{ background: "var(--color-line)" }} />
          <div className="h-4 w-32 rounded" style={{ background: "var(--color-line)" }} />
        </div>
        <div className="h-4 w-16 rounded" style={{ background: "var(--color-line)" }} />
      </div>
      <div className="my-4 border-t border-dashed" style={{ borderColor: "var(--color-line)" }} />
      <div className="h-3 w-40 rounded" style={{ background: "var(--color-line)" }} />
      <div className="mt-4 flex items-end justify-between">
        <div className="h-2.5 w-20 rounded" style={{ background: "var(--color-line)" }} />
        <div className="h-5 w-24 rounded" style={{ background: "var(--color-line)" }} />
      </div>
    </div>
  );
}

export function Dashboard({
  userEmail,
  defaultBusinessName,
}: {
  userEmail: string;
  defaultBusinessName: string;
}) {
  const router = useRouter();
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

  async function handleSignOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const pendingTotal = invoices
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0);
  const paidTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
              PayFlow AI
            </p>
            <h1 className="font-display text-3xl italic mt-0.5">Get paid, without the chase.</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-ink-soft)] font-mono">{userEmail}</p>
          <button
            onClick={handleSignOut}
            className="text-xs underline text-[var(--color-ink-soft)] mt-1"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-10 max-w-md">
        <div className="receipt stat-card-pending rounded-b-md px-5 py-4">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ color: "var(--color-amber)" }}>
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 5.5V10l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Pending</p>
          </div>
          <p className="font-mono text-2xl mt-1.5" style={{ color: "var(--color-amber)" }}>
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(pendingTotal)}
          </p>
        </div>
        <div className="receipt stat-card-paid rounded-b-md px-5 py-4">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style={{ color: "var(--color-teal)" }}>
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6.5 10.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Paid</p>
          </div>
          <p className="font-mono text-2xl mt-1.5" style={{ color: "var(--color-teal)" }}>
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(paidTotal)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[380px_1fr] gap-8">
        <InvoiceForm
          defaultBusinessName={defaultBusinessName}
          onCreated={(inv) => setInvoices((prev) => [inv, ...prev])}
        />

        <div className="space-y-5">
          {!loaded && (
            <>
              <ReceiptSkeleton />
              <ReceiptSkeleton />
            </>
          )}
          {loaded && invoices.length === 0 && (
            <div className="receipt rounded-b-md px-8 py-14 text-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                className="mx-auto mb-4"
                style={{ color: "var(--color-line)" }}
              >
                <path
                  d="M10 4h20v30l-3-2-3 2-3-2-3 2-3-2-3 2-2-2V4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <line x1="14" y1="12" x2="26" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="17" x2="26" y2="17" stroke="currentColor" strokeWidth="1.5" />
                <line x1="14" y1="22" x2="20" y2="22" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <p className="text-sm text-[var(--color-ink-soft)] font-display italic">
                No invoices yet — create your first one on the left.
              </p>
            </div>
          )}
          {invoices.map((invoice, i) => (
            <div
              key={invoice.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            >
              <InvoiceCard
                invoice={invoice}
                onUpdated={(updated) =>
                  setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)))
                }
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
