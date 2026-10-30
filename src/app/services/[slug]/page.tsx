import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { pageCtx } from "@/lib/page";
import { expansion, serviceSlugs } from "@/content/expansion";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { cardCls } from "@/components/ui/styles";
import { InquiryForm } from "@/components/forms/InquiryForm";

export function generateStaticParams() {
  return serviceSlugs.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { locale } = await pageCtx();
  const s = expansion[locale].services.find((x) => x.slug === slug);
  if (!s) return {};
  return { title: s.title, description: s.intro, alternates: { canonical: `/services/${slug}` } };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const { locale, f } = await pageCtx();
  const x = expansion[locale];
  const s = x.services.find((v) => v.slug === slug);
  if (!s) notFound();
  const kind = slug === "career-consulting" ? "career_consulting" : "recruitment_service";
  return (
    <>
      <PageHeader title={s.title} intro={s.intro} />
      <Section>
        <Link href="/services" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline underline-offset-4 hover:no-underline">
          <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />{x.serviceCommon.back}
        </Link>
        <p className="max-w-2xl text-muted"><strong className="text-ink">{x.serviceCommon.forWhom}: </strong>{s.forWhom}</p>
        <h2 className="mt-8 text-2xl font-bold text-brand-dark">{x.serviceCommon.includes}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {s.points.map(([title, body]) => (
            <div key={title} className={cardCls}>
              <Check className="size-5 text-success" aria-hidden />
              <h3 className="mt-2 font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-10 text-2xl font-bold text-brand-dark">{x.serviceCommon.how}</h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {s.steps.map((step, i) => (
            <li key={step} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
              <span className="text-sm font-semibold text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </Section>
      <Section className="pt-0">
        <h2 className="text-2xl font-bold text-brand-dark">{s.cta}</h2>
        <p className="mb-5 mt-2 text-sm text-muted">{x.serviceCommon.note}</p>
        <InquiryForm kind={kind} labels={f} idPrefix={`sv-${slug.slice(0, 6)}`} messageLabel={x.serviceCommon.request} />
      </Section>
    </>
  );
}
