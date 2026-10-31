"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FIELDS, LEVELS } from "@/lib/eligibility";
import { getViewer, type Viewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  applySchema, candidateProfileSchema, collect, dbError, fail, field, hasBackend, POOL_TEXT_VERSION, poolSchema, type OpState,
} from "@/lib/ops";

const MAX_RESUMES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

type Ctx = { error: OpState; viewer?: undefined; supabase?: undefined } | { error?: undefined; viewer: Viewer; supabase: Awaited<ReturnType<typeof createClient>> };
async function ctx(): Promise<Ctx> {
  if (!hasBackend()) return { error: fail("unavailable") };
  const viewer = await getViewer();
  if (!viewer) return { error: fail("session") };
  return { viewer, supabase: await createClient() };
}

export async function applyToJob(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = applySchema.safeParse({
    job_id: field(fd, "job_id"), cover_note: field(fd, "cover_note"), resume_id: field(fd, "resume_id"), share_profile: field(fd, "share_profile"),
  });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const c = await ctx();
  if (c.error) return c.error;
  const { data, error } = await c.supabase
    .from("applications")
    .insert({
      job_id: parsed.data.job_id, candidate_id: c.viewer.id, cover_note: parsed.data.cover_note ?? null,
      resume_id: parsed.data.resume_id ?? null, share_profile: !!parsed.data.share_profile,
    })
    .select("id")
    .single();
  // Success is reported only if the row came back from the database.
  if (error || !data?.id) {
    if (error?.message === "not_eligible") return fail("not_eligible");
    return fail(error?.code === "23505" ? "duplicate" : error ? "not_open" : "server");
  }
  revalidatePath("/candidate");
  return { status: "success" };
}

export async function withdrawApplication(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const { data, error } = await c.supabase
    .from("applications").update({ status: "withdrawn" }).eq("id", id).eq("candidate_id", c.viewer.id).select("id, status");
  if (error || data?.[0]?.status !== "withdrawn") return fail(error ? dbError(error) : "not_allowed");
  revalidatePath("/candidate");
  return { status: "success" };
}

export async function saveCandidateProfile(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = candidateProfileSchema.safeParse({
    headline: field(fd, "headline"), summary: field(fd, "summary"), years_experience: field(fd, "years_experience"),
    seniority: field(fd, "seniority"), preferred_functions: field(fd, "preferred_functions"),
    preferred_locations: fd.getAll("preferred_locations").filter((v) => typeof v === "string"),
  });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const c = await ctx();
  if (c.error) return c.error;
  const { data, error } = await c.supabase
    .from("candidate_profiles")
    .upsert({
      user_id: c.viewer.id,
      headline: parsed.data.headline ?? null,
      summary: parsed.data.summary ?? null,
      years_experience: parsed.data.years_experience ?? null,
      seniority: parsed.data.seniority ?? null,
      preferred_functions: parsed.data.preferred_functions,
      preferred_locations: parsed.data.preferred_locations,
    }, { onConflict: "user_id" })
    .select("user_id");
  if (error || !data?.length) return fail(dbError(error));
  revalidatePath("/candidate", "layout");
  return { status: "success" };
}

