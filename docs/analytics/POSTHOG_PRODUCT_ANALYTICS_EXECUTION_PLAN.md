# PostHog Product Analytics Execution Plan

Status: `draft`  
Owner sugerido: `PO + Product Analytics + Frontend + Backend`  
Última atualização: `2026-03-13`

## Objetivo

Consolidar em um único plano executável tudo o que o time precisa fazer para transformar o tracking atual em um sistema de analytics de produto confiável, governado e útil para tomada de decisão no Avalia Solar.

Este plano cobre:

- diagnóstico atual
- target state
- taxonomia de eventos
- funis canônicos
- prioridades por épico
- user stories
- tasks de implementação
- critérios de aceite

---

## 1. Resumo Executivo

### Diagnóstico consolidado

- [x] O produto já possui base analítica relevante no frontend e no backend.
- [x] Existe integração com PostHog no frontend em [AB0-1-front/lib/analytics/index.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/lib/analytics/index.ts).
- [x] Existe integração com PostHog no backend em [AB0-1-back/config/initializers/posthog.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/config/initializers/posthog.rb).
- [x] Existe dicionário de eventos em [docs/analytics/EVENT_DICTIONARY.md](/Users/felipemorais/Avalia-Solar-2026/docs/analytics/EVENT_DICTIONARY.md).
- [x] O lead wizard já tem uma jornada parcialmente instrumentada.
- [x] Existem sinais de duplicidade e fragmentação entre frontend, backend, GA4, GTM e aliases legados.
- [x] O principal problema atual não é falta de tracking, e sim falta de governança, padronização e funis executivos.

### Veredito sênior

- [x] O stack atual está `instrumentado, mas não governado`.
- [x] O produto ainda não opera o PostHog como source of truth real de produto.
- [x] O time ainda precisa separar eventos de negócio, eventos de jornada e eventos diagnósticos.
- [x] O tracking atual está mais maduro para lead generation do que para ativação B2B, retenção e monetização.

---

## 2. Target State

### Estado desejado

- [ ] PostHog ser a fonte principal de leitura de comportamento de produto.
- [ ] Todos os eventos core terem nome, owner, schema e critério de aceite.
- [ ] Existirem dois funis canônicos de marketplace:
  - [ ] funil de demanda
  - [ ] funil de ativação da empresa
- [ ] Existir um funil de monetização.
- [ ] O time conseguir responder rapidamente:
  - [ ] qual canal gera lead qualificado
  - [ ] qual etapa do wizard derruba mais conversão
  - [ ] quais empresas ativam mais rápido
  - [ ] quais gatilhos aumentam upgrade
- [ ] O tracking não enviar PII para PostHog.
- [ ] O time ter alertas de quebra de ingestão e regressão de volume.

---

## 3. North Star E KPI Tree

### North Star Metric sugerida

- [ ] Definir oficialmente `Qualified Leads Verified per Week` como candidata a North Star.
- [ ] Validar com PO e liderança a definição exata:
  - [ ] lead com OTP verificado
  - [ ] distribuído para pelo menos 1 empresa elegível
  - [ ] sem duplicidade

### KPIs de suporte

- [ ] Visitor -> Profile View Rate
- [ ] Profile View -> CTA Click Rate
- [ ] CTA Click -> Wizard Start Rate
- [ ] Wizard Start -> Contact Submit Rate
- [ ] Contact Submit -> OTP Verify Rate
- [ ] OTP Verify -> Lead Created Rate
- [ ] Lead Created -> Lead Dispatched Rate
- [ ] Company Activation Rate
- [ ] Time to First Lead
- [ ] Upgrade View -> Upgrade Start Rate
- [ ] Upgrade Start -> Upgrade Complete Rate

---

## 4. Taxonomia De Eventos V2

### Regras gerais

- [ ] Padronizar eventos com convenção única.
- [ ] Evitar nomes genéricos como `click`, `view`, `lead`.
- [ ] Separar explicitamente:
  - [ ] `core business events`
  - [ ] `journey events`
  - [ ] `diagnostic events`
- [ ] Todo evento core deve ter:
  - [ ] descrição
  - [ ] owner
  - [ ] producer
  - [ ] consumer
  - [ ] required properties
  - [ ] optional properties
  - [ ] exemplo de payload

### Core business events recomendados

