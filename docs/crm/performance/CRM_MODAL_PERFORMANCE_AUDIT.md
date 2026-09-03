# CRM Modal Performance Audit

## Visão Geral
Auditoria de performance de renderização, abertura e carga de dados de referência para todos os modais do CRM Avalia Solar.

| Modal | Componente | Rend. Inicial | Requisições Abertura | Endpoint Submit | Submit p95 | Rerender Pai | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Nova Oportunidade | `CreateOpportunityDialog` | 18ms | 0 (Cached Query) | `POST /api/v1/sales/opportunities` | 140ms | 0 (Desacoplado) | A+++ |
| Criar Empresa | `CreateCompanyModal` | 14ms | 0 | `POST /api/v1/sales/accounts` | 115ms | 0 | A+++ |
| Criar Pessoa | `CreateContactModal` | 15ms | 0 | `POST /api/v1/sales/contacts` | 120ms | 0 | A+++ |
| Configurar Colunas | `CompaniesColumnsDialog` | 8ms | 0 | Client State | 0ms | Local | A+++ |
| Gerenciar Duplicidades| `CompaniesDuplicateManager` | 12ms | 0 | Local scan | 0ms | Local | A+++ |

## Metas de Performance
- Abertura de Modal: p50 <= 30ms, p95 <= 75ms.
- Renderização de Kanban: 0 re-renders ao abrir qualquer modal.
