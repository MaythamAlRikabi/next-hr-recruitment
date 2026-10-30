import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section, StatusNote } from "@/components/ui/PageHeader";
import { btnPrimary, cardCls } from "@/components/ui/styles";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.cv.title, description: p.cv.intro, alternates: { canonical: "/cv-builder" } };
}

export default async function CvBuilderPage() {
  const { p } = await pageCtx();
  const c = p.cv;
  return (
    <>
      <PageHeader title={c.title} intro={c.intro} />
      <Section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">{c.principlesTitle}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {c.principles.map(([h, b]) => (
              <div key={h} className={cardCls}>
                <h3 className="font-semibold text-ink">{h}</h3>
                <p className="mt-1.5 text-sm text-muted">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">{c.planTitle}</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted sm:grid-cols-2">
            {c.plan.map((x) => <li key={x} className="rounded-lg border border-line bg-white px-4 py-2.5">{x}</li>)}
          </ul>
        </div>
        <StatusNote>{c.statusNote}</StatusNote>
        <Link href="/register" className={btnPrimary}>{c.ctaRegister}</Link>
      </Section>
    </>
  );
}
