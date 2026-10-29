import Link from "next/link";
import { LogoFull } from "@/components/brand/Logo";
import { BRAND, t, type Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const f = t(locale).footer;
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <LogoFull height={44} />
          <p className="text-sm text-muted">{BRAND.location}</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Footer">
          <Link href="/jobs" className="hover:text-brand">{t(locale).nav.jobs}</Link>
          <Link href="/employers" className="hover:text-brand">{t(locale).nav.employers}</Link>
          <Link href="/services" className="hover:text-brand">{t(locale).nav.services}</Link>
          <Link href="/contact" className="hover:text-brand">{t(locale).nav.contact}</Link>
        </nav>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Legal">
          <Link href="/privacy" className="hover:text-brand">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-brand">Terms of Service</Link>
          <Link href="/faq" className="hover:text-brand">FAQ</Link>
        </nav>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {BRAND.name}. {f.rights}
      </div>
    </footer>
  );
}
