# Mobile-First Initiative — Metrics Dashboard & OKRs

**Epic:** EPIC-MOBILE-001
**Owner:** Product Owner
**Created:** 2026-03-10
**Review Cadence:** Weekly (Mondays 10am)

---

## North Star Metric

### Mobile Readiness Index (MRI)
**Definition:** Composite score combining MFRI technical score + business metrics

**Formula:**
```
MRI = (MFRI_normalized × 0.3) + 
      (Conversion_rate × 0.25) + 
      (Task_completion × 0.25) + 
      (Performance_score × 0.1) + 
      (User_satisfaction × 0.1)
```

**Target:** 85/100 (Excellent)

| Component | Weight | Baseline | Target | Current |
|-----------|--------|----------|--------|---------|
| MFRI Technical | 30% | -8 → 0/30 | +15 → 30/30 | _TBD_ |
| Conversion Rate | 25% | 2.5% → 6/25 | 5% → 20/25 | _TBD_ |
| Task Completion | 25% | 45% → 11/25 | 75% → 19/25 | _TBD_ |
| Performance | 10% | 62 → 6/10 | 90 → 9/10 | _TBD_ |
| User Satisfaction | 10% | N/A | 4.5/5 → 9/10 | _TBD_ |
| **Total MRI** | 100% | **23/100** | **87/100** | **_TBD_** |

---

## OKRs — Q2 2026

### Objective 1: Establish Mobile-First Foundation
**Owner:** Tech Lead

#### Key Results
| KR | Metric | Baseline | Target | Progress | Status |
|----|--------|----------|--------|----------|--------|
| KR1.1 | MFRI Technical Score | -8 | +15 | _0%_ | 🔴 Not Started |
| KR1.2 | Mobile Architecture ADR | Not Exists | Approved | _0%_ | 🔴 Not Started |
| KR1.3 | Service Worker Coverage | 0% routes | 80% routes | _0%_ | 🔴 Not Started |
| KR1.4 | Offline Task Completion | 0% | 60% | _0%_ | 🔴 Not Started |

**Sprint Breakdown:**
- Sprint 1: KR1.1 → 0, KR1.2 → Done
- Sprint 2: KR1.1 → +5, KR1.3 → 50%, KR1.4 → 30%
- Sprint 3: KR1.1 → +12
- Sprint 4: KR1.1 → +15, KR1.3 → 80%, KR1.4 → 60%

---

### Objective 2: Drive Mobile User Engagement
**Owner:** Product Owner

#### Key Results
| KR | Metric | Baseline | Target | Progress | Status |
|----|--------|----------|--------|----------|--------|
| KR2.1 | Mobile Conversion Rate | 2.5% | >5% | _0%_ | 🔴 Not Started |
| KR2.2 | Mobile Task Completion | 45% | >75% | _0%_ | 🔴 Not Started |
| KR2.3 | Mobile Session Duration | 2m 15s | >4m | _0%_ | 🔴 Not Started |
| KR2.4 | Mobile Bounce Rate | 58% | <35% | _0%_ | 🔴 Not Started |

**Sprint Breakdown:**
- Sprint 1: KR2.1 → 3%, KR2.4 → 50% (quick wins)
- Sprint 3: KR2.2 → 65%, KR2.3 → 3m (IA redesign)
- Sprint 5: KR2.1 → 5%, KR2.2 → 75%

---

### Objective 3: Deliver World-Class Mobile Performance
**Owner:** Frontend Lead

#### Key Results
| KR | Metric | Baseline | Target | Progress | Status |
|----|--------|----------|--------|----------|--------|
| KR3.1 | Lighthouse Mobile Score | 62 | >90 | _0%_ | 🔴 Not Started |
| KR3.2 | Largest Contentful Paint | 3.8s | <2.5s | _0%_ | 🔴 Not Started |
| KR3.3 | Total Blocking Time | 420ms | <200ms | _0%_ | 🔴 Not Started |
| KR3.4 | Cumulative Layout Shift | 0.18 | <0.1 | _0%_ | 🔴 Not Started |

**Sprint Breakdown:**
- Sprint 2: KR3.1 → 75 (SW caching)
- Sprint 4: KR3.1 → 90+, KR3.2/3.3/3.4 → targets

---

### Objective 4: Build Robust Mobile QA
**Owner:** QA Lead

#### Key Results
| KR | Metric | Baseline | Target | Progress | Status |
|----|--------|----------|--------|----------|--------|
| KR4.1 | Mobile Test Coverage | 15% | >80% | _0%_ | 🔴 Not Started |
| KR4.2 | Critical Mobile Bugs (prod) | 12 known | 0 | _0%_ | 🔴 Not Started |
| KR4.3 | Mobile Regression Rate | N/A | <3% | _0%_ | 🔴 Not Started |
| KR4.4 | Device Testing Matrix | 2 devices | 5+ devices | _0%_ | 🔴 Not Started |

