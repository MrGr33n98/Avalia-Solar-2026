# ActiveAdmin System Blueprint

Status: `draft`  
Owner sugerido: `PO + Backend + Operations + Trust & Safety`  
Última atualização: `2026-03-13`

## Objetivo

Mapear o ActiveAdmin do Avalia Solar como sistema operacional interno: quem usa, para quê, quando entra no fluxo, quais informações trafegam, quais gates existem, quais permissões protegem cada etapa e como evoluir isso de forma segura.

Este blueprint foi montado para servir como documento-mãe de arquitetura operacional do backoffice.

---

## 1. Executive Summary

O ActiveAdmin atual não é apenas um CRUD administrativo. Ele funciona como uma central de:

- moderação de empresas
- aprovação e rejeição de reviews
- triagem de solicitações de acesso empresarial
- revisão de mudanças pendentes
- operação comercial de planos, assinaturas e patrocinados
- gestão de conteúdo, banners, categorias, FAQs e ativos do marketplace
- auditoria e rastreabilidade

Hoje a superfície do admin já é ampla, mas a governança está implícita no código e distribuída entre:

- ActiveAdmin resources em `app/admin`
- autenticação Devise de `AdminUser`
- 2FA
- Pundit com `ApplicationPolicy`
- estados de moderação nos próprios modelos
- callbacks de negócio nos modelos e services

O principal gap não é ausência de funcionalidade. O principal gap é ausência de um mapa operacional único que explique:

- quem pode fazer o quê
- em qual momento do ciclo de vida
- com qual justificativa de negócio
- com qual gate
- com qual consequência downstream

Este documento resolve isso.

---

## 2. Fontes Estruturais

- [active_admin.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/config/initializers/active_admin.rb)
- [application_controller.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/controllers/admin/application_controller.rb)
- [admin_user.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/admin_user.rb)
- [application_policy.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/policies/application_policy.rb)
- [page_policy.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/policies/active_admin/page_policy.rb)
- [routes.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/config/routes.rb)

Recursos operacionais mais críticos:

- [companies.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/companies.rb)
- [company_access_requests.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/company_access_requests.rb)
- [pending_changes.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/pending_changes.rb)
- [reviews.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/reviews.rb)
- [banners.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/banners.rb)
- [leads.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/leads.rb)
- [plans.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/plans.rb)
- [subscription_plans.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/subscription_plans.rb)

---

## 3. Arquitetura Base

### 3.1 Entry Point

O backoffice entra por `ActiveAdmin.routes(self)` em [routes.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/config/routes.rb), com autenticação Devise para `AdminUser`.

### 3.2 Autenticação

O ActiveAdmin exige:

- `authenticate_admin_user!`
- `current_admin_user`
- logout próprio de admin

Definido em [active_admin.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/config/initializers/active_admin.rb).

### 3.3 2FA

O `AdminUser` usa:

- `:two_factor_authenticatable`
- `otp_secret_encryption_key`
- backup codes

Definido em [admin_user.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/admin_user.rb), com rotas próprias em `/admin/two_factor`.

### 3.4 Autorização

A autorização do admin usa:

- `ActiveAdmin::PunditAdapter`
- `ApplicationPolicy` como default policy

No estado atual, a regra base é ampla: `AdminUser` pode tudo, salvo policy específica.

### 3.5 Bridge de contexto

`Admin::ApplicationController` cria bridge de `current_user => current_admin_user`, o que permite reuso de helpers e callbacks que esperavam `current_user`.

Isso é útil, mas também é um ponto de atenção porque reduz a separação conceitual entre:

- operador interno
- usuário final

---

## 4. Atores Do Sistema

## 4.1 AdminUser

Usuário interno autenticado no ActiveAdmin.

Capacidades observadas no sistema atual:

- aprovar e rejeitar empresas
- aprovar e rejeitar reviews
- aprovar e rejeitar banners
- aprovar e rejeitar access requests
- aprovar e aplicar pending changes
- operar planos, assinaturas e patrocinados
- editar conteúdo e catálogos
- auditar histórico

## 4.2 Company User

Usuário externo vinculado a empresa, fora do ActiveAdmin.

Interage com o admin indiretamente quando:

- solicita acesso à empresa
- envia mudanças que viram `PendingChange`
- depende de aprovação de empresa
- depende de feature gates do plano

## 4.3 End User / Marketplace User

