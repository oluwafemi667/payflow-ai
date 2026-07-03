import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { parseInvoiceText } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  // Keep this cheap and abuse-resistant — nobody needs a 5,000-word
  // "invoice description" and it protects the Gemini quota.
  if (text.length > 500) {
    return NextResponse.json(
      { error: "Description is too long — keep it to a sentence or two" },
      { status: 400 }
    );
  }

  try {
    const parsed = await parseInvoiceText(text);
    return NextResponse.json({ parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Parsing failed: ${message}` }, { status: 502 });
  }
}
