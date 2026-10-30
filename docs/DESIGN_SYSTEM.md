# Design system — NEXT | HR & Recruitment

Source of truth: `src/app/globals.css` (tokens) and `src/components/ui/styles.ts` (class recipes). Status: **DONE & TESTED** for the homepage, /jobs, header, footer, auth screens (visual review + axe, see QA_REPORT). **IMPLEMENTED NOT VERIFIED** for dashboards (they inherit tokens but were not redesigned or reviewed).

## Palette
| Token | Value | Use |
|---|---|---|
| `--next-blue` (brand) | #145BFF | Primary actions, links, focus ring |
| `--next-blue-hover` | #0B47D6 | Primary hover |
| `--next-navy` | #124B89 | Corporate accents, HR service tiles |
| `--next-midnight` | #0D1B3A | Headings, strong text |
| `--next-cyan` | #00C7F7 | Innovation accent. Text on it is Midnight, never white |
| `--next-violet` | #7754FF | AI tools only (CV Studio) |
| `--next-violet-ink` | #5A35E0 | Violet text on tinted surfaces |
| `--next-surface` | #F3F7FF | Alternating section background |
| `--next-border` | #DBE5F5 | Borders |
| `--next-muted` | #52627A | Secondary text |
| success / warning / danger | #12B76A / #F5A524 / #F04438 | Fills. Text uses the darker `*-ink` variants (#067647 / #93370D / #B42318) |

## Gradients (used selectively)
- Primary `135deg #145BFF → #00C7F7`: icon tiles, hero backdrop accents.
- AI `135deg #145BFF → #7754FF`: CV Studio block and AI buttons only.
- Hero `120deg #145BFF → #3B82FF → #00C7F7`: hero visual, thin footer rule, soft page-header glow.
- Gradient text is not used where it would fail contrast.

## Contrast (computed, WCAG 2.x)
| Pair | Ratio |
|---|---|
| White on Electric Blue | 5.29 |
| White on Blue hover | 7.28 |
| Midnight on white | 17.0 |
| Muted on white / on surface | 6.20 / 5.78 |
| White on Violet | 4.67 |
| Violet-ink on violet tint | 6.10 (plain Violet on tint was 4.09 and failed; fixed) |
| Midnight on Cyan | 8.51 (white on Cyan is 2.0 and is not allowed) |
| Success / danger / warning ink on white | 5.69 / 6.57 / 7.52 |

## Typography
Inter Variable (Latin) and IBM Plex Sans Arabic (Arabic), self-hosted through `@fontsource`. RTL headings have no negative tracking. `text-wrap: balance` on h1–h3.

## Components (class recipes)
`inputCls` (min-h 44px), `btnPrimary`, `btnSecondary`, `btnAi`, `btnOnDark`, `btnGhostOnDark`, `cardCls` + `cardHover`, badges (brand, violet, success, warning). Page chrome: `PageHeader`, `Section`, `StatusNote`.

## Rules
- The official logo is never recoloured and always sits on white.
- Touch targets are at least 44px on mobile. Focus ring is a 3px Electric Blue outline.
- Motion is subtle (float, rise) and disabled under `prefers-reduced-motion`.
- No fake logos, companies, statistics or illegible text inside images. Illustrations are native elements with `aria-hidden`.
- Inline links inside running text are always underlined (axe `link-in-text-block`).
