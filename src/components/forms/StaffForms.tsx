"use client";

import { useActionState } from "react";
import { FormError, FormOk, useOp, type OpsLabels } from "@/components/forms/OpForms";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { btnSecondary } from "@/components/ui/styles";
import { idle, type OpState } from "@/lib/ops";

type Act = (prev: OpState, fd: FormData) => Promise<OpState>;

/** A tiny confirm-less action form: hidden fields + one button. The server action re-checks role and the database re-checks RLS. */
export function MiniAction({ action, fields, label, L, secondary, danger }: {
  action: Act; fields: Record<string, string>; label: string; L: OpsLabels; secondary?: boolean; danger?: boolean;
}) {
  const [state, run] = useActionState(action, idle);
  const { formErr } = useOp(state, L);
  return (
    <form action={run} className="inline-flex flex-col gap-1">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {secondary ? <button className={`${btnSecondary} !min-h-9 !px-3 ${danger ? "text-danger" : ""}`}>{label}</button> : <SubmitButton pending="…">{label}</SubmitButton>}
      <FormError message={formErr} />
    </form>
  );
}

export function SelectAction({ action, name, hidden, options, placeholder, label, L }: {
  action: Act; name: string; hidden: Record<string, string>; options: { value: string; label: string }[]; placeholder: string; label: string; L: OpsLabels;
}) {
  const [state, run] = useActionState(action, idle);
  const { formErr } = useOp(state, L);
  return (
    <form action={run} className="flex flex-wrap items-end gap-2">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <select name={name} required aria-label={placeholder} defaultValue="" className="min-h-10 rounded-xl border border-line bg-white px-3 text-sm">
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <SubmitButton pending="…">{label}</SubmitButton>
      {state.status === "success" ? <FormOk message={L.common.saved} /> : null}
      <FormError message={formErr} />
    </form>
  );
}

export function TitleAction({ action, hidden, label, placeholder, L }: { action: Act; hidden: Record<string, string>; label: string; placeholder: string; L: OpsLabels }) {
  const [state, run] = useActionState(action, idle);
  const { err, formErr } = useOp(state, L);
  return (
    <form action={run} className="flex flex-wrap items-end gap-2">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input name="title" required minLength={2} maxLength={140} placeholder={placeholder} aria-label={placeholder} className="min-h-10 min-w-56 rounded-xl border border-line bg-white px-3 text-sm" />
      <SubmitButton pending="…">{label}</SubmitButton>
      <FormError message={err("title") ?? formErr} />
    </form>
  );
}

export function SubmitShortlistForm({ action, id, checkbox, label, L }: { action: Act; id: string; checkbox: string; label: string; L: OpsLabels }) {
  const [state, run] = useActionState(action, idle);
  const { err, formErr } = useOp(state, L);
  return (
    <form action={run} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="reviewed" className="mt-1 size-4 accent-brand" /><span>{checkbox}</span></label>
      <FormError message={err("reviewed") ?? formErr} />
      <SubmitButton pending="…">{label}</SubmitButton>
    </form>
  );
}
