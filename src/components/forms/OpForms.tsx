"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  applyToJob, deleteResume, respondConsent, registerResume, saveCandidateProfile, setPoolConsent, setPrimaryResume, setVisibility, withdrawApplication,
} from "@/app/actions/candidate";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { btnSecondary, cardCls, inputCls } from "@/components/ui/styles";
import { createClient } from "@/lib/supabase/browser";
import { idle, type OpState } from "@/lib/ops";
import type { ops } from "@/content/ops";

export type OpsLabels = (typeof ops)["en"];

export function useOp(state: OpState, L: OpsLabels) {
  const err = (k: string) => (state.status === "error" && state.errors[k] ? (L.errors[state.errors[k]] ?? L.errors.invalid) : undefined);
  const formErr = state.status === "error" && state.form ? (L.errors[state.form] ?? L.errors.server) : undefined;
  return { err, formErr };
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{message}</p>;
}
export function FormOk({ message }: { message: string }) {
  return <p role="status" className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm font-medium text-success">{message}</p>;
}

export type ApplyResume = { id: string; file_name: string; is_primary: boolean };

export function ApplyForm({ jobId, L, resumes = [], profileFilled = false }: { jobId: string; L: OpsLabels; resumes?: ApplyResume[]; profileFilled?: boolean }) {
  const [state, action] = useActionState(applyToJob, idle);
  const { err, formErr } = useOp(state, L);
  if (state.status === "success") {
    return (
      <div className={`${cardCls} space-y-3`} role="status">
        <h2 className="text-lg font-semibold text-success">{L.apply.done}</h2>
        <p className="text-sm text-muted">{L.apply.doneBody}</p>
        <Link href="/candidate" className={btnSecondary}>{L.apply.track}</Link>
      </div>
    );
  }
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <h2 className="text-lg font-semibold text-brand-dark">{L.apply.title}</h2>
      <FormError message={formErr} />
      <input type="hidden" name="job_id" value={jobId} />
      <Field id="ap-note" label={`${L.apply.note} (${L.common.optional})`} hint={L.apply.noteHint} error={err("cover_note")}>
        <textarea id="ap-note" name="cover_note" rows={4} maxLength={2000} className={inputCls} aria-invalid={!!err("cover_note")} />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">{L.apply.attachCv}</legend>
        {resumes.length ? (
          <>
            {resumes.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input type="radio" name="resume_id" value={r.id} defaultChecked={r.is_primary || resumes.length === 1} className="size-4 accent-brand" />
                <span dir="auto">{r.file_name}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="radio" name="resume_id" value="none" className="size-4 accent-brand" />{L.apply.attachNone}
            </label>
          </>
        ) : <p className="text-sm text-muted">{L.apply.noCvYet}</p>}
      </fieldset>
      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="share_profile" defaultChecked className="mt-0.5 size-4 accent-brand" />{L.apply.shareProfile}
        </label>
        <p className="ps-6 text-xs text-muted">{L.apply.shareHint}</p>
        {!profileFilled ? (
          <p className="ps-6 text-xs text-muted">{L.apply.profileEmpty} <Link href="/candidate/profile" className="text-brand underline underline-offset-4 hover:no-underline">{L.apply.editProfile}</Link></p>
        ) : null}
      </div>
      <SubmitButton pending={L.apply.submitting}>{L.apply.submit}</SubmitButton>
    </form>
  );
}

export function WithdrawButton({ id, L }: { id: string; L: OpsLabels }) {
  const [state, action] = useActionState(withdrawApplication, idle);
  const { formErr } = useOp(state, L);
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pending={L.cand.withdrawing}>{L.cand.withdraw}</SubmitButton>
      <FormError message={formErr} />
    </form>
  );
}

