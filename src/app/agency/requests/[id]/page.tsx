import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { likeSafe } from "@/lib/ops";
import { ops } from "@/content/ops";
import { AgencyShell } from "@/components/layout/AgencyShell";
import { MiniAction, SelectAction, SubmitShortlistForm, TitleAction } from "@/components/forms/StaffForms";
import { addToShortlist, assignRecruiter, createShortlist, removeFromShortlist, setRequestStatus, submitShortlist } from "@/app/actions/staff";
import { badgeBrand, btnSecondary, cardCls, inputCls } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Request", robots: { index: false } };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string }> };

const NEXT_STATES: Record<string, string[]> = {
  submitted: ["under_review", "declined"], under_review: ["declined", "closed"], assigned: ["in_progress", "closed"],
  in_progress: ["closed"], shortlist_sent: ["placed", "closed"],
};

export default async function AgencyRequestPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { q } = await searchParams;
  const { roles } = await requireRole(["next_recruiter", "next_admin", "super_admin"], `/agency/requests/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const L = ops[await getLocale()];
  const s = L.staff;
  const supabase = await createClient();
  const isAdmin = roles.some((r) => r === "next_admin" || r === "super_admin");

  const { data: req } = await supabase.from("recruitment_requests")
    .select("id, positions, status, vacancies_count, skills, locations, additional, confidential, deadline, company:companies(name)").eq("id", id).maybeSingle();
  if (!req) notFound();
  const co = Array.isArray(req.company) ? req.company[0] : req.company;

  const [{ data: assigns }, { data: lists }] = await Promise.all([
    supabase.from("agency_assignments").select("recruiter_id").eq("request_id", id),
    supabase.from("shortlists").select("id, title, status").eq("request_id", id).order("created_at"),
  ]);
  const listIds = (lists ?? []).map((l) => l.id);
  const { data: items } = listIds.length
    ? await supabase.from("shortlist_items").select("id, shortlist_id, candidate_id, disclosure, consent_status").in("shortlist_id", listIds)
    : { data: [] as { id: string; shortlist_id: string; candidate_id: string; disclosure: string; consent_status: string }[] };

  // Recruiters list (admin only, via RLS on user_roles) and names (profiles readable by staff).
  let recruiters: { value: string; label: string }[] = [];
  const assignedIds = new Set((assigns ?? []).map((a) => a.recruiter_id));
  if (isAdmin) {
    const { data: rr } = await supabase.from("user_roles").select("user_id").eq("role", "next_recruiter");
    const ids = [...new Set((rr ?? []).map((r) => r.user_id))];
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      recruiters = (ps ?? []).map((p) => ({ value: p.id, label: p.full_name ?? p.id.slice(0, 8) }));
    }
  }
  const assignedNames = recruiters.filter((r) => assignedIds.has(r.value)).map((r) => r.label);

  // Talent pool: RLS already limits staff to consenting, non-private profiles.
  let poolQuery = supabase.from("candidate_profiles")
    .select("user_id, headline, summary, years_experience, seniority, resume_visibility").neq("resume_visibility", "private").limit(30);
  const term = q ? likeSafe(q) : "";
  if (term) poolQuery = poolQuery.or(`headline.ilike.%${term}%,summary.ilike.%${term}%`);
  const { data: pool } = await poolQuery;
  const searchableIds = (pool ?? []).filter((p) => p.resume_visibility === "searchable").map((p) => p.user_id);
  const itemIds = [...new Set((items ?? []).map((i) => i.candidate_id))];
  const nameIds = [...new Set([...searchableIds, ...itemIds])];
  const { data: names } = nameIds.length ? await supabase.from("profiles").select("id, full_name").in("id", nameIds) : { data: [] as { id: string; full_name: string | null }[] };
  const nameOf = new Map((names ?? []).map((n) => [n.id, n.full_name]));
  const draftLists = (lists ?? []).filter((l) => l.status === "draft");
  const refOf = (uid: string) => `NX-${uid.slice(0, 6).toUpperCase()}`;

  return (
    <AgencyShell L={L} active="/agency/requests" title={co?.name ?? s.details} intro={`${L.emp.reqStatus[req.status] ?? req.status} · ${req.vacancies_count}`}>
      <Link href="/agency/requests" className={`${btnSecondary} self-start`}>{L.emp.requestBack}</Link>

      <section className={`${cardCls} space-y-3`}>
        <h2 className="text-lg font-bold text-brand-dark">{s.details}</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">{s.positions}</dt><dd className="whitespace-pre-line">{req.positions}</dd></div>
          <div><dt className="text-muted">{s.vacancies}</dt><dd>{req.vacancies_count}</dd></div>
          {req.skills ? <div><dt className="text-muted">{s.skills}</dt><dd>{req.skills}</dd></div> : null}
          {req.locations ? <div><dt className="text-muted">{s.locations}</dt><dd>{req.locations}</dd></div> : null}
          {req.additional ? <div className="sm:col-span-2"><dt className="text-muted">{s.additional}</dt><dd className="whitespace-pre-line">{req.additional}</dd></div> : null}
          {req.confidential ? <div><dt className="text-muted">{s.confidential}</dt><dd>✓</dd></div> : null}
        </dl>
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-sm text-muted">{s.moveTo}:</span>
          {(NEXT_STATES[req.status] ?? []).map((to) => (
            <MiniAction key={to} action={setRequestStatus} fields={{ id: req.id, to }} label={s.status[to] ?? to} L={L} secondary danger={to === "declined" || to === "closed"} />
          ))}
        </div>
      </section>

      <section className={`${cardCls} space-y-3`}>
        <h2 className="text-lg font-bold text-brand-dark">{s.assignedTo}</h2>
        <p className="text-sm">{assignedIds.size ? (assignedNames.length ? assignedNames.join("، ") : `${assignedIds.size}`) : s.unassigned}</p>
        {isAdmin ? (
          <SelectAction action={assignRecruiter} name="recruiter_id" hidden={{ request_id: req.id }} options={recruiters.filter((r) => !assignedIds.has(r.value))}
            placeholder={s.chooseRecruiter} label={s.assignBtn} L={L} />
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-brand-dark">{s.shortlists}</h2>
        <TitleAction action={createShortlist} hidden={{ request_id: req.id }} label={s.create} placeholder={s.shortlistTitle} L={L} />
        {(lists ?? []).map((l) => {
          const its = (items ?? []).filter((i) => i.shortlist_id === l.id);
          return (
            <div key={l.id} className={`${cardCls} space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{l.title}</h3>
                <span className={badgeBrand}>{l.status === "submitted" ? s.submitted : s.draft}</span>
              </div>
              {its.length ? (
                <ul className="divide-y divide-line">
                  {its.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span>
                        <span className="font-medium">{i.disclosure === "full" ? (nameOf.get(i.candidate_id) ?? refOf(i.candidate_id)) : refOf(i.candidate_id)}</span>
                        <span className="text-muted"> · {s.disclosure[i.disclosure] ?? i.disclosure} · {s.consent[i.consent_status] ?? i.consent_status}</span>
                      </span>
                      {l.status === "draft" ? <MiniAction action={removeFromShortlist} fields={{ id: i.id }} label={s.remove} L={L} secondary danger /> : null}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">{s.noItems}</p>}
              {l.status === "draft" && its.length ? <SubmitShortlistForm action={submitShortlist} id={l.id} checkbox={s.reviewedBox} label={s.submitShortlist} L={L} /> : null}
            </div>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-brand-dark">{s.poolTitle}</h2>
        <p className="text-sm text-muted">{s.poolIntro}</p>
        <form method="get" className="flex flex-wrap gap-2">
          <input name="q" defaultValue={q ?? ""} maxLength={80} placeholder={s.poolSearch} aria-label={s.poolSearch} className={`${inputCls} max-w-sm`} />
          <button className={btnSecondary}>{s.search}</button>
        </form>
        {!draftLists.length ? <p className="text-sm text-muted">{s.draftFirst}</p> : null}
        {pool?.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {pool.map((p) => (
              <li key={p.user_id} className={`${cardCls} space-y-2`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{p.resume_visibility === "searchable" ? (nameOf.get(p.user_id) ?? refOf(p.user_id)) : `${refOf(p.user_id)} · ${s.hiddenName}`}</h3>
                  {p.seniority ? <span className={badgeBrand}>{L.jobs.levels[p.seniority] ?? p.seniority}</span> : null}
                </div>
                {p.headline ? <p className="text-sm font-medium">{p.headline}</p> : null}
                {p.summary ? <p className="line-clamp-3 text-sm text-muted">{p.summary}</p> : null}
                {draftLists.length ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {draftLists.slice(0, 1).map((l) => (
                      <div key={l.id} className="flex flex-wrap gap-2">
                        <MiniAction action={addToShortlist} fields={{ shortlist_id: l.id, candidate_id: p.user_id, disclosure: "anonymized" }} label={s.addAnon} L={L} secondary />
                        <MiniAction action={addToShortlist} fields={{ shortlist_id: l.id, candidate_id: p.user_id, disclosure: "full" }} label={s.addFull} L={L} secondary />
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">{s.poolEmpty}</p>}
      </section>
    </AgencyShell>
  );
}
