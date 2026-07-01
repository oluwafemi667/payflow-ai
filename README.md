# PayFlow AI

Turn "send me your account number" into a real invoice with a real payment
link, and know the moment it's paid — without checking your bank app every
ten minutes.

Built for the Nomba x DevCareer Hackathon 2026.

## What it does

1. A business owner creates an invoice (customer, description, amount).
2. PayFlow generates a Nomba Checkout payment link for that exact amount.
3. The customer pays via card, bank transfer, or USSD on Nomba's checkout page.
4. Nomba sends a signed webhook the moment payment succeeds.
5. The dashboard updates live — a rubber-stamp "PAID" mark appears — with no
   manual reconciliation.

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS v4
- Supabase (Postgres) for invoice storage
- Nomba Checkout API + Webhooks for payments

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in real values, see below
```

### Supabase

1. Create a project (or reuse an existing one).
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy the Project URL, anon key, and service role key into `.env.local`.

### Nomba

1. Use your **TEST** credentials from the hackathon onboarding email —
   never the live ones — while developing.
2. Set `NOMBA_ACCOUNT_ID`, `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET` in
   `.env.local`.
3. Webhooks need a public HTTPS URL, so local `localhost` won't receive
   them. Deploy to Vercel first (see below), then configure the webhook URL
   on the Nomba dashboard as `https://<your-app>.vercel.app/api/webhooks/nomba`,
   and copy the signature key it gives you into `NOMBA_WEBHOOK_SECRET`.

### Run it

```bash
npm run dev
```

## Deploying (Vercel)

```bash
npx vercel
```

Set the same environment variables from `.env.local` in the Vercel project
settings, then set `NEXT_PUBLIC_APP_URL` to your deployed URL. Redeploy after
adding env vars.

## Architecture & security notes

**Auth (Nomba → our server):** OAuth2 client-credentials flow. The access
token is fetched server-side only, cached in memory, and refreshed
automatically 60 seconds before it expires (`lib/nomba.ts`). The client
secret never reaches the browser.

**Auth (browser → our server):** Invoice creation and listing go through
Next.js API routes using the Supabase **service role** key, which is only
ever used server-side (`lib/supabase.ts` — `supabaseAdmin()`). The anon key
is exposed to the browser but the `invoices` table has RLS enabled with no
public policies, so it can't be read or written directly from the client.

**Webhooks:** Nomba's webhook signature is an HMAC-SHA256 over a specific
set of payload fields (not the raw body), keyed with the signature secret
set on the Nomba dashboard. We recompute it and compare with
`crypto.timingSafeEqual` before trusting any webhook (`lib/webhook.ts`,
`app/api/webhooks/nomba/route.ts`). Unsigned or mismatched requests get a
401 with no detail about why, so the failure mode itself doesn't leak
information useful for forging a request. On successful processing we
return 2xx; on our own DB errors we return 500 so Nomba's retry-with-backoff
kicks in instead of silently losing the event.

**Secrets:** All credentials live in environment variables, `.env*` is
git-ignored by default (Next.js scaffold default, verified in `.gitignore`),
and `.env.example` documents required variables without real values. Live
Nomba credentials are never used outside of the final production deploy.

## Known limitations (by design, for the checkpoint scope)

- Invoice creation is a structured form, not yet natural-language/voice —
  planned as a fast-follow before final submission.
- WhatsApp follow-up automation is not yet built.
- No auth on the dashboard itself yet (single-business MVP).
