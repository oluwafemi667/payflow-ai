import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabase-server";
import { createCheckoutOrder } from "@/lib/nomba";

export async function GET() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Uses the SSR client (not the service-role admin client), so RLS
  // enforces the user_id scoping even if this query were ever written
  // wrong — there's no path to another user's rows here.
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ invoices: data });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { business_name, customer_name, customer_email, description, amount } = body;

  if (!business_name || !customer_name || !customer_email || !description || !amount) {
    return NextResponse.json(
      { error: "business_name, customer_name, customer_email, description, and amount are required" },
      { status: 400 }
    );
  }
  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  const orderReference = randomUUID();

  // Insert first as "pending" so we have a record even if the Nomba call
  // fails partway through — makes the flow debuggable and idempotent.
  // user_id is set explicitly here AND enforced by the RLS insert policy,
  // so a request can't create an invoice under someone else's account even
  // if this line were ever changed incorrectly.
  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      business_name,
      customer_name,
      customer_email,
      description,
      amount,
      status: "pending",
      nomba_order_reference: orderReference,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const { checkoutLink } = await createCheckoutOrder({
      amount,
      customerEmail: customer_email,
      orderReference,
      callbackUrl: `${appUrl}/invoices/${invoice.id}/callback`,
      metadata: { invoiceId: invoice.id, businessName: business_name },
    });

    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update({ nomba_checkout_link: checkoutLink })
      .eq("id", invoice.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ invoice: updated }, { status: 201 });
  } catch (err) {
    // Payment link creation failed — mark it so the dashboard can surface
    // a retry action instead of showing a silently broken invoice.
    await supabase.from("invoices").update({ status: "failed" }).eq("id", invoice.id);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Payment link creation failed: ${message}` }, { status: 502 });
  }
}
