"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestAccountDeletion, requestPasswordReset, signIn, signUp, updatePassword, updateProfile, type AuthState,
} from "@/app/actions/auth";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { btnSecondary, cardCls, inputCls } from "@/components/ui/styles";
import type { AuthLabels } from "@/content/auth";

const idle: AuthState = { status: "idle" };

function useErr(state: AuthState, L: AuthLabels) {
  const err = (k: string) =>
    state.status === "error" && state.errors[k] ? (L.errors[state.errors[k]] ?? L.errors.invalid_type) : undefined;
  const formErr = state.status === "error" && state.form ? (L.errors[state.form] ?? L.sessionMissing) : undefined;
  return { err, formErr };
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{message}</p>;
}

function Notice({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className={`${cardCls} space-y-3`} role="status">
      <h2 className="text-lg font-semibold text-success">{title}</h2>
      {body ? <p className="text-sm text-muted">{body}</p> : null}
      {children}
    </div>
  );
}

export function LoginForm({ L, next }: { L: AuthLabels; next?: string }) {
  const [state, action] = useActionState(signIn, idle);
  const { err, formErr } = useErr(state, L);
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <FormError message={formErr} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field id="li-email" label={L.email} error={err("email")}>
        <input id="li-email" name="email" type="email" dir="ltr" autoComplete="email" required className={inputCls} aria-invalid={!!err("email")} />
      </Field>
      <Field id="li-password" label={L.password} error={err("password")}>
        <input id="li-password" name="password" type="password" dir="ltr" autoComplete="current-password" required className={inputCls} aria-invalid={!!err("password")} />
      </Field>
      <SubmitButton pending={L.signingIn}>{L.signIn}</SubmitButton>
      <p className="text-sm"><Link href="/forgot-password" className="text-brand underline underline-offset-4 hover:no-underline">{L.forgotLink}</Link></p>
    </form>
  );
}

export function RegisterForm({ L, defaultPurpose }: { L: AuthLabels; defaultPurpose: "candidate" | "employer" }) {
  const [state, action] = useActionState(signUp, idle);
  const { err, formErr } = useErr(state, L);
  if (state.status === "success") {
    return (
      <Notice title={L.checkEmailTitle} body={L.checkEmailBody}>
        <Link href="/login" className={btnSecondary}>{L.backToLogin}</Link>
      </Notice>
    );
  }
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <FormError message={formErr} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">{L.purpose}</legend>
        {(["candidate", "employer"] as const).map((v) => (
          <label key={v} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
            <input type="radio" name="purpose" value={v} defaultChecked={defaultPurpose === v} className="accent-[var(--next-blue)]" />
            {v === "candidate" ? L.purposeCandidate : L.purposeEmployer}
          </label>
        ))}
        {err("purpose") ? <p role="alert" className="text-xs text-danger">{err("purpose")}</p> : null}
      </fieldset>
      <Field id="rg-name" label={L.fullName} error={err("full_name")}>
        <input id="rg-name" name="full_name" autoComplete="name" required className={inputCls} aria-invalid={!!err("full_name")} />
      </Field>
      <Field id="rg-email" label={L.email} error={err("email")}>
        <input id="rg-email" name="email" type="email" dir="ltr" autoComplete="email" required className={inputCls} aria-invalid={!!err("email")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rg-password" label={L.password} hint={L.passwordHint} error={err("password")}>
          <input id="rg-password" name="password" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} aria-invalid={!!err("password")} />
        </Field>
        <Field id="rg-confirm" label={L.confirm} error={err("confirm")}>
          <input id="rg-confirm" name="confirm" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} aria-invalid={!!err("confirm")} />
        </Field>
      </div>
      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="terms" required className="mt-1 size-4 accent-[var(--next-blue)]" />
          <span>
            {L.terms} <Link href="/terms" target="_blank" className="text-brand underline underline-offset-4 hover:no-underline">{L.termsLink}</Link>
            {" · "}<Link href="/privacy" target="_blank" className="text-brand underline underline-offset-4 hover:no-underline">{L.privacyLink}</Link>
          </span>
        </label>
        {err("terms") ? <p role="alert" className="text-xs text-danger">{err("terms")}</p> : null}
      </div>
      <SubmitButton pending={L.registering}>{L.register}</SubmitButton>
    </form>
  );
}

