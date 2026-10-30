import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section, StatusNote } from "@/components/ui/PageHeader";
import { btnPrimary, btnSecondary, cardCls } from "@/components/ui/styles";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.employers.title, description: p.employers.intro, alternates: { canonical: "/employers" } };
}

export default async function EmployersPage() {
  const { p } = await pageCtx();
  const e = p.employers;
  return (
    <>
      <PageHeader title={e.title} intro={e.intro} />
      <Section className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">{e.canTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {e.items.map(([h, b]) => (
            <div key={h} className={cardCls}>
              <h3 className="font-semibold text-ink">{h}</h3>
              <p className="mt-1.5 text-sm text-muted">{b}</p>
            </div>
          ))}
        </div>
        <StatusNote>{e.statusNote}</StatusNote>
        <div className="flex flex-wrap gap-3">
          <Link href="/register?type=employer" className={btnPrimary}>{e.ctaRegister}</Link>
          <Link href="/services#companies" className={btnSecondary}>{e.ctaService}</Link>
        </div>
      </Section>
    </>
  );
}