- [ ] `landing_viewed`
- [ ] `category_selected`
- [ ] `company_list_viewed`
- [ ] `company_profile_viewed`
- [ ] `company_cta_clicked`
- [ ] `wizard_started`
- [ ] `wizard_contact_submitted`
- [ ] `otp_verified`
- [ ] `lead_created`
- [ ] `lead_dispatched`
- [ ] `review_created`
- [ ] `company_registered`
- [ ] `company_profile_completed`
- [ ] `first_profile_view_received`
- [ ] `first_cta_click_received`
- [ ] `first_lead_received`
- [ ] `dashboard_viewed`
- [ ] `upgrade_viewed`
- [ ] `upgrade_started`
- [ ] `checkout_started`
- [ ] `upgrade_completed`
- [ ] `subscription_canceled`

### Journey events recomendados

- [ ] `wizard_step_viewed`
- [ ] `wizard_step_completed`
- [ ] `wizard_abandoned`
- [ ] `wizard_otp_viewed`
- [ ] `wizard_otp_resend_clicked`
- [ ] `search_performed`
- [ ] `search_no_results`
- [ ] `faq_expanded`
- [ ] `faq_voted_up`
- [ ] `faq_voted_down`

### Diagnostic events recomendados

- [ ] `page_view`
- [ ] `web_vital`
- [ ] `micro_interaction`
- [ ] `tracking_validation_failed`
- [ ] `analytics_ingestion_blocked`

### Required properties globais

- [ ] `session_id`
- [ ] `distinct_id`
- [ ] `pathname`
- [ ] `source`
- [ ] `utm_source`
- [ ] `utm_medium`
- [ ] `utm_campaign`
- [ ] `platform`
- [ ] `device_type`
- [ ] `is_logged_in`
- [ ] `event_id`
- [ ] `tracked_at`

### Required properties contextuais

- [ ] `company_id` quando o evento for de empresa
- [ ] `category_id` quando o evento for de descoberta/busca
- [ ] `plan_tier` quando o evento for de monetização ou ativação B2B
- [ ] `step_index` e `step_name` quando o evento for de wizard
- [ ] `distributed_count` quando o evento for de distribuição de lead

### Cleanup de legado

- [ ] Inventariar aliases legados aceitos no backend.
- [ ] Marcar todos com status `deprecated`.
- [ ] Definir data de sunset por alias.
- [ ] Remover aliases do código após migração concluída.

---

## 5. Funis Canônicos

### Funil 1: Demanda / Lead Generation

- [ ] `landing_viewed`
- [ ] `category_selected`
- [ ] `company_profile_viewed`
- [ ] `company_cta_clicked`
- [ ] `wizard_started`
- [ ] `wizard_contact_submitted`
- [ ] `otp_verified`
- [ ] `lead_created`

### Funil 2: Qualidade do Wizard

- [ ] `wizard_started`
- [ ] `wizard_step_completed`
- [ ] `wizard_contact_submitted`
- [ ] `otp_verified`
- [ ] `lead_dispatched`

### Funil 3: Ativação da Empresa

- [ ] `company_registered`
- [ ] `company_profile_completed`
- [ ] `first_profile_view_received`
- [ ] `first_cta_click_received`
- [ ] `first_lead_received`
- [ ] `dashboard_viewed`

### Funil 4: Monetização

- [ ] `upgrade_viewed`
- [ ] `upgrade_started`
- [ ] `checkout_started`
- [ ] `upgrade_completed`

---

## 6. Épicos, Stories E Tasks

## Épico 1: Governança Analítica Unificada

### Objetivo do PO

- [ ] Criar uma linguagem única de analytics para que produto, growth, dados e engenharia leiam o mesmo negócio.

### User Story 1.1

- [ ] Como PM, quero um dicionário canônico de eventos para que todas as squads usem os mesmos nomes e propriedades.

#### Tasks

- [ ] Revisar [docs/analytics/EVENT_DICTIONARY.md](/Users/felipemorais/Avalia-Solar-2026/docs/analytics/EVENT_DICTIONARY.md).
- [ ] Criar versão v2 com `core`, `journey` e `diagnostic`.
- [ ] Adicionar examples de payload.
- [ ] Adicionar owner por evento.
- [ ] Adicionar consumer principal por evento.

#### Critérios de aceite