Usuário final do produto.

Interage com o admin indiretamente via:

- reviews
- leads
- downloads
- navegação do marketplace

## 4.4 Operations / Trust & Safety / Comercial / Conteúdo

No código, quase tudo parece cair sob um único papel técnico de `AdminUser`. Operacionalmente, isso deveria ser decomposto em perfis funcionais.

Perfis recomendados:

- `super_admin`
- `trust_safety_admin`
- `content_admin`
- `commercial_admin`
- `support_admin`
- `finance_admin`
- `read_only_admin`

Hoje esses perfis ainda não estão claramente implementados no código.

---

## 5. Mapa Do ActiveAdmin Por Domínio

## 5.1 Trust & Safety / Moderação

Recursos:

- `companies`
- `reviews`
- `pending_changes`
- `company_access_requests`
- `banners`
- possivelmente `forum_questions`, `forum_answers`, `campaign_reviews`

Finalidade:

- validar integridade da oferta exibida ao mercado
- impedir conteúdo indevido
- controlar publicação de reputação e prova social
- manter trilha de decisão humana

## 5.2 Growth / Marketplace Operations

Recursos:

- `categories`
- `products`
- `pricings`
- `badges`
- `feature_groups`
- `ranking_preview`
- `contents`
- `downloadables`
- `faqs`
- `articles`

Finalidade:

- estruturar discovery
- controlar ranking, taxonomia e conteúdo
- manter superfícies públicas coerentes

## 5.3 Commercial / Revenue Operations

Recursos:

- `plans`
- `subscription_plans`
- `sponsored_plans`
- `banner_offers`
- `banner_subscriptions`
- `saas_leads`

Finalidade:

- definir catálogo de planos
- controlar acesso por feature
- operar receita recorrente e visibilidade patrocinada

## 5.3.1 Deep Dive: Aba Plans

A aba `Plans` é uma das áreas mais sensíveis do ActiveAdmin porque ela não controla só preço. Ela controla:

- catálogo comercial
- entitlement por feature
- comportamento de experiência no marketplace
- acesso a recursos premium por empresa
- operação de assinaturas
- lógica de patrocinado

Na prática, `Plans` é um painel de monetização + gating de produto.

### Componentes da aba

#### 1. Catálogo de planos

Arquivo principal:

- [plans.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/plans.rb)

Modelos e catálogo de features:

- [plan.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/plan.rb)
- [plan_feature_catalog.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/plan_feature_catalog.rb)

Responsabilidade:

- definir nome, descrição e preço do plano
- inferir tier (`free`, `pro`, `enterprise`)
- configurar bundle de features
- validar dependências entre features
- gerar payload canônico de acesso

#### 2. Gestão de assinaturas SaaS

Arquivo:

- [subscription_plans.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/subscription_plans.rb)

Responsabilidade:

- vincular usuário comprador, produto, categoria e plano
- controlar status temporal da assinatura
- ativar e expirar ciclos
- consultar valor contratado e valor efetivo

#### 3. Gestão de patrocinados

Arquivo:

- [sponsored_plans.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/sponsored_plans.rb)

Responsabilidade:

- controlar presença patrocinada
- vincular produto, categoria e plano
- ligar/desligar visibilidade patrocinada
- armazenar CTA customizado e janela temporal

### O que a aba Plans governa de verdade

#### Governança de visibilidade pública

- descrição patrocinada
- banner promocional
- tabela de preços
- ofertas especiais
- links e CTAs customizados

#### Governança de conversão

- `custom_ctas`
- `pricing_table`
- `special_offer`
- `promo_banner`

#### Governança de confiança

- `verified_product`
- `highlight_badges`
- `featured_review`
- `social_proof`
- `forum_highlight`

#### Governança de conteúdo

- `downloadable_materials`
- `media_gallery`
- `media_upload`
- `faq_block`

#### Governança de insights e operação premium

- `advanced_analytics`
- `leads_marketplace`
- `financing_simulation`
- `intent_scores`
- `webhooks`
- `sector_question_limit`

#### Governança do comportamento competitivo no marketplace

- `show_alternatives`
- `show_competitor_banners`

### Feature groups da aba Plans

Conforme [plans.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/plans.rb) e [plan_feature_catalog.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/plan_feature_catalog.rb), as features são organizadas em:

