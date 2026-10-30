"use client";

import { Languages } from "lucide-react";
import { setLocale } from "@/app/actions";

/**
 * Language switch. Without JavaScript it posts to the `setLocale` server action (which sets the cookie and re-renders).
 * With JavaScript it writes the same cookie and reloads, so the whole document (lang, dir, fonts, copy) switches at once —
 * a client-side RSC refresh left the old <html dir> in place under cacheComponents.
 */
export function LocaleToggle({ other, label, text }: { other: "ar" | "en"; label: string; text: string }) {
  return (
    <form
      action={setLocale}
      onSubmit={(e) => {
        e.preventDefault();
        document.cookie = `next_locale=${other}; path=/; max-age=31536000; samesite=lax`;
        window.location.reload();
      }}
    >
      <input type="hidden" name="locale" value={other} />
      <button
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-midnight transition hover:border-brand hover:text-brand-hover"
        type="submit"
        aria-label={label}
      >
        <Languages className="size-4" aria-hidden />
        {text}
      </button>
    </form>
  );
}
