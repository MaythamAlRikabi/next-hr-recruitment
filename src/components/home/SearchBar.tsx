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
}: {
  keyword: string;
  city: string;
  submit: string;
  defaultQ?: string;
  defaultCity?: string;
}) {
  return (
    <form
      action="/jobs"
      method="get"
      role="search"
      className="grid gap-2 rounded-2xl border border-line bg-white p-2 shadow-lift sm:grid-cols-[1.4fr_1fr_auto]"
    >
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
      <label className="flex min-h-12 items-center gap-2.5 rounded-xl px-3.5 focus-within:bg-brand-soft sm:border-s sm:border-line">
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
        className="min-h-12 rounded-xl bg-brand px-6 text-base font-semibold text-white shadow-[0_8px_18px_-8px_rgb(18_97_255/0.7)] transition hover:bg-brand-hover active:translate-y-px"
      >
        {submit}
      </button>
    </form>
  );
}