- `public_profile`
- `conversion`
- `trust`
- `content`
- `marketplace_behavior`
- `insights`

Essa estrutura é importante porque a aba `Plans` não deve ser lida como lista plana de checkboxes. Ela é uma matriz de acesso por dimensão de valor.

### Tiers e defaults

O sistema trabalha com três tiers:

- `free`
- `pro`
- `enterprise`

Defaults observados:

- `free`: baseline com features mínimas
- `pro`: libera boa parte do pacote comercial, trust e analytics
- `enterprise`: libera pacote completo, incluindo `leads_marketplace`, `webhooks`, `intent_scores` e limites maiores

### Validações estruturais do plano

O modelo [plan.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/plan.rb) já impõe regras importantes:

- `pricing_table` e `special_offer` exigem `custom_ctas`
- `intent_scores` exige `advanced_analytics`
- `webhooks` exige `intent_scores`

Isso mostra que a aba `Plans` já opera como sistema de dependência entre capacidades de produto, não apenas toggles independentes.

### Fluxo de informação da aba Plans

#### Entrada

Operador interno define:

- preço
- tier
- descrição comercial
- set de features
- overrides sobre defaults

#### Processamento

O sistema:

- normaliza payloads
- aplica defaults por tier
- interpreta aliases legados
- valida dependências
- gera `feature_flags` canônicos

#### Saída

Esses dados alimentam:

- acesso de empresa no perfil
- elegibilidade de prova social
- blocos públicos e comerciais
- visibilidade competitiva
- analytics premium
- leads premium
- financiamento
- webhooks e intent scoring

### Quem usa a aba Plans

#### Ator principal atual

- `AdminUser`

#### Papéis recomendados

- `commercial_admin`
- `finance_admin`
- `super_admin`

#### Quem não deveria alterar Plans diretamente

- `content_admin`
- `support_admin`
- `trust_safety_admin`
- `read_only_admin`

### Quando a aba Plans entra no fluxo operacional

#### 1. Criação de catálogo

Quando o time define novos planos ou reposiciona o produto.

#### 2. Ajuste de feature gating

Quando o time muda o pacote de valor por tier.

#### 3. Venda ou onboarding comercial

Quando uma assinatura precisa ser criada, ativada, expirada ou corrigida.

#### 4. Operação de patrocinado

Quando um produto ou empresa recebe destaque pago.

#### 5. Troubleshooting

Quando uma empresa não enxerga um recurso, o admin usa a aba para entender:

- plano atribuído
- tier inferido
- feature flags efetivas
- inconsistências entre plano e comportamento esperado

### Gates da aba Plans

#### Gate 1: autenticação admin

- exige `AdminUser`
- exige 2FA no fluxo administrativo

#### Gate 2: autorização

Hoje tende a ser amplo para qualquer `AdminUser`, mas o target state deveria restringir edição a papéis comerciais/financeiros.

#### Gate 3: dependências internas entre features

Exemplos:

- não existe `pricing_table` sem `custom_ctas`
- não existe `webhooks` sem `intent_scores`

#### Gate 4: janela temporal de assinatura

Em `SubscriptionPlan`, o acesso depende de:

- status
- `start_at`
- `end_at`

#### Gate 5: patrocínio ativo

Em `SponsoredPlan`, o destaque depende de:

- `active`
- período de vigência

### Superfícies e telas da aba Plans

#### Plans

Mostra:

- nome
- tier inferido
- preço
- quantidade de features ativas
- payload canônico
- grupos de feature

Permite:

- criar plano
- editar plano
- revisar preview do payload

#### Subscription Plans

Mostra:

- comprador
- empresa
- produto
- categoria
- plano
- valor
- status
- datas de ciclo

Permite:

- criar assinatura manual
- ativar em lote
- expirar em lote

#### Sponsored Plans

Mostra:

- cliente
- produto
- categoria
- plano
- CTA customizado
- vigência
- ativo/inativo

Permite:

- operar destaque pago manualmente

### Impacto downstream em Companies

A aba `Plans` impacta diretamente a experiência da empresa no admin e na superfície pública.

Ela conversa especialmente com:

- preview de acesso por plano em [companies.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/admin/companies.rb)
- `feature_access`
- `inferred_plan_tier`
- `can_use_social_proof?`

Na prática, isso significa:

- uma mudança em `Plans` altera a experiência de múltiplas empresas
- a aba `Companies` já funciona parcialmente como consumidor operacional da aba `Plans`

