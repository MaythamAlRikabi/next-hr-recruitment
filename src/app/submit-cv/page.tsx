import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { expansion } from "@/content/expansion";
import { PageHeader, Section, StatusNote } from "@/components/ui/PageHeader";
import { btnPrimary, btnSecondary, cardCls } from "@/components/ui/styles";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await pageCtx();
  const c = expansion[locale].submitCv;
  return { title: c.title, description: c.intro, alternates: { canonical: "/submit-cv" } };
}

export default async function SubmitCvPage() {
  const { locale } = await pageCtx();
  const c = expansion[locale].submitCv;
  return (
    <>
      <PageHeader eyebrow={c.eyebrow} title={c.title} intro={c.intro} />
      <Section>
        <StatusNote>{c.status}</StatusNote>
      </Section>
      <Section className="pt-0">
        <h2 className="text-2xl font-bold text-brand-dark">{c.stepsTitle}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {c.steps.map(([title, body], i) => (
            <li key={title} className={cardCls}>
              <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </Section>
      <Section className="pt-0">
        <div className={`${cardCls} max-w-3xl`}>
          <h2 className="flex items-center gap-2 text-xl font-bold text-brand-dark">
            <ShieldCheck className="size-5 text-brand" aria-hidden />{c.controlsTitle}
          </h2>
          <ul className="mt-4 list-disc space-y-2 ps-5 text-sm leading-relaxed text-ink">
            {c.controls.map((x) => <li key={x}>{x}</li>)}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className={btnPrimary}>{c.ctaRegister}</Link>
            <Link href="/cv-builder" className={btnSecondary}>{c.ctaStudio}</Link>
            <Link href="/login" className={btnSecondary}>{c.ctaLogin}</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
