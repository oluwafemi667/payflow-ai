// Nomba API client
//
// Handles OAuth2 client-credentials auth (tokens expire after 30 min, so we
// cache in-memory and refetch when close to expiry) and checkout order
// creation. Sandbox vs live base URL is controlled by NOMBA_ENV.
//
// NOTE: Nomba's own sandbox-testing docs suggest a separate
// /sandbox/checkout/order path for sandbox orders, but that produced a
// 404 in practice. A Nomba team member confirmed directly that
// /v1/checkout/order is correct for both sandbox and live — trusting that
// direct confirmation over the docs here.

const IS_LIVE = process.env.NOMBA_ENV === "live";
const BASE_URL = IS_LIVE ? "https://api.nomba.com" : "https://sandbox.nomba.com";
const CHECKOUT_ORDER_PATH = "/v1/checkout/order";

const PARENT_ACCOUNT_ID = process.env.NOMBA_PARENT_ACCOUNT_ID!;
const SUB_ACCOUNT_ID = process.env.NOMBA_SUB_ACCOUNT_ID!;
const CLIENT_ID = process.env.NOMBA_CLIENT_ID!;
const CLIENT_SECRET = process.env.NOMBA_CLIENT_SECRET!;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    console.log("[nomba auth] using cached token, expires at:", new Date(cachedToken.expiresAt).toISOString());
    return cachedToken.value;
  }

  console.log("[nomba auth] fetching fresh token, accountId header:", PARENT_ACCOUNT_ID);

  // Token issuance authenticates against the PARENT account, per Nomba's
  // onboarding instructions — not the sub-account used for scoped calls.
  const res = await fetch(`${BASE_URL}/v1/auth/token/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accountId: PARENT_ACCOUNT_ID,
    },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const json = await res.json();
  if (json.code !== "00") {
    throw new Error(`Nomba auth failed: ${json.description ?? res.status}`);
  }

  cachedToken = {
    value: json.data.access_token,
    expiresAt: new Date(json.data.expiresAt).getTime(),
  };

  return cachedToken.value;
}

export interface CreateCheckoutOrderInput {
  amount: number;
  customerEmail: string;
  orderReference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutOrderResult {
  checkoutLink: string;
  orderReference: string;
}

export async function createCheckoutOrder(
  input: CreateCheckoutOrderInput
): Promise<CreateCheckoutOrderResult> {
  const token = await getAccessToken();
  console.log("[nomba checkout order] using accountId header:", SUB_ACCOUNT_ID, "path:", CHECKOUT_ORDER_PATH);

  const res = await fetch(`${BASE_URL}${CHECKOUT_ORDER_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      // Sub-account in the header is what actually works for order
      // creation on this account. Both using the parent account here, and
      // adding a separate accountId field inside the order body, caused
      // "Resource not found" errors — reverted both experiments.
      accountId: SUB_ACCOUNT_ID,
    },
    body: JSON.stringify({
      order: {
        orderReference: input.orderReference,
        callbackUrl: input.callbackUrl,
        customerEmail: input.customerEmail,
        amount: input.amount.toFixed(2),
        currency: "NGN",
        orderMetaData: input.metadata,
      },
    }),
  });

  const json = await res.json();
  if (json.code !== "00") {
    console.log("[nomba checkout order] failed. status:", res.status, "body:", JSON.stringify(json));
    throw new Error(
      `Nomba checkout order failed: ${json.description ?? res.status}`
    );
  }

  return {
    checkoutLink: json.data.checkoutLink,
    orderReference: json.data.orderReference,
  };
}

export interface TransactionCheckResult {
  found: boolean;
  matchedTransaction?: unknown;
}

// Fallback for the current webhook reliability issue: instead of waiting
// for Nomba to push a "payment_success" webhook (which isn't reliably
// arriving right now), we can pull directly by asking the transactions
// API what happened on this sub-account in the window since the invoice
// was created, and look for a matching successful payment by amount.
//
// The exact response shape isn't fully documented publicly, so this is
// intentionally defensive: it logs the raw response the first time so we
// can see the real shape, and checks several plausible field names/casings
// for "list of transactions" and "success status" rather than assuming
// one specific shape.
export async function checkTransactionForOrder(
  orderReference: string,
  createdAt: string
): Promise<TransactionCheckResult> {
  const token = await getAccessToken();

  const startDate = new Date(new Date(createdAt).getTime() - 5 * 60_000)
    .toISOString()
    .slice(0, 19);
  const endDate = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 19);

  const res = await fetch(`${BASE_URL}/v1/transactions/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      accountId: SUB_ACCOUNT_ID,
    },
    body: JSON.stringify({
      startDate,
      endDate,
      limit: 50,
    }),
  });

  const json = await res.json();
  console.log(
    "[nomba transactions check] orderReference:",
    orderReference,
    "status:",
    res.status,
    "result count:",
    Array.isArray(json.data?.results) ? json.data.results.length : "n/a"
  );

  if (json.code !== "00") {
    return { found: false };
  }

  // Confirmed from live testing: the transaction list lives at
  // data.results, and each entry has an exact `orderReference` field
  // matching what we set at checkout creation — a precise match, no need
  // to guess by amount/date proximity.
  const list: unknown[] = Array.isArray(json.data?.results) ? json.data.results : [];

  const match = list.find((txn) => {
    if (typeof txn !== "object" || txn === null) return false;
    const t = txn as Record<string, unknown>;
    const matchesReference = t.orderReference === orderReference;
    const status = String(t.status ?? "").toUpperCase();
    return matchesReference && status === "SUCCESS";
  });

  return { found: Boolean(match), matchedTransaction: match };
}
