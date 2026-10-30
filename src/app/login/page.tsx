import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authCtx } from "@/lib/page";
import { getRoles, getViewer, homeFor } from "@/lib/auth";
import { safeNext } from "@/lib/validation";
import { LoginForm } from "@/components/forms/AuthForms";
import { PageHeader, Section } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(await getRoles(viewer.id)));
  const { L } = await authCtx();
  const next = safeNext(sp.next, "");
  return (
    <>
      <PageHeader title={L.loginTitle} intro={L.loginIntro} />
      <Section className="max-w-md">
        {sp.error === "callback" ? (
          <p role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{L.errors.callback ?? L.sessionMissing}</p>
        ) : null}
        <LoginForm L={L} next={next || undefined} />
        <p className="mt-4 text-sm text-muted">{L.noAccount} <Link href="/register" className="text-brand underline underline-offset-4 hover:no-underline">{L.register}</Link></p>
      </Section>
    </>
  );
}
