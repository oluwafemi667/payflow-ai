import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabase-server";
import { createCheckoutOrder } from "@/lib/nomba";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS means this select only ever returns a row if it belongs to the
  // caller — a mismatched id or someone else's invoice both come back as
  // "not found" rather than leaking whether the id exists at all.
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (invoice.status !== "failed") {
    return NextResponse.json(
      { error: "Only failed invoices can be retried" },
      { status: 400 }
    );
  }

  const orderReference = randomUUID();

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const { checkoutLink } = await createCheckoutOrder({
      amount: invoice.amount,
      customerEmail: invoice.customer_email,
      orderReference,
      callbackUrl: `${appUrl}/invoices/${invoice.id}/callback`,
      metadata: { invoiceId: invoice.id, businessName: invoice.business_name },
    });

    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "pending",
        nomba_order_reference: orderReference,
        nomba_checkout_link: checkoutLink,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ invoice: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Retry failed: ${message}` }, { status: 502 });
  }
}
