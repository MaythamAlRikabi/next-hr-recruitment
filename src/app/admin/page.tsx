import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { dash } from "@/content/dash";
import { ops } from "@/content/ops";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { MiniAction, SelectAction } from "@/components/forms/StaffForms";
import { grantRecruiter, setCompanyVerification } from "@/app/actions/staff";
import { badgeBrand, cardCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  await requireRole(["next_admin", "super_admin"], "/admin");
  const locale = await getLocale();
  const d = dash[locale];
  const L = ops[locale];
  const s = L.staff;
  const supabase = await createClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [candidates, employers, companies, newRequests, deletions, { data: cos }, { data: staffRoles }, { data: profs }] = await Promise.all([
    count(supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "candidate")),
    count(supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "employer")),
    count(supabase.from("companies").select("*", { count: "exact", head: true })),
    count(supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new")),
    count(supabase.from("account_deletion_requests").select("*", { count: "exact", head: true }).eq("status", "pending")),
    supabase.from("companies").select("id, name, verification, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("user_roles").select("user_id").in("role", ["next_recruiter", "next_admin", "super_admin"]),
    supabase.from("profiles").select("id, full_name").order("created_at", { ascending: false }).limit(100),
  ]);
  const staffIds = new Set((staffRoles ?? []).map((r) => r.user_id));
  const eligible = (profs ?? []).filter((p) => !staffIds.has(p.id)).map((p) => ({ value: p.id, label: p.full_name ?? p.id.slice(0, 8) }));
  const stats: [string, number][] = [
    [d.statCandidates, candidates], [d.statEmployers, employers], [d.statCompanies, companies],
    [d.statNew, newRequests], [d.statDeletion, deletions],
  ];
  const stateLabel: Record<string, string> = { approved: s.approve, rejected: s.reject, needs_info: s.needsInfo, pending: "…" };
  return (
    <>
      <PageHeader title={d.adminTitle} intro={d.adminIntro} />
      <Section className="space-y-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(([label, n]) => (
            <div key={label} className={cardCls}>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-1 text-3xl font-bold text-brand-dark" dir="ltr">{n}</p>
            </div>
          ))}
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-brand-dark">{s.adminCompanies}</h2>
          {cos?.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {cos.map((c) => (
                <li key={c.id} className={`${cardCls} space-y-3`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    <span className={badgeBrand}>{stateLabel[c.verification] ?? c.verification}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.verification !== "approved" ? <MiniAction action={setCompanyVerification} fields={{ id: c.id, to: "approved" }} label={s.approve} L={L} /> : null}
                    {c.verification !== "needs_info" ? <MiniAction action={setCompanyVerification} fields={{ id: c.id, to: "needs_info" }} label={s.needsInfo} L={L} secondary /> : null}
                    {c.verification !== "rejected" ? <MiniAction action={setCompanyVerification} fields={{ id: c.id, to: "rejected" }} label={s.reject} L={L} secondary danger /> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{s.adminCompaniesEmpty}</p>}
        </section>

        <section className={`${cardCls} space-y-3`}>
          <h2 className="text-xl font-bold text-brand-dark">{s.adminRecruiters}</h2>
          <p className="text-sm text-muted">{s.adminRecruitersIntro}</p>
          {eligible.length ? <SelectAction action={grantRecruiter} name="user_id" hidden={{}} options={eligible} placeholder={s.adminRecruiters} label={s.grant} L={L} /> : <p className="text-sm text-muted">{s.noProfiles}</p>}
        </section>
      </Section>
    </>
  );
}
