"use server";

import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { newReference } from "@/lib/reference";
import { abuseDetails, consultingDetails, inquiryBase, recruitmentDetails } from "@/lib/validation";

export type InquiryState =
  | { status: "idle" }
  | { status: "error"; errors: Record<string, string>; form?: string }
  | { status: "success"; reference: string };

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v : undefined;
};

export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const raw = Object.fromEntries(
    ["kind", "full_name", "email", "phone", "company_name", "subject", "message", "consent", "website"].map(
      (k) => [k, str(formData, k)],
    ),
  );
  const base = inquiryBase.safeParse(raw);
  const errors: Record<string, string> = {};
  if (!base.success) {
    for (const i of base.error.issues) errors[String(i.path[0])] = i.message;
  }

  // Per-kind details
  let details: Record<string, unknown> = {};
  const kind = raw.kind;
  if (kind === "recruitment_service") {
    const d = recruitmentDetails.safeParse({
      industry: str(formData, "industry"), vacancies: str(formData, "vacancies"),
      locations: str(formData, "locations"), timeline: str(formData, "timeline"),
    });
    if (d.success) details = d.data; else for (const i of d.error.issues) errors[String(i.path[0])] = i.message;
  } else if (kind === "career_consulting") {
    const d = consultingDetails.safeParse({ service: str(formData, "service") });
    if (d.success) details = d.data; else for (const i of d.error.issues) errors[String(i.path[0])] = i.message;
  } else if (kind === "abuse_report") {
    const d = abuseDetails.safeParse({ target: str(formData, "target") });
    if (d.success) details = d.data; else for (const i of d.error.issues) errors[String(i.path[0])] = i.message;
  }

  if (Object.keys(errors).length || !base.success) return { status: "error", errors };

  // Honeypot filled: pretend success without storing anything.
  if (base.data.website) return { status: "success", reference: newReference() };

  const supabase = await createClient().catch(() => null);
  if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { status: "error", errors: {}, form: "unavailable" };
  }
  const locale = await getLocale();

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = newReference();
    const { error } = await supabase.from("inquiries").insert({
      reference,
      kind: base.data.kind,
      full_name: base.data.full_name,
      email: base.data.email,
      phone: base.data.phone ?? null,
      company_name: base.data.company_name ?? null,
      subject: base.data.subject ?? null,
      message: base.data.message,
      details,
      locale,
      privacy_consent: true,
    });
    if (!error) return { status: "success", reference };
    if (error.code === "23505") continue; // reference collision: try a new one
    if (error.message?.includes("too many submissions")) return { status: "error", errors: {}, form: "rate" };
    return { status: "error", errors: {}, form: "server" };
  }
  return { status: "error", errors: {}, form: "server" };
}
