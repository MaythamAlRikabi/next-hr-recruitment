import { getLocale } from "@/lib/i18n";
import { pages } from "@/content/pages";
import { formLabels } from "@/content/forms";

export async function pageCtx() {
  const locale = await getLocale();
  return { locale, p: pages[locale], f: formLabels[locale] };
}

import { authLabels } from "@/content/auth";
export async function authCtx() {
  const locale = await getLocale();
  return { locale, L: authLabels[locale], p: pages[locale] };
}
