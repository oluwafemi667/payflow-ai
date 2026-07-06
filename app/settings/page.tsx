import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { Settings } from "@/components/Settings";

export default async function SettingsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const defaultBusinessName =
    (user.user_metadata?.business_name as string | undefined) ?? "";

  return <Settings userEmail={user.email ?? ""} defaultBusinessName={defaultBusinessName} />;
}
