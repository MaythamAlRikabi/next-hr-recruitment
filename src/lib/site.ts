/**
 * Public company details. Values are config-only for now; Phase 6 moves them to
 * platform_settings (editable from the Admin dashboard).
 * null = not yet provided/verified → never rendered.
 */
export const SITE = {
  linkedin: "https://www.linkedin.com/company/next-hr-recruitment/",
  instagram: null as string | null, // URL not confirmed; do not infer from screenshot
  phone: null as string | null, // placeholder until the official number is supplied (+964…)
  email: null as string | null, // placeholder until the official address is supplied
  domain: null as string | null, // purchased later; listed legacy site nextrecruitment.work.gd untouched
} as const;