- [ ] 100% dos eventos core documentados com schema mínimo.
- [ ] Documento aprovado por PO, frontend e backend.

### User Story 1.2

- [ ] Como engenheiro, quero schemas mínimos por evento para evitar payload inconsistente.

#### Tasks

- [ ] Listar required properties globais.
- [ ] Listar required properties por tipo de evento.
- [ ] Criar validação de payload backend para eventos core.
- [ ] Criar testes automatizados para payload inválido.

#### Critérios de aceite

- [ ] Eventos core inválidos falham de forma observável.
- [ ] O backend loga ou rejeita payload inconsistente.

### User Story 1.3

- [ ] Como PO, quero ownership explícito para que ninguém mude tracking crítico sem responsabilidade.

#### Tasks

- [ ] Definir owner por evento core.
- [ ] Definir owner por dashboard.
- [ ] Definir owner por funil.
- [ ] Criar regra de PR para alterações em tracking.

#### Critérios de aceite

- [ ] Toda mudança em evento core exige revisão do owner.

---

## Épico 2: Funil Canônico De Demanda

### Objetivo do PO

- [ ] Medir claramente do tráfego até lead criado e identificar onde a conversão cai.

### User Story 2.1

- [ ] Como growth, quero medir aquisição até lead criado para priorizar canais e superfícies.

#### Tasks

- [ ] Instrumentar `landing_viewed`.
- [ ] Instrumentar `category_selected`.
- [ ] Instrumentar `company_list_viewed`.
- [ ] Instrumentar `company_profile_viewed`.
- [ ] Instrumentar `company_cta_clicked`.
- [ ] Garantir UTM e source em toda a jornada.

#### Critérios de aceite

- [ ] Funil de demanda disponível no PostHog com breakdown por canal.

### User Story 2.2

- [ ] Como PM, quero ver drop-off do wizard por etapa para reduzir abandono.

#### Tasks

- [ ] Revisar eventos atuais do wizard em [useLeadWizard.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/src/modules/leadWizard/hooks/useLeadWizard.ts).
- [ ] Padronizar `wizard_started`.
- [ ] Padronizar `wizard_step_viewed`.
- [ ] Padronizar `wizard_step_completed`.
- [ ] Criar `wizard_contact_submitted`.
- [ ] Diferenciar `otp_verified` de `lead_created`.
- [ ] Instrumentar `lead_dispatched`.

#### Critérios de aceite

- [ ] Drop-off por etapa visível no PostHog.
- [ ] `lead_created` não representa mais múltiplos significados.

### User Story 2.3

- [ ] Como time comercial, quero distinguir lead bruto de lead validado para não contaminar indicadores.

#### Tasks

- [ ] Definir semanticamente `wizard_contact_submitted`.
- [ ] Definir semanticamente `otp_verified`.
- [ ] Definir semanticamente `lead_created`.
- [ ] Definir semanticamente `lead_dispatched`.
- [ ] Garantir emissão correta no backend.

#### Critérios de aceite

- [ ] Os quatro eventos aparecem separados no PostHog.

---

## Épico 3: Ativação E Valor Entregue Para Empresas

### Objetivo do PO

- [ ] Medir se empresas realmente chegam ao primeiro valor.

### User Story 3.1

- [ ] Como PO do marketplace, quero medir ativação da empresa para entender retenção futura.

#### Tasks

- [ ] Instrumentar `company_registered`.
- [ ] Instrumentar `company_profile_completed`.
- [ ] Instrumentar `dashboard_viewed`.
- [ ] Definir lógica de `first_profile_view_received`.
- [ ] Definir lógica de `first_cta_click_received`.
- [ ] Definir lógica de `first_lead_received`.

#### Critérios de aceite

- [ ] Dashboard de ativação da empresa disponível no PostHog.

### User Story 3.2

- [ ] Como growth B2B, quero comparar ativação por plano e tipo de empresa.

#### Tasks

- [ ] Enviar `plan_tier` como property.
- [ ] Enviar `company_segment` como property.
- [ ] Enviar `profile_completion_pct` como property.
- [ ] Criar cohort por plano.
- [ ] Criar cohort por segmento.

#### Critérios de aceite

- [ ] É possível comparar free vs paid.

### User Story 3.3

- [ ] Como CS/comercial, quero medir tempo até primeiro valor para agir em contas estagnadas.

