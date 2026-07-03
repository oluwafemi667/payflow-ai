import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
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

  // Temporary diagnostic logging — safe to log, this payload contains no
  // secrets. Removing once we've confirmed the real payload shape from
  // Nomba and matching is reliable.
  console.log("[nomba webhook] received:", JSON.stringify(payload));

  if (payload.event_type === "payment_success") {
    const invoiceId = (payload.data as { orderMetaData?: { invoiceId?: string } })
      .orderMetaData?.invoiceId;

    console.log("[nomba webhook] event_type=payment_success, invoiceId from metadata:", invoiceId, "requestId:", payload.requestId);

    // Fall back to matching on the order reference if metadata isn't
    // echoed back in the shape we expect — keeps this resilient to minor
    // payload differences between sandbox and live.
    const query = invoiceId
      ? db.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoiceId)
      : db
          .from("invoices")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("nomba_order_reference", payload.requestId);

    const { data: updatedRows, error } = await query.select();
    if (error) {
      console.log("[nomba webhook] update error:", error.message);
      // Return 500 so Nomba retries with backoff rather than dropping the event.
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log("[nomba webhook] rows updated:", updatedRows?.length ?? 0);
  } else {
    console.log("[nomba webhook] unhandled event_type:", payload.event_type);
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
