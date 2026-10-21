# SPEC: PWA / Mobile Vertical Density Optimization on `/companies`

## Metadata
- **Feature:** PWA / Mobile Vertical Density Optimization
- **Route:** `/companies`
- **Domain:** Marketplace público
- **Priority:** P1 (UI/UX e densidade visual)
- **Status:** Approved / In Progress
- **Target Devices:** Mobile viewports (320px, 375px, 390px, 430px) preserving Desktop (768px, 1024px, 1500px)

---

## 1. Problem Statement
On mobile screens (`< 768px`), `/companies` suffers from excessive vertical spacing:
1. `py-6` adds 24px top and bottom padding to the main container.
2. `space-y-6` on the main container stacks 24px margins between all blocks.
3. An empty wrapper `<div>` for `BannerByLocation` is always present in the DOM even when no banner is returned, occupying a slot in `space-y-6` and injecting 24px of phantom margin.
4. `ActiveFiltersSummary` has `py-3` (24px total) and is nested inside `space-y-6`, creating a 36px cumulative gap before the heading.
5. Heading to toolbar gap is 16px on mobile.
6. Result count has inherited 24px margins above and below.
7. Mobile filter bar has 24px margin above and 24px margin below.
8. Cards grid has `space-y-6` margin before the first card.

As a result, the first company card starts nearly 400px below the search bar, leaving less than a third of the card visible above the fold on mobile viewports (e.g. iPhone 390px).

---

## 2. Target Design Tokens (Mobile vs Desktop)

| Element | Current (Mobile) | Target (Mobile `< 768px`) | Desktop (`>= 768px`) |
|---|---|---|---|
| Main container padding-top/bottom | `py-6` (24px) | `py-3` (12px) | `md:py-6` (24px) |
| Main container padding-x | `px-4` (16px) | `px-3` (12px) | `sm:px-6 lg:px-8` |
| Section stack gap | `space-y-6` (24px) | `flex flex-col gap-3` (12px) | `md:gap-6` (24px) |
| Empty banner container | Always in DOM (24px slot) | `empty:hidden` (0px when empty) | `empty:hidden` |
| Active filters summary padding | `px-4 py-3 space-y-2` | `px-3 py-2 space-y-1.5` | `md:px-5 md:py-4 md:space-y-3` |
| Heading to controls gap | `gap-4` (16px) | `gap-2` (8px) | `sm:gap-4` (16px) |
| Result count spacing | `-mt-2` inside `space-y-6` (16px) | `-mt-1` inside `gap-3` (8px) | Normal |
| Mobile filter bar container padding | `py-2 px-4` | `py-1.5 px-3` | `hidden md:flex` |
| Filter bar to cards gap | 24px | 10–12px (`gap-3`) | Preserved |
| Cards grid gap | `gap-4` (16px) | `gap-3` (12px) | `sm:gap-4` (16px) |

---

## 3. Invariants & Business Contracts
The following MUST NOT be modified:
1. Rails API contracts (`/api/v1/companies`, `/api/v1/companies/count`).
2. Filter states, query parameters (`state`, `city`, `category_ids`, `sort`, `verified`, etc.).
3. Company ranking algorithm, sorting options, and sponsored placement logic.
4. Data models, serializers, and entitlements (`isPro`, `isVerified`, CTAs).
5. Accessibility touch targets: preserve WCAG 2.2 touch requirements.
6. Desktop layout (`md:` breakpoints and above) must remain visually unchanged.
