# Quick Task Plan: Visibilidade de Funil & Performance (FASE B)

## Task 1: Rastreio de Impressões (`company_card_impression`)
- **File:** `AB0-1-front/components/CompanyCard.tsx`
- **Actions:**
  1. Refactor `cardRef` callback to use local `IntersectionObserver`.
  2. Implement a `useRef` for a timer (`timeoutId`).
  3. Set `threshold: 0.5` (50% visibility).
  4. On intersection: Start a 1000ms timer.
  5. If still visible after 1000ms, fire `track('company_card_impression', ...)`.
  6. On exit: Clear the timer.

## Task 2: Normalização de `page_type`
- **File:** `AB0-1-front/components/PostHogProvider.tsx`
- **Actions:**
  1. Add a helper `getPageType(pathname)` to identify page roles.
  2. Include `page_type` in the metadata of the `$pageview` capture.

## Task 3: Core Web Vitals (Performance)
- **File:** `AB0-1-front/components/PostHogProvider.tsx`
- **Actions:**
  1. Create a sub-component `WebVitals` that uses `useReportWebVitals` from `next/navigation` (Next.js 14+).
  2. Map metrics (LCP, FID, CLS, FCP, TTFB, INP) to PostHog events via `posthog.capture()`.
  3. Include the component inside `PostHogProvider`.
