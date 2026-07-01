import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyNombaSignature, type NombaWebhookPayload } from "@/lib/webhook";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("nomba-signature") ?? "";
  const timestamp = req.headers.get("nomba-timestamp") ?? "";
  const secret = process.env.NOMBA_WEBHOOK_SECRET!;

  const isValid = verifyNombaSignature(rawBody, signature, timestamp, secret);
  if (!isValid) {
    // Do NOT leak why verification failed — just reject.
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload: NombaWebhookPayload = JSON.parse(rawBody);
  const db = supabaseAdmin();

  if (payload.event_type === "payment_success") {
    const invoiceId = (payload.data as { orderMetaData?: { invoiceId?: string } })
      .orderMetaData?.invoiceId;

    // Fall back to matching on the order reference if metadata isn't
    // echoed back in the shape we expect — keeps this resilient to minor
    // payload differences between sandbox and live.
    const query = invoiceId
      ? db.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoiceId)
      : db
          .from("invoices")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("nomba_order_reference", payload.requestId);

    const { error } = await query;
    if (error) {
      // Return 500 so Nomba retries with backoff rather than dropping the event.
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (payload.event_type === "payment_failed") {
    const invoiceId = (payload.data as { orderMetaData?: { invoiceId?: string } })
      .orderMetaData?.invoiceId;
    if (invoiceId) {
      await db.from("invoices").update({ status: "failed" }).eq("id", invoiceId);
    }
  }

  // Always 2xx on successful processing so Nomba doesn't retry unnecessarily.
  return NextResponse.json({ received: true });
}
