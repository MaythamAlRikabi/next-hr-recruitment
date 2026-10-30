import type { Locale } from "@/lib/i18n";

/** Homepage copy. No statistics, vacancies, companies or testimonials are invented here. */
export type Industry = { slug: string; label: string };

const industriesEn: Industry[] = [
  { slug: "sales-marketing", label: "Sales & Marketing" },
  { slug: "fmcg", label: "FMCG" },
  { slug: "pharmaceutical", label: "Pharmaceutical" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "it", label: "IT" },
  { slug: "engineering", label: "Engineering" },
  { slug: "finance", label: "Finance" },
  { slug: "human-resources", label: "Human Resources" },
  { slug: "logistics", label: "Logistics" },
  { slug: "education", label: "Education" },
  { slug: "other", label: "Other" },
];
const industriesAr: Industry[] = [
  { slug: "sales-marketing", label: "المبيعات والتسويق" },
  { slug: "fmcg", label: "السلع الاستهلاكية" },
  { slug: "pharmaceutical", label: "الصيدلة والأدوية" },
  { slug: "healthcare", label: "الرعاية الصحية" },
  { slug: "it", label: "تكنولوجيا المعلومات" },
  { slug: "engineering", label: "الهندسة" },
  { slug: "finance", label: "المالية" },
  { slug: "human-resources", label: "الموارد البشرية" },
  { slug: "logistics", label: "اللوجستيات" },
  { slug: "education", label: "التعليم" },
  { slug: "other", label: "أخرى" },
];

