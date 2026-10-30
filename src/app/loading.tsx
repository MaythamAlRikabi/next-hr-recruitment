export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto min-h-[80vh] max-w-6xl animate-pulse px-4 py-16">
      <span className="sr-only">جارٍ التحميل… Loading…</span>
      <div className="h-8 w-1/3 rounded bg-brand-soft" />
      <div className="mt-4 h-4 w-2/3 rounded bg-brand-soft" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="h-32 rounded-xl bg-brand-soft" />
        <div className="h-32 rounded-xl bg-brand-soft" />
        <div className="h-32 rounded-xl bg-brand-soft" />
      </div>
    </div>
  );
}
