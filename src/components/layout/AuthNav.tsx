import Link from "next/link";
import { getViewer, getRoles, homeFor } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import type { Locale } from "@/lib/i18n";

const L = {
  en: { signIn: "Sign in", register: "Register", account: "My account", signOut: "Sign out" },
  ar: { signIn: "تسجيل الدخول", register: "إنشاء حساب", account: "حسابي", signOut: "تسجيل الخروج" },
};

const ghost = "whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold text-midnight transition hover:bg-brand-soft hover:text-brand";
const cta =
  "inline-flex min-h-10 items-center whitespace-nowrap rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-[0_6px_14px_-6px_rgb(18_97_255/0.65)] transition hover:bg-brand-hover";

export async function AuthNav({ locale }: { locale: Locale }) {
  const l = L[locale];
  const viewer = await getViewer();
  if (!viewer) return <SignedOut locale={locale} />;
  const home = homeFor(await getRoles(viewer.id));
  return (
    <>
      <Link href="/notifications" className={ghost}>{locale === "ar" ? "الإشعارات" : "Notifications"}</Link>
      <Link href={home} className={ghost}>{l.account}</Link>
      <form action={signOut}>
        <button type="submit" className={cta}>{l.signOut}</button>
      </form>
    </>
  );
}

export function SignedOut({ locale }: { locale: Locale }) {
  const l = L[locale];
  return (
    <>
      <Link href="/login" className={ghost}>{l.signIn}</Link>
      <Link href="/register" className={cta}>{l.register}</Link>
    </>
  );
}
