"use client";

import { useState } from "react";
import type { Invoice } from "@/lib/types";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InvoiceCard({
  invoice,
  isOverdue = false,
  onUpdated,
}: {
  invoice: Invoice;
  isOverdue?: boolean;
  onUpdated?: (invoice: Invoice) => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  async function handleRetry() {
    setRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/retry`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Retry failed");
      onUpdated?.(json.invoice);
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  const [copied, setCopied] = useState(false);

  function shareUrl() {
    return `${window.location.origin}/invoices/${invoice.id}/view`;
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Invoice from ${invoice.business_name}`);
    const body = encodeURIComponent(
      `Hi ${invoice.customer_name},\n\nHere's your invoice for ${invoice.description}: ${formatNaira(invoice.amount)}.\n\nView and pay here: ${shareUrl()}\n\nThanks,\n${invoice.business_name}`
    );
    window.location.href = `mailto:${invoice.customer_email}?subject=${subject}&body=${body}`;
  }

  return (
    <div
      className="receipt receipt-interactive rounded-b-md px-6 pt-6 pb-5"
      style={isOverdue ? { borderLeft: "3px solid var(--color-stamp-red)" } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
            {invoice.business_name}
          </p>
          <p className="font-display text-lg mt-0.5">{invoice.customer_name}</p>
        </div>
        {invoice.status === "paid" && <span className="stamp text-sm">PAID</span>}
        {invoice.status === "failed" && (
          <span
            className="text-sm font-mono font-medium"
            style={{ color: "var(--color-stamp-red)" }}
          >
            FAILED
          </span>
        )}
        {invoice.status === "pending" && isOverdue && (
          <span
            className="text-sm font-mono font-medium"
            style={{ color: "var(--color-stamp-red)" }}
          >
            OVERDUE
          </span>
        )}
        {invoice.status === "pending" && !isOverdue && (
          <span
            className="text-sm font-mono font-medium"
            style={{ color: "var(--color-amber)" }}
          >
            PENDING
          </span>
        )}
      </div>

      <div className="my-4 border-t border-dashed" style={{ borderColor: "var(--color-line)" }} />

      <p className="text-sm text-[var(--color-ink-soft)]">{invoice.description}</p>

      <div className="mt-4 flex items-end justify-between">
        <span className="font-mono text-xs text-[var(--color-ink-soft)]">
          {formatDate(invoice.created_at)}
        </span>
        <span className="font-mono text-xl font-medium">{formatNaira(invoice.amount)}</span>
      </div>

      {invoice.status === "pending" && invoice.nomba_checkout_link && (
        <a
          href={invoice.nomba_checkout_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block text-center rounded-sm py-2 text-sm font-medium text-white transition hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: "var(--color-teal)" }}
        >
          Open payment link
        </a>
      )}

      {invoice.status === "failed" && (
        <div className="mt-4">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full rounded-sm py-2 text-sm font-medium text-white transition hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
            style={{ background: "var(--color-stamp-red)" }}
          >
            {retrying ? "Retrying…" : "Retry payment link"}
          </button>
          {retryError && (
            <p className="mt-2 text-xs font-mono" style={{ color: "var(--color-stamp-red)" }}>
              {retryError}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          onClick={handleCopyLink}
          className="text-xs underline text-[var(--color-ink-soft)]"
        >
          {copied ? "Link copied" : "Copy shareable link"}
        </button>
        <button
          onClick={handleEmail}
          className="text-xs underline text-[var(--color-ink-soft)]"
        >
          Email invoice
        </button>
      </div>
    </div>
  );
}
