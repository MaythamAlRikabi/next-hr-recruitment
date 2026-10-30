# NEXT Design System V3

Source of truth: `src/app/globals.css` (`:root` + `@theme inline`). Components consume tokens through Tailwind utilities (`bg-brand`, `text-midnight`, …) — no hard-coded hex in components except gradients defined in CSS.

## 1. Decision record
Stage 2 compared three homepage directions with real screenshots (`screenshots/stage2/dir_*`): **A Spotlight** (light, too close to the previous design), **B Midnight** (dark hero, white product cards, cyan/violet glow), **C Cobalt** (flat saturated gradient, mock-up readability issues). **B was chosen**: strongest contrast, premium tech feel, readable on 390 px, and the logo stays on the white header.
Font comparison (`stage2/fonts.png`): Alexandria / IBM Plex Sans Arabic / Tajawal for Arabic; Plus Jakarta Sans / Inter for English. **Chosen**: Alexandria (AR headings), IBM Plex Sans Arabic (AR body), Plus Jakarta Sans (EN headings), Inter Variable (EN body). Tajawal was evaluated only and has been removed from dependencies.

## 2. Colour tokens
| Role | Token | Value | Use |
|------|-------|-------|-----|
| Primary | `--next-blue` | #1261FF | identity, primary buttons, links |
| Primary hover / press | `-hover` / `-press` | #0A4CD6 / #083BA8 | states; **also text on tinted blue** (contrast) |
| Secondary / premium | `--next-navy` `midnight` | #0A1733 | headings, dark sections |
| Highlight | `--next-cyan` | #00BEEB | accents on dark, highlights |
| AI | `--next-violet` (ink #5B30DD) | #7548F8 | AI features only |
| Surface | `--next-surface` | #F6F9FF | soft backgrounds |
| Text / muted | | #14213A / #4A5A74 | |
| Border | | #D9E4F6 | |
| Disabled | | #A7B3C7 | |
| Focus | `:focus-visible` | 3 px #1261FF outline, 3 px offset | |
| Success | `--next-success` (ink #05714F) | #07996B | |
| Warning | (ink #8A4A06) | #F59E0B | |
| Error | (ink #B42318) | #E5392D | |
Rule: *text* uses the "ink" variants; the bright values are for fills/icons. #1261FF text on its own 10 % tint is 4.35:1 and fails AA, hence `badgeBrand` uses `brand-hover`.

## 3. Typography (`.t-*` classes, RTL overrides included)
Display (clamp 36–60 px) · H1 (30–48) · H2 (24–36) · H3 20 · H4 17 · Body-lg 18 · Body 16 · Caption 13 · Button 14 semibold · Label 14 medium. Arabic: weight 700 max, line-height 1.3–1.4, letter-spacing 0.

## 4. Layout
12-column mental grid via Tailwind grid; container `max-w-6xl` (header `max-w-7xl`) with 16 px gutters; 8-pt spacing; radii `--radius-sm..xl` (xl = 2rem for hero panels); shadows `card / lift / float`.

## 5. Motion & accessibility
Float/rise animations ≤ 8 px, disabled under `prefers-reduced-motion`. All interactive targets ≥ 44 px (`min-h-11/12`). State is never colour-only (icons + text in `StepList`, badges). Landmarks: header nav `aria-label="Primary"`, mobile nav `aria-label="Mobile"`, search `role="search"`.
WCAG 2.2 AA evidence: axe 0 violations on 44 page loads (AR/EN, 390 px) on the V3 build. Manual keyboard + screen-reader testing: NOT DONE.
