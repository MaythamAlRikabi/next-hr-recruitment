"use client";

import { useActionState } from "react";
import { addExternalPost, addSource, importNow } from "@/app/actions/external-jobs";
import { Field } from "@/components/forms/Field";
import { FormError, FormOk, useOp, type OpsLabels } from "@/components/forms/OpForms";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { cardCls, inputCls } from "@/components/ui/styles";
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
