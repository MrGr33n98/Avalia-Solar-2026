# Campaign Workstation — Current State Audit

> **Data:** Setembro 2026  
> **Status:** AUDITADO & CERTIFICADO  
> **Diretório:** `docs/03-campaign/`

---

## 1. Visão Geral do Módulo de Campanhas

O módulo **Campaign Workstation** do Avalia Solar CRM foi desenhado para gerenciar campanhas de disparo de e-mail (broadcast, sequências e disparos baseados em eventos) integrado de forma nativa aos domínios canônicos de vendas (`Sales::Account`, `Sales::Contact`, `Sales::EmailTemplate`, `Sales::EmailMessage`).

---

## 2. Componentes Backend

- **Controller:** `Api::V1::Sales::CampaignsController` (`AB0-1-back/app/controllers/api/v1/sales/campaigns_controller.rb`)
- **Services:**
  - `Sales::Campaigns::Preflight` (validação de pré-requisitos antes do disparo)
  - `Sales::Campaigns::SnapshotService` (congelamento de audiência)
  - `Sales::Campaigns::Dispatcher` (orquestração de disparo com lock distribuído no Redis via Lua Script)
  - `Sales::Campaigns::MetricsCalculator` (cálculo de métricas de entrega, abertura e clique)
- **Background Jobs:**
  - `Sales::CampaignBatchProcessorJob` (processamento assíncrono em lotes no Sidekiq)

---

## 3. Modelo de Dados & Schema

| Tabela | Função | Índices de Performance |
| --- | --- | --- |
| `sales_campaigns` | Tabela principal de campanhas | `(company_id, created_at DESC)`, `(company_id, status)` |
| `sales_campaign_recipients` | Congelamento de contatos da audiência | `(sales_campaign_id, email) UNIQUE`, `(company_id, sales_campaign_id, status)` |
| `sales_campaign_daily_metrics` | Métricas agregadas por dia | `(sales_campaign_id, metric_date) UNIQUE` |
| `sales_email_messages` | Mensagens individuais enviadas | `(sales_campaign_id)` |

---

## 4. Frontend Campaign Workstation

- **Página Principal:** `AB0-1-front/app/dashboard/sales/campaigns/page.tsx`
- **API Client:** `AB0-1-front/lib/api-campaigns.ts`
- **Componentes:** `CampaignsHeader`, `CampaignAnalyticsCards`, `CampaignsTable`, `CampaignWizardModal`
