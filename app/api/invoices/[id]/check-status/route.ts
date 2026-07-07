import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { checkTransactionForOrder } from "@/lib/nomba";

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

  // RLS ensures this only returns a row if it belongs to the caller.
  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (invoice.status !== "pending") {
    return NextResponse.json({ invoice, checked: false, message: "Invoice is not pending" });
  }

  try {
    const result = await checkTransactionForOrder(
      invoice.nomba_order_reference ?? "",
      invoice.created_at
    );

    if (!result.found) {
      return NextResponse.json({ invoice, checked: true, matched: false });
    }

    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ invoice: updated, checked: true, matched: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Status check failed: ${message}` }, { status: 502 });
  }
}
