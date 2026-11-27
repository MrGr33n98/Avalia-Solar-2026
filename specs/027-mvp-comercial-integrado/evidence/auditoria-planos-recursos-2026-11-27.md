# Auditoria E2E — Planos e Recursos (admin → empresa → dashboard → público)

**Data:** 27/11/2026 · **Modo:** somente leitura (nenhum registro editado)
**Fontes:** código em `origin/main`; `api.avaliasolar.com.br/admin/plans` e `/admin/companies` (sessão admin); `app.avaliasolar.com.br/dashboard` (sessão de membro); GETs públicos.
**Amostra de empresas:** WEG (372, Plano Pro) e Voltalia Brasil (943, sem plano).
**Privacidade:** dados de contato e leads foram vistos na tela, mas não foram registrados aqui.

---

## 1. Cadeia de resolução (código)

```
/admin/plans      → Plan.features_json (46 chaves do PlanFeatureCatalog; o template do tier preenche o que falta)
/admin/companies  → Company.plan_id + Company.plan_features (override) + overrides automáticos
                    (verified?/featured? → media_upload; social_proof_enabled; financing_tab_visible; …)
                  → Company#effective_plan_features
                  → CompanyFeatureAccessResolver (+ RUNTIME_VALUE_RESOLVERS)
                  → GET /api/v1/companies/:id/feature_access → dashboard (FeatureGuard / travas)
                  → require_company_feature! (company_admin/* → 403 FEATURE_NOT_AVAILABLE)
                  → APIs públicas (perfil, projetos, MCP)
```

## 2. Estado de produção

| ID | Plano | Preço (catálogo) | Setup | Recursos | Stripe 6m / 12m | Empresas |
|---|---|---|---|---|---|---|
| 1 | Plano Free | R$ 0 | incluso | 6 | não configurado | 30 |
| 2 | Essential | R$ 590/ano | — | 9 | mesmo price ID nos dois campos | 0 |
| 3 | Plano Pro | R$ 1.500/ano | R$ 499 | 36 | mesmo price ID nos dois campos | 3 (372, 944, 1137) |
| 4 | Plano essencial 6 meses | R$ 330 (rotulado "anual") | — | 10 | mesmo price ID nos dois campos | 0 |
| — | Sem plano | — | — | defaults do catálogo | — | 582 |

Total: 615 empresas. Não existe plano Enterprise cadastrado.

## 3. Achados

### 🔴 Críticos (dinheiro, promessa comercial ou dado errado)
| # | Achado | Evidência |
|---|---|---|
| C1 | **O mesmo Stripe price ID para 6 e 12 meses** nos três planos pagos. O período escolhido no checkout não muda a cobrança | `/admin/plans/2`, `/3`, `/4` |
| C2 | **O Essencial de 6 meses (R$ 330) inclui `leads_marketplace`, e o Essencial anual (R$ 590) não.** Quem paga o anual não vê a aba Leads | JSON dos planos 2 × 4 |
| C3 | **Upsell aponta para um plano que não libera o recurso.** As abas "Projetos e materiais", "Materiais", "Galeria de imagens" e "Galeria de mídia" dizem "Desbloquear com Plano Essencial", mas o Essential tem `downloadable_materials`, `media_gallery` e `projects_showcase` = `false` | `EnterpriseDashboard.tsx` (`DASHBOARD_TAB_GUARD_COPY`) × `/admin/plans/2` |
| C4 | **O cliente Pro recebe "Desbloquear com Plano Pro".** Na WEG (Pro), a aba Assistente IA mostra "Assistente IA bloqueado" com CTA para o próprio plano, porque o Pro tem `company_ai_assistant: false` | dashboard 372, aba `ai-assistant` |
| C5 | **Upsell para um plano inexistente.** "Integrações e Webhooks bloqueados" aponta para o "Plano Enterprise", que não existe em produção; o Pro já inclui `webhooks` | `EnterpriseDashboard.tsx` × `/admin/plans` |
| C6 | **O Pro paga e não recebe prova social.** O plano tem `social_proof` e `featured_review` = `true`, mas a WEG mostra os dois como LOCKED, porque o resolver exige também o toggle `social_proof_enabled` da empresa ("Eligibility: Not eligible") | `/admin/companies/372` → Plan Access Preview |
| C7 | **Vitrine sem projetos com dado real.** A WEG tem 1 projeto publicado, visível em `GET /api/v1/companies/weg/projects`, mas `GET /api/v1/storefronts/weg` devolve `projects: 0` (o serviço lê `company.projects`, e o model tem `company_projects`) | curl de 27/11 |
| C8 | **Números de leads conflitantes no mesmo dashboard (WEG, 30 dias):** card "Leads" = 26; bloco "Origem & Atribuição" = 1; aba Leads = 11 solicitações; admin "Leads últimos 30 dias" = 1. Na mesma tela, "Interações (CTAs)" = 35 contra "CTAs" = 0 na atribuição, e o admin mostra `profile_views_count` = 0 contra 684 visualizações no dashboard | dashboard 372 × admin 372 |
| C9 | **Recursos vendidos que nenhum código aplica:** `local_seo_visibility` (incluído no Essential e no Pro), `premium_profile` e `forum_highlight` | `git grep`: 0 referências fora do catálogo |
| C10 | **Limites de upload errados para Pro e Enterprise.** O `CompanyUploadLimiter#current_tier` procura `projects_showcase_pro` e `projects_showcase_enterprise`, chaves que não existem (o admin rejeita chaves desconhecidas). Pro e Enterprise recebem o limite do Essencial | `company_upload_limiter.rb:107-109` |

