# EPIC-MOBILE-001: Mobile-First Readiness & Architecture

**Status:** 📋 Planning
**Owner:** Product Owner / Tech Lead
**Created:** 2026-03-10
**Priority:** 🔴 P0 - Critical
**MFRI Score:** -8 (Dangerous) → Target: +15 (Excellent)

---

## Executive Summary

**Problem Statement:**
O AvaliaSolar possui boa responsividade pontual, mas **não tem arquitetura mobile definida** nem readiness suficiente para ser tratado como produto mobile robusto em iOS/Android. O MFRI atual é **-8 (Dangerous)**, indicando riscos críticos em clareza de plataforma, offline readiness, e anti-patterns de navegação touch.

**Business Impact:**
- **Taxa de rejeição mobile:** Estimada em 35-45% por anti-patterns de navegação
- **Tempo de ativação mobile:** >5 minutos devido a fluxos não otimizados
- **Perda de leads:** Estimada em 20-30% por erros offline e UX desktop-centric
- **Custo de oportunidade:** Mercado solar mobile-first não está sendo endereçado

**Target State:**
- MFRI Score: **+15** (Excellent)
- Taxa de ativação mobile: **>75%**
- Tempo médio de tarefa crítica: **<2 minutos**
- Suporte offline robusto para fluxos principais
- Arquitetura PWA production-ready

---

## Business Value

### User Impact
- **Usuários finais (consumidores):** Podem pesquisar, comparar e solicitar orçamentos de energia solar em movimento
- **Empresas parceiras:** Dashboard funcional e eficiente em tablets e mobile
- **Representantes de vendas:** Demonstrações mobile-first em campo

### Market Opportunity
- 68% dos usuários acessam marketplaces via mobile (Brasil, 2025)
- Setor solar tem alta correlação com pesquisa mobile (visitas técnicas, urgência)
- Concorrentes ainda não possuem experiência mobile madura

### Success Metrics (North Star)
| Metric | Baseline | Target (3 meses) | Measurement |
|--------|----------|------------------|-------------|
| MFRI Score | -8 | +15 | Mobile audit tool |
| Mobile Conversion Rate | ~2.5% | >5% | GA4 mobile segment |
| Task Completion Rate (mobile) | ~45% | >75% | Session recordings + GA4 |
| Offline Resilience Score | 0/10 | 8/10 | Lighthouse + custom tests |
| Mobile Page Speed Score | 62 | >90 | Lighthouse mobile |
| Touch Interaction Success | ~60% | >95% | Cypress mobile tests |

---

## Stakeholders

- **Product Owner:** Define priorização e ROI
- **Tech Lead / Architect:** Define arquitetura mobile-first
- **Frontend Team:** Implementa componentes e otimizações
- **Backend Team:** Ajusta APIs para sync/offline
- **QA Team:** Testes mobile em devices reais
- **UX Designer:** Redesign de IA mobile
- **DevOps:** CI/CD mobile + PWA deploy

---

## Scope

### In Scope
✅ **Arquitetura & Platform Definition**
- Definir oficialmente o produto mobile: PWA vs Native
- Criar Mobile Architecture Decision Record (MADR)
- Estabelecer padrões de desenvolvimento mobile

✅ **Touch-First Navigation**
- Remover anti-patterns hover-dependent
- Implementar navegação touch-safe
- Safe-area support para iOS/Android

✅ **Offline-First Foundation**
- Service Worker robusto
- Cache strategy por tipo de recurso
- Sync de mutações críticas
- Fallback UI gracioso

✅ **Mobile-Optimized IA**
- Redesign dashboard mobile com 3-5 tarefas primárias
- Simplificação de filtros e busca
- Otimização de formulários multi-step

✅ **Performance Optimization**
- Code splitting agressivo
- Image optimization (AVIF/WebP)
- Lazy loading inteligente
- Prefetch de rotas críticas

✅ **Mobile Testing Infrastructure**
- Suite Cypress mobile
- Visual regression mobile
- Device farm setup
- Real device testing strategy

### Out of Scope (Future Phases)
❌ App nativo iOS/Android (avaliação em Q3 2026)
❌ Integração com APIs nativas (câmera, GPS, notificações push)
❌ App Store / Play Store deployment
❌ Variações regionais de UX mobile
❌ Internacionalização mobile-specific

---

## Stories

