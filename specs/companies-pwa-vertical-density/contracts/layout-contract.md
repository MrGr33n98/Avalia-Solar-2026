# Layout Quality Contract: PWA Mobile Companies Page

## Quality Gates (G01 to G10)

| Gate | Acceptance Criteria | Target Metric |
|---|---|---|
| **G01** | First company card positioned significantly higher | First card ~80–120px higher on 390px viewport |
| **G02** | No residual space when `companies_top` banner is absent | 0px height & 0px gap reserved for empty banner wrapper |
| **G03** | Active filters summary positioned compactly below search | Padding reduced to `py-2 px-3`, chips compact |
| **G04** | Heading, subtitle, and sorting toolbar compact on mobile | Heading gap to controls reduced to `gap-2` (8px) |
| **G05** | Results counter placed close to mobile filter bar | Distance <= 8px |
| **G06** | Mobile filter bar placed close to first card | Distance 10–12px (`gap-3`) |
| **G07** | Zero overlapping elements or clipped text on mobile viewports | Verified across 320px, 375px, 390px, 430px |
| **G08** | Touch targets preserved for accessibility | Buttons maintain accessible touch targets |
| **G09** | Desktop layout visually unchanged | At `md:` (768px+), layout retains original spacing |
| **G10** | Business logic, SEO, and analytics intact | Zero breaking changes to API, query params, tracking |

## Measurement Protocol
Benchmark on `/companies?state=RJ`:
- Viewport: 390px × 844px.
- Scenario: 1 active filter (`state=RJ`), no banner, view mode grid.
- Metric: Distance from bottom edge of sticky search bar to top edge of first company card (`getBoundingClientRect().top`).
- Baseline: ~390–420 CSS px.
- Target: <= 300–320 CSS px (reduction of 80–120 CSS px).
