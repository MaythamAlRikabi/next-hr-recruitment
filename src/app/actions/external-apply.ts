"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRoles, getViewer, siteOrigin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyViaNextEnabled, sendMail, type MailAttachment } from "@/lib/mail";
import { criterionText, type Fit } from "@/lib/eligibility";
import { collect, dbError, fail, field, hasBackend, type OpState } from "@/lib/ops";

const schema = z.object({
  external_job_id: z.string().uuid("invalid"),
  cover_note: z.string().trim().max(2000, "long").optional().transform((v) => v || undefined),
  resume_id: z.string().optional().transform((v) => (v && /^[0-9a-f-]{36}$/i.test(v) ? v : undefined)),
  consent: z.literal("on", { message: "required" }),
});

type Job = { id: string; title: string; agency: string | null; apply_email: string | null; language: string };

/** Message text in the language of the ad. Only what the candidate saw in the preview and agreed to is included. */
function body(job: Job, who: { name: string; email: string; phone: string | null; headline: string | null }, ref: string, fit: Fit, note: string | undefined, link: string, hasCv: boolean) {
  const ar = job.language !== "en";
  const loc = ar ? "ar" : "en";
  const rows = fit.results.map((r) => `${r.met ? "✔" : "✘"} ${criterionText(r, loc)}${r.verified ? (ar ? " (موثّق من NEXT)" : " (verified by NEXT)") : ""}`);
  const L = ar
    ? { hello: "السادة المحترمون،", intro: `وصلكم هذا الطلب عبر منصة NEXT | HR & Recruitment للإعلان: «${job.title}».`, cand: "المتقدم", mail: "البريد", phone: "الهاتف", head: "النبذة", cv: hasCv ? "السيرة الذاتية مرفقة." : "لم يرفق المتقدم سيرة ذاتية.", cond: fit.results.length ? `الشروط (${fit.required_met} من ${fit.required_total} أساسية مستوفاة — حسب بيانات المتقدم):` : "", note: "رسالة المتقدم:", ref: `رمز المرجع: NX-${ref}`, check: `للتحقق من أن الطلب وصل عبر NEXT: ${link}`, reply: "للتواصل مع المتقدم اضغطوا «رد» على هذه الرسالة." }
    : { hello: "Dear hiring team,", intro: `This application for “${job.title}” reached you through NEXT | HR & Recruitment.`, cand: "Candidate", mail: "E-mail", phone: "Phone", head: "Headline", cv: hasCv ? "CV attached." : "No CV attached.", cond: fit.results.length ? `Conditions (${fit.required_met} of ${fit.required_total} required met — as declared by the candidate):` : "", note: "Candidate's note:", ref: `Reference: NX-${ref}`, check: `Verify this came through NEXT: ${link}`, reply: "Reply to this e-mail to contact the candidate." };
  return [
    L.hello, "", L.intro, "",
    `${L.cand}: ${who.name}`, `${L.mail}: ${who.email}`, who.phone ? `${L.phone}: ${who.phone}` : "", who.headline ? `${L.head}: ${who.headline}` : "",
    "", L.cv, "",
    ...(rows.length ? [L.cond, ...rows, ""] : []),
    ...(note ? [L.note, note, ""] : []),
    L.ref, L.check, "", L.reply,
  ].filter((x, i, a) => !(x === "" && a[i - 1] === "")).join("\n");
}

/** Sends the candidate's CV to the ad's own e-mail through NEXT. The row (with eligibility check + daily limit) is created by the database first. */
export async function applyExternal(_p: OpState, fd: FormData): Promise<OpState> {
  const parsed = schema.safeParse({ external_job_id: field(fd, "external_job_id"), cover_note: field(fd, "cover_note"), resume_id: field(fd, "resume_id"), consent: field(fd, "consent") });
  if (!parsed.success) return { status: "error", errors: collect(parsed.error.issues) };
  if (!hasBackend() || !applyViaNextEnabled()) return fail("unavailable");
  const viewer = await getViewer();
  if (!viewer || !viewer.email) return fail("session");
  if (!(await getRoles(viewer.id)).includes("candidate")) return fail("not_allowed");
  const admin = createAdminClient();
  if (!admin) return fail("unavailable");
  const supabase = await createClient();
  const d = parsed.data;

  const { data: job } = await supabase.from("external_job_listings").select("id, title, agency, apply_email, language").eq("id", d.external_job_id).maybeSingle();
  if (!job?.apply_email) return fail("not_open");

  // A failed delivery can be retried: remove the candidate's own FAILED row first (RLS allows only that).
  await supabase.from("external_applications").delete().eq("external_job_id", job.id).eq("candidate_id", viewer.id).eq("status", "failed");

  const { data: row, error } = await supabase.from("external_applications")
    .insert({ external_job_id: job.id, candidate_id: viewer.id, cover_note: d.cover_note ?? null, resume_id: d.resume_id ?? null })
    .select("id, ref_code, eligibility").single();
  if (error || !row) {
    if (error?.message === "not_eligible" || error?.message === "not_open" || error?.message === "daily_limit") return fail(error.message);
    return fail(error?.code === "23505" ? "duplicate" : dbError(error));
  }
  const giveUp = async (code: string, detail: string) => { await admin.rpc("mark_external_application", { _id: row.id, _status: "failed", _error: detail }); return fail(code); };

  const [{ data: prof }, { data: cp }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", viewer.id).maybeSingle(),
    supabase.from("candidate_profiles").select("headline").eq("user_id", viewer.id).maybeSingle(),
  ]);

  const attachments: MailAttachment[] = [];
  if (row && d.resume_id) {
    const { data: r } = await supabase.from("resumes").select("storage_path, file_name, size_bytes").eq("id", d.resume_id).eq("user_id", viewer.id).maybeSingle();
    if (!r) return giveUp("not_found", "resume_missing");
    const dl = await supabase.storage.from("resumes").download(r.storage_path);
    if (dl.error || !dl.data) return giveUp("upload_missing", "resume_download");
    const buf = Buffer.from(await dl.data.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return giveUp("file_size", "resume_size");
    attachments.push({ filename: r.file_name, content: buf.toString("base64") });
  }

  const link = `${await siteOrigin()}/verify/${row.ref_code}`;
  const fit = row.eligibility as Fit;
  const text = body(job as Job, { name: prof?.full_name ?? viewer.email, email: viewer.email, phone: prof?.phone ?? null, headline: cp?.headline ?? null }, row.ref_code, fit, d.cover_note, link, attachments.length > 0);
  const ar = job.language !== "en";
  const sent = await sendMail({
    to: job.apply_email, replyTo: viewer.email, attachments,
    subject: ar ? `طلب توظيف — ${job.title} — NX-${row.ref_code}` : `Application — ${job.title} — NX-${row.ref_code}`, text,
  });
  if (!sent.ok) return giveUp("mail_failed", sent.error);
  await admin.rpc("mark_external_application", { _id: row.id, _status: "sent" });
  revalidatePath("/candidate");
  revalidatePath(`/jobs/external/${job.id}/apply`);
  return { status: "success" };
}
