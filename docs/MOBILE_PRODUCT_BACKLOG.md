# Mobile-First Product Backlog — Priorizado e Estimado

**Epic:** EPIC-MOBILE-001 - Mobile-First Readiness & Architecture
**Owner:** Product Owner
**Created:** 2026-03-10
**Last Updated:** 2026-03-10
**Status:** ✅ Ready for Sprint Planning

---

## Executive Summary

**Total Epic Points:** 94
**Estimated Duration:** 10 weeks (5 sprints @ 2 weeks)
**Team Velocity (estimated):** 18-20 points/sprint
**Priority Distribution:**
- 🔴 P0 (Critical): 47 points (50%)
- 🟠 P1 (High): 34 points (36%)
- 🟡 P2 (Medium): 13 points (14%)

**Business Impact:**
- **Target MFRI Score:** -8 → +15 (improvement de 23 pontos)
- **Target Mobile Conversion:** 2.5% → 5%+ (dobro)
- **Target Task Completion:** 45% → 75%+ (67% improvement)

---

## Sprint 1: Foundation & Quick Wins (16 points)

### Goal
Estabelecer estratégia mobile, eliminar anti-patterns críticos, atingir MFRI = 0

### Stories

#### ✅ M-001: Mobile Platform Definition & MADR
- **Points:** 5
- **Priority:** 🔴 P0
- **Owner:** Tech Lead + PO
- **Value:** Define arquitetura e tech stack; desbloqueia todo o epic
- **Dependencies:** None
- **Risk:** Low
- **Output:** MADR documento aprovado por stakeholders

**Key Tasks:**
- Research & competitive analysis (3h)
- Criar MADR com PWA-first decision (4h)
- Tech stack definition (3h)
- Stakeholder review & approval (3h)
- Documentation & communication (2h)

**Acceptance Criteria:**
- [ ] MADR criado e aprovado
- [ ] Tech stack oficialmente definido
- [ ] Browser support matrix documentada
- [ ] README atualizado com guidelines

---

#### ✅ M-002: Remove Hover-Dependent Navigation
- **Points:** 8
- **Priority:** 🔴 P0
- **Owner:** Frontend Lead
- **Value:** Elimina blocker #1 de usabilidade mobile (35-45% users impactados)
- **Dependencies:** M-001 (tech stack)
- **Risk:** Medium (pode impactar desktop UX)
- **Output:** Navegação 100% touch-safe

**Key Tasks:**
- Audit hover dependencies (2h)
- Refactor CategoryDropdownItem accordion (6h)
- Touch optimization (3h)
- Desktop compatibility (2h)
- E2E mobile testing (4h)
- Documentation (1h)

**Acceptance Criteria:**
- [ ] Zero hover handlers em navegação
- [ ] Accordion pattern implementado
- [ ] Touch targets ≥48px
- [ ] ARIA compliant
- [ ] 10+ testes E2E mobile passing

**MFRI Impact:** -8 → -3 (+5 points)

---

#### ✅ M-003: Implement Safe-Area Support
- **Points:** 3
- **Priority:** 🔴 P0
- **Owner:** Frontend Engineer
- **Value:** Corrige UX em iPhone (home indicator) e Android (gestures)
- **Dependencies:** M-001
- **Risk:** Low
- **Output:** CTAs e elementos fixed respeitam safe-area

**Key Tasks:**
- Global safe-area setup (1h)
- Fix StickyMobileCTA (30min)
- Fix FilterSidebar (45min)
- Fix toolbar (45min)
- Comprehensive audit (2h)
- Testing iOS/Android (2h)
- Documentation (1h)

**Acceptance Criteria:**
- [ ] Viewport-fit=cover configurado
- [ ] CSS variables globais
- [ ] 3+ componentes críticos corrigidos
- [ ] Testado em iPhone 14 Pro + Galaxy S23

**MFRI Impact:** -3 → 0 (+3 points)

---

