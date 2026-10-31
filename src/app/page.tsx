import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight, Briefcase, Building2, Sparkles, Check, FileText, Megaphone, ShoppingBasket, Pill,
  HeartPulse, Cpu, Wrench, Landmark, UsersRound, Truck, GraduationCap, Layers, ScanSearch, MapPin, type LucideIcon,
} from "lucide-react";
import { getLocale } from "@/lib/i18n";
import { homeCopy } from "@/content/home";
import { expansion } from "@/content/expansion";
import { v3 } from "@/content/v3";
import { LatestJobs, VerifiedCompanies, SectionSkeleton } from "@/components/home/DbSections";
import { SearchBar } from "@/components/home/SearchBar";
import { HeroVisual } from "@/components/home/HeroVisual";
import { btnOnDark, btnGhostOnDark, cardHover } from "@/components/ui/styles";

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "sales-marketing": Megaphone, fmcg: ShoppingBasket, pharmaceutical: Pill, healthcare: HeartPulse,
  it: Cpu, engineering: Wrench, finance: Landmark, "human-resources": UsersRound, logistics: Truck,
  education: GraduationCap, other: Layers,
};

/** One heading per section, nothing else: the page stays calm and each block stands on its own. */
function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
      <h2 className="t-h2 text-midnight">{title}</h2>
      {action}
    </div>
  );
}

