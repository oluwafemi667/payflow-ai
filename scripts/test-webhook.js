// One-off diagnostic script: simulates a correctly-signed Nomba
// "payment_success" webhook and sends it to your deployed endpoint. This
// isolates whether the problem is Nomba not sending the webhook (their
// side) versus our verification/update logic being broken (our side).
//
// Usage:
//   node scripts/test-webhook.js <invoiceId>
//
// <invoiceId> should be the UUID of a real "pending" invoice from your
// Supabase invoices table (Table Editor -> invoices -> copy the id column
// for a pending row). After running this, that invoice should flip to
// "paid" on your live dashboard if everything is wired correctly.
//
// Requires Node's built-in crypto — no extra dependencies.

const crypto = require("crypto");

const WEBHOOK_URL =
  process.env.WEBHOOK_URL ?? "https://payflow-ai-beige.vercel.app/api/webhooks/nomba";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "NombaHackathon2026";

const invoiceId = process.argv[2];
if (!invoiceId) {
  console.error("Usage: node scripts/test-webhook.js <invoiceId>");
  process.exit(1);
}

const timestamp = new Date().toISOString();

const payload = {
  event_type: "payment_success",
  requestId: crypto.randomUUID(),
  data: {
    merchant: {
      userId: "test-user-id",
      walletId: "test-wallet-id",
    },
    transaction: {
      transactionId: crypto.randomUUID(),
      type: "vact_transfer",
      time: timestamp,
      responseCode: "00",
      transactionAmount: 15000,
    },
    orderMetaData: {
      invoiceId,
      businessName: "Test Business",
    },
  },
};

const rawBody = JSON.stringify(payload);

const merchant = payload.data.merchant;
const transaction = payload.data.transaction;
const hashingPayload = [
  payload.event_type,
  payload.requestId,
  merchant.userId,
  merchant.walletId,
  transaction.transactionId,
  transaction.type,
  transaction.time,
  transaction.responseCode,
  timestamp,
].join(":");

const signature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(hashingPayload)
  .digest("base64");

async function main() {
  console.log("Sending simulated webhook to:", WEBHOOK_URL);
  console.log("For invoice:", invoiceId);

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "nomba-signature": signature,
      "nomba-timestamp": timestamp,
    },
    body: rawBody,
  });

  const text = await res.text();
  console.log("Response status:", res.status);
  console.log("Response body:", text);

  if (res.status === 200) {
    console.log("\nSuccess — check your dashboard, that invoice should now show PAID.");
  } else if (res.status === 401) {
    console.log("\nSignature rejected — the WEBHOOK_SECRET here doesn't match what's set in Vercel's NOMBA_WEBHOOK_SECRET.");
  } else {
    console.log("\nUnexpected response — something in our webhook handler needs a look.");
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
