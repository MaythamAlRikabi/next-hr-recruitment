import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { MiniAction } from "@/components/forms/StaffForms";
import { markNotificationsRead } from "@/app/actions/notifications";
import { ops } from "@/content/ops";
import { fmtDate } from "@/lib/jobs";
export const metadata = { title: "Notifications", robots: { index:false } };
export default async function NotificationsPage() {
 const viewer = await getViewer(); if (!viewer) redirect("/login?next=/notifications");
 const locale=await getLocale(); const ar=locale==="ar"; const db=await createClient();
 const {data,error}=await db.from("notifications").select("id,title_ar,title_en,href,read_at,created_at").eq("user_id",viewer.id).order("created_at",{ascending:false}).limit(100);
 return <><PageHeader title={ar ? "إشعاراتك" : "Your notifications"} intro={ar ? "تابع تحديثات طلباتك وفرص العمل من داخل المنصة." : "Follow application updates and opportunities inside NEXT."}/><Section className="space-y-5"><MiniAction action={markNotificationsRead} fields={{}} label={ar ? "تحديد الكل كمقروء" : "Mark all as read"} L={ops[locale]}/>{error ? <p role="alert">{ar ? "تعذر تحميل الإشعارات. أعد المحاولة." : "Unable to load notifications. Please retry."}</p> : data?.length ? <ul className="space-y-3">{data.map(n=><li key={n.id} className={`rounded-xl border p-5 ${n.read_at ? "border-line" : "border-brand/30 bg-brand-soft"}`}><Link href={n.href} className="font-semibold text-brand-dark">{ar ? n.title_ar : n.title_en}</Link><p className="mt-2 text-xs text-muted">{fmtDate(n.created_at,locale)} · {n.read_at ? (ar ? "مقروء" : "Read") : (ar ? "جديد" : "New")}</p></li>)}</ul> : <p>{ar ? "لا توجد إشعارات بعد. ستظهر التحديثات هنا تلقائياً." : "No notifications yet. Updates will appear here automatically."}</p>}</Section></>;
}
