import Link from "next/link";
import { MapPin } from "lucide-react";
import { LogoFull } from "@/components/brand/Logo";
import { InstallApp } from "@/components/pwa/InstallApp";
import { BRAND, t, type Locale } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { getCopyrightYear } from "@/lib/year";

type Col = { title: string; links: [string, string][] };

const cols: Record<Locale, Col[]> = {
  en: [
    { title: "Platform", links: [["/jobs", "Find Jobs"], ["/employers", "For Employers"], ["/executive-search", "Executive Search"], ["/cv-builder", "AI CV Studio"], ["/insights", "Insights"], ["/about", "About NEXT"], ["/contact", "Contact"]] },
    { title: "Candidates", links: [["/register", "Create an account"], ["/login", "Sign in"], ["/submit-cv", "Submit your CV"], ["/cv-builder", "Improve my CV"], ["/faq", "FAQ"]] },
    { title: "Employers", links: [["/employers", "Post a job"], ["/services#companies", "Request recruitment"], ["/register", "Company account"]] },
    { title: "HR Services", links: [["/services/permanent-recruitment", "Permanent recruitment"], ["/services/talent-acquisition", "Talent acquisition"], ["/services/workforce-planning", "Workforce planning"], ["/services/career-consulting", "Career consulting"]] },
    { title: "Legal", links: [["/privacy", "Privacy Policy"], ["/terms", "Terms of Service"], ["/report-abuse", "Report abuse"]] },
  ],
  ar: [
    { title: "المنصة", links: [["/jobs", "البحث عن وظيفة"], ["/employers", "للشركات"], ["/executive-search", "البحث التنفيذي"], ["/cv-builder", "استوديو السيرة الذكي"], ["/insights", "رؤى ومقالات"], ["/about", "عن NEXT"], ["/contact", "تواصل معنا"]] },
    { title: "الباحثون عن عمل", links: [["/register", "إنشاء حساب"], ["/login", "تسجيل الدخول"], ["/submit-cv", "قدّم سيرتك"], ["/cv-builder", "حسّن سيرتي"], ["/faq", "الأسئلة الشائعة"]] },
    { title: "الشركات", links: [["/employers", "انشر وظيفة"], ["/services#companies", "اطلب خدمة توظيف"], ["/register", "حساب شركة"]] },
    { title: "خدمات الموارد البشرية", links: [["/services/permanent-recruitment", "التوظيف الدائم"], ["/services/talent-acquisition", "استقطاب الكفاءات"], ["/services/workforce-planning", "تخطيط القوى العاملة"], ["/services/career-consulting", "الاستشارات المهنية"]] },
    { title: "قانوني", links: [["/privacy", "سياسة الخصوصية"], ["/terms", "شروط الاستخدام"], ["/report-abuse", "الإبلاغ عن إساءة"]] },
  ],
};

function LinkedInIcon() {
  // lucide v1 dropped brand icons; inline the standard LinkedIn glyph.
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export async function Footer({ locale }: { locale: Locale }) {
  const f = t(locale).footer;
  const year = await getCopyrightYear();
  return (
    <footer className="mt-16 border-t border-line bg-brand-soft">
      <div aria-hidden className="h-1 bg-grad-hero" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.3fr_repeat(5,1fr)]">
        <div className="space-y-4">
          <div className="inline-block rounded-2xl bg-white p-3 shadow-card">
            <LogoFull height={44} />
          </div>
          <p className="max-w-xs text-sm font-semibold text-brand-dark">{BRAND.slogan}</p>
          <p className="flex items-center gap-2 text-sm text-muted">
            <MapPin className="size-4 shrink-0 text-brand" aria-hidden />
            {BRAND.location}
          </p>
          <a
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="inline-grid size-10 place-items-center rounded-xl bg-white text-[#0a66c2] shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <LinkedInIcon />
          </a>
          <InstallApp locale={locale} />
        </div>
        {cols[locale].map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-sm font-bold text-brand-dark">{col.title}</h2>
            <ul className="mt-3 space-y-2.5">
              {col.links.map(([href, label]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted transition hover:text-brand">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 text-center text-xs text-muted sm:flex-row">
          <span>© {year} {BRAND.name}. {f.rights}</span>
          <span>{f.legalDraft}</span>
        </div>
      </div>
    </footer>
  );
}