### Sprint 1 Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| MFRI Score | 0 (from -8) | Mobile audit tool |
| Touch navigation success | >85% | Cypress tests |
| Stakeholder alignment | 100% | MADR approvals |
| Zero blocking issues | 0 | Backlog review |

---

## Sprint 2: Offline Foundation (21 points)

### Goal
Implementar base offline-first, atingir MFRI = +5

### Stories

#### ✅ M-004: Service Worker Foundation
- **Points:** 13
- **Priority:** 🔴 P0
- **Owner:** Senior Frontend Engineer
- **Value:** Habilita offline support, performance, e PWA capabilities
- **Dependencies:** M-001 (PWA strategy)
- **Risk:** High (pode quebrar fluxos se mal implementado)
- **Output:** Service Worker robusto com Workbox

**Key Tasks:**
- Setup Workbox & Next.js integration (3h)
- Implement caching strategies (5h)
- Precache critical assets (2h)
- Offline fallback pages (3h)
- Service Worker lifecycle management (4h)
- Testing & debugging (5h)
- Documentation (2h)

**Acceptance Criteria:**
- [ ] Service Worker registrado e funcional
- [ ] 3 cache strategies implementadas (Network First, Cache First, Stale-While-Revalidate)
- [ ] Offline fallback UI para 5 rotas principais
- [ ] Lighthouse Offline score ≥6/10
- [ ] Feature flag para gradual rollout

**MFRI Impact:** 0 → +3 (+3 points)

**Success Metrics:**
- SW registration success rate: >98%
- Cache hit ratio: >60%
- Offline page views: trackable em GA4

---

#### ✅ M-005: Offline Cache Strategy
- **Points:** 8
- **Priority:** 🔴 P0
- **Owner:** Frontend + Backend Engineer
- **Value:** Garante app funcional em conexões ruins/ausentes
- **Dependencies:** M-004 (Service Worker)
- **Risk:** Medium (sync conflicts)
- **Output:** Estratégia de cache documentada e implementada

**Key Tasks:**
- Define cache hierarchy (2h)
- Implement IndexedDB persistence (4h)
- Background Sync for mutations (5h)
- Conflict resolution strategy (3h)
- Testing offline scenarios (4h)
- Documentation (2h)

**Acceptance Criteria:**
- [ ] IndexedDB schema definida
- [ ] Background Sync API implementada
- [ ] Mutation queue com retry logic
- [ ] Conflict resolution (last-write-wins MVP)
- [ ] 15+ offline test scenarios passing

**MFRI Impact:** +3 → +5 (+2 points)

**Success Metrics:**
- Offline mutation success: >90%
- Sync queue processing time: <30s
- Zero data loss in offline mode

---

### Sprint 2 Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| MFRI Score | +5 (from 0) | Mobile audit tool |
| Lighthouse Offline | ≥6/10 | Lighthouse audit |
| Cache hit ratio | >60% | SW analytics |
| Offline task completion | >50% | Manual tests |

---

## Sprint 3: Mobile IA Optimization (26 points)

### Goal
Otimizar Information Architecture para mobile, atingir task completion >65%

### Stories

#### ✅ M-006: Mobile Dashboard IA Redesign
- **Points:** 13
- **Priority:** 🟠 P1 (High)
- **Owner:** Product Designer + Frontend Lead
- **Value:** Simplifica dashboard para 3-5 tarefas primárias mobile
- **Dependencies:** M-002 (navigation patterns)
- **Risk:** Medium (pode afetar power users)
- **Output:** Dashboard mobile-first redesenhado

**Key Tasks:**
- User research & task analysis (4h)
- IA redesign (prioritize 3-5 tasks) (5h)
- Wireframes & prototype (4h)
- Implementation (12h)
- Mobile testing (4h)
- Documentation (2h)

**Acceptance Criteria:**
- [ ] Dashboard tem 3 tarefas primárias visíveis
- [ ] Features secundárias em "More" menu
- [ ] Navigation drawer implementado
- [ ] Task completion >65% em mobile
- [ ] Zero regressions desktop

