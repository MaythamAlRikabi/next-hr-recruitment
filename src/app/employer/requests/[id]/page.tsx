import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { EmployerShell } from "@/components/layout/EmployerShell";
import { badgeBrand, btnSecondary, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Recruitment request", robots: { index: false } };
type Props = { params: Promise<{ id: string }> };

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  await requireRole(["employer"], `/employer/requests/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const locale = await getLocale();
  const L = ops[locale];
  const e = L.emp;
  const supabase = await createClient();
  const { data: req } = await supabase.from("recruitment_requests").select("id, positions, status, vacancies_count, confidential").eq("id", id).maybeSingle();
  if (!req) notFound();
  // Companies never read candidate tables: submitted shortlists are visible only through client_shortlist_view.
  const { data: lists } = await supabase.from("shortlists").select("id, title").eq("request_id", id).eq("status", "submitted");
  const listIds = (lists ?? []).map((l) => l.id);
  const { data: items } = listIds.length
    ? await supabase.from("client_shortlist_view").select("item_id, shortlist_id, reference, full_name, phone, headline, summary, years_experience, seniority, preferred_functions").in("shortlist_id", listIds)
    : { data: [] as never[] };
  return (
    <EmployerShell L={L} active="/employer/request" title={req.positions.slice(0, 80)} intro={`${e.reqStatus[req.status] ?? req.status} · ${req.vacancies_count}`}>
      <Link href="/employer/request" className={`${btnSecondary} self-start`}>{e.requestBack}</Link>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-brand-dark">{e.shortlistTitle}</h2>
        {items?.length ? (
          <>
            <p className="text-sm text-muted">{e.anonNote}</p>
            <ul className="grid gap-4 md:grid-cols-2">
              {items.map((i) => (
                <li key={i.item_id} className={`${cardCls} space-y-2`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink">{i.full_name ?? i.reference}</h3>
                    {i.seniority ? <span className={badgeBrand}>{L.jobs.levels[i.seniority] ?? i.seniority}</span> : null}
                  </div>
                  {i.headline ? <p className="text-sm font-medium">{i.headline}</p> : null}
                  {i.years_experience != null ? <p className="text-xs text-muted">{i.years_experience} {e.experienceYears}</p> : null}
                  {i.summary ? <p className="whitespace-pre-line text-sm text-muted">{i.summary}</p> : null}
                  {i.phone ? <p className="text-sm" dir="ltr">{e.phone}: {i.phone}</p> : null}
                </li>
              ))}
            </ul>
          </>
        ) : <p className="text-sm text-muted">{e.shortlistEmpty}</p>}
      </section>
    </EmployerShell>
  );
}
