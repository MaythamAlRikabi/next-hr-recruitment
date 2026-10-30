import { twMerge } from "tailwind-merge";

export function PageHeader({ title, intro, eyebrow }: { title: string; intro?: string; eyebrow?: string }) {
  return (
    <section className="bg-midnight-glow relative isolate overflow-hidden text-white">
      <div aria-hidden className="dot-grid absolute inset-0 -z-10 opacity-20 invert [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        {eyebrow ? (
          <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold text-white">{eyebrow}</p>
        ) : null}
        <h1 className="t-h1 max-w-3xl text-white">{title}</h1>
        {intro ? <p className="t-body-lg mt-3 max-w-2xl text-white/85">{intro}</p> : null}
      </div>
    </section>
  );
}

export function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={twMerge("mx-auto max-w-6xl px-4 py-12", className)}>{children}</section>;
}

/** Visible, honest status badge for features that are not fully live yet. */
export function StatusNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="note" className="rounded-xl border border-warning-fill/40 bg-warning-fill/10 px-4 py-3 text-sm font-medium text-warning">
      {children}
    </p>
  );
}
