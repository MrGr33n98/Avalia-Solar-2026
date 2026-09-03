# Auditoria de Telas Legadas & Unificação de Shell — Avalia Solar CRM

## Matriz de Migração de Wrapper de Páginas

| Rota | Wrapper Anterior | Wrapper Canônico Atual | Status da Migração | Risco Funcional |
| --- | --- | --- | --- | --- |
| `/dashboard/sales` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/today` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Médio |
| `/dashboard/sales/prospects` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/pipeline` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/accounts` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/people` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/emails` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/import` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/reports` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/reports/forecast` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Baixo |
| `/dashboard/sales/reports/attribution` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Baixo |
| `/dashboard/sales/tasks` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Baixo |
| `/dashboard/sales/quotes` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Baixo |
| `/dashboard/sales/settings` | `SalesLayoutWrapper` | `SalesLayoutWrapper` | **Migrado** | Baixo |
| `/dashboard/sales/settings/access` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Baixo |
| `/dashboard/sales/settings/access/assign` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Baixo |
| `/dashboard/sales/settings/integrations` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Baixo |
| `/dashboard/sales/settings/tracking` | `DashboardLayout` | `SalesLayoutWrapper` | **P0 - Em Migração** | Baixo |

---

## Regras de Unificação do CRM Shell
1. Nenhuma página sob `/dashboard/sales/**` pode renderizar o `DashboardSidebar` legado ou a topbar global marketplace.
2. Todas as páginas utilizam o `SalesLayoutWrapper` que provê a sidebar B2B Navy (`#0c1a30`), o `CRMTopbar` compartilhado, e o menu `+ Add new` funcional.
