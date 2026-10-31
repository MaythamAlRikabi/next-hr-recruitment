import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Clock, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { getRoles, getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { badgeBrand, badgeViolet, btnPrimary, btnSecondary, cardCls } from "@/components/ui/styles";
import { ApplyForm, SaveJobButton, type ApplyResume } from "@/components/forms/OpForms";
import { ops } from "@/content/ops";
import { fit as fitCopy } from "@/content/fit";
import { ConditionsCard, NotEligibleCard } from "@/components/jobs/Conditions";
import { parseCriteria, type Fit } from "@/lib/eligibility";
import { Check } from "lucide-react";
import { cityLabel, fmtDate, fmtSalary, industryLabel, type JobRow } from "@/lib/jobs";

type Props = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function load(id: string): Promise<JobRow | null> {
  if (!UUID.test(id) || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("job_listings").select("*").eq("id", id).maybeSingle();
    return (data as JobRow | null) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const j = await load(id);
  if (!j) return { title: "Job", robots: { index: false } };
  return { title: j.title, description: j.description.slice(0, 160), alternates: { canonical: `/jobs/${id}` } };
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  const { locale } = await pageCtx();
  const L = ops[locale];
  const j = await load(id);
  if (!j) {
    return (
      <>
        <PageHeader title={L.jobs.notFoundTitle} intro={L.jobs.notFoundBody} />
        <Section><Link href="/jobs" className={btnPrimary}>{L.jobs.allJobs}</Link></Section>
      </>
    );
  }
  const salary = fmtSalary(j);
  const viewer = await getViewer();
  const roles = viewer ? await getRoles(viewer.id) : [];
  const canApply = !!viewer && roles.includes("candidate");
  let applied = false;
  let resumes: ApplyResume[] = [];
  let profileFilled = false;
  let savedJob = false;
  if (canApply && viewer) {
    const supabase = await createClient();
    const [{ data }, { data: rs }, { data: cp }, { data: sv }] = await Promise.all([
      supabase.from("applications").select("id").eq("job_id", j.id).eq("candidate_id", viewer.id).maybeSingle(),
      supabase.from("resumes").select("id, file_name, is_primary").eq("user_id", viewer.id).order("is_primary", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("candidate_profiles").select("headline, summary").eq("user_id", viewer.id).maybeSingle(),
      supabase.from("saved_jobs").select("job_id").eq("job_id", j.id).eq("user_id", viewer.id).maybeSingle(),
    ]);
    savedJob = !!sv;
    applied = !!data;
    resumes = (rs ?? []) as ApplyResume[];
    profileFilled = !!(cp?.headline || cp?.summary);
  }
  const criteria = parseCriteria(JSON.stringify(j.criteria ?? [])) ?? [];
  const F = fitCopy[locale];
  let fit: Fit | null = null;
  if (canApply && !applied && criteria.length) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("job_fit", { _job: j.id });
    fit = (data as Fit | null) ?? null;
  }
  const next = encodeURIComponent(`/jobs/${j.id}`);
  return (
    <>
      <PageHeader title={j.title} intro={j.employer_hidden || !j.company_name ? L.jobs.confidential : j.company_name} />
      <Section className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <article className="space-y-6">
          <ul className="flex flex-wrap gap-2">
            {j.recruitment_method === "next_managed" ? <li><span className={badgeViolet}><ShieldCheck className="size-3.5" aria-hidden />{L.jobs.managedBadge}</span></li> : null}
            {j.industry ? <li><span className={badgeBrand}>{industryLabel(j.industry, locale)}</span></li> : null}
          </ul>
          <dl className={`${cardCls} grid gap-4 sm:grid-cols-2`}>
            {j.city ? <div><dt className="flex items-center gap-1.5 text-xs text-muted"><MapPin className="size-4" aria-hidden />{L.jobs.city}</dt><dd className="font-medium">{cityLabel(j.city, locale)}</dd></div> : null}
            <div><dt className="flex items-center gap-1.5 text-xs text-muted"><Briefcase className="size-4" aria-hidden />{L.jobs.type}</dt><dd className="font-medium">{L.jobs.types[j.employment_type] ?? j.employment_type} · {L.jobs.modes[j.work_mode] ?? j.work_mode}</dd></div>
            {j.seniority ? <div><dt className="text-xs text-muted">{L.jobs.level}</dt><dd className="font-medium">{L.jobs.levels[j.seniority] ?? j.seniority}</dd></div> : null}
            {salary ? <div><dt className="flex items-center gap-1.5 text-xs text-muted"><Wallet className="size-4" aria-hidden />{L.jobs.salary}</dt><dd className="font-medium" dir="ltr">{salary}</dd></div> : null}
            {j.published_at ? <div><dt className="flex items-center gap-1.5 text-xs text-muted"><Clock className="size-4" aria-hidden />{L.jobs.posted}</dt><dd className="font-medium">{fmtDate(j.published_at, locale)}</dd></div> : null}
            {j.deadline ? <div><dt className="text-xs text-muted">{L.jobs.deadline}</dt><dd className="font-medium">{fmtDate(j.deadline, locale)}</dd></div> : null}
          </dl>
          {j.recruitment_method === "next_managed" ? <p className="rounded-xl bg-violet/10 px-4 py-3 text-sm text-violet-ink">{L.jobs.managedNote}</p> : null}
          <section>
            <h2 className="text-xl font-bold text-brand-dark">{L.jobs.description}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{j.description}</p>
          </section>
          <ConditionsCard criteria={criteria} fit={fit} locale={locale} L={F} />
          {j.requirements ? (
            <section>
              <h2 className="text-xl font-bold text-brand-dark">{L.jobs.requirements}</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{j.requirements}</p>
            </section>
          ) : null}
        </article>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {!viewer ? (
            <div className={`${cardCls} space-y-3`}>
              <h2 className="text-lg font-semibold text-brand-dark">{L.apply.title}</h2>
              <p className="text-sm text-muted">{L.apply.signedOut}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/login?next=${next}`} className={btnPrimary}>{L.common.signInToApply}</Link>
                <Link href="/register" className={btnSecondary}>{L.common.register}</Link>
              </div>
            </div>
          ) : !canApply ? (
            <p className={`${cardCls} text-sm text-muted`}>{L.apply.needCandidate}</p>
          ) : applied ? (
            <div className={`${cardCls} space-y-3`} role="status">
              <h2 className="text-lg font-semibold text-success">{L.apply.done}</h2>
              <p className="text-sm text-muted">{L.apply.doneBody}</p>
              <Link href="/candidate" className={btnSecondary}>{L.apply.track}</Link>
            </div>
          ) : fit && !fit.eligible ? (
            <>
              <NotEligibleCard fit={fit} criteria={criteria} locale={locale} L={F} />
              <SaveJobButton jobId={j.id} saved={savedJob} L={L} />
            </>
          ) : (
            <>
              {fit?.eligible ? (
                <p className="flex items-center gap-2 rounded-xl bg-success-fill/15 px-4 py-3 text-sm font-semibold text-success" role="status">
                  <Check className="size-4" aria-hidden />{F.meet}
                </p>
              ) : null}
              <ApplyForm jobId={j.id} L={L} resumes={resumes} profileFilled={profileFilled} />
              <SaveJobButton jobId={j.id} saved={savedJob} L={L} />
              <p className="text-xs text-muted">{L.apply.cvHint} <Link href="/candidate/cv" className="text-brand underline underline-offset-4 hover:no-underline">{L.apply.addCv}</Link></p>
            </>
          )}
        </aside>
      </Section>
    </>
  );
}
