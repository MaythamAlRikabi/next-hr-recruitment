import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/jobs/JobCard";
import { ExternalJobCard, type ExternalRow } from "@/components/jobs/ExternalJobCard";
import { btnPrimary, btnSecondary, cardCls, cardHover } from "@/components/ui/styles";
import { ops } from "@/content/ops";
import { v3 } from "@/content/v3";
import { industryLabel, cityLabel, type JobRow } from "@/lib/jobs";
import type { Locale } from "@/lib/i18n";

type HomeLatest = { heading: string; emptyTitle: string; emptyBody: string; register: string; hire: string };

/** Latest published vacancies. Falls back to an honest empty state when the backend is absent, errors, or has no jobs. */
export async function LatestJobs({ locale, copy }: { locale: Locale; copy: HomeLatest }) {
  let jobs: JobRow[] = [];
  let external: ExternalRow[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const [own, ext] = await Promise.all([
        supabase.from("job_listings").select("*").order("published_at", { ascending: false }).limit(6),
        supabase.from("external_job_listings").select("*").order("published_at", { ascending: false }).limit(6),
      ]);
      if (!own.error) jobs = (own.data ?? []) as JobRow[];
      if (!ext.error) external = ((ext.data ?? []) as ExternalRow[]).slice(0, Math.max(0, 6 - jobs.length));
    } catch {
      jobs = []; external = [];
    }
  }
  if (jobs.length > 0 || external.length > 0) {
    return (
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((j) => (
          <li key={j.id}><JobCard job={j} L={ops[locale]} locale={locale} headingLevel={3} /></li>
        ))}
        {external.map((j) => (
          <li key={j.id}><ExternalJobCard j={j} locale={locale} /></li>
        ))}
      </ul>
    );
  }
  return (
    <div role="status" className="mx-auto max-w-xl rounded-3xl border border-line bg-white px-6 py-10 text-center glow-brand">
      <h3 className="t-h4 text-midnight">{copy.emptyTitle}</h3>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link href="/register" className={btnPrimary}>{copy.register}</Link>
        <Link href="/services#companies" className={btnSecondary}>{copy.hire}</Link>
      </div>
    </div>
  );
}

type Company = { id: string; slug: string; name: string; industry: string | null; city: string | null };

/** Companies whose verification the NEXT team has approved (RLS exposes only approved rows to the public). Never shows anything else. */
export async function VerifiedCompanies({ locale }: { locale: Locale }) {
  const t = v3[locale].verified;
  let companies: Company[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("companies")
        .select("id, slug, name, industry, city")
        .eq("verification", "approved")
        .order("verified_at", { ascending: false })
        .limit(8);
      if (!error) companies = (data ?? []) as Company[];
    } catch {
      companies = [];
    }
  }
  if (companies.length > 0) {
    return (
      <section className="bg-brand-soft">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h2 className="t-h2 mb-8 text-midnight">{t.heading}</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {companies.map((c) => (
          <li key={c.id} className={`${cardCls} ${cardHover}`}>
            <span className="grid size-12 place-items-center rounded-xl bg-midnight text-lg font-extrabold text-white" aria-hidden>
              {c.name.trim().charAt(0).toUpperCase()}
            </span>
            <h3 className="mt-4 flex items-center gap-1.5 font-bold text-midnight">
              {c.name}
              <BadgeCheck className="size-4 shrink-0 text-brand" aria-label={t.heading} />
            </h3>
            <p className="mt-1 text-sm text-muted">
              {[c.industry ? industryLabel(c.industry, locale) : null, c.city ? cityLabel(c.city, locale) : null].filter(Boolean).join(" · ")}
            </p>
          </li>
        ))}
      </ul>
        </div>
      </section>
    );
  }
  return null;
}

export function SectionSkeleton() {
  return (
    <div aria-hidden className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-line/60" />)}
    </div>
  );
}
