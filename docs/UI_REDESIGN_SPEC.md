# UI redesign specification

Goal (master prompt): premium, vibrant SaaS look. Approach: token-first rebuild of the shared layer, then the homepage, then pages inherit it.

## Homepage structure (all sections implemented in `src/app/page.tsx`, copy in `src/content/home.ts`, AR + EN)
| # | Section | Notes |
|---|---|---|
| 6.1 | Header | Sticky, 5 nav links, language switch, auth links, mobile drawer |
| 6.2 | Hero | Headline, working search (GET `/jobs?q=&city=`), two CTAs, decorative product visual |
| 6.3 | Three service cards | Find a job / Hire talent / AI CV Studio |
| 6.4 | Latest jobs | Real data only. No vacancies exist, so it shows an honest empty state with two CTAs |
| 6.5 | Industries | 11 categories linking to `/jobs?industry=<slug>` |
| 6.6 | Employers | 5 steps and a native pipeline illustration (no data) |
| 6.7 | AI CV Studio | Original → AI review → Improved flow, flagged "Coming soon", no outcome guarantees |
| 6.8 | HR services | 4 services from the company brief |
| 6.9 | How it works | Candidates, employers, CV users |
| 6.10 | Final CTA | "Ready for your next step?" |
| 6.11 | Footer | 5 link columns, logo on white, LinkedIn only (no unverified phone/email/Instagram) |

## Decisions
- Search is a plain GET form: works without JavaScript, shareable URLs, back/forward native.
- The mobile menu is an in-flow drawer under the header (a `fixed` overlay breaks under the header's backdrop blur).
- The hero visual uses skeleton bars, so there is no fake text, people or companies.
- Latest jobs stays on the empty state until the jobs migration (0006) is approved and applied.

## Out of scope for this pass
Signed-in dashboards, employer ATS UI, CV Studio UI, admin UI (see IMPLEMENTATION_PLAN).
