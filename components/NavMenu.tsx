"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

function MenuIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="4.5" r="1.3" fill="currentColor" />
      <circle cx="10" cy="10" r="1.3" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 5.5V10l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.4 4.6l-1.4 1.4M6 14l-1.4 1.4M15.4 15.4L14 14M6 6L4.6 4.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M8 17H4.5a1 1 0 01-1-1V4a1 1 0 011-1H8M13 14l4-4-4-4M17 10H7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavMenu({ userEmail, onSignOut }: { userEmail: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const itemClass =
    "flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-black/[0.04] transition text-left w-full";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More options"
        title="More options"
        className="w-8 h-8 flex items-center justify-center rounded-full transition hover:bg-black/[0.05]"
        style={{ color: "var(--color-ink-soft)" }}
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-sm overflow-hidden z-10"
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-line)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          <div
            className="px-3 py-2.5 text-xs font-mono truncate"
            style={{ color: "var(--color-ink-soft)", borderBottom: "1px solid var(--color-line)" }}
          >
            {userEmail}
          </div>
          <Link href="/history" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <HistoryIcon />
            Transaction history
          </Link>
          <Link href="/settings" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <SettingsIcon />
            Settings
          </Link>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className={itemClass}
            style={{ color: "var(--color-stamp-red)" }}
          >
            <SignOutIcon />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
