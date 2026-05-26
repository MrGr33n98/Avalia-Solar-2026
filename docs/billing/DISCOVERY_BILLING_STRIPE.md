# DISCOVERY: Estado Atual do Billing no Avalia Solar

**Data:** 2026-05-26  
**Versão:** 1.0  
**Autor:** Discovery automatizado via análise de codebase  
**Status:** Completo — aprovado para PRD

---

## 1. O Que Já Existe Hoje

### 1.1 Frontend de Pricing

**Localização:** `AB0-1-front/app/pricing/page.tsx`  
**Status:** ✅ Existe, mas é casca vazia

- Há uma rota `/pricing` montada com `metadata` de SEO configurado.
- O componente `PricingPage` importado de `@/components/pricing/PricingPage`.
- Há um `PricingIntentTracker` para rastrear comportamento (exit intent, scroll, tempo na página).
- A página **não está integrada a uma API de billing real** — presumivelmente estática ou mock.

Também existe:
- `/plans` → rota com `page.tsx` de 114 bytes (praticamente vazia)
- `/prices` → rota com `page.tsx` (a verificar, provavelmente duplicação)

### 1.2 Catálogo de Planos (Backend)

**Modelo:** `app/models/plan.rb`  
**Status:** ✅ Existe e funcional para o contexto atual

Campos inferidos pelo schema (não há `stripe_price_id`, `stripe_product_id`):
- `name` (string, unique)
- `description`
- `price` (decimal)
- `features` (JSON/text legado)
- `features_json` (jsonb, campo moderno)

Funcionalidades já implementadas:
- `feature_flags` — retorna hash de flags de feature por plano
- `enabled_feature_keys` — lista chaves de features ativas
- `inferred_plan_tier` — infere tier (free/pro/enterprise) via `PlanFeatureCatalog`
- `setup_info` / `full_implementation_summary` — helpers de UI
- `ransackable_attributes` — configurado para ActiveAdmin

**Ausente crítico:**
- `stripe_price_id` — sem ligação com Stripe Price ID
- `stripe_product_id` — sem ligação com Stripe Product ID
- `billing_interval` — mensal/anual não está modelado
- `is_public` — flag para determinar se aparece no `/pricing`

### 1.3 Modelos Relacionados a `Company` e Planos

**Company:**
- `belongs_to :plan, optional: true` — associação existe
- `has_many :banner_subscriptions` — para o fluxo legado de banner
- Campo `plan_id` na tabela — já existe
- Campo `plan_status` — inferido por método, pode ser coluna também
- Métodos: `has_paid_plan?`, `inferred_plan_tier`, `feature_enabled_from_plan?`
- `feature_access` → usa `CompanyFeatureAccessResolver`

**Não existe:**
- `stripe_customer_id` em `companies`
- Tabela `company_subscriptions` (entidade SaaS de billing)
- Campos `stripe_subscription_id`, `current_period_start`, `current_period_end`

### 1.4 `SubscriptionPlan` (Existente)

**Modelo:** `app/models/subscription_plan.rb`  
**Status:** ⚠️ Existe mas é diferente do que precisamos

Este modelo representa **assinaturas de produtos no marketplace** (uma empresa comprando destaque de um produto numa categoria), **não billing SaaS da plataforma**.

Campos existentes:
- `belongs_to :category`, `belongs_to :plan`, `belongs_to :product`
- `belongs_to :member` (quem comprou)
- `status`: draft, trial, active, paused, canceled, expired, inactive
- `value`, `purchased_at`, `start_at`, `end_at`

**Não é o mesmo que:** "empresa pagando plano Pro da Avalia Solar via Stripe recorrente".

**Decisão pendente:** ☐ Renomear para `ProductSubscriptionPlan` para evitar confusão semântica com `CompanySubscription` novo?

### 1.5 `BannerSubscription` (Checkout Legado)

**Modelo:** `app/models/banner_subscription.rb`  
**Status:** ✅ Funcional — NÃO TOCAR

Representa compras avulsas de banner publicitário.

Campos:
- `company_id`, `banner_offer_id`
- `status`: pending_payment, active, past_due, canceled, expired, failed
- `checkout_session_id` — referência ao Stripe Checkout Session
- `payment_reference` — payment intent ID
- `provider` — stripe/mercadopago
- `starts_at`, `ends_at`, `activated_at`, `canceled_at`, `failure_reason`

### 1.6 Checkout Stripe Legado

**Serviço:** `app/services/payment/checkout_service.rb`  
**Status:** ✅ Funcional — NÃO TOCAR

- Modo: `payment` (cobrança avulsa, não subscription)
- Usa `Stripe::Checkout::Session.create`
- Suporta também MercadoPago
- Success/cancel URL apontam para `/dashboard/billing`
- metadata: `subscription_id`, `company_id`

### 1.7 Webhook Stripe Legado

