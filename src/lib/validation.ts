import { z } from "zod";

const trimmed = (min: number, max: number) =>
  z.string().trim().min(min, "short").max(max, "long");

const optionalText = (max: number) =>
  z.string().trim().max(max, "long").optional().transform((v) => (v ? v : undefined));

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "phone")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const emailSchema = z.string().trim().toLowerCase().max(254, "long").email("email");

export const inquiryBase = z.object({
  kind: z.enum(["contact", "recruitment_service", "career_consulting", "abuse_report"]),
  full_name: trimmed(2, 120),
  email: emailSchema,
  phone: phoneSchema,
  company_name: optionalText(160),
  subject: optionalText(200),
  message: trimmed(10, 5000),
  consent: z.literal("on", { error: "consent" }),
  website: z.string().max(0).optional(), // honeypot: real users leave it empty
});

export const recruitmentDetails = z.object({
  industry: optionalText(120),
  vacancies: z.coerce.number().int().min(1, "number").max(1000, "number"),
  locations: trimmed(2, 300),
  timeline: z.enum(["asap", "1_month", "1_3_months", "3_plus_months"], { error: "required" }),
});

export const consultingDetails = z.object({
  service: z.enum(["consultation", "cv_review", "interview_prep", "profile_review"], { error: "required" }),
});

export const abuseDetails = z.object({
  target: optionalText(500),
});

/** Allow only same-site relative redirect targets (blocks open redirects). */
export function safeNext(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u0020\u007f]/.test(value)) return fallback;
  return value;
}

export const passwordSchema = z
  .string()
  .min(8, "pw_short")
  .max(72, "pw_long")
  .regex(/[A-Za-z]/, "pw_weak")
  .regex(/[0-9]/, "pw_weak");

export const signUpSchema = z
  .object({
    full_name: trimmed(2, 120),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    purpose: z.enum(["candidate", "employer"], { error: "required" }),
    terms: z.literal("on", { error: "consent" }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "mismatch" });

export const signInSchema = z.object({ email: emailSchema, password: z.string().min(1, "required").max(200) });
export const resetRequestSchema = z.object({ email: emailSchema });
export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "mismatch" });
export const profileSchema = z.object({
  full_name: trimmed(2, 120),
  phone: z.string().trim().regex(/^\+964[0-9]{9,10}$/, "phone_iq").optional().or(z.literal("").transform(() => undefined)),
});
export const deletionSchema = z.object({ reason: optionalText(1000), confirm: z.literal("on", { error: "consent" }) });
