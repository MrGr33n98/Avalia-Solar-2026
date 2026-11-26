# Event Coverage Matrix — Avalia Solar 2026
**Auditoria de Cobertura Ponta a Ponta:** Frontend vs Backend vs PostHog vs GA4 vs Key Events  
**Data:** 26 de Novembro de 2026  

---

## 1. Matriz de Cobertura de Eventos

| Evento de Negócio | Frontend (`AB0-1-front`) | Backend (`AB0-1-back`) | PostHog | GA4 (Observado) | Configurado como Key Event | Status Geral | Severidade do Gap |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `page_view` | ✅ Sim (`gtag.ts`) | ❌ Não | ✅ Sim | ✅ **8.270** | ❌ Não | **Ativo** | OK |
| `user_engagement` | ✅ Automático | ❌ Não | ❌ Não | ✅ **1.440** | ❌ Não | **Ativo** | OK |
| `scroll` | ✅ Automático | ❌ Não | ❌ Não | ✅ **851** | ❌ Não | **Ativo** | OK |
| `session_start` | ✅ Automático | ❌ Não | ✅ Sim | ✅ **504** | ❌ Não | **Ativo** | OK |
| `form_submit` (Genérico) | ✅ Automático | ❌ Não | ❌ Não | ✅ **408** | ❌ Não | **Ativo** (Enhanced) | P2 |
| `form_start` (Genérico) | ✅ Automático | ❌ Não | ❌ Não | ✅ **281** | ❌ Não | **Ativo** (Enhanced) | P2 |
| `first_visit` | ✅ Automático | ❌ Não | ✅ Sim | ✅ **78** | ❌ Não | **Ativo** | OK |
| `click` (Links externos) | ✅ Automático | ❌ Não | ✅ Sim | ✅ **76** | ❌ Não | **Ativo** | OK |
| `view_search_results` | ✅ Automático | ❌ Não | ❌ Não | ✅ **23** | ❌ Não | **Ativo** | OK |
| `search` | ✅ Sim (`gtag.ts`) | ❌ Não | ✅ Sim | ✅ **14** | ❌ Não | **Ativo** | OK |
| `select_promotion` | ✅ Sim | ❌ Não | ❌ Não | ✅ **3** | ❌ Não | **Ativo** | OK |
| **`whatsapp_click`** | ✅ Sim (`dataLayer`) | ✅ `AnalyticsTrackingJob` | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P0** | **P0** |
| **`phone_click`** | ✅ Sim (`dataLayer`) | ✅ `AnalyticsTrackingJob` | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P0** | **P0** |
| **`website_click`** | ✅ Sim (`dataLayer`) | ✅ `AnalyticsTrackingJob` | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P1** | **P1** |
| **`company_profile_viewed`** | ✅ Sim (`dataLayer`) | ✅ `AnalyticsTrackingJob` | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P0** | **P0** |
| **`product_viewed`** | ✅ Sim (`dataLayer`) | ❌ Não | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P1** | **P1** |
| **`comparator_toggle`** | ✅ Sim (`useCompare`) | ❌ Não | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P0** | **P0** |
| **`comparator_viewed`** | ✅ Sim (`/compare`) | ❌ Não | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P0** | **P0** |
| **`quote_wizard_started`** | ✅ Sim (`wizard.ts`) | ❌ Não | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P0** | **P0** |
| **`lead_form_submitted`** | ✅ Sim (`dataLayer`) | ✅ `LeadsController` | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P0** | **P0** |
| **`buyer_intent_scored`** | ❌ Não | ✅ `BuyerIntentScoreService` | ✅ Sim | ❌ **0 (Ausente)** | ❌ Não | **FALHA P0** | **P0** |
| **`purchase`** | ✅ Sim (`checkout`) | ✅ `StripeWebhook` | ✅ Sim | ❌ **0 (Zero)** | ✅ **Sim (Único)** | **FALHA P0** | **P0** |

---

## 2. Diagnóstico da Quebra de Funil e Comunicação

```
                                  ┌────────────────────────┐
                                  │   Usuário Interage     │
                                  │ (WhatsApp/Lead/Compare)│
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
          ┌───────────────────────┐                       ┌───────────────────────┐
          │  Frontend Next.js 14  │                       │   Backend Rails 7     │
          │  (lib/analytics/)     │                       │ (AnalyticsTrackingJob)│
          └───────────┬───────────┘                       └───────────┬───────────┘
                      │                                               │
         ┌────────────┴────────────┐                     ┌────────────┴────────────┐
         ▼                         ▼                     ▼                         ▼
   [ PostHog ]             [ window.dataLayer ]   [ PostgreSQL DB ]        [ Ga4Service.track ]
    (Captura                 (Pilha local;         (Salva no banco          (Aborta silencioso
     100% OK)                 nenhum script         de dados OK)             porque API_SECRET
                              GTM ou gtag                                    não está em ENV)
                              repassa ao GA4)                                       │
                                   │                                                │
                                   ▼                                                ▼
                         ❌ NUNCA CHEGA NO GA4                            ❌ NUNCA CHEGA NO GA4
```

### Análise das Causas:
1. **Frontend:** Em `AB0-1-front/lib/analytics/index.ts`, a função `track()` envia os eventos para o PostHog e para o buffer `pushAnalyticsDataLayerEvent()`. Entretanto, o wrapper `gtagEvent()` ou `gtag('event', ...)` **não é chamado** dentro do dispatcher principal de analytics.
2. **Backend:** Em `AB0-1-back/app/services/ga4_service.rb`, o método `track` possui a guarda:
   ```ruby
   def ga4_measurement_enabled?
     ENV['GA4_MEASUREMENT_ID'].present? && ENV['GA4_API_SECRET'].present?
   end
   ```
   No ambiente de produção, a variável `GA4_API_SECRET` não foi injetada no container Docker, desabilitando 100% dos eventos server-side.
3. **Key Events no GA4:** Como o GA4 só recebe os eventos Enhanced Measurement, o único evento-chave existente na propriedade (`purchase`) nunca ocorre na interface web comum sem transação de checkout em produção.

