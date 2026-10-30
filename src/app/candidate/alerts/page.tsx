import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { AlertForm } from "@/components/forms/AlertForm";
import { MiniAction } from "@/components/forms/StaffForms";
import { removeAlert } from "@/app/actions/notifications";
import { ops } from "@/content/ops";
import { cityLabel } from "@/lib/jobs";
export const metadata = { title: "Job alerts", robots: { index: false } };
export default async function AlertsPage() {
 const {viewer} = await requireRole(["candidate"], "/candidate/alerts"); const locale = await getLocale(); const ar = locale === "ar";
 const db = await createClient(); const {data, error} = await db.from("job_alerts").select("id, keyword, city, frequency").eq("user_id", viewer.id).order("created_at", {ascending:false});
 return <><PageHeader title={ar ? "تنبيهات الوظائف" : "Job alerts"} intro={ar ? "اختر ما تبحث عنه. تصلك الفرص الجديدة المطابقة في إشعارات حسابك داخل NEXT، بدون بريد خارجي." : "Choose your criteria. New matching opportunities appear in your NEXT notifications, without external email."}/><Section className="space-y-6"><Link href="/notifications" className="text-brand underline">{ar ? "افتح الإشعارات" : "Open notifications"}</Link><AlertForm locale={locale}/>{error ? <p role="alert">{ar ? "تعذر تحميل التنبيهات." : "Unable to load alerts."}</p> : <ul className="space-y-3">{data?.map(a=><li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4"><span>{a.keyword || (ar ? "كل الوظائف" : "All jobs")} · {a.city ? cityLabel(a.city,locale) : (ar ? "كل المدن" : "All cities")} · {a.frequency === "daily" ? (ar ? "يومي" : "Daily") : (ar ? "أسبوعي" : "Weekly")}</span><MiniAction action={removeAlert} fields={{id:a.id}} label={ar ? "إلغاء التنبيه" : "Remove alert"} L={ops[locale]} secondary/></li>)}</ul>}</Section></>;
}
