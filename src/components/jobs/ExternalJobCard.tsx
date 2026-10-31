import Link from "next/link";
import { ExternalLink, MapPin, Clock, Send } from "lucide-react";
import { badgeBrand, btnPrimary, btnSecondary, cardCls } from "@/components/ui/styles";
import { applyViaNextEnabled } from "@/lib/mail";
import { fit as fitCopy } from "@/content/fit";
import type { Criterion } from "@/lib/eligibility";
import { ingest } from "@/content/ingest";
import { cityLabel, fmtDate, fmtSalary, industryLabel } from "@/lib/jobs";
import type { Locale } from "@/lib/i18n";

export type ExternalRow = {
  id: string; title: string; agency: string | null; client_note: string | null; city: string | null; industry: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string | null; salary_note: string | null;
  responsibilities: string[]; requirements: string[]; apply_url: string | null; apply_email: string | null; apply_phone?: string | null;
  source_label: string; source_url: string | null; language: string; posted_at: string | null; published_at: string | null; expires_at: string;
  criteria?: Criterion[];
};

const safeHref = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

/** One imported ad. Never links to the Telegram post: the only buttons are the employer's own apply link, e-mail and phone. */
export function ExternalJobCard({ j, locale, headingLevel = 3 }: { j: ExternalRow; locale: Locale; headingLevel?: 2 | 3 }) {
  const T = ingest[locale];
  const H = headingLevel === 2 ? "h2" : "h3";
  const salary = fmtSalary(j);
  const href = safeHref(j.apply_url);
  const lang = j.language === "en" ? "en" : "ar";
  const viaNext = applyViaNextEnabled() && !!j.apply_email;
  return (
    <div className={`${cardCls} flex h-full flex-col gap-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={badgeBrand}>{T.from}: {j.source_label}</span>
        {j.industry ? <span className={badgeBrand}>{industryLabel(j.industry, locale)}</span> : null}
      </div>
      <H className="text-lg font-bold text-brand-dark" lang={lang} dir="auto">{j.title}</H>
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
        {viaNext ? <Link href={`/jobs/external/${j.id}/apply`} className={btnPrimary}><Send className="size-4" aria-hidden />{fitCopy[locale].viaNextShort}</Link> : null}
        {href ? <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc" className={viaNext ? btnSecondary : btnPrimary}>{T.applyOriginal}<ExternalLink className="size-4" aria-hidden /></a> : null}
        {j.apply_email ? <span className="text-sm text-muted" dir="ltr">{j.apply_email}</span> : null}
        {j.apply_phone ? <a href={`tel:+964${j.apply_phone.slice(1)}`} className="text-sm font-medium text-brand" dir="ltr">{j.apply_phone}</a> : null}
        <span className="text-xs text-muted">{T.expires} {fmtDate(j.expires_at, locale)}</span>
      </div>
    </div>
  );
}
