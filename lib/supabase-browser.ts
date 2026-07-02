import { createBrowserClient } from "@supabase/ssr";

// Browser client for use in client components — manages the auth session
// via cookies so it stays in sync with the server.
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
