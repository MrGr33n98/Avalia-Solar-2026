# Gap Analysis — MVP Comercial Integrado

Legenda: **Sev.** 🔴 bloqueia a venda defensável · 🟠 degrada a confiança ou a receita · 🟡 higiene
**Origem:** A = auditoria de produção 27/11 · C = código · P = PRD da Spec 026

---

## 1. Billing e preços

| # | Lacuna | Sev. | Origem | Causa raiz | Solução |
|---|---|---|---|---|---|
| B1 | O mesmo Stripe price ID para 6 e 12 meses (planos 2, 3 e 4) | 🔴 | A | Cadastro manual; o admin não valida | Criar prices distintos no Stripe. Validação no `Plan`: `stripe_price_id_monthly != stripe_price_id_yearly` e os dois são `recurring` com o intervalo correto (consultar a API do Stripe no save ou num job de verificação) |
| B2 | Essencial 6m e 12m são planos separados, com recursos diferentes | 🔴 | A | Plano duplicado para representar o período | D1: um plano com dois preços. Migrar o plano 4 para dentro do plano 2 (não há empresas no plano 4) |
| B3 | Três tabelas de preço (seed, `CompanyUploadLimiter::PRICING`, produção) e preço fixo no FAQ de `/pricing` | 🟠 | C/A | Valores copiados no código | Remover `PRICING` do limiter; o FAQ lê do catálogo via API; o seed vira apenas dev, documentado como "não reflete produção" |
| B4 | Plano 4 com o rótulo "anual" mas cobrança de 6 meses | 🟡 | A | O campo `price` é "anual" | Resolvido por B2 |
| B5 | Dois sistemas de assinatura ("Assinatura Legada" + `Billing::CompanySubscription`) | 🟡 | A | Legado | Documentar qual manda; ocultar o legado no menu do admin |

## 2. Catálogo e aplicação (entitlements)

| # | Lacuna | Sev. | Origem | Causa raiz | Solução |
|---|---|---|---|---|---|
| E1 | Recursos vendidos sem nenhuma aplicação: `local_seo_visibility`, `premium_profile`, `forum_highlight` | 🔴 | C | O catálogo cresceu sem contrato de aplicação | Adicionar ao `PlanFeatureCatalog` o atributo `enforced_by:` (lista de pontos) ou `display_only: true`. **Teste de CI** que falha se uma chave vendida não tiver aplicação. D6 |
| E2 | Travas só no front (8 chaves) | 🟠 | C | O gating foi feito na UI | Mover a decisão para o serializer/policy do backend; a UI só reflete o `feature_access` |
| E3 | `CompanyUploadLimiter` procura chaves inexistentes (`projects_showcase_pro/_enterprise`) → Pro e Enterprise ficam com o limite do Essencial | 🔴 | C | Tier deduzido de chaves fantasmas | Usar `company.inferred_plan_tier` ou chaves numéricas do catálogo (`projects_limit`, `images_limit`) |
| E4 | Prova social e selo exigem condição extra (toggle/verificação) que o cliente não vê | 🔴 | A | `RUNTIME_VALUE_RESOLVERS` combina plano + estado da empresa | D3. O `feature_access` passa a devolver `state: pending_verification` com o motivo; o dashboard mostra "Aguardando verificação" em vez de "Bloqueado" |
| E5 | Overrides automáticos (`verified?`/`featured?` → `media_upload` etc.) sem documentação | 🟡 | C | Regras históricas | Listar no catálogo como `grants_from:`; aparecem no "Plan Access Preview" do admin |
| E6 | 582 empresas sem `plan_id` | 🟡 | A | Cadastro sem vínculo | D5: backfill para o Free, com migração reversível |

## 3. Dashboard (app)

