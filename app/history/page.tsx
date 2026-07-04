import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { TransactionHistory } from "@/components/TransactionHistory";

export default async function HistoryPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <TransactionHistory userEmail={user.email ?? ""} />;
}