export const home = {
  en: {
    hero: {
      badge: "HR & Recruitment · Karrada, Baghdad",
      title: "Your next step starts here.",
      subtitle:
        "Find your next opportunity, hire exceptional talent, and build a stronger career with NEXT.",
      keyword: "Job title or keyword",
      city: "City or location",
      search: "Search jobs",
      ctaJobs: "Explore jobs",
      ctaHire: "Post a job",
      visual: { resume: "Resume", review: "AI review", pipeline: ["New", "Review", "Shortlist", "Interview"], job: "Job card" },
    },
    cards: {
      heading: "One platform, three ways forward",
      items: [
        { title: "Find a Job", body: "Search real vacancies, save the ones you like, and apply with the CV you choose.", cta: "Explore Jobs", href: "/jobs" },
        { title: "Hire Talent", body: "Publish vacancies, receive applications and move candidates through a clear pipeline.", cta: "Post a Job", href: "/employers" },
        { title: "CV Studio", body: "Write your CV, preview every edit and save a printable version.", cta: "Improve My CV", href: "/cv-builder" },
      ],
    },
    latest: {
      heading: "Latest jobs",
      all: "View all jobs",
      emptyTitle: "No vacancies have been published yet",
      emptyBody:
        "Verified vacancies will appear here as soon as employers publish them. Create an account to be ready, or tell us what you are hiring for.",
      register: "Create an account",
      hire: "Request recruitment support",
    },
    industries: { heading: "Browse by industry", intro: "Start from the field you work in.", items: industriesEn },
    employers: {
      heading: "Hiring, organised end to end",
      intro: "A focused workspace for HR teams and hiring managers — from the first vacancy to the final offer.",
      steps: [
        ["Publish vacancies", "Create detailed job posts with requirements, salary range and deadline."],
        ["Receive applications", "Applications arrive in one place, linked to the CV each candidate chose."],
        ["Screen candidates", "Filter, review and keep private notes with your team."],
        ["Manage hiring", "Move people through New, Review, Shortlist, Interview, Offer and Hired."],
        ["Connect with NEXT", "Work with NEXT recruiters when you need hands-on support."],
      ],
      cta: "Start hiring",
      status: "Employer tools are being rolled out in stages.",
      mock: { title: "Hiring pipeline", cols: ["New", "Review", "Shortlisted", "Interview"] },
    },
    cv: {
      badge: "CV Studio",
      soon: "Editor available now",
      heading: "From a rough CV to a role-ready one",
      intro:
        "Build your CV in Arabic or English, preview it instantly and save a draft to continue later.",
      flow: ["Your details", "Live preview", "Printable CV"],
      features: [
        ["ATS-friendly formatting", "Clean structure that automated screening tools can read."],
        ["Live preview", "See your real experience in a clear professional layout."],
        ["Job-specific tailoring", "Highlight the experience that matters for each vacancy."],
        ["Print or save PDF", "Use your browser print dialog to save a PDF."],
      ],
      note: "Manual editing is available now. AI assistance is not yet enabled. No guaranteed interviews or ATS approval.",
      cta: "Explore CV Studio",
    },
    hr: {
      heading: "NEXT HR Services",
      intro: "Beyond the platform, NEXT is a working HR & recruitment team in Baghdad.",
      items: [
        ["Tailored Recruitment Solutions", "Recruitment designed around each organisation's hiring requirements."],
        ["Talent Acquisition", "Identifying and connecting with suitable candidates."],
        ["Workforce Planning", "Evaluating staffing needs and planning workforce requirements."],
        ["Career Consulting", "Career development, job-search preparation and professional positioning."],
      ],
      cta: "Talk to NEXT",
    },
    how: {
      heading: "How it works",
      tracks: [
        { title: "Candidates", steps: ["Create your profile", "Search and apply", "Track every application"] },
        { title: "Employers", steps: ["Register your company", "Publish a vacancy", "Review and shortlist"] },
        { title: "CV users", steps: ["Enter your experience", "Review the preview", "Print and apply"] },
      ],
    },
    final: { title: "Ready for your next step?", body: "Join NEXT and take the next step in your career or your hiring.", jobs: "Find a Job", hire: "Post a Job" },
  },
  ar: {
    hero: {
      badge: "الموارد البشرية والتوظيف · الكرادة، بغداد",
      title: "خطوتك القادمة تبدأ من هنا",
      subtitle:
        "اعثر على فرصتك القادمة، ووظّف كفاءات متميزة، وابنِ مسارًا مهنيًا أقوى مع NEXT.",
      keyword: "المسمى الوظيفي أو كلمة مفتاحية",
      city: "المدينة أو الموقع",
      search: "ابحث عن وظيفة",
      ctaJobs: "استكشف الوظائف",
      ctaHire: "انشر وظيفة",
      visual: { resume: "السيرة الذاتية", review: "مراجعة ذكية", pipeline: ["جديد", "مراجعة", "قائمة مختصرة", "مقابلة"], job: "بطاقة وظيفة" },
    },
    cards: {
      heading: "منصة واحدة، ثلاثة مسارات",
      items: [
        { title: "ابحث عن وظيفة", body: "تصفّح الوظائف المنشورة وقدّم بالسيرة التي تختارها.", cta: "استكشف الوظائف", href: "/jobs" },
        { title: "وظّف الكفاءات", body: "انشر الوظائف، واستقبل الطلبات، وانقل المرشحين عبر مسار توظيف واضح.", cta: "انشر وظيفة", href: "/employers" },
        { title: "استوديو السيرة الذاتية", body: "اكتب سيرتك وراجع التعديلات مباشرة واحفظ نسخة قابلة للطباعة.", cta: "حسّن سيرتي الذاتية", href: "/cv-builder" },
      ],
    },
    latest: {
      heading: "أحدث الوظائف",
      all: "عرض كل الوظائف",
      emptyTitle: "لم تُنشر أي وظائف بعد",
      emptyBody:
        "ستظهر الوظائف الموثّقة هنا فور نشرها من الشركات. أنشئ حسابًا لتكون جاهزًا، أو أخبرنا بما تبحث عنه من كفاءات.",
      register: "أنشئ حسابًا",
      hire: "اطلب دعم التوظيف",
    },
    industries: { heading: "تصفّح حسب القطاع", intro: "ابدأ من المجال الذي تعمل فيه.", items: industriesAr },
    employers: {
      heading: "توظيف منظّم من البداية للنهاية",
      intro: "مساحة عمل مركّزة لفرق الموارد البشرية ومديري التوظيف، من أول وظيفة حتى العرض النهائي.",
      steps: [
        ["انشر الوظائف", "أنشئ إعلانات تفصيلية بالمتطلبات ونطاق الراتب والموعد النهائي."],
        ["استقبل الطلبات", "تصلك الطلبات في مكان واحد مرتبطة بالسيرة التي اختارها كل مرشح."],
        ["افرز المرشحين", "صفّ وراجع ودوّن ملاحظات خاصة مع فريقك."],
        ["أدِر التوظيف", "انقل المرشحين بين: جديد، مراجعة، قائمة مختصرة، مقابلة، عرض، تعيين."],
        ["تواصل مع NEXT", "اعمل مع مختصي NEXT عندما تحتاج دعمًا مباشرًا."],
      ],
      cta: "ابدأ التوظيف",
      status: "أدوات الشركات تُطلق على مراحل.",
      mock: { title: "مسار التوظيف", cols: ["جديد", "مراجعة", "قائمة مختصرة", "مقابلة"] },
    },
    cv: {
      badge: "استوديو السيرة الذاتية",
      soon: "المحرّر متاح الآن",
      heading: "من سيرة أولية إلى سيرة جاهزة للوظيفة",
      intro:
        "ابنِ سيرتك بالعربية أو الإنجليزية وشاهدها مباشرة واحفظ مسودة لاستكمالها لاحقاً.",
      flow: ["معلوماتك", "معاينة مباشرة", "سيرة للطباعة"],
      features: [
        ["تنسيق صديق لأنظمة الفرز", "بنية نظيفة تستطيع أدوات الفرز الآلي قراءتها."],
        ["معاينة مباشرة", "شاهد خبراتك الحقيقية ضمن قالب مهني واضح."],
        ["تخصيص لكل وظيفة", "أبرِز الخبرات المهمة لكل شاغر."],
        ["طباعة أو حفظ PDF", "احفظ سيرتك بصيغة PDF من نافذة الطباعة."],
      ],
      note: "التحرير اليدوي متاح الآن. المساعدة بالذكاء الاصطناعي غير مفعّلة بعد. لا ضمان للمقابلات أو اجتياز أنظمة الفرز.",
      cta: "استكشف الاستوديو",
    },
    hr: {
      heading: "خدمات NEXT للموارد البشرية",
      intro: "إلى جانب المنصة، NEXT فريق موارد بشرية وتوظيف يعمل فعليًا في بغداد.",
      items: [
        ["حلول توظيف مخصصة", "خدمات توظيف مصممة وفق احتياجات كل مؤسسة."],
        ["استقطاب الكفاءات", "التعرف على المرشحين المناسبين والتواصل معهم."],
        ["تخطيط القوى العاملة", "تقييم الاحتياجات من الكوادر وتخطيط المتطلبات."],
        ["الاستشارات المهنية", "التطور الوظيفي والتحضير للبحث عن عمل وتحسين الحضور المهني."],
      ],
      cta: "تحدّث مع NEXT",
    },
    how: {
      heading: "كيف تعمل المنصة",
      tracks: [
        { title: "الباحثون عن عمل", steps: ["أنشئ ملفك المهني", "ابحث وقدّم", "تابع كل طلب"] },
        { title: "الشركات", steps: ["سجّل شركتك", "انشر وظيفة", "راجع واختر القائمة المختصرة"] },
        { title: "مستخدمو السيرة", steps: ["أدخل خبراتك", "راجع المعاينة", "اطبع وقدّم"] },
      ],
    },
    final: { title: "هل أنت مستعد لخطوتك القادمة؟", body: "انضم إلى NEXT وابدأ خطوتك المهنية أو خطوة التوظيف.", jobs: "ابحث عن وظيفة", hire: "انشر وظيفة" },
  },
} as const;

export const homeCopy = (l: Locale) => home[l];