### Impacto downstream em analytics e monetização

A aba `Plans` deveria alimentar métricas como:

- empresas por tier
- receita por tier
- feature adoption por tier
- tempo até ativação por tier
- taxa de upgrade por tier
- uso de social proof por tier
- uso de analytics premium por tier

Hoje isso está mais implícito do que formalizado.

### Riscos operacionais da aba Plans

#### Risco 1

Alteração manual de feature com impacto sistêmico imediato.

Exemplo:

- desabilitar `custom_ctas` pode quebrar conversão em múltiplas empresas

#### Risco 2

Inconsistência entre catálogo de plano e assinatura aplicada.

Exemplo:

- assinatura ativa apontando para plano incorreto

#### Risco 3

Mistura de responsabilidades de pricing, entitlement e sponsorship na mesma área sem trilha forte de change control.

#### Risco 4

Aliases legados mascararem comportamento real.

Exemplo:

- `active_admin` ainda funciona como alias de `custom_ctas`

#### Risco 5

Operação manual de assinatura sem reconciliação com billing externo.

### Controles recomendados para a aba Plans

- criar papel explícito `commercial_admin`
- criar papel explícito `finance_admin`
- exigir comentário obrigatório em mudanças de feature gating
- registrar diff de `feature_flags` antes/depois
- impedir edição de certas features sem dupla aprovação
- criar auditoria específica para mudança de plano e assinatura
- criar dashboard operacional da monetização

### Recomendações de lineup inicial de planos

Para o início da operação, eu não recomendo lançar quatro nomes muito próximos como `Basic`, `Pro`, `Professional` e `Enterprise`.

Motivo:

- `Pro` e `Professional` tendem a gerar confusão comercial
- aumentam complexidade operacional cedo demais
- dificultam posicionamento
- criam mais espaço para edge cases de entitlement, suporte e pricing

#### Recomendação principal

Lançar com três planos:

- `Basic`
- `Pro`
- `Enterprise`

Se quiser um quarto nível no futuro, ele deveria nascer de um uso real claro, e não por simetria de tabela.

#### Estrutura recomendada

##### 1. Basic

Objetivo:

- presença válida no marketplace
- vitrine mínima profissional
- entrada comercial de baixo atrito

Features sugeridas:

- [ ] `product_description`
- [ ] `product_features_block`
- [ ] `company_links_block`
- [ ] `show_alternatives`
- [ ] `show_competitor_banners`

Opcionalmente manter:

- [ ] `faq_block` apenas se o time quiser um Basic mais competitivo

Não incluir no início:

- [ ] `custom_ctas`
- [ ] `pricing_table`
- [ ] `special_offer`
- [ ] `verified_product`
- [ ] `highlight_badges`
- [ ] `featured_review`
- [ ] `social_proof`
- [ ] `downloadable_materials`
- [ ] `media_gallery`
- [ ] `advanced_analytics`
- [ ] `leads_marketplace`
- [ ] `intent_scores`
- [ ] `webhooks`

Leitura estratégica:

- `Basic` deve vender descoberta e presença, não performance.

##### 2. Pro

Objetivo:

- transformar perfil em máquina de conversão
- liberar prova social
- liberar assets ricos
- dar visibilidade melhor da performance

Features sugeridas:

- [ ] tudo do `Basic`
- [ ] `ideal_customer_block`
- [ ] `custom_ctas`
- [ ] `pricing_table`
- [ ] `special_offer`
- [ ] `promo_banner`
- [ ] `verified_product`
- [ ] `highlight_badges`
- [ ] `featured_review`
- [ ] `social_proof`
- [ ] `downloadable_materials`
- [ ] `media_gallery`
- [ ] `media_upload`
- [ ] `faq_block`
- [ ] `advanced_analytics`
- [ ] `financing_simulation`
- [ ] `sector_question_limit` com limite intermediário
- [ ] `show_alternatives = false`
- [ ] `show_competitor_banners = false`

Leitura estratégica:

- `Pro` deve ser o plano principal de venda.
- ele entrega o salto mais nítido de valor para a maioria das empresas.

##### 3. Enterprise

Objetivo:

- operação avançada
- integrações
- inteligência comercial
- gestão orientada a dados

Features sugeridas:

