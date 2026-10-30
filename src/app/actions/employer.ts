"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer, type Viewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  APP_STATUSES, collect, companySchema, dbError, fail, field, hasBackend, jobSchema, requestSchema, slugify, type OpState,
} from "@/lib/ops";

type Ctx = { error: OpState; viewer?: undefined; supabase?: undefined } | { error?: undefined; viewer: Viewer; supabase: Awaited<ReturnType<typeof createClient>> };
async function ctx(): Promise<Ctx> {
  if (!hasBackend()) return { error: fail("unavailable") };
  const viewer = await getViewer();
  if (!viewer) return { error: fail("session") };
  return { viewer, supabase: await createClient() };
}
const uuid = (v: string | undefined) => !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function createCompany(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = companySchema.safeParse(Object.fromEntries(
    ["name", "industry", "city", "business_email", "website", "description", "size_range", "contact_person"].map((k) => [k, field(fd, k)])));
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const c = await ctx();
  if (c.error) return c.error;
  const d = parsed.data;
  const { data: company, error } = await c.supabase.from("companies").insert({
    slug: slugify(d.name), name: d.name, industry: d.industry ?? null, city: d.city ?? null, business_email: d.business_email ?? null,
    website: d.website ?? null, description: d.description ?? null, size_range: d.size_range ?? null, contact_person: d.contact_person ?? null,
    created_by: c.viewer.id,
  }).select("id").single();
  if (error || !company) return fail(dbError(error));
  const m = await c.supabase.from("company_members").insert({ company_id: company.id, user_id: c.viewer.id, role: "owner" }).select("company_id");
  if (m.error || !m.data?.length) return fail("server");
  revalidatePath("/employer", "layout");
  return { status: "success" };
}

/** intent=draft saves a draft; intent=review sends it to NEXT for review. Only NEXT staff can publish. */
export async function createJob(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = jobSchema.safeParse(Object.fromEntries(
    ["company_id", "title", "description", "requirements", "industry", "city", "employment_type", "work_mode", "seniority", "deadline", "show_salary", "salary_min", "salary_max", "salary_currency"].map((k) => [k, field(fd, k)])));
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const c = await ctx();
  if (c.error) return c.error;
  const d = parsed.data;
  const intent = field(fd, "intent") === "review" ? "pending_review" : "draft";
  const { data, error } = await c.supabase.from("jobs").insert({
    company_id: d.company_id, title: d.title, description: d.description, requirements: d.requirements ?? null,
    industry: d.industry ?? null, city: d.city, employment_type: d.employment_type, work_mode: d.work_mode,
    seniority: d.seniority ?? null, deadline: d.deadline ?? null, show_salary: !!d.show_salary,
    salary_min: d.salary_min ?? null, salary_max: d.salary_max ?? null, salary_currency: d.salary_currency ?? null,
    status: intent, created_by: c.viewer.id,
  }).select("id").single();
  if (error || !data) return fail(dbError(error));
  revalidatePath("/employer", "layout");
  redirect(`/employer/jobs/${data.id}`);
}

export async function setJobStatus(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "id"); const to = field(fd, "to");
  if (!uuid(id) || !["pending_review", "closed", "archived"].includes(to ?? "")) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const { data, error } = await c.supabase.from("jobs").update({ status: to }).eq("id", id!).select("id, status");
  if (error || data?.[0]?.status !== to) return fail(error ? dbError(error) : "not_allowed");
  revalidatePath("/employer", "layout");
  return { status: "success" };
}

export async function setApplicationStatus(_p: OpState, fd: FormData): Promise<OpState> {
  const id = field(fd, "id"); const to = field(fd, "status");
  if (!uuid(id) || !(APP_STATUSES as readonly string[]).includes(to ?? "")) return fail("invalid");
  const c = await ctx();
  if (c.error) return c.error;
  const { data, error } = await c.supabase.from("applications").update({ status: to }).eq("id", id!).select("id, status");
  if (error || data?.[0]?.status !== to) return fail(error ? dbError(error) : "not_allowed");
  revalidatePath("/employer", "layout");
  return { status: "success" };
}

export async function submitRecruitmentRequest(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = requestSchema.safeParse(Object.fromEntries(
    ["company_id", "positions", "vacancies_count", "industry", "experience_level", "skills", "locations", "deadline", "additional", "confidential"].map((k) => [k, field(fd, k)])));
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  const c = await ctx();
  if (c.error) return c.error;
  const d = parsed.data;
  const { data, error } = await c.supabase.from("recruitment_requests").insert({
    company_id: d.company_id, requester_id: c.viewer.id, positions: d.positions, vacancies_count: d.vacancies_count,
    industry: d.industry ?? null, experience_level: d.experience_level ?? null, skills: d.skills ?? null, locations: d.locations ?? null,
    deadline: d.deadline ?? null, additional: d.additional ?? null, confidential: !!d.confidential,
  }).select("id").single();
  if (error || !data) return fail(dbError(error));
  revalidatePath("/employer", "layout");
  redirect(`/employer/requests/${data.id}`);
}
