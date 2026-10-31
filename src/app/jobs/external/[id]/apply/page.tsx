import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoles, getViewer } from "@/lib/auth";
import { pageCtx } from "@/lib/page";
import { createClient } from "@/lib/supabase/server";
import { applyViaNextEnabled } from "@/lib/mail";
import { parseCriteria, type Fit } from "@/lib/eligibility";
import { ops } from "@/content/ops";
import { fit as fitCopy } from "@/content/fit";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { btnPrimary, btnSecondary, cardCls } from "@/components/ui/styles";
import { ConditionsCard, NotEligibleCard } from "@/components/jobs/Conditions";
import { ExternalApplyForm } from "@/components/forms/ExternalApplyForm";
import type { ApplyResume } from "@/components/forms/OpForms";
import { fmtDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "Apply", robots: { index: false } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ExternalApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id) || !applyViaNextEnabled()) notFound();
  const { locale } = await pageCtx();
  const O = ops[locale]; const F = fitCopy[locale];
  const supabase = await createClient();
  const { data: job } = await supabase.from("external_job_listings").select("id, title, agency, client_note, apply_email, criteria").eq("id", id).maybeSingle();
  if (!job?.apply_email) notFound();
  const criteria = parseCriteria(JSON.stringify(job.criteria ?? [])) ?? [];
  const viewer = await getViewer();
  const isCandidate = !!viewer && (await getRoles(viewer.id)).includes("candidate");
  const next = encodeURIComponent(`/jobs/external/${id}/apply`);

  let body: React.ReactNode;
  let fit: Fit | null = null;
  if (!viewer || !isCandidate) {
    body = (
      <div className={`${cardCls} space-y-3`}>
        <h2 className="text-lg font-semibold text-brand-dark">{F.signInTitle}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`/login?next=${next}`} className={btnPrimary}>{F.signIn2}</Link>
          <Link href="/register" className={btnSecondary}>{F.register}</Link>
        </div>
      </div>
    );
  } else {
    const [{ data: prev }, { data: fitData }, { data: rs }] = await Promise.all([
      supabase.from("external_applications").select("ref_code, status, sent_at").eq("external_job_id", id).eq("candidate_id", viewer.id).maybeSingle(),
      supabase.rpc("external_job_fit", { _job: id }),
      supabase.from("resumes").select("id, file_name, is_primary").eq("user_id", viewer.id).order("is_primary", { ascending: false }).order("created_at", { ascending: false }),
    ]);
    fit = (fitData as Fit | null) ?? null;
    if (prev?.status === "sent") {
      body = (
        <div className={`${cardCls} space-y-2`} role="status">
          <h2 className="text-lg font-semibold text-success">{F.alreadySent}</h2>
          <p className="text-sm text-ink">{F.ref}: <span className="font-mono font-bold" dir="ltr">NX-{prev.ref_code}</span></p>
          {prev.sent_at ? <p className="text-sm text-muted">{F.sentOn} {fmtDate(prev.sent_at, locale)}</p> : null}
          <Link href="/jobs" className={btnSecondary}>{F.back}</Link>
        </div>
      );
    } else if (fit && !fit.eligible) {
      body = <NotEligibleCard fit={fit} criteria={criteria} locale={locale} L={F} />;
    } else {
      body = <ExternalApplyForm jobId={id} resumes={(rs ?? []) as ApplyResume[]} O={O} F={F} />;
    }
  }
  return (
    <>
      <PageHeader title={job.title} intro={job.client_note ?? job.agency ?? undefined} />
      <Section className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <ConditionsCard criteria={criteria} fit={fit} locale={locale} L={F} />
          <p className="text-sm text-muted">{F.directToo}</p>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">{body}</aside>
      </Section>
    </>
  );
}
