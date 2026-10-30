import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { v3 } from "@/content/v3";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { SubNav } from "@/components/layout/SubNav";
import { Briefcase, FileText, UserCheck } from "lucide-react";
import { EmptyState, KpiCard, ProgressBar, StepList } from "@/components/ui/kit";
import { ConsentRespond, WithdrawButton } from "@/components/forms/OpForms";
import { badgeBrand, badgeSuccess, badgeWarning, btnPrimary, cardCls } from "@/components/ui/styles";
import { fmtDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "Candidate", robots: { index: false } };

export default async function CandidatePage() {
  const { viewer } = await requireRole(["candidate"], "/candidate");
  const locale = await getLocale();
  const L = ops[locale];
  const K = v3[locale].kpi;
  const c = L.cand;
  const supabase = await createClient();
  const [{ data: profile }, { data: cp }, { count: cvCount }, { data: apps }, { data: consent }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", viewer.id).maybeSingle(),
    supabase.from("candidate_profiles").select("headline, resume_visibility").eq("user_id", viewer.id).maybeSingle(),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", viewer.id),
    supabase.from("applications").select("id, job_id, status, created_at").eq("candidate_id", viewer.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("talent_pool_consents").select("action").eq("user_id", viewer.id).order("id", { ascending: false }).limit(1),
  ]);
  const { data: consents } = await supabase.from("my_consent_requests").select("item_id, consent_status, company_name, created_at").order("created_at", { ascending: false });
  const ids = (apps ?? []).map((a) => a.job_id);
  const titles = new Map<string, string>();
  if (ids.length) {
    const { data: jobs } = await supabase.from("job_listings").select("id, title").in("id", ids);
    (jobs ?? []).forEach((j) => titles.set(j.id as string, j.title as string));
  }
  const poolDecided = consent?.[0]?.action != null;
  const steps = [
    { label: c.stepName, done: !!profile?.full_name },
    { label: c.stepPhone, done: !!profile?.phone },
    { label: c.stepHeadline, done: !!cp?.headline },
    { label: c.stepCv, done: (cvCount ?? 0) > 0 },
    { label: c.stepPool, done: poolDecided },
  ];
  const pct = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
  const tone = (s: string) => (s === "hired" || s === "offer" ? badgeSuccess : s === "rejected" || s === "withdrawn" ? badgeWarning : badgeBrand);
  return (
    <>
      <PageHeader title={`${c.hello}${profile?.full_name ? `، ${profile.full_name}` : ""}`} intro={c.intro} />
      <Section className="space-y-8">
        <SubNav label={c.dash} active="/candidate" items={[
          { href: "/candidate", label: c.dash }, { href: "/candidate/profile", label: c.links.profile },
          { href: "/candidate/cv", label: c.links.cv }, { href: "/candidate/saved", label: c.links.saved }, { href: "/account", label: c.links.account },
        ]} />
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard icon={Briefcase} label={K.applications} value={apps?.length ?? 0} />
          <KpiCard icon={FileText} label={K.cvs} value={cvCount ?? 0} tone="violet" />
          <KpiCard icon={UserCheck} label={c.completion} value={`${pct}%`} tone="success" />
        </div>
        <div className={`${cardCls} space-y-4`}>
          <h2 className="t-h4 text-midnight">{c.completion}: <span dir="ltr">{pct}%</span></h2>
          <ProgressBar value={pct} label={c.completion} />
          <StepList steps={steps} doneLabel={c.done} todoLabel={c.todo} />
        </div>
        {consents?.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-brand-dark">{c.consentTitle}</h2>
            <p className="text-sm text-muted">{c.consentBody}</p>
            <ul className="space-y-3">
              {consents.map((r) => (
                <li key={r.item_id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                  <div>
                    <p className="font-semibold text-ink">{c.consentFor}: {r.company_name ?? c.consentConfidential}</p>
                    <p className="text-xs text-muted">{c.consentState[r.consent_status] ?? r.consent_status}</p>
                  </div>
                  {r.consent_status === "pending" || r.consent_status === "granted" ? <ConsentRespond id={r.item_id} granted={r.consent_status === "granted"} L={L} /> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <section>
          <h2 className="text-xl font-bold text-brand-dark">{c.appsTitle}</h2>
          {apps?.length ? (
            <ul className="mt-4 space-y-3">
              {apps.map((a) => (
                <li key={a.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                  <div>
                    {titles.has(a.job_id) ? <Link href={`/jobs/${a.job_id}`} className="font-semibold text-brand underline underline-offset-4 hover:no-underline">{titles.get(a.job_id)}</Link>
                      : <span className="font-semibold text-ink">{c.jobGone}</span>}
                    <p className="text-xs text-muted">{c.appliedOn} {fmtDate(a.created_at, locale)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={tone(a.status)}>{c.status[a.status] ?? a.status}</span>
                    {!["hired", "rejected", "withdrawn"].includes(a.status) ? <WithdrawButton id={a.id} L={L} /> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState icon={Briefcase} title={c.appsTitle} body={c.appsEmpty}>
                <Link href="/jobs" className={btnPrimary}>{c.findJobs}</Link>
              </EmptyState>
            </div>
          )}
        </section>
      </Section>
    </>
  );
}
