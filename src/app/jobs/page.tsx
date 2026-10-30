import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { btnPrimary, btnSecondary, cardCls } from "@/components/ui/styles";
import { JobCard } from "@/components/jobs/JobCard";
import { ExternalJobCard, type ExternalRow } from "@/components/jobs/ExternalJobCard";
import { ingest } from "@/content/ingest";
import { SearchBar } from "@/components/home/SearchBar";
import { ops } from "@/content/ops";
import { cityList, cityLabel, industryList, type JobRow } from "@/lib/jobs";
import { cityToSlug, likeSafe } from "@/lib/ops";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.jobs.title, description: p.jobs.intro, alternates: { canonical: "/jobs" } };
}

type Search = Promise<{ q?: string | string[]; city?: string | string[]; industry?: string | string[]; page?: string | string[] }>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 100) ?? "";
const PAGE = 12;

export default async function JobsPage({ searchParams }: { searchParams: Search }) {
  const { p, locale } = await pageCtx();
  const L = ops[locale];
  const sp = await searchParams;
  const q = one(sp.q);
  const cityRaw = one(sp.city);
  const page = Math.max(1, Math.min(500, Number.parseInt(one(sp.page), 10) || 1));
  const citySlug = cityToSlug(cityRaw, [cityList("en") as never, cityList("ar") as never]);
  const industry = industryList(locale).find((i) => i.slug === one(sp.industry));

  let jobs: JobRow[] = [];
  let total = 0;
  let backend = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (backend) {
    try {
      const supabase = await createClient();
      let query = supabase.from("job_listings").select("*", { count: "exact" }).order("published_at", { ascending: false });
      const kw = likeSafe(q);
      if (kw) query = query.or(`title.ilike.%${kw}%,description.ilike.%${kw}%`);
      if (citySlug) query = query.eq("city", citySlug);
      else if (cityRaw) query = query.ilike("city", `%${likeSafe(cityRaw)}%`);
      if (industry) query = query.eq("industry", industry.slug);
      const { data, count, error } = await query.range((page - 1) * PAGE, page * PAGE - 1);
      if (error) backend = false;
      jobs = (data ?? []) as JobRow[];
      total = count ?? 0;
    } catch {
      backend = false;
    }
  }
  // Imported ads (checked by a recruiter) are listed on the same page, same filters; they are not paginated, first page only.
  let external: ExternalRow[] = [];
  if (backend && page === 1) {
    try {
      const supabase = await createClient();
      let eq = supabase.from("external_job_listings").select("*").order("published_at", { ascending: false }).limit(24);
      const kw = likeSafe(q);
      if (kw) eq = eq.or(`title.ilike.%${kw}%,client_note.ilike.%${kw}%`);
      if (citySlug) eq = eq.eq("city", citySlug);
      else if (cityRaw) eq = eq.ilike("city", `%${likeSafe(cityRaw)}%`);
      if (industry) eq = eq.eq("industry", industry.slug);
      const { data } = await eq;
      external = (data ?? []) as ExternalRow[];
    } catch { /* the own-jobs list still renders */ }
  }
  const T = ingest[locale];
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (n: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (cityRaw) u.set("city", cityRaw);
    if (industry) u.set("industry", industry.slug);
    if (n > 1) u.set("page", String(n));
    const s = u.toString();
    return `/jobs${s ? `?${s}` : ""}`;
  };
  const cityShown = citySlug ? cityLabel(citySlug, locale) : cityRaw;

  return (
    <>
      <PageHeader title={p.jobs.title} intro={p.jobs.intro} />
      <Section>
        <SearchBar keyword={p.jobs.keyword} city={p.jobs.city} submit={p.jobs.search} defaultQ={q} defaultCity={cityShown} industry={industry?.slug} />
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={L.jobs.industry}>
          {industryList(locale).map((i) => {
            const u = new URLSearchParams();
            if (q) u.set("q", q);
            if (cityRaw) u.set("city", cityRaw);
            if (industry?.slug !== i.slug) u.set("industry", i.slug);
            const active = industry?.slug === i.slug;
            return (
              <Link key={i.slug} href={`/jobs?${u.toString()}`} aria-current={active ? "true" : undefined}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm ${active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand"}`}>
                {i.label}{active ? <X className="size-3.5" aria-hidden /> : null}
              </Link>
            );
          })}
        </div>

        {!backend ? (
          <div className={`${cardCls} mt-8 space-y-3 text-center`} role="status">
            <h2 className="text-xl font-semibold text-brand-dark">{p.jobs.emptyTitle}</h2>
            <p className="mx-auto max-w-xl text-sm text-muted">{p.jobs.emptyBody}</p>
          </div>
        ) : jobs.length === 0 && external.length === 0 ? (
          <div className={`${cardCls} mt-8 space-y-3 text-center`} role="status">
            <h2 className="text-xl font-semibold text-brand-dark">{L.jobs.emptyTitle}</h2>
            <p className="mx-auto max-w-xl text-sm text-muted">{L.jobs.emptyBody}</p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {q || cityRaw || industry ? <Link href="/jobs" className={btnSecondary}>{L.jobs.clear}</Link> : null}
              <Link href="/register" className={btnPrimary}>{p.jobs.ctaRegister}</Link>
              <Link href="/services#companies" className={btnSecondary}>{p.jobs.ctaService}</Link>
            </div>
          </div>
        ) : (
          <>
            {jobs.length ? (
              <>
                <p className="mt-8 text-sm font-medium text-muted" role="status">{total} {total === 1 ? L.jobs.resultsOne : L.jobs.resultsMany}</p>
                <ul className="mt-3 grid gap-4 md:grid-cols-2">
                  {jobs.map((j) => (
                    <li key={j.id}><JobCard job={j} L={L} locale={locale} /></li>
                  ))}
                </ul>
              </>
            ) : null}
            {external.length ? (
              <section aria-labelledby="ext-jobs" className="mt-10 space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <h2 id="ext-jobs" className="text-xl font-bold text-brand-dark">{T.publicTitle} ({external.length})</h2>
                  <Link href="/jobs/external" className="text-sm font-medium text-brand underline-offset-4 hover:underline">{locale === "ar" ? "عرض الكل ←" : "See all →"}</Link>
                </div>
                <p className="rounded-xl border border-line bg-surface p-3 text-sm text-muted">{T.disclaimer}</p>
                <ul className="grid gap-4 md:grid-cols-2">
                  {external.map((j) => <li key={j.id}><ExternalJobCard j={j} locale={locale} /></li>)}
                </ul>
              </section>
            ) : null}
            {pages > 1 ? (
              <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-3">
                {page > 1 ? <Link href={href(page - 1)} className={btnSecondary} rel="prev">{L.jobs.prev}</Link> : <span />}
                <span className="text-sm text-muted">{L.jobs.page} {page} {L.jobs.of} {pages}</span>
                {page < pages ? <Link href={href(page + 1)} className={btnSecondary} rel="next">{L.jobs.next}</Link> : <span />}
              </nav>
            ) : null}
          </>
        )}
      </Section>
    </>
  );
}
