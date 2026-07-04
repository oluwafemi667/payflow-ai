"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-xs underline text-[var(--color-ink-soft)]"
    >
      Save as PDF
    </button>
  );
}
