import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import type { JobRow } from "@/lib/jobs";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { SubNav } from "@/components/layout/SubNav";
import { JobCard } from "@/components/jobs/JobCard";
import { btnPrimary, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Saved jobs", robots: { index: false } };

export default async function SavedJobsPage() {
  const { viewer } = await requireRole(["candidate"], "/candidate/saved");
  const locale = await getLocale();
  const L = ops[locale];
  const c = L.cand;
  const supabase = await createClient();
  const { data: saved } = await supabase.from("saved_jobs").select("job_id, created_at").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(100);
  const ids = (saved ?? []).map((s) => s.job_id);
  // The public view returns only vacancies that are still open, so closed ones drop out by themselves.
  const { data: jobs } = ids.length ? await supabase.from("job_listings").select("*").in("id", ids) : { data: [] as JobRow[] };
  const byId = new Map((jobs ?? []).map((j) => [(j as JobRow).id, j as JobRow]));
  const open = ids.map((id) => byId.get(id)).filter((j): j is JobRow => !!j);
  return (
    <>
      <PageHeader title={c.savedTitle} intro={c.savedIntro} />
      <Section className="space-y-8">
        <SubNav label={c.dash} active="/candidate/saved" items={[
          { href: "/candidate", label: c.dash }, { href: "/candidate/profile", label: c.links.profile },
          { href: "/candidate/cv", label: c.links.cv }, { href: "/candidate/saved", label: c.links.saved }, { href: "/candidate/alerts", label: locale === "ar" ? "تنبيهات الوظائف" : "Job alerts" }, { href: "/notifications", label: locale === "ar" ? "الإشعارات" : "Notifications" }, { href: "/account", label: c.links.account },
        ]} />
        {open.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {open.map((j) => <li key={j.id}><JobCard job={j} L={L} locale={locale} /></li>)}
          </ul>
        ) : (
          <div className={`${cardCls} space-y-3 text-center`}>
            <p className="text-muted">{c.savedEmpty}</p>
            <Link href="/jobs" className={btnPrimary}>{c.findJobs}</Link>
          </div>
        )}
      </Section>
    </>
  );
}
