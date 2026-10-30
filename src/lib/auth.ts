import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Viewer = { id: string; email: string | null };

/** Verified current user (validated against the Auth server, not just decoded from the cookie). */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
});

export const getRoles = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as string);
});

/** Where a person lands after signing in, based on their roles. Only existing pages are returned. */
export function homeFor(roles: string[]): string {
  if (roles.some((r) => r === "super_admin" || r === "next_admin")) return "/admin";
  if (roles.includes("next_recruiter")) return "/agency";
  if (roles.includes("employer")) return "/employer";
  return "/candidate";
}

export async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && env.startsWith("http")) return env.replace(/\/$/, "");
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Server-side guard used by private pages (defense in depth on top of proxy.ts and RLS). */
export async function requireRole(allowed: string[], loginNext: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(loginNext)}`);
  const roles = await getRoles(viewer.id);
  if (!roles.some((r) => allowed.includes(r))) redirect("/not-authorized");
  return { viewer, roles };
}