**Sprint Breakdown:**
- Sprint 1-3: Fix known bugs (KR4.2)
- Sprint 4: KR4.1 → 80%, KR4.4 → 5 devices
- Sprint 5: KR4.3 monitoring established

---

## Key Metrics Dashboard

### 1. Technical Health Metrics

#### MFRI Score Tracker
| Sprint | Target MFRI | Actual | Delta | Status |
|--------|-------------|--------|-------|--------|
| Baseline | -8 | -8 | - | 🔴 Dangerous |
| Sprint 1 | 0 | _TBD_ | _TBD_ | 📋 Planned |
| Sprint 2 | +5 | _TBD_ | _TBD_ | 📋 Planned |
| Sprint 3 | +12 | _TBD_ | _TBD_ | 📋 Planned |
| Sprint 4 | +15 | _TBD_ | _TBD_ | 📋 Planned |
| Sprint 5 | +15 | _TBD_ | _TBD_ | 📋 Planned |

**MFRI Components:**
- Platform Clarity: 1 → 10 (M-001)
- Accessibility: 3 → 9 (M-002, M-003)
- Interaction Complexity: 4 → 8 (M-006, M-007)
- Performance Risk: 4 → 9 (M-009, M-010)
- Offline Dependence: 4 → 9 (M-004, M-005)

---

#### Lighthouse Mobile Scores
| Page | Baseline | Sprint 2 | Sprint 4 | Target |
|------|----------|----------|----------|--------|
| Homepage | 62 | _TBD_ | _TBD_ | 90+ |
| Category Page | 58 | _TBD_ | _TBD_ | 90+ |
| Company Detail | 65 | _TBD_ | _TBD_ | 90+ |
| Dashboard | 51 | _TBD_ | _TBD_ | 85+ |
| Blog | 72 | _TBD_ | _TBD_ | 90+ |

**Tracking URL:** `https://lighthouse-ci.avaliacerta.com/mobile`

---

#### Core Web Vitals (Mobile)
| Metric | Baseline | Target | Current | Status |
|--------|----------|--------|---------|--------|
| **LCP** (Largest Contentful Paint) | 3.8s | <2.5s | _TBD_ | 🔴 |
| **FID** (First Input Delay) | 180ms | <100ms | _TBD_ | 🟡 |
| **CLS** (Cumulative Layout Shift) | 0.18 | <0.1 | _TBD_ | 🟡 |
| **FCP** (First Contentful Paint) | 2.1s | <1.5s | _TBD_ | 🟡 |
| **TBT** (Total Blocking Time) | 420ms | <200ms | _TBD_ | 🔴 |
| **SI** (Speed Index) | 4.2s | <3.4s | _TBD_ | 🟡 |

**Measurement:** Chrome UX Report (CrUX) + Lighthouse CI

---

#### Bundle Size Metrics
| Metric | Baseline | Target | Current | Status |
|--------|----------|--------|---------|--------|
| Initial JS Bundle | 247KB | <150KB | _TBD_ | 🔴 |
| Route JS Bundle (avg) | 89KB | <50KB | _TBD_ | 🟡 |
| CSS Bundle | 42KB | <30KB | _TBD_ | ✅ |
| Total Page Weight | 1.2MB | <800KB | _TBD_ | 🔴 |
| Image Payload (avg) | 680KB | <500KB | _TBD_ | 🟡 |

**Tool:** `@next/bundle-analyzer`

---

### 2. User Experience Metrics

#### Mobile Conversion Funnel
| Stage | Baseline Rate | Target Rate | Current | Drop-off |
|-------|---------------|-------------|---------|----------|
| Visit | 100% | 100% | _TBD_ | - |
| Category Browse | 62% | >80% | _TBD_ | _TBD_ |
| Company View | 28% | >45% | _TBD_ | _TBD_ |
| Contact/Lead Form Start | 8% | >15% | _TBD_ | _TBD_ |
| Contact/Lead Form Complete | 2.5% | >5% | _TBD_ | _TBD_ |

**Overall Mobile Conversion:** 2.5% → 5%+

**Tracking:** GA4 Events + Funnels

---

