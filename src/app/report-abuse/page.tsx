import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { InquiryForm } from "@/components/forms/InquiryForm";

export async function generateMetadata(): Promise<Metadata> {
  const { p } = await pageCtx();
  return { title: p.report.title, alternates: { canonical: "/report-abuse" } };
}

export default async function ReportAbusePage() {
  const { p, f } = await pageCtx();
  return (
    <>
      <PageHeader title={p.report.title} intro={p.report.intro} />
      <Section className="max-w-3xl">
        <InquiryForm kind="abuse_report" labels={f} idPrefix="ab" messageLabel={p.report.message} />
      </Section>
    </>
  );
}
