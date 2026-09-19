# Avalia Solar — Canonical Entitlement Engine

**Status:** CANONICAL
**Data:** 18 de Setembro de 2026
**Escopo:** `AB0-1-back` (Rails 7 API) & `AB0-1-front` (Next.js 14)
**Golden SaaS Pattern:** Wave 2 — Canonical Entitlements & Metering

---

## 1. Visão Geral & Separação de Responsabilidades

No Avalia Solar, os conceitos de segurança, identidade e direitos de uso são estritamente desacoplados conforme o Golden SaaS Blueprint:

```
User (Identity)
  ↓
CompanyMember (Tenant Membership & Local RBAC)
  ↓
Entitlement Engine (EntitlementService & PlanFeatureCatalog)
  ↓
Feature Access (Boolean & Metered)
  ↓
Quota & Usage (PostgreSQL Ground Truth)
  ↓
Domain Operation
```

### Regras Cardinais
1. **IDENTITY ≠ RBAC ≠ SUBSCRIPTION ≠ ENTITLEMENT ≠ FEATURE FLAG.**
2. **Sales CRM é INTERNAL ONLY:** Nunca condicionado a Plan/Subscription/Entitlement.
3. **Frontend NÃO é boundary de segurança:** Toda autorização e verificação de quota é validada no backend via `FeatureGateEnforceable` e `EntitlementService`.
4. **Stripe NÃO é chamado no hot-path:** O estado da assinatura é mantido sincronizado assincronamente via webhooks idempotentes (`Billing::StripeWebhookHandler`).

---

## 2. Arquitetura do Engine

### 2.1 Componentes Principais

1. **`PlanFeatureCatalog` (`app/models/plan_feature_catalog.rb`):**
   - Catálogo central contendo 29 features canônicas categorizadas em 5 grupos (`public_profile`, `conversion`, `trust`, `content`, `analytics`/`insights`).
   - Define tipo (`:boolean`, `:integer`), comportamento (`:entitlement`, `:toggle`, `:config`), visibilidade de upsell (`:locked`, `:hidden`), aliases e valores padrão por tier (`free`, `essential`, `pro`, `enterprise`).

2. **`CompanyFeatureAccessResolver` (`app/services/company_feature_access_resolver.rb`):**
   - Resolve o payload de acesso da empresa combinando overrides explícitos, plano assinado e defaults do catálogo.
   - Gera estado canônico: `enabled`, `locked`, `hidden`.

3. **`EntitlementService` (`app/services/entitlement_service.rb`):**
   - Ponto de entrada canônico para o domínio:
     - `EntitlementService.entitled?(company:, feature:)`
     - `EntitlementService.limit(company:, feature:)`
     - `EntitlementService.usage(company:, feature:)`
     - `EntitlementService.remaining(company:, feature:)`
     - `EntitlementService.explain(company:, feature:)`
     - `EntitlementService.enforce!(company:, feature:)`

4. **`FeatureGateEnforceable` (`app/controllers/concerns/feature_gate_enforceable.rb`):**
   - Concern para controllers Rails que aplica `enforce_feature_access!(feature_key)`.
   - Retorna erro padronizado HTTP 403 `#{FEATURE}_NOT_AVAILABLE` em caso de negação.

---

## 3. Explanabilidade de Decisão

Toda resolução de entitlement responde a um contrato estruturado de explanabilidade:

```json
{
  "feature": "premium_profile",
  "allowed": true,
  "source": "plan",
  "plan": "pro",
  "limit": null,
  "usage": 0,
  "remaining": Infinity,
  "reason": "included_in_plan"
}
```

---

## 4. Quotas e Metered Features

| Feature | Tipo | Default Free | Default Pro | Fonte de Uso | Lock Owner |
|---|---|---|---|---|---|
| `featured_products` | Integer | 0 | 10 | `company.catalog_products.where(status: 'active', featured: true).count` | `Company` |
| `company_categories_limit` | Integer | 3 | 10 | `company.company_categories.count` | `Company` |
| `service_area_cities_limit` | Integer | 3 | 50 | `company.service_areas.count` | `Company` |
| `service_area_states_limit` | Integer | 1 | 5 | `company.service_areas.distinct.count(:state)` | `Company` |
| `product_images_limit` | Integer | 1 | 10 | Imagens por produto | `Product` |

---

## 5. Atomicidade de Quotas & Lock de Aggregate (Wave 2C)

Para prevenir condições de corrida *Check-Then-Act*, toda operação concorrente sobre recursos tarifados utiliza lock transacional no aggregate proprietário (`with_quota_lock`):

```ruby
# Para quotas de nível de Empresa:
EntitlementService.with_quota_lock(company: company, feature: 'featured_products') do
  product.update!(featured: true)
end

# Para quotas de nível de Produto (imagens):
EntitlementService.with_quota_lock(company: company, feature: 'product_images_limit', target: product) do
  product.images.attach(io: ..., filename: 'foto.jpg')
end
```

### Garantias da Fronteira Transacional:
1. **Lock no Menor Aggregate Correto:** `Company` para recursos de tenant; `Product` para mídias/imagens.
2. **Leitura Não-Cacheada:** Execução dentro de `ActiveRecord::Base.uncached` garantindo leitura em tempo real no PostgreSQL.
3. **Rollback Automático:** Caso a contagem atinja ou exceda o limite contratado, `EntitlementService::QuotaExceededError` é lançado e a mutação é revertida antes do commit.
4. **Semântica de Limites Especiais:** `limit = 0` impede qualquer consumo; `limit = nil` permite consumo ilimitado. Proibição estrita de `Infinity` e `NaN` em payloads JSON.

---

## 6. Ordenação Monotônica de Webhooks Stripe (Wave 2C)

O processamento de eventos do Stripe em `Billing::StripeWebhookHandler` é protegido contra entregas fora de ordem e chamadas concorrentes:

1. **Relógio do Evento Stripe:** O timestamp canônico utilizado é `event.created` (timestamp Unix da criação no provedor Stripe).
2. **Rejeição de Eventos Obsoletos (*Stale Events*):** Se um evento recebido possui `event.created < last_applied_event.created` para aquela assinatura, o evento é marcado como `skipped_stale` e a transação não regride o plano ou status canônico.
3. **Lock de Assinatura:** `Billing::CompanySubscription#with_lock` serializa o processamento de eventos múltiplos simultâneos, prevenindo deadlocks e garantindo que o estado mais recente vença.
4. **Zero Outbound Calls no Hot-Path:** O engine de entitlements nunca executa requisições de rede ao Stripe durante a resolução de direitos de produto.
