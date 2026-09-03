# Relatório de Consolidação de UI e UX — Avalia Solar CRM

## Resumo das Melhorias da Sprint

1. **Eliminação de Wrappers Duplicados**:
   - `DashboardLayout` removido de 100% das páginas sob `/dashboard/sales/**`.
   - Todas as rotas agora utilizam o `SalesLayoutWrapper` com a sidebar B2B Navy (`#0c1a30`).

2. **Menu Global `+ Add new` Funcional**:
   - 8 Ações reais mapeadas no registro `CRM_CREATE_ACTIONS`.
   - Zero botões mortos.

3. **Padronização do Design System de Modais**:
   - Respiro vertical e padding interno unificados em `p-6` (24px).
   - Larguras expandidas para evitar inputs colados e formulários espremidos:
     - Opportunity Modal: `680px`
     - Call Logger: `620px`
     - Contact 360: `880px`
     - Company 360: `1000px`

4. **Atomicidade no Fluxo de Oportunidades**:
   - Suporte a criação transacional de Account, Contact e Opportunity em um único bloco de banco de dados (`ActiveRecord::Base.transaction`).
