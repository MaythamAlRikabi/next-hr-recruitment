import { Suspense } from "react";
import { getViewer, getRoles, homeFor } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { BottomNav } from "@/components/layout/BottomNav";

async function Resolved({ locale }: { locale: Locale }) {
  const viewer = await getViewer();
  if (!viewer) return <BottomNav locale={locale} accountHref="/login" signedIn={false} />;
  return <BottomNav locale={locale} accountHref={homeFor(await getRoles(viewer.id))} signedIn />;
}

/** Signed-out bar renders instantly; the account tab upgrades once the session is known. */
export function BottomNavLoader({ locale }: { locale: Locale }) {
  return (
    <Suspense fallback={<BottomNav locale={locale} accountHref="/login" signedIn={false} />}>
      <Resolved locale={locale} />
    </Suspense>
  );
}
