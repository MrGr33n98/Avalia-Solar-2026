# Avalia Solar - Precificação e Integração de Banners (/pricing)

## What This Is

O Avalia Solar é o maior portal de energia solar e mobilidade elétrica do Brasil. Este projeto expande a estrutura de faturamento (SaaS) com uma nova página de preços (/pricing) de design premium contendo 4 planos (Gratuito, Essencial, Pro e Enterprise), além de integrar o sistema de banners publicitários existente de forma nativa e resiliente por meio de slots dinâmicos controlados pelo painel admin.

## Core Value

Apresentar as ofertas de planos SaaS de forma clara, premium e com alta conversão, garantindo flexibilidade comercial por meio da gestão centralizada de banners promocionais sem comprometer a estabilidade do portal.

## Requirements

### Validated

- ✓ **Faturamento SaaS Inicial**: Assinaturas de planos Gratuito, Pro e Enterprise gerenciadas no backend Rails e Stripe Checkout.
- ✓ **Catálogo de Recursos**: Mapeamento de entitlements e features dinâmicas por plano (PlanFeatureCatalog).
- ✓ **Gestão de Anúncios / Banners**: Sistema de banners com moderação, cache Redis no backend e exibição em carrossel no frontend com rastreamento de eventos (views/clicks).

### Active

- [ ] **Novo Plano Essencial**: Adicionar o plano "Essencial" (R$ 59,90/mês ou R$ 599/ano) com badge "Ótimo custo-benefício" e entitlements específicos.
- [ ] **Página de Preços Premium (/pricing)**: Construção da nova interface SaaS responsiva e mobile-first, com 11 seções conforme mockup.
- [ ] **Arquitetura BannerSlot**: Criação do componente `BannerSlot` para injeção dinâmica de banners do admin com fallback local resiliente.
- [ ] **Extensão do Sistema de Banners**: Permitir a nova posição `pricing_advertise_section` de forma segura no Rails e frontend.
- [ ] **Validação com Playwright**: Testes automáticos em múltiplos tamanhos de tela (desktop, tablet e mobile).

### Out of Scope

- [Exclusion 1] — **Alteração no fluxo de Autenticação** — Manter o fluxo de autenticação e registro inalterado.
- [Exclusion 2] — **Alterações no CI/CD** — A pipeline de build e deploy existente não deve ser modificada.
- [Exclusion 3] — **Alteração no Gateway Stripe** — A integração com Stripe deve ser reaproveitada sem alterações nas APIs principais de webhook.

## Context

### Estado do Codebase

- **Frontend**: Aplicação Next.js modularizada com suporte a React Query, Framer Motion e componentização avançada. Possui o componente `BannerContainer` e hooks de busca de banners.
- **Backend**: API robusta em Ruby on Rails com banco de dados PostgreSQL. O modelo `Banner` valida estritamente as posições (`ALLOWED_POSITIONS`), o que exige sua extensão para o placement `/pricing`.
- **Faturamento**: A definição de features do SaaS está centralizada em `PlanFeatureCatalog` e o mapeamento de CTAs de precificação já está integrado com fluxos de checkout e portal Stripe.

## Constraints

- **Tecnologia**: Next.js (Frontend) + Ruby on Rails (Backend).
- **Retrocompatibilidade**: A inclusão do plano "Essencial" e a nova posição de banner não podem quebrar nenhuma funcionalidade, bancos de dados ou banners existentes nas páginas de categorias ou sidebar.
- **Resiliência de Rede**: A falha nas requisições da API de banners não pode indisponibilizar a página `/pricing`. Fallbacks visuais devem ser renderizados instantaneamente.

## Key Decisions

| Decisão | Rationale | Outcome |
|----------|-----------|---------|
| Extensão de ALLOWED_POSITIONS no Rails | A API de banners do Rails valida posições em nível de modelo. Adicionar `pricing_advertise_section` é o caminho mais limpo para permitir a gestão via admin. | — Pending |
| Criação do componente BannerSlot | Abstrair a lógica de fetch, loading, rastreamento e renderização com fallback em um único componente facilita o reuso futuro. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-29 after initialization*
