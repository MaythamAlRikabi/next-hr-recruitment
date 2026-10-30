import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { fmtDate, industryList } from "@/lib/jobs";
import { EmployerShell } from "@/components/layout/EmployerShell";
import { RequestForm } from "@/components/forms/EmpForms";
import { badgeBrand, btnPrimary, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "NEXT recruitment request", robots: { index: false } };

export default async function RequestPage() {
  await requireRole(["employer"], "/employer/request");
  const locale = await getLocale();
  const L = ops[locale];
  const e = L.emp;
  const supabase = await createClient();
  const [{ data: companies }, { data: reqs }] = await Promise.all([
    supabase.from("companies").select("id, name").order("created_at"),
    supabase.from("recruitment_requests").select("id, positions, status, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  return (
    <EmployerShell L={L} active="/employer/request" title={e.reqTitle} intro={e.reqIntro}>
      {companies?.length ? <RequestForm L={L} companies={companies} industries={industryList(locale)} /> : (
        <div className="space-y-3"><p className="text-sm text-muted">{e.noCompany}</p><Link href="/employer" className={btnPrimary}>{e.companyForm}</Link></div>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-brand-dark">{e.requestsTitle}</h2>
        {reqs?.length ? (
          <ul className="space-y-3">
            {reqs.map((r) => (
              <li key={r.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <Link href={`/employer/requests/${r.id}`} className="font-semibold text-brand underline underline-offset-4 hover:no-underline" dir="auto">{r.positions.slice(0, 80)}</Link>
                  <p className="text-xs text-muted">{fmtDate(r.created_at, locale)}</p>
                </div>
                <span className={badgeBrand}>{e.reqStatus[r.status] ?? r.status}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">{e.requestsEmpty}</p>}
      </section>
    </EmployerShell>
  );
}
