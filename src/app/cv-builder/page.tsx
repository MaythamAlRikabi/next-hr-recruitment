import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { draftSchema } from "@/lib/cv";
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
  const viewer=await getViewer();
  const row=viewer ? await (await createClient()).from("cv_drafts").select("document").eq("user_id",viewer.id).maybeSingle() : null;
  if (row?.error) throw new Error("Unable to load saved CV draft. Please retry.");
  const parsed=draftSchema.safeParse(row?.data?.document);
  return <>
    <div className="cv-controls"><PageHeader title={locale === "ar" ? "سيرتك المهنية. خطوتك القادمة." : "Your experience. Your next step."} intro={locale === "ar" ? "أنشئ سيرة مرتبة بالعربية أو الإنجليزية وعدّلها وصدّرها من مكان واحد." : "Create, edit and export a clear professional CV in Arabic or English."} /></div>
    <Section><CvEditor locale={locale} signedIn={!!viewer} initial={parsed.success ? parsed.data : undefined} /></Section>
  </>;
}