**Serviço:** `app/services/webhooks/stripe_handler.rb`  
**Status:** ✅ Corrigido (hotfix aplicado) — NÃO TOCAR

- Valida assinatura via `Stripe::Webhook.construct_event` (SDK oficial)
- Processa apenas `checkout.session.completed`
- Ativa `BannerSubscription` ao receber evento de sessão completa
- **Não tem idempotência** — sem verificação de `event.id` duplicado

**Rota:** `POST /api/v1/payments/webhooks/:provider`

**Risco atual:** Se o mesmo `checkout.session.completed` for enviado duas vezes, a subscription seria ativada duas vezes (embora idempotente por atualização de status).

### 1.8 Feature Gates Existentes

**Serviço:** `app/services/feature_gate_service.rb`  
**Status:** ⚠️ Existe mas incompleto/simplista

```ruby
FEATURE_ACCESS = {
  free:       %w[view_dashboard basic_analytics],
  pro:        %w[view_dashboard basic_analytics advanced_analytics ...],
  enterprise: %w[view_dashboard basic_analytics ... api_access webhooks white_label_support]
}
```

**Mais robusto:** `PlanFeatureCatalog` (model `plan_feature_catalog.rb` — 16KB) com feature flags por chave, grupos, labels, tipos (boolean/integer), defaults por tier.

`Company` usa `feature_enabled_from_plan?`, `feature_value_from_plan`, `CompanyFeatureAccessResolver`.

### 1.9 Autorização / Pundit / RBAC

**Status:** ✅ Pundit instalado e configurado

Policies existentes:
- `ApplicationPolicy` — base
- `CompanyPolicy`, `CompanyDashboardPolicy`
- `ReviewPolicy`, `UserPolicy`
- Policies específicas de FAQ, financing, etc.

**Ausente:**
- `BillingPolicy` — não existe
- Política de quem pode alterar plano de uma company
- Segregação de roles no ActiveAdmin para billing

### 1.10 ActiveAdmin Existente

**Status:** ✅ Robusto e bem configurado

Recursos existentes: plans, subscription_plans, companies, users, reviews, leads, banners, banner_subscriptions, etc.

`admin/plans.rb` — admin completo para catálogo de planos com:
- Tier templates
- Feature flags por grupo
- Editor visual de features

`admin/subscription_plans.rb` — admin para assinaturas de produto (não SaaS) com:
- Filtros por status
- Batch actions (ativar/expirar)
- Link para gestão de assinaturas via botão no menu de planos

**Ausente:**
- Admin resource para `CompanySubscription` (billing SaaS)
- Ações de sincronização com Stripe
- Auditoria de ações manuais
- Painel de webhooks/eventos

### 1.11 Serviços de Notificação Existentes

**Serviço:** `app/services/slack_notification_service.rb`  
**Status:** ✅ Muito bem implementado

Canais configurados via ENV:
- `SLACK_LEADS_WEBHOOK_URL` → #leads
- `SLACK_REVIEWS_WEBHOOK_URL` → #reviews
- `SLACK_EMPRESAS_WEBHOOK_URL` → #avalia-solar-geral
- `SLACK_ALERTAS_WEBHOOK_URL` → #critical
- `SLACK_VENDAS_INTENT_WEBHOOK_URL` → #intent

Funcionalidades:
- Mensagens com attachments coloridos
- Modo síncrono e assíncrono (Thread)
- Fallback para `SLACK_WEBHOOK_URL` geral
- Log de erros sem crash da aplicação

**Ausente:**
- Canal `billing` / `billing-alerts` não existe
- Nenhuma notificação de evento de billing implementada

### 1.12 Integração Stripe Existente

**Gem:** `stripe ~> 13.0` ✅ instalado  
**ENV vars existentes:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Não existe:**
- `STRIPE_BILLING_WEBHOOK_SECRET` (secret separado para webhook SaaS)
- Stripe Price IDs no banco
- Stripe Customer IDs no banco
- Stripe Subscription IDs no banco

### 1.13 Documentação Atual

- `WEBHOOK_SECURITY_GUIDE.md` — guia de segurança de webhooks
- `README.md` — documentação geral
- `docs/STRIPE_EXECUTIVE_SUMMARY.md` — summary executivo do Stripe
- `docs/STRIPE_ANALYSIS_INDEX.md` — índice de análise
- `SECURITY_AUDIT_REPORT.md` — auditoria de segurança completa

---

## 2. O Que Está Pronto Para Reutilizar

