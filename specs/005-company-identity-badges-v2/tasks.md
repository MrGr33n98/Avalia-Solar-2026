# Tasks — Spec 005: Company Identity, Commercial Plan, Trust & Badges Architecture V2

## PHASE 0 — Git / Discovery
- [x] **T001 Preflight Git:** Registrar BASE_SHA, branch e worktree; verificar dirty state.
- [x] **T002 Dependency Map:** Mapear relacionamentos entre Company, Category, Plan, Badges, TrustScore.
- [x] **T003 Contract Inventory:** Mapear todos os 15 campos em backend, frontend e mobile (matriz em discovery.md).

## PHASE 1 — Domain Semantics
- [x] **T010 Primary Category Governance:** Definir modelo, validação de pertencimento e regras de fallback.
- [x] **T011 Verification Contract:** Separar estritamente verificação de plano comercial (`VERIFIED != PAID`).
- [x] **T012 Commercial Contract:** Definir `commercial_status` canônico (`tier`, `status`, `paid`), eliminando "PREMIUM".
- [x] **T013 Distribution Semantics:** Desacoplar `featured` e `sponsored` de plano e reconhecimento.
- [x] **T014 Recognition Semantics:** Tratar badges como registros históricos imutáveis emitidos por publicação oficial.

## PHASE 2 — Backend Contracts
- [x] **T020 Identity DTO:** Serializar `identity: { primary_category, verification }` em todos os serializers.
- [x] **T021 Commercial DTO:** Serializar `commercial_status: { tier, status, paid }` no backend.
- [x] **T022 Canonical Badge DTO:** Padronizar `CompanyBadgesSerialization` com `verification_url` e contrato único.
- [x] **T023 Serializer Compatibility:** Preservar campos legados em modo compatibilidade expand-only.
- [x] **T024 Cache Invalidation:** Garantir expiração de cache ao atualizar badges, primary category ou plano.

## PHASE 3 — Critical Bugs
- [x] **T030 certification_progress Bugfix:** Corrigir `company_dashboard_controller#certification_progress` para usar `image_url` e `category_label`.
- [x] **T031 Silent Rescue Elimination:** Remover `rescue StandardError => []` que mascarava falhas internas.
- [x] **T032 Badges API Mismatch:** Limpar métodos fantasmas não roteados em `lib/api.ts` (`badgesApi`).
- [x] **T033 WinnerBadge Contract:** Eliminar dependência de `priority_score >= 100` no frontend.

## PHASE 4 — Public Verification
- [x] **T040 Route `/badges/[slug]`:** Criar página Next.js App Router SSR/ISR para verificação oficial.
- [x] **T041 Metadata & Social:** Gerar `generateMetadata` com OpenGraph, Twitter e canonical tags.
- [x] **T042 JSON-LD Schema:** Inserir marcação estruturada (`Organization`, `WebPage`) para SEO/AEO.
- [x] **T043 404/Inactive Handling:** Retornar `notFound()` para badges inexistentes ou inativos.
- [x] **T044 Verification Analytics:** Rastrear visualizações de verificação via PostHog/Analytics.

## PHASE 5 — Company Profile
- [x] **T050 CategoryBadge Component:** Criar badge clicável de categoria primária apontando para `/categories/[slug]`.
- [x] **T051 VerificationBadge Component:** Refatorar badge de verificação consumindo `identity.verification`.
- [x] **T052 CommercialPlanBadge Component:** Exibir `PRO` ou `ENTERPRISE` baseado no tier real; nada para `free`.
- [x] **T053 CompanyAwardsCard Integration:** Plugar e refatorar `CompanyAwardsCard.tsx` no perfil público.
- [x] **T054 Single Logo Recognition:** Garantir no máximo 1 badge flutuante determinístico na logo da empresa.

## PHASE 6 — Ranking Integration
- [x] **T060 Winner Inference Cleanup:** Desacoplar `WinnerBadge` do `priority_score`.
- [x] **T061 Ranking→Badge Governance:** Documentar fluxo oficial de snapshot de ranking gerando outorga de Badge.

## PHASE 7 — Admin
- [x] **T070 ActiveAdmin Badges Menu:** Reativar menu de Badges com agrupamento e filtros completos.
- [x] **T071 Assignment Audit:** Registrar logs de concessão e remoção de selos.
- [x] **T072 Revoke Behavior:** Assegurar que desativação ou remoção invalida visualização pública.

## PHASE 8 — Mobile
- [x] **T080 Shared Mobile Semantics:** Alinhar Expo com os contratos canônicos de identity e commercial.
- [x] **T081 Profile Badges on Mobile:** Exibir categoria primária, verificação e reconhecimentos no perfil nativo.
- [x] **T082 Compare & Explore Sync:** Remover badges e textos estáticos mockados em explore/compare.

## PHASE 9 — GraphQL
- [x] **T090 GraphQL Consumer Audit:** Verificar consumidores ativos de GraphQL.
- [x] **T091 BadgeType Schema:** Implementar `Types::BadgeType` enriquecido caso justificado.

## PHASE 10 — Tests
- [x] **T100 Backend Specs:** Request specs para `badges_controller`, `certification_progress` e models.
- [x] **T101 Frontend Tests:** Testes Jest para `CompanyIdentityCard`, `CompanyAwardsCard`, `/badges/[slug]`.
- [x] **T102 Mobile Tests:** Testes Jest Expo para componentes de selo e verificação.
- [x] **T103 Playwright E2E:** Cenário completo de navegação perfil ➔ clique selo ➔ `/badges/:slug` ➔ retorno.
- [x] **T104 Accessibility Audit:** Conformidade WCAG, navegação por teclado e contraste.

## PHASE 11 — Production
- [x] **T110 Migration & Backfill:** Migration reversível `add_primary_category_to_companies` com script determinístico.
- [x] **T111 CI Verification:** Execução do pipeline de testes e qualidade.
- [x] **T112 Deploy Ready:** Branch preparada com Conventional Commits.
- [x] **T113 Smoke Testing:** Validação das rotas `/companies/:id`, `/badges/:slug` e dashboard.
- [x] **T114 Rollback Checklist:** Procedimento documentado em `rollback.md`.
