"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRoles, getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, field, hasBackend, type OpState } from "@/lib/ops";
import { postHash, type RawPost } from "@/lib/ingest/fetchers";
import { safeSourceUrl } from "@/lib/ingest/run";
import { toRow } from "@/lib/ingest/to-row";

async function ctx(admin = false) {
  if (!hasBackend()) return { error: fail("unavailable") } as const;
  const viewer = await getViewer();
  if (!viewer) return { error: fail("session") } as const;
  const roles = await getRoles(viewer.id);
  const ok = admin ? roles.some((r) => r === "next_admin" || r === "super_admin") : roles.some((r) => ["next_recruiter", "next_admin", "super_admin"].includes(r));
  if (!ok) return { error: fail("not_allowed") } as const;
  return { viewer, supabase: await createClient() } as const;
}
const done = (): OpState => { revalidatePath("/agency/external-jobs"); revalidatePath("/jobs/external"); return { status: "success" }; };
const uuid = z.string().uuid();

/** A recruiter pastes an announcement. It is parsed with the deterministic parser and saved as pending_review. */
export async function addExternalPost(_p: OpState, fd: FormData): Promise<OpState> {
  const text = (field(fd, "text") ?? "").replace(/\r/g, "").trim();
  const label = (field(fd, "source_name") ?? "").trim();
  const urlRaw = (field(fd, "post_url") ?? "").trim();
  const errors: Record<string, string> = {};
  if (text.length < 40) errors.text = "short";
  if (text.length > 20000) errors.text = "long";
  if (label.length < 2 || label.length > 120) errors.source_name = label.length ? "long" : "required";
  let url: string | null = null;
  if (urlRaw) { const u = safeSourceUrl(urlRaw); if (!u) errors.post_url = "invalid"; else url = u.toString(); }
  if (Object.keys(errors).length) return { status: "error", errors };
  const c = await ctx(); if (c.error) return c.error;
  const post: RawPost = { ref: `manual/${postHash(text).slice(0, 16)}`, url: url ?? "", text, applyUrl: url ?? undefined };
  const row = toRow(post, { id: null, label });
  if (!row) return { status: "error", errors: { text: "invalid" }, form: "invalid" };
  const { data, error } = await c.supabase.from("external_jobs").insert(row).select("id");
  if (error || !data?.length) return fail(dbError(error));
  return done();
}

export async function moderateExternal(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "id")); const to = field(fd, "to");
  if (!id.success || !["published", "rejected"].includes(to ?? "")) return fail("invalid");
  const c = await ctx(); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("external_jobs").update({ status: to }).eq("id", id.data).select("id, status");
  if (error || data?.[0]?.status !== to) return fail(error ? dbError(error) : "not_allowed");
  return done();
}

const sourceSchema = z.object({
  kind: z.enum(["telegram_channel", "rss_feed", "career_page"]),
  name: z.string().trim().min(2, "short").max(120, "long"),
  handle: z.string().trim().regex(/^[A-Za-z0-9_]{4,64}$/, "invalid").optional().or(z.literal("").transform(() => undefined)),
  url: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  basis: z.string().trim().min(10, "short").max(500, "long"),
});

export async function addSource(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = sourceSchema.safeParse({ kind: field(fd, "kind"), name: field(fd, "name"), handle: field(fd, "handle"), url: field(fd, "url"), basis: field(fd, "basis") });
  if (!parsed.success) { const errors: Record<string, string> = {}; for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message; return { status: "error", errors }; }
  const v = parsed.data;
  if (v.kind === "telegram_channel" ? !v.handle : !(v.url && safeSourceUrl(v.url))) return { status: "error", errors: { [v.kind === "telegram_channel" ? "handle" : "url"]: "invalid" } };
  const c = await ctx(true); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("job_sources").insert({ kind: v.kind, name: v.name, handle: v.kind === "telegram_channel" ? v.handle : null, url: v.kind === "telegram_channel" ? null : v.url, basis: v.basis, created_by: c.viewer.id }).select("id");
  if (error || !data?.length) return fail(dbError(error));
  return done();
}

export async function setSourceActive(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "id")); const on = field(fd, "on") === "1";
  if (!id.success) return fail("invalid");
  const c = await ctx(true); if (c.error) return c.error;
  const { data, error } = await c.supabase.from("job_sources").update({ active: on }).eq("id", id.data).select("id, active");
  if (error || data?.[0]?.active !== on) return fail(error ? dbError(error) : "not_allowed");
  return done();
}
