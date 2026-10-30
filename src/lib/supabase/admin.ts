import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server jobs only (the scheduled importer). Never import this from a component or a page.
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured, so the feature degrades to "not configured" instead of failing.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
