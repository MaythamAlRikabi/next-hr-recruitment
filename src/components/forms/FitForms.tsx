"use client";

import { useActionState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { addEducation, addExperience, removeEducation, removeExperience } from "@/app/actions/candidate";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormError, FormOk, useOp, type OpsLabels } from "@/components/forms/OpForms";
import { cardCls, inputCls } from "@/components/ui/styles";
import { FIELDS, LEVELS, fieldLabel, levelLabel, monthsText } from "@/lib/eligibility";
import { idle, type OpState } from "@/lib/ops";
import type { Locale } from "@/lib/i18n";
import type { fit } from "@/content/fit";

type FitLabels = (typeof fit)["en"];
export type EduItem = { id: string; level: string; field: string; institution: string | null; graduation_year: number | null };
export type ExpItem = { id: string; title: string; field: string; months: number };

function RemoveButton({ id, action, L, label }: { id: string; action: (p: OpState, fd: FormData) => Promise<OpState>; L: OpsLabels; label: string }) {
  const [state, run] = useActionState(action, idle);
  const { formErr } = useOp(state, L);
  return (
    <form action={run} className="shrink-0">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pending="…" className="inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-danger/10 hover:text-danger">
        <Trash2 className="size-4" aria-hidden /><span className="sr-only">{label}</span>
      </SubmitButton>
      {formErr ? <span role="alert" className="sr-only">{formErr}</span> : null}
    </form>
  );
}

function FieldSelect({ id, name, locale, L }: { id: string; name: string; locale: Locale; L: FitLabels }) {
  return (
    <select id={id} name={name} defaultValue="" className={inputCls} required>
      <option value="" disabled>{L.choose}</option>
      {FIELDS.map((f) => <option key={f.slug} value={f.slug}>{f[locale]}</option>)}
    </select>
  );
}

function AddEducation({ L, O, locale }: { L: FitLabels; O: OpsLabels; locale: Locale }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, run] = useActionState(async (p: OpState, fd: FormData) => {
    const r = await addEducation(p, fd);
    if (r.status === "success") ref.current?.reset();
    return r;
  }, idle);
  const { err, formErr } = useOp(state, O);
  return (
    <form ref={ref} action={run} className="space-y-4 rounded-xl bg-brand-soft/60 p-4" noValidate>
      <FormError message={formErr} />
      {state.status === "success" ? <FormOk message={L.saved} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="edu-level" label={L.level} error={err("level")}>
          <select id="edu-level" name="level" defaultValue="" className={inputCls} required>
            <option value="" disabled>{L.choose}</option>
            {LEVELS.map((l) => <option key={l.slug} value={l.slug}>{l[locale]}</option>)}
          </select>
        </Field>
        <Field id="edu-field" label={L.field} error={err("field")}><FieldSelect id="edu-field" name="field" locale={locale} L={L} /></Field>
        <Field id="edu-inst" label={`${L.institution} (${L.optional})`} error={err("institution")}>
          <input id="edu-inst" name="institution" maxLength={120} className={inputCls} />
        </Field>
        <Field id="edu-year" label={`${L.gradYear} (${L.optional})`} error={err("graduation_year")}>
          <input id="edu-year" name="graduation_year" type="number" inputMode="numeric" min={1960} max={new Date().getFullYear() + 6} className={inputCls} />
        </Field>
      </div>
      <SubmitButton pending={L.adding}>{L.addEdu}</SubmitButton>
    </form>
  );
}

function AddExperience({ L, O, locale }: { L: FitLabels; O: OpsLabels; locale: Locale }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, run] = useActionState(async (p: OpState, fd: FormData) => {
    const r = await addExperience(p, fd);
    if (r.status === "success") ref.current?.reset();
    return r;
  }, idle);
  const { err, formErr } = useOp(state, O);
  return (
    <form ref={ref} action={run} className="space-y-4 rounded-xl bg-brand-soft/60 p-4" noValidate>
      <FormError message={formErr} />
      {state.status === "success" ? <FormOk message={L.saved} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="exp-title" label={L.jobTitle} error={err("title")}>
          <input id="exp-title" name="title" maxLength={120} className={inputCls} aria-invalid={!!err("title")} />
        </Field>
        <Field id="exp-field" label={L.workField} error={err("field")}><FieldSelect id="exp-field" name="field" locale={locale} L={L} /></Field>
        <Field id="exp-years" label={L.years} error={err("years")}>
          <input id="exp-years" name="years" type="number" inputMode="numeric" min={0} max={50} defaultValue={0} className={inputCls} />
        </Field>
        <Field id="exp-months" label={L.months} error={err("months")}>
          <input id="exp-months" name="months" type="number" inputMode="numeric" min={0} max={11} defaultValue={0} className={inputCls} />
        </Field>
      </div>
      <SubmitButton pending={L.adding}>{L.addExp}</SubmitButton>
    </form>
  );
}

export function FitSection({ L, O, locale, education, experience }: { L: FitLabels; O: OpsLabels; locale: Locale; education: EduItem[]; experience: ExpItem[] }) {
  return (
    <section id="fit" className="scroll-mt-24 space-y-5">
      <div>
        <h2 className="t-h3 text-midnight">{L.title}</h2>
        <p className="mt-1 text-sm text-muted">{L.intro}</p>
      </div>

      <div className={`${cardCls} space-y-4`}>
        <h3 className="font-bold text-midnight">{L.eduTitle}</h3>
        {education.length ? (
          <ul className="divide-y divide-line">
            {education.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-semibold text-midnight">{levelLabel(e.level, locale)} · {fieldLabel(e.field, locale)}</p>
                  <p className="truncate text-sm text-muted" dir="auto">{[e.institution, e.graduation_year].filter(Boolean).join(" · ")}</p>
                </div>
                <RemoveButton id={e.id} action={removeEducation} L={O} label={L.remove} />
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">{L.eduEmpty}</p>}
        <AddEducation L={L} O={O} locale={locale} />
      </div>

      <div className={`${cardCls} space-y-4`}>
        <h3 className="font-bold text-midnight">{L.expTitle}</h3>
        {experience.length ? (
          <ul className="divide-y divide-line">
            {experience.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="font-semibold text-midnight" dir="auto">{x.title}</p>
                  <p className="text-sm text-muted">{fieldLabel(x.field, locale)} · {monthsText(x.months, locale)}</p>
                </div>
                <RemoveButton id={x.id} action={removeExperience} L={O} label={L.remove} />
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">{L.expEmpty}</p>}
        <AddExperience L={L} O={O} locale={locale} />
      </div>
    </section>
  );
}

