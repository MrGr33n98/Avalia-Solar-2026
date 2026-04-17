# 🎯 Category Page v2 — Dev Team Checklist (Sprint 1)

**Status:** 70% Complete (6/8 Stories)  
**Owner:** @dev-team  
**Review Date:** 2026-02-27

---

## ✅ Code Review Checklist

### Style & Conventions
- [ ] All components use TypeScript (no `any` types)
- [ ] Props interfaces properly defined
- [ ] No console.log() or debug statements left
- [ ] Naming conventions: PascalCase components, camelCase functions
- [ ] Imports organized (React, external, local)
- [ ] No unused imports

### Components Review

#### CategoryHero.tsx
- [ ] H1 is only semantic heading
- [ ] Prova social metrics display correctly
- [ ] Both CTAs functional (check onClick props)
- [ ] Responsive: stacks on mobile
- [ ] Lighthouse audit passes (performance)

#### DecisionChips.tsx
- [ ] Chips toggle on/off correctly
- [ ] Badge styling clear (active vs inactive)
- [ ] Remove button works when active
- [ ] Mobile scroll works (flex-wrap)
- [ ] Accessibility: all chips focusable (keyboard nav)

#### CompanyCardV2.tsx
- [ ] Image: 1:1 aspect ratio
- [ ] Card height: 160px (check with DevTools)
- [ ] Verified badge appears when true
- [ ] Rating displays with star icon
- [ ] aria-label implemented
- [ ] Hover effect works (shadow/lift)
- [ ] Variant support: compact + rich (check rendering)
- [ ] Error image fallback (Building2 icon)

#### LeadCTA.tsx
- [ ] FREE company: shows "Solicitar Orçamento"
- [ ] PAID company: shows "Falar com a Empresa" + link
- [ ] onClick tracking implemented
- [ ] aria-label on both CTAs
- [ ] Link opens in new tab (target="_blank")
- [ ] Fallback: URL empty → uses FREE behavior

#### CompaniesGrid.tsx
- [ ] Grid layout: 1/2/3 responsive
- [ ] Skeletons show while loading
- [ ] Empty state message
- [ ] No console errors when array empty
- [ ] Cards render correctly

#### CategoryFilterSidebar.tsx
- [ ] Sidebar hidden on mobile (lg:hidden)
- [ ] Sticky position works
- [ ] All filters functional (checkbox, slider, select)
- [ ] Clear filters button
- [ ] Accessible form controls

#### CategoryPageClientV2.tsx
- [ ] Page composition correct (Hero → Chips → Grid)
- [ ] State management (filters, search, sort)
- [ ] Toolbar sticky works
- [ ] Search input works in real-time
- [ ] Sort dropdown functional
- [ ] Filter count updates
- [ ] Analytics events fire (check console or Dev Tools)

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] LeadCTA: FREE vs PAID logic
- [ ] CompaniesGrid: empty state + skeleton
- [ ] DecisionChips: toggle/remove
- [ ] Search filter: string matching (case-insensitive)

### E2E Tests (Playwright)
- [ ] Load page → hero visible
- [ ] Click quick filter chip → grid updates
- [ ] Type in search → grid filters
- [ ] Click company card → lead modal/link opens
- [ ] Fill lead form → submit → success
- [ ] Mobile: test on 375px viewport
- [ ] Tablet: test on 768px viewport
- [ ] Desktop: test on 1200px viewport

### Accessibility Tests
- [ ] Run axe-core scan (0 violations)
- [ ] Keyboard navigation: Tab through all CTAs
- [ ] Screen reader: test with NVDA (Windows)
- [ ] Contrast: use Color Contrast Analyzer
- [ ] WCAG AAA: all elements compliant

### Performance Tests
- [ ] Lighthouse: Desktop >= 90
- [ ] Lighthouse: Mobile >= 80
- [ ] Bundle delta: +0KB (no bloat)
- [ ] Images: lazy loading working
- [ ] Prefetch: above-the-fold cards

---

## 📋 Code Quality Checklist

### TypeScript
```bash
npm run typecheck
# Expected: ✅ No errors
```

- [ ] No TypeScript errors
- [ ] All props typed (no implicit any)
- [ ] Return types explicit
- [ ] Generics used correctly

