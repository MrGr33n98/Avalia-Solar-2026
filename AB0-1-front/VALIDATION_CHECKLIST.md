# Performance Optimization - Validation Checklist

**Data:** 2026-02-05  
**PR:** Performance optimization - Bundle reduction + Web Vitals  

---

## ✅ PRE-MERGE VALIDATION

### 1. Build Validation
```bash
# Clean build
npm run clean:next
npm ci
npm run build
```

**Checklist:**
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint critical errors
- [ ] `.next/standalone` directory created

---

### 2. Bundle Analysis
```bash
npm run analyze
```

**Checklist:**
- [ ] `client.html` opens successfully
- [ ] `edge.html` opens successfully  
- [ ] `nodejs.html` opens successfully

**Manual Verification (client.html):**
- [ ] Search for "mixpanel-browser" → Should NOT be in initial chunks
- [ ] Search for "framer-motion" → Should NOT be in layout/main chunks (ok in lazy chunks)
- [ ] Initial bundle size < 250KB gzipped
- [ ] Layout chunk count reduced (target: < 14 chunks)

**Manual Verification (edge.html):**
- [ ] Middleware bundle < 50KB
- [ ] No "ua-parser-js" present
- [ ] No "@opentelemetry" present

---

### 3. Type Check
```bash
npx tsc --noEmit
```

**Checklist:**
- [ ] No type errors in `components/WebVitalsReporter.tsx`
- [ ] No type errors in modified files
- [ ] `useReportWebVitals` properly imported from 'next/web-vitals'

---

### 4. Lint Check
```bash
npm run lint
```

**Checklist:**
- [ ] No critical lint errors
- [ ] Unused imports removed
- [ ] Console.logs only in development mode

---

## 🧪 POST-DEPLOY VALIDATION (STAGING)

### 5. Homepage Functionality
```
URL: http://localhost:3000 (or staging URL)
```

**Checklist:**
- [ ] Homepage loads without errors
- [ ] Hero image loads correctly
- [ ] "How It Works" section renders
- [ ] Savings Calculator renders
- [ ] Slider in calculator works smoothly
- [ ] CSS animations visible (fade-in effect on calculator results)
- [ ] No console errors in browser

---

### 6. Analytics Loading (CRITICAL)

**Test Flow:**
1. Open DevTools → Network tab
2. Load homepage
3. Wait 5 seconds without interaction
4. Accept cookie consent

**Checklist:**
- [ ] No Mixpanel requests BEFORE 5s timeout
- [ ] No Mixpanel requests BEFORE cookie consent
- [ ] Mixpanel requests appear AFTER 5s + consent
- [ ] GA4/GTM loads correctly
- [ ] `track()` calls work (check Mixpanel debugger)

**DevTools Console Check:**
- [ ] See: `[Analytics] Lazy init triggered (timeout)` after 5s
- [ ] See: `[Analytics] Mixpanel initialized` after consent
- [ ] See: `[Analytics] GA4 initialized`

---

### 7. Web Vitals Tracking (NEW)

**Test Flow:**
1. Open DevTools → Console
2. Enable verbose logging
3. Navigate to homepage
4. Wait for page to fully load

**Checklist:**
- [ ] Console shows: `[WebVitals] LCP: {...}` (dev mode)
- [ ] Console shows: `[WebVitals] CLS: {...}` (dev mode)
- [ ] Console shows: `[WebVitals] INP: {...}` (dev mode)
- [ ] Console shows: `[WebVitals] FCP: {...}` (dev mode)
- [ ] Console shows: `[WebVitals] TTFB: {...}` (dev mode)

**Network Tab Check:**
- [ ] POST request to `/api/v1/analytics/web-vitals` visible
- [ ] Request uses `sendBeacon` (check request headers)
- [ ] Payload contains: name, value, rating, id, url

**Analytics Check (after consent):**
- [ ] Mixpanel event `web_vital` appears
- [ ] Event properties include: metric_name, metric_value, metric_rating

---

### 8. Authentication Flow
```
Test: Login/Register
```

**Checklist:**
- [ ] `/login` page loads
- [ ] Login form works
- [ ] OAuth (Google/LinkedIn) works if configured
- [ ] Better Auth route handler works (no 500 errors)
- [ ] JWT cookie is set correctly
- [ ] Protected routes redirect properly

---

### 9. Dashboard (Lazy Loading)

**Test Flow:**
1. Login as company user
2. Navigate to `/dashboard` or `/company-dashboard`

**Checklist:**
- [ ] Dashboard loads without errors
- [ ] Sidebar renders
- [ ] OverviewTab loads
- [ ] Click "Analytics" tab
- [ ] `AdvancedAnalytics` component loads (lazy)
- [ ] Recharts loads correctly (charts visible)
- [ ] Framer Motion animations work in charts
- [ ] No bundle bloat on dashboard (this is ok - protected area)

---

### 10. Categories & Companies Pages

**Test Flow:**
1. Navigate to `/categories`
2. Click on a category
3. Navigate to `/companies`
4. Click on a company

