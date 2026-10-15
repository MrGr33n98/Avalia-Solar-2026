# Track Your Prospects — Arquitetura de Rastreamento de Prospects (Benchmark G2)

## 1. Visão Geral Executiva

O módulo **Track Your Prospects** do Avalia Solar implementa a paridade completa com o recurso de atribuição de leads e visitantes do G2 (*Track Your Prospects / Buyer Intent*). Ele conecta de forma determinística e respeitando a privacidade (LGPD) os cliques originados nas páginas de perfil e diretório do marketplace às sessões, formulários e conversões realizadas nas landing pages dos parceiros e integradores solares.

Toda a telemetria é **100% verídica**: não existem perfis fakes, contadores artificiais ou dados mockados em runtime de produção.

---

## 2. Matriz de Mapeamento Completa

| HTML Aprovado (`AVALIA_SOLAR_TRACK_PROSPECTS_FINAL_INTERATIVO.html`) | Componente React (Frontend Next.js) | Endpoint da API (Rails Backend) | Tabelas SQL / Modelos | Testes Automatizados | Status / Evidência |
|---|---|---|---|---|---|
| **Aba Overview:** Cards de Métricas (Cliques, Chegadas, Conversões, Taxas) | `ProspectsOverviewTab.tsx` | `GET /api/v1/company_dashboard/analytics/prospects` | `outbound_clicks`, `sales_tracking_sessions`, `sales_tracking_events` | `company_dashboard_prospects_spec.rb`, `TrackYourProspectsWorkspace.spec.tsx` | Validado (100% real) |
| **Aba Overview:** Gráfico Temporal & Fontes | `ProspectsOverviewTab.tsx` | `GET /api/v1/company_dashboard/analytics/prospects` | `outbound_clicks`, `sales_tracking_sessions` | `prospects_workspace_service_spec.rb` | Validado |
| **Aba Overview:** Tabela com Filtros e Exportação CSV | `ProspectsOverviewTab.tsx` | `GET /api/v1/company_dashboard/analytics/prospects/export` | `outbound_clicks`, `sales_tracking_sessions`, `sales_accounts` | `prospects_export_service_spec.rb` | BOM UTF-8 + Defesa DDE |
| **Aba Journey:** Stepper de 4 Etapas e Drawer Detalhado | `ProspectsJourneyTab.tsx`, `ProspectJourneyDrawer.tsx` | `GET /api/v1/company_dashboard/analytics/prospects/journey/:id` | `outbound_clicks`, `sales_tracking_sessions`, `sales_tracking_events` | `track_your_prospects_e2e_spec.rb` | Validado |
| **Aba Visitors:** Contas Identificadas vs. Anônimas | `ProspectsVisitorsTab.tsx` | `GET /api/v1/company_dashboard/analytics/prospects` | `sales_accounts`, `sales_tracking_sessions` | `company_dashboard_prospects_spec.rb` | Zero perfis falsos |
| **Aba Installation:** Snippet Tag V2, Copiar Código e Guias | `ProspectsInstallationTab.tsx` | `GET /api/v1/public/sales/tracking/:public_key.js` | `sales_tracking_sites` | `public_sales_tracking_v2_spec.rb` | Consent-Aware + replaceState |
| **Aba Integrations:** Configuração GA4 e IDs Customizados | `ProspectsIntegrationsTab.tsx` | `PATCH /api/v1/company_dashboard/analytics/prospects/settings` | `sales_tracking_sites.settings` (JSONB) | `company_dashboard_prospects_spec.rb` | Regex GA4 validado |
| **Aba Settings:** Status da Tag, Retenção LGPD e Origens HTTPS | `ProspectsSettingsTab.tsx` | `GET /api/v1/company_dashboard/analytics/prospects/health` | `sales_tracking_sites` | `tag_health_monitor_service_spec.rb` | HTTPS / Localhost estrito |
| **Navegação do Dashboard:** Item "Track Your Prospects" | `config/navigation.ts`, `BuyerIntentWorkspace.tsx` | `GET /dashboard/buyer-intent?tab=tracking-attribution` | N/A | `navigation.test.ts` | Integrado ao fluxo |

---

## 3. Ciclo de Vida da Telemetria e Atribuição

