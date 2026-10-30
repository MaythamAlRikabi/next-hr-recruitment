import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight, Briefcase, Building2, Sparkles, Check, FileText, Megaphone, ShoppingBasket, Pill,
  HeartPulse, Cpu, Wrench, Landmark, UsersRound, Truck, GraduationCap, Layers, Target, ChartColumn,
  Compass, ScanSearch, ShieldCheck, Map as MapIcon, Lightbulb, Lock, MapPin, Newspaper, type LucideIcon,
} from "lucide-react";
import { getLocale } from "@/lib/i18n";
import { homeCopy } from "@/content/home";
import { expansion } from "@/content/expansion";
import { v3 } from "@/content/v3";
import { LatestJobs, VerifiedCompanies, SectionSkeleton } from "@/components/home/DbSections";
import { SearchBar } from "@/components/home/SearchBar";
import { HeroVisual } from "@/components/home/HeroVisual";
import {
  btnOnDark, btnGhostOnDark, cardCls, cardHover, badgeBrand, badgeViolet,
} from "@/components/ui/styles";

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "sales-marketing": Megaphone, fmcg: ShoppingBasket, pharmaceutical: Pill, healthcare: HeartPulse,
  it: Cpu, engineering: Wrench, finance: Landmark, "human-resources": UsersRound, logistics: Truck,
  education: GraduationCap, other: Layers,
};
const SERVICE_ICONS: LucideIcon[] = [Target, UsersRound, ChartColumn, Compass, MapIcon, Lightbulb];
const SERVICE_TILES = ["bg-grad-primary text-white", "bg-cyan text-midnight", "bg-grad-ai text-white", "bg-midnight text-white", "bg-brand/10 text-brand-hover", "bg-violet/10 text-violet-ink"];

