import { z } from "zod";

/** Result of an operational server action. Success is only returned after the database confirmed the write. */
export type OpState =
  | { status: "idle" }
  | { status: "error"; errors: Record<string, string>; form?: string }
  | { status: "success"; info?: string };

export const idle: OpState = { status: "idle" };

export const field = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v : undefined;
};

export const collect = (issues: { path: PropertyKey[]; message: string }[]) => {
  const errors: Record<string, string> = {};
  for (const i of issues) errors[String(i.path[0])] ??= i.message;
  return errors;
};

export const fail = (form: string): OpState => ({ status: "error", errors: {}, form });
export const hasBackend = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Maps a PostgREST/Postgres error to one of our stable form-error codes. */
export function dbError(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "server";
  if (error.code === "23505") return "duplicate";
  if (error.code === "42501" || /row-level security/i.test(error.message ?? "")) return "not_allowed";
  if (error.code === "23514" || error.code === "22001") return "invalid";
  if (error.code === "P0001") return "not_allowed"; // guard-trigger exceptions
  return "server";
}

const optText = (max: number) =>
  z.string().trim().max(max, "long").optional().transform((v) => (v ? v : undefined));
const optInt = (min: number, max: number) =>
  z.string().trim().optional().transform((v, ctx) => {
    if (!v) return undefined;
    const n = Number(v);
    if (!Number.isInteger(n) || n < min || n > max) { ctx.addIssue({ code: "custom", message: "number" }); return z.NEVER; }
    return n;
  });

export const SENIORITY = ["entry", "mid", "senior", "manager", "director", "executive"] as const;
export const EMPLOYMENT = ["full_time", "part_time", "contract", "internship", "temporary"] as const;
export const WORK_MODE = ["on_site", "hybrid", "remote"] as const;
export const CITY_SLUGS = ["baghdad", "erbil", "basra", "sulaymaniyah", "mosul", "najaf", "karbala", "kirkuk", "duhok"] as const;
export const POOL_TEXT_VERSION = "v1";

export const applySchema = z.object({
  job_id: z.string().uuid("invalid"),
  cover_note: optText(2000),
  /** CV file to attach ("" / "none" = no file). Ownership is enforced again by the database. */
  resume_id: z.string().trim().optional().transform((v, ctx) => {
    if (!v || v === "none") return undefined;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) { ctx.addIssue({ code: "custom", message: "invalid" }); return z.NEVER; }
    return v;
  }),
  share_profile: z.literal("on").optional(),
});

export const candidateProfileSchema = z.object({
  headline: optText(140),
  summary: optText(3000),
  years_experience: optInt(0, 60),
  seniority: z.enum(SENIORITY).optional().or(z.literal("").transform(() => undefined)),
  preferred_functions: z.string().trim().max(400, "long").optional().transform((v, ctx) => {
    const list = (v ?? "").split(/[,\n،]/).map((s) => s.trim()).filter(Boolean);
    if (list.length > 10 || list.some((s) => s.length > 40)) { ctx.addIssue({ code: "custom", message: "long" }); return z.NEVER; }
    return list;
  }),
  preferred_locations: z.array(z.enum(CITY_SLUGS)).max(9),
});

export const poolSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("granted"), visibility: z.enum(["anonymized", "searchable"], { error: "required" }), confirm: z.literal("on", { error: "consent" }) }),
  z.object({ action: z.literal("withdrawn") }),
]);

export const jobSchema = z.object({
  company_id: z.string().uuid("invalid"),
  title: z.string().trim().min(3, "short").max(160, "long"),
  description: z.string().trim().min(30, "short").max(10000, "long"),
  requirements: optText(5000),
  industry: optText(60),
  city: z.enum(CITY_SLUGS, { error: "required" }),
  employment_type: z.enum(EMPLOYMENT, { error: "required" }),
  work_mode: z.enum(WORK_MODE, { error: "required" }),
  seniority: z.enum(SENIORITY).optional().or(z.literal("").transform(() => undefined)),
  /** Required: every job has a closing date between today and +180 days (also enforced by the database). */
  deadline: z.string().trim().optional().transform((v, ctx) => {
    if (!v) { ctx.addIssue({ code: "custom", message: "required" }); return z.NEVER; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) { ctx.addIssue({ code: "custom", message: "date" }); return z.NEVER; }
    const day = Date.parse(v + "T00:00:00Z");
    const today = Date.parse(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
    if (day < today || day > today + 180 * 86_400_000) { ctx.addIssue({ code: "custom", message: "deadline_range" }); return z.NEVER; }
    return v;
  }),
  show_salary: z.literal("on").optional(),
  salary_min: optInt(0, 100_000_000),
  salary_max: optInt(0, 100_000_000),
  salary_currency: z.enum(["IQD", "USD"]).optional().or(z.literal("").transform(() => undefined)),
}).superRefine((v, ctx) => {
  if (v.show_salary) {
    if (v.salary_min == null) ctx.addIssue({ code: "custom", path: ["salary_min"], message: "required" });
    if (!v.salary_currency) ctx.addIssue({ code: "custom", path: ["salary_currency"], message: "required" });
  }
  if (v.salary_min != null && v.salary_max != null && v.salary_max < v.salary_min) ctx.addIssue({ code: "custom", path: ["salary_max"], message: "range" });
});

/** Resolve user text (slug or a city label in either language) to a city slug; null if unknown. */
export function cityToSlug(input: string, labels: { slug: string; label: string }[][]): string | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  for (const list of labels) for (const c of list) if (c.slug === t || c.label.toLowerCase() === t) return c.slug;
  return null;
}

/** Escape LIKE wildcards in a user supplied search term. */
export const likeSafe = (s: string) => s.replace(/[\\%_,()]/g, " ").trim();

export const companySchema = z.object({
  name: z.string().trim().min(2, "short").max(160, "long"),
  industry: optText(60),
  city: z.enum(CITY_SLUGS).optional().or(z.literal("").transform(() => undefined)),
  business_email: z.string().trim().toLowerCase().max(254, "long").email("email").optional().or(z.literal("").transform(() => undefined)),
  website: z.string().trim().max(200, "long").optional().transform((v, ctx) => {
    if (!v) return undefined;
    try { const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`); if (!/^https?:$/.test(u.protocol)) throw 0; return u.toString(); }
    catch { ctx.addIssue({ code: "custom", message: "invalid" }); return z.NEVER; }
  }),
  description: optText(2000),
  size_range: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional().or(z.literal("").transform(() => undefined)),
  contact_person: optText(120),
});

export const requestSchema = z.object({
  company_id: z.string().uuid("invalid"),
  positions: z.string().trim().min(2, "short").max(2000, "long"),
  vacancies_count: z.coerce.number().int().min(1, "number").max(200, "number"),
  industry: optText(40),
  experience_level: z.enum(SENIORITY).optional().or(z.literal("").transform(() => undefined)),
  skills: optText(2000),
  locations: optText(500),
  deadline: z.string().trim().optional().transform((v, ctx) => {
    if (!v) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) { ctx.addIssue({ code: "custom", message: "date" }); return z.NEVER; }
    return v;
  }),
  additional: optText(4000),
  confidential: z.literal("on").optional(),
});

export const APP_STATUSES = ["review", "shortlisted", "interview", "offer", "hired", "rejected"] as const;

export function slugify(name: string): string {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  return base.length >= 2 ? `${base}-${suffix}` : `co-${suffix}`;
}
