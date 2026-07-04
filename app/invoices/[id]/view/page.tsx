import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Public page — deliberately uses the admin client since there's no
  // customer session. The invoice UUID itself is the access control (same
  // model as most payment link products): unguessable, and only shows
  // non-sensitive invoice details, never account-level data.
  const db = supabaseAdmin();
  const { data: invoice, error } = await db
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single<Invoice>();

  if (error || !invoice) {
    notFound();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 print:py-0 print:block">
      <div className="w-full max-w-md print:max-w-full">
        <div className="text-center mb-6 print:hidden">
          <Logo size={32} />
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)] mt-2">
            PayFlow AI
          </p>
        </div>

        <div className="receipt rounded-b-md px-8 pt-8 pb-6 print:shadow-none print:border-none">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
                {invoice.business_name}
              </p>
              <p className="font-display text-xl mt-0.5">Invoice for {invoice.customer_name}</p>
            </div>
            {invoice.status === "paid" && <span className="stamp text-sm">PAID</span>}
            {invoice.status === "pending" && (
              <span className="text-sm font-mono font-medium" style={{ color: "var(--color-amber)" }}>
                PENDING
              </span>
            )}
            {invoice.status === "failed" && (
              <span className="text-sm font-mono font-medium" style={{ color: "var(--color-stamp-red)" }}>
                UNAVAILABLE
              </span>
            )}
          </div>

          <div className="my-5 border-t border-dashed" style={{ borderColor: "var(--color-line)" }} />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-ink-soft)]">Description</span>
              <span className="text-right">{invoice.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-ink-soft)]">Billed to</span>
              <span>{invoice.customer_email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-ink-soft)]">Date</span>
              <span className="font-mono">{formatDate(invoice.created_at)}</span>
            </div>
          </div>

          <div className="my-5 border-t border-dashed" style={{ borderColor: "var(--color-line)" }} />

          <div className="flex items-end justify-between">
            <span className="text-sm text-[var(--color-ink-soft)]">Total</span>
            <span className="font-mono text-2xl font-medium">{formatNaira(invoice.amount)}</span>
          </div>

          {invoice.status === "pending" && invoice.nomba_checkout_link && (
            <a
              href={invoice.nomba_checkout_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block text-center rounded-sm py-2.5 text-sm font-medium text-white transition hover:opacity-90 hover:-translate-y-0.5 hover:shadow-md print:hidden"
              style={{ background: "var(--color-teal)" }}
            >
              Pay {formatNaira(invoice.amount)} now
            </a>
          )}
        </div>

        <div className="mt-4 flex justify-center print:hidden">
          <PrintButton />
        </div>
      </div>
    </main>
  );
}
