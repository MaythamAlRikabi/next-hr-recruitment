import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { v3 } from "@/content/v3";
import { cityList, fmtDate, industryList } from "@/lib/jobs";
import { EmployerShell } from "@/components/layout/EmployerShell";
import { CompanyForm } from "@/components/forms/EmpForms";
import { Briefcase, CircleCheck, UsersRound } from "lucide-react";
import { KpiCard } from "@/components/ui/kit";
import { StatusNote } from "@/components/ui/PageHeader";
import { badgeBrand, badgeSuccess, badgeWarning, btnPrimary, btnSecondary, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Employer", robots: { index: false } };

export default async function EmployerPage() {
  const { viewer } = await requireRole(["employer"], "/employer");
  const locale = await getLocale();
  const L = ops[locale];
  const K = v3[locale].kpi;
  const e = L.emp;
  const supabase = await createClient();
  const [{ data: profile }, { data: companies }, { data: jobs }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", viewer.id).maybeSingle(),
    supabase.from("companies").select("id, name, verification").order("created_at"),
    supabase.from("jobs").select("id, title, status, company_id, created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  const jobIds = (jobs ?? []).map((j) => j.id);
  const counts = new Map<string, number>();
  if (jobIds.length) {
    const { data: apps } = await supabase.from("applications").select("job_id").in("job_id", jobIds);
    (apps ?? []).forEach((a) => counts.set(a.job_id, (counts.get(a.job_id) ?? 0) + 1));
  }
  const approved = (companies ?? []).some((c) => c.verification === "approved");
  const tone = (s: string) => (s === "approved" ? badgeSuccess : s === "pending" || s === "needs_info" ? badgeWarning : badgeBrand);
  return (
    <EmployerShell L={L} active="/employer" title={`${e.hello}${profile?.full_name ? `، ${profile.full_name}` : ""}`} intro={e.intro}>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-brand-dark">{e.companyTitle}</h2>
        {companies?.length ? (
          <>
            <ul className="space-y-3">
              {companies.map((c) => (
                <li key={c.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                  <span className="font-semibold text-ink">{c.name}</span>
                  <span className={tone(c.verification)}>{e.verification[c.verification] ?? c.verification}</span>
                </li>
              ))}
            </ul>
            {!approved ? <StatusNote>{e.notApprovedNote}</StatusNote> : null}
            <div className="flex flex-wrap gap-3">
              <Link href="/employer/jobs/new" className={btnPrimary}>{e.nav.newJob}</Link>
              <Link href="/employer/request" className={btnSecondary}>{e.nav.request}</Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">{e.noCompany}</p>
            <CompanyForm L={L} cities={cityList(locale)} industries={industryList(locale)} />
          </>
        )}
      </section>
      {companies?.length ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard icon={Briefcase} label={K.jobs} value={jobs?.length ?? 0} />
          <KpiCard icon={CircleCheck} label={K.published} value={(jobs ?? []).filter((j) => j.status === "published").length} tone="success" />
          <KpiCard icon={UsersRound} label={K.received} value={[...counts.values()].reduce((a, b) => a + b, 0)} tone="violet" />
        </div>
      ) : null}
      {companies?.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-brand-dark">{e.jobsTitle}</h2>
          {jobs?.length ? (
            <ul className="space-y-3">
              {jobs.map((j) => (
                <li key={j.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                  <div>
                    <Link href={`/employer/jobs/${j.id}`} className="font-semibold text-brand underline underline-offset-4 hover:no-underline">{j.title}</Link>
                    <p className="text-xs text-muted">{fmtDate(j.created_at, locale)} · {e.applicants}: {counts.get(j.id) ?? 0}</p>
                  </div>
                  <span className={j.status === "published" ? badgeSuccess : badgeBrand}>{e.jobStatus[j.status] ?? j.status}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{e.jobsEmpty}</p>}
        </section>
      ) : null}
    </EmployerShell>
  );
}
