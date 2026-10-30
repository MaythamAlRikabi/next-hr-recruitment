import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { AgencyShell } from "@/components/layout/AgencyShell";
import { MiniAction } from "@/components/forms/StaffForms";
import { moderateJob } from "@/app/actions/staff";
import { cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Jobs to review", robots: { index: false } };

export default async function AgencyJobsPage() {
  await requireRole(["next_recruiter", "next_admin", "super_admin"], "/agency/jobs");
  const L = ops[await getLocale()];
  const s = L.staff;
  const supabase = await createClient();
  const { data: jobs } = await supabase.from("jobs")
    .select("id, title, city, description, created_at, company:companies(name, verification)")
    .eq("status", "pending_review").order("created_at", { ascending: true }).limit(100);
  return (
    <AgencyShell L={L} active="/agency/jobs" title={s.jobsTitle} intro={s.jobsIntro}>
      {jobs?.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {jobs.map((j) => {
            const co = Array.isArray(j.company) ? j.company[0] : j.company;
            return (
              <li key={j.id} className={`${cardCls} space-y-3`}>
                <div>
                  <h2 className="font-semibold text-ink">{j.title}</h2>
                  <p className="text-sm text-muted">{s.company}: {co?.name ?? "—"}{j.city ? ` · ${j.city}` : ""}</p>
                </div>
                <p className="line-clamp-4 whitespace-pre-line text-sm text-muted">{j.description}</p>
                <div className="flex flex-wrap gap-2">
                  <MiniAction action={moderateJob} fields={{ id: j.id, to: "published" }} label={s.publish} L={L} />
                  <MiniAction action={moderateJob} fields={{ id: j.id, to: "draft" }} label={s.returnDraft} L={L} secondary />
                </div>
              </li>
            );
          })}
        </ul>
      ) : <p role="status" className="rounded-xl border border-line bg-white p-6 text-center text-muted">{s.jobsEmpty}</p>}
    </AgencyShell>
  );
}