export default async function Home() {
  const locale = await getLocale();
  const h = homeCopy(locale);
  const x = expansion[locale].home;
  const Arrow = <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />;

  const cardStyles = [
    { icon: Briefcase, tile: "bg-grad-primary text-white", glow: "glow-brand" },
    { icon: Building2, tile: "bg-cyan text-midnight", glow: "glow-cyan" },
    { icon: Sparkles, tile: "bg-grad-ai text-white", glow: "glow-violet" },
  ] as const;

  return (
    <>
      {/* 1 — Hero: deep navy, one bright glow, one search, two buttons */}
      <section className="bg-midnight-glow relative isolate overflow-hidden text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-36 pt-14 sm:pb-40 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="t-display text-white">{h.hero.title}</h1>
            <p className="t-body-lg mt-5 max-w-xl text-white/85">{h.hero.subtitle}</p>
            <div className="mt-9">
              <SearchBar keyword={h.hero.keyword} city={h.hero.city} submit={h.hero.search} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/jobs" className={btnOnDark}>{h.hero.ctaJobs}{Arrow}</Link>
              <Link href="/employers" className={btnGhostOnDark}>{h.hero.ctaHire}</Link>
            </div>
          </div>
          <HeroVisual demo={v3[locale].heroDemo} />
        </div>
      </section>

      {/* 2 — The three doors, glowing over the edge of the hero */}
      <section aria-label={h.cards.heading} className="relative z-10 mx-auto -mt-24 max-w-6xl px-4 sm:-mt-28">
        <div className="halo halo-cyan grid gap-5 md:grid-cols-3 md:gap-6">
          {h.cards.items.map((card, i) => {
            const s = cardStyles[i];
            const Icon = s.icon;
            return (
              <Link key={card.href} href={card.href} className={`group rounded-3xl border border-white bg-white p-7 ${s.glow} ${cardHover}`}>
                <span className={`grid size-14 place-items-center rounded-2xl ${s.tile}`}>
                  <Icon className="size-7" aria-hidden />
                </span>
                <h2 className="t-h3 mt-6 text-midnight">{card.title}</h2>
                <p className="mt-2 line-clamp-2 text-muted">{card.body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 font-bold text-brand transition-all group-hover:gap-2.5">
                  {card.cta} {Arrow}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3 — Latest jobs (own vacancies first, then imported ads) on a tinted band */}
      <section className="mt-20 bg-brand-soft sm:mt-24">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <SectionHead
            title={h.latest.heading}
            action={<Link href="/jobs" className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline">{h.latest.all}{Arrow}</Link>}
          />
          <Suspense fallback={<SectionSkeleton />}>
            <LatestJobs locale={locale} copy={h.latest} />
          </Suspense>
        </div>
      </section>

      {/* 4 — Browse: industries and cities as plain chips */}
      <section id="industries" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-24">
        <SectionHead title={h.industries.heading} />
        <ul className="flex flex-wrap gap-3">
          {h.industries.items.map((ind) => {
            const Icon = INDUSTRY_ICONS[ind.slug] ?? Layers;
            return (
              <li key={ind.slug}>
                <Link href={`/jobs?industry=${ind.slug}`} className="group inline-flex min-h-12 items-center gap-2.5 rounded-full border border-line bg-white px-5 font-semibold text-midnight transition hover:border-brand hover:bg-brand hover:text-white hover:shadow-[0_12px_32px_-10px_rgb(18_97_255/0.7)]">
                  <Icon className="size-5 text-brand group-hover:text-white" aria-hidden />{ind.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div id="locations" className="mt-14 scroll-mt-20">
          <SectionHead title={x.locations.heading} />
          <ul className="flex flex-wrap gap-3">
            {x.locations.items.map((c) => (
              <li key={c.slug}>
                <Link href={`/jobs?city=${c.slug}`} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-midnight px-5 font-semibold text-white transition hover:bg-brand hover:shadow-[0_12px_32px_-10px_rgb(18_97_255/0.7)]">
                  <MapPin className="size-4 text-cyan" aria-hidden />{c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 — Verified companies: shown only once there are approved companies */}
      <Suspense fallback={null}>
        <VerifiedCompanies locale={locale} />
      </Suspense>

      {/* 6 — Executive search: one dark block with a bright glow */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-midnight px-7 py-14 text-white sm:px-14 sm:py-20">
          <div aria-hidden className="absolute -top-24 -end-16 -z-10 size-96 rounded-full bg-brand/60 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 start-10 -z-10 size-80 rounded-full bg-cyan/25 blur-3xl" />
          <div className="max-w-2xl">
            <h2 className="t-h1 text-white">{x.exec.heading}</h2>
            <p className="t-body-lg mt-4 text-white/85">{x.exec.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/executive-search" className={btnOnDark}>{x.exec.cta}{Arrow}</Link>
              <Link href="/executive-search#inquiry" className={btnGhostOnDark}>{x.exec.contact}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7 — CV Studio: violet glow, one picture, one button */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-grad-ai px-7 py-14 text-white sm:px-14 sm:py-20">
          <div aria-hidden className="absolute -bottom-28 -end-12 -z-10 size-96 rounded-full bg-cyan/40 blur-3xl" />
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                <Sparkles className="size-4" aria-hidden />{h.cv.badge}
              </span>
              <h2 className="t-h1 mt-5 text-white">{h.cv.heading}</h2>
              <p className="t-body-lg mt-4 text-white/90">{h.cv.intro}</p>
              <div className="mt-9">
                <Link href="/cv-builder" className={btnOnDark}>{h.cv.cta}{Arrow}</Link>
              </div>
            </div>

            {/* Original → AI review → Improved (native mock, no fabricated CV content) */}
            <div aria-hidden className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="contents">
                  <div className={`rounded-2xl bg-white p-3.5 text-midnight ${i === 1 ? "glow-cyan ring-4 ring-cyan/60" : "shadow-lift"}`}>
                    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold text-violet">
                      {i === 1 ? <ScanSearch className="size-3.5" /> : i === 2 ? <Check className="size-3.5" /> : <FileText className="size-3.5" />}
                      {h.cv.flow[i]}
                    </p>
                    <div className="space-y-1.5">
                      <span className="block h-1.5 w-full rounded-full bg-line" />
                      <span className={`block h-1.5 w-5/6 rounded-full ${i === 1 ? "bg-violet/50" : "bg-line"}`} />
                      <span className={`block h-1.5 w-2/3 rounded-full ${i === 2 ? "bg-success-fill/70" : "bg-line"}`} />
                    </div>
                  </div>
                  {i < 2 ? <ArrowRight className="mx-auto size-5 rotate-90 text-white sm:rotate-0 rtl:sm:rotate-180" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8 — Two closing doors */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-midnight-glow p-8 text-white sm:p-10">
            <div aria-hidden className="absolute -top-16 -end-10 -z-10 size-56 rounded-full bg-cyan/30 blur-3xl" />
            <h2 className="t-h2 text-white">{v3[locale].ctaEmployer.title}</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/employer/jobs/new" className={btnOnDark}>{v3[locale].ctaEmployer.primary}</Link>
              <Link href="/employer/request" className={btnGhostOnDark}>{v3[locale].ctaEmployer.secondary}</Link>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-grad-primary p-8 text-white sm:p-10">
            <div aria-hidden className="absolute -bottom-16 -start-10 -z-10 size-56 rounded-full bg-cyan/40 blur-3xl" />
            <h2 className="t-h2 text-white">{v3[locale].ctaCandidate.title}</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={btnOnDark}>{v3[locale].ctaCandidate.primary}</Link>
              <Link href="/submit-cv" className={btnGhostOnDark}>{v3[locale].ctaCandidate.secondary}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
