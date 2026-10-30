/** Shared class recipes — one source of truth for form controls, buttons, cards and badges. */
export const inputCls =
  "w-full min-h-11 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-danger";

const btnBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-px";

export const btnPrimary = `${btnBase} bg-brand text-white shadow-[0_6px_16px_-6px_rgb(18_97_255/0.6)] hover:bg-brand-hover`;
export const btnSecondary = `${btnBase} border border-line bg-white text-midnight hover:border-brand hover:text-brand`;
/** Violet–blue gradient: AI tools only. */
export const btnAi = `${btnBase} bg-grad-ai text-white shadow-[0_6px_16px_-6px_rgb(119_84_255/0.6)] hover:brightness-110`;
/** For use on saturated gradient backgrounds. */
export const btnOnDark = `${btnBase} bg-white text-brand shadow-lg hover:bg-brand-soft`;
export const btnGhostOnDark = `${btnBase} border border-white/60 text-white hover:bg-white/10`;

export const cardCls = "rounded-2xl border border-line bg-white p-6 shadow-card";
export const cardHover =
  "transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift";

export const badgeCls =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";
export const badgeBrand = `${badgeCls} bg-brand/10 text-brand-hover`;
export const badgeViolet = `${badgeCls} bg-violet/10 text-violet-ink`;
export const badgeSuccess = `${badgeCls} bg-success-fill/15 text-success`;
export const badgeWarning = `${badgeCls} bg-warning-fill/20 text-warning`;
