import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { fit } from "@/content/fit";
import { fieldLabel, levelLabel, monthsText } from "@/lib/eligibility";
import { AgencyShell } from "@/components/layout/AgencyShell";
import { ReviewCredentialForm } from "@/components/forms/ReviewForms";
import { cardCls, btnSecondary } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Verification", robots: { index: false } };

type Item = { kind: "education" | "experience"; id: string; user_id: string; title: string; detail: string; proof_name: string | null; created_at: string };

export default async function VerificationsPage() {
  await requireRole(["next_recruiter", "next_admin", "super_admin"], "/agency/verifications");
  const locale = await getLocale();
  const L = ops[locale];
  const F = fit[locale];
  const supabase = await createClient();
  const [{ data: edu }, { data: exp }] = await Promise.all([
    supabase.from("candidate_education").select("id, user_id, level, field, institution, graduation_year, proof_name, created_at").eq("verification", "pending").order("created_at").limit(100),
    supabase.from("candidate_experience").select("id, user_id, title, field, months, proof_name, created_at").eq("verification", "pending").order("created_at").limit(100),
  ]);
  const items: Item[] = [
    ...(edu ?? []).map((e): Item => ({
      kind: "education", id: e.id, user_id: e.user_id, proof_name: e.proof_name, created_at: e.created_at,
      title: `${levelLabel(e.level, locale)} · ${fieldLabel(e.field, locale)}`, detail: [e.institution, e.graduation_year].filter(Boolean).join(" · "),
    })),
    ...(exp ?? []).map((x): Item => ({
      kind: "experience", id: x.id, user_id: x.user_id, proof_name: x.proof_name, created_at: x.created_at,
      title: `${x.title} · ${fieldLabel(x.field, locale)}`, detail: monthsText(x.months, locale),
    })),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const ids = [...new Set(items.map((i) => i.user_id))];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: ps } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    (ps ?? []).forEach((p) => names.set(p.id, p.full_name ?? "—"));
  }
  return (
    <AgencyShell L={L} active="/agency/verifications" title={F.reviewTitle} intro={F.reviewIntro}>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={`${i.kind}-${i.id}`} className={`${cardCls} space-y-3`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-brand">{i.kind === "education" ? F.kindEduShort : F.kindExpShort}</p>
                  <p className="font-semibold text-midnight" dir="auto">{i.title}</p>
                  {i.detail ? <p className="text-sm text-muted" dir="auto">{i.detail}</p> : null}
                  <p className="mt-1 text-sm text-ink">{F.candidate}: <span dir="auto">{names.get(i.user_id) ?? "—"}</span></p>
                </div>
                <a href={`/api/credentials/${i.kind}/${i.id}`} target="_blank" rel="noopener" className={btnSecondary}>{F.openProof}</a>
              </div>
              <ReviewCredentialForm kind={i.kind} id={i.id} L={L} approve={F.approve} reject={F.reject} />
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">{F.reviewEmpty}</p>}
    </AgencyShell>
  );
}
