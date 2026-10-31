"use client";

import { useActionState } from "react";
import { addExternalPost, addSource, importNow, updateExternal } from "@/app/actions/external-jobs";
import { Field } from "@/components/forms/Field";
import { FormError, FormOk, useOp, type OpsLabels } from "@/components/forms/OpForms";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { cardCls, inputCls } from "@/components/ui/styles";
import { CriteriaBuilder } from "@/components/forms/CriteriaBuilder";
import { fit } from "@/content/fit";
import type { Criterion } from "@/lib/eligibility";
import type { Locale } from "@/lib/i18n";
import { idle } from "@/lib/ops";
import type { ingest } from "@/content/ingest";

type T = (typeof ingest)["en"] | (typeof ingest)["ar"];

export function PastePostForm({ T, L }: { T: T; L: OpsLabels }) {
  const [state, action] = useActionState(addExternalPost, idle);
  const { err, formErr } = useOp(state, L);
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <div>
        <h2 className="text-lg font-semibold text-brand-dark">{T.paste}</h2>
        <p className="mt-1 text-sm text-muted">{T.pasteHint}</p>
      </div>
      <FormError message={formErr} />
      {state.status === "success" ? <FormOk message={T.added} /> : null}
      <Field id="ex-text" label={T.postText} error={err("text")}>
        <textarea id="ex-text" name="text" rows={10} maxLength={20000} required className={inputCls} aria-invalid={!!err("text")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ex-src" label={T.sourceName} error={err("source_name")}>
          <input id="ex-src" name="source_name" maxLength={120} required placeholder={T.sourceNamePh} className={inputCls} aria-invalid={!!err("source_name")} />
        </Field>
        <Field id="ex-url" label={T.postUrl} hint={T.postUrlHint} error={err("post_url")}>
          <input id="ex-url" name="post_url" type="url" inputMode="url" dir="ltr" placeholder="https://" className={inputCls} aria-invalid={!!err("post_url")} />
        </Field>
      </div>
      <SubmitButton pending="…">{T.add}</SubmitButton>
    </form>
  );
}

export function AddSourceForm({ T, L }: { T: T; L: OpsLabels }) {
  const [state, action] = useActionState(addSource, idle);
  const { err, formErr } = useOp(state, L);
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <h3 className="font-semibold text-brand-dark">{T.addSource}</h3>
      <FormError message={formErr} />
      {state.status === "success" ? <FormOk message={L.common.saved} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="so-name" label={T.sName} error={err("name")}>
          <input id="so-name" name="name" maxLength={120} required className={inputCls} aria-invalid={!!err("name")} />
        </Field>
        <Field id="so-kind" label={T.sKind} error={err("kind")}>
          <select id="so-kind" name="kind" defaultValue="telegram_channel" className={inputCls}>
            <option value="telegram_channel">{T.kinds.telegram_channel}</option>
            <option value="rss_feed">{T.kinds.rss_feed}</option>
            <option value="career_page">{T.kinds.career_page}</option>
          </select>
        </Field>
        <Field id="so-handle" label={T.sHandle} error={err("handle")}>
          <input id="so-handle" name="handle" dir="ltr" maxLength={64} className={inputCls} aria-invalid={!!err("handle")} />
        </Field>
        <Field id="so-url" label={T.sUrl} error={err("url")}>
          <input id="so-url" name="url" type="url" dir="ltr" placeholder="https://" className={inputCls} aria-invalid={!!err("url")} />
        </Field>
      </div>
      <Field id="so-basis" label={T.sBasis} hint={T.sBasisHint} error={err("basis")}>
        <textarea id="so-basis" name="basis" rows={2} maxLength={500} required className={inputCls} aria-invalid={!!err("basis")} />
      </Field>
      <SubmitButton pending="…">{T.addSource}</SubmitButton>
    </form>
  );
}

export function ImportNowForm({ T, L }: { T: T; L: OpsLabels }) {
  const [state, action] = useActionState(importNow, idle);
  const { formErr } = useOp(state, L);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton pending={T.importing}>{T.importNow}</SubmitButton>
      <FormError message={formErr} />
      {state.status === "success" ? (
        <div role="status" className="rounded-lg border border-line bg-surface p-3 text-sm">
          <p className="font-medium">{T.importDone}</p>
          <p className="mt-1 whitespace-pre-line text-muted" dir="auto">{state.info}</p>
        </div>
      ) : null}
    </form>
  );
}

