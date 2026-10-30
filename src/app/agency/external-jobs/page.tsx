import type { Metadata } from "next";
import { getRoles, getViewer, requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { ops } from "@/content/ops";
import { ingest } from "@/content/ingest";
import { AgencyShell } from "@/components/layout/AgencyShell";
import { MiniAction } from "@/components/forms/StaffForms";
import { AddSourceForm, PastePostForm } from "@/components/forms/ExternalJobForms";
import { moderateExternal, setSourceActive } from "@/app/actions/external-jobs";
import { cardCls } from "@/components/ui/styles";
import { cityLabel, fmtSalary } from "@/lib/jobs";

export const metadata: Metadata = { title: "External jobs", robots: { index: false } };

export default async function ExternalJobsAdminPage() {
  await requireRole(["next_recruiter", "next_admin", "super_admin"], "/agency/external-jobs");
  const locale = await getLocale();
  const L = ops[locale]; const T = ingest[locale];
  const viewer = await getViewer();
  const isAdmin = viewer ? (await getRoles(viewer.id)).some((r) => r === "next_admin" || r === "super_admin") : false;
  const supabase = await createClient();
  const [{ data: jobs }, { data: sources }] = await Promise.all([
    supabase.from("external_jobs")
      .select("id, title, agency, city, salary_min, salary_max, salary_currency, salary_note, apply_url, apply_email, apply_phone, source_label, source_url, parse_warnings, raw_text, created_at")
      .eq("status", "pending_review").order("created_at", { ascending: true }).limit(100),
    supabase.from("job_sources").select("id, kind, name, handle, url, basis, active, last_run_at, last_status").order("created_at"),
  ]);
  const configured = !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.CRON_SECRET;
  return (
    <AgencyShell L={L} active="/agency/external-jobs" title={T.title} intro={T.intro}>
      <PastePostForm T={T} L={L} />

      <section aria-labelledby="ex-pending" className="space-y-4">
        <h2 id="ex-pending" className="text-lg font-semibold text-brand-dark">{T.pending} ({jobs?.length ?? 0})</h2>
        {jobs?.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {jobs.map((j) => {
              const sal = fmtSalary(j);
              return (
                <li key={j.id} className={`${cardCls} space-y-3`}>
                  <div>
                    <h3 className="font-semibold text-ink">{j.title}</h3>
                    <p className="text-sm text-muted">
                      {j.agency ? `${T.agency}: ${j.agency} · ` : ""}{j.city ? `${cityLabel(j.city, locale)} · ` : ""}{T.source}: {j.source_label}
                    </p>
                    {sal || j.salary_note ? <p className="mt-1 text-sm" dir="auto">{T.salary}: {[sal, j.salary_note].filter(Boolean).join(" — ")}</p> : null}
                    <p className="mt-1 break-all text-xs text-muted" dir="ltr">{[j.apply_url, j.apply_email, j.apply_phone].filter(Boolean).join(" · ") || j.source_url}</p>
                  </div>
                  {j.parse_warnings?.length ? (
                    <div className="rounded-lg border border-line bg-surface p-3 text-sm">
                      <p className="font-medium">{T.warnings}</p>
                      <ul className="mt-1 list-disc ps-5 text-muted">{j.parse_warnings.map((w: string) => <li key={w}>{w}</li>)}</ul>
                    </div>
                  ) : null}
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-brand">{T.rawToggle}</summary>
                    <p className="mt-2 max-h-56 overflow-auto whitespace-pre-line rounded-lg bg-surface p-3 text-muted" dir="auto">{j.raw_text}</p>
                  </details>
                  <div className="flex flex-wrap gap-2">
                    <MiniAction action={moderateExternal} fields={{ id: j.id, to: "published" }} label={T.publish} L={L} />
                    <MiniAction action={moderateExternal} fields={{ id: j.id, to: "rejected" }} label={T.reject} L={L} secondary danger />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <p role="status" className="rounded-xl border border-line bg-white p-6 text-center text-muted">{T.none}</p>}
      </section>

      <section aria-labelledby="ex-sources" className="space-y-4">
        <div>
          <h2 id="ex-sources" className="text-lg font-semibold text-brand-dark">{T.sources}</h2>
          <p className="mt-1 text-sm text-muted">{T.sourcesIntro}</p>
          {!configured ? <p role="status" className="mt-2 rounded-lg border border-line bg-surface p-3 text-sm text-muted">{T.notConfigured}</p> : null}
        </div>
        {sources?.length ? (
          <ul className="grid gap-3">
            {sources.map((s) => (
              <li key={s.id} className={`${cardCls} flex flex-wrap items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="font-medium">{s.name} <span className="text-sm text-muted">· {T.kinds[s.kind as keyof typeof T.kinds]} · {s.active ? T.on : T.off}</span></p>
                  <p className="break-all text-xs text-muted" dir="ltr">{s.handle ? `t.me/s/${s.handle}` : s.url}</p>
                  <p className="text-xs text-muted">{T.lastRun}: {s.last_run_at ? new Date(s.last_run_at).toLocaleString(locale === "ar" ? "ar-IQ-u-nu-latn" : "en-GB") : T.never}{s.last_status ? ` — ${s.last_status}` : ""}</p>
                </div>
                {isAdmin ? <MiniAction action={setSourceActive} fields={{ id: s.id, on: s.active ? "0" : "1" }} label={s.active ? T.pause : T.resume} L={L} secondary /> : null}
              </li>
            ))}
          </ul>
        ) : null}
        {isAdmin ? <AddSourceForm T={T} L={L} /> : <p className="text-sm text-muted">{T.adminOnly}</p>}
      </section>
    </AgencyShell>
  );
}
