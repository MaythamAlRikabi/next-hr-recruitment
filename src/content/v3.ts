import type { Locale } from "@/lib/i18n";

/** NEXT 3.0 copy: new homepage sections and the mega menu. No statistics, companies, vacancies or testimonials are invented. */
const en = {
  heroDemo: { tag: "Sample preview", job: "Senior Sales Manager", company: "Sample Company", city: "Baghdad", chips: ["Full-time", "FMCG"], apply: "Apply", saved: "Saved", match: "AI-assisted match", matchHint: "Skills vs. requirements", person: "Sample Candidate", role: "Sales Manager", skills: ["Negotiation", "Key accounts", "Team leadership"], stages: ["New", "Review", "Shortlist", "Interview"], stage: "Pipeline", note: "Illustrative demo data — not a real vacancy or person" },
  kpi: { applications: "Applications", cvs: "Uploaded CVs", jobs: "Jobs", published: "Published", received: "Applications received", inquiries: "Inquiries", fresh: "New / unhandled" },
  verified: {
    heading: "Verified companies",
    intro: "A company appears here only after NEXT's team approves its profile.",
    emptyTitle: "No verified companies yet",
    emptyBody: "When employers register and NEXT verifies them, they will be listed here. A company is never shown as verified without approval.",
    cta: "Register your company",
  },
  ctaEmployer: { kicker: "For employers", title: "Hiring? Let NEXT help.", body: "Post vacancies yourself, or hand the search to a NEXT recruiter — including confidential executive searches.", primary: "Post a job", secondary: "Request recruitment" },
  ctaCandidate: { kicker: "For candidates", title: "Ready for your next step?", body: "Create a profile and apply. Joining the talent pool is optional, and you can withdraw at any time.", primary: "Create an account", secondary: "Upload your CV" },
  solutions: { heading: "Recruitment solutions", intro: "Choose how much of the process NEXT handles for you." },
  mega: {
    soon: "Not available yet",
    groups: {
      jobs: { title: "Find Jobs", items: [
        { href: "/jobs", label: "All jobs", hint: "Browse every published vacancy" },
        { href: "/#industries", label: "Jobs by industry", hint: "Sales, FMCG, pharma, IT and more" },
        { href: "/#locations", label: "Jobs by location", hint: "Baghdad, Erbil, Basra and more" },
        { href: "/executive-search", label: "Executive opportunities", hint: "Handled confidentially by NEXT" },
      ] },
      employers: { title: "For Employers", items: [
        { href: "/employer/jobs/new", label: "Post a job", hint: "Draft, then NEXT reviews before publishing" },
        { href: "/employer", label: "Employer dashboard", hint: "Jobs and applications" },
        { href: "/employer/request", label: "Request recruitment", hint: "Let a NEXT recruiter manage the search" },
        { href: "/executive-search", label: "Executive Search", hint: "Leadership hiring with discretion" },
      ] },
      services: { title: "Our Services", items: [
        { href: "/services/permanent-recruitment", label: "Permanent recruitment", hint: "" },
        { href: "/services/talent-mapping", label: "Talent mapping", hint: "" },
        { href: "/services/workforce-planning", label: "Workforce planning", hint: "" },
        { href: "/services/contingency-search", label: "Contingency search", hint: "" },
        { href: "/services", label: "All services", hint: "" },
      ] },
      candidates: { title: "For Candidates", items: [
        { href: "/candidate/profile", label: "Professional profile", hint: "" },
        { href: "/candidate/cv", label: "Upload CV", hint: "" },
        { href: "/cv-builder", label: "CV Studio", hint: "" },
        { href: "/candidate", label: "My applications", hint: "" },
        { href: "", label: "Saved jobs", hint: "", soon: true },
        { href: "", label: "Job alerts", hint: "", soon: true },
        { href: "", label: "Interview preparation", hint: "", soon: true },
      ] },
    },
  },
};
const ar: typeof en = {
  heroDemo: { tag: "عرض توضيحي", job: "مدير مبيعات أول", company: "شركة نموذجية", city: "بغداد", chips: ["دوام كامل", "سلع استهلاكية"], apply: "قدّم الآن", saved: "محفوظة", match: "توافق بمساعدة الذكاء الاصطناعي", matchHint: "المهارات مقابل المتطلبات", person: "مرشح نموذجي", role: "مدير مبيعات", skills: ["التفاوض", "الحسابات الرئيسية", "قيادة الفرق"], stages: ["جديد", "مراجعة", "قائمة مختصرة", "مقابلة"], stage: "مراحل التوظيف", note: "بيانات توضيحية — ليست وظيفة أو شخصاً حقيقياً" },
  kpi: { applications: "الطلبات", cvs: "السير المرفوعة", jobs: "الوظائف", published: "المنشورة", received: "الطلبات المستلمة", inquiries: "الاستفسارات", fresh: "جديدة / غير معالجة" },
  verified: {
    heading: "شركات موثقة",
    intro: "لا تظهر الشركة هنا إلا بعد أن يعتمد فريق NEXT ملفها.",
    emptyTitle: "لا توجد شركات موثقة بعد",
    emptyBody: "عندما تسجّل الشركات ويوثقها فريق NEXT ستظهر هنا. لا تُعرض أي شركة كموثقة دون اعتماد.",
    cta: "سجّل شركتك",
  },
  ctaEmployer: { kicker: "للشركات", title: "تبحث عن كفاءات؟ NEXT معك.", body: "انشر وظائفك بنفسك، أو دع مختصًا من NEXT يدير البحث، بما في ذلك البحث التنفيذي السري.", primary: "انشر وظيفة", secondary: "اطلب خدمة توظيف" },
  ctaCandidate: { kicker: "للمرشحين", title: "هل أنت مستعد لخطوتك القادمة؟", body: "أنشئ ملفك وقدّم على الوظائف. الانضمام إلى مجموعة المواهب اختياري ويمكنك سحب موافقتك في أي وقت.", primary: "أنشئ حسابًا", secondary: "ارفع سيرتك" },
  solutions: { heading: "حلول التوظيف", intro: "اختر مقدار ما تتولاه NEXT نيابةً عنك." },
  mega: {
    soon: "غير متاح بعد",
    groups: {
      jobs: { title: "البحث عن وظيفة", items: [
        { href: "/jobs", label: "كل الوظائف", hint: "تصفّح كل الوظائف المنشورة" },
        { href: "/#industries", label: "الوظائف حسب القطاع", hint: "مبيعات، سلع استهلاكية، أدوية، تقنية وغيرها" },
        { href: "/#locations", label: "الوظائف حسب الموقع", hint: "بغداد، أربيل، البصرة وغيرها" },
        { href: "/executive-search", label: "فرص تنفيذية", hint: "تُدار بسرية عبر NEXT" },
      ] },
      employers: { title: "للشركات", items: [
        { href: "/employer/jobs/new", label: "انشر وظيفة", hint: "مسودة ثم مراجعة NEXT قبل النشر" },
        { href: "/employer", label: "لوحة الشركة", hint: "الوظائف والطلبات" },
        { href: "/employer/request", label: "اطلب خدمة توظيف", hint: "دع مختصًا من NEXT يدير البحث" },
        { href: "/executive-search", label: "البحث التنفيذي", hint: "توظيف القيادات بسرية" },
      ] },
      services: { title: "خدماتنا", items: [
        { href: "/services/permanent-recruitment", label: "التوظيف الدائم", hint: "" },
        { href: "/services/talent-mapping", label: "رسم خارطة المواهب", hint: "" },
        { href: "/services/workforce-planning", label: "تخطيط القوى العاملة", hint: "" },
        { href: "/services/contingency-search", label: "البحث الاحتمالي", hint: "" },
        { href: "/services", label: "كل الخدمات", hint: "" },
      ] },
      candidates: { title: "للمرشحين", items: [
        { href: "/candidate/profile", label: "الملف المهني", hint: "" },
        { href: "/candidate/cv", label: "رفع السيرة", hint: "" },
        { href: "/cv-builder", label: "استوديو السيرة الذاتية", hint: "" },
        { href: "/candidate", label: "طلباتي", hint: "" },
        { href: "", label: "الوظائف المحفوظة", hint: "", soon: true },
        { href: "", label: "تنبيهات الوظائف", hint: "", soon: true },
        { href: "", label: "التحضير للمقابلات", hint: "", soon: true },
      ] },
    },
  },
};
export const v3 = { en, ar } satisfies Record<Locale, typeof en>;
