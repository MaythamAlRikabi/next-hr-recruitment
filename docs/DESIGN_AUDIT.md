# NEXT 3.0 — Design Audit

Date: 2026-10-30 · Scope: all public routes + role dashboards, Arabic (RTL) and English (LTR), 360–1440 px.
Method: Playwright screenshots of the Phase A+B design (`screenshots/before/`), source review, axe, Lighthouse, link audit.
"Before" = the build served by the production alias at the start of NEXT 3.0 (light hero, flat white page header, one shared blue).
"After" = current local build (`screenshots/after/`). Neither "after" nor the code is deployed yet.

## 1. Design problems (what a visitor sees)

| # | Problem | Evidence | Fix in V3 |
|---|---------|----------|-----------|
| D1 | Hero was a pale gradient with the same weight as every other section — no focal point, no drama, looked like a template | `before/*-home.png` | Midnight hero (`.bg-midnight-glow`), white `.t-display` headline, native product composition (job card, match ring, resume, pipeline) |
| D2 | Three main service cards sat in their own section below the hero; the first screen ended in empty space | `before/ar-desktop-home.png` | Cards overlap the hero edge (`-mt-20`), so the first viewport already shows the three journeys |
| D3 | One heading style for everything (`font-extrabold` + size ladders repeated per page); Arabic used the Latin ladder, giving cramped line-height | grep: 25+ ad-hoc heading classes | Type scale `.t-display … .t-label` with RTL overrides (line-height 1.3–1.4, no negative tracking) |
| D4 | Single font family strategy; Arabic headings and Latin headings looked unrelated | `stage2/fonts.png` | Alexandria (AR headings), IBM Plex Sans Arabic (AR body), Plus Jakarta Sans (EN headings), Inter (EN body) |
| D5 | Palette had one blue doing identity, AI, links and fills — no semantic roles | `before/` | Blue = identity, Violet = AI only, Cyan = highlight, Navy = headings/premium sections; semantic success/warning/danger |
| D6 | Navigation was a flat list of 8 links; no way to see candidate or employer services without clicking through | `before/*-home.png` header | Mega menu (4 groups + 3 links) and grouped mobile accordion; unavailable services shown disabled with a badge, never as dead links |
| D7 | Inner pages used a pale header block; the transition from home to inner pages felt like two products | `before/*-jobs.png` | Shared dark `PageHeader` |
| D8 | Dashboards were plain lists in cards: no KPIs, text-only checklist, one-line empty states | source | `KpiCard`, `ProgressBar`, `StepList`, `EmptyState`, `ErrorState`, `Skeleton` |
| D9 | Homepage lacked Verified Companies and split Employer/Candidate CTAs; "Latest jobs" was a static placeholder | source | New sections; Latest jobs and Verified companies read the database and fall back to honest empty states |

## 2. Operational problems (not design — do not confuse with the above)

| # | Problem | Status |
|---|---------|--------|
| O1 | Migrations 0006–0008 (jobs, applications, talent pool, managed recruitment, storage) are NOT applied: the real database has no `jobs`, `applications`, `candidate_profiles`, `job_listings` tables | BLOCKED by instruction (no migration on production) and by missing Staging |
| O2 | No independent Staging Supabase project: `create_project` and `create_branch` were cancelled at the cost-confirmation step | BLOCKED — needs the owner to create `next-hr-staging` |
| O3 | Supabase Auth Site URL / redirect URLs not configured for the Vercel domain | Needs owner |
| O4 | No Anthropic API key → AI CV Studio cannot call a model | BLOCKED — UI is informational and labelled "coming soon" |
| O5 | Production alias still serves the old Phase A+B build; the V3 build exists only locally until a Preview is deployed | Pending (deployment is token-heavy; done once at the end) |
| O6 | No verified phone/email/Instagram, no domain, legal pages are drafts | Needs owner |

## 3. Accessibility / performance findings (pre-V3 baseline, all fixed before V3 work)

Lighthouse: A11y/Best-Practices/SEO 100; Performance mobile 79–98, desktop 91–100; CLS ≤ 0.063 (fixed: 1 MB favicon, footer CLS, missing canonical).
V3 re-check: axe 0 violations on 44 page loads after fixing one regression introduced by V3 (brand blue `#1261ff` on its own 10 % tint = 4.35:1 → badges now use `brand-hover` `#0a4cd6`). Lighthouse must be re-run on the V3 build (see E2E_TEST_REPORT.md).

## 4. Screens not visually audited

Candidate, Employer, Agency and Admin dashboards, job details, CV upload and application flows require a signed-in session and, for most, tables that do not exist on the real database. They are reviewed from source only. Status: IMPLEMENTED NOT VERIFIED.
