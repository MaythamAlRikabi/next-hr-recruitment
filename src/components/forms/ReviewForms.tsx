"use client";

import { useActionState } from "react";
import { reviewCredential } from "@/app/actions/credentials";
import { FormError, useOp, type OpsLabels } from "@/components/forms/OpForms";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";
import { idle } from "@/lib/ops";
import { useFormStatus } from "react-dom";

function DecisionButton({ decision, children, secondary }: { decision: "verified" | "rejected"; children: React.ReactNode; secondary?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" name="decision" value={decision} disabled={pending} className={`${secondary ? btnSecondary : btnPrimary} !min-h-10 disabled:opacity-60`}>{children}</button>;
}

export function ReviewCredentialForm({ kind, id, L, approve, reject }: { kind: "education" | "experience"; id: string; L: OpsLabels; approve: string; reject: string }) {
  const [state, action] = useActionState(reviewCredential, idle);
  const { formErr } = useOp(state, L);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} />
      <DecisionButton decision="verified">{approve}</DecisionButton>
      <DecisionButton decision="rejected" secondary>{reject}</DecisionButton>
      <FormError message={formErr} />
    </form>
  );
}
