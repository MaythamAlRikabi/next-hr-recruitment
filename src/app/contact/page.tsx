import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { cardCls } from "@/components/ui/styles";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { SITE } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.contact.title, description: p.contact.intro, alternates: { canonical: "/contact" } };
}

export default async function ContactPage() {
  const { p, f } = await pageCtx();
  const c = p.contact;
  return (
    <>
      <PageHeader title={c.title} intro={c.intro} />
      <Section className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-xl font-semibold text-brand-dark">{c.formTitle}</h2>
          <InquiryForm kind="contact" labels={f} idPrefix="ct" />
        </div>
        <aside className={`${cardCls} h-fit space-y-3 text-sm`}>
          <h2 className="text-lg font-semibold text-brand-dark">{c.detailsTitle}</h2>
          <p>{c.location}</p>
          <p><a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">{c.linkedin}</a></p>
          {SITE.email ? <p><a dir="ltr" href={`mailto:${SITE.email}`} className="text-brand hover:underline">{SITE.email}</a></p> : null}
          {SITE.phone ? <p dir="ltr">{SITE.phone}</p> : null}
          {!SITE.email && !SITE.phone ? <p className="text-muted">{c.moreChannels}</p> : null}
        </aside>
      </Section>
    </>
  );
}
