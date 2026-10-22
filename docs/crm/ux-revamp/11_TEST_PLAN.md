# 11 — Plano de Testes Integrado A+++ (Unitários, Integração & E2E)

## 1. Escopo e Estratégia de Teste

A garantia de qualidade do CRM Avalia Solar adota uma pirâmide de testes rigorosa:
1. **Unitários & Componentes (Jest + React Testing Library):** Validação de renderização, formulários, modais, dirty state, acessibilidade ARIA e tratamento de respostas HTTP.
2. **Contratos & Requisições Backend (RSpec):** Verificação de status HTTP, validações do modelo, callbacks de auditoria e isolamento multi-tenant.
3. **Ponta a Ponta (Playwright E2E):** Fluxos de navegação completos simulando navegadores desktop e dispositivos móveis (Chromium, Mobile Chrome e Mobile Safari em 320px, 375px, 768px e 1440px).

---

## 2. Cenários Prioritários (Gherkin SCN-001 a SCN-026)

- **SCN-001 (Web Layout 1440px):** Usuário comercial acessa `/dashboard/sales` → Sidebar e Topbar exibidas, sem barra móvel, sem overflow horizontal da página.
- **SCN-002 (PWA Layout 375px):** Usuário acessa `/dashboard/sales` em smartphone → Header compacto + `CRMMobileBottomNav` ativo, safe-area respeitada, navegação suave entre Hoje, Pipeline, Empresas e Tarefas.
- **SCN-003 (Acesso Não Autorizado):** Usuário sem perfil comercial tenta chamar `/api/v1/sales/accounts` ou abrir URL direta → Resposta 403 Forbidden sem vazamento de dados.
- **SCN-004 (Isolamento Multi-tenant):** Usuário A tenta buscar empresa de outro tenant → Nenhum resultado retornado.
- **SCN-005 (Registro de Ligação com Sucesso):** Formulário submetido com conta válida e API retorna 201 Created com `{ activity: { id: 123 } }` → Toast de sucesso, modal fechado e timeline atualizada pós-reload.
- **SCN-006 (Registro de Ligação com Erro):** API retorna 422/500 ou timeout → Modal permanece aberto, mensagem de erro exibida, anotações preservadas para reenvio.
- **SCN-007 (Ligação sem Contexto de Conta):** Usuário abre CallLogger sem `accountId` → Sistema bloqueia o salvamento e não exibe falso sucesso.
- **SCN-008 (Kanban Drag-and-Drop Desktop):** Usuário move card de Prospecção para Qualificação → API PATCH confirmada, stage_history registrado e card fixado na nova coluna.
- **SCN-009 (Mudança de Estágio Touch PWA):** Usuário móvel altera estágio via sheet de seleção rápida → Transição atômica executada sem depender de drag-and-drop.
- **SCN-010 (Rollback em Falha de Estágio):** PATCH de oportunidade rejeitado por regra de negócio → Card retorna à coluna de origem com mensagem de erro explicativa.
- **SCN-013 (Teclado Virtual em Viewport 320px):** Filtros abertos com teclado ativo → Bottom sheet limita altura a 70dvh e botão Aplicar permanece visível.
- **SCN-014 (Proteção de Rascunho Dirty):** Usuário digita notas e clica fora do modal → Confirmação de descarte solicitada antes de fechar.
- **SCN-016 (Criação de Proposta Comercial):** Proposta gerada a partir da oportunidade → IDs vinculados automaticamente sem digitação manual.
- **SCN-020 (Falha de Conexão durante Salvamento):** Conexão interrompida durante o POST → Sistema não simula persistência e exibe aviso de rede.
- **SCN-021 (Purga de Cache no Logout):** Logout efetuado → Todas as chaves em memória e consultas são limpas para impedir vazamento entre usuários.
