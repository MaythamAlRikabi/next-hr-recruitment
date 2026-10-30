import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { expansion } from "@/content/expansion";
import { badgeBrand, cardCls, cardHover } from "@/components/ui/styles";
import { InquiryForm } from "@/components/forms/InquiryForm";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.services.title, description: p.services.intro, alternates: { canonical: "/services" } };
}

export default async function ServicesPage() {
  const { p, f, locale } = await pageCtx();
  const x = expansion[locale];
  const s = p.services;
  return (
    <>
      <PageHeader title={s.title} intro={s.intro} />
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {x.services.map((sv) => (
            <Link key={sv.slug} href={`/services/${sv.slug}`} className={`${cardCls} ${cardHover} group flex flex-col`}>
              <h2 className="font-semibold text-ink">{sv.title}</h2>
              <p className="mt-1.5 flex-1 text-sm text-muted">{sv.intro}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline underline-offset-4 group-hover:no-underline">
                {sv.cta}<ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
        <div className={`${cardCls} mt-8 border-dashed`}>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-brand-dark">{x.roadmap.title}</h2>
            <span className={badgeBrand}>{x.roadmap.badge}</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted">{x.roadmap.intro}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {x.roadmap.items.map(([title, note]) => (
              <li key={title} className="rounded-xl bg-surface p-3 text-sm">
                <strong className="text-ink">{title}</strong>
                <span className="block text-muted">{note}</span>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="mt-4 inline-block text-sm font-semibold text-brand underline underline-offset-4 hover:no-underline">{x.roadmap.contact}</Link>
        </div>
      </Section>
      <Section className="scroll-mt-20" >
        <div id="companies" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-brand-dark">{s.companiesTitle}</h2>
          <p className="mb-5 mt-2 max-w-2xl text-muted">{s.companiesIntro}</p>
          <InquiryForm kind="recruitment_service" labels={f} idPrefix="rs" messageLabel={s.recruitmentMsg} />
        </div>
      </Section>
      <Section>
        <div id="candidates" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-brand-dark">{s.consultingTitle}</h2>
          <p className="mb-5 mt-2 max-w-2xl text-muted">{s.consultingIntro}</p>
          <InquiryForm kind="career_consulting" labels={f} idPrefix="cc" messageLabel={s.consultingMsg} />
        </div>
      </Section>
    </>
  );
}
