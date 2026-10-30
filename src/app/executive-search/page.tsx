import type { Metadata } from "next";
import { Check, Lock } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { expansion } from "@/content/expansion";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { cardCls } from "@/components/ui/styles";
import { InquiryForm } from "@/components/forms/InquiryForm";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await pageCtx();
  const e = expansion[locale].executive;
  return { title: e.title, description: e.intro, alternates: { canonical: "/executive-search" } };
}

export default async function ExecutiveSearchPage() {
  const { locale, f } = await pageCtx();
  const e = expansion[locale].executive;
  return (
    <>
      <PageHeader eyebrow={e.eyebrow} title={e.title} intro={e.intro} />
      <Section>
        <h2 className="text-2xl font-bold text-brand-dark">{e.whoTitle}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {e.who.map(([title, body]) => (
            <div key={title} className={cardCls}>
              <h3 className="font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section className="pt-0">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark">{e.processTitle}</h2>
            <ol className="mt-5 space-y-4">
              {e.process.map((step, i) => (
                <li key={step} className="flex gap-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                  <span className="pt-0.5 leading-relaxed text-ink">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={`${cardCls} self-start`}>
            <h2 className="flex items-center gap-2 text-xl font-bold text-brand-dark">
              <Lock className="size-5 text-brand" aria-hidden />{e.privacyTitle}
            </h2>
            <ul className="mt-4 space-y-3">
              {e.privacy.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
      <Section className="scroll-mt-20">
        <div id="inquiry" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-brand-dark">{e.formTitle}</h2>
          <p className="mb-5 mt-2 max-w-2xl text-muted">{e.formIntro}</p>
          <InquiryForm kind="recruitment_service" labels={f} idPrefix="ex" messageLabel={e.formMsg} />
          <p className="mt-4 text-sm text-muted">{e.note}</p>
        </div>
      </Section>
    </>
  );
}
