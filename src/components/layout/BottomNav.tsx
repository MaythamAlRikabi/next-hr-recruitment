"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, House, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const L = {
  ar: { home: "الرئيسية", jobs: "الوظائف", cv: "السيرة", account: "حسابي", signIn: "دخول", nav: "التنقل السريع" },
  en: { home: "Home", jobs: "Jobs", cv: "CV Studio", account: "Account", signIn: "Sign in", nav: "Quick navigation" },
} as const;

/** App-style bottom tab bar, phones only. `accountHref` is the viewer's dashboard (or /login when signed out). */
export function BottomNav({ locale, accountHref, signedIn }: { locale: Locale; accountHref: string; signedIn: boolean }) {
  const l = L[locale];
  const path = usePathname() ?? "/";
  const items = [
    { href: "/", label: l.home, Icon: House, active: path === "/" },
    { href: "/jobs", label: l.jobs, Icon: Briefcase, active: path.startsWith("/jobs") },
    { href: "/cv-builder", label: l.cv, Icon: FileText, active: path.startsWith("/cv-builder") },
    { href: accountHref, label: signedIn ? l.account : l.signIn, Icon: UserRound, active: ["/candidate", "/employer", "/agency", "/admin", "/account"].some((p) => path === p || path.startsWith(p + "/")) || path === "/login" },
  ];
  return (
    <nav aria-label={l.nav} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ href, label, Icon, active }) => (
          <li key={href + label}>
            <Link href={href} aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${active ? "text-brand" : "text-muted hover:text-brand"}`}>
              <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-brand/10" : ""}`}>
                <Icon className="size-5" aria-hidden />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
