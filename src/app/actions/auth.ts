"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoles, getViewer, homeFor, siteOrigin } from "@/lib/auth";
import {
  deletionSchema, newPasswordSchema, profileSchema, resetRequestSchema, safeNext, signInSchema, signUpSchema,
} from "@/lib/validation";

export type AuthState =
  | { status: "idle" }
  | { status: "error"; errors: Record<string, string>; form?: string }
  | { status: "success"; info?: string };

const field = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v : undefined;
};
const collect = (issues: { path: PropertyKey[]; message: string }[]) => {
  const errors: Record<string, string> = {};
  for (const i of issues) errors[String(i.path[0])] ??= i.message;
  return errors;
};
const fail = (form: string): AuthState => ({ status: "error", errors: {}, form });
const hasAuth = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const isRate = (code?: string) => code === "over_request_rate_limit" || code === "over_email_send_rate_limit";

export async function signUp(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    full_name: field(fd, "full_name"), email: field(fd, "email"), password: field(fd, "password"),
    confirm: field(fd, "confirm"), purpose: field(fd, "purpose"), terms: field(fd, "terms"),
  });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  if (!hasAuth()) return fail("unavailable");

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { full_name: parsed.data.full_name, account_purpose: parsed.data.purpose, terms_accepted: "true" },
    },
  });
  if (error) {
    if (error.code === "weak_password") return { status: "error", errors: { password: "weak_password" } };
    if (isRate(error.code)) return fail("rate");
    if (error.code === "user_already_exists") return fail("email_registered");
    return fail("server");
  }
  // With e-mail confirmation on, Supabase answers an already-registered address with a user whose identities list
  // is empty (and sends no e-mail). Say so, instead of a "check your inbox" that never arrives.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) return fail("email_registered");
  if (data.session && data.user) redirect(homeFor(await getRoles(data.user.id)));
  return { status: "success" };
}

export async function signIn(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({ email: field(fd, "email"), password: field(fd, "password") });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  if (!hasAuth()) return fail("unavailable");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") return fail("email_not_confirmed");
    if (isRate(error?.code)) return fail("rate");
    if (error && error.status && error.status >= 500) return fail("server");
    return fail("invalid_credentials");
  }
  const next = safeNext(field(fd, "next"), "");
  const roles = await getRoles(data.user.id);
  redirect(next && !next.startsWith("/login") && !next.startsWith("/register") ? next : homeFor(roles));
}

export async function signOut() {
  if (hasAuth()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse({ email: field(fd, "email") });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  if (!hasAuth()) return fail("unavailable");
  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error && isRate(error.code)) return fail("rate");
  if (error) return fail("server");
  // Same answer whether or not the address exists (no account enumeration).
  return { status: "success" };
}

export async function updatePassword(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({ password: field(fd, "password"), confirm: field(fd, "confirm") });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  if (!hasAuth()) return fail("unavailable");
  const viewer = await getViewer();
  if (!viewer) return fail("session");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "weak_password" || error.code === "same_password") return { status: "error", errors: { password: "weak_password" } };
    if (isRate(error.code)) return fail("rate");
    return fail("server");
  }
  return { status: "success" };
}

export async function updateProfile(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = profileSchema.safeParse({ full_name: field(fd, "full_name"), phone: field(fd, "phone") });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const viewer = await getViewer();
  if (!viewer) return fail("session");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone ?? null })
    .eq("id", viewer.id)
    .select("id");
  if (error || !data?.length) return fail("server");
  return { status: "success" };
}

export async function requestAccountDeletion(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = deletionSchema.safeParse({ reason: field(fd, "reason"), confirm: field(fd, "confirm") });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const viewer = await getViewer();
  if (!viewer) return fail("session");
  const supabase = await createClient();
  const { error } = await supabase
    .from("account_deletion_requests")
    .insert({ user_id: viewer.id, reason: parsed.data.reason ?? null });
  if (error) return fail(error.code === "23505" ? "duplicate" : "server");
  return { status: "success" };
}
