import { homeCopy } from "@/content/home";
import { expansion } from "@/content/expansion";
import type { Locale } from "@/lib/i18n";

export type JobRow = {
  id: string; title: string; description: string; requirements: string | null; industry: string | null; city: string | null;
  employment_type: string; work_mode: string; seniority: string | null; recruitment_method: string;
  deadline: string | null; published_at: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string | null;
  company_id: string | null; company_name: string | null; employer_hidden: boolean;
};

export const cityList = (l: Locale) => expansion[l].home.locations.items;
export const industryList = (l: Locale) => homeCopy(l).industries.items.map((i) => ({ slug: i.slug, label: i.label }));
export const cityLabel = (slug: string | null, l: Locale) => (slug ? cityList(l).find((c) => c.slug === slug)?.label ?? slug : "");
export const industryLabel = (slug: string | null, l: Locale) => (slug ? industryList(l).find((c) => c.slug === slug)?.label ?? slug : "");

export const fmtDate = (iso: string | null, l: Locale) =>
  iso ? new Date(iso).toLocaleDateString(l === "ar" ? "ar-IQ-u-nu-latn" : "en-GB", { year: "numeric", month: "short", day: "numeric" }) : "";

export function fmtSalary(j: Pick<JobRow, "salary_min" | "salary_max" | "salary_currency">): string | null {
  if (j.salary_min == null && j.salary_max == null) return null;
  const n = (v: number) => v.toLocaleString("en-US");
  const range = j.salary_min != null && j.salary_max != null ? `${n(j.salary_min)} – ${n(j.salary_max)}` : n((j.salary_min ?? j.salary_max)!);
  return `${range} ${j.salary_currency ?? ""}`.trim();
}

/** Allowed closing-date window for a new job: today .. +180 days (ISO dates, same rule as the database guard). */
export function deadlineWindow(): { min: string; max: string } {
  const now = Date.now();
  return { min: new Date(now).toISOString().slice(0, 10), max: new Date(now + 180 * 86_400_000).toISOString().slice(0, 10) };
}