**Checklist:**
- [ ] `/categories` page loads quickly
- [ ] Category detail pages load
- [ ] Company list loads
- [ ] Company detail page loads
- [ ] Images load correctly
- [ ] No framer-motion imports on these pages

---

## 🚀 PERFORMANCE VALIDATION

### 11. Lighthouse Audit (3 Runs)

```bash
npm run start
# In another terminal:
npx lighthouse http://localhost:3000 --view --preset=desktop --output=html --output-path=./lighthouse-run1.html
npx lighthouse http://localhost:3000 --view --preset=desktop --output=html --output-path=./lighthouse-run2.html
npx lighthouse http://localhost:3000 --view --preset=desktop --output=html --output-path=./lighthouse-run3.html
```

**Target Scores (Average of 3 runs):**
- [ ] Performance Score >= 85
- [ ] LCP <= 2.5s (target: 1.8s)
- [ ] CLS <= 0.1
- [ ] TBT <= 300ms
- [ ] FCP <= 1.8s
- [ ] Speed Index <= 3.0s

**Compare with Baseline:**
| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| LCP    | ___s   | ___s  | ___   |
| CLS    | ___    | ___   | ___   |
| TBT    | ___ms  | ___ms | ___   |
| FCP    | ___s   | ___s  | ___   |

---

### 12. Real User Monitoring (48h post-deploy)

**Mixpanel Check:**
- [ ] Query: `event = 'web_vital'` returns data
- [ ] LCP P75 < 2.5s
- [ ] INP P75 < 200ms
- [ ] CLS P75 < 0.1

**GA4 Check:**
- [ ] Core Web Vitals report shows data
- [ ] LCP field data available
- [ ] CLS field data available

**Sentry Check:**
- [ ] Performance transactions show up
- [ ] No increase in error rate
- [ ] LCP traces visible

---

## 🔒 REGRESSION CHECKS

### 13. LGPD Compliance

**Checklist:**
- [ ] Cookie consent modal appears on first visit
- [ ] Analytics do NOT load before consent
- [ ] Mixpanel respects opt-out
- [ ] GA4 consent mode works (check dataLayer)

---

### 14. Error Tracking

**Checklist:**
- [ ] Sentry still captures errors
- [ ] Error boundary works
- [ ] Sentry breadcrumbs include analytics events
- [ ] No increase in client-side errors

---

### 15. SEO & Metadata

**Checklist:**
- [ ] Meta tags still present
- [ ] OpenGraph tags work
- [ ] JSON-LD structured data intact
- [ ] Sitemap.xml accessible
- [ ] Robots.txt unchanged

---

## 📊 BUNDLE SIZE COMPARISON

### Before Optimization (Baseline)
```
Initial JS:        ~300KB gzipped
Layout Chunks:     16+ chunks
Mixpanel:          ✅ In initial bundle
Framer Motion:     ✅ In home bundle
Preconnects:       7 domains
Web Vitals:        ❌ Not instrumented
```

### After Optimization (Target)
```
Initial JS:        ~220KB gzipped (-27%)
Layout Chunks:     ~14 chunks (-2)
Mixpanel:          ❌ Lazy loaded after 5s
Framer Motion:     ❌ CSS animations on home
Preconnects:       5 domains (-2)
Web Vitals:        ✅ Fully instrumented
```

### Actual Results (FILL AFTER ANALYZE)
```
Initial JS:        ___KB gzipped (___%)
Layout Chunks:     ___ chunks
Mixpanel:          [ ] Not in initial
Framer Motion:     [ ] Not in home bundle
Preconnects:       ___ domains
Web Vitals:        [ ] Instrumented
```

---

## ✅ APPROVAL CHECKLIST

- [ ] All Pre-Merge validations passed
- [ ] Bundle analysis confirms optimizations
- [ ] Lighthouse scores improved
- [ ] No regressions in functionality
- [ ] Analytics still working (LGPD compliant)
- [ ] Web Vitals data flowing to backend
- [ ] Tech Lead reviewed PR
- [ ] `PERFORMANCE_OPTIMIZATION_PR.md` attached to PR
- [ ] `performance.kpi.md` updated with results

---

## 🚨 ROLLBACK CRITERIA

**If any of these occur, consider rollback:**
- [ ] Analytics completely broken (no events)
- [ ] Authentication fails
- [ ] Homepage doesn't load
- [ ] Lighthouse performance score DECREASED
- [ ] Critical business flow broken (quote/lead submission)
- [ ] LGPD compliance broken (analytics load before consent)

---

## 📝 VALIDATION SIGN-OFF

**Validated by:** _________________________  
**Date:** _________________________  
**Environment:** [ ] Local [ ] Staging [ ] Production  

**Results:**
- Pre-Merge: [ ] PASS [ ] FAIL
- Post-Deploy: [ ] PASS [ ] FAIL  
- Performance: [ ] IMPROVED [ ] NEUTRAL [ ] REGRESSED

**Notes:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

**Generated:** 2026-02-05 17:35 UTC  
**Version:** 1.0
