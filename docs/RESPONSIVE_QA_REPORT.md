# Responsive QA Report — V3 build (local production build, `next start`)

Date 2026-10-30. Tool: Playwright (Chromium).
Matrix executed by `shots.js`: widths **360, 390, 430, 768, 1024, 1280, 1440** × locales **AR, EN** × 10 public pages
(`/`, `/jobs`, `/login`, `/register`, `/services`, `/cv-builder`, `/executive-search`, `/insights`, `/submit-cv`, `/services/permanent-recruitment`)
= 140 page loads. Checks: horizontal overflow (`scrollWidth > innerWidth`), uncaught page errors, console errors.

| Result | Status |
|--------|--------|
| Horizontal overflow | **none** on any of the 140 loads — DONE & TESTED |
| Page/console errors | none (the only 404 console line is the intentional `/does-not-exist` probe) |
| Header at 1280 px, AR and EN (mega menu, 4 groups + 2 links + auth) | no overflow after merging Insights/About/Contact into one group — DONE & TESTED |
| Mobile menu 390 px: open, expand group, Escape closes, link navigates and closes | DONE & TESTED (AR and EN) |
| Mega menu: click toggles `aria-expanded`, Escape closes | DONE & TESTED |
| Visual review | home AR 1440, home EN 390, menus reviewed by eye; the other 100+ screenshots are stored in `screenshots/after/` but were **not** all individually inspected |
| Auth-gated screens (candidate/employer/agency/admin) | NOT VERIFIED — need a signed-in session on a database with migrations |
| Real devices / iOS Safari / Android Chrome | NOT TESTED (Chromium emulation only) |

Issues found and fixed during this pass: header labels wrapped onto two lines at 1280 px; English header overflowed by 95 px; brand-on-tint badge contrast 4.35:1.