export function ForgotForm({ L }: { L: AuthLabels }) {
  const [state, action] = useActionState(requestPasswordReset, idle);
  const { err, formErr } = useErr(state, L);
  if (state.status === "success") {
    return (
      <Notice title={L.resetSentTitle} body={L.resetSentBody}>
        <Link href="/login" className={btnSecondary}>{L.backToLogin}</Link>
      </Notice>
    );
  }
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <FormError message={formErr} />
      <Field id="fp-email" label={L.email} error={err("email")}>
        <input id="fp-email" name="email" type="email" dir="ltr" autoComplete="email" required className={inputCls} aria-invalid={!!err("email")} />
      </Field>
      <SubmitButton pending={L.sending}>{L.send}</SubmitButton>
    </form>
  );
}

export function ResetForm({ L }: { L: AuthLabels }) {
  const [state, action] = useActionState(updatePassword, idle);
  const { err, formErr } = useErr(state, L);
  if (state.status === "success") {
    return (
      <Notice title={L.resetDoneTitle} body={L.resetDoneBody}>
        <Link href="/account" className={btnSecondary}>{L.accountTitle}</Link>
      </Notice>
    );
  }
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <FormError message={formErr} />
      <Field id="rp-password" label={L.newPassword} hint={L.passwordHint} error={err("password")}>
        <input id="rp-password" name="password" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} aria-invalid={!!err("password")} />
      </Field>
      <Field id="rp-confirm" label={L.confirm} error={err("confirm")}>
        <input id="rp-confirm" name="confirm" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} aria-invalid={!!err("confirm")} />
      </Field>
      <SubmitButton pending={L.saving}>{L.save}</SubmitButton>
    </form>
  );
}

export function ProfileForm({ L, fullName, phone, email }: { L: AuthLabels; fullName: string; phone: string; email: string }) {
  const [state, action] = useActionState(updateProfile, idle);
  const { err, formErr } = useErr(state, L);
  return (
    <form action={action} className={`${cardCls} space-y-4`} noValidate>
      <FormError message={formErr} />
      {state.status === "success" ? <p role="status" className="text-sm text-success">{L.savedOk}</p> : null}
      <Field id="pf-email" label={L.email}>
        <input id="pf-email" value={email} readOnly dir="ltr" className={`${inputCls} bg-surface`} />
      </Field>
      <Field id="pf-name" label={L.fullName} error={err("full_name")}>
        <input id="pf-name" name="full_name" defaultValue={fullName} required className={inputCls} aria-invalid={!!err("full_name")} />
      </Field>
      <Field id="pf-phone" label={L.phone} hint={L.phoneHint} error={err("phone")}>
        <input id="pf-phone" name="phone" type="tel" dir="ltr" defaultValue={phone} className={inputCls} aria-invalid={!!err("phone")} />
      </Field>
      <SubmitButton pending={L.saving}>{L.save}</SubmitButton>
    </form>
  );
}

export function DeletionForm({ L, pending }: { L: AuthLabels; pending: boolean }) {
  const [state, action] = useActionState(requestAccountDeletion, idle);
  const { err, formErr } = useErr(state, L);
  if (pending || state.status === "success") {
    return <p role="status" className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">{state.status === "success" ? L.deleteDone : L.deleteRequested}</p>;
  }
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormError message={formErr} />
      <Field id="dl-reason" label={L.deleteReason} error={err("reason")}>
        <textarea id="dl-reason" name="reason" rows={3} className={inputCls} />
      </Field>
      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirm" required className="mt-1 size-4 accent-[var(--next-blue)]" />
          <span>{L.deleteConfirm}</span>
        </label>
        {err("confirm") ? <p role="alert" className="text-xs text-danger">{err("confirm")}</p> : null}
      </div>
      <SubmitButton pending={L.saving}>{L.deleteSubmit}</SubmitButton>
    </form>
  );
}
