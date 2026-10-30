import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/alexandria";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "./globals.css";
import { getLocale, dir, BRAND } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Locale is read from a cookie on every request, so rendering is per-request (blocking) by design.
export const instant = false;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-hr-recruitment.vercel.app"),
  alternates: { canonical: "./" },
  title: { default: BRAND.name, template: `%s | ${BRAND.name}` },
  description:
    "Tailored recruitment solutions, workforce planning, and career consulting in Iraq. Your next step starts here.",
  icons: { icon: [{ url: "/brand/next-mark-48.png", sizes: "48x48", type: "image/png" }] },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dir(locale)}>
      <body className="min-h-screen bg-white text-ink">
        <Header locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
