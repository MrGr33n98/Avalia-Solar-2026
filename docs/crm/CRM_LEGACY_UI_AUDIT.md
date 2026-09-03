# Auditoria de Telas Legadas & Unificação de Shell — Avalia Solar CRM

## Matriz de Migração de Wrapper de Páginas (HEAD State)

| Rota | Wrapper Canônico Atual | Status da Migração | Risco Funcional |
| --- | --- | --- | --- |
| `/dashboard/sales` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/today` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/prospects` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/pipeline` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/accounts` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/people` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/emails` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/import` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/reports` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/tasks` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/quotes` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |
| `/dashboard/sales/settings` | `SalesLayoutWrapper` | **Migrado 100%** | Nulo |

---

## Regras de Unificação do CRM Shell
1. Nenhuma página sob `/dashboard/sales/**` renderiza o `DashboardSidebar` legado ou a topbar global marketplace.
2. Todas as páginas utilizam o `SalesLayoutWrapper` que provê a sidebar B2B Navy (`#0c1a30`), o `CRMTopbar` compartilhado horizontal com busca e botão `+ Add new` lado a lado idênticos ao Nutshell CRM.