function SectionHead({ title, intro, action }: { title: string; intro?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="t-h2 text-midnight">{title}</h2>
        {intro ? <p className="t-body-lg mt-2 max-w-2xl text-muted">{intro}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default async function Home() {
  const locale = await getLocale();
  const h = homeCopy(locale);
  const x = expansion[locale].home;
  const services = expansion[locale].services;
  const Arrow = <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />;

  const cardStyles = [
    { icon: Briefcase, tile: "bg-grad-primary text-white", bar: "bg-grad-primary" },
    { icon: Building2, tile: "bg-cyan text-midnight", bar: "bg-cyan" },
    { icon: Sparkles, tile: "bg-grad-ai text-white", bar: "bg-grad-ai" },
  ] as const;

  return (
    <>
      {/* 1 — Hero (Midnight direction) */}
      <section className="bg-midnight-glow relative isolate overflow-hidden text-white">
        <div aria-hidden className="dot-grid absolute inset-0 -z-10 opacity-20 invert [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-32 pt-12 sm:pb-36 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <span className="size-1.5 rounded-full bg-cyan" aria-hidden />
              {h.hero.badge}
            </p>
            <h1 className="t-display mt-5 text-white">{h.hero.title}</h1>
            <p className="t-body-lg mt-5 max-w-xl text-white/85">{h.hero.subtitle}</p>
            <div className="mt-8">
              <SearchBar keyword={h.hero.keyword} city={h.hero.city} submit={h.hero.search} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
              <Link href="/jobs" className={`${btnOnDark} col-span-2 sm:col-span-1`}>{h.hero.ctaJobs}{Arrow}</Link>
              <Link href="/employers" className={btnGhostOnDark}>{h.hero.ctaHire}</Link>
              <Link href="/submit-cv" className={`${btnGhostOnDark} sm:border-transparent sm:text-cyan sm:underline sm:underline-offset-4 sm:hover:bg-transparent sm:hover:no-underline`}>{x.audience.upload}</Link>
            </div>
          </div>
          <HeroVisual demo={v3[locale].heroDemo} />
        </div>
      </section>

      {/* 2 — Three main services, overlapping the hero */}
      <section aria-label={h.cards.heading} className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24">
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {h.cards.items.map((card, i) => {
            const s = cardStyles[i];
            const Icon = s.icon;
            return (
              <Link key={card.href} href={card.href} className={`group relative overflow-hidden ${cardCls} shadow-float p-6 sm:p-7 ${cardHover}`}>
                <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${s.bar}`} />
                <span className={`grid size-14 place-items-center rounded-2xl shadow-card ${s.tile}`}>
                  <Icon className="size-7" aria-hidden />
                </span>
                <h2 className="t-h3 mt-5 text-midnight">{card.title}</h2>
                <p className="t-body mt-2 text-muted">{card.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-semibold text-brand transition-all group-hover:gap-2.5">
                  {card.cta} {Arrow}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3 — Latest jobs */}
      <section className="mt-12 sm:mt-16">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <SectionHead
            title={h.latest.heading}
            action={<Link href="/jobs" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline">{h.latest.all}{Arrow}</Link>}
          />
          <Suspense fallback={<SectionSkeleton />}>
            <LatestJobs locale={locale} copy={h.latest} />
          </Suspense>
        </div>
      </section>

      {/* 4 — Browse by industry */}
      <section id="industries" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:py-16">
        <SectionHead title={h.industries.heading} intro={h.industries.intro} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {h.industries.items.map((ind) => {
            const Icon = INDUSTRY_ICONS[ind.slug] ?? Layers;
            return (
              <li key={ind.slug}>
                <Link
                  href={`/jobs?industry=${ind.slug}`}
                  className={`group flex min-h-16 items-center gap-3 ${cardCls} p-3.5 ${cardHover}`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold leading-snug text-brand-dark">{ind.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div id="locations" className="mt-16 scroll-mt-20 sm:mt-20">
          <SectionHead title={x.locations.heading} intro={x.locations.intro} />
          <ul className="flex flex-wrap gap-2.5">
            {x.locations.items.map((c) => (
              <li key={c.slug}>
                <Link href={`/jobs?city=${c.slug}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold text-brand-dark transition hover:border-brand hover:text-brand">
                  <MapPin className="size-4 text-brand" aria-hidden />{c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5 — Verified companies (approved by NEXT only) */}
      <section className="bg-brand-soft">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <SectionHead title={v3[locale].verified.heading} intro={v3[locale].verified.intro} />
          <Suspense fallback={<SectionSkeleton />}>
            <VerifiedCompanies locale={locale} />
          </Suspense>
        </div>
      </section>

      {/* 6 — Recruitment solutions */}
      <section className="hidden md:block">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <SectionHead
            title={x.services.heading}
            intro={x.services.intro}
            action={<Link href="/services" className="inline-flex items-center gap-1.5 font-semibold text-brand underline underline-offset-4 hover:no-underline">{x.services.all}{Arrow}</Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((sv, i) => {
              const Icon = SERVICE_ICONS[i] ?? Target;
              const last = i === services.length - 1 && services.length % 3 === 1;
              return (
                <Link key={sv.slug} href={`/services/${sv.slug}`}
                  className={`${cardCls} ${cardHover} ${last ? "sm:col-span-2 lg:col-span-3 sm:flex sm:items-center sm:gap-5" : ""}`}>
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${last ? SERVICE_TILES[3] : SERVICE_TILES[i % SERVICE_TILES.length]}`}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div className={last ? "mt-4 sm:mt-0" : ""}>
                    <h3 className={`font-bold text-brand-dark ${last ? "" : "mt-4"}`}>{sv.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{sv.intro}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 — Executive search */}
      <section className="hidden md:block mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-midnight px-6 py-10 text-white shadow-lift sm:px-12 sm:py-14">
          <div aria-hidden className="absolute -top-20 -end-16 -z-10 size-72 rounded-full bg-brand/40 blur-3xl" />
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                <Lock className="size-4" aria-hidden />{x.exec.badge}
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{x.exec.heading}</h2>
              <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-lg">{x.exec.body}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/executive-search" className={btnOnDark}>{x.exec.cta}{Arrow}</Link>
                <Link href="/executive-search#inquiry" className={btnGhostOnDark}>{x.exec.contact}</Link>
              </div>
            </div>
            <ul className="space-y-3">
              {x.exec.points.map((pt) => (
                <li key={pt} className="flex gap-2.5 rounded-2xl bg-white/10 p-4 text-sm font-semibold">
                  <Check className="mt-0.5 size-5 shrink-0 text-cyan" aria-hidden />{pt}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 7 — AI CV Studio showcase */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-grad-ai px-6 py-10 text-white shadow-lift sm:px-12 sm:py-14">
          <div aria-hidden className="dot-grid absolute inset-0 -z-10 opacity-20 invert" />
          <div aria-hidden className="absolute -bottom-24 -end-16 -z-10 size-72 rounded-full bg-cyan/30 blur-3xl" />
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
                  <Sparkles className="size-4" aria-hidden />{h.cv.badge}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet">{h.cv.soon}</span>
              </div>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">{h.cv.heading}</h2>
              <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-lg">{h.cv.intro}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {h.cv.features.map(([title, body]) => (
                  <li key={title} className="flex gap-2.5">
                    <Check className="mt-0.5 size-5 shrink-0 text-cyan" aria-hidden />
                    <div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="text-sm leading-relaxed text-white/85">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-start gap-2 text-sm text-white/90">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />{h.cv.note}
              </p>
              <div className="mt-6">
                <Link href="/cv-builder" className={btnOnDark}>{h.cv.cta}{Arrow}</Link>
              </div>
            </div>

            {/* Original → AI review → Improved (native mock, no fabricated CV content) */}
            <div aria-hidden className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              {[0, 1, 2].map((i) => (
                <div key={i} className="contents">
                  <div className={`rounded-2xl bg-white p-3.5 text-midnight shadow-lift ${i === 1 ? "ring-4 ring-cyan/60" : ""}`}>
                    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold text-violet">
                      {i === 1 ? <ScanSearch className="size-3.5" /> : i === 2 ? <Check className="size-3.5" /> : <FileText className="size-3.5" />}
                      {h.cv.flow[i]}
                    </p>
                    <div className="space-y-1.5">
                      <span className="block h-1.5 w-full rounded-full bg-line" />
                      <span className={`block h-1.5 w-5/6 rounded-full ${i === 1 ? "bg-violet/50" : "bg-line"}`} />
                      <span className={`block h-1.5 w-2/3 rounded-full ${i === 2 ? "bg-success-fill/70" : "bg-line"}`} />
                      <span className="block h-1.5 w-3/4 rounded-full bg-line" />
                    </div>
                  </div>
                  {i < 2 ? <ArrowRight className="mx-auto size-5 rotate-90 text-white sm:rotate-0 rtl:sm:rotate-180" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8 — How it works */}
      <section className="hidden md:block mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <SectionHead title={h.how.heading} />
        <div className="grid gap-5 md:grid-cols-3">
          {h.how.tracks.map((track, ti) => (
            <div key={track.title} className={cardCls}>
              <span className={ti === 2 ? badgeViolet : badgeBrand}>{track.title}</span>
              <ol className="mt-5 space-y-5">
                {track.steps.map((step, si) => (
                  <li key={step} className="relative flex items-center gap-3.5">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${ti === 2 ? "bg-violet" : "bg-brand"}`}>
                      {si + 1}
                    </span>
                    <span className="font-semibold text-brand-dark">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* 9 — Insights (CMS-backed later; honest empty state) */}
      <section className="hidden bg-brand-soft md:block">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <SectionHead
            title={x.insights.heading}
            intro={x.insights.intro}
            action={<Link href="/insights" className="inline-flex items-center gap-1.5 font-semibold text-brand underline underline-offset-4 hover:no-underline">{x.insights.cta}{Arrow}</Link>}
          />
          <div role="status" className={`${cardCls} mx-auto max-w-3xl px-6 py-10 text-center`}>
            <span className="mx-auto grid size-14 place-items-center rounded-full border-2 border-dashed border-brand/40 bg-brand/5 text-brand">
              <Newspaper className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 text-lg font-bold text-brand-dark">{x.insights.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">{x.insights.emptyBody}</p>
          </div>
        </div>
      </section>

      {/* 10 — Employer & candidate CTAs */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-midnight-glow p-8 text-white shadow-lift sm:p-10">
            <div aria-hidden className="absolute -top-16 -end-10 -z-10 size-56 rounded-full bg-cyan/25 blur-3xl" />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Building2 className="size-3.5" aria-hidden />{v3[locale].ctaEmployer.kicker}</p>
            <h2 className="t-h2 mt-4">{v3[locale].ctaEmployer.title}</h2>
            <p className="t-body mt-3 text-white/85">{v3[locale].ctaEmployer.body}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/employer/jobs/new" className={btnOnDark}>{v3[locale].ctaEmployer.primary}</Link>
              <Link href="/employer/request" className={btnGhostOnDark}>{v3[locale].ctaEmployer.secondary}</Link>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-grad-primary p-8 text-white shadow-lift sm:p-10">
            <div aria-hidden className="absolute -bottom-16 -start-10 -z-10 size-56 rounded-full bg-cyan/30 blur-3xl" />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Briefcase className="size-3.5" aria-hidden />{v3[locale].ctaCandidate.kicker}</p>
            <h2 className="t-h2 mt-4">{v3[locale].ctaCandidate.title}</h2>
            <p className="t-body mt-3 text-white/90">{v3[locale].ctaCandidate.body}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className={btnOnDark}>{v3[locale].ctaCandidate.primary}</Link>
              <Link href="/submit-cv" className={btnGhostOnDark}>{v3[locale].ctaCandidate.secondary}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
