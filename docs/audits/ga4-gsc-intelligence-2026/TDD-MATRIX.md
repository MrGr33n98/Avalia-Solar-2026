# TDD Matrix — Search & Analytics Intelligence
**Plano de Testes Automatizados (RED → GREEN → REFACTOR)**  
**Data:** 26 de Novembro de 2026  

---

## 1. Suíte de Testes Automatizados Requerida

| ID do Teste | Escopo | Framework | Arquivo de Teste | Caso de Teste (Given / When / Then) |
|---|---|---|---|---|
| **TEST-01** | Frontend | Jest | `AB0-1-front/__tests__/analytics/gtag-localhost.test.ts` | **Given:** ambiente sob `window.location.hostname === 'localhost'`.<br>**When:** `initializeGTag` ou `gtagEvent` é chamado.<br>**Then:** nenhuma chamada ao script externo do Google Analytics deve ser efetuada. |
| **TEST-02** | Frontend | Jest | `AB0-1-front/__tests__/analytics/dispatcher-ga4.test.ts` | **Given:** usuário com consentimento de analytics concedido.<br>**When:** usuário clica em CTA de WhatsApp (`track('whatsapp_click', ...)`).<br>**Then:** `window.gtag` deve ser invocado com evento `'contact'` e parâmetros sanitizados. |
| **TEST-03** | Frontend | Jest | `AB0-1-front/__tests__/analytics/consent-mode-default.test.ts` | **Given:** primeiro carregamento da aplicação sem consentimento prévio.<br>**When:** o HTML é hidratado.<br>**Then:** `gtag('consent', 'default', { ... denied ... })` deve ser executado antes de qualquer evento analítico. |
| **TEST-04** | Frontend | Jest | `AB0-1-front/__tests__/seo/sitemap-companies-resilience.test.ts` | **Given:** backend retornando 500 empresas paginadas.<br>**When:** `getCompanySitemapEntries()` é executado.<br>**Then:** deve resolver em menos de 2.000ms sem estourar `SITEMAP_FETCH_TIMEOUT_MS`. |
| **TEST-05** | Backend | RSpec | `AB0-1-back/spec/services/ga4_service_spec.rb` | **Given:** `ENV['GA4_MEASUREMENT_ID']` e `ENV['GA4_API_SECRET']` presentes.<br>**When:** `Ga4Service.track('lead_created', properties)` é chamado.<br>**Then:** payload do Measurement Protocol deve conter `client_id` não nulo e status HTTP 204. |
| **TEST-06** | E2E | Playwright | `AB0-1-front/tests/e2e/ga4-tracking.spec.ts` | **Given:** usuário acessando a Brand Page da WEG.<br>**When:** usuário aceita cookies LGPD e clica no botão "Solicitar Orçamento".<br>**Then:** deve haver requisição HTTP para `google-analytics.com/g/collect` com parâmetros correspondentes. |

---

## 2. Critérios de Não-Regressão

* **SPEC 022 e Dashboards:** Nenhuma alteração no envio de eventos deve quebrar os contextos empresariais (`AuthContext`, `CompanyContext`) ou a renderização dos gráficos de telemetria.
* **Isolamento de Tenants:** Dados de uma empresa nunca devem vazar para o contexto ou parâmetros de outra empresa nos eventos do GA4.
* **Privacidade:** Nenhuma alteração pode introduzir cookies de terceiros sem o consentimento prévio do usuário (aderência estrita à LGPD e GDPR).