### 🟠 Importantes
| # | Achado | Evidência |
|---|---|---|
| I1 | **Três tabelas de preço diferentes:** seed (R$ 59,90/mês, R$ 149,90, R$ 1.499), `CompanyUploadLimiter::PRICING` (R$ 49 e R$ 99/mês) e produção (R$ 590/ano, R$ 1.500/ano) | `plans_seed.rb`, `company_upload_limiter.rb:32`, admin |
| I2 | **O selo "Verificada" depende de duas condições:** `verified_product` no plano e `verified = true` na empresa. Um cliente Pro não verificado manualmente não exibe o selo (é o caso da WEG) | Diagnóstico de selos da WEG |
| I3 | **Rótulo de plano inconsistente:** o topo mostra "PRO", e o card da sidebar mostra "Plano Empresarial · Conhecer planos" para o cliente Pro | dashboard 372 |
| I4 | **Alterações de plano sem motivo:** 4 mudanças no Pro (06/11 a 23/11), todas "Motivo: Não informado". Entre elas, `national_coverage` foi ligado e desligado | `/admin/plans/3` → histórico |
| I5 | **Travas só no front** (contornáveis pela API): `verified_product`, `highlight_badges`, `sponsored_description`, `ideal_customer_block`, `show_alternatives`, `product_description`, `product_features_block`, `company_links_block` | `git grep`: back = 0 |
| I6 | **Upsell genérico:** os CTAs vão sempre para `/pricing`, sem pré-selecionar o plano | `FeatureGuard.tsx:249` |

### 🟡 Menores
| # | Achado |
|---|---|
| M1 | 582 de 615 empresas (95%) sem `plan_id`; o comportamento vem dos defaults do código |
| M2 | Coexistem dois sistemas: "Assinatura Legada (não controla features)" e `Billing::CompanySubscription` |
| M3 | O plano 4 tem o preço rotulado como "anual", embora seja de 6 meses |
| M4 | Overrides automáticos (`verified?`/`featured?` → `media_upload`) liberam recurso fora do plano, sem documentação |

## 4. Comportamento observado no dashboard

| Aba | WEG (Pro) | Voltalia (sem plano) |
|---|---|---|
| Visão Geral | abre; números conflitantes (C8) | abre; métricas "ainda não mensurado" |
| Leads | abre (11 solicitações) | travada → "Desbloquear com Plano Pro" |
| Analytics | (não aberta) | travada → "Desbloquear com Plano Pro" |
| Assistente IA | **travada → "Desbloquear com Plano Pro"** (C4) | — |
| Integrações | — | ícone de cadeado no menu |

## 5. Não verificado
- O checkout do Stripe na prática (não iniciado; seria uma ação externa).
- Os valores reais dos price IDs no Stripe (só os IDs no admin).
- As empresas GoodWe (944) e Kaju (1137), e o plano Free com `plan_id` (30 empresas).
- O valor de `MCP_PUBLIC_STOREFRONT_ENABLED` no `.env` de produção.

## 6. Recomendação de ordem
1. **C1, C2, C3, C4 e C5** (cobrança e promessa comercial). C1 e C2 são configuração no admin e no Stripe; C3, C4 e C5 viram uma única correção: derivar o plano-alvo do upsell a partir do catálogo real (o menor plano que libera o recurso), em vez de um texto fixo.
2. **C6 e I2:** decidir se o plano sozinho deve liberar prova social e selo, ou manter a dupla condição e deixar isso explícito na venda.
3. **C8:** definir uma fonte única para leads, CTAs e visualizações por período.
4. **C7 e C10** (código): correção pequena, com teste.
5. **C9 e I5:** aplicar no backend ou retirar o recurso da venda.
6. **I1, I4 e M1–M4:** higiene (preço único, motivo obrigatório nas alterações de plano, plano Free explícito).