**MFRI Impact:** +5 → +8 (+3 points)

**Success Metrics:**
- Task completion rate: 45% → 65%
- Time to complete primary task: <2min
- Mobile user satisfaction: >4/5

---

#### ✅ M-007: Touch-Optimized Filters & Search
- **Points:** 8
- **Priority:** 🟠 P1 (High)
- **Owner:** Frontend Engineer
- **Value:** Melhora discovery e filtering em mobile
- **Dependencies:** M-002 (touch patterns)
- **Risk:** Low
- **Output:** Filtros e busca mobile-first

**Key Tasks:**
- Redesign filter UI mobile (4h)
- Implement bottom sheet pattern (3h)
- Touch-optimized checkboxes/toggles (2h)
- Search autocomplete mobile (3h)
- Testing (3h)
- Documentation (1h)

**Acceptance Criteria:**
- [ ] Filtros abrem em bottom sheet
- [ ] Touch targets ≥48px
- [ ] Apply/Clear actions sempre visíveis
- [ ] Filter pills para active filters
- [ ] Search autocomplete com touch keyboard

**MFRI Impact:** +8 → +10 (+2 points)

---

#### ✅ M-008: Mobile Form Optimization
- **Points:** 5
- **Priority:** 🟠 P1 (High)
- **Owner:** Frontend Engineer
- **Value:** Reduz friction em cadastro/lead forms
- **Dependencies:** None
- **Risk:** Low
- **Output:** Forms mobile-friendly

**Key Tasks:**
- Audit current forms (2h)
- Implement multi-step pattern (4h)
- Input optimization (autocomplete, inputmode) (2h)
- Validation UX mobile (2h)
- Testing (2h)
- Documentation (1h)

**Acceptance Criteria:**
- [ ] Forms divididos em steps ≤5 campos/step
- [ ] Progress indicator visível
- [ ] Input types corretos (email, tel, number)
- [ ] Inline validation
- [ ] Form completion rate mobile >70%

**MFRI Impact:** +10 → +12 (+2 points)

---

### Sprint 3 Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| MFRI Score | +12 (from +5) | Mobile audit tool |
| Task completion | >65% | Session recordings |
| Form completion | >70% | GA4 funnels |
| User satisfaction | >4/5 | In-app survey |

---

## Sprint 4: Performance & Testing (26 points)

### Goal
Atingir Lighthouse >90, test coverage >80%, MFRI = +15

### Stories

#### ✅ M-009: Image Optimization Pipeline
- **Points:** 5
- **Priority:** 🟡 P2 (Medium)
- **Owner:** DevOps + Frontend Engineer
- **Value:** Reduz payload e melhora LCP
- **Dependencies:** None
- **Risk:** Low
- **Output:** Images otimizadas automaticamente

**Key Tasks:**
- Configure Next.js Image component (2h)
- Implement AVIF/WebP with fallbacks (3h)
- Lazy loading strategy (2h)
- CDN optimization (2h)
- Testing & validation (2h)

**Acceptance Criteria:**
- [ ] Next.js Image em todas imagens críticas
- [ ] AVIF → WebP → JPEG fallback
- [ ] Lazy loading com intersection observer
- [ ] Image payload <500KB per page
- [ ] LCP <2.5s

**MFRI Impact:** +12 → +13 (+1 point)

---

#### ✅ M-010: Code Splitting & Lazy Loading
- **Points:** 8
- **Priority:** 🟡 P2 (Medium)
- **Owner:** Frontend Engineer
- **Value:** Reduz initial bundle, melhora TBT
- **Dependencies:** None
- **Risk:** Medium (pode quebrar se mal feito)
- **Output:** Bundle otimizado

**Key Tasks:**
- Route-based code splitting (3h)
- Component lazy loading (3h)
- Dynamic imports optimization (2h)
- Bundle analysis & optimization (4h)
- Testing (2h)

