import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { Dashboard } from "@/components/Dashboard";

export default async function Page() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated requests, but checking
  // again here means this page is safe even if it's ever reached another
  // way (e.g. a future change to the middleware matcher).
  if (!user) {
    redirect("/login");
  }

  const defaultBusinessName =
    (user.user_metadata?.business_name as string | undefined) ?? "";

  return <Dashboard userEmail={user.email ?? ""} defaultBusinessName={defaultBusinessName} />;
}