### Linting
```bash
npm run lint -- --fix
# Expected: ✅ No warnings
```

- [ ] No ESLint warnings
- [ ] No unused variables
- [ ] Consistent formatting
- [ ] Imports sorted

### Testing
```bash
npm run test
# Expected: ✅ All tests pass
```

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Coverage >= 80%
- [ ] No flaky tests

### Build
```bash
npm run build
# Expected: ✅ Build successful
```

- [ ] Production build succeeds
- [ ] No build warnings
- [ ] Output size acceptable
- [ ] Sourcemaps generated

---

## 🎨 Design Review Checklist

### Visual Design
- [ ] Card height: 160px ✓
- [ ] Image aspect ratio: 1:1 ✓
- [ ] Colors match design system
- [ ] Typography: font sizes correct
- [ ] Spacing: padding/margin consistent
- [ ] Buttons: states (default/hover/active)
- [ ] Badges: styling matches spec

### Responsive Design
- [ ] Mobile (375px): single column, full width
- [ ] Tablet (768px): 2 columns
- [ ] Desktop (1200px): 3 columns + sidebar
- [ ] No horizontal scroll
- [ ] Touch targets: >= 44px (mobile)
- [ ] Breakpoints correct (sm/md/lg)

### Interactions
- [ ] Hover effects smooth
- [ ] Click feedback immediate
- [ ] Loading states visible
- [ ] Error states shown
- [ ] Success states confirmed

---

## 🔗 Integration Checklist

### API Integration
- [ ] Backend returns required fields:
  - [ ] id, name, logo_url, rating, rating_count
  - [ ] verified, segment, direct_lead_enabled, direct_lead_url
- [ ] Error handling implemented
- [ ] Loading states show
- [ ] Empty state message
- [ ] Timeout handling

### Analytics Integration
- [ ] Track events implemented:
  - [ ] category_page_view
  - [ ] quick_filter_click
  - [ ] company_card_click
  - [ ] lead_open_internal
  - [ ] lead_click_direct
- [ ] Events fire correctly (check Network tab)
- [ ] Event data complete (required fields)

### Routing
- [ ] URL params persist state
- [ ] Back button works
- [ ] Deep links work
- [ ] Canonical tags present

---

## 🚀 Deployment Checklist

### Pre-Production
- [ ] All code reviewed
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Performance audit passed
- [ ] Accessibility audit passed

### Staging Deploy
- [ ] Deploy to staging env
- [ ] Smoke test on staging
- [ ] QA validation
- [ ] Performance baseline measured
- [ ] Analytics validation
- [ ] Rollback plan documented

### Production Deploy
- [ ] All staging tests passed
- [ ] Monitoring setup
- [ ] Alerting configured
- [ ] Analytics dashboard ready
- [ ] Rollback plan ready
- [ ] Team notified

---

## 📊 Metrics to Track

Post-Deploy Monitoring:

```json
{
  "discovery": {
    "cards_visible_before": 2-3,
    "cards_visible_after": 6-8,
    "target": "+200%"
  },
  "performance": {
    "lighthouse_before": 85,
    "lighthouse_after": 92,
    "target": "+7 points"
  },
  "accessibility": {
    "wcag_before": "AA",
    "wcag_after": "AAA",
    "target": "AAA compliant"
  },
  "conversion": {
    "lead_modal_ctr": 3%,
    "lead_submit_rate": 20%,
    "target": "establish baseline"
  }
}
```

---

## 👥 Sign-Off

- [ ] **Dev:** Code review complete
- [ ] **QA:** Testing complete  
- [ ] **Tech Lead:** Architecture approved
- [ ] **Designer:** Design validated
- [ ] **PO:** Requirements met

---

## 📞 Questions?

- **Component Question:** Check CATEGORY_PAGE_V2_IMPLEMENTATION_PLAN.md
- **Story Details:** Check CATEGORY_PAGE_V2_STORIES.md
- **Testing Help:** Check STORY_VALIDATION_CHECKLIST.md
- **Deployment:** Check IMPLEMENTATION_SUMMARY.md

---

**Status:** Ready for QA Handoff  
**Next Phase:** Finish Sprint 1 (API + cleanup) → QA Testing → Sprint 2

---