- [ ] tudo do `Pro`
- [ ] `leads_marketplace`
- [ ] `intent_scores`
- [ ] `webhooks`
- [ ] `sector_question_limit` alto

Leitura estratégica:

- `Enterprise` deve ser vendido como plano de escala, operação e integração.
- ele não precisa existir para todo cliente; ele existe para contas com maturidade maior.

#### O que eu não recomendo no lançamento

##### Não lançar `Professional` separado de `Pro`

Razões:

- diferença semântica fraca
- piora clareza comercial
- aumenta suporte e dúvidas
- força o time a inventar um degrau artificial

##### Não lançar muitos subníveis baseados só em quantidade de features

Razões:

- o produto ainda está consolidando governança de entitlement
- mais planos significam mais suporte, mais edge cases e mais risco

#### Se insistirem em 4 planos

Se a operação realmente quiser quatro planos desde o começo, a melhor estrutura seria:

- `Starter`
- `Basic`
- `Pro`
- `Enterprise`

E não:

- `Basic`
- `Pro`
- `Professional`
- `Enterprise`

Porque `Starter` é semanticamente claro como degrau de entrada, enquanto `Pro` e `Professional` competem entre si.

#### Embalagem comercial recomendada no início

##### Basic

Promessa:

- "Sua empresa presente e encontrável no marketplace"

##### Pro

Promessa:

- "Sua empresa com mais conversão, confiança e destaque"

##### Enterprise

Promessa:

- "Sua operação com inteligência, integrações e escala"

#### Linha mestra de rollout

- [ ] lançar `Basic`
- [ ] lançar `Pro`
- [ ] lançar `Enterprise`
- [ ] validar adoção e conversão por tier
- [ ] só depois considerar um quarto plano

#### Recomendação final

Se eu estivesse definindo a operação inicial com base no que o admin já consegue governar hoje, eu implementaria:

- `Basic`
- `Pro`
- `Enterprise`

E colocaria `Pro` como plano foco de receita.

O `Enterprise` fica como camada de expansão para contas com maior maturidade, e o `Basic` como porta de entrada.

### Blueprint de evolução específico da aba Plans

#### Step P1: Inventário de regras de entitlement

Objetivo:

- documentar cada feature, grupo, alias, dependência e impacto de negócio

#### Step P2: Matriz de permissão comercial/financeira

Objetivo:

- separar quem pode editar catálogo, assinatura e patrocinado

#### Step P3: Change control de Plans

Objetivo:

- transformar mudança de feature gating em operação auditável

#### Step P4: Reconciliação catálogo x assinatura x empresa

Objetivo:

- garantir consistência entre `Plan`, `SubscriptionPlan`, `SponsoredPlan` e `Company.feature_access`

#### Step P5: Observabilidade de monetização

Objetivo:

- medir efeito real dos planos nas capacidades e no valor entregue

## 5.4 CRM / Lead Operations

Recursos:

- `leads`
- `lead_distributions`

Finalidade:

- acompanhar volume de leads
- conferir roteamento/distribuição
- eventualmente importar ou corrigir base

## 5.5 Company Backoffice Support

Recursos:

- `company_members`
- `company_faqs`
- `company_financing_offers`
- `company_financing_partners`
- `company_financing_profiles`
- `company_sector_questions`

Finalidade:

- apoiar operação da presença da empresa no marketplace
- editar componentes especializados da vitrine empresarial

## 5.6 Financing Namespace

Namespace próprio `:financiamentos` com dashboard e recursos próprios.

Finalidade:

- separar uma área operacional específica de ofertas/configurações financeiras

## 5.7 Audit / System

Recursos:

- `versions` como `AuditLog`
- `admin_users`
- `dashboard`

Finalidade:

- rastrear mudanças
- gerir operadores
- manter visão executiva do backoffice

---

## 6. Fluxo De Informação

## 6.1 Fluxo A: Onboarding e Moderação de Empresa

### Origem

- empresa criada via app/API
- empresa cai em estado de moderação

### Entra no ActiveAdmin

- `Company` aparece no dashboard e em `admin/companies`
- escopos relevantes: `pending_review`, `approved`, `rejected`, `suspended`

### Quem atua

- `AdminUser`
- idealmente: `trust_safety_admin` ou `commercial_admin`

### Gates

- status de moderação da empresa
- action items de approve/reject/suspend
- callbacks como `approve!` e `reject!`

### Saídas possíveis

