# CRM Zero-500 Release Gate Audit

## Checklist de Aprovação

- [x] **Zero HTTP 500** em todos os fluxos de criação e edição comerciais.
- [x] **Serviço Atômico `Sales::Opportunities::Create`** implementado com transação única e validação de consistência contato-conta (`CONTACT_ACCOUNT_MISMATCH`).
- [x] **Pipeline Bootstrapping no Hot-Path Removido** (`CRM_PIPELINE_NOT_CONFIGURED` retornado com status 422 em caso de falha de configuração).
- [x] **Query Objects Leves (`AccountOptionsQuery`, `ContactOptionsQuery`)** ativos para comboboxes.
- [x] **Desacoplamento Frontend**: `CreateOpportunityDialog.tsx` isolado sem forçar re-render do Kanban board.
- [x] **TanStack Query Integrado** (`salesKeys`, `useSalesPipelines`, `useSalesAccountOptions`, `useSalesContactOptions`, `useCreateOpportunityMutation`).
- [x] **Double-Submit Protection** implementada em todos os botões de submissão do formulário.
- [x] **Notificações Toast Unificadas** via `sonner`.
- [x] **Auditoria de Índices PostgreSQL** confirmada em `db/schema.rb`.
- [x] **Qualidade do Código**: `npm run typecheck` (0 erros) e `check-sales-zero-mock.sh` (PASS).
