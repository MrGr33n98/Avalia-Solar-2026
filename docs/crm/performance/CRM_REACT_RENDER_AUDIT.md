# CRM React Render Audit

## Auditoria de Renderização
- **Componente Principal**: `SalesCommandCenter.tsx`.
- **Problema Inicial**: O estado do formulário de criação (inputs, selects, erros) residia diretamente em `SalesCommandCenter.tsx`, forçando cada digitação a re-renderizar todas as colunas do Kanban board.
- **Solução Aplicada**:
  - Encapsulamento completo do estado do formulário dentro de `CreateOpportunityDialog.tsx`.
  - Ao clicar em "Nova Oportunidade", apenas a flag booleana `isNewDealOpen` é alterada, renderizando o Dialog isoladamente.
  - Re-renders do Kanban Board ao abrir modal: **0**.
