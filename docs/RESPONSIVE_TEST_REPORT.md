# Responsive test report (2026-10-30)

**Status: DONE & TESTED (local production build, `next start`, Chromium via Playwright). NOT run against the deployed preview or production.**

Method: `scratchpad/shots.js` loads each page at each width in both locales and records horizontal overflow, console errors and a screenshot.

- Widths: 360, 390, 430, 768, 1024, 1440 px
- Locales: Arabic (RTL, default) and English (LTR)
- Pages: `/`, `/jobs`, `/login`, `/register`, `/services`, `/cv-builder`
- Total: 6 × 2 × 6 = **72 page loads**

## Result
| Check | Result |
|---|---|
| Horizontal overflow | none in 72/72 loads |
| Console errors | none in 72/72 loads |
| Mobile menu (ar + en) | opens, nav in viewport, Escape closes, link navigates, closes after navigation |
| axe-core (WCAG A/AA rules) | 0 violations across 15 pages × 2 locales = 30 loads (after the `violet-ink` and underlined-link fixes) |

## Screenshots kept in the repo (`docs/screenshots/`)
ar/en home at 390 and 1440, ar login 390, en jobs 1440, ar cv-builder 390, mobile menu ar/en.

## Not covered
- Real devices and Safari/Firefox (Chromium only).
- Signed-in dashboards (candidate/employer/admin) were not redesigned or screenshotted.
- No visual-regression baseline is committed; the Playwright scripts are ad-hoc, not a committed suite.
- Lighthouse performance run: NOT STARTED.

## Update 2026-10-30

Re-run after the expansion: 10 pages × 7 widths (incl. 360/390/430/768/1024/1440) = 140 loads on the local production build; no horizontal overflow, no console errors; axe 0 violations on 40 loads. Navigation is inline from 1280px and a hamburger drawer below. Not re-run against the Vercel preview (same code, different host). Mobile Safari/real devices not tested.
