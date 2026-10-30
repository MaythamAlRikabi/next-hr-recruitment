import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { btnPrimary } from "@/components/ui/styles";

export const metadata: Metadata = { title: "Not authorized", robots: { index: false } };

export default async function NotAuthorizedPage() {
  const { p } = await pageCtx();
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-medium text-brand">403</p>
      <h1 className="mt-2 t-h1 text-midnight">{p.errors.notAuthorizedTitle}</h1>
      <p className="mt-3 text-muted">{p.errors.notAuthorizedBody}</p>
      <Link href="/" className={`${btnPrimary} mt-6`}>{p.errors.home}</Link>
    </section>
  );
}
