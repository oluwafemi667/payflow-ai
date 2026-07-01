import Link from "next/link";

export default async function CallbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <main className="max-w-md mx-auto px-6 py-24 text-center">
      <p className="font-display text-2xl italic">Thanks — we&apos;re confirming your payment.</p>
      <p className="text-sm text-[var(--color-ink-soft)] mt-3">
        This can take a few seconds. The invoice will update automatically once Nomba confirms it.
      </p>
      <Link href="/" className="inline-block mt-6 text-sm font-mono underline" style={{ color: "var(--color-teal)" }}>
        Back to dashboard
      </Link>
    </main>
  );
}
