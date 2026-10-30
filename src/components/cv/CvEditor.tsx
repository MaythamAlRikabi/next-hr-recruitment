"use client";

import { useState } from "react";
import { Download, FileText, Printer, Upload } from "lucide-react";
import { btnPrimary, btnSecondary } from "@/components/ui/styles";

type CV = { name: string; title: string; email: string; phone: string; location: string; summary: string; experience: string; education: string; skills: string; languages: string };
const blank: CV = { name: "", title: "", email: "", phone: "", location: "", summary: "", experience: "", education: "", skills: "", languages: "" };
const labels = {
  ar: { name: "الاسم الكامل", title: "المسمى المهني", email: "البريد الإلكتروني", phone: "رقم الهاتف", location: "المدينة", summary: "الملخص المهني", experience: "الخبرات والإنجازات", education: "التعليم والشهادات", skills: "المهارات", languages: "اللغات" },
  en: { name: "Full name", title: "Professional title", email: "Email", phone: "Phone", location: "Location", summary: "Professional summary", experience: "Experience and achievements", education: "Education and qualifications", skills: "Skills", languages: "Languages" },
};
const sections = ["summary", "experience", "education", "skills", "languages"] as const;

export function CvEditor({ locale }: { locale: "ar" | "en" }) {
  const [cv, setCv] = useState<CV>(blank);
  const [language, setLanguage] = useState(locale);
  const [message, setMessage] = useState("");
  const ar = locale === "ar";
  const L = labels[locale];
  const completed = Object.values(cv).filter((v) => v.trim()).length;
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, language, cv }, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "NEXT-CV-draft.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(ar ? "تم تجهيز المسودة للتنزيل. احتفظ بها لاستكمال التحرير لاحقاً." : "Draft prepared for download. Keep it to continue editing later.");
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      if (file.size > 100_000) throw new Error();
      const data = JSON.parse(await file.text());
      if (data.version !== 1 || !data.cv || !Object.keys(blank).every((k) => typeof data.cv[k] === "string" && data.cv[k].length <= 6000)) throw new Error();
      setCv(Object.fromEntries(Object.keys(blank).map((k) => [k, data.cv[k]])) as CV);
      setLanguage(data.language === "en" ? "en" : "ar");
      setMessage(ar ? "تم فتح المسودة." : "Draft opened.");
    } catch { setMessage(ar ? "تعذر فتح الملف. اختر مسودة JSON نزلتها من NEXT." : "Unable to open file. Choose a JSON draft exported from NEXT."); }
  }
  return <div className="cv-workspace">
    <div className="cv-controls mb-6 rounded-2xl border border-brand/20 bg-brand-soft p-5">
      <p className="font-semibold text-midnight">{ar ? "سيرتك تبدأ بمعلوماتك الحقيقية" : "Your CV starts with your real experience"}</p>
      <p className="mt-2 text-sm leading-7 text-muted">{ar ? "حرّر معلوماتك وشاهد النتيجة مباشرة. البيانات تبقى في هذه الصفحة ولا تُرسل للشركات. نزّل مسودة قبل المغادرة لأن تحديث الصفحة يمسح التعديلات. المساعدة بالذكاء الاصطناعي غير مفعّلة حالياً." : "Edit and preview instantly. Your data stays on this page and is not sent to employers. Download a draft before leaving: refreshing clears your changes. AI assistance is not currently enabled."}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} disabled={!cv.name.trim()} onClick={() => window.print()}><Printer className="size-4" />{ar ? "طباعة / حفظ PDF" : "Print / Save PDF"}</button>
        <button type="button" className={btnSecondary} onClick={download}><Download className="size-4" />{ar ? "تنزيل مسودة" : "Download draft"}</button>
        <label className={`${btnSecondary} cursor-pointer`}><Upload className="size-4" />{ar ? "فتح مسودة" : "Open draft"}<input className="sr-only" type="file" accept=".json,application/json" onChange={(e) => { void restore(e.target.files?.[0]); e.target.value = ""; }} /></label>
      </div>
      <p className="mt-3 text-xs text-muted">{ar ? "لحفظ PDF اختر «حفظ بصيغة PDF» من نافذة الطباعة وأوقف رؤوس الصفحة وتذييلاتها." : "Choose Save as PDF in the print dialog and turn off browser headers and footers."}</p>
      <p role="status" className="mt-2 text-sm text-brand-dark">{message}</p>
    </div>
    <div className="cv-columns grid items-start gap-6 lg:grid-cols-2">
      <div className="cv-controls space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{ar ? "معلومات السيرة" : "CV details"}</h2><span className="text-sm text-muted">{completed}/10</span></div>
        <label className="block text-sm font-semibold">{ar ? "لغة السيرة" : "CV language"}<select className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-white px-3" value={language} onChange={(e) => setLanguage(e.target.value as "ar" | "en")}><option value="ar">العربية</option><option value="en">English</option></select></label>
        {(Object.keys(blank) as (keyof CV)[]).map((key) => <label key={key} className="block text-sm font-semibold" htmlFor={`cv-${key}`}>{L[key]}{key === "name" ? " *" : ""}
          {sections.includes(key as typeof sections[number]) ? <textarea id={`cv-${key}`} rows={key === "experience" ? 7 : 4} maxLength={6000} value={cv[key]} onChange={(e) => setCv({ ...cv, [key]: e.target.value })} className="mt-2 block w-full resize-y rounded-xl border border-line bg-white p-3 font-normal leading-7 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" /> : <input id={`cv-${key}`} type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} maxLength={200} value={cv[key]} onChange={(e) => setCv({ ...cv, [key]: e.target.value })} className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-white px-3 font-normal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />}
        </label>)}
      </div>
      <div className="cv-preview-wrap min-w-0 lg:sticky lg:top-24">
        <p className="cv-controls mb-3 flex items-center gap-2 text-sm font-semibold text-muted"><FileText className="size-4" />{ar ? "معاينة مباشرة — قالب احترافي بسيط" : "Live preview — clean professional template"}</p>
        <article id="cv-document" dir={language === "ar" ? "rtl" : "ltr"} lang={language} className="min-h-[700px] break-words rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
          <div className="border-b-2 border-brand pb-5"><h2 className="text-3xl font-bold text-midnight">{cv.name || (language === "ar" ? "اسمك الكامل" : "Your full name")}</h2><p className="mt-2 text-lg text-brand">{cv.title}</p><p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">{[cv.email, cv.phone, cv.location].filter(Boolean).map((v, i) => <span dir="auto" key={i}>{v}</span>)}</p></div>
          {sections.filter((key) => cv[key].trim()).map((key) => <section key={key} className="mt-6"><h3 className="mb-2 text-base font-bold text-brand-dark">{labels[language][key]}</h3><p dir="auto" className="whitespace-pre-wrap text-sm leading-7 text-ink">{cv[key]}</p></section>)}
          {!completed && <p className="cv-controls mt-12 text-center text-sm leading-7 text-muted">{ar ? "ابدأ بإدخال بياناتك لعرض سيرتك هنا. اذكر الشركة والمسمى والتواريخ ثم إنجازاتك لكل خبرة." : "Enter your details to preview your CV here. Include company, role, dates and achievements for each experience."}</p>}
        </article>
      </div>
    </div>
  </div>;
}
