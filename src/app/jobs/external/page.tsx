import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { btnSecondary, cardCls } from "@/components/ui/styles";
import { ExternalJobCard, type ExternalRow } from "@/components/jobs/ExternalJobCard";
import { ingest } from "@/content/ingest";
import { createClient } from "@/lib/supabase/server";
import { hasBackend } from "@/lib/ops";

export async function generateMetadata(): Promise<Metadata> {
  const T = ingest[await getLocale()];
  return { title: T.publicTitle, description: T.publicIntro, alternates: { canonical: "/jobs/external" } };
}

export default async function ExternalJobsPage() {
  const locale = await getLocale();
  const T = ingest[locale];
  let jobs: ExternalRow[] = [];
  if (hasBackend()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("external_job_listings").select("*").order("published_at", { ascending: false }).limit(60);
      jobs = (data ?? []) as ExternalRow[];
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
            {jobs.map((j) => <li key={j.id}><ExternalJobCard j={j} locale={locale} headingLevel={2} /></li>)}
          </ul>
        )}
      </Section>
    </>
  );
}
