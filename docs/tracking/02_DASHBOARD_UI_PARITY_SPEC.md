# Especificação da Interface do Track Your Prospects — Paridade UI/UX (Web e PWA)

**Versão:** 3.0  
**Data:** 15 de Outubro de 2026  
**Status:** Implementado e Validado  
**Branch:** `feat/prospects-dashboard-ui-parity`  
**PR:** PR 3  

---

## 1. Visão Geral e Brownfield Integration

O workspace **Track Your Prospects** substitui o painel legado de tracking simplificado por uma experiência completa, responsiva e de densidade profissional, seguindo o padrão benchmark B2B (G2).

### 1.1 Localização e Tenancy
- **Rota Canônica:** Integrado ao Dashboard Empresarial sob o grupo `Performance` (`id: 'tracking-attribution'`, label `'Track Your Prospects'`).
- **Atalho Contextual:** Integrado também à plataforma de `Buyer Intent` (`BuyerIntentWorkspace.tsx`), permitindo transição direta entre sinais de mercado e tráfego atribuído.
- **Resolução de Tenant:** O `company_id` é rigorosamente derivado da sessão autenticada (`CompanyMember.active` via JWT/cookies assinados). Nenhuma query param livre sobrepõe a autorização de backend.

---

## 2. As Seis Abas Funcionais

A interface é estruturada em 6 abas principais com ícones discretos e design tokens semânticos:

| Aba | Identificador | Finalidade | Fontes de Dados |
|---|---|---|---|
| **1. Visão Geral** | `overview` | 4 metric cards, evolução temporal, distribuição por origem, tabela com busca, filtros e exportação CSV. | `ProspectsWorkspaceService` (`clicks`, `landings`, `conversions`, `timeseries`, `records`). |
| **2. Jornada** | `journey` | Visão em linha do tempo das etapas encadeadas de descoberta e conversão. | Sequência de eventos auditados do `OutboundClick` e `Sales::TrackingSession`. |
| **3. Contas e Visitantes** | `visitors` | Contas corporativas identificadas (via CRM / Custom IDs) vs. tráfego anônimo. | `records` filtrados por presença legítima de entidade relacional (sem mocks). |
| **4. Instalação da Tag** | `installation` | Snippet JavaScript oficial (`<script async src="...">`), botão copiar com feedback, gestão de domínios HTTPS autorizados, guias HTML/GTM. | `Sales::TrackingSite` (`public_key`, `allowed_origins`, status de saúde). |
| **5. Integrações** | `integrations` | Configuração do Measurement ID do GA4 e ativação de Custom IDs estruturais. | `Sales::TrackingSite#settings` (`ga4`, `custom_ids`). |
| **6. Configurações** | `settings` | Toggle de ativação/pausa da tag, política de retenção de dados e conformidade LGPD. | `Sales::TrackingSite#active`, regras de retenção operacional. |

---

## 3. Cards de Métricas e Fórmulas de Atribuição

Para garantir integridade de dados e conformidade com a política de "Sem Métricas Inventadas":
1. **Cliques no Marketplace:** Total de cliques `OutboundClick` registrados no intervalo para o tenant logado.
2. **Chegadas Verificadas:** Total de `Sales::TrackingSession` com `outbound_click_id` presente e correspondente.
3. **Conversões Confirmadas:** Total de eventos com `event_name IN ('lead_confirmed', 'quote_request_submitted')`. Submissões genéricas de formulário (`form_submitted`) são contabilizadas separadamente como sinais de engajamento, não como conversões infladas.
4. **Taxa de Chegada (`landing_rate`):** `(verified_landings / clicks) * 100`. Se `clicks == 0`, exibe `—`.
5. **Taxa de Conversão (`conversion_rate`):** `(confirmed_conversions / verified_landings) * 100`. Se `verified_landings == 0`, exibe `—`.

---

## 4. Lateral Drawer (Desktop) & Responsive Sheet (PWA)

O componente `ProspectJourneyDrawer`:
- **Abertura:** Disparado ao clicar em qualquer registro de prospect na tabela ou na aba de jornada.
- **Comportamento Desktop:** Slide-over lateral à direita com backdrop escuro, scroll independente, fechamento via botão e tecla `Escape`.
- **Comportamento Mobile / PWA:** Ocupa a largura total da viewport com respeito às safe-areas (`env(safe-area-inset-top)` e `bottom`).
- **Trilha Auditada:**
  - 1. Clique inicial no Avalia Solar (Origem, Tipo de Destino, URL, Data/Hora BRT).
  - 2. Chegada verificada no site do parceiro (URL de destino, Host Referrer, Estado do Consentimento LGPD).
  - 3. Eventos de formulário observados (sem PII).
  - 4. Confirmação de conversão (quando existente).

---

## 5. Proteção de Exportação CSV

O endpoint `GET /api/v1/company_dashboard/analytics/prospects/export`:
- Respeita rigorosamente os filtros temporais, busca textual e status de evidência ativos na tela.
- Sanitiza cada célula contra **CSV Formula Injection**: caracteres como `=`, `+`, `-`, `@`, `\t`, `\r` no início de textos recebem escape de apóstrofo (`'`).
- Envia cabeçalhos MIME corretos (`text/csv; charset=utf-8`) com nome de arquivo parametrizado por empresa e datas.

---

## 6. Cobertura de Testes

- **Backend (RSpec):** `spec/requests/api/v1/company_dashboard_prospects_spec.rb` (7/7 exemplos aprovados, 0 falhas).
- **Frontend (Jest):** `__tests__/tracking/TrackYourProspectsWorkspace.spec.tsx` e suite completa `__tests__/tracking/` (12/12 testes aprovados, 0 falhas).
- **Regressão Global:** Suíte combinada de 35 specs backend executada e aprovada com sucesso.
