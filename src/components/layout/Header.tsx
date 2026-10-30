import Link from "next/link";
import { Suspense } from "react";
import { Languages } from "lucide-react";
import { AuthNav, SignedOut } from "@/components/layout/AuthNav";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MegaMenu, type MenuGroup } from "@/components/layout/MegaMenu";
import { v3 } from "@/content/v3";
import { LogoFull, LogoMark } from "@/components/brand/Logo";
import { t, type Locale } from "@/lib/i18n";
import { setLocale } from "@/app/actions";

export function Header({ locale }: { locale: Locale }) {
  const n = t(locale).nav;
  const m = v3[locale].mega;
  const g = m.groups;
  const groups: MenuGroup[] = [
    { key: "jobs", title: g.jobs.title, items: g.jobs.items },
    { key: "employers", title: g.employers.title, items: g.employers.items },
    { key: "candidates", title: g.candidates.title, items: g.candidates.items },
    { key: "services", title: g.services.title, items: g.services.items },
    { key: "about", title: n.about, items: [{ href: "/insights", label: n.insights }, { href: "/about", label: n.about }, { href: "/contact", label: n.contact }] },
  ];
  const links = [
    { href: "/executive-search", label: n.executive },
    { href: "/cv-builder", label: n.cv },
  ];
  const quick = [
    { href: "/jobs", label: n.jobs },
    { href: "/employers", label: n.postJob },
    { href: "/submit-cv", label: n.uploadCv },
  ];
  const other = locale === "ar" ? "en" : "ar";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 shadow-[0_1px_0_rgb(13_27_58/0.02)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link href="/" aria-label="NEXT | HR & Recruitment" className="shrink-0">
          <span className="hidden sm:block"><LogoFull height={40} /></span>
          <span className="sm:hidden"><LogoMark size={38} priority /></span>
        </Link>

        <MegaMenu groups={groups} links={links} soon={m.soon} />

        <div className="ms-auto flex items-center gap-2">
          <form action={setLocale}>
            <input type="hidden" name="locale" value={other} />
            <button
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-midnight transition hover:border-brand hover:text-brand"
              type="submit"
              aria-label={other === "ar" ? "العربية" : "English"}
            >
              <Languages className="size-4" aria-hidden />
              {other === "ar" ? "العربية" : "EN"}
            </button>
          </form>
          <div className="hidden items-center gap-2 xl:flex">
            <Suspense fallback={<SignedOut locale={locale} />}>
              <AuthNav locale={locale} />
            </Suspense>
          </div>
          <MobileMenu
            groups={groups}
            items={links}
            soon={m.soon}
            quick={quick}
            quickLabel={n.quick}
            signIn={{ href: "/login", label: n.signIn }}
            register={{ href: "/register", label: n.register }}
            menuLabel={n.menu}
            closeLabel={locale === "ar" ? "إغلاق" : "Close"}
          />
        </div>
      </div>
    </header>
  );
}
