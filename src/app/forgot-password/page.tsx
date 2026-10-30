import type { Metadata } from "next";
import Link from "next/link";
import { authCtx } from "@/lib/page";
import { ForgotForm } from "@/components/forms/AuthForms";
import { PageHeader, Section } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default async function ForgotPasswordPage() {
  const { L } = await authCtx();
  return (
    <>
      <PageHeader title={L.forgotTitle} intro={L.forgotIntro} />
      <Section className="max-w-md">
        <ForgotForm L={L} />
        <p className="mt-4 text-sm"><Link href="/login" className="text-brand hover:underline">{L.backToLogin}</Link></p>
      </Section>
    </>
  );
}
