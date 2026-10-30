import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Check, Circle } from "lucide-react";
import { cardCls } from "@/components/ui/styles";

/** KPI tile. Pass only values that came from the database — never placeholders or estimates. */
export function KpiCard({ icon: Icon, label, value, tone = "brand", hint }: { icon: LucideIcon; label: string; value: string | number; tone?: "brand" | "violet" | "success" | "warning"; hint?: string }) {
  const tones = {
    brand: "bg-brand/10 text-brand",
    violet: "bg-violet/10 text-violet-ink",
    success: "bg-success-fill/15 text-success",
    warning: "bg-warning-fill/20 text-warning",
  } as const;
  return (
    <div className={`${cardCls} flex items-center gap-4 p-5`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}><Icon className="size-6" aria-hidden /></span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="t-h2 text-midnight" dir="ltr">{value}</p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

/** Accessible progress bar with a visible numeric value. */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-brand/10" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-grad-primary transition-[width] duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

/** Checklist of steps; state is conveyed by icon AND text, not colour alone. */
export function StepList({ steps, doneLabel, todoLabel }: { steps: { label: string; done: boolean }[]; doneLabel: string; todoLabel: string }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
          <span className={`grid size-6 shrink-0 place-items-center rounded-full ${s.done ? "bg-success-fill text-white" : "border border-line text-muted"}`}>
            {s.done ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3" aria-hidden />}
          </span>
          <span className="font-semibold text-midnight">{s.label}</span>
          <span className={`ms-auto text-xs ${s.done ? "text-success" : "text-muted"}`}>{s.done ? doneLabel : todoLabel}</span>
        </li>
      ))}
    </ul>
  );
}

/** Designed empty state: says what is missing and offers the next real action. */
export function EmptyState({ icon: Icon, title, body, children }: { icon: LucideIcon; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div role="status" className={`${cardCls} px-6 py-10 text-center`}>
      <span className="mx-auto grid size-14 place-items-center rounded-full border-2 border-dashed border-brand/40 bg-brand/5 text-brand"><Icon className="size-6" aria-hidden /></span>
      <h3 className="t-h4 mt-4 text-midnight">{title}</h3>
      {body ? <p className="t-body mx-auto mt-2 max-w-xl text-muted">{body}</p> : null}
      {children ? <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}

/** Error state for a failed data load — never silently shows an empty list. */
export function ErrorState({ title, body }: { title: string; body?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
      <p className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="size-5" aria-hidden />{title}</p>
      {body ? <p className="mt-1 text-sm text-muted">{body}</p> : null}
    </div>
  );
}

export function Skeleton({ className = "h-24" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-2xl bg-line/60 ${className}`} />;
}