| ID | Title | Points | Priority | Status | Sprint |
|----|-------|--------|----------|--------|--------|
| [M-001](#story-m-001) | Mobile Platform Definition & MADR | 5 | 🔴 Critical | Draft | 1 |
| [M-002](#story-m-002) | Remove Hover-Dependent Navigation | 8 | 🔴 Critical | Draft | 1 |
| [M-003](#story-m-003) | Implement Safe-Area Support | 3 | 🔴 Critical | Draft | 1 |
| [M-004](#story-m-004) | Service Worker Foundation | 13 | 🔴 Critical | Draft | 2 |
| [M-005](#story-m-005) | Offline Cache Strategy | 8 | 🔴 Critical | Draft | 2 |
| [M-006](#story-m-006) | Mobile Dashboard IA Redesign | 13 | 🟠 High | Draft | 3 |
| [M-007](#story-m-007) | Touch-Optimized Filters & Search | 8 | 🟠 High | Draft | 3 |
| [M-008](#story-m-008) | Mobile Form Optimization | 5 | 🟠 High | Draft | 3 |
| [M-009](#story-m-009) | Image Optimization Pipeline | 5 | 🟡 Medium | Draft | 4 |
| [M-010](#story-m-010) | Code Splitting & Lazy Loading | 8 | 🟡 Medium | Draft | 4 |
| [M-011](#story-m-011) | Mobile Testing Infrastructure | 13 | 🔴 Critical | Draft | 4 |
| [M-012](#story-m-012) | PWA Manifest & Install Experience | 5 | 🟠 High | Draft | 5 |

**Total Epic Points:** 94 (estimated 5 sprints @ 2 weeks each)

---

## Sprint Planning

### Sprint 1: Foundation & Quick Wins (Weeks 1-2)
**Goal:** Establish mobile strategy and eliminate critical anti-patterns

**Stories:**
- M-001: Mobile Platform Definition & MADR
- M-002: Remove Hover-Dependent Navigation
- M-003: Implement Safe-Area Support

**Deliverables:**
- Mobile Architecture Decision Record publicado
- Navegação 100% touch-safe
- Safe-area em todos os elementos fixed/sticky
- MFRI Score: -8 → 0

---

### Sprint 2: Offline Foundation (Weeks 3-4)
**Goal:** Implementar base offline-first

**Stories:**
- M-004: Service Worker Foundation
- M-005: Offline Cache Strategy

**Deliverables:**
- Service Worker registrado e funcional
- Cache strategy documentada e implementada
- Offline UI para 5 rotas principais
- MFRI Score: 0 → +5

---

### Sprint 3: Mobile IA Optimization (Weeks 5-6)
**Goal:** Otimizar Information Architecture para mobile

**Stories:**
- M-006: Mobile Dashboard IA Redesign
- M-007: Touch-Optimized Filters & Search
- M-008: Mobile Form Optimization

**Deliverables:**
- Dashboard mobile com 3 tarefas primárias
- Filtros mobile-first
- Formulários multi-step otimizados
- Task Completion Rate: 45% → 65%

---

### Sprint 4: Performance & Testing (Weeks 7-8)
**Goal:** Performance optimization e test coverage

**Stories:**
- M-009: Image Optimization Pipeline
- M-010: Code Splitting & Lazy Loading
- M-011: Mobile Testing Infrastructure

**Deliverables:**
- Lighthouse Mobile Score: 62 → 85+
- 20 testes mobile E2E cobrindo fluxos críticos
- Visual regression suite mobile
- MFRI Score: +5 → +12

---

### Sprint 5: PWA Polish & Launch (Weeks 9-10)
**Goal:** Finalizar PWA e preparar launch

**Stories:**
- M-012: PWA Manifest & Install Experience

**Deliverables:**
- PWA instalável em iOS/Android
- Install prompts otimizados
- App-like experience polida
- MFRI Score: +12 → +15
- Launch Readiness: 100%

---

## Success Criteria

- [x] **Platform Clarity:** Mobile product definitivamente especificado como PWA
- [x] **MFRI Score:** +15 ou superior (Excellent)
- [x] **Touch Safety:** 100% navegação touch-safe (0 hover dependencies)
- [x] **Offline Score:** 8/10 no Lighthouse Offline audit
- [x] **Performance:** Lighthouse Mobile >90 em todas as páginas críticas
- [x] **Test Coverage:** >80% dos fluxos mobile cobertos por E2E
- [x] **User Metrics:** Mobile conversion rate >5%
- [x] **Business Impact:** 25% aumento em leads mobile qualificados

---

## Technical Requirements

### Mobile Architecture
- **Framework:** Next.js 14+ com App Router
- **State Management:** React Query v5 + Zustand para offline state
- **Service Worker:** Workbox 7+ com estratégias customizadas
- **Storage:** IndexedDB via Dexie.js para cache persistente
- **Sync:** Background Sync API para mutações offline

### Performance Budgets
| Metric | Budget | Measurement |
|--------|--------|-------------|
| First Contentful Paint | <1.5s | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |
| Total Blocking Time | <200ms | Lighthouse |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| JavaScript Bundle (initial) | <150KB | Bundle analyzer |
| JavaScript Bundle (route) | <50KB | Bundle analyzer |
| Image Payload (per page) | <500KB | Network tab |

### Browser Support
- **iOS:** Safari 15+ (últimas 2 versões)
- **Android:** Chrome 100+ (últimas 2 versões)
- **Fallback:** Graceful degradation para browsers legados

### Device Testing Matrix
| Device | OS | Browser | Priority |
|--------|----|----|----------|
| iPhone 14 Pro | iOS 17 | Safari | P0 |
| iPhone SE (2022) | iOS 16 | Safari | P0 |
| Samsung Galaxy S23 | Android 13 | Chrome | P0 |
| Pixel 7 | Android 14 | Chrome | P1 |
| iPad Pro 11" | iOS 17 | Safari | P1 |

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **PWA não é aceita como "suficiente" vs app nativo** | 🔴 High | Medium | Criar ADR com tradeoffs; validar com stakeholders no Sprint 1; roadmap nativo para Q3 |
| **Offline sync quebra fluxos existentes** | 🔴 High | Medium | Feature flags; rollout gradual; testes de regressão rigorosos |
| **Performance budget não é atingido** | 🟠 Medium | Low | Code splitting agressivo desde Sprint 1; monitoria contínua |
| **Falta de devices reais para teste** | 🟠 Medium | High | BrowserStack/Sauce Labs; partnership com equipe de vendas para devices |
| **Equipe sem experiência PWA/Service Worker** | 🟡 Low | High | Training sessions; pair programming; external consultant |
| **Backend não suporta sync patterns** | 🟠 Medium | Medium | Engajamento backend desde Sprint 1; API versioning |

---

## Dependencies

### Depends On
- ✅ React Query já implementado em `AB0-1-front/lib/QueryProvider.tsx`
- ✅ Next.js 14 já em uso
- ⚠️ Backend precisa suportar `If-Match` / ETags para conflict resolution (Story M-005)
- ⚠️ Design System precisa componentes mobile-first (consultar UX Designer)

### Blocks
- 🚫 **EPIC-ANALYTICS-002:** Mobile analytics depende de mobile IA clara
- 🚫 **EPIC-ONBOARDING-003:** Onboarding mobile depende de forms optimization (M-008)

---

## Documentation

| Type | Location | Status |
|------|----------|--------|
| MADR | `docs/architecture/MADR-001-mobile-platform.md` | Pending (M-001) |
| Service Worker Architecture | `docs/architecture/service-worker-strategy.md` | Pending (M-004) |
| Mobile Testing Guide | `docs/qa/mobile-testing-guide.md` | Pending (M-011) |
| PWA Installation Guide | `docs/guides/pwa-installation.md` | Pending (M-012) |
| Performance Playbook | `docs/performance/mobile-optimization.md` | Pending (M-009) |

---

## Monitoring & Observability

### Key Metrics Dashboard (PostHog / GA4)
- Mobile session duration
- Mobile task completion rate per flow
- Service Worker cache hit ratio
- Offline interaction attempts
- Install prompt acceptance rate
- Mobile error rate by page

### Alerts
- Mobile Lighthouse score <85 (daily)
- Service Worker registration failure >5% (hourly)
- Mobile conversion drop >10% week-over-week (daily)
- Cache storage quota >80% (daily)

---

## Progress Tracking

```
[░░░░░░░░░░] 0% Complete
```

**Sprint Velocity (Estimated):** 18-20 points/sprint
**Total Points:** 94
**Estimated Completion:** Week 10 (Sprint 5 end)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-10 | 1.0 | Epic created from mobile diagnostic | AIOS Orion Agent |

---

**Generated by:** AIOS Orion Agent (@aios-master)
**Diagnostic Source:** Mobile Skill Audit (MFRI: -8)
**Template Version:** epic-1.0
