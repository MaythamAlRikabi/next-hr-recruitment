import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, SearchX } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { createClient } from "@/lib/supabase/server";
import { fit as fitCopy } from "@/content/fit";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { btnSecondary, cardCls } from "@/components/ui/styles";
import { fmtDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "Verify application", robots: { index: false, follow: false } };

type Result = { title: string; agency: string | null; sent_at: string; eligible: boolean; required_total: number; required_met: number; verified: boolean };

/** Public check of a reference code (NX-XXXXXXXXXX). Shows no personal data about the candidate. */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { locale } = await pageCtx();
  const F = fitCopy[locale];
  const ref = decodeURIComponent(code).replace(/^NX-/i, "").trim().toUpperCase();
  let r: Result | null = null;
  if (/^[A-F0-9]{10}$/.test(ref) && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.rpc("verify_external_application", { _ref: ref });
      r = (data as Result | null) ?? null;
    } catch { r = null; }
  }
  return (
    <>
      <PageHeader title={F.vTitle} />
      <Section className="max-w-2xl">
        {r ? (
          <div className={`${cardCls} space-y-4`} role="status">
            <p className="flex items-center gap-2 text-lg font-bold text-success"><BadgeCheck className="size-6" aria-hidden />{F.vOk}</p>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-muted">{F.ref}</dt><dd className="font-mono font-bold" dir="ltr">NX-{ref}</dd></div>
              <div><dt className="text-muted">{F.vDate}</dt><dd className="font-medium">{fmtDate(r.sent_at, locale)}</dd></div>
              <div><dt className="text-muted">{F.vJob}</dt><dd className="font-medium" dir="auto">{r.title}</dd></div>
              {r.agency ? <div><dt className="text-muted">{F.vCompany}</dt><dd className="font-medium" dir="auto">{r.agency}</dd></div> : null}
            </dl>
            {r.required_total > 0 ? <p className="text-sm text-ink">{r.eligible ? F.vMeets : F.vPartial(r.required_met, r.required_total)}</p> : null}
            {r.verified && r.required_total > 0 ? <p className="text-sm font-semibold text-success">{F.vDocs}</p> : null}
          </div>
        ) : (
          <div className={`${cardCls} space-y-3 text-center`} role="status">
            <SearchX className="mx-auto size-8 text-muted" aria-hidden />
            <p className="text-muted">{F.vNotFound}</p>
            <Link href="/" className={btnSecondary}>{F.back}</Link>
          </div>
        )}
      </Section>
    </>
  );
}
