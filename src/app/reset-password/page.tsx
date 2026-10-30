import type { Metadata } from "next";
import Link from "next/link";
import { authCtx } from "@/lib/page";
import { getViewer } from "@/lib/auth";
import { ResetForm } from "@/components/forms/AuthForms";
import { PageHeader, Section } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ResetPasswordPage() {
  const { L } = await authCtx();
  const viewer = await getViewer();
  return (
    <>
      <PageHeader title={L.resetTitle} intro={L.resetIntro} />
      <Section className="max-w-md">
        {viewer ? (
          <ResetForm L={L} />
        ) : (
          <div className="space-y-3">
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{L.sessionMissing}</p>
            <Link href="/forgot-password" className="text-sm text-brand hover:underline">{L.forgotTitle}</Link>
          </div>
        )}
      </Section>
    </>
  );
}
