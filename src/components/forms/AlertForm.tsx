"use client";
import { useActionState } from "react";
import { createAlert } from "@/app/actions/notifications";
import { idle } from "@/lib/ops";
import { SubmitButton } from "./SubmitButton";
import { cityList } from "@/lib/jobs";
export function AlertForm({ locale }: { locale: "ar" | "en" }) {
 const [state, action] = useActionState(createAlert, idle); const ar = locale === "ar";
 const input = "mt-2 block min-h-11 w-full rounded-xl border border-line bg-white px-3";
 return <form action={action} className="grid gap-4 rounded-2xl border border-line p-5 sm:grid-cols-2">
 <label>{ar ? "الكلمة المفتاحية" : "Keyword"}<input name="keyword" maxLength={80} className={input} /></label>
 <label>{ar ? "المدينة" : "City"}<select name="city" className={input}><option value="">{ar ? "كل المدن" : "All cities"}</option>{cityList(locale).map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label>
 <label>{ar ? "التكرار" : "Frequency"}<select name="frequency" className={input}><option value="daily">{ar ? "يومي" : "Daily"}</option><option value="weekly">{ar ? "أسبوعي" : "Weekly"}</option></select></label>
 <div className="self-end"><SubmitButton pending="…">{ar ? "حفظ التنبيه" : "Save alert"}</SubmitButton></div>
 <p role="status" className="sm:col-span-2">{state.status === "error" ? (ar ? "تعذر الحفظ. الحد الأقصى 10 تنبيهات. أعد المحاولة." : "Unable to save. Maximum 10 alerts. Please retry.") : state.status === "success" ? (ar ? "تم حفظ التنبيه داخل حسابك." : "Alert saved to your account.") : ""}</p>
 </form>;
}
