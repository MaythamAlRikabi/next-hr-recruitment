"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCompany, createJob, setApplicationStatus, setJobStatus, submitRecruitmentRequest } from "@/app/actions/employer";
import { Field } from "@/components/forms/Field";
import { FormError, FormOk, useOp, type OpsLabels } from "@/components/forms/OpForms";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { btnPrimary, btnSecondary, cardCls, inputCls } from "@/components/ui/styles";
import { idle } from "@/lib/ops";

type Opt = { slug: string; label: string };

function IntentButton({ intent, children, secondary }: { intent: string; children: React.ReactNode; secondary?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" name="intent" value={intent} disabled={pending} className={`${secondary ? btnSecondary : btnPrimary} disabled:opacity-60`}>{children}</button>;
}

export function CompanyForm({ L, cities, industries }: { L: OpsLabels; cities: Opt[]; industries: Opt[] }) {
  const [state, action] = useActionState(createCompany, idle);
  const { err, formErr } = useOp(state, L);
  const e = L.emp;
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <h2 className="text-lg font-semibold text-brand-dark">{e.companyForm}</h2>
      <p className="text-sm text-muted">{e.companyHint}</p>
      {state.status === "success" ? <FormOk message={L.common.saved} /> : null}
      <FormError message={formErr} />
      <Field id="co-name" label={e.name} error={err("name")}><input id="co-name" name="name" required maxLength={160} className={inputCls} aria-invalid={!!err("name")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="co-ind" label={e.industry} error={err("industry")}>
          <select id="co-ind" name="industry" className={inputCls}><option value="" />{industries.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}</select>
        </Field>
        <Field id="co-city" label={e.city} error={err("city")}>
          <select id="co-city" name="city" className={inputCls}><option value="" />{cities.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}</select>
        </Field>
        <Field id="co-mail" label={e.email} error={err("business_email")}><input id="co-mail" name="business_email" type="email" dir="ltr" className={inputCls} aria-invalid={!!err("business_email")} /></Field>
        <Field id="co-web" label={e.website} error={err("website")}><input id="co-web" name="website" dir="ltr" className={inputCls} aria-invalid={!!err("website")} /></Field>
        <Field id="co-size" label={e.size} error={err("size_range")}>
          <select id="co-size" name="size_range" className={inputCls}><option value="" />{["1-10", "11-50", "51-200", "201-1000", "1000+"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </Field>
        <Field id="co-contact" label={e.contact} error={err("contact_person")}><input id="co-contact" name="contact_person" maxLength={120} className={inputCls} /></Field>
      </div>
      <Field id="co-about" label={e.about} error={err("description")}><textarea id="co-about" name="description" rows={4} maxLength={2000} className={inputCls} /></Field>
      <SubmitButton pending={e.working}>{e.createCompany}</SubmitButton>
    </form>
  );
}

export function JobForm({ L, companies, cities, industries, minDeadline, maxDeadline }: { L: OpsLabels; companies: { id: string; name: string }[]; cities: Opt[]; industries: Opt[]; minDeadline: string; maxDeadline: string }) {
  const [state, action] = useActionState(createJob, idle);
  const { err, formErr } = useOp(state, L);
  const e = L.emp;
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <FormError message={formErr} />
      <Field id="jb-co" label={e.company} error={err("company_id")}>
        <select id="jb-co" name="company_id" className={inputCls}>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </Field>
      <Field id="jb-title" label={e.jobTitle} error={err("title")}><input id="jb-title" name="title" maxLength={160} className={inputCls} aria-invalid={!!err("title")} /></Field>
      <Field id="jb-desc" label={e.jobDesc} hint={e.jobDescHint} error={err("description")}><textarea id="jb-desc" name="description" rows={7} maxLength={10000} className={inputCls} aria-invalid={!!err("description")} /></Field>
      <Field id="jb-req" label={`${e.reqs} (${L.common.optional})`} error={err("requirements")}><textarea id="jb-req" name="requirements" rows={4} maxLength={5000} className={inputCls} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="jb-city" label={e.city} error={err("city")}><select id="jb-city" name="city" className={inputCls} defaultValue=""><option value="" disabled />{cities.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}</select></Field>
        <Field id="jb-ind" label={e.industry} error={err("industry")}><select id="jb-ind" name="industry" className={inputCls}><option value="" />{industries.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}</select></Field>
        <Field id="jb-type" label={e.type} error={err("employment_type")}><select id="jb-type" name="employment_type" className={inputCls} defaultValue=""><option value="" disabled />{Object.entries(L.jobs.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field id="jb-mode" label={e.mode} error={err("work_mode")}><select id="jb-mode" name="work_mode" className={inputCls} defaultValue=""><option value="" disabled />{Object.entries(L.jobs.modes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field id="jb-level" label={e.level} error={err("seniority")}><select id="jb-level" name="seniority" className={inputCls}><option value="" />{Object.entries(L.jobs.levels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field id="jb-dead" label={e.deadline} hint={e.autoClose} error={err("deadline")}><input id="jb-dead" name="deadline" type="date" dir="ltr" required min={minDeadline} max={maxDeadline} className={inputCls} aria-invalid={!!err("deadline")} /></Field>
      </div>
      <fieldset className="space-y-3 rounded-xl border border-line p-4">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="show_salary" className="size-4 accent-brand" />{e.showSalary}</label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="jb-smin" label={e.salaryMin} error={err("salary_min")}><input id="jb-smin" name="salary_min" type="number" min={0} dir="ltr" className={inputCls} /></Field>
          <Field id="jb-smax" label={e.salaryMax} error={err("salary_max")}><input id="jb-smax" name="salary_max" type="number" min={0} dir="ltr" className={inputCls} /></Field>
          <Field id="jb-cur" label={e.currency} error={err("salary_currency")}><select id="jb-cur" name="salary_currency" className={inputCls}><option value="" /><option>IQD</option><option>USD</option></select></Field>
        </div>
      </fieldset>
      <p className="text-sm text-muted">{e.reviewNote}</p>
      <div className="flex flex-wrap gap-3">
        <IntentButton intent="review">{e.sendReview}</IntentButton>
        <IntentButton intent="draft" secondary>{e.saveDraft}</IntentButton>
      </div>
    </form>
  );
}

export function JobStatusButton({ id, to, label, L }: { id: string; to: "pending_review" | "closed"; label: string; L: OpsLabels }) {
  const [state, action] = useActionState(setJobStatus, idle);
  const { formErr } = useOp(state, L);
  return (
    <form action={action} className="inline-flex flex-col gap-2">
      <input type="hidden" name="id" value={id} /><input type="hidden" name="to" value={to} />
      <SubmitButton pending={L.emp.working}>{label}</SubmitButton>
      <FormError message={formErr} />
    </form>
  );
}

export function ApplicationStatusForm({ id, current, L }: { id: string; current: string; L: OpsLabels }) {
  const [state, action] = useActionState(setApplicationStatus, idle);
  const { formErr } = useOp(state, L);
  const options = ["review", "shortlisted", "interview", "offer", "hired", "rejected"];
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor={`st-${id}`} className="block text-xs text-muted">{L.emp.changeStatus}</label>
        <select id={`st-${id}`} name="status" defaultValue={options.includes(current) ? current : "review"} className={`${inputCls} !min-h-10 !w-auto`}>
          {options.map((o) => <option key={o} value={o}>{L.emp.appStatus[o]}</option>)}
        </select>
      </div>
      <SubmitButton pending={L.emp.working}>{L.emp.update}</SubmitButton>
      <FormError message={formErr} />
    </form>
  );
}

export function RequestForm({ L, companies, industries }: { L: OpsLabels; companies: { id: string; name: string }[]; industries: Opt[] }) {
  const [state, action] = useActionState(submitRecruitmentRequest, idle);
  const { err, formErr } = useOp(state, L);
  const e = L.emp;
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <FormError message={formErr} />
      <Field id="rq-co" label={e.company} error={err("company_id")}><select id="rq-co" name="company_id" className={inputCls}>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field id="rq-pos" label={e.positions} hint={e.positionsHint} error={err("positions")}><textarea id="rq-pos" name="positions" rows={4} maxLength={2000} className={inputCls} aria-invalid={!!err("positions")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rq-n" label={e.vacancies} error={err("vacancies_count")}><input id="rq-n" name="vacancies_count" type="number" min={1} max={200} defaultValue={1} dir="ltr" className={inputCls} /></Field>
        <Field id="rq-ind" label={e.industry} error={err("industry")}><select id="rq-ind" name="industry" className={inputCls}><option value="" />{industries.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}</select></Field>
        <Field id="rq-exp" label={e.experience} error={err("experience_level")}><select id="rq-exp" name="experience_level" className={inputCls}><option value="" />{Object.entries(L.jobs.levels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field id="rq-dead" label={`${e.deadline} (${L.common.optional})`} error={err("deadline")}><input id="rq-dead" name="deadline" type="date" dir="ltr" className={inputCls} /></Field>
      </div>
      <Field id="rq-skills" label={`${e.skills} (${L.common.optional})`} error={err("skills")}><textarea id="rq-skills" name="skills" rows={3} maxLength={2000} className={inputCls} /></Field>
      <Field id="rq-loc" label={`${e.locations} (${L.common.optional})`} error={err("locations")}><input id="rq-loc" name="locations" maxLength={500} className={inputCls} /></Field>
      <Field id="rq-add" label={`${e.additional} (${L.common.optional})`} error={err("additional")}><textarea id="rq-add" name="additional" rows={3} maxLength={4000} className={inputCls} /></Field>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confidential" className="mt-1 size-4 accent-brand" />{e.confidential}</label>
      <SubmitButton pending={e.working}>{e.sendRequest}</SubmitButton>
    </form>
  );
}
