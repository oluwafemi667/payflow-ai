"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { Logo } from "@/components/Logo";

type SortKey = "date" | "customer" | "amount" | "status";
type SortDir = "asc" | "desc";

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

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  paid: "var(--color-teal)",
  pending: "var(--color-amber)",
  failed: "var(--color-stamp-red)",
};

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = sortKey === activeKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs uppercase tracking-wide text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition"
    >
      {label}
      <span className="font-mono text-[10px]" style={{ opacity: isActive ? 1 : 0.25 }}>
        {isActive && dir === "asc" ? "▲" : "▼"}
      </span>
    </button>
  );
}

export function TransactionHistory({ userEmail }: { userEmail: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const timeout = setTimeout(async () => {
      const res = await fetch("/api/invoices");
      const json = await res.json();
      if (res.ok) setInvoices(json.invoices);
      setLoaded(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = invoices.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q) ||
        inv.customer_email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    rows = rows.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "date") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortKey === "customer") {
        comparison = a.customer_name.localeCompare(b.customer_name);
      } else if (sortKey === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortKey === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDir === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [invoices, search, statusFilter, sortKey, sortDir]);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Logo size={30} />
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">
              PayFlow AI
            </p>
            <h1 className="font-display text-3xl italic mt-0.5">Transaction history</h1>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-ink-soft)] font-mono">{userEmail}</p>
          <Link href="/" className="text-xs underline text-[var(--color-ink-soft)] mt-1 inline-block">
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer, email, or description"
          className="flex-1 min-w-[240px] rounded-sm border px-3 py-2 text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{ borderColor: "var(--color-line)" }}
        />
        <div className="flex gap-1.5">
          {(["all", "pending", "paid", "failed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-3 py-1.5 rounded-sm text-xs font-medium uppercase tracking-wide transition"
              style={{
                background: statusFilter === status ? "var(--color-ink)" : "transparent",
                color: statusFilter === status ? "var(--color-paper)" : "var(--color-ink-soft)",
                border: `1px solid ${statusFilter === status ? "var(--color-ink)" : "var(--color-line)"}`,
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="receipt rounded-b-md overflow-hidden">
        {!loaded && (
          <div className="px-6 py-14 text-center text-sm text-[var(--color-ink-soft)] font-display italic">
            Loading transactions…
          </div>
        )}

        {loaded && filtered.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-[var(--color-ink-soft)] font-display italic">
            {invoices.length === 0
              ? "No transactions yet."
              : "Nothing matches that search or filter."}
          </div>
        )}

        {loaded && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-line)" }}>
                  <th className="text-left px-5 py-3">
                    <SortHeader label="Date" sortKey="date" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-5 py-3">
                    <SortHeader label="Customer" sortKey="customer" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Description</th>
                  <th className="text-right px-5 py-3">
                    <SortHeader label="Amount" sortKey="amount" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-right px-5 py-3">
                    <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b last:border-b-0 hover:bg-black/[0.02] transition"
                    style={{ borderColor: "var(--color-line)" }}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-ink-soft)] whitespace-nowrap">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div>{inv.customer_name}</div>
                      <div className="text-xs text-[var(--color-ink-soft)]">{inv.customer_email}</div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-[var(--color-ink-soft)]">
                      {inv.description}
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{formatNaira(inv.amount)}</td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className="text-xs font-mono font-medium uppercase"
                        style={{ color: STATUS_COLORS[inv.status] }}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {loaded && filtered.length > 0 && (
        <p className="mt-4 text-xs text-[var(--color-ink-soft)]">
          Showing {filtered.length} of {invoices.length} transaction{invoices.length === 1 ? "" : "s"}
        </p>
      )}
    </main>
  );
}
