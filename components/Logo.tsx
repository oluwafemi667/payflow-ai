export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Receipt body with a torn/perforated bottom edge */}
      <path
        d="M7 3h18v22.5l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5V3z"
        fill="var(--color-paper)"
        stroke="var(--color-ink)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <line x1="10.5" y1="9" x2="21.5" y2="9" stroke="var(--color-ink)" strokeWidth="1.3" />
      <line x1="10.5" y1="13" x2="21.5" y2="13" stroke="var(--color-ink)" strokeWidth="1.3" />
      {/* Stamp mark cutting across the corner, echoing the "PAID" stamp */}
      <circle cx="21" cy="18.5" r="7.5" fill="var(--color-paper)" stroke="var(--color-teal)" strokeWidth="1.6" />
      <path
        d="M18 18.5l2 2 3.5-4"
        stroke="var(--color-teal)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
