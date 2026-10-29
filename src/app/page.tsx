import Link from "next/link";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { getLocale, t } from "@/lib/i18n";

export default async function Home() {
  const locale = await getLocale();
  const c = t(locale);

  return (
    <>
      <section className="bg-gradient-to-b from-brand-soft to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-brand-dark sm:text-5xl">
            {c.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{c.hero.subtitle}</p>

          {/* GET form → /jobs: works without JS; results come from the database in Phase 2. */}
          <form action="/jobs" method="get" className="mt-8 grid gap-3 rounded-xl border border-line bg-white p-3 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
            <label className="flex items-center gap-2 rounded-lg px-3">
              <Search className="size-4 text-muted" aria-hidden />
              <input name="q" placeholder={c.hero.keyword} aria-label={c.hero.keyword}
                className="w-full bg-transparent py-3 text-sm outline-none" />
            </label>
            <label className="flex items-center gap-2 rounded-lg px-3">
              <MapPin className="size-4 text-muted" aria-hidden />
              <input name="city" placeholder={c.hero.city} aria-label={c.hero.city}
                className="w-full bg-transparent py-3 text-sm outline-none" />
            </label>
            <button className="rounded-lg bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark">
              {c.hero.search}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
        {c.cards.map((card) => (
          <Link key={card.href} href={card.href}
            className="group rounded-xl border border-line bg-white p-6 transition hover:border-brand hover:shadow-sm">
            <h2 className="text-lg font-semibold text-brand-dark">{card.title}</h2>
            <p className="mt-2 text-sm text-muted">{card.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
              {card.cta} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
            </span>
          </Link>
        ))}
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-bold text-brand-dark">{c.services.heading}</h2>
          <p className="mt-3 max-w-3xl text-muted">{c.services.intro}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {c.services.items.map(([title, body]) => (
              <div key={title} className="rounded-xl border border-line bg-white p-5">
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
