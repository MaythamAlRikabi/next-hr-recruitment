"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "@/app/actions/inquiry";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { btnSecondary, cardCls, inputCls } from "@/components/ui/styles";
import type { FormLabels } from "@/content/forms";

type Kind = "contact" | "recruitment_service" | "career_consulting" | "abuse_report";

export function InquiryForm({
  kind, labels, idPrefix, messageLabel,
}: { kind: Kind; labels: FormLabels; idPrefix: string; messageLabel?: string }) {
  const [state, action] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const err = (k: string) =>
    state.status === "error" && state.errors[k] ? (labels.errors[state.errors[k]] ?? labels.errors.invalid_type) : undefined;
  const id = (k: string) => `${idPrefix}-${k}`;
  const company = kind === "recruitment_service" || kind === "contact";

  if (state.status === "success") {
    return (
      <div className={`${cardCls} space-y-3`} role="status">
        <h3 className="text-lg font-semibold text-success">{labels.successTitle}</h3>
        <p className="text-sm text-muted">{labels.successBody}</p>
        <p className="text-sm">
          {labels.refLabel}: <strong dir="ltr" className="select-all font-mono">{state.reference}</strong>
        </p>
        <a href="" className={btnSecondary}>{labels.again}</a>
      </div>
    );
  }

  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <input type="hidden" name="kind" value={kind} />
      {/* Honeypot: hidden from people, tempting for bots */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {state.status === "error" && state.form ? (
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {labels.formErrors[state.form] ?? labels.formErrors.server}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={id("name")} label={labels.name} error={err("full_name")}>
          <input id={id("name")} name="full_name" className={inputCls} autoComplete="name" required aria-invalid={!!err("full_name")} />
        </Field>
        <Field id={id("email")} label={labels.email} error={err("email")}>
          <input id={id("email")} name="email" type="email" dir="ltr" className={inputCls} autoComplete="email" required aria-invalid={!!err("email")} />
        </Field>
        <Field id={id("phone")} label={labels.phone} hint={labels.phoneHint} error={err("phone")}>
          <input id={id("phone")} name="phone" type="tel" dir="ltr" className={inputCls} autoComplete="tel" aria-invalid={!!err("phone")} />
        </Field>
        {company ? (
          <Field id={id("company")} label={labels.company} error={err("company_name")}>
            <input id={id("company")} name="company_name" className={inputCls} autoComplete="organization" aria-invalid={!!err("company_name")} />
          </Field>
        ) : null}
      </div>

      {kind === "recruitment_service" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={id("industry")} label={labels.industry} error={err("industry")}>
            <input id={id("industry")} name="industry" className={inputCls} />
          </Field>
          <Field id={id("vacancies")} label={labels.vacancies} error={err("vacancies")}>
            <input id={id("vacancies")} name="vacancies" type="number" min={1} max={1000} inputMode="numeric" dir="ltr" className={inputCls} required aria-invalid={!!err("vacancies")} />
          </Field>
          <Field id={id("locations")} label={labels.locations} hint={labels.locationsHint} error={err("locations")}>
            <input id={id("locations")} name="locations" className={inputCls} required aria-invalid={!!err("locations")} />
          </Field>
          <Field id={id("timeline")} label={labels.timeline} error={err("timeline")}>
            <select id={id("timeline")} name="timeline" className={inputCls} defaultValue="" required aria-invalid={!!err("timeline")}>
              <option value="" disabled>{labels.select}</option>
              {labels.timelineOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>
      ) : null}

      {kind === "career_consulting" ? (
        <Field id={id("service")} label={labels.service} error={err("service")}>
          <select id={id("service")} name="service" className={inputCls} defaultValue="" required aria-invalid={!!err("service")}>
            <option value="" disabled>{labels.select}</option>
            {labels.serviceOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      ) : null}

      {kind === "abuse_report" ? (
        <Field id={id("target")} label={labels.abuseTarget} hint={labels.abuseTargetHint} error={err("target")}>
          <input id={id("target")} name="target" dir="ltr" className={inputCls} />
        </Field>
      ) : null}

      <Field id={id("subject")} label={labels.subject} error={err("subject")}>
        <input id={id("subject")} name="subject" className={inputCls} aria-invalid={!!err("subject")} />
      </Field>

      <Field id={id("message")} label={messageLabel ?? labels.message} error={err("message")}>
        <textarea id={id("message")} name="message" rows={5} className={inputCls} required aria-invalid={!!err("message")} />
      </Field>

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" className="mt-1 size-4 accent-[var(--next-blue)]" required />
          <span>{labels.consent}</span>
        </label>
        {err("consent") ? <p role="alert" className="text-xs text-danger">{err("consent")}</p> : null}
      </div>

      <SubmitButton pending={labels.sending}>{labels.submit}</SubmitButton>
    </form>
  );
}