| Componente | Status | Como Reutilizar |
|---|---|---|
| `stripe` gem v13 | ✅ Instalado | Usar para subscriptions e customer portal |
| `SlackNotificationService` | ✅ Robusto | Adicionar métodos de billing ao serviço |
| `Plan` model | ✅ Funcional | Adicionar campos Stripe (price_id, product_id) |
| `PlanFeatureCatalog` | ✅ Completo | Usar para feature gates por tier |
| `Webhooks::SecurityService` | ✅ Funcional | Adaptar para segundo webhook SaaS |
| `Webhooks::StripeHandler` | ✅ Funcional | NÃO reutilizar — criar handler separado |
| ActiveAdmin | ✅ Configurado | Criar resource `CompanySubscription` |
| Pundit | ✅ Instalado | Criar `BillingPolicy` |
| `paper_trail` gem | ✅ Instalado | Auditoria de mudanças em CompanySubscription |
| `sidekiq` + `sidekiq-scheduler` | ✅ Instalado | Jobs assíncronos de billing |
| `rack-attack` | ✅ Instalado | Rate limiting de endpoints billing |
| `lograge` | ✅ Instalado | Logs estruturados |
| `sentry-rails` | ✅ Instalado | Error tracking |
| Company → Plan association | ✅ Existe | Base para CompanySubscription |
| JWT auth | ✅ Funcional | Autenticação dos endpoints billing |

---

## 3. O Que Deve Ser Mantido Intocado

| Componente | Razão |
|---|---|
| `Payment::CheckoutService` | Fluxo legado de banner — clientes ativos dependem disso |
| `Webhooks::StripeHandler` | Processa `checkout.session.completed` de banners — funcional após hotfix |
| `BannerSubscription` model | Representa compras de banner — schema atual OK |
| Rota `POST /api/v1/payments/webhooks/:provider` | Legado de banner — não alterar |
| `SubscriptionPlan` model | Usado por produtos no marketplace — schema diferente |
| `admin/subscription_plans.rb` | Admin de produtos — manter separado |

---

## 4. O Que Está Incompleto ou Perigoso

### 4.1 Crítico 🔴

| Problema | Arquivo | Risco |
|---|---|---|
| Sem idempotência no webhook legado | `stripe_handler.rb:29-36` | Duplo processamento em caso de retry Stripe |
| Sem `stripe_customer_id` nas companies | schema | Impossível associar company a customer Stripe |
| Sem `CompanySubscription` model | não existe | Não há onde armazenar estado de assinatura SaaS |
| `FeatureGateService` simplista | `feature_gate_service.rb` | Divergência com `PlanFeatureCatalog` — dois sistemas de feature gate |

### 4.2 Importante 🟡

| Problema | Arquivo | Risco |
|---|---|---|
| `/pricing` page sem dados reais | `pricing/page.tsx` | Usuário não vê planos reais da API |
| Sem `BillingPolicy` Pundit | não existe | Sem autorização formal para ações de billing |
| Sem canal `#billing` no Slack | `slack_notification_service.rb` | Eventos de billing não geram alerta |
| `AdminUser` sem roles/permissões | `admin_user.rb` | Qualquer admin pode fazer qualquer ação |
| Sem tabela `stripe_webhook_events` | não existe | Sem idempotência, sem histórico de eventos |

### 4.3 Técnico 🔵

| Problema | Arquivo | Risco |
|---|---|---|
| Thread.new para Slack (não Sidekiq) | `slack_notification_service.rb:232` | Threads perdidas em crash do servidor |
| Dois campos de features (`features` + `features_json`) | `plan.rb` | Complexidade desnecessária |
| `SubscriptionPlan` nome confuso | model | Conflito semântico com billing SaaS futuro |

---

## 5. Decisões de Produto Pendentes

| # | Decisão | Opções | Impacto |
|---|---|---|---|
| DP-01 | Modelo de trial? | 7 dias / 14 dias / sem trial | Feature gate, emails, UX |
| DP-02 | Plano Free é realmente free para sempre? | Sim / Freemium com limite / Sem free | Estratégia de crescimento |
| DP-03 | Enterprise é self-serve ou vendido manualmente? | Self-serve via Stripe / Contato comercial / Híbrido | Fluxo de checkout, admin |
| DP-04 | Billing anual com desconto? | Sim (10-20%) / Não por agora | Stripe Price IDs, UI |
| DP-05 | O que acontece com empresas no plano Free quando um recurso é bloqueado? | Degradação suave / Bloqueio imediato / Notificação | Feature gates, UX |
| DP-06 | Cancelamento: imediato ou no fim do período? | Fim do período (padrão Stripe) / Imediato | UX, receita |
| DP-07 | Proração em upgrade/downgrade? | Sim automático (Stripe default) / Não (só na renovação) | Billing, UX |
| DP-08 | Quais features definem Pro vs Enterprise? | Definir formalmente | Feature catalog, pricing page |
| DP-09 | Suporte a MercadoPago para assinaturas? | Sim / Não (só Stripe) | Escopo, complexidade |
| DP-10 | `SubscriptionPlan` deve ser renomeado? | Renomear / Manter / Deprecar | Migration, compatibilidade |

