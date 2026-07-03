import crypto from "crypto";

// Nomba's webhook signature is NOT a hash of the raw request body.
// Per their docs, it's an HMAC-SHA256 over a specific colon-joined string of
// fields pulled out of the payload, using the signature key you set on the
// Nomba dashboard as the secret. See:
// https://developer.nomba.com/docs/api-basics/webhook

interface NombaWebhookPayload {
  event_type: string;
  requestId: string;
  data: {
    merchant?: { userId?: string; walletId?: string };
    transaction?: {
      transactionId?: string;
      type?: string;
      time?: string;
      responseCode?: string;
      transactionAmount?: number;
    };
    // Per Nomba's sandbox docs, the order object (including the
    // orderReference we set at creation time) is the reliable field to
    // correlate a webhook back to a specific invoice — not `requestId`,
    // which is just a random UUID per webhook delivery, and not
    // `orderMetaData`, which sandbox payloads don't appear to echo back.
    order?: {
      orderId?: string;
      orderReference?: string;
      accountId?: string;
      customerEmail?: string;
      amount?: number;
    };
    orderMetaData?: { invoiceId?: string };
    [key: string]: unknown;
  };
}

export function verifyNombaSignature(
  rawBody: string,
  signatureHeader: string,
  timestampHeader: string,
  secret: string
): boolean {
  let payload: NombaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const merchant = payload.data?.merchant ?? {};
  const transaction = payload.data?.transaction ?? {};

  let responseCode = transaction.responseCode ?? "";
  if (responseCode === "null") responseCode = "";

  const hashingPayload = [
    payload.event_type ?? "",
    payload.requestId ?? "",
    merchant.userId ?? "",
    merchant.walletId ?? "",
    transaction.transactionId ?? "",
    transaction.type ?? "",
    transaction.time ?? "",
    responseCode,
    timestampHeader,
  ].join(":");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(hashingPayload)
    .digest("base64");

  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type { NombaWebhookPayload };
