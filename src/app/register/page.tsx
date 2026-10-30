import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authCtx } from "@/lib/page";
import { getRoles, getViewer, homeFor } from "@/lib/auth";
import { RegisterForm } from "@/components/forms/AuthForms";
import { PageHeader, Section } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(await getRoles(viewer.id)));
  const { L } = await authCtx();
  return (
    <>
      <PageHeader title={L.registerTitle} intro={L.registerIntro} />
      <Section className="max-w-xl">
        <RegisterForm L={L} defaultPurpose={sp.type === "employer" ? "employer" : "candidate"} />
        <p className="mt-4 text-sm text-muted">{L.haveAccount} <Link href="/login" className="text-brand underline underline-offset-4 hover:no-underline">{L.signIn}</Link></p>
      </Section>
    </>
  );
}
