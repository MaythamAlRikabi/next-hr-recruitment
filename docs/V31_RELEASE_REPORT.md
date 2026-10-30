# NEXT 3.1 — Release report (Preview only)

Date: 2026-10-30 · Branch: `next-3.1-dev` · Repo: `MaythamAlRikabi/next-hr-recruitment` · Production and the real Supabase project were **not touched**.

## 1. Design changes vs. the previous screenshots
| Area | Before (3.0 snapshot) | 3.1 |
|---|---|---|
| Hero cards | Skeleton bars, no content | Product-style cards (job card, AI-assisted match ring, candidate card, pipeline) with clearly sample data, a visible "Sample preview / عرض توضيحي" tag and a note on mobile. No scores, companies or people are invented. |
| Header | "Sign in" wrapped at 1280 px (EN), tight | Non-wrapping auth links, official full logo on desktop, official mark on phones |
| Mega menu | Hover then click closed the panel; panel could overflow; no arrow-key support | Mouse hover (mouse only), tap, keyboard (Enter/Space/ArrowDown/Up/Home/End/Left/Right, Escape returns focus), panel measured and shifted to stay inside the viewport, RTL-aware |
| Mobile hero | Long first screen, tiny "Upload CV" link | Keyword + search button on one row, city below; three equal CTA buttons; only job + match cards shown |
| Service tiles | All navy | Alternating brand / cyan / violet / navy tiles; seventh card spans the grid instead of leaving a gap |
| Spacing | Industries and locations crowded | Larger section gap |
| Fonts | 4 IBM Plex weights + fontsource CSS | Self-hosted (`public/fonts`), 2 Plex weights, first-paint fonts preloaded per language, immutable cache |
Screenshots: `docs/screenshots/v31/` (10 pages × AR/EN × 390/1440 px). Before: `docs/screenshots/before/`, 3.0: `docs/screenshots/after/`.

## 2. GitHub ↔ Vercel
- Repo `next-hr-recruitment` created by the owner (public). Pushed `next-3.1-dev` only; no `main` branch exists.
- Preview deployments are created **from GitHub** (`create_deployment` with `gitSource`), no file upload.
- **Not done:** the existing Vercel project is not yet connected to the GitHub repo for automatic Preview-on-push (no available tool links an existing project). Owner action: Vercel → Settings → Git → Connect repository, and set Production Branch to `main` (non-existent) so that no push can create a Production deployment.
- Production deployment list verified unchanged (latest production: `dpl_5oZuTg4LyBFZQBdFY77zgszU7twR`).

## 3. Supabase Staging
- Project `next-hr-staging` **not created**: the cost-confirmation step was cancelled; the owner chose to create it manually. Org: `Nono` (only org; contains `next-hr-recruitment`).
- Migrations 0006–0008 reviewed (`docs/MIGRATION_REVIEW.md`); not applied anywhere. Plan: apply 0001–0008 in order to the new project, run `supabase/tests`, run advisors, wire a Preview env (not Production) to it, then run `e2e/hiring-cycle.spec.ts`.

## 4. End-to-end tests (`npx playwright test`, local `next start`)
73 passed, 0 failed, 23 skipped (hiring-cycle specs skipped by design until a staging project exists; they are `fixme` placeholders, not passing tests).
Covered: 14 public pages × AR/EN × desktop/mobile (status, dir, no overflow, no console errors), search form, sample-label, language toggle, protected-route redirects, mega-menu mouse/keyboard/Escape/viewport bounds, mobile menu.
Bugs found and fixed by the tests: language toggle did not update the page until reload (now cookie + reload); mega menu closed when a hovering mouse clicked the trigger.
axe-core: 0 violations on all audited pages (AR/EN).

## 5. Performance (homepage, mobile profile)
| Setting | AR | EN |
|---|---|---|
| Lighthouse, applied throttling (slow 4G, 4× CPU), local | LCP 2.0 s, perf 96 | LCP 1.8 s, perf 97 |
| Lighthouse, Lantern simulation (what PageSpeed Insights uses), local, 3 runs | LCP 3.5–3.7 s, perf 86–88 | LCP 3.1–3.2 s, perf 90–92 |
| Before changes (simulation) | LCP 4.2 s, perf 74 | LCP 3.4 s, perf 90 |
Changes: self-hosted + preloaded fonts, removed unused weights, removed opacity animation from hero text, removed `partialPrefetching` (HTML 281 KB → 185 KB, 44 → 33 KB gzip), logo preload only for the mobile mark.
**Not done:** Lighthouse against the published Preview. The build sandbox cannot reach `*.vercel.app` (proxy 403) and PageSpeed Insights is not reachable either. The 2.5 s target is met under applied throttling and **not** met under simulated throttling. Run PageSpeed Insights on the Preview URL (or Lighthouse from your machine) to confirm.

## 6. Works for real now
Public site AR/EN, navigation, job search form (GET), registration/login/forms (Phase A+B behaviour, previously tested locally), responsive layout, accessibility checks above, sitemap/metadata.
## 7. Still incomplete
Hiring cycle verified end-to-end (needs Staging), real notifications, private CV storage test, tenant-isolation tests on a live DB, AI CV Studio (architecture only; needs Anthropic key), CMS UI, automatic Preview-on-push, Lighthouse on the published Preview, `account` page language form (same refresh issue as the old toggle).
