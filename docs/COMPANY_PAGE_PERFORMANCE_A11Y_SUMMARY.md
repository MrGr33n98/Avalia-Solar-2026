# 🚀 Company Page — Performance & Accessibility Fixes (Sprint 1)

**Date:** 2026-03-23  
**Status:** ✅ **COMPLETED**  
**Objective:** Improve Lighthouse scores for Performance and Accessibility on company detail pages.

---

## ✅ Completed Adjustments

### 1. Performance (TTFB & LCP)
- **ISR (Incremental Static Regeneration):** Enabled 60s revalidation in `app/companies/[id]/page.tsx`. This addresses the severe server latency (TTFB) previously reported at ~1.4s.
- **LCP Optimization:** Added `priority` attribute to the company logo in `CompanyHero.tsx` to ensure it's one of the first elements loaded.
- **Main Thread Optimization:** Memoized `usePageTracking` options in `CompanyDetailClient.tsx` using `useMemo`. This prevents redundant GTM/PostHog initializations during re-renders, reducing Total Blocking Time (TBT).

### 2. Accessibility (WCAG AA Compliance)
- **Contrast Fixes:** Updated text colors from `slate-500` (or `muted-foreground`) to `text-slate-600` in the following components:
  - `CompanyHero.tsx` (Subtitles and decorative text)
  - `CompanySidebar.tsx` (Labels for Phone, Website, Location, Email, and Business Hours)
  - `CompanyReviews.tsx` (Review counts and secondary descriptions)
  - `CompanyOverview.tsx` (Empty states and descriptive labels)
- **ARIA & Semantic HTML:**
  - Added `role="img"` and descriptive `aria-label` to star ratings in `RatingStars.tsx` and `SocialProof.tsx`.
  - Added `role="img"` and `aria-label` to the "Empresa Verificada" badge in `CompanyHero.tsx`.
  - Removed prohibited ARIA attributes on non-widget elements by defining appropriate roles.

### 3. Build & Stability
- **Fixed Bundling Error:** Resolved a critical build error related to OpenTelemetry and `require-in-the-middle`.
- **Solution:** Marked problematic packages as external in `next.config.js` using `experimental.serverComponentsExternalPackages`.

---

## 📊 Expected Impact

| Metric | Before | After (Estimated) | Note |
|--------|--------|-------------------|------|
| Performance | 45 | 80-90+ | TTFB was the primary bottleneck. |
| Accessibility | 94 | 100 | Contrast and ARIA missing were the final points. |
| TTFB | 1.48s | < 200ms | Cache hits will be instant. |
| LCP | 5.9s | < 2.5s | Priority loading and faster server response. |

---

## 🔧 Technical Notes

- **Mobile Tracking:** Session recording remains disabled for mobile devices to preserve bandwidth and CPU (Long Tasks > 195ms). Event tracking is unaffected.
- **Cache Strategy:** The 60s ISR window balances data freshness with speed.

---

**Status:** ✅ **ALL FIXES SHIPPED TO MAIN**
