import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { AgencyShell } from "@/components/layout/AgencyShell";
import { badgeBrand, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Recruitment requests", robots: { index: false } };

export default async function AgencyRequestsPage() {
  await requireRole(["next_recruiter", "next_admin", "super_admin"], "/agency/requests");
  const L = ops[await getLocale()];
  const s = L.staff;
  const supabase = await createClient();
  const { data: rows } = await supabase.from("recruitment_requests")
    .select("id, positions, status, vacancies_count, confidential, created_at, company:companies(name)")
    .order("created_at", { ascending: false }).limit(100);
  return (
    <AgencyShell L={L} active="/agency/requests" title={s.reqTitle} intro={s.reqIntro}>
      {rows?.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => {
            const co = Array.isArray(r.company) ? r.company[0] : r.company;
            return (
              <li key={r.id}>
                <Link href={`/agency/requests/${r.id}`} className={`${cardCls} block space-y-2 hover:border-brand`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{co?.name ?? "—"}</span>
                    <span className={badgeBrand}>{L.emp.reqStatus[r.status] ?? r.status}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted">{r.positions}</p>
                  <p className="text-xs text-muted">{s.vacancies}: {r.vacancies_count}{r.confidential ? ` · ${s.confidential}` : ""}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : <p role="status" className="rounded-xl border border-line bg-white p-6 text-center text-muted">{s.reqEmpty}</p>}
    </AgencyShell>
  );
}
