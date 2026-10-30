import { cookies } from "next/headers";

export type Locale = "ar" | "en";
export const LOCALES: Locale[] = ["ar", "en"];
export const DEFAULT_LOCALE: Locale = "ar";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get("next_locale")?.value;
  return v === "en" || v === "ar" ? v : DEFAULT_LOCALE;
}

export const dir = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

/** Official brand strings are kept in English in both locales. */
export const BRAND = {
  name: "NEXT | HR & Recruitment",
  slogan: "Your next step starts here",
  location: "Karrada, Baghdad, Iraq",
} as const;

const dict = {
  en: {
    nav: {
      home: "Home",
      jobs: "Find Jobs",
      employers: "For Employers",
      cv: "CV Studio",
      services: "Our Services",
      executive: "Executive Search",
      insights: "Insights",
      about: "About NEXT",
      contact: "Contact",
      postJob: "Post a Job",
      uploadCv: "Upload CV",
      quick: "Quick actions",
      signIn: "Sign In",
      register: "Register",
      menu: "Menu",
    },
    hero: {
      title: "Your next step starts here.",
      subtitle:
        "Discover career opportunities, connect with employers, and build a stronger professional future with NEXT.",
      keyword: "Job title or keyword",
      city: "City or location",
      search: "Search Jobs",
    },
    cards: [
      {
        title: "Find Your Next Job",
        body: "Explore available career opportunities and apply with confidence.",
        cta: "Explore Jobs",
        href: "/jobs",
      },
      {
        title: "Hire the Right Talent",
        body: "Post vacancies and manage recruitment through a professional hiring system.",
        cta: "Post a Job",
        href: "/employers",
      },
      {
        title: "Build a Better CV",
        body: "Create, improve, and tailor your resume with AI assistance.",
        cta: "Improve My CV",
        href: "/cv-builder",
      },
    ],
    services: {
      heading: "HR & Recruitment services",
      intro:
        "We support companies by delivering tailored recruitment solutions, workforce planning, and career consulting, while helping candidates take their next step toward meaningful and sustainable careers.",
      items: [
        ["Tailored Recruitment Solutions", "Recruitment services designed around each organization's hiring requirements."],
        ["Talent Acquisition", "Helping organizations identify and connect with suitable candidates."],
        ["Workforce Planning", "Supporting organizations in evaluating staffing needs and planning workforce requirements."],
        ["Career Consulting", "Supporting professionals in career development, job search preparation, and professional positioning."],
      ],
    },
    footer: {
      rights: "All rights reserved.",
      legalDraft: "Legal pages are drafts pending legal review.",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      jobs: "البحث عن وظيفة",
      employers: "للشركات",
      cv: "استوديو السيرة الذاتية",
      services: "خدماتنا",
      executive: "البحث التنفيذي",
      insights: "رؤى ومقالات",
      about: "عن NEXT",
      contact: "تواصل معنا",
      postJob: "انشر وظيفة",
      uploadCv: "ارفع سيرتك",
      quick: "إجراءات سريعة",
      signIn: "تسجيل الدخول",
      register: "إنشاء حساب",
      menu: "القائمة",
    },
    hero: {
      title: "خطوتك القادمة تبدأ من هنا.",
      subtitle:
        "اكتشف فرص العمل المناسبة لك، وتواصل مع الشركات، وطوّر سيرتك الذاتية بخدمات NEXT الذكية.",
      keyword: "المسمى الوظيفي أو كلمة مفتاحية",
      city: "المدينة أو الموقع",
      search: "ابحث عن وظيفة",
    },
    cards: [
      {
        title: "اعثر على وظيفتك القادمة",
        body: "استكشف فرص العمل المتاحة وقدّم بثقة.",
        cta: "استكشف الوظائف",
        href: "/jobs",
      },
      {
        title: "وظّف الكفاءة المناسبة",
        body: "انشر الوظائف الشاغرة وأدِر التوظيف عبر نظام احترافي.",
        cta: "انشر وظيفة",
        href: "/employers",
      },
      {
        title: "سيرة ذاتية أفضل",
        body: "أنشئ سيرتك الذاتية وحسّنها وكيّفها بمساعدة الذكاء الاصطناعي.",
        cta: "حسّن سيرتي الذاتية",
        href: "/cv-builder",
      },
    ],
    services: {
      heading: "خدمات الموارد البشرية والتوظيف",
      intro:
        "ندعم الشركات بحلول توظيف مخصصة وتخطيط للقوى العاملة واستشارات مهنية، ونساعد الباحثين عن عمل على اتخاذ خطوتهم القادمة نحو مسار مهني ذي معنى ومستدام.",
      items: [
        ["حلول توظيف مخصصة", "خدمات توظيف مصممة وفق احتياجات كل مؤسسة."],
        ["استقطاب الكفاءات", "مساعدة المؤسسات على التعرف على المرشحين المناسبين والتواصل معهم."],
        ["تخطيط القوى العاملة", "دعم المؤسسات في تقييم احتياجاتها من الكوادر وتخطيط متطلبات القوى العاملة."],
        ["الاستشارات المهنية", "دعم المهنيين في التطور الوظيفي والتحضير للبحث عن عمل وتحسين حضورهم المهني."],
      ],
    },
    footer: {
      rights: "جميع الحقوق محفوظة.",
      legalDraft: "الصفحات القانونية مسودات بانتظار المراجعة القانونية.",
    },
  },
} as const;

export function t(locale: Locale) {
  return dict[locale];
}
