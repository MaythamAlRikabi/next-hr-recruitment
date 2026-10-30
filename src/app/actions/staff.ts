"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRoles, getViewer, type Viewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, field, hasBackend, type OpState } from "@/lib/ops";

type Ctx = { error: OpState; viewer?: undefined; supabase?: undefined; roles?: undefined } | { error?: undefined; viewer: Viewer; roles: string[]; supabase: Awaited<ReturnType<typeof createClient>> };
/** Server-side role check on top of RLS: these actions are staff-only and the database re-checks every write. */
async function staffCtx(admin = false): Promise<Ctx> {
  if (!hasBackend()) return { error: fail("unavailable") };
  const viewer = await getViewer();
  if (!viewer) return { error: fail("session") };
  const roles = await getRoles(viewer.id);
  const ok = admin ? roles.some((r) => r === "next_admin" || r === "super_admin") : roles.some((r) => ["next_recruiter", "next_admin", "super_admin"].includes(r));
  if (!ok) return { error: fail("not_allowed") };
  return { viewer, roles, supabase: await createClient() };
}
const uuid = z.string().uuid();
const done = (): OpState => { revalidatePath("/agency", "layout"); revalidatePath("/admin"); return { status: "success" }; };

export async function moderateJob(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "id")); const to = field(fd, "to");
  if (!id.success || !["published", "draft"].includes(to ?? "")) return fail("invalid");
  const c = await staffCtx(); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("jobs").update({ status: to }).eq("id", id.data).select("id, status");
  if (error || data?.[0]?.status !== to) return fail(error ? dbError(error) : "not_allowed");
  return done();
}

export async function setCompanyVerification(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "id")); const to = field(fd, "to");
  if (!id.success || !["approved", "rejected", "needs_info", "pending"].includes(to ?? "")) return fail("invalid");
  const c = await staffCtx(true); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("companies")
    .update({ verification: to, verified_at: to === "approved" ? new Date().toISOString() : null }).eq("id", id.data).select("id, verification");
  if (error || data?.[0]?.verification !== to) return fail(error ? dbError(error) : "not_allowed");
  return done();
}

/** Grants the recruiter role only. Admin and super-admin roles are never granted from the UI (controlled setup only). */
export async function grantRecruiter(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "user_id"));
  if (!id.success) return fail("invalid");
  const c = await staffCtx(true); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("user_roles").insert({ user_id: id.data, role: "next_recruiter", granted_by: c.viewer.id }).select("user_id");
  if (error || !data?.length) return fail(dbError(error));
  return done();
}

export async function assignRecruiter(_p: OpState, fd: FormData): Promise<OpState> {
  const req = uuid.safeParse(field(fd, "request_id")); const rec = uuid.safeParse(field(fd, "recruiter_id"));
  if (!req.success || !rec.success) return fail("invalid");
  const c = await staffCtx(true); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("agency_assignments")
    .insert({ request_id: req.data, recruiter_id: rec.data, assigned_by: c.viewer.id }).select("id");
  if (error || !data?.length) return fail(dbError(error));
  return done();
}

export async function setRequestStatus(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "id")); const to = field(fd, "to");
  if (!id.success || !["under_review", "assigned", "in_progress", "placed", "closed", "declined"].includes(to ?? "")) return fail("invalid");
  const c = await staffCtx(); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("recruitment_requests").update({ status: to }).eq("id", id.data).select("id, status");
  if (error || data?.[0]?.status !== to) return fail(error ? dbError(error) : "not_allowed");
  return done();
}

export async function createShortlist(_p: OpState, fd: FormData): Promise<OpState> {
  const req = uuid.safeParse(field(fd, "request_id")); const title = (field(fd, "title") ?? "").trim();
  if (!req.success || title.length < 2 || title.length > 140) return { status: "error", errors: { title: "short" } };
  const c = await staffCtx(); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("shortlists").insert({ request_id: req.data, title, created_by: c.viewer.id }).select("id");
  if (error || !data?.length) return fail(dbError(error));
  return done();
}

export async function addToShortlist(_p: OpState, fd: FormData): Promise<OpState> {
  const sl = uuid.safeParse(field(fd, "shortlist_id")); const cand = uuid.safeParse(field(fd, "candidate_id")); const disc = field(fd, "disclosure");
  if (!sl.success || !cand.success || !["anonymized", "full"].includes(disc ?? "")) return fail("invalid");
  const c = await staffCtx(); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("shortlist_items")
    .insert({ shortlist_id: sl.data, candidate_id: cand.data, disclosure: disc }).select("id");
  if (error || !data?.length) return fail(dbError(error));
  return done();
}

export async function removeFromShortlist(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "id"));
  if (!id.success) return fail("invalid");
  const c = await staffCtx(); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("shortlist_items").delete().eq("id", id.data).select("id");
  if (error || !data?.length) return fail(dbError(error));
  return done();
}

export async function submitShortlist(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "id"));
  if (!id.success || field(fd, "reviewed") !== "on") return { status: "error", errors: { reviewed: "consent" } };
  const c = await staffCtx(); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("shortlists").update({ status: "submitted" }).eq("id", id.data).select("id, status");
  if (error || data?.[0]?.status !== "submitted") return fail(error ? dbError(error) : "not_allowed");
  return done();
}