export function CandidateProfileForm({
  L, cities, initial,
}: {
  L: OpsLabels;
  cities: { slug: string; label: string }[];
  initial: { headline: string; summary: string; years: string; seniority: string; functions: string; locations: string[] };
}) {
  const [state, action] = useActionState(saveCandidateProfile, idle);
  const { err, formErr } = useOp(state, L);
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      {state.status === "success" ? <FormOk message={L.common.saved} /> : null}
      <FormError message={formErr} />
      <Field id="cp-headline" label={L.cand.headline} hint={L.cand.headlineHint} error={err("headline")}>
        <input id="cp-headline" name="headline" defaultValue={initial.headline} maxLength={140} className={inputCls} aria-invalid={!!err("headline")} />
      </Field>
      <Field id="cp-summary" label={L.cand.summary} hint={L.cand.summaryHint} error={err("summary")}>
        <textarea id="cp-summary" name="summary" rows={5} defaultValue={initial.summary} maxLength={3000} className={inputCls} aria-invalid={!!err("summary")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="cp-years" label={L.cand.years} error={err("years_experience")}>
          <input id="cp-years" name="years_experience" type="number" inputMode="numeric" min={0} max={60} dir="ltr" defaultValue={initial.years} className={inputCls} aria-invalid={!!err("years_experience")} />
        </Field>
        <Field id="cp-level" label={L.cand.seniority} error={err("seniority")}>
          <select id="cp-level" name="seniority" defaultValue={initial.seniority} className={inputCls}>
            <option value="" />
            {Object.entries(L.jobs.levels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </div>
      <Field id="cp-functions" label={L.cand.functions} hint={L.cand.functionsHint} error={err("preferred_functions")}>
        <input id="cp-functions" name="preferred_functions" defaultValue={initial.functions} maxLength={400} className={inputCls} aria-invalid={!!err("preferred_functions")} />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">{L.cand.locations}</legend>
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <label key={c.slug} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="checkbox" name="preferred_locations" value={c.slug} defaultChecked={initial.locations.includes(c.slug)} className="size-4 accent-brand" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton pending={L.common.saving}>{L.common.save}</SubmitButton>
    </form>
  );
}

const MAX = 5 * 1024 * 1024;

/** Uploads straight to Storage with the user's own session (RLS applies), then asks the server to verify and register the file. */
export function ResumeUploader({ L, userId }: { L: OpsLabels; userId: string }) {
  const [state, action] = useActionState(registerResume, idle);
  const { formErr } = useOp(state, L);
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState<string>();
  const pathRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onUpload() {
    setLocalErr(undefined);
    const file = fileRef.current?.files?.[0];
    if (!file) return setLocalErr(L.errors.required);
    const lower = file.name.toLowerCase();
    const ext = lower.endsWith(".pdf") ? "pdf" : lower.endsWith(".docx") ? "docx" : null;
    if (!ext) return setLocalErr(L.errors.file_type);
    if (file.size < 1 || file.size > MAX) return setLocalErr(L.errors.file_size);
    setBusy(true);
    const p = `${userId}/${crypto.randomUUID()}.${ext}`;
    const contentType = ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const { error } = await createClient().storage.from("resumes").upload(p, file, { contentType, upsert: false });
    if (error) { setBusy(false); return setLocalErr(L.errors.upload_failed); }
    // Write the values straight into the hidden inputs (no state round-trip), then submit the verification action.
    if (pathRef.current) pathRef.current.value = p;
    if (nameRef.current) nameRef.current.value = file.name;
    formRef.current?.requestSubmit();
    if (fileRef.current) fileRef.current.value = "";
    setBusy(false);
  }

  return (
    <form ref={formRef} action={action} className={`${cardCls} space-y-3`}>
      <input ref={pathRef} type="hidden" name="path" defaultValue="" />
      <input ref={nameRef} type="hidden" name="file_name" defaultValue="" />
      <label htmlFor="cv-file" className="block text-sm font-medium text-ink">{L.cand.choose}</label>
      <input id="cv-file" ref={fileRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="block w-full text-sm file:me-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-brand-soft file:px-4 file:font-semibold file:text-brand" />
      <p className="text-xs text-muted">{L.cand.sizeNote}</p>
      <FormError message={localErr ?? formErr} />
      {state.status === "success" && !localErr ? <FormOk message={L.cand.uploaded} /> : null}
      <button type="button" onClick={onUpload} disabled={busy} className={`${btnSecondary} disabled:opacity-60`}>
        {busy ? L.cand.uploading : L.cand.upload}
      </button>
    </form>
  );
}

export function ResumeRowActions({ id, isPrimary, L }: { id: string; isPrimary: boolean; L: OpsLabels }) {
  const [delState, delAction] = useActionState(deleteResume, idle);
  const [primState, primAction] = useActionState(setPrimaryResume, idle);
  const e1 = useOp(delState, L).formErr, e2 = useOp(primState, L).formErr;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isPrimary ? (
        <form action={primAction}><input type="hidden" name="id" value={id} /><button className={`${btnSecondary} !min-h-9 !px-3`}>{L.cand.makePrimary}</button></form>
      ) : null}
      <form action={delAction}><input type="hidden" name="id" value={id} /><button className={`${btnSecondary} !min-h-9 !px-3 text-danger`}>{L.cand.delete}</button></form>
      <FormError message={e1 ?? e2} />
    </div>
  );
}

export function PoolPanel({ L, visibility, hasCv, consentActive }: { L: OpsLabels; visibility: "private" | "anonymized" | "searchable"; hasCv: boolean; consentActive: boolean }) {
  const [joinState, joinAction] = useActionState(setPoolConsent, idle);
  const [visState, visAction] = useActionState(setVisibility, idle);
  const j = useOp(joinState, L), v = useOp(visState, L);
  const statusLabel = !consentActive || visibility === "private" ? L.cand.poolOut : visibility === "anonymized" ? L.cand.poolAnon : L.cand.poolSearch;
  return (
    <div className={`${cardCls} space-y-4`}>
      <h2 className="text-xl font-bold text-brand-dark">{L.cand.poolTitle}</h2>
      <p className="text-sm text-muted">{L.cand.poolIntro}</p>
      <p className="rounded-xl bg-surface px-4 py-3 text-sm"><strong>{L.cand.poolStatus}:</strong> {statusLabel}</p>
      {consentActive ? (
        <>
          <form action={visAction} className="space-y-3">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">{L.cand.poolVisibility}</legend>
              {(["anonymized", "searchable"] as const).map((o) => (
                <label key={o} className="flex min-h-11 items-start gap-2 text-sm">
                  <input type="radio" name="visibility" value={o} defaultChecked={visibility === o} className="mt-1 size-4 accent-brand" />
                  {o === "anonymized" ? L.cand.visAnon : L.cand.visSearch}
                </label>
              ))}
            </fieldset>
            <FormError message={v.formErr} />
            {visState.status === "success" ? <FormOk message={L.common.saved} /> : null}
            <SubmitButton pending={L.common.saving}>{L.cand.changeVis}</SubmitButton>
          </form>
          <form action={joinAction}>
            <input type="hidden" name="action" value="withdrawn" />
            <FormError message={j.formErr} />
            <button className={`${btnSecondary} text-danger`}>{L.cand.withdrawPool}</button>
          </form>
        </>
      ) : (
        <form action={joinAction} className="space-y-3" noValidate>
          <input type="hidden" name="action" value="granted" />
          {!hasCv ? <p className="text-sm text-warning">{L.cand.needCvForPool}</p> : null}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">{L.cand.poolVisibility}</legend>
            {(["anonymized", "searchable"] as const).map((o) => (
              <label key={o} className="flex min-h-11 items-start gap-2 text-sm">
                <input type="radio" name="visibility" value={o} defaultChecked={o === "anonymized"} className="mt-1 size-4 accent-brand" />
                {o === "anonymized" ? L.cand.visAnon : L.cand.visSearch}
              </label>
            ))}
          </fieldset>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirm" className="mt-1 size-4 accent-brand" aria-invalid={!!j.err("confirm")} />
            <span>{L.cand.poolConsent}</span>
          </label>
          {j.err("confirm") ? <p role="alert" className="text-xs text-danger">{j.err("confirm")}</p> : null}
          <FormError message={j.formErr ?? j.err("visibility")} />
          <SubmitButton pending={L.common.saving}>{L.cand.join}</SubmitButton>
          <p className="text-xs text-muted">{L.cand.poolHistory}</p>
        </form>
      )}
    </div>
  );
}

export function ConsentRespond({ id, granted, L }: { id: string; granted: boolean; L: OpsLabels }) {
  const [state, action] = useActionState(respondConsent, idle);
  const { formErr } = useOp(state, L);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {granted ? (
        <button name="grant" value="no" className={`${btnSecondary} !min-h-9 !px-3 text-danger`}>{L.cand.consentRevoke}</button>
      ) : (
        <>
          <button name="grant" value="yes" className={`${btnSecondary} !min-h-9 !px-3`}>{L.cand.consentAllow}</button>
          <button name="grant" value="no" className={`${btnSecondary} !min-h-9 !px-3`}>{L.cand.consentDecline}</button>
        </>
      )}
      <FormError message={formErr} />
    </form>
  );
}