/** Grant or withdraw Talent Pool consent. Consent is explicit, versioned and append-only; visibility never changes without it. */
export async function setPoolConsent(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = poolSchema.safeParse({ action: field(fd, "action"), visibility: field(fd, "visibility"), confirm: field(fd, "confirm") });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const c = await ctx();
  if (c.error) return c.error;

  // Make sure the profile row exists (does nothing if it does).
  const ensure = await c.supabase.from("candidate_profiles").upsert({ user_id: c.viewer.id }, { onConflict: "user_id", ignoreDuplicates: true });
  if (ensure.error) return fail(dbError(ensure.error));

  const ins = await c.supabase.from("talent_pool_consents")
    .insert({ user_id: c.viewer.id, action: parsed.data.action, text_version: POOL_TEXT_VERSION });
  if (ins.error) return fail(dbError(ins.error));

  if (parsed.data.action === "granted") {
    const upd = await c.supabase.from("candidate_profiles")
      .update({ resume_visibility: parsed.data.visibility }).eq("user_id", c.viewer.id).select("resume_visibility");
    if (upd.error || upd.data?.[0]?.resume_visibility !== parsed.data.visibility) return fail(dbError(upd.error));
  } else {
    const chk = await c.supabase.from("candidate_profiles").select("resume_visibility").eq("user_id", c.viewer.id).maybeSingle();
    if (chk.data?.resume_visibility !== "private") return fail("server");
  }
  revalidatePath("/candidate", "layout");
  return { status: "success" };
}

/** Change visibility between anonymized/searchable (needs active consent; the database enforces it). */
export async function setVisibility(_p: OpState, fd: FormData): Promise<OpState> {
  const v = field(fd, "visibility");
  if (v !== "anonymized" && v !== "searchable") return { status: "error", errors: { visibility: "required" } };
  const c = await ctx();
  if (c.error) return c.error;
  const { data, error } = await c.supabase.from("candidate_profiles")
    .update({ resume_visibility: v }).eq("user_id", c.viewer.id).select("resume_visibility");
  if (error || data?.[0]?.resume_visibility !== v) return fail(error ? dbError(error) : "not_allowed");
  revalidatePath("/candidate", "layout");
  return { status: "success" };
}

const startsWith = (buf: Uint8Array, sig: number[]) => sig.every((b, i) => buf[i] === b);

/**
 * Called after the browser uploaded the file straight to Storage (Vercel limits request bodies to ~4.5 MB).
 * The file is only registered — and success only reported — after it is downloaded back and checked.
 */
export async function registerResume(_p: OpState, fd: FormData): Promise<OpState> {
  const path = field(fd, "path") ?? "";
  const fileName = (field(fd, "file_name") ?? "").trim().slice(0, 200);
  const c = await ctx();
  if (c.error) return c.error;
  const uid = c.viewer.id;
  if (!path.startsWith(`${uid}/`) || path.includes("..") || path.split("/").length !== 2 || !fileName) return fail("invalid");

  const reject = async (code: string) => { await c.supabase.storage.from("resumes").remove([path]); return fail(code); };

  const dl = await c.supabase.storage.from("resumes").download(path);
  if (dl.error || !dl.data) return fail("upload_missing");
  const bytes = new Uint8Array(await dl.data.arrayBuffer());
  if (bytes.length < 1 || bytes.length > MAX_BYTES) return reject("file_size");
  const isPdf = startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  const isDocx = startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
  if (!isPdf && !isDocx) return reject("file_type");
  if (isPdf !== path.toLowerCase().endsWith(".pdf")) return reject("file_type");

  const { count } = await c.supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", uid);
  if ((count ?? 0) >= MAX_RESUMES) return reject("too_many");

  const ins = await c.supabase.from("resumes").insert({
    user_id: uid, storage_path: path, file_name: fileName, size_bytes: bytes.length, is_primary: (count ?? 0) === 0,
    mime_type: isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }).select("id");
  if (ins.error || !ins.data?.length) return reject(dbError(ins.error));
  revalidatePath("/candidate", "layout");
  return { status: "success" };
}

export async function deleteResume(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const { data: row } = await c.supabase.from("resumes").select("id, storage_path, is_primary").eq("id", id).eq("user_id", c.viewer.id).maybeSingle();
  if (!row) return fail("not_found");
  const rm = await c.supabase.storage.from("resumes").remove([row.storage_path]);
  if (rm.error) return fail("server"); // keep the row so the file is never orphaned silently
  const del = await c.supabase.from("resumes").delete().eq("id", id).select("id");
  if (del.error || !del.data?.length) return fail(dbError(del.error));
  if (row.is_primary) {
    const { data: next } = await c.supabase.from("resumes").select("id").eq("user_id", c.viewer.id).order("created_at", { ascending: false }).limit(1);
    if (next?.[0]) await c.supabase.from("resumes").update({ is_primary: true }).eq("id", next[0].id);
  }
  revalidatePath("/candidate", "layout");
  return { status: "success" };
}

