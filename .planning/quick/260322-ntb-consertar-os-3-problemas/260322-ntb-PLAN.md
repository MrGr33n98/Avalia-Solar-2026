# Quick Task Plan: Fix Analytics

## Task 1: Consolidate trackCTAClick & export (P1 & P2)
- **Files:** `AB0-1-front/lib/analytics/consolidated.ts`
- **Action:** Export `trackCTAClick` directly from `consolidated.ts` to solve any "broken references" and ensure standard `track` functions are uniform and accessible.
- **Verify:** Ensure compilation and imports remain intact.

## Task 2: Implement is_internal: true (P3)
- **Files:** `AB0-1-front/lib/analytics/index.ts`
- **Action:** Modify `getAnalyticsContext` to detect `localStorage.getItem('is_internal_team') === 'true'` OR query arg `?internal=1` and set `is_internal: true` so the traffic from the internal team can be filtered out easily in PostHog.
- **Verify:** Check that `is_internal` is appended to the matrix props being sent down to PostHog and the Backend.
