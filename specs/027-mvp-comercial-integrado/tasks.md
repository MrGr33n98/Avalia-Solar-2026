# Task List — MVP Comercial Integrado

Convenções:
- Commits no padrão Conventional Commits em pt-BR, um por tarefa.
- Toda tarefa com comportamento testável segue RED → GREEN → REFACTOR.
- Status: `[ ]` aberta · `[~]` em andamento · `[x]` feita, **com link para o teste ou a evidência**.
- 🔒 = depende de decisão (README §7) · 🗄️ = mexe em schema ou dados (precisa de aprovação) · 👤 = ação manual (admin/Stripe)

---

## F0 — Parar o sangramento (configuração, sem deploy)

- [ ] **T001** 👤 Criar no Stripe prices distintos de 6m e 12m para Essencial e Pro; atualizar os price IDs no admin. **Aceite:** campos diferentes; checkout de teste mostra o valor certo. **US-01**
- [ ] **T002** 👤🔒(D1, D2) Unificar o Essencial (planos 2 e 4) com os mesmos recursos; desativar o plano 4 (`is_public = false`). **Aceite:** só um Essencial no `/pricing`. **US-02**
- [ ] **T003** 👤🔒(D4) Confirmar a inexistência do Enterprise e registrar a decisão no README.
- [ ] **T004** 👤 Ligar `social_proof_enabled` para os 3 clientes Pro, se D3 = "o plano libera". **US-05**

## F1 — Promessa = entrega

### Backend
- [x] **T010** Validação no `Plan`: price IDs de 6m e 12m distintos ([spec](../../AB0-1-back/spec/models/plan_stripe_price_ids_spec.rb); também recusa ID de outro plano; só valida quando o campo muda). **Teste:** spec de model. **US-01**
- [ ] **T011** Atributos `enforced_by` / `display_only` no `PlanFeatureCatalog` + teste de CI "toda chave vendida tem aplicação". **Teste:** spec que percorre `FEATURE_DEFINITIONS`. **US-04**
- [ ] **T012** 🔒(D6) Marcar `local_seo_visibility`, `premium_profile` e `forum_highlight` como `display_only` e retirá-las da lista de ativos do `/pricing`. **US-04**
- [ ] **T013** Matriz de conformidade: request specs plano × chave para os endpoints `company_admin/*` e os públicos. **US-04**
- [x] **T014** ([spec](../../AB0-1-back/spec/services/company_upload_limiter_spec.rb); obs.: o controller `company_upload_limits` não tem rota) `CompanyUploadLimiter#current_tier` usa o tier real do plano; remover `PRICING`. **Teste:** Pro → limites Pro. **US-06**
- [x] **T015** ([spec](../../AB0-1-back/spec/services/company_feature_access_unlock_plan_spec.rb)) `feature_access` devolve `unlock_plan` (menor plano público que libera a chave; `null` → "comercial"). **Teste:** Free/Essencial/Pro × chaves. **US-09**
- [ ] **T016** 🔒(D3) Estado `pending_verification` no resolver para `verified_product`, `social_proof` e `featured_review`. **US-05**
- [x] **T017** ([spec](../../AB0-1-back/spec/services/storefront/public_profile_projects_spec.rb)) Vitrine: `company_projects.published.ordered.limit(6)` + entitlement `projects_showcase`. **Teste:** WEG-like (Pro com 1 projeto) e Essencial. **US-07**
- [x] **T018** ([spec](../../AB0-1-back/spec/services/mcp/public/storefront_tool_execution_spec.rb)) MCP `show_storefront_profile`: corrigir a assinatura; teste que **executa** a ferramenta (sucesso, não encontrado, inativo). **US-08**

### Frontend (dashboard)
- [x] **T020** ([teste](../../AB0-1-front/__tests__/components/FeatureGuardUnlockPlan.test.tsx)) `FeatureGuard` usa `unlock_plan` do backend; remover `targetPlanName` fixo de `DASHBOARD_TAB_GUARD_COPY`. **Teste:** Jest para Free/Essencial/Pro; nunca "Desbloquear com <plano atual>". **US-09**
- [ ] **T021** UI do estado `pending_verification`. **Teste:** RTL. **US-05**
- [ ] **T022** E2E Playwright com fixtures Free/Essencial/Pro: cada aba travada mostra o plano certo, e as abas liberadas abrem. **US-04, US-09**

## F2 — Números confiáveis

- [ ] **T030** Escrever as definições de métricas (lead, CTA, visualização, conversão, janela de período, fuso) em `metrics-definitions.md`. **US-12**
- [ ] **T031** `CompanyMetrics::PeriodSummary` (fonte única) + spec. **US-12**
- [ ] **T032** Os cards da Visão Geral, a atribuição, a aba Leads e o admin consomem o `PeriodSummary`. **Teste:** consistência entre blocos. **US-12**
- [ ] **T033** Origem do lead com IA: gravar `utm_*`/referrer de IA no lead e enviar `ai_agent_type` ao GA4; corrigir o status no TASKLIST GA4. **US-13**

## F3 — Transparência e conversão

- [ ] **T040** Aba "Plano e recursos" no dashboard (plano, validade, inclusos, uso dos limites, pendências). **US-11**
- [ ] **T041** Card da sidebar com o plano real e "Gerenciar assinatura". **US-11**
- [ ] **T042** CTA de upgrade com `?plan=&feature=` e evento `upgrade_cta_clicked`. **US-10**
- [ ] **T043** `/pricing` 100% vindo da API; remover o FAQ com preço fixo. **US-03**
- [ ] **T044** Motivo obrigatório na alteração de plano + notificação financeira. **US-14**
- [ ] **T045** Página de conformidade de planos no admin. **US-15**
- [ ] **T046** Simulador com premissas (Spec 026 RF-06). **PRD 026 US-06**
- [ ] **T047** Formulário de orçamento na vitrine com origem (Spec 026 RF-04). **PRD 026 US-04**

## F4 — Higiene

- [ ] **T050** 🗄️🔒(D5) Backfill de `plan_id` = Free para as empresas sem plano (migração de dados reversível). **US-16**
- [ ] **T051** Filtro "Plano" em `/admin/companies`.
- [ ] **T052** Ocultar o menu "Assinatura Legada" ou marcá-lo como somente leitura.
- [ ] **T053** Mover para o backend as travas que hoje só existem no front (8 chaves). **US-04**
- [ ] **T054** Documentar os overrides automáticos (`grants_from`) e exibi-los no Plan Access Preview.
- [ ] **T055** Seed com aviso "dev only"; snapshot do catálogo de produção versionado (sem segredos).
- [ ] **T056** Drift report da Spec 026 e do TASKLIST GA4; corrigir os status falsos. **US-17**

## Gate de release
- [ ] Matriz de conformidade verde (T013, T022).
- [ ] Nenhuma divergência na página de conformidade (T045).
- [ ] Checkout de teste dos 4 combos (Essencial/Pro × 6m/12m) com o valor certo.
- [ ] Teste de consistência de métricas verde (T032).
- [ ] Drift report sem pendências (T056).
