import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MapPin, Clock } from "lucide-react";
import { getLocale } from "@/lib/i18n";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { btnPrimary, btnSecondary, badgeBrand, cardCls } from "@/components/ui/styles";
import { ingest } from "@/content/ingest";
import { cityLabel, fmtDate, fmtSalary, industryLabel } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";
import { hasBackend } from "@/lib/ops";

export async function generateMetadata(): Promise<Metadata> {
  const T = ingest[await getLocale()];
  return { title: T.publicTitle, description: T.publicIntro, alternates: { canonical: "/jobs/external" } };
}

type Row = {
  id: string; title: string; agency: string | null; client_note: string | null; city: string | null; industry: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string | null; salary_note: string | null;
  responsibilities: string[]; requirements: string[]; apply_url: string | null; apply_email: string | null;
  source_label: string; source_url: string | null; language: string; posted_at: string | null; published_at: string | null; expires_at: string;
};

const safeHref = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

export default async function ExternalJobsPage() {
  const locale = await getLocale();
  const T = ingest[locale];
  let jobs: Row[] = [];
  if (hasBackend()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("external_job_listings").select("*").order("published_at", { ascending: false }).limit(60);
      jobs = (data ?? []) as Row[];
    } catch { /* show the empty state */ }
  }
  return (
    <>
      <PageHeader title={T.publicTitle} intro={T.publicIntro} />
      <Section>
        <p className="mb-6 rounded-xl border border-line bg-surface p-4 text-sm text-muted">{T.disclaimer}</p>
        {jobs.length === 0 ? (
          <div className={`${cardCls} space-y-3 text-center`} role="status">
            <p className="text-muted">{T.empty}</p>
            <Link href="/jobs" className={btnSecondary}>{T.ownJobs}</Link>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {jobs.map((j) => {
              const salary = fmtSalary(j);
              const href = safeHref(j.apply_url) ?? safeHref(j.source_url);
              const lang = j.language === "en" ? "en" : "ar";
              return (
                <li key={j.id} className={`${cardCls} flex flex-col gap-3`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={badgeBrand}>{T.from}: {j.source_label}</span>
                    {j.industry ? <span className={badgeBrand}>{industryLabel(j.industry, locale)}</span> : null}
                  </div>
                  <h2 className="text-lg font-bold text-brand-dark" lang={lang} dir="auto">{j.title}</h2>
                  {j.client_note ? <p className="text-sm text-muted" lang={lang} dir="auto">{j.client_note}</p> : j.agency ? <p className="text-sm text-muted" dir="auto">{j.agency}</p> : null}
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {j.city ? <li className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-brand" aria-hidden />{cityLabel(j.city, locale)}</li> : null}
                    {j.published_at ? <li className="inline-flex items-center gap-1.5"><Clock className="size-4 text-brand" aria-hidden />{fmtDate(j.published_at, locale)}</li> : null}
                  </ul>
                  {salary || j.salary_note ? <p className="text-sm font-semibold" dir="auto">{[salary, j.salary_note].filter(Boolean).join(" — ")}</p> : null}
                  {j.responsibilities.length ? (
                    <details className="text-sm"><summary className="cursor-pointer font-medium text-brand">{T.tasks} ({j.responsibilities.length})</summary>
                      <ul className="mt-2 list-disc space-y-1 ps-5 text-muted" lang={lang} dir="auto">{j.responsibilities.map((r) => <li key={r}>{r}</li>)}</ul></details>
                  ) : null}
                  {j.requirements.length ? (
                    <details className="text-sm"><summary className="cursor-pointer font-medium text-brand">{T.reqs} ({j.requirements.length})</summary>
                      <ul className="mt-2 list-disc space-y-1 ps-5 text-muted" lang={lang} dir="auto">{j.requirements.map((r) => <li key={r}>{r}</li>)}</ul></details>
                  ) : null}
                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                    {href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className={btnPrimary}>{T.applyOriginal}<ExternalLink className="size-4" aria-hidden /></a> : null}
                    {j.apply_email ? <span className="text-sm text-muted" dir="ltr">{j.apply_email}</span> : null}
                    <span className="text-xs text-muted">{T.expires} {fmtDate(j.expires_at, locale)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}
