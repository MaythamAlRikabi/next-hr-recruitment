import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { expansion } from "@/content/expansion";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { badgeBrand, btnPrimary, btnSecondary, cardCls } from "@/components/ui/styles";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await pageCtx();
  const c = expansion[locale].insights;
  return { title: c.title, description: c.intro, alternates: { canonical: "/insights" } };
}

export default async function InsightsPage() {
  const { locale } = await pageCtx();
  const c = expansion[locale].insights;
  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title} intro={c.intro} />
      <Section>
        <h2 className="text-xl font-bold text-brand-dark">{c.categoriesTitle}</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {c.categories.map((cat) => (
            <li key={cat} className={badgeBrand}>{cat}</li>
          ))}
        </ul>
      </Section>
      <Section className="pt-0">
        <div role="status" className={`${cardCls} mx-auto max-w-3xl px-6 py-12 text-center`}>
          <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-dashed border-brand/40 bg-brand/5 text-brand">
            <Newspaper className="size-7" aria-hidden />
          </span>
          <h2 className="mt-5 text-xl font-bold text-brand-dark">{c.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl leading-relaxed text-muted">{c.emptyBody}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className={btnPrimary}>{c.ctaContact}</Link>
            <Link href="/jobs" className={btnSecondary}>{c.ctaJobs}</Link>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl bg-brand-soft p-5">
          <h2 className="font-bold text-brand-dark">{c.policyTitle}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{c.policy}</p>
        </div>
      </Section>
    </>
  );
}