```
[ Marketplace Avalia Solar ]
   │
   ▼ Usuário clica no botão do site do parceiro
[ Outbound Redirect Controller ]
   │ 1. Cria OutboundClick
   │ 2. Gera as_click_id assinado com HMAC-SHA256
   │ 3. Anonimiza IP/User-Agent com salt seguro
   ▼ 302 Found
[ Landing Page do Parceiro (com Tag V2 instalada) ]
   │ 1. Tag lê as_click_id da URL
   │ 2. Remove as_click_id da barra de endereços (history.replaceState)
   │ 3. Aguarda consentimento LGPD (CMP / Google Consent Mode v2)
   │ 4. Envia ping de sessão (POST /sessions)
   ▼
[ Backend Avalia Solar: Api::V1::Public::Sales::TrackingController ]
   │ 1. Valida assinatura do token e chave pública
   │ 2. Garante multi-tenancy (impede atribuição cruzada entre parceiros)
   │ 3. Cria Sales::TrackingSession vinculada ao OutboundClick
   ▼
[ Interações na Landing Page ]
   │ 1. Envio de formulário -> POST /events (form_submitted)
   │ 2. Confirmação de Lead -> POST /events (lead_confirmed)
   ▼
[ Dashboard da Empresa no Avalia Solar ]
   │ 1. Visualização em tempo real das métricas
   │ 2. Inspeção da linha do tempo no Drawer PWA/Desktop
   │ 3. Auditoria de saúde da tag e exportação CSV protegida
```

---

## 4. Segurança, Privacidade e LGPD

1. **Anti-Open-Redirect:** Validação rigorosa dos domínios autorizados da empresa antes de qualquer redirecionamento externo.
2. **Anonimização Criptográfica:** Endereço IP do visitante e User-Agent são combinados com salt secreto e armazenados em formato hash (SHA256), inviabilizando reidentificação de pessoas naturais sem quebra do hash.
3. **Google Consent Mode v2 / CMP:** A tag JS suspende o envio de telemetria até que o consentimento (`granted`) seja emitido pelo banner de cookies da landing page ou via chamada explícita `window.avaliaTrack.grantConsent()`.
4. **Proteção Contra Injeção de Fórmulas no Excel (CSV Formula Injection):** O `ProspectsExportService` neutraliza valores maliciosos iniciados por `=`, `+`, `-`, `@`, `\t` ou `\r`, prefixando-os com `'`.
5. **Acentuação UTF-8 Impecável no Excel:** Inclusão do marcador Byte Order Mark (`\uFEFF`) em todos os arquivos CSV gerados.
6. **Multi-Tenant e Pundit:** Todo acesso aos dados analíticos e de configuração exige autenticação ativa em `CompanyMember` com papel autorizado via `CompanyPolicy#view_analytics?`.

---

## 5. Sequência de Pull Requests e Entregas

| PR | Branch | Pull Request URL | Status | Descrição Resumida |
|---|---|---|---|---|
| **PR 1** | `main` | Commit `b8a1ce36` | **Merged** | Auditoria e resolução de colisão de namespace (`::Company.find_by`) |
| **PR 2** | `feat/tracking-partner-consent-attribution-v2` | [#39](https://github.com/MrGr33n98/Avalia-Solar-2026/pull/39) | **Open (Draft)** | Tag V2, suporte CMP LGPD, `as_click_id` assinado e HMAC-SHA256 |
| **PR 3** | `feat/prospects-dashboard-ui-parity` | [#40](https://github.com/MrGr33n98/Avalia-Solar-2026/pull/40) | **Open (Draft)** | Paridade UI Web/PWA com 6 abas, Drawer de Jornada e navegação |
| **PR 4** | `feat/prospects-health-integrations-exports` | [#41](https://github.com/MrGr33n98/Avalia-Solar-2026/pull/41) | **Open (Draft)** | Tag Health Monitor, validação de origens HTTPS e ProspectsExportService |
| **PR 5** | `feat/prospects-e2e-validation-and-docs` | [#42](https://github.com/MrGr33n98/Avalia-Solar-2026/pull/42) | **Open (Draft)** | Teste automatizado ponta a ponta e documentação consolidada |

---

## 6. Resultados da Validação Automatizada

- **Backend RSpec:** 36 exemplos executados, 0 falhas (100% verde).
- **Frontend Jest:** 12 testes executados em 4 suites, 0 falhas (100% verde).
- **Total:** 48 testes automatizados aprovados sem nenhum mock artificial em runtime.
