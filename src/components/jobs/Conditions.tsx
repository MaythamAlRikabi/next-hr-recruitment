import Link from "next/link";
import { Check, X, ListChecks } from "lucide-react";
import { criterionText, monthsText, type Criterion, type Fit, type FitItem } from "@/lib/eligibility";
import { cardCls } from "@/components/ui/styles";
import type { Locale } from "@/lib/i18n";
import type { fit as fitCopy } from "@/content/fit";

type L = (typeof fitCopy)["en"];

const isReq = (c: Criterion) => c.required !== false;

/** The job's conditions. With `fit` (signed-in candidate) each line shows met / missing and what the candidate has. */
export function ConditionsCard({ criteria, fit, locale, L }: { criteria: Criterion[]; fit?: Fit | null; locale: Locale; L: L }) {
  if (!criteria.length) return null;
  const rows: (Criterion & Partial<Pick<FitItem, "met" | "have_months">>)[] = fit && fit.results.length === criteria.length ? fit.results : criteria;
  return (
    <section className={`${cardCls} space-y-4`} aria-labelledby="conditions-h">
      <h2 id="conditions-h" className="flex items-center gap-2 text-xl font-bold text-brand-dark">
        <ListChecks className="size-5 text-brand" aria-hidden />{L.conditions}
      </h2>
      <ul className="space-y-2.5">
        {rows.map((c, i) => {
          const known = typeof c.met === "boolean";
          return (
            <li key={i} className="flex items-start gap-3">
              <span
                aria-hidden
                className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                  !known ? "bg-line text-muted" : c.met ? "bg-success-fill text-white" : isReq(c) ? "bg-danger text-white" : "bg-warning-fill text-midnight"
                }`}
              >
                {known ? (c.met ? <Check className="size-3.5" /> : <X className="size-3.5" />) : <span className="size-1.5 rounded-full bg-muted" />}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-midnight">
                  {criterionText(c, locale)}
                  <span className={`ms-2 rounded-full px-2 py-0.5 text-xs font-bold ${isReq(c) ? "bg-brand/10 text-brand-hover" : "bg-line text-muted"}`}>
                    {isReq(c) ? L.required : L.preferred}
                  </span>
                </p>
                {known && c.kind === "experience" && !c.met ? (
                  <p className="text-sm text-muted">{L.youHave}: {monthsText(c.have_months ?? 0, locale)}</p>
                ) : null}
                {known ? <span className="sr-only">{c.met ? "✔" : "✘"}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Replaces the apply form when a required condition is missing. */
export function NotEligibleCard({ fit, criteria, locale, L }: { fit: Fit; criteria: Criterion[]; locale: Locale; L: L }) {
  const missing = fit.results.filter((r) => r.required !== false && !r.met);
  return (
    <div className={`${cardCls} space-y-3 border-danger/30`} role="status">
      <h2 className="text-lg font-semibold text-danger">{L.cannot}</h2>
      <p className="text-sm text-muted">{L.lockNote}</p>
      {missing.length ? (
        <div>
          <p className="text-sm font-semibold text-midnight">{L.missing}</p>
          <ul className="mt-1.5 list-disc space-y-1 ps-5 text-sm text-ink">
            {missing.map((m, i) => <li key={i}>{criterionText(m, locale)}</li>)}
          </ul>
        </div>
      ) : criteria.length ? null : null}
      <Link href="/candidate/profile#fit" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-bold text-white hover:bg-brand-hover">{L.fix}</Link>
    </div>
  );
}
