import Link from "next/link";
import { Briefcase, Clock, ListChecks, MapPin, ShieldCheck } from "lucide-react";
import { badgeBrand, badgeViolet, badgeWarning, cardCls, cardHover } from "@/components/ui/styles";
import { cityLabel, fmtDate, fmtSalary, industryLabel, type JobRow } from "@/lib/jobs";
import type { ops } from "@/content/ops";
import type { Locale } from "@/lib/i18n";

/** One vacancy card. Employer identity is shown only when the public view exposes it (hidden/confidential roles show a neutral label). */
export function JobCard({ job: j, L, locale, headingLevel = 2 }: { job: JobRow; L: (typeof ops)["en"]; locale: Locale; headingLevel?: 2 | 3 }) {
  const salary = fmtSalary(j);
  const H = headingLevel === 3 ? "h3" : "h2";
  return (
    <Link href={`/jobs/${j.id}`} className={`${cardCls} ${cardHover} group block h-full hover:shadow-[0_18px_44px_-18px_rgb(18_97_255/0.45)]`}>
      <div className="flex flex-wrap items-center gap-2">
        {j.recruitment_method === "next_managed" ? <span className={badgeViolet}><ShieldCheck className="size-3.5" aria-hidden />{L.jobs.managedBadge}</span> : null}
        {j.industry ? <span className={badgeBrand}>{industryLabel(j.industry, locale)}</span> : null}
        {j.criteria?.some((c) => c.required !== false) ? (
          <span className={badgeWarning}><ListChecks className="size-3.5" aria-hidden />{locale === "ar" ? "له شروط تقديم" : "Has conditions"}</span>
        ) : null}
      </div>
      <H className="mt-3 text-lg font-bold text-brand-dark group-hover:text-brand">{j.title}</H>
      <p className="mt-1 text-sm text-muted">{j.employer_hidden || !j.company_name ? L.jobs.confidential : j.company_name}</p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
        {j.city ? <li className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-brand" aria-hidden />{cityLabel(j.city, locale)}</li> : null}
        <li className="inline-flex items-center gap-1.5"><Briefcase className="size-4 text-brand" aria-hidden />{L.jobs.types[j.employment_type] ?? j.employment_type}</li>
        {j.published_at ? <li className="inline-flex items-center gap-1.5"><Clock className="size-4 text-brand" aria-hidden />{fmtDate(j.published_at, locale)}</li> : null}
      </ul>
      {salary ? <p className="mt-2 text-sm font-semibold text-ink" dir="ltr">{salary}</p> : null}
    </Link>
  );
}
