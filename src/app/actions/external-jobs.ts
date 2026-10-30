"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRoles, getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, field, hasBackend, type OpState } from "@/lib/ops";
import { postHash, type RawPost } from "@/lib/ingest/fetchers";
import { loadKnownAds, runIngest, safeSourceUrl } from "@/lib/ingest/run";
import { createAdminClient } from "@/lib/supabase/admin";
import { fingerprint, isSameAd } from "@/lib/ingest/dedupe";
import { toRow } from "@/lib/ingest/to-row";
import { isApplyLink, isThirdPartyRecruiter } from "@/lib/ingest/agency";
import { stripTelegram, stripTelegramOrNull } from "@/lib/ingest/telegram";
import { addDays, baghdadDay, endOfBaghdadDay, MAX_DEADLINE_DAYS } from "@/lib/ingest/deadline";
import { CITY_SLUGS } from "@/lib/ops";
import { parseJobPost } from "@/lib/ingest/parse-job-post";

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
  if (!row) {
    const p = parseJobPost(text);
    return { status: "error", errors: { text: isThirdPartyRecruiter(text, p.applyEmail, p.applyUrl ?? url) ? "agency_ad" : "no_apply" } };
  }
  const fp = fingerprint(row.raw_text, row.title);
  if ((await loadKnownAds(c.supabase)).some((k) => isSameAd(fp, k))) return { status: "error", errors: { text: "duplicate_ad" } };
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

/** Admin presses "Import now": runs the same importer as the daily cron, once, and reports what it did. */
export async function importNow(): Promise<OpState> {
  const c = await ctx(true); if (c.error) return c.error;
  const db = createAdminClient();
  if (!db) return fail("unavailable");
  const reports = await runIngest(db);
  const info = reports.map((r) => `${r.source}: ${r.error ? `error (${r.error})` : `+${r.added}, dup ${r.duplicates}, skipped ${r.skipped}, found ${r.found}`}`).join("\n");
  revalidatePath("/agency/external-jobs"); revalidatePath("/jobs/external");
  return { status: "success", info: info || "no active sources" };
}

const lines = (v: string | undefined) => (v ?? "").split(/\r?\n/).map((x) => x.replace(/^[\s*\-•▪●·]+/, "").trim()).filter(Boolean);

/** A recruiter corrects an imported ad (pending or already published). The apply route and the closing date stay valid. */
export async function updateExternal(_p: OpState, fd: FormData): Promise<OpState> {
  const id = uuid.safeParse(field(fd, "id"));
  if (!id.success) return fail("invalid");
  const errors: Record<string, string> = {};
  const txt = (k: string) => (field(fd, k) ?? "").trim();
  const title = txt("title");
  if (title.length < 3) errors.title = "short"; else if (title.length > 160) errors.title = "long";
  const agency = txt("agency"); if (agency.length > 120) errors.agency = "long";
  const clientNote = txt("client_note"); if (clientNote.length > 400) errors.client_note = "long";
  const salaryNote = txt("salary_note"); if (salaryNote.length > 200) errors.salary_note = "long";
  const city = txt("city");
  if (city && !(CITY_SLUGS as readonly string[]).includes(city)) errors.city = "invalid";
  let applyUrl: string | null = null;
  const urlRaw = txt("apply_url");
  if (urlRaw) { const u = safeSourceUrl(urlRaw); if (!u || !isApplyLink(u.toString())) errors.apply_url = "invalid"; else applyUrl = u.toString(); }
  const email = txt("apply_email").toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.apply_email = "invalid";
  const phoneDigits = txt("apply_phone").replace(/[\s-]/g, "").replace(/^(?:\+|00)?964/, "0");
  const phone = phoneDigits ? (/^07[3-9]\d{8}$/.test(phoneDigits) ? phoneDigits : (errors.apply_phone = "invalid", null)) : null;
  if (!errors.apply_url && !errors.apply_email && !errors.apply_phone && !applyUrl && !email && !phone) errors.apply_url = "no_apply";
  const responsibilities = lines(field(fd, "responsibilities")); const requirements = lines(field(fd, "requirements"));
  if (responsibilities.length > 30 || responsibilities.some((x) => x.length > 400)) errors.responsibilities = "long";
  if (requirements.length > 30 || requirements.some((x) => x.length > 400)) errors.requirements = "long";
  const day = txt("expires_on");
  const today = baghdadDay(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day))) errors.expires_on = "date";
  else if (day < today || day > addDays(today, MAX_DEADLINE_DAYS)) errors.expires_on = "date";
  if (Object.keys(errors).length) return { status: "error", errors };
  const c = await ctx(); if (c.error) return c.error;
  const { data: cur } = await c.supabase.from("external_jobs").select("raw_text").eq("id", id.data).maybeSingle();
  if (!cur) return fail("not_allowed");
  if (isThirdPartyRecruiter(cur.raw_text, email || null, applyUrl)) return { status: "error", errors: { apply_email: "agency_ad" } };
  const { data, error } = await c.supabase.from("external_jobs").update({
    title: stripTelegram(title), agency: stripTelegramOrNull(agency), client_note: stripTelegramOrNull(clientNote), city: city || null, salary_note: stripTelegramOrNull(salaryNote),
    apply_url: applyUrl, apply_email: email || null, apply_phone: phone, responsibilities: responsibilities.map(stripTelegram).filter(Boolean), requirements: requirements.map(stripTelegram).filter(Boolean),
    expires_at: endOfBaghdadDay(day).toISOString(),
  }).eq("id", id.data).select("id");
  if (error || !data?.length) return fail(dbError(error));
  return done();
}
