import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { cityLabel, fmtDate } from "@/lib/jobs";
import { EmployerShell } from "@/components/layout/EmployerShell";
import { ApplicationStatusForm, JobStatusButton } from "@/components/forms/EmpForms";
import { badgeBrand, badgeSuccess, btnSecondary, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Job", robots: { index: false } };
type Props = { params: Promise<{ id: string }> };

export default async function EmployerJobPage({ params }: Props) {
  const { id } = await params;
  await requireRole(["employer"], `/employer/jobs/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const locale = await getLocale();
  const L = ops[locale];
  const e = L.emp;
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs")
    .select("id, title, description, status, city, recruitment_method, created_at").eq("id", id).maybeSingle();
  if (!job) notFound();
  const { data: apps } = await supabase.from("applications").select("id, candidate_id, status, cover_note, created_at").eq("job_id", id).order("created_at", { ascending: false });
  const ids = (apps ?? []).map((a) => a.candidate_id);
  const people = new Map<string, { full_name: string | null; phone: string | null }>();
  if (ids.length) {
    const { data: ps } = await supabase.from("profiles").select("id, full_name, phone").in("id", ids);
    (ps ?? []).forEach((p) => people.set(p.id, p));
  }
  return (
    <EmployerShell L={L} active="/employer" title={job.title} intro={`${e.jobStatus[job.status] ?? job.status}${job.city ? ` · ${cityLabel(job.city, locale)}` : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/employer" className={btnSecondary}>{L.common.back}</Link>
        {job.status === "draft" ? <JobStatusButton id={job.id} to="pending_review" label={e.sendForReview} L={L} /> : null}
        {["draft", "pending_review", "published"].includes(job.status) ? <JobStatusButton id={job.id} to="closed" label={e.closeJob} L={L} /> : null}
        {job.status === "published" ? <Link href={`/jobs/${job.id}`} className={btnSecondary}>{e.open}</Link> : null}
      </div>
      <p className="whitespace-pre-line text-sm text-ink">{job.description}</p>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-brand-dark">{e.applicantsTitle} ({apps?.length ?? 0})</h2>
        {apps?.length ? (
          <ul className="space-y-3">
            {apps.map((a) => {
              const p = people.get(a.candidate_id);
              return (
                <li key={a.id} className={`${cardCls} space-y-3`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{p?.full_name ?? "—"}</p>
                      {p?.phone ? <p className="text-sm text-muted" dir="ltr">{p.phone}</p> : null}
                      <p className="text-xs text-muted">{fmtDate(a.created_at, locale)}</p>
                    </div>
                    <span className={a.status === "hired" ? badgeSuccess : badgeBrand}>{e.appStatus[a.status] ?? a.status}</span>
                  </div>
                  {a.cover_note ? <p className="whitespace-pre-line rounded-xl bg-surface p-3 text-sm"><strong>{e.coverNote}: </strong>{a.cover_note}</p> : null}
                  {a.status !== "withdrawn" ? <ApplicationStatusForm id={a.id} current={a.status} L={L} /> : null}
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-muted">{e.noApplicants}</p>}
      </section>
    </EmployerShell>
  );
}
