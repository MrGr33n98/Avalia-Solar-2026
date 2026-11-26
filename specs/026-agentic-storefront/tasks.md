# Tarefas de Implementação: SPEC 026 — Agentic Storefront

**Status:** Backlog Ordenado por Dependências (Spec Kit / TDD)  
**Convenção:** Conventional Commits (`feat(storefront):`, `test(storefront):`, `fix(storefront):`)  

---

## Fase 1 — Contratos e Backend Rails (TDD)
- [ ] **T01 — Discovery & Baseline:** Auditar modelos `Company`, `Product` e `Project` existentes e registrar baseline em `evidence/baseline-discovery.json`.
- [ ] **T02 — Modelagem DDD Storefront:** Criar service object `app/services/storefront/public_profile_service.rb` isolando a lógica de montagem da vitrine.
- [ ] **T03 — Specs de Serviço (RSpec):** Implementar `spec/services/storefront/public_profile_service_spec.rb` cobrindo cenários com e sem projetos, planos Free e Pro.
- [ ] **T04 — Serializador e DTO:** Criar `app/serializers/api/v1/storefront_serializer.rb` com envelope v1 padronizado.
- [ ] **T05 — Endpoint Público REST:** Expor `GET /api/v1/storefronts/:slug` com cache Redis e throttling via Rack::Attack.
- [ ] **T06 — Request Spec:** Implementar `spec/requests/api/v1/storefronts_spec.rb` validando 200 OK, 404 Not Found e proteção de PII.

---

## Fase 2 — Ferramenta Pública MCP & MCP Apps SDK
- [ ] **T07 — MCP Tool Registration:** Registrar `show_storefront_profile` em `app/services/mcp/public_tool_registry.rb` com schema JSON estrito.
- [ ] **T08 — MCP Resource Binding:** Adicionar `ui://avalia-solar/storefront/v1.html` ao `Mcp::Ui::ResourceRegistry` com flags de canário.
- [ ] **T09 — Spec MCP Tool:** Implementar `spec/services/mcp/public/storefront_tool_spec.rb` validando contratos e hints read-only.
- [ ] **T10 — Zod Contract:** Adicionar `StorefrontPayloadSchema` em `packages/mcp-ui/src/contracts/schemas.ts`.
- [ ] **T11 — Componente Storefront:** Criar `packages/mcp-ui/src/widgets/StorefrontWidget.tsx` com tabs de catálogo, projetos e simulação.
- [ ] **T12 — Build & Budget:** Adicionar entry `storefront.html` em `packages/mcp-ui/entries/` e validar limite de 120 KiB gzip no Vite build.

---

## Fase 3 — Frontend Web & PWA Next.js 14
- [ ] **T13 — Rota Web Storefront:** Criar `AB0-1-front/app/storefront/[slug]/page.tsx` com Server Components e ISR.
- [ ] **T14 — Componentes de Vitrine:** Integrar `SolarCompanyCard`, `CompanyCarousel`, `SolarCalculator` e `QuoteDraft` na página.
- [ ] **T15 — SEO & Schema.org:** Injetar JSON-LD para `LocalBusiness` e `AggregateRating` auditado.
- [ ] **T16 — Testes de Componente (Jest):** Implementar testes em `AB0-1-front/__tests__/storefront.test.tsx`.

---

## Fase 4 — Gestão B2B no Company Dashboard (SPEC 022)
- [ ] **T17 — Pundit Policy:** Criar `StorefrontPolicy` garantindo que apenas a empresa dona possa alterar sua vitrine.
- [ ] **T18 — Controller de Gestão:** Implementar `app/controllers/app/storefronts_controller.rb` para atualização de marcas e projetos.
- [ ] **T19 — Interface Dashboard:** Adicionar aba "Minha Vitrine" no Company Dashboard com componentes Tremor-density.
- [ ] **T20 — Feature Gating:** Bloquear customizações avançadas no plano Free com banner de upgrade elegante.

---

## Fase 5 — E2E, Governança EGM e Release
- [ ] **T21 — Playwright E2E:** Implementar `tests/e2e/storefront-journey.spec.ts` cobrindo simulação e envio de orçamento.
- [ ] **T22 — EGM Review:** Executar suíte de revisão Goldfish de 5 estágios gerando os relatórios em `specs/026-agentic-storefront/egm/`.
- [ ] **T23 — EGM Drift Report:** Executar `egm-drift-report` para confirmar 100% de aderência entre código e documentação.
- [ ] **T24 — Spec Kit Converge:** Fechar todos os quality gates G00 a G18 antes do deploy.

