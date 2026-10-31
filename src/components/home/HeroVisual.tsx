import { Briefcase, Sparkles, Bookmark, MapPin, Building2 } from "lucide-react";
import type { v3 } from "@/content/v3";

type Demo = (typeof v3)["en"]["heroDemo"];

/**
 * Hero composition: three product-style cards (job, AI match, candidate pipeline) built from native elements.
 * Everything shown is illustrative sample data and is labelled as such ("Sample preview"); there are no
 * real companies, people, scores or statistics. Hidden from assistive technology — it is decoration.
 * On phones only the job card and the match card are shown to keep the first screen short.
 */
export function HeroVisual({ demo }: { demo: Demo }) {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[480px] select-none">
      <div className="absolute -inset-x-8 inset-y-0 rounded-full bg-cyan/25 blur-3xl" />
      <div className="absolute -end-10 top-10 size-56 rounded-full bg-violet/35 blur-3xl" />
      <div className="absolute -top-2 end-2 z-20 hidden rounded-full border border-white/25 bg-midnight/70 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur sm:block">
        {demo.tag}
      </div>

      <div className="relative grid gap-3 lg:block lg:h-[330px]">
        {/* 1 — job card */}
        <div className="float-a shadow-float rounded-3xl border border-white/70 bg-white p-4 lg:absolute lg:start-0 lg:top-6 lg:w-[68%]">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-grad-primary text-white"><Briefcase className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold leading-snug text-midnight">{demo.job}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted"><Building2 className="size-3.5 shrink-0" />{demo.company}</p>
            </div>
            <Bookmark className="size-4 shrink-0 text-muted" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-midnight"><MapPin className="size-3 text-brand" />{demo.city}</span>
            {demo.chips.map((c, i) => (
              <span key={c} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${i === 0 ? "bg-brand/10 text-brand-hover" : "bg-cyan/25 text-midnight"}`}>{c}</span>
            ))}
          </div>
          <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3">
            <span className="text-[11px] font-medium text-muted">{demo.saved}</span>
            <span className="rounded-lg bg-brand px-3.5 py-1.5 text-xs font-bold text-white">{demo.apply}</span>
          </div>
        </div>

        {/* 2 — AI-assisted match (an icon ring, never a fabricated score) */}
        <div className="float-b shadow-float flex items-center gap-3 rounded-3xl border border-white/70 bg-white p-3.5 lg:absolute lg:end-0 lg:top-[178px] lg:w-[64%]">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[conic-gradient(var(--next-violet)_0_72%,#e8e2ff_0)]">
            <span className="grid size-10 place-items-center rounded-full bg-white text-violet"><Sparkles className="size-5" /></span>
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-snug text-midnight">{demo.match}</p>
            <p className="mt-0.5 text-[11px] text-muted">{demo.matchHint}</p>
          </div>
        </div>

      </div>
      <p className="mt-3 text-center text-[11px] text-white/70 lg:hidden">{demo.note}</p>
    </div>
  );
}
