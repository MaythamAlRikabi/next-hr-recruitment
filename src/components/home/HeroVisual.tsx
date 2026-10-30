import { Briefcase, Sparkles, FileText, Check, Bookmark } from "lucide-react";

/**
 * Decorative hero composition for the dark hero. Built from native elements — no baked-in text, photos,
 * fake companies or statistics. Skeleton bars stand in for content; the ring shows an icon, never a score.
 * Hidden from assistive technology.
 */
export function HeroVisual({
  labels,
}: {
  labels: { resume: string; review: string; pipeline: readonly string[]; job: string };
}) {
  const bar = (w: string, tone = "bg-line") => <span className={`block h-2 rounded-full ${tone} ${w}`} />;
  return (
    <div aria-hidden className="relative mx-auto h-[440px] w-full max-w-[470px] select-none sm:h-[480px]">
      <div className="absolute inset-8 rounded-full bg-brand/25 blur-3xl" />

      {/* job card */}
      <div className="float-a shadow-float absolute start-2 top-2 w-[64%] rounded-3xl border border-white/60 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-grad-primary text-white"><Briefcase className="size-5" /></span>
          <Bookmark className="size-4 text-muted" />
        </div>
        <div className="mt-3 space-y-2">{bar("w-3/4", "bg-midnight/85")}{bar("w-1/2")}</div>
        <div className="mt-3 flex gap-1.5">
          <span className="h-5 w-12 rounded-full bg-brand/10" /><span className="h-5 w-14 rounded-full bg-cyan/30" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted">{labels.job}</span>
          <span className="grid h-6 w-9 place-items-center rounded-lg bg-brand text-white"><Check className="size-3.5" /></span>
        </div>
      </div>

      {/* match indicator */}
      <div className="float-b shadow-float absolute end-0 top-[118px] flex w-[58%] items-center gap-3 rounded-3xl border border-white/60 bg-white p-3.5 sm:top-[110px]">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[conic-gradient(var(--next-violet)_0_72%,#e8e2ff_0)]">
          <span className="grid size-10 place-items-center rounded-full bg-white text-violet"><Sparkles className="size-5" /></span>
        </span>
        <div className="min-w-0 flex-1 space-y-2">{bar("w-full", "bg-midnight/80")}{bar("w-2/3")}</div>
      </div>

      {/* resume preview */}
      <div className="float-a shadow-float absolute start-0 top-[220px] w-[62%] rounded-3xl border border-white/60 bg-white p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-brand/10 text-brand"><FileText className="size-5" /></span>
          <div className="space-y-1.5">{bar("w-20", "bg-midnight/85")}{bar("w-14")}</div>
        </div>
        <div className="mt-3 space-y-2">{bar("w-full")}{bar("w-11/12")}{bar("w-3/4")}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold text-brand-hover">{labels.resume}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-violet/10 px-2.5 py-1 text-[10px] font-semibold text-violet-ink"><Sparkles className="size-3" />{labels.review}</span>
        </div>
      </div>

      {/* pipeline strip */}
      <div className="float-b shadow-float absolute inset-x-3 bottom-0 rounded-2xl border border-white/60 bg-white/95 p-3 sm:inset-x-6">
        <div className="flex items-center justify-between gap-1">
          {labels.pipeline.map((step, i) => (
            <div key={step} className="flex flex-1 items-center gap-1">
              <span className={`grid size-5 shrink-0 place-items-center rounded-full text-white ${i < 2 ? "bg-success-fill" : "bg-line"}`}>{i < 2 ? <Check className="size-3" /> : null}</span>
              <span className="truncate text-[10px] font-semibold text-midnight">{step}</span>
              {i < labels.pipeline.length - 1 ? <span className="h-px flex-1 bg-line" /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
