"use client";

import Link from "next/link";
import { useActionState } from "react";
import { applyExternal } from "@/app/actions/external-apply";
import { Field } from "@/components/forms/Field";
import { FormError, useOp, type ApplyResume, type OpsLabels } from "@/components/forms/OpForms";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { btnSecondary, cardCls, inputCls } from "@/components/ui/styles";
import { idle } from "@/lib/ops";
import type { fit } from "@/content/fit";

type F = (typeof fit)["en"];

/** Shows exactly what will be sent and asks for explicit consent. The database re-checks eligibility on insert. */
export function ExternalApplyForm({ jobId, resumes, O, F }: { jobId: string; resumes: ApplyResume[]; O: OpsLabels; F: F }) {
  const [state, action] = useActionState(applyExternal, idle);
  const { err, formErr } = useOp(state, O);
  if (state.status === "success") {
    return (
      <div className={`${cardCls} space-y-3`} role="status">
        <h2 className="text-lg font-semibold text-success">{F.doneTitle}</h2>
        <p className="text-sm text-muted">{F.doneBody}</p>
        <Link href="/jobs" className={btnSecondary}>{F.back}</Link>
      </div>
    );
  }
  return (
    <form action={action} className={`${cardCls} space-y-5`} noValidate>
      <h2 className="text-lg font-semibold text-brand-dark">{F.viaNext}</h2>
      <p className="text-sm text-muted">{F.viaIntro}</p>
      <FormError message={formErr} />
      <input type="hidden" name="external_job_id" value={jobId} />
      <Field id="ea-note" label={F.note} error={err("cover_note")}>
        <textarea id="ea-note" name="cover_note" rows={3} maxLength={2000} className={inputCls} />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">{F.cv}</legend>
        {resumes.length ? (
          <>
            {resumes.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input type="radio" name="resume_id" value={r.id} defaultChecked={r.is_primary || resumes.length === 1} className="size-4 accent-brand" />
                <span dir="auto">{r.file_name}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="radio" name="resume_id" value="none" className="size-4 accent-brand" />{F.cvNone}
            </label>
          </>
        ) : (
          <p className="text-sm text-muted">{F.noCv} <Link href="/candidate/cv" className="text-brand underline underline-offset-4 hover:no-underline">{F.addCv}</Link></p>
        )}
      </fieldset>
      <div className="space-y-2 rounded-xl bg-brand-soft/60 p-4 text-sm">
        <p className="font-semibold text-midnight">{F.previewTitle}</p>
        <ul className="list-disc space-y-1 ps-5 text-ink">
          <li>{F.pvName}</li><li>{F.pvHeadline}</li><li>{F.pvCv}</li><li>{F.pvNote}</li><li>{F.pvConds}</li>
        </ul>
      </div>
      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="consent" className="mt-0.5 size-4 accent-brand" aria-invalid={!!err("consent")} />{F.consent}
        </label>
        {err("consent") ? <p role="alert" className="text-xs text-danger">{err("consent")}</p> : null}
      </div>
      <SubmitButton pending={F.sending}>{F.send}</SubmitButton>
    </form>
  );
}
