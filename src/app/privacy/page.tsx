import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section, StatusNote } from "@/components/ui/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.privacy.title, alternates: { canonical: "/privacy" } };
}

export default async function PrivacyPage() {
  const { p } = await pageCtx();
  return (
    <>
      <PageHeader title={p.privacy.title} />
      <Section className="max-w-3xl space-y-6">
        <StatusNote>{p.legal.draftNotice}</StatusNote>
        {p.privacy.sections.map(([h, b]) => (
          <div key={h}>
            <h2 className="text-lg font-semibold text-brand-dark">{h}</h2>
            <p className="mt-1.5 text-muted">{b}</p>
          </div>
        ))}
      </Section>
    </>
  );
}