---

## 6. Riscos Técnicos Antes de Cobrar Clientes Reais

### Risco 1: Webhook sem idempotência (CRÍTICO)
- **Problema:** O handler legado não verifica `event.id` duplicado
- **Impacto:** Em caso de retry do Stripe, evento pode ser processado duas vezes
- **Mitigação obrigatória:** Criar tabela `stripe_webhook_events` com `event_id` único antes de qualquer webhook de billing SaaS

### Risco 2: Sem rastreabilidade financeira
- **Problema:** Não há log estruturado de eventos financeiros
- **Impacto:** Impossível auditar disputas, chargebacks, cobranças incorretas
- **Mitigação:** Tabela `billing_events` com todos os eventos de billing

### Risco 3: `STRIPE_SECRET_KEY` único para produção
- **Problema:** Mesmo secret para banner e para billing SaaS
- **Impacto:** Risco de cruzamento de webhooks entre ambientes
- **Mitigação:** Usar `STRIPE_BILLING_WEBHOOK_SECRET` separado

### Risco 4: Sem reconciliação Stripe ↔ banco
- **Problema:** Estado da assinatura no banco pode divergir do estado real no Stripe
- **Impacto:** Cliente paga mas não recebe acesso, ou acessa sem pagar
- **Mitigação:** `Billing::SubscriptionSyncService` periódico via Sidekiq

### Risco 5: ActiveAdmin sem roles de billing
- **Problema:** Todo admin pode fazer qualquer ação manual de billing
- **Impacto:** Risco de erro operacional, fraude interna, inconsistência
- **Mitigação:** Implementar roles (suporte/financeiro/super_admin) no `AdminUser`

### Risco 6: Thread.new para notificações Slack
- **Problema:** Threads perdidas em crash — notificações críticas de billing podem não ser enviadas
- **Impacto:** Falhas silenciosas em alertas de `past_due`, cancelamento
- **Mitigação:** Migrar para `Sidekiq::Job` para eventos críticos de billing

### Risco 7: Teste/Live mode do Stripe
- **Problema:** Sem separação explícita de environments
- **Impacto:** Acidental uso de live keys em staging
- **Mitigação:** ENV vars separadas por ambiente, validação no boot

---

## 7. O Que o Time Administrativo Precisa Conseguir Fazer Sem Acessar o Stripe Diretamente

| Ação | Prioridade | Observação |
|---|---|---|
| Ver lista de todas as assinaturas ativas | Alta | Dashboard no ActiveAdmin |
| Ver detalhes de assinatura de uma company | Alta | Status, plano, período, Stripe IDs |
| Marcar empresa como Enterprise (manual) | Alta | Sem passar pelo Stripe Checkout |
| Forçar downgrade para Free | Alta | Para empresas inadimplentes, fraude |
| Sincronizar status com Stripe | Alta | Caso banco divergir do real |
| Abrir link da empresa no Stripe Dashboard | Média | Link direto sem precisar buscar |
| Abrir subscription no Stripe Dashboard | Média | Link direto para subscription |
| Cancelar assinatura no fim do período | Média | Sem acessar Stripe manualmente |
| Reprocessar último webhook | Média | Para eventos perdidos |
| Registrar observação administrativa | Média | Histórico de ações manuais |
| Ver histórico de eventos de billing | Alta | Auditoria e suporte |
| Ver reason de falhas de pagamento | Alta | Para contato proativo com cliente |
| Exportar relatório de assinaturas | Baixa | CSV/Excel |
| Estender trial manualmente | Média | Caso de suporte |
| Aplicar cupom/desconto manual | Baixa | Para negociação Enterprise |

---

## Resumo Executivo do Discovery

```
O Avalia Solar tem:
✅ Plataforma Rails 7 + Next.js madura
✅ Stripe gem v13 instalado
✅ Plan model com feature catalog robusto
✅ ActiveAdmin bem configurado
✅ SlackNotificationService funcional com múltiplos canais
✅ Webhook Stripe corrigido para billing de banner
✅ Sidekiq, Redis, PaperTrail, Pundit disponíveis

O Avalia Solar NÃO tem:
❌ CompanySubscription (modelo de assinatura SaaS)
❌ stripe_customer_id / stripe_subscription_id nas companies
❌ stripe_price_id / stripe_product_id nos plans
❌ Webhook handler separado para billing SaaS
❌ Idempotência de eventos (stripe_webhook_events table)
❌ Canal Slack de billing
❌ BillingPolicy Pundit
❌ Admin resource para CompanySubscription
❌ Frontend integrado a uma API de billing real
❌ Roles de admin separadas para billing

Risco principal antes de cobrar:
🔴 Idempotência de webhooks
🔴 Sem rastreabilidade de eventos financeiros
🔴 Sem reconciliação Stripe ↔ banco
```
