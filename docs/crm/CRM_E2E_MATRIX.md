# Matriz de Testes E2E (Playwright) do CRM Sales — Avalia Solar 2026

## Jornadas Críticas de Testes E2E

| ID Jornada | Descrição do Fluxo | Etapas do Teste | Validação Pós-F5 (Reload) | Status |
| --- | --- | --- | --- | --- |
| **JOURNEY_01** | Criar Empresa (Account) | Login → `/dashboard/sales/accounts` → "+ Add new company" → preencher nome/domínio → Salvar | Empresa visível na listagem e na busca server-side pós-F5 | PASS |
| **JOURNEY_02** | Criar Contato vinculado à Empresa | `/dashboard/sales/people` → "+ Add person" → selecionar Account → preencher nome/email → Salvar | Contato exibido na aba Contacts da Account pós-F5 | PASS |
| **JOURNEY_03** | Criar Oportunidade | `/dashboard/sales` → "+ Nova Oportunidade" → pesquisar/selecionar Account → selecionar Contato → Valor → Salvar | Oportunidade exibida na coluna Prospect do Kanban pós-F5 | PASS |
| **JOURNEY_04** | Transição de Estágio no Kanban (DnD) | Arrastar Oportunidade de Prospect para Proposal → PATCH `/api/v1/sales/opportunities/:id` | Oportunidade permanece na coluna Proposal pós-F5 com StageHistory gerado | PASS |
| **JOURNEY_05** | Registrar Atividade & Tarefa | Ficha da Oportunidade → Registrar Ligação → Criar Tarefa → Concluir Tarefa | Histórico de Atividades e Timeline atualizados pós-F5 | PASS |
| **JOURNEY_06** | Renovação de Sessão (401 Auth Refresh) | Expirar token JWT → fazer requisição à API Sales → interceptar 401 | Auto-refresh via `/api/v1/auth/refresh` com retry bem-sucedido sem redirecionar | PASS |
| **JOURNEY_07** | Tratamento Semântico de 403 Forbidden | Usuário sem autorização tenta ação restrita | Banner "Você não possui permissão para esta operação" exibido sem deslogar | PASS |
