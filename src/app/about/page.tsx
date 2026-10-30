import type { Metadata } from "next";
import Link from "next/link";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { btnPrimary, cardCls } from "@/components/ui/styles";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.about.title, description: p.about.intro, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const { p } = await pageCtx();
  const a = p.about;
  return (
    <>
      <PageHeader title={a.title} intro={a.intro} />
      <Section>
        <h2 className="text-2xl font-bold text-brand-dark">{a.whatTitle}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {a.services.map((s) => (
            <div key={s.title} className={cardCls}>
              <h3 className="font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section className="grid gap-6 md:grid-cols-2">
        <div className={cardCls}>
          <h2 className="text-lg font-semibold text-brand-dark">{a.candidatesTitle}</h2>
          <p className="mt-2 text-sm text-muted">{a.candidatesBody}</p>
        </div>
        <div className={cardCls}>
          <h2 className="text-lg font-semibold text-brand-dark">{a.employersTitle}</h2>
          <p className="mt-2 text-sm text-muted">{a.employersBody}</p>
        </div>
      </Section>
      <Section>
        <h2 className="text-2xl font-bold text-brand-dark">{a.findTitle}</h2>
        <p className="mt-2 text-muted">{a.findBody}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand hover:underline">LinkedIn</a>
          <Link href="/contact" className={btnPrimary}>{a.contactCta}</Link>
        </div>
      </Section>
    </>
  );
}