| # | Lacuna | Sev. | Origem | Causa raiz | Solução |
|---|---|---|---|---|---|
| U1 | Upsell aponta para o plano errado ("Essencial" não libera; "Enterprise" não existe) | 🔴 | A/C | `DASHBOARD_TAB_GUARD_COPY` com `targetPlanName` fixo | O backend calcula `unlock_plan` (o menor plano **público e existente** que libera a chave) no `feature_access`; o FeatureGuard usa esse valor |
| U2 | Cliente Pro vê "Desbloquear com Plano Pro" | 🔴 | A | Mesmo motivo de U1; o Pro não tem `company_ai_assistant` | Se nenhum plano público libera a chave → "Fale com o comercial" ou ocultar (D7) |
| U3 | Leads, CTAs e visualizações com números diferentes no mesmo período | 🔴 | A | Cada bloco consulta uma fonte (eventos, `leads`, contadores do model, GA) | `CompanyMetrics::PeriodSummary` como fonte única, com definição escrita de cada métrica; os blocos e o admin consomem só ele. Teste de consistência |
| U4 | O card da sidebar diz "Plano Empresarial · Conhecer planos" para quem é Pro | 🟠 | A | Texto fixo | Mostrar o plano atual, a validade e "Gerenciar assinatura" |
| U5 | O CTA de upgrade vai para `/pricing` genérico | 🟡 | C | `FeatureGuard.tsx:249` | Link com `?plan=<unlock_plan>&feature=<key>` e checkout direto |
| U6 | Sem tela "Meu plano": o que está incluído, o uso dos limites e o que está pendente | 🟠 | — | Inexistente | Aba "Plano e recursos", com a mesma matriz do admin (somente leitura) e o uso dos limites |

## 4. Admin

| # | Lacuna | Sev. | Origem | Causa raiz | Solução |
|---|---|---|---|---|---|
| AD1 | Alterações de plano sem motivo | 🟠 | A | `change_reason` opcional | Motivo obrigatório; notificar o financeiro em alteração de preço ou price ID |
| AD2 | Nenhuma visão de "conformidade" do plano | 🟠 | — | — | Página "Conformidade de planos": por plano, recursos vendidos × aplicados × empresas afetadas × divergências |
| AD3 | Sem filtro por plano na listagem de empresas | 🟡 | A | Filtro não registrado | Adicionar o filtro `plan` (o ransack já aceita `plan_id_eq`) |

## 5. Público (site, vitrine, IA)

| # | Lacuna | Sev. | Origem | Causa raiz | Solução |
|---|---|---|---|---|---|
| P1 | Vitrine sem projetos (WEG tem 1 publicado, a vitrine mostra 0) | 🔴 | A/P | `company.projects` × `company_projects` | Usar `company_projects.published.ordered` |
| P2 | Vitrine e MCP ignoram o entitlement `projects_showcase` | 🔴 | P | O serviço não consulta o plano | Mesma checagem de `CompanyProjectsController` |
| P3 | A ferramenta MCP `show_storefront_profile` quebra (`ArgumentError`) | 🔴 | P | Assinatura errada | Corrigir + teste que executa a ferramenta |
| P4 | `/pricing` não é gerado do catálogo real | 🟠 | C | FAQ e textos fixos | A matriz de planos do `/pricing` vem da API (`/api/v1/billing/plans`) |
| P5 | Simulador sem premissas (90% de economia) | 🟠 | P | Fórmula fixa | Premissas exibidas, Lei 14.300 e rótulo de estimativa |
| P6 | Sem atribuição de IA (`ai_agent_type` inexistente) | 🟠 | P | Tarefa marcada como feita sem código | Implementar e corrigir o TASKLIST |

## 6. Governança e documentação

| # | Lacuna | Sev. | Solução |
|---|---|---|---|
| G1 | Documentos marcando como "feito" o que não existe (Spec 026 T03/T14/G08; GA4 T-P2-02) | 🟠 | Drift report obrigatório antes de fechar uma spec; status só muda com link para o teste |
| G2 | Seed divergente de produção | 🟡 | Seed só para dev, com aviso; snapshot do catálogo de produção versionado (sem segredos) |

---

## 7. Matriz de prioridade

| Fase | Itens | Por quê |
|---|---|---|
| **F0 — Parar o sangramento** (configuração, sem código) | B1, B2 (D1/D2), D4 | Cobrança errada e oferta incoerente hoje |
| **F1 — Promessa = entrega** | E1, E3, E4, U1, U2, P1, P2, P3 | Cliente paga e não recebe, ou recebe de graça |
| **F2 — Números confiáveis** | U3, P6 | Sem isso não há prova de valor |
| **F3 — Transparência e conversão** | U4, U5, U6, P4, P5, AD1, AD2 | Venda e renovação defensáveis |
| **F4 — Higiene** | B3, B4, B5, E2, E5, E6, AD3, G1, G2 | Evita regressão |
