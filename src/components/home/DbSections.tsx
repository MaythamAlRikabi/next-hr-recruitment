import Link from "next/link";
import { ArrowRight, BadgeCheck, Briefcase, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobCard } from "@/components/jobs/JobCard";
import { btnPrimary, btnSecondary, cardCls, cardHover } from "@/components/ui/styles";
import { ops } from "@/content/ops";
import { v3 } from "@/content/v3";
import { industryLabel, cityLabel, type JobRow } from "@/lib/jobs";
import type { Locale } from "@/lib/i18n";

type HomeLatest = { heading: string; emptyTitle: string; emptyBody: string; register: string; hire: string };

/** Latest published vacancies. Falls back to an honest empty state when the backend is absent, errors, or has no jobs. */
export async function LatestJobs({ locale, copy }: { locale: Locale; copy: HomeLatest }) {
  let jobs: JobRow[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from("job_listings").select("*").order("published_at", { ascending: false }).limit(6);
      if (!error) jobs = (data ?? []) as JobRow[];
    } catch {
      jobs = [];
    }
  }
  if (jobs.length > 0) {
    return (
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((j) => (
          <li key={j.id}><JobCard job={j} L={ops[locale]} locale={locale} headingLevel={3} /></li>
        ))}
      </ul>
    );
  }
  return (
    <div role="status" className={`${cardCls} mx-auto max-w-3xl px-6 py-12 text-center`}>
      <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-dashed border-brand/40 bg-brand/5 text-brand">
        <Briefcase className="size-7" aria-hidden />
      </span>
      <h3 className="t-h4 mt-5 text-midnight">{copy.emptyTitle}</h3>
      <p className="t-body mx-auto mt-2 max-w-xl text-muted">{copy.emptyBody}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
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
    );
  }
  return (
    <div role="status" className={`${cardCls} mx-auto max-w-3xl px-6 py-10 text-center`}>
      <span className="mx-auto grid size-14 place-items-center rounded-full border-2 border-dashed border-brand/40 bg-brand/5 text-brand">
        <Building2 className="size-6" aria-hidden />
      </span>
      <h3 className="t-h4 mt-4 text-midnight">{t.emptyTitle}</h3>
      <p className="t-body mx-auto mt-2 max-w-xl text-muted">{t.emptyBody}</p>
      <div className="mt-5">
        <Link href="/register" className={btnSecondary}>{t.cta}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden /></Link>
      </div>
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div aria-hidden className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-line/60" />)}
    </div>
  );
}
