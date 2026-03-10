# MADR-001: Mobile Platform Strategy

## Status
Proposed | 2026-03-10

## Context

Avalia Solar entrega hoje uma aplicação web responsiva em `Next.js 14 + React 18`, mas ainda não opera como produto mobile estruturado. O diagnóstico consolidado em `docs/MOBILE_EXECUTIVE_SUMMARY.md` e `docs/EPIC-MOBILE-001_MOBILE_FIRST_READINESS.md` aponta:

- `MFRI -8 (Dangerous)` por falta de clareza de plataforma, touch anti-patterns e zero readiness offline
- conversão mobile estimada em `2.5%` contra `4.8%` no desktop
- backlog de 5 sprints para atingir `MFRI +15`
- dependência do stack atual: `React Query` para server state e `Zustand` previsto para client state mobile

O repositório atual não contém app nativo iOS/Android nem pipeline de publicação em App Store/Play Store. O investimento aprovado para a iniciativa considera velocidade de entrega, custo de manutenção e preservação da aplicação web existente.

## Decision Drivers

- tempo de entrega para corrigir risco mobile ainda no `Q2 2026`
- reaproveitamento máximo do stack web atual
- custo total de manutenção em 12 meses
- alcance simultâneo para iOS, Android e desktop
- capacidade de iterar sem depender de review das lojas
- preservação do produto web sem bifurcar a base de código

## Considered Options

### Option 1 — PWA-first on top of current Next.js app

**Pros**
- menor time-to-market (`~10 semanas`)
- um codebase para web + mobile browser + app-like install
- encaixa no backlog já priorizado em `docs/MOBILE_PRODUCT_BACKLOG.md`
- reduz risco de regressão ao evoluir o frontend existente

**Cons**
- acesso parcial a APIs nativas
- push e offline avançado dependem de workarounds e compatibilidade do browser

### Option 2 — Native iOS + Android

**Pros**
- melhor integração com APIs nativas
- UX nativa completa

**Cons**
- maior prazo (`6+ meses`)
- duplicação de times e manutenção
- alto risco para a branch atual e para o roadmap web

### Option 3 — Hybrid cross-platform (React Native / Flutter)

**Pros**
- uma base mobile dedicada
- experiência mais próxima de nativo que PWA

**Cons**
- exige reskilling imediato
- não reaproveita diretamente a aplicação Next.js
- aumenta custo operacional antes de validar demanda real

## Decision

**Chosen option:** `PWA-first com roadmap de avaliação nativa no Q3 2026`.

### Official Mobile Stack

- **Framework:** `Next.js 14 App Router`
- **UI Runtime:** `React 18`
- **Server State:** `@tanstack/react-query v5`
- **Client State:** `Zustand` para estado mobile persistente e UI local
- **Offline Layer:** `IndexedDB` com estratégia prevista em `Dexie.js`
- **Service Worker:** `Workbox 7+`
- **Testing:** `Jest + Testing Library`, `Playwright`, `Cypress` mobile suite incremental
- **Performance Tooling:** `Lighthouse CI`, `@next/bundle-analyzer`

### Browser Support Matrix

| Platform | Support Policy |
|----------|----------------|
| iOS Safari | 15+ e últimas 2 versões |
| Android Chrome | 100+ e últimas 2 versões |
| Samsung Internet | versão corrente suportada por Chromium |
| Desktop Chrome / Edge / Safari / Firefox | suporte pleno, com graceful degradation para features PWA |

### Device Testing Matrix

| Priority | Device | Use |
|----------|--------|-----|
| P0 | iPhone 14 Pro | notch + dynamic island + safe-area |
| P0 | Galaxy S23 | Android flagship + gesture nav |
| P1 | iPhone SE 2022 | small viewport sem notch |
| P1 | Pixel 7 | Android base line |
| P2 | iPad Pro | tablet validation |

## Consequences

### Positive Consequences

- corrige os riscos mais críticos sem quebrar a aplicação web
- preserva o investimento no frontend atual
- permite medir adoção PWA antes de financiar apps nativos
- habilita rollout incremental por sprint e por feature flag

### Negative Consequences

- parte da experiência app-like continua limitada pelo browser
- notificações push e offline avançado entram como fases posteriores
- testes mobile reais continuam exigindo device farm / BrowserStack

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Service Worker quebrar fluxos core | rollout por feature flag + testes Playwright/Cypress |
| UX desktop regredir | lint + typecheck + Jest + build + smoke mobile |
| baixa adoção de instalação PWA | avaliar native roadmap no Q3 2026 |

## Roadmap

### 0-3 Months

- Sprint 1: definição de plataforma, touch-safe navigation, safe-area
- Sprint 2: base offline-first com `Workbox` e cache strategy

### 3-6 Months

- Sprint 3-4: IA mobile, performance e suíte mobile
- medir install rate, task completion e conversão mobile

### 6-12 Months

- Sprint 5: manifest, install prompts e polish PWA
- gatilho de decisão para native evaluation no `Q3 2026`

## Approval Queue

| Role | Owner | Status |
|------|-------|--------|
| Tech Lead | Pending assignment | Pending review |
| Product Owner | Pending assignment | Pending review |
| Frontend Lead | Pending assignment | Pending review |

## Communication Artifacts

- `docs/announcements/mobile-platform-decision.md` — resumo executivo para engenharia
- `README.md` — seção de guidelines mobile
- `.github/PULL_REQUEST_TEMPLATE.md` — checklist mobile para mudanças futuras

## Links

- `docs/EPIC-MOBILE-001_MOBILE_FIRST_READINESS.md`
- `docs/MOBILE_EXECUTIVE_SUMMARY.md`
- `docs/MOBILE_PRODUCT_BACKLOG.md`
- `docs/MOBILE_METRICS_DASHBOARD.md`
- `docs/architecture/mobile-architecture-diagram.svg`