#### Tasks

- [ ] Definir “primeiro valor”.
- [ ] Criar insight de tempo até `first_lead_received`.
- [ ] Criar filtro por data de cadastro.
- [ ] Criar breakdown por plano.

#### Critérios de aceite

- [ ] Tempo até primeiro valor disponível no PostHog.

---

## Épico 4: Monetização E Expansão

### Objetivo do PO

- [ ] Medir quais gatilhos geram receita e quais planos convertem melhor.

### User Story 4.1

- [ ] Como PM, quero ver o funil de upgrade para entender conversão para receita.

#### Tasks

- [ ] Instrumentar `upgrade_viewed`.
- [ ] Instrumentar `upgrade_started`.
- [ ] Instrumentar `checkout_started`.
- [ ] Instrumentar `upgrade_completed`.
- [ ] Instrumentar `subscription_canceled`.

#### Critérios de aceite

- [ ] Funil de upgrade disponível no PostHog.

### User Story 4.2

- [ ] Como growth, quero saber quais triggers de upsell performam melhor.

#### Tasks

- [ ] Enviar `trigger_location`.
- [ ] Enviar `current_plan`.
- [ ] Enviar `target_plan`.
- [ ] Enviar `revenue`.
- [ ] Criar breakdown por trigger.

#### Critérios de aceite

- [ ] O dashboard mostra conversão por trigger de upsell.

---

## Épico 5: Qualidade, Confiabilidade E Observabilidade

### Objetivo do PO

- [ ] Garantir que o dado de produto seja confiável o suficiente para decisão executiva.

### User Story 5.1

- [ ] Como analytics owner, quero detectar quebra de tracking antes que o dashboard engane o time.

#### Tasks

- [ ] Criar alertas para queda abrupta de `landing_viewed`.
- [ ] Criar alertas para queda abrupta de `wizard_started`.
- [ ] Criar alertas para queda abrupta de `lead_created`.
- [ ] Criar alertas para queda abrupta de `upgrade_completed`.

#### Critérios de aceite

- [ ] Alertas operacionais ativos.

### User Story 5.2

- [ ] Como engenheiro, quero testes automatizados de tracking para evitar regressão silenciosa.

#### Tasks

- [ ] Adicionar testes frontend para eventos core.
- [ ] Adicionar testes backend para payload core.
- [ ] Adicionar smoke tests do endpoint de analytics.
- [ ] Adicionar teste de dedupe.

#### Critérios de aceite

- [ ] Eventos core cobertos por testes automatizados.

### User Story 5.3

- [ ] Como PO, quero confiar que o PostHog não recebe PII indevida.

#### Tasks

- [ ] Revisar payloads enviados ao PostHog.
- [ ] Garantir que e-mail, telefone e nome pessoal não sejam enviados como property comum.
- [ ] Revisar `distinct_id`.
- [ ] Revisar `identify`.
- [ ] Revisar `alias`.

#### Critérios de aceite

- [ ] Política de anti-PII validada e documentada.

---

## 7. Dashboards E Insights Necessários No PostHog

### Dashboard 1: Aquisição E Conversão

- [ ] Criar dashboard de aquisição.
- [ ] Adicionar funil `landing_viewed -> lead_created`.
- [ ] Adicionar breakdown por `utm_source`.
- [ ] Adicionar breakdown por `category_id`.
- [ ] Adicionar breakdown por device.

### Dashboard 2: Wizard Conversion

- [ ] Criar funil do wizard.
- [ ] Adicionar abandono por etapa.
- [ ] Adicionar tempo médio por step.
- [ ] Adicionar breakdown por categoria.

### Dashboard 3: Ativação B2B

- [ ] Criar dashboard de ativação da empresa.
- [ ] Adicionar tempo até primeiro valor.
- [ ] Adicionar breakdown por plano.
- [ ] Adicionar breakdown por segmento.

### Dashboard 4: Monetização

- [ ] Criar dashboard de monetização.
- [ ] Adicionar `upgrade_viewed -> upgrade_completed`.
- [ ] Adicionar receita por plano.
- [ ] Adicionar taxa de cancelamento.

### Dashboard 5: Data Quality

- [ ] Criar dashboard de saúde do tracking.
- [ ] Adicionar volume por evento core.
- [ ] Adicionar eventos inválidos ou rejeitados.
- [ ] Adicionar alerta de regressão de volume.