- aprovado
- rejeitado com motivo
- suspenso

### Downstream impact

- visibilidade pública
- elegibilidade para receber tráfego e leads
- ativação de recursos comerciais
- coerência com plano/feature access

### Riscos

- um único papel de admin fazer tudo sem separação funcional
- reprovação sem motivo estruturado
- mudança de status sem trilha mais rígida de SLA

---

## 6.2 Fluxo B: Solicitação de Acesso à Empresa

### Origem

- usuário solicita `request_admin_access` fora do admin

### Entra no ActiveAdmin

- `CompanyAccessRequest`

### Quem atua

- `AdminUser`
- idealmente: `support_admin` ou `trust_safety_admin`

### Gates

- request precisa estar `pending`
- approve/reject só aparecem quando pendente

### Aprovação faz

- marca request como `approved`
- registra `reviewed_at`
- registra `reviewed_by_admin_user_id`
- pode promover relacionamento do usuário com empresa
- pode verificar a empresa
- dispara e-mail

### Rejeição faz

- marca request como `rejected`
- exige motivo
- registra admin_note
- dispara e-mail

### Downstream impact

- acesso administrativo da empresa
- credibilidade da conta
- suporte operacional

### Riscos

- motivo de aprovação opcional e pouco padronizado
- ausência de política explícita de evidências mínimas

---

## 6.3 Fluxo C: Pending Changes

### Origem

- usuário ou operador externo gera uma alteração sujeita a revisão

### Entra no ActiveAdmin

- `PendingChange`

### Quem atua

- `AdminUser`
- idealmente: `trust_safety_admin`, `content_admin` ou `commercial_admin`, dependendo do `change_type`

### Gates

- status `pending`
- action buttons `approve` e `reject`

### Aprovação faz

- marca approved
- grava `approved_at`
- grava `approved_by`
- grava IP e user agent
- chama `apply_changes!`

### Rejeição faz

- marca rejected
- grava metadata da rejeição

### Downstream impact

- alteração efetivamente aplicada no produto
- trilha de auditoria operacional

### Riscos

- `apply_changes!` é ponto crítico de side effects
- ausência de classificação forte por criticidade da mudança
- ausência de workflow multi-aprovação para mudanças de alto risco

---

## 6.4 Fluxo D: Moderação de Reviews

### Origem

- usuário submete review

### Entra no ActiveAdmin

- `Review`
- escopos: `pending`, `approved`, `rejected`, `in_analysis`

### Quem atua

- `AdminUser`
- idealmente: `trust_safety_admin`

### Gates

- estado atual do review
- `ReviewDecisionService`
- `review_decision_logs`
- social proof gate por plano da empresa

### Ações

- aprovar
- rejeitar
- enviar para análise
- batch approve/reject

### Downstream impact

- reputação pública da empresa
- social proof
- ranking/comportamento de confiança

### Riscos

- sem matriz explícita de fraude / abuso / disputa
- ausência de reason codes estruturados na decisão
- featured/pin condicionado por plano, mas sem workflow operacional documentado

---

## 6.5 Fluxo E: Moderação de Banners

### Origem

- banner criado/submetido

### Entra no ActiveAdmin

- `Banner`

### Quem atua

- `AdminUser`
- idealmente: `commercial_admin` ou `content_admin`

### Gates

- `moderation_status == submitted`
- approve/reject disponíveis só nesse estado

### Aprovação

- `approve!(current_admin_user)`

### Rejeição

- `reject!(current_admin_user, reason)`

### Downstream impact

- exibição publicitária
- receita
- risco de política comercial / conteúdo impróprio

---

## 6.6 Fluxo F: Operação de Planos e Features

### Origem

- PO/comercial define catálogo de planos

### Entra no ActiveAdmin

- `Plan`
- `SubscriptionPlan`
- `SponsoredPlan`

### Quem atua

- `AdminUser`
- idealmente: `commercial_admin` ou `finance_admin`

### Gates

- `PlanFeatureCatalog`
- feature access por grupo
- templates por tier

### Downstream impact

- acesso de empresas a recursos
- comportamento do marketplace
- analytics, trust, conversão e conteúdo disponíveis por plano

### Riscos

- mudança manual de feature flag sem workflow de change control
- impacto amplo em empresas existentes
- risco de inconsistência entre plano, company feature access e UI

---

## 6.7 Fluxo G: Leads e Distribuição