export async function setPrimaryResume(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const off = await c.supabase.from("resumes").update({ is_primary: false }).eq("user_id", c.viewer.id).eq("is_primary", true);
  if (off.error) return fail(dbError(off.error));
  const on = await c.supabase.from("resumes").update({ is_primary: true }).eq("id", id).eq("user_id", c.viewer.id).select("id");
  if (on.error || !on.data?.length) return fail(dbError(on.error));
  revalidatePath("/candidate", "layout");
  return { status: "success" };
}

/** Answer a request to share full details with an employer. Goes through a database function; the row itself is not readable by candidates. */
export async function respondConsent(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "id");
  const grant = field(fd, "grant");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || (grant !== "yes" && grant !== "no")) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const { data, error } = await c.supabase.rpc("respond_shortlist_consent", { _item: id, _grant: grant === "yes" });
  if (error || !data) return fail(dbError(error));
  revalidatePath("/candidate");
  return { status: "success" };
}

/** Save / un-save a vacancy for the signed-in candidate. RLS limits rows to the caller and to vacancies they can see. */
export async function toggleSaveJob(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "job_id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  if (field(fd, "to") === "unsave") {
    const { error } = await c.supabase.from("saved_jobs").delete().eq("job_id", id).eq("user_id", c.viewer.id);
    if (error) return fail(dbError(error));
  } else {
    const { error } = await c.supabase.from("saved_jobs").insert({ job_id: id, user_id: c.viewer.id });
    if (error && error.code !== "23505") return fail(dbError(error));
  }
  revalidatePath("/candidate/saved");
  return { status: "success" };
}


/* ---------- education & experience (used by "eligible to apply") ---------- */
const FIELD_SLUGS = FIELDS.map((f) => f.slug) as [string, ...string[]];
const LEVEL_SLUGS = LEVELS.map((l) => l.slug) as [string, ...string[]];
const UUID = /^[0-9a-f-]{36}$/i;

const eduSchema = z.object({
  level: z.enum(LEVEL_SLUGS, { message: "required" }),
  field: z.enum(FIELD_SLUGS, { message: "required" }),
  institution: z.string().trim().max(120).optional().transform((v) => v || undefined),
  graduation_year: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(1960).max(new Date().getFullYear() + 6).optional(),
  ),
});
const expSchema = z.object({
  title: z.string().trim().min(2, "required").max(120),
  field: z.enum(FIELD_SLUGS, { message: "required" }),
  years: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(50)),
  months: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(11)),
});

function fitError(error: { code?: string; message?: string } | null | undefined): string {
  if (error?.message === "too_many_rows") return "too_many";
  return dbError(error);
}

export async function addEducation(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = eduSchema.safeParse({
    level: field(fd, "level"), field: field(fd, "field"), institution: field(fd, "institution"), graduation_year: field(fd, "graduation_year"),
  });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const c = await ctx();
  if (c.error) return c.error;
  const { error } = await c.supabase.from("candidate_education").insert({
    user_id: c.viewer.id, level: parsed.data.level, field: parsed.data.field,
    institution: parsed.data.institution ?? null, graduation_year: parsed.data.graduation_year ?? null,
  });
  if (error) return fail(fitError(error));
  revalidatePath("/candidate/profile");
  revalidatePath("/jobs/[id]", "page");
  return { status: "success" };
}