#### Task Completion Rates (Mobile)
| Task | Baseline | Target | Current | Priority |
|------|----------|--------|---------|----------|
| Search for category | 72% | >90% | _TBD_ | P0 |
| Filter results | 45% | >75% | _TBD_ | P0 |
| View company details | 81% | >90% | _TBD_ | P1 |
| Compare companies | 38% | >70% | _TBD_ | P1 |
| Submit lead form | 52% | >75% | _TBD_ | P0 |
| Create account | 41% | >65% | _TBD_ | P1 |
| Dashboard navigation (Enterprise) | 35% | >70% | _TBD_ | P0 |

**Measurement:** Hotjar/FullStory session recordings + GA4 custom events

---

#### Mobile User Satisfaction
| Metric | Method | Baseline | Target | Current |
|--------|--------|----------|--------|---------|
| Overall Satisfaction | In-app survey (1-5) | N/A | 4.5/5 | _TBD_ |
| Ease of Use | Survey | N/A | 4.5/5 | _TBD_ |
| Performance Perception | Survey | 3.2/5 | 4.5/5 | _TBD_ |
| NPS (Mobile Users) | Survey | N/A | >40 | _TBD_ |

**Survey Cadence:** Sprint 3, Sprint 5 (n=100+ users each)

---

#### Mobile Session Metrics
| Metric | Baseline | Target | Current | Trend |
|--------|----------|--------|---------|-------|
| Avg Session Duration | 2m 15s | >4m | _TBD_ | - |
| Pages per Session | 2.8 | >4.5 | _TBD_ | - |
| Bounce Rate | 58% | <35% | _TBD_ | - |
| Return Visitor Rate | 22% | >40% | _TBD_ | - |

---

### 3. Offline & PWA Metrics

#### Service Worker Performance
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| SW Registration Success | >98% | _TBD_ | 📋 Sprint 2 |
| Cache Hit Ratio | >60% | _TBD_ | 📋 Sprint 2 |
| Cache Size | <50MB | _TBD_ | 📋 Sprint 2 |
| SW Update Success | >95% | _TBD_ | 📋 Sprint 2 |

---

#### Offline Capabilities
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Routes with Offline Support | 80% | _TBD_ | 📋 Sprint 2 |
| Offline Page Views | Trackable | _TBD_ | 📋 Sprint 2 |
| Offline Mutation Queue Success | >90% | _TBD_ | 📋 Sprint 2 |
| Sync Latency (avg) | <30s | _TBD_ | 📋 Sprint 2 |

---

#### PWA Install Metrics
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Install Prompt Shown | Track | _TBD_ | 📋 Sprint 5 |
| Install Prompt Accepted | >10% | _TBD_ | 📋 Sprint 5 |
| Installed Users (total) | 1000+ | _TBD_ | 📋 Sprint 5 |
| Installed User Retention (7-day) | >60% | _TBD_ | 📋 Sprint 5 |

**Tracking:** Custom GA4 events (`pwa_install_prompt_shown`, `pwa_installed`)

---

### 4. Quality & Testing Metrics

#### Test Coverage
| Type | Baseline | Target | Current | Status |
|------|----------|--------|---------|--------|
| E2E Mobile Tests | 5 tests | 20+ tests | _TBD_ | 📋 Sprint 4 |
| Visual Regression | 0 snapshots | 30+ snapshots | _TBD_ | 📋 Sprint 4 |
| Unit Tests (mobile-specific) | 12 tests | 50+ tests | _TBD_ | 📋 Sprint 3 |
| Coverage % (mobile code) | 15% | >80% | _TBD_ | 📋 Sprint 4 |

---

#### Bug Tracking
| Priority | Open (Baseline) | New (Sprint) | Closed (Sprint) | Open (Current) |
|----------|-----------------|--------------|-----------------|----------------|
| P0 (Blocker) | 3 | _TBD_ | _TBD_ | _TBD_ |
| P1 (Critical) | 9 | _TBD_ | _TBD_ | _TBD_ |
| P2 (High) | 15 | _TBD_ | _TBD_ | _TBD_ |
| P3 (Medium) | 22 | _TBD_ | _TBD_ | _TBD_ |

**Target by Sprint 5:**
- P0: 0
- P1: <3
- P2: <10

---

#### Device Testing Coverage
| Device | OS | Browser | Status | Last Tested |
|--------|----|----|--------|-------------|
| iPhone 14 Pro | iOS 17 | Safari | 🔴 Pending | Never |
| iPhone SE 2022 | iOS 16 | Safari | 🔴 Pending | Never |
| Galaxy S23 | Android 13 | Chrome | 🔴 Pending | Never |
| Pixel 7 | Android 14 | Chrome | 🔴 Pending | Never |
| iPad Pro 11" | iOS 17 | Safari | 🔴 Pending | Never |

**Target:** All devices ✅ Green by Sprint 4

---

### 5. Business Impact Metrics