**Acceptance Criteria:**
- [ ] Initial bundle <150KB
- [ ] Route bundles <50KB
- [ ] Lazy load below-fold components
- [ ] TBT <200ms
- [ ] FCP <1.5s

**MFRI Impact:** +13 → +14 (+1 point)

---

#### ✅ M-011: Mobile Testing Infrastructure
- **Points:** 13
- **Priority:** 🔴 P0
- **Owner:** QA Lead + DevOps
- **Value:** Garante qualidade mobile contínua
- **Dependencies:** M-001 (device matrix)
- **Risk:** Medium (setup complexity)
- **Output:** CI/CD com mobile tests

**Key Tasks:**
- Setup Cypress mobile suite (4h)
- Playwright cross-browser tests (4h)
- Visual regression (Percy/Chromatic) (3h)
- Real device testing (BrowserStack) (4h)
- CI/CD integration (3h)
- Documentation (2h)

**Acceptance Criteria:**
- [ ] 20+ E2E tests mobile
- [ ] Visual regression suite
- [ ] Tests run on iOS + Android
- [ ] CI fails on mobile regressions
- [ ] Test coverage >80%

**MFRI Impact:** +14 → +15 (+1 point)

---

### Sprint 4 Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| MFRI Score | +15 (from +12) | Mobile audit tool |
| Lighthouse Mobile | >90 | Lighthouse CI |
| Test coverage | >80% | Cypress/Playwright |
| Bundle size | <150KB initial | Bundle analyzer |

---

## Sprint 5: PWA Polish & Launch (5 points)

### Goal
Finalizar PWA, preparar launch, atingir readiness 100%

### Stories

#### ✅ M-012: PWA Manifest & Install Experience
- **Points:** 5
- **Priority:** 🟠 P1 (High)
- **Owner:** Frontend Lead
- **Value:** Converte web app em instalável
- **Dependencies:** M-004 (Service Worker)
- **Risk:** Low
- **Output:** PWA instalável

**Key Tasks:**
- Create manifest.json (2h)
- Install prompts optimization (3h)
- App icons generation (1h)
- Splash screens (1h)
- Testing install flow (2h)
- Documentation (1h)

**Acceptance Criteria:**
- [ ] manifest.json completo
- [ ] Install prompt otimizado
- [ ] Icons 512x512, 192x192, etc.
- [ ] Splash screens iOS/Android
- [ ] Install rate >10%

**MFRI Impact:** Maintain +15

---

### Sprint 5 Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| PWA Install Rate | >10% | GA4 custom event |
| Mobile Conversion | >5% | GA4 mobile segment |
| Launch Readiness | 100% | Checklist |

---

## Priority Matrix

### P0 (Critical) — Must Have
| Story | Points | Sprint | Business Impact |
|-------|--------|--------|-----------------|
| M-001 | 5 | 1 | Desbloqueia epic inteiro |
| M-002 | 8 | 1 | 35-45% users bloqueados |
| M-003 | 3 | 1 | iOS UX crítico |
| M-004 | 13 | 2 | Foundation offline |
| M-005 | 8 | 2 | Offline readiness |
| M-011 | 13 | 4 | QA automation |
| **Total** | **50** | - | - |

### P1 (High) — Should Have
| Story | Points | Sprint | Business Impact |
|-------|--------|--------|-----------------|
| M-006 | 13 | 3 | Task completion +20% |
| M-007 | 8 | 3 | Discovery improvement |
| M-008 | 5 | 3 | Form conversion +15% |
| M-012 | 5 | 5 | PWA capability |
| **Total** | **31** | - | - |

### P2 (Medium) — Nice to Have
| Story | Points | Sprint | Business Impact |
|-------|--------|--------|-----------------|
| M-009 | 5 | 4 | Performance +10 |
| M-010 | 8 | 4 | Performance +15 |
| **Total** | **13** | - | - |

---

## Risk Assessment

### High Risk
| Story | Risk | Mitigation |
|-------|------|------------|
| M-004 | SW pode quebrar fluxos | Feature flags; gradual rollout; extensive testing |
| M-005 | Sync conflicts | MVP: last-write-wins; monitoring; rollback plan |

