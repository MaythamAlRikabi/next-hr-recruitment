# Audit Report — NEXT | HR & Recruitment (2026-10-29)

Scope: source tree, build, Supabase live schema/advisors, Vercel project metadata. Not verifiable from this environment: the rendered production site (vercel.app/supabase.co blocked by the sandbox proxy) and Vercel runtime logs (403).

## Working features (verified locally unless noted)
- Homepage, header/footer, AR/EN language switch (cookie `next_locale`), RTL/LTR.
- Supabase SSR clients (publishable key only), `proxy.ts` session refresh + role gate.
- Live DB: migrations 0001–0005 applied; 0 security advisor lints; anon cannot read inquiries; signup trigger assigns `candidate` only.

## Findings
| ID | Sev | Finding | Status |
|----|-----|---------|--------|
| A1 | P0 | `new Date()` in Footer broke prerender of `/` and `/_not-found` (Next 16 Cache Components) | FIXED: `getCopyrightYear()` with `"use cache"` + `cacheLife("days")`. Local build passes. Production not re-verified. |
| A2 | P0 | 11 public routes returned 404 | FIXED locally: all implemented (see QA_REPORT). Not yet deployed. |
| A3 | P0 | Login/register absent; no real auth | FIXED locally: Supabase Auth actions, callbacks, recovery. Live email flows untested. |
| A4 | P1 | Supabase Auth Site URL / redirect allow-list not configurable via available tools | OPEN — owner must set in dashboard (see DEPLOYMENT_GUIDE). |
| A5 | P1 | No error/404/loading/not-authorized pages | FIXED locally. |
| A6 | P1 | No security headers | FIXED locally (nosniff, frame deny, referrer, permissions, HSTS). CSP not yet added (P2). |
| A7 | P1 | Deployed logo is a downsized low-colour copy; original 1MB PNGs not deployable via the MCP | OPEN — need GitHub/CLI deploy or a lighter official asset. |
| A8 | P1 | Source not in Git; GitHub token invalid → no CI/preview workflow | OPEN. |
| A9 | P2 | Logo shows a white box on the soft footer background (no transparency in the source) | OPEN — needs transparent official logo. |
| A10 | P2 | No CSP, no automated test runner in CI | OPEN. |
| A11 | P2 | Contact phone/email/Instagram/domain unset (intentional, no invention) | OPEN — admin settings UI not built. |
| A12 | P3 | Privacy/Terms are drafts and flagged as such | Needs legal review. |

## Not built yet (honestly absent)
Candidate profile tables/CRUD, companies registration UI, jobs/applications/ATS, CV Studio + AI, agency workflow beyond inbox list, admin management, notifications, messaging, storage, sitemap/robots/JobPosting data.

## Addendum — 2026-10-30
- A1/A2/A3/A5/A6: now also part of the old-design Phase A+B build that production serves; the redesign (preview `dpl_4UZzhYpKKMvAXMGHhjJQU7tdetAg`) keeps them.
- New findings fixed during the redesign: violet text contrast 4.09:1 on tinted surfaces → `violet-ink` token (6.1:1); inline links indistinguishable from text → always underlined; header `backdrop-blur` broke `position: fixed` mobile menu → in-flow drawer. axe: 0 violations on 30 loads (local).
- Still OPEN: A4, A7–A12 as above; dashboards not redesigned; migration 0006 not applied.