### Origem

- wizard, CTA, lead APIs

### Entra no ActiveAdmin

- `Lead`
- `LeadDistribution`
- `SaaS Lead`

### Quem atua

- `AdminUser`
- idealmente: `support_admin` ou `commercial_admin`

### Gates

- status do wizard
- empresa elegível
- regras de distribuição
- feature gates de quote/active_admin

### Downstream impact

- eficiência comercial
- qualidade da experiência da empresa
- percepção de valor do marketplace

### Riscos

- admin editar lead diretamente sem trilha semântica forte
- import CSV sem validação operacional aprofundada

---

## 7. Permissões E Gates

## 7.1 Estado atual observado

Permissão base:

- `AdminUser` tende a ter acesso total via `ApplicationPolicy`
- páginas do ActiveAdmin usam `PagePolicy`
- dashboard é liberado

Isso significa que o sistema atual está mais próximo de:

- autenticação forte
- autorização ampla

do que de:

- autenticação forte
- autorização granular

## 7.2 Gates de autenticação

- login Devise
- `authenticate_admin_user!`
- 2FA
- backup codes

## 7.3 Gates de autorização

- Pundit adapter
- policies específicas onde existirem
- scopes e action items condicionais

## 7.4 Gates de estado

Os principais gates reais hoje são de estado de negócio:

- `Company.moderation_status`
- `Review.status`
- `PendingChange.status`
- `CompanyAccessRequest.status`
- `Banner.moderation_status`
- `SubscriptionPlan.status`

## 7.5 Gates de feature / plano

O admin expõe e opera gates de monetização:

- `PlanFeatureCatalog`
- `feature_access`
- `social_proof_enabled`
- `active_admin`
- recursos de conversão, trust, conteúdo, insights

## 7.6 Gaps de permissão

- falta matriz explícita recurso x papel
- falta `read_only_admin`
- falta segregação entre operação comercial, conteúdo, moderação e suporte
- falta revisão de “who can approve whom”

---

## 8. Matriz Recomendada De Papéis

## 8.1 Super Admin

Pode:

- tudo
- gerenciar `AdminUser`
- acessar auditoria
- alterar planos e gates críticos

## 8.2 Trust & Safety Admin

Pode:

- reviews
- pending changes
- companies em moderação
- company access requests
- banners submetidos

Não deve:

- alterar catálogo de preços
- operar assinaturas financeiras
- editar administradores

## 8.3 Content Admin

Pode:

- articles
- contents
- categories
- faqs
- badges
- banners editoriais

Não deve:

- aprovar acesso de empresa
- alterar planos
- alterar usuários admin

## 8.4 Commercial Admin

Pode:

- plans
- subscription plans
- sponsored plans
- saas leads
- ranking preview
- empresas em contexto comercial

## 8.5 Support Admin

Pode:

- leads
- company members
- company access requests
- FAQs de empresa

## 8.6 Finance Admin

Pode:

- banner subscriptions
- pagamentos e assinaturas
- ofertas comerciais e pricing

## 8.7 Read Only Admin

Pode:

- dashboards
- relatórios
- auditoria
- consulta de recursos

Não pode:

- aprovar, rejeitar, deletar ou alterar estado

---

## 9. Blueprint De Evolução

Este blueprint está dividido em etapas pequenas, pensadas para múltiplas sessões/PRs.

## Step 1: Inventário Canônico Do ActiveAdmin

### Objetivo

Produzir um inventário oficial de todas as páginas, recursos, namespaces, member_actions, batch_actions e collection_actions do ActiveAdmin.

### Context Brief

Use `AB0-1-back/app/admin`, `config/initializers/active_admin.rb` e `config/routes.rb`. O objetivo não é mudar comportamento ainda. É documentar a superfície real do backoffice.

### Deliverables

- tabela de recursos
- namespace por recurso
- tipo de operação
- owner funcional sugerido
- risco operacional

### Done quando

- qualquer agente novo consegue dizer o que existe no admin sem reler o código inteiro

## Step 2: Matriz De Papéis E Permissões

### Objetivo

Criar a matriz `role x resource x action`.

### Context Brief

Hoje `ApplicationPolicy` é permissiva para admin. Este passo define o target state antes de implementar políticas granulares.

### Deliverables

- matriz de papéis
- regras de aprovação
- regras de leitura
- regras de edição
- regras de export/import

