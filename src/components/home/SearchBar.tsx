import { Search, MapPin } from "lucide-react";

/**
 * Job search module. A plain GET form to /jobs: works without JavaScript, produces shareable
 * URLs (?q=&city=), and supports browser back/forward natively.
 */
export function SearchBar({
  keyword,
  city,
  submit,
  defaultQ = "",
  defaultCity = "",
  industry = "",
}: {
  keyword: string;
  city: string;
  submit: string;
  defaultQ?: string;
  defaultCity?: string;
  industry?: string;
}) {
  return (
    <form
      action="/jobs"
      method="get"
      role="search"
      className="grid grid-cols-[1fr_auto] gap-1.5 rounded-2xl border border-line bg-white p-1.5 shadow-lift sm:grid-cols-[1.4fr_1fr_auto] sm:gap-2 sm:p-2"
    >
      {industry ? <input type="hidden" name="industry" value={industry} /> : null}
      <label className="flex min-h-12 items-center gap-2.5 rounded-xl px-3.5 focus-within:bg-brand-soft">
        <Search className="size-5 shrink-0 text-brand" aria-hidden />
        <input
          name="q"
          defaultValue={defaultQ}
          maxLength={100}
          placeholder={keyword}
          aria-label={keyword}
          className="w-full bg-transparent text-base text-ink outline-none placeholder:text-muted/80"
        />
      </label>
      <label className="order-3 col-span-2 flex min-h-11 items-center gap-2.5 rounded-xl border-t border-line px-3.5 focus-within:bg-brand-soft sm:order-none sm:col-span-1 sm:min-h-12 sm:border-s sm:border-t-0">
        <MapPin className="size-5 shrink-0 text-brand" aria-hidden />
        <input
          name="city"
          defaultValue={defaultCity}
          maxLength={100}
          placeholder={city}
          aria-label={city}
          className="w-full bg-transparent text-base text-ink outline-none placeholder:text-muted/80"
        />
      </label>
      <button
        type="submit"
        className="grid min-h-12 min-w-12 place-items-center rounded-xl bg-brand px-4 text-base sm:px-6 font-semibold text-white shadow-[0_8px_18px_-8px_rgb(18_97_255/0.7)] transition hover:bg-brand-hover active:translate-y-px"
      >
        <Search className="size-5 sm:hidden" aria-hidden />
        <span className="sr-only sm:not-sr-only">{submit}</span>
      </button>
    </form>
  );
}
