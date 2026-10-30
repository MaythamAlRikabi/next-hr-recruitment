import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { fmtDate } from "@/lib/jobs";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { SubNav } from "@/components/layout/SubNav";
import { PoolPanel, ResumeRowActions, ResumeUploader } from "@/components/forms/OpForms";
import { badgeBrand, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "CV & Talent Pool", robots: { index: false } };

export default async function CandidateCvPage() {
  const { viewer } = await requireRole(["candidate"], "/candidate/cv");
  const locale = await getLocale();
  const L = ops[locale];
  const supabase = await createClient();
  const [{ data: resumes }, { data: cp }, { data: consent }] = await Promise.all([
    supabase.from("resumes").select("id, file_name, size_bytes, is_primary, created_at").eq("user_id", viewer.id).order("created_at", { ascending: false }),
    supabase.from("candidate_profiles").select("resume_visibility").eq("user_id", viewer.id).maybeSingle(),
    supabase.from("talent_pool_consents").select("action").eq("user_id", viewer.id).order("id", { ascending: false }).limit(1),
  ]);
  const consentActive = consent?.[0]?.action === "granted";
  return (
    <>
      <PageHeader title={L.cand.cvTitle} intro={L.cand.cvIntro} />
      <Section className="max-w-3xl space-y-8">
        <SubNav label={L.cand.dash} active="/candidate/cv" items={[
          { href: "/candidate", label: L.cand.dash }, { href: "/candidate/profile", label: L.cand.links.profile },
          { href: "/candidate/cv", label: L.cand.links.cv }, { href: "/candidate/saved", label: L.cand.links.saved }, { href: "/account", label: L.cand.links.account },
        ]} />
        <ResumeUploader L={L} userId={viewer.id} />
        {resumes?.length ? (
          <ul className="space-y-3">
            {resumes.map((r) => (
              <li key={r.id} className={`${cardCls} space-y-2`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-all font-semibold text-ink" dir="auto">{r.file_name}</span>
                  {r.is_primary ? <span className={badgeBrand}>{L.cand.primary}</span> : null}
                </div>
                <p className="text-xs text-muted" dir="ltr">{(r.size_bytes / 1024).toFixed(0)} KB · {fmtDate(r.created_at, locale)}</p>
                <ResumeRowActions id={r.id} isPrimary={r.is_primary} L={L} />
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">{L.cand.cvEmpty}</p>}
        <PoolPanel L={L} visibility={(cp?.resume_visibility ?? "private") as "private" | "anonymized" | "searchable"} hasCv={(resumes?.length ?? 0) > 0} consentActive={consentActive} />
      </Section>
    </>
  );
}
