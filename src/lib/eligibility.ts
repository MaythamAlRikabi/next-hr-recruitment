/**
 * "Eligible to apply" — shared types, controlled lists and wording.
 * The check itself lives in the database (private.job_fit_for, called by the apply trigger and by public.job_fit),
 * so the page, the API and the trigger can never disagree. Everything here is display + input validation.
 */
import { z } from "zod";
import type { Locale } from "@/lib/i18n";

export const LEVELS = [
  { slug: "high_school", ar: "ثانوية", en: "High school" },
  { slug: "diploma", ar: "دبلوم", en: "Diploma" },
  { slug: "bachelor", ar: "بكالوريوس", en: "Bachelor's" },
  { slug: "master", ar: "ماجستير", en: "Master's" },
  { slug: "doctorate", ar: "دكتوراه", en: "Doctorate" },
] as const;

/** One controlled list for study fields and work fields (so "pharmacy" always means the same thing). */
export const FIELDS = [
  { slug: "pharmacy", ar: "الصيدلة", en: "Pharmacy" },
  { slug: "medicine", ar: "الطب", en: "Medicine" },
  { slug: "dentistry", ar: "طب الأسنان", en: "Dentistry" },
  { slug: "nursing", ar: "التمريض", en: "Nursing" },
  { slug: "medical-lab", ar: "المختبرات الطبية", en: "Medical laboratory" },
  { slug: "medical-rep", ar: "التمثيل الطبي (مندوب علمي)", en: "Medical representation" },
  { slug: "sales", ar: "المبيعات", en: "Sales" },
  { slug: "marketing", ar: "التسويق", en: "Marketing" },
  { slug: "customer-service", ar: "خدمة العملاء", en: "Customer service" },
  { slug: "accounting", ar: "المحاسبة والمالية", en: "Accounting & finance" },
  { slug: "business", ar: "إدارة الأعمال", en: "Business administration" },
  { slug: "hr", ar: "الموارد البشرية", en: "Human resources" },
  { slug: "engineering", ar: "الهندسة", en: "Engineering" },
  { slug: "it", ar: "تقنية المعلومات", en: "Information technology" },
  { slug: "logistics", ar: "اللوجستيات", en: "Logistics" },
  { slug: "law", ar: "القانون", en: "Law" },
  { slug: "education", ar: "التعليم", en: "Education" },
  { slug: "admin", ar: "الإدارة والسكرتارية", en: "Administration" },
] as const;

const FIELD_SLUGS = FIELDS.map((f) => f.slug) as [string, ...string[]];
const LEVEL_SLUGS = LEVELS.map((l) => l.slug) as [string, ...string[]];

export const fieldLabel = (slug: string, l: Locale) => FIELDS.find((f) => f.slug === slug)?.[l] ?? slug;
export const levelLabel = (slug: string, l: Locale) => LEVELS.find((x) => x.slug === slug)?.[l] ?? slug;

export type Criterion =
  | { kind: "education"; field?: string; level?: string; required: boolean }
  | { kind: "experience"; field: string; min_years?: number; required: boolean };
export type FitItem = Criterion & { met: boolean; verified?: boolean; have_months?: number };
export type Verification = "none" | "pending" | "verified" | "rejected";
export type Fit = { eligible: boolean; required_total: number; required_met: number; results: FitItem[] };

/** Rules an employer may add when posting a job (max 8, same limit as the database). */
export const criterionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("education"),
    field: z.enum(FIELD_SLUGS).optional(),
    level: z.enum(LEVEL_SLUGS).optional(),
    required: z.boolean(),
  }).refine((c) => !!c.field || !!c.level, { message: "invalid" }),
  z.object({
    kind: z.literal("experience"),
    field: z.enum(FIELD_SLUGS),
    min_years: z.number().min(0).max(40).multipleOf(0.5).optional(),
    required: z.boolean(),
  }),
]);
export const criteriaSchema = z.array(criterionSchema).max(8);

/** Reads the JSON a form posts; null means invalid. Empty input = no conditions. */
export function parseCriteria(raw: string | undefined): Criterion[] | null {
  if (!raw || !raw.trim()) return [];
  try {
    const r = criteriaSchema.safeParse(JSON.parse(raw));
    return r.success ? (r.data as Criterion[]) : null;
  } catch {
    return null;
  }
}

export function yearsText(years: number, l: Locale): string {
  const whole = Math.floor(years);
  const half = years - whole >= 0.5;
  if (l === "en") return `${years} ${years === 1 ? "year" : "years"}`;
  const base = whole === 0 ? "" : whole === 1 ? "سنة" : whole === 2 ? "سنتان" : whole <= 10 ? `${whole} سنوات` : `${whole} سنة`;
  if (!half) return base;
  return whole === 0 ? "نصف سنة" : `${base} ونصف`;
}

export function monthsText(months: number, l: Locale): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (l === "en") return [y ? `${y} y` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ") || "0";
  const mt = m === 1 ? "شهر" : m === 2 ? "شهران" : `${m} أشهر`;
  const yt = y ? yearsText(y, l) : "";
  return [yt, m ? mt : ""].filter(Boolean).join(" و") || "0";
}

/** One condition in a sentence, e.g. "بكالوريوس فأعلى في الصيدلة" or "خبرة في المبيعات لا تقل عن سنتين". */
export function criterionText(c: Criterion, l: Locale): string {
  if (c.kind === "education") {
    const f = c.field ? fieldLabel(c.field, l) : "";
    const lv = c.level ? levelLabel(c.level, l) : "";
    if (l === "en") return [lv ? `${lv} or higher` : "Degree", f ? `in ${f}` : ""].filter(Boolean).join(" ");
    return [lv ? `${lv} فأعلى` : "شهادة", f ? `في ${f}` : ""].filter(Boolean).join(" ");
  }
  const f = fieldLabel(c.field, l);
  if (l === "en") return `Experience in ${f}${c.min_years ? `: at least ${yearsText(c.min_years, l)}` : ""}`;
  return `خبرة في ${f}${c.min_years ? ` لا تقل عن ${yearsText(c.min_years, l).replace("سنتان", "سنتين")}` : ""}`;
}