#### Mobile Revenue Impact
| Metric | Baseline | Target | Current | Status |
|--------|----------|--------|---------|--------|
| Mobile Leads per Month | 180 | >400 | _TBD_ | 🔴 |
| Mobile Lead Quality Score | 6.2/10 | >8/10 | _TBD_ | 🔴 |
| Mobile User LTV (est) | $420 | >$600 | _TBD_ | 🔴 |
| Mobile Revenue % | 18% | >35% | _TBD_ | 🔴 |

**Measurement:** CRM integration + GA4 ecommerce

---

#### Mobile vs Desktop Performance
| Metric | Mobile Baseline | Desktop Baseline | Target Gap | Current Gap |
|--------|-----------------|------------------|------------|-------------|
| Conversion Rate | 2.5% | 4.8% | <30% | _92%_ 🔴 |
| Avg Order Value | $380 | $520 | <25% | _73%_ 🔴 |
| Session Duration | 2m 15s | 5m 30s | <40% | _141%_ 🔴 |
| Bounce Rate | 58% | 42% | <20% | _38%_ 🔴 |

**Goal:** Reduce mobile/desktop gap to <30% across all metrics

---

## Weekly Review Template

### Sprint Week X Review — [Date]

#### 🎯 Progress Against OKRs
- **Objective 1:** [Status] — [Commentary]
- **Objective 2:** [Status] — [Commentary]
- **Objective 3:** [Status] — [Commentary]
- **Objective 4:** [Status] — [Commentary]

#### 📊 Key Metrics Changes (Week-over-Week)
| Metric | Previous | Current | Change | Status |
|--------|----------|---------|--------|--------|
| MFRI Score | X | Y | +Z | 🟢/🟡/🔴 |
| Mobile Conversion | X% | Y% | +Z% | 🟢/🟡/🔴 |
| Lighthouse Score | X | Y | +Z | 🟢/🟡/🔴 |
| Task Completion | X% | Y% | +Z% | 🟢/🟡/🔴 |

#### ✅ Wins This Week
- [Win 1]
- [Win 2]
- [Win 3]

#### 🚧 Blockers / Risks
- [Blocker 1] — [Mitigation]
- [Risk 1] — [Action]

#### 📋 Next Week Focus
- [Priority 1]
- [Priority 2]
- [Priority 3]

---

## Alerts & Thresholds

### Critical Alerts (Immediate Action Required)
- 🚨 MFRI Score drops >2 points week-over-week
- 🚨 Mobile Lighthouse score drops below 80
- 🚨 Mobile conversion rate drops >10% week-over-week
- 🚨 P0 mobile bug in production >4 hours
- 🚨 Service Worker registration success <95%

### Warning Alerts (Review in 24h)
- ⚠️ Mobile bounce rate increases >5% week-over-week
- ⚠️ LCP increases >500ms
- ⚠️ Task completion rate drops >5%
- ⚠️ Cache hit ratio <55%

### Info Alerts (Review in Weekly)
- ℹ️ Bundle size increases >10KB
- ℹ️ Test coverage drops >5%
- ℹ️ New P1 bug reported

---

## Reporting Schedule

### Daily
- Lighthouse CI run (automated)
- Bundle size check (automated)
- P0 bug count (manual review)

### Weekly
- OKR progress review (Mondays 10am)
- Metrics dashboard update (Mondays)
- Stakeholder email summary (Mondays)

### Sprint (Bi-weekly)
- Sprint retrospective + metrics review
- Update forecast to completion
- Adjust priorities if needed

### Monthly
- Executive summary presentation
- ROI analysis
- User satisfaction survey (Sprint 3, 5)

---

## Success Definition

### MVP Success (Sprint 2)
- [x] MFRI ≥ 0
- [x] Zero hover dependencies
- [x] Service Worker functional
- [x] Mobile conversion > 3%

### Launch Success (Sprint 5)
- [x] MFRI ≥ +15
- [x] Lighthouse Mobile ≥ 90
- [x] Mobile conversion ≥ 5%
- [x] Task completion ≥ 75%
- [x] PWA installable
- [x] Zero P0 bugs

### 3-Month Post-Launch Success
- [x] Mobile conversion maintained >5%
- [x] Mobile revenue % >30%
- [x] User satisfaction ≥4.5/5
- [x] PWA installs >1000
- [x] Mobile/Desktop gap <30%

---

## Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-03-10 | 1.0 | Dashboard inicial | AIOS Orion |

---

**Generated by:** AIOS Orion Agent (@aios-master)
**Dashboard URL:** `https://dashboards.avaliacerta.com/mobile-initiative`
**Next Review:** Sprint 1 — Week 1 (Monday 10am)