export async function removeEducation(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "id");
  if (!id || !UUID.test(id)) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const { data: row } = await c.supabase.from("candidate_education").select("proof_path").eq("id", id).eq("user_id", c.viewer.id).maybeSingle();
  const { error } = await c.supabase.from("candidate_education").delete().eq("id", id).eq("user_id", c.viewer.id);
  if (error) return fail(fitError(error));
  if (row?.proof_path) await c.supabase.storage.from("credentials").remove([row.proof_path]);
  revalidatePath("/candidate/profile");
  revalidatePath("/jobs/[id]", "page");
  return { status: "success" };
}

export async function addExperience(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = expSchema.safeParse({
    title: field(fd, "title"), field: field(fd, "field"), years: field(fd, "years"), months: field(fd, "months"),
  });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const total = parsed.data.years * 12 + parsed.data.months;
  if (total < 1 || total > 600) return { status: "error", errors: { years: "required" } };
  const c = await ctx();
  if (c.error) return c.error;
  const { error } = await c.supabase.from("candidate_experience").insert({
    user_id: c.viewer.id, title: parsed.data.title, field: parsed.data.field, months: total,
  });
  if (error) return fail(fitError(error));
  revalidatePath("/candidate/profile");
  revalidatePath("/jobs/[id]", "page");
  return { status: "success" };
}

export async function removeExperience(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "id");
  if (!id || !UUID.test(id)) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const { data: row } = await c.supabase.from("candidate_experience").select("proof_path").eq("id", id).eq("user_id", c.viewer.id).maybeSingle();
  const { error } = await c.supabase.from("candidate_experience").delete().eq("id", id).eq("user_id", c.viewer.id);
  if (error) return fail(fitError(error));
  if (row?.proof_path) await c.supabase.storage.from("credentials").remove([row.proof_path]);
  revalidatePath("/candidate/profile");
  revalidatePath("/jobs/[id]", "page");
  return { status: "success" };
}

/* ---------- proof of an education / experience row (checked by NEXT staff) ---------- */
const PROOF_TABLE = { education: "candidate_education", experience: "candidate_experience" } as const;
const proofKind = (b: Uint8Array): "pdf" | "jpg" | "png" | "webp" | null => {
  if (startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf";
  if (startsWith(b, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && b.length > 12 && String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP") return "webp";
  return null;
};

/** The browser uploaded the file to the private "credentials" bucket; here it is re-read, checked, and attached (row becomes "pending"). */
export async function attachProof(_p: OpState, fd: FormData): Promise<OpState> {
  const kind = field(fd, "kind") === "experience" ? "experience" : field(fd, "kind") === "education" ? "education" : null;
  const id = field(fd, "id"); const path = field(fd, "path") ?? "";
  const name = (field(fd, "file_name") ?? "").trim().slice(0, 200);
  if (!kind || !id || !UUID.test(id) || !name) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const uid = c.viewer.id;
  if (!path.startsWith(`${uid}/`) || path.includes("..") || path.split("/").length !== 2) return fail("invalid");
  const reject = async (code: string) => { await c.supabase.storage.from("credentials").remove([path]); return fail(code); };

  const dl = await c.supabase.storage.from("credentials").download(path);
  if (dl.error || !dl.data) return fail("upload_missing");
  const bytes = new Uint8Array(await dl.data.arrayBuffer());
  if (bytes.length < 1 || bytes.length > MAX_BYTES) return reject("file_size");
  if (!proofKind(bytes)) return reject("file_type");

  const table = PROOF_TABLE[kind];
  const { data: row } = await c.supabase.from(table).select("proof_path").eq("id", id).eq("user_id", uid).maybeSingle();
  if (!row) return reject("not_found");
  const { data, error } = await c.supabase.from(table).update({ proof_path: path, proof_name: name }).eq("id", id).eq("user_id", uid).select("id");
  if (error || !data?.length) return reject(fitError(error));
  if (row.proof_path && row.proof_path !== path) await c.supabase.storage.from("credentials").remove([row.proof_path]);
  revalidatePath("/candidate/profile");
  return { status: "success" };
}
