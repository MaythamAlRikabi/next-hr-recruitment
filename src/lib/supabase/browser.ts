import { createBrowserClient } from "@supabase/ssr";

/** Browser client: publishable key only. The service-role key must never reach the browser. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
