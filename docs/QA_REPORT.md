# QA report (updated 2026-10-30)

Environment: local production build (`next start`), Chromium/Playwright. Nothing below was run against real Supabase auth or against production.

| Area | Label | Evidence |
|---|---|---|
| Type check / lint / build | DONE & TESTED (local) | `tsc` clean, `eslint` clean, `next build` success |
| Public routes | DONE & TESTED (local) | 16 public routes 200; unknown path 404; protected routes 307 → `/login?next=…` when signed out |
| Earlier layout sweep | DONE & TESTED (local) | 17 routes × {375, 1280} × {ar, en} = 68 checks, no overflow/console errors |
| Redesign responsive sweep | DONE & TESTED (local) | 72 loads (6 widths × ar/en × 6 pages): no overflow, no console errors — see RESPONSIVE_TEST_REPORT |
| Mobile menu | DONE & TESTED (local) | ar + en: opens, in viewport, Escape closes, link navigates and closes |
| Accessibility (axe-core) | DONE & TESTED (local) | 0 violations on 15 pages × 2 locales (30 loads) after fixing violet text contrast (4.09 → 6.1:1) and inline-link distinction. Automated rules only; no manual screen-reader pass. |
| Forms | DONE & TESTED (local) | field-level validation; generic login failure; `next=//evil.com` not followed |
| RLS (SQL) | DONE & TESTED (scratch DB) | 64/64 — see RLS_TEST_REPORT |
| Redesigned preview | IMPLEMENTED, smoke-checked | `dpl_4UZzhYpKKMvAXMGHhjJQU7tdetAg` READY; `/` and `/login` fetched (200) |
| Real signup / email confirmation / reset | NOT VERIFIED | sandbox cannot reach Supabase; Auth URL config is still the owner's step |
| Signed-in dashboards | IMPLEMENTED (minimal), NOT redesigned, NOT VERIFIED | |
| Jobs / apply / ATS UI | NOT STARTED (schema drafted only) | blocked on migration approval |
| AI CV Studio | NOT STARTED | needs an Anthropic API key |
| Lighthouse / perf | NOT STARTED | |
| Committed automated test suite | NOT STARTED | scripts are ad-hoc |

## Update 2026-10-30 — expansion QA

| Check | Result | Scope |
|---|---|---|
| `tsc --noEmit`, `eslint`, `next build` | clean | local |
| axe (WCAG 2.2 AA tags) | 0 violations on 40 page loads | local build, ar/en |
| Responsive sweep | 140 loads (10 pages × 7 widths), no horizontal overflow, no console errors | local build |
| Preview smoke (dpl_ER7Wuh…) | 200 + expected Arabic copy on 5 pages; no runtime errors (1h) | preview, Arabic only |
| RLS scratch tests | rls_jobs 32/32, rls_agency 78/78 | scratch PostgreSQL, stubbed auth |
| E2E (4 journeys + isolation) | **NOT STARTED** | — |
| Lighthouse / CSP / CI | **NOT STARTED** | — |
| Real Supabase auth, signed-in dashboards | **NOT VERIFIED** | — |

## Update 2026-10-30 (local production build; no backend flows)
| Check | Result |
|---|---|
| `tsc --noEmit`, `eslint src`, `next build` | clean |
| Route/link/form audit, ar + en, 78 page loads, 59 unique links, private routes redirect when signed out | 0 problems (only the expected 404 test route) |
| Responsive sweep 360/390/430/768/1024/1280/1440, ar + en, 10 pages | no horizontal overflow; 0 console errors |
| axe-core WCAG 2.0/2.1 A+AA, 22 pages x 2 languages (44 loads) + mobile menu keyboard test | 0 violations; menu opens/closes/Escape OK |
| Lighthouse (after fixes) mobile / desktop, home, jobs, executive-search, submit-cv, ar + en | Accessibility 100, Best-practices 100, SEO 100 everywhere; Performance mobile 79-98, desktop 91-100; CLS <= 0.063 |
Fixes from Lighthouse: favicon was the 1 MB original (now 48 px copy of the same mark; original logo files untouched), footer layout shift (loading fallback min-height), missing canonical (added).
Not run: E2E journeys (register, post job, apply, upload CV, managed request) and cross-role isolation with real sessions - there is no Staging backend. Label: **IMPLEMENTED NOT VERIFIED** for every operational flow.
