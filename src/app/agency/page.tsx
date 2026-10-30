import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { dash } from "@/content/dash";
import { ops } from "@/content/ops";
import { v3 } from "@/content/v3";
import { Inbox, BellRing } from "lucide-react";
import { EmptyState, KpiCard } from "@/components/ui/kit";
import { AgencyShell } from "@/components/layout/AgencyShell";

export const metadata: Metadata = { title: "Agency", robots: { index: false } };

export default async function AgencyPage() {
  await requireRole(["next_recruiter", "next_admin", "super_admin"], "/agency");
  const locale = await getLocale();
  const d = dash[locale];
  const L = ops[locale];
  const K = v3[locale].kpi;
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("inquiries")
    .select("id, reference, kind, status, full_name, email, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const fmt = new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Baghdad" });
  return (
    <AgencyShell L={L} active="/agency" title={d.agencyTitle} intro={d.agencyIntro}>
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard icon={Inbox} label={K.inquiries} value={rows?.length ?? 0} hint={rows && rows.length === 50 ? "50+" : undefined} />
        <KpiCard icon={BellRing} label={K.fresh} value={(rows ?? []).filter((r) => r.status === "new").length} tone="warning" />
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-brand-dark">{L.staff.inquiries}</h2>
        {rows?.length ? (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[640px] text-start text-sm">
              <thead className="bg-surface text-muted">
                <tr>{[d.colRef, d.colKind, d.colStatus, d.colFrom, d.colDate].map((h) => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono" dir="ltr">{r.reference}</td>
                    <td className="px-4 py-3">{d.kinds[r.kind] ?? r.kind}</td>
                    <td className="px-4 py-3">{d.statuses[r.status] ?? r.status}</td>
                    <td className="px-4 py-3">{r.full_name}<br /><span dir="ltr" className="text-xs text-muted">{r.email}</span></td>
                    <td className="px-4 py-3 text-muted">{fmt.format(new Date(r.created_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Inbox} title={L.staff.inquiries} body={d.noRequests} />
        )}
      </section>
    </AgencyShell>
  );
}
