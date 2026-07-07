"use client";

import { useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.dataset.theme === "dark";
  });

  function toggle() {
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next === "dark" ? "dark" : "";
    localStorage.setItem("payflow-theme", next);
    setIsDark(next === "dark");
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-8 h-8 flex items-center justify-center rounded-full transition hover:bg-black/[0.05]"
      style={{ color: "var(--color-ink-soft)" }}
      suppressHydrationWarning
    >
      {isDark ? (
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9L4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
          <path
            d="M17 11.5A7.5 7.5 0 018.5 3a7.5 7.5 0 108.5 8.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