### Done quando

- existe definição explícita de quem pode aprovar, rejeitar, editar e auditar cada recurso crítico

## Step 3: Modelagem Dos Gates De Estado

### Objetivo

Formalizar os estados e transições dos recursos críticos.

### Context Brief

Foco em `Company`, `Review`, `PendingChange`, `CompanyAccessRequest`, `Banner`, `SubscriptionPlan`.

### Deliverables

- state machine funcional por recurso
- transições permitidas
- side effects
- logs obrigatórios

### Done quando

- toda transição crítica tem entrada, gate, executor e saída documentados

## Step 4: Aprovação Segura E Auditável

### Objetivo

Padronizar todos os fluxos de approve/reject/suspend com reason codes, actor, timestamp e trilha.

### Context Brief

Hoje parte disso existe, mas de forma desigual. Reviews estão melhores. Outros recursos ainda operam com menor estrutura.

### Deliverables

- padrão único de decisão
- notes padronizadas
- motivos obrigatórios por ação crítica
- trilha de auditoria homogênea

### Done quando

- aprovar/rejeitar em qualquer fluxo crítico deixa metadado consistente

## Step 5: Segregação De Funções

### Objetivo

Implementar autorização granular por papel no admin.

### Context Brief

Usar Pundit no namespace admin, criando policies específicas por recurso ou por namespace funcional.

### Deliverables

- papéis no `AdminUser`
- policies específicas
- bloqueio por ação
- read-only mode

### Done quando

- um admin de conteúdo não consegue aprovar uma empresa ou alterar assinatura

## Step 6: Observabilidade Operacional Do Backoffice

### Objetivo

Criar dashboards internos e logs para o próprio trabalho do admin.

### Context Brief

O admin também é produto interno. Medir backlog, SLA e throughput de aprovação reduz caos operacional.

### Deliverables

- dashboard de pendências
- SLA de moderação
- tempo médio por fila
- backlog de access requests
- backlog de pending changes

### Done quando

- operação interna tem métricas de throughput e aging

## Step 7: UX Operacional Do ActiveAdmin

### Objetivo

Redesenhar as telas mais críticas para decisão humana rápida e segura.

### Context Brief

Hoje várias telas já têm informação, mas a ergonomia de decisão ainda está desigual.

### Deliverables

- cards de risco
- resumos comparativos
- preview de impacto
- confirmação contextual
- filtros salvos

### Done quando

- um operador consegue decidir com menos cliques e menos erro

---

## 10. Mapa De Riscos

### Risco 1

`AdminUser` excessivamente poderoso.

Mitigação:

- criar papéis
- granularizar policies

### Risco 2

Ações de approve/reject com trilha desigual entre recursos.

Mitigação:

- padrão único de decisão

### Risco 3

Mudanças críticas de plano/feature afetarem produção sem workflow formal.

Mitigação:

- change review
- audit trail
- dual control para itens críticos

### Risco 4

Backoffice misturar operações editoriais, comerciais e trust sem separação.

Mitigação:

- namespaces funcionais
- papéis dedicados

### Risco 5

`current_user` bridged para `current_admin_user` esconder bugs de contexto.

Mitigação:

- documentar contratos
- revisar shared helpers

---

## 11. Definition Of Done Do Sistema Admin

- [ ] Existe inventário oficial de recursos e ações.
- [ ] Existe matriz oficial de papéis e permissões.
- [ ] Fluxos críticos têm gates documentados.
- [ ] Aprovações e rejeições têm trilha consistente.
- [ ] Existe separação entre moderação, comercial, conteúdo, suporte e finanças.
- [ ] Existe observabilidade do trabalho do próprio backoffice.
- [ ] O ActiveAdmin deixa de ser “painel técnico genérico” e passa a ser “sistema operacional interno”.

---

## 12. Próximos Documentos Recomendados

- [ ] `docs/ACTIVE_ADMIN_ROLE_PERMISSION_MATRIX.md`
- [ ] `docs/ACTIVE_ADMIN_STATE_MACHINES.md`
- [ ] `docs/ACTIVE_ADMIN_OPERATIONAL_SLA.md`
- [ ] `docs/ACTIVE_ADMIN_AUDIT_EVENT_SPEC.md`
- [ ] `docs/ACTIVE_ADMIN_BACKOFFICE_DASHBOARD_SPEC.md`
