import Link from "next/link";
import { LogoFull, LogoMark } from "@/components/brand/Logo";
import { t, type Locale } from "@/lib/i18n";
import { setLocale } from "@/app/actions";

export function Header({ locale }: { locale: Locale }) {
  const n = t(locale).nav;
  const links = [
    ["/", n.home],
    ["/jobs", n.jobs],
    ["/employers", n.employers],
    ["/cv-builder", n.cv],
    ["/services", n.services],
    ["/about", n.about],
    ["/contact", n.contact],
  ] as const;
  const other = locale === "ar" ? "en" : "ar";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" aria-label="NEXT | HR & Recruitment">
          <span className="hidden sm:block"><LogoFull height={40} priority /></span>
          <span className="sm:hidden"><LogoMark size={36} /></span>
        </Link>

        <nav className="ms-6 hidden flex-1 items-center gap-5 text-sm text-ink lg:flex" aria-label="Primary">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-brand">{label}</Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <form action={setLocale}>
            <input type="hidden" name="locale" value={other} />
            <button className="rounded-md border border-line px-2.5 py-1.5 text-sm text-muted hover:text-brand" type="submit">
              {other === "ar" ? "العربية" : "EN"}
            </button>
          </form>
          <Link href="/login" className="hidden px-3 py-1.5 text-sm hover:text-brand sm:block">{n.signIn}</Link>
          <Link href="/register" className="rounded-md bg-brand px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
            {n.register}
          </Link>
        </div>
      </div>

      {/* Mobile navigation: CSS-only disclosure, no JS required */}
      <details className="border-t border-line lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-brand">{n.menu}</summary>
        <nav className="flex flex-col px-4 pb-3" aria-label="Mobile">
          {[...links, ["/login", n.signIn] as const].map(([href, label]) => (
            <Link key={href} href={href} className="py-2 text-sm hover:text-brand">{label}</Link>
          ))}
        </nav>
      </details>
    </header>
  );
}
