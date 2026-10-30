import type { Metadata } from "next";
import { pageCtx } from "@/lib/page";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { CvEditor } from "@/components/cv/CvEditor";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await pageCtx();
  return { title: locale === "ar" ? "استوديو السيرة الذاتية" : "CV Studio", alternates: { canonical: "/cv-builder" } };
}

export default async function CvBuilderPage() {
  const { locale } = await pageCtx();
  return <>
    <div className="cv-controls"><PageHeader title={locale === "ar" ? "سيرتك المهنية. خطوتك القادمة." : "Your experience. Your next step."} intro={locale === "ar" ? "أنشئ سيرة مرتبة بالعربية أو الإنجليزية وعدّلها وصدّرها من مكان واحد." : "Create, edit and export a clear professional CV in Arabic or English."} /></div>
    <Section><CvEditor locale={locale} /></Section>
  </>;
}
