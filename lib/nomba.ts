// Nomba API client
//
// Handles OAuth2 client-credentials auth (tokens expire after 30 min, so we
// cache in-memory and refetch when close to expiry) and checkout order
// creation. Sandbox vs live base URL is controlled by NOMBA_ENV.

const BASE_URL =
  process.env.NOMBA_ENV === "live"
    ? "https://api.nomba.com"
    : "https://sandbox.nomba.com";

const PARENT_ACCOUNT_ID = process.env.NOMBA_PARENT_ACCOUNT_ID!;
const SUB_ACCOUNT_ID = process.env.NOMBA_SUB_ACCOUNT_ID!;
const CLIENT_ID = process.env.NOMBA_CLIENT_ID!;
const CLIENT_SECRET = process.env.NOMBA_CLIENT_SECRET!;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

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

  const res = await fetch(`${BASE_URL}/v1/checkout/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      accountId: SUB_ACCOUNT_ID,
    },
    body: JSON.stringify({
      order: {
        orderReference: input.orderReference,
        callbackUrl: input.callbackUrl,
        customerEmail: input.customerEmail,
        amount: input.amount,
        currency: "NGN",
        orderMetaData: input.metadata,
      },
    }),
  });

  const json = await res.json();
  if (json.code !== "00") {
    throw new Error(
      `Nomba checkout order failed: ${json.description ?? res.status}`
    );
  }

  return {
    checkoutLink: json.data.checkoutLink,
    orderReference: json.data.orderReference,
  };
}