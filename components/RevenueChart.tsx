"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Invoice } from "@/lib/types";

function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

interface DayRow {
  label: string;
  paid: number;
  pending: number;
}

export function RevenueChart({ invoices }: { invoices: Invoice[] }) {
  const [colors, setColors] = useState({
    teal: "#0c6e5f",
    amber: "#d97b29",
    ink: "#242424",
    line: "#e4ddd0",
  });

  // Re-read the resolved theme colors whenever the toggle changes, since
  // recharts needs concrete color values rather than CSS var() strings to
  // render its SVG reliably across browsers.
  useEffect(() => {
    function updateColors() {
      setColors({
        teal: readCssVar("--color-teal", "#0c6e5f"),
        amber: readCssVar("--color-amber", "#d97b29"),
        ink: readCssVar("--color-ink-soft", "#6b6459"),
        line: readCssVar("--color-line", "#e4ddd0"),
      });
    }
    updateColors();
    const observer = new MutationObserver(updateColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const data: DayRow[] = useMemo(() => {
    const days: DayRow[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-NG", { weekday: "short" });
      const dayInvoices = invoices.filter((inv) => {
        const created = new Date(inv.created_at);
        return (
          created.getDate() === d.getDate() &&
          created.getMonth() === d.getMonth() &&
          created.getFullYear() === d.getFullYear()
        );
      });
      days.push({
        label,
        paid: dayInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0),
        pending: dayInvoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0),
      });
    }
    return days;
  }, [invoices]);

  const hasAnyData = data.some((d) => d.paid > 0 || d.pending > 0);
  if (!hasAnyData) return null;

  return (
    <div className="receipt rounded-b-md px-5 py-4 mb-8">
      <p className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)] mb-3">
        Last 7 days
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.line} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: colors.ink }}
            axisLine={{ stroke: colors.line }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: colors.ink }}
            axisLine={false}
            tickLine={false}
            width={40}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
          />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
                typeof value === "number" ? value : Number(value ?? 0)
              )
            }
            contentStyle={{
              fontSize: 12,
              borderRadius: 4,
              border: `1px solid ${colors.line}`,
            }}
          />
          <Bar dataKey="paid" name="Paid" fill={colors.teal} radius={[3, 3, 0, 0]} />
          <Bar dataKey="pending" name="Pending" fill={colors.amber} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