---

## 8. Rollout Técnico

### Frontend

- [ ] Revisar chamadas de `track()` no frontend.
- [ ] Revisar wrappers analytics legados.
- [ ] Garantir uso da camada canônica em [AB0-1-front/lib/analytics/index.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/lib/analytics/index.ts).
- [ ] Revisar identify no auth flow.
- [ ] Revisar alias na costura de identidade.
- [ ] Garantir consentimento antes do PostHog.

### Backend

- [ ] Revisar captures diretos com `PostHog.capture`.
- [ ] Revisar coexistência com `Analytics::TrackEventService`.
- [ ] Decidir qual caminho é canônico para eventos core.
- [ ] Garantir schema validation nos endpoints.
- [ ] Revisar initializer em [posthog.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/config/initializers/posthog.rb).

### PostHog Workspace

- [ ] Revisar projeto ativo.
- [ ] Revisar dashboards existentes.
- [ ] Revisar insights existentes.
- [ ] Remover dashboards obsoletos ou ambíguos.
- [ ] Criar dashboards oficiais por domínio.
- [ ] Criar annotations para releases relevantes.

---

## 9. Priorização

### P0

- [ ] Unificar taxonomia de eventos core.
- [ ] Fechar funil canônico de demanda.
- [ ] Separar `otp_verified`, `lead_created` e `lead_dispatched`.
- [ ] Criar dashboard executivo de aquisição e conversão.
- [ ] Criar validação de payload para eventos core.

### P1

- [ ] Instrumentar ativação da empresa.
- [ ] Criar cohorts por plano e segmento.
- [ ] Criar funil de upgrade.
- [ ] Limpar aliases legados.

### P2

- [ ] Criar alertas automáticos.
- [ ] Criar score de qualidade de lead.
- [ ] Criar análises de retenção.
- [ ] Conectar analytics a roadmap de experimentos.

---

## 10. Plano Em 3 Sprints

### Sprint 1

- [ ] Aprovar taxonomia v2.
- [ ] Atualizar dicionário de eventos.
- [ ] Padronizar funil de demanda.
- [ ] Ajustar wizard events.
- [ ] Criar dashboard de aquisição e conversão.

### Sprint 2

- [ ] Instrumentar ativação de empresas.
- [ ] Criar dashboard B2B.
- [ ] Criar cohorts por plano e segmento.
- [ ] Medir tempo até primeiro valor.

### Sprint 3

- [ ] Instrumentar monetização.
- [ ] Criar dashboard de receita.
- [ ] Criar alertas de data quality.
- [ ] Remover aliases legados restantes.
- [ ] Encerrar documentação final.

---

## 11. Definições Que O PO Precisa Fechar

- [ ] O que conta como `lead_created` oficialmente.
- [ ] O que conta como `lead_qualificado`.
- [ ] O que conta como `lead_dispatched`.
- [ ] O que conta como `primeiro valor` para empresa.
- [ ] Qual é a north star oficial.
- [ ] Qual é o owner final de cada dashboard.
- [ ] Qual é a meta por etapa de funil.

---

## 12. Definition Of Done

- [ ] Taxonomia v2 aprovada e publicada.
- [ ] Eventos core instrumentados com schema consistente.
- [ ] Funil de demanda visível no PostHog.
- [ ] Funil de ativação da empresa visível no PostHog.
- [ ] Funil de monetização visível no PostHog.
- [ ] Dashboards executivos publicados.
- [ ] Eventos legados em sunset plan.
- [ ] Testes de tracking implementados.
- [ ] Alertas de quebra ativos.
- [ ] Política anti-PII validada.

---

## 13. Referências

- [EVENT_DICTIONARY.md](/Users/felipemorais/Avalia-Solar-2026/docs/analytics/EVENT_DICTIONARY.md)
- [GTM_TAG_MATRIX.md](/Users/felipemorais/Avalia-Solar-2026/docs/analytics/GTM_TAG_MATRIX.md)
- [posthog.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/config/initializers/posthog.rb)
- [index.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/lib/analytics/index.ts)
- [useLeadWizard.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/src/modules/leadWizard/hooks/useLeadWizard.ts)
- [posthog-setup-report.md](/Users/felipemorais/Avalia-Solar-2026/posthog-setup-report.md)