export type EditableExternal = {
  id: string; title: string; agency: string | null; client_note: string | null; city: string | null; salary_note: string | null;
  apply_url: string | null; apply_email: string | null; apply_phone: string | null; responsibilities: string[]; requirements: string[]; expires_on: string; criteria: Criterion[];
};

export function EditExternalForm({ job, cities, T, L, locale }: { locale: Locale; job: EditableExternal; cities: { slug: string; label: string }[]; T: T; L: OpsLabels }) {
  const [state, action] = useActionState(updateExternal, idle);
  const { err, formErr } = useOp(state, L);
  const k = (n: string) => `ed-${job.id}-${n}`;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-brand">{T.edit}</summary>
      <form action={action} className="mt-3 space-y-3" noValidate>
        <input type="hidden" name="id" value={job.id} />
        <FormError message={formErr} />
        {state.status === "success" ? <FormOk message={T.saved} /> : null}
        <Field id={k("title")} label={T.fTitle} error={err("title")}>
          <input id={k("title")} name="title" defaultValue={job.title} maxLength={160} required className={inputCls} dir="auto" />
        </Field>
        <Field id={k("note")} label={T.fClientNote} error={err("client_note")}>
          <textarea id={k("note")} name="client_note" rows={2} maxLength={400} defaultValue={job.client_note ?? ""} className={inputCls} dir="auto" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id={k("agency")} label={T.fAgency} error={err("agency")}>
            <input id={k("agency")} name="agency" defaultValue={job.agency ?? ""} maxLength={120} className={inputCls} dir="auto" />
          </Field>
          <Field id={k("city")} label={T.city} error={err("city")}>
            <select id={k("city")} name="city" defaultValue={job.city ?? ""} className={inputCls}>
              <option value="">—</option>
              {cities.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </Field>
          <Field id={k("sal")} label={T.salary} error={err("salary_note")}>
            <input id={k("sal")} name="salary_note" defaultValue={job.salary_note ?? ""} maxLength={200} className={inputCls} dir="auto" />
          </Field>
          <Field id={k("exp")} label={T.fExpires} hint={T.fExpiresHint} error={err("expires_on")}>
            <input id={k("exp")} name="expires_on" type="date" defaultValue={job.expires_on} required className={inputCls} dir="ltr" />
          </Field>
        </div>
        <fieldset className="space-y-3 rounded-lg border border-line p-3">
          <legend className="px-1 text-sm font-medium">{T.fRoute}</legend>
          <Field id={k("url")} label={T.fApplyUrl} error={err("apply_url")}>
            <input id={k("url")} name="apply_url" type="url" defaultValue={job.apply_url ?? ""} className={inputCls} dir="ltr" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={k("mail")} label={T.fApplyEmail} error={err("apply_email")}>
              <input id={k("mail")} name="apply_email" type="email" defaultValue={job.apply_email ?? ""} className={inputCls} dir="ltr" />
            </Field>
            <Field id={k("tel")} label={T.fApplyPhone} error={err("apply_phone")}>
              <input id={k("tel")} name="apply_phone" inputMode="tel" defaultValue={job.apply_phone ?? ""} className={inputCls} dir="ltr" />
            </Field>
          </div>
        </fieldset>
        <CriteriaBuilder locale={locale} L={fit[locale]} initial={job.criteria} />
        {err("criteria") ? <p role="alert" className="text-xs text-danger">{err("criteria")}</p> : null}
        <Field id={k("resp")} label={T.tasks} hint={T.fLinesHint} error={err("responsibilities")}>
          <textarea id={k("resp")} name="responsibilities" rows={4} defaultValue={job.responsibilities.join("\n")} className={inputCls} dir="auto" />
        </Field>
        <Field id={k("req")} label={T.reqs} hint={T.fLinesHint} error={err("requirements")}>
          <textarea id={k("req")} name="requirements" rows={4} defaultValue={job.requirements.join("\n")} className={inputCls} dir="auto" />
        </Field>
        <SubmitButton pending="…">{T.save}</SubmitButton>
      </form>
    </details>
  );
}
