import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.faq.title, description: p.faq.intro, alternates: { canonical: "/faq" } };
}

export default async function FaqPage() {
  const { p } = await pageCtx();
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faq.items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <>
      <PageHeader title={p.faq.title} intro={p.faq.intro} />
      <Section>
        <div className="divide-y divide-line rounded-xl border border-line bg-white">
          {p.faq.items.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">{q}</summary>
              <p className="mt-2 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </>
  );
}