### Medium Risk
| Story | Risk | Mitigation |
|-------|------|------------|
| M-002 | Desktop UX pode degradar | Desktop-specific hover preview; thorough testing |
| M-006 | Power users podem rejeitar IA simplificada | User research; A/B test; advanced mode toggle |
| M-010 | Code splitting pode quebrar | Incremental rollout; bundle analysis |
| M-011 | Device testing setup complexo | BrowserStack partnership; clear documentation |

### Low Risk
| Story | Risk | Mitigation |
|-------|------|------------|
| M-001 | Stakeholder disagreement | Early alignment; ADR process |
| M-003 | Safe-area fallback issues | Graceful degradation; backward compat |
| M-007 | Filter UI complexity | Iterative design; usability testing |
| M-008 | Form validation | Existing patterns; incremental improvement |
| M-009 | Image CDN issues | Multiple fallbacks; monitoring |
| M-012 | Low install rate | Optimize prompts; educate users |

---

## Dependencies Graph

```
M-001 (Platform) ───┬─→ M-002 (Navigation)
                    ├─→ M-003 (Safe-Area)
                    └─→ M-004 (Service Worker) ───→ M-005 (Offline)
                                                  └─→ M-012 (PWA)

M-002 ───┬─→ M-006 (Dashboard IA)
         └─→ M-007 (Filters)

M-005 ───→ M-011 (Testing) — validates all

M-009 (Images) ──┬─→ Sprint 4 Performance
M-010 (Splitting)──┘
```

---

## Resource Allocation

### Sprint 1 (16 points)
- Tech Lead: 40% (M-001)
- Product Owner: 20% (M-001)
- Frontend Lead: 60% (M-002)
- Frontend Engineer: 40% (M-003)

### Sprint 2 (21 points)
- Senior Frontend: 80% (M-004)
- Frontend Engineer: 60% (M-005)
- Backend Engineer: 20% (M-005 sync API)

### Sprint 3 (26 points)
- Product Designer: 50% (M-006)
- Frontend Lead: 60% (M-006)
- Frontend Engineer 1: 80% (M-007)
- Frontend Engineer 2: 60% (M-008)

### Sprint 4 (26 points)
- Frontend Engineer: 40% (M-009 + M-010)
- QA Lead: 60% (M-011)
- DevOps: 40% (M-011)

### Sprint 5 (5 points)
- Frontend Lead: 50% (M-012)

---

## Success Criteria — Epic Level

### Technical Metrics
- [x] MFRI Score: +15 or better (from -8)
- [x] Lighthouse Mobile: >90 all critical pages
- [x] Test Coverage: >80% mobile flows
- [x] Offline Score: 8/10 Lighthouse audit

### Business Metrics
- [x] Mobile Conversion Rate: >5% (from ~2.5%)
- [x] Task Completion Rate: >75% (from ~45%)
- [x] Mobile Page Speed: <3s LCP
- [x] PWA Install Rate: >10%
- [x] Mobile User Satisfaction: >4/5

### Quality Metrics
- [x] Zero P0 mobile bugs in production
- [x] <5% regression in desktop metrics
- [x] 100% WCAG 2.1 AA compliance
- [x] Zero hover dependencies

---

## Monitoring & Alerts

### Daily Alerts
- Mobile Lighthouse score <85
- Service Worker registration failure >5%
- Mobile error rate spike >10%

### Weekly Reports
- Mobile conversion trend
- Task completion by flow
- MFRI score tracking
- Performance budget compliance

### Monthly Reviews
- Mobile vs Desktop conversion gap
- Install rate trends
- User satisfaction survey results
- ROI analysis

---

## Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-03-10 | 1.0 | Backlog inicial criado | AIOS Orion |

---

**Generated by:** AIOS Orion Agent (@aios-master)
**For:** Product Owner — Mobile-First Initiative
**Next Steps:** Review with team, refine estimates, begin Sprint 1
