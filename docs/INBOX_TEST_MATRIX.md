# Matriz de Testes e Validação — Unified Inbox Enterprise

> **Documento:** Plano de Testes, Matriz de Casos e Evidências de Execução  
> **Sistema:** Avalia Solar 2026 (`AB0-1-back` + `AB0-1-front`)  
> **Status:** Em Validação  

---

## 1. Testes Automatizados no Backend (RSpec)

| ID | Cenário | Expectativa | Status |
| :--- | :--- | :--- | :--- |
| **BE-01** | Empresa apenas com conversas P2P | Aparece no inbox; contadores e lista íntegros | Em execução |
| **BE-02** | Empresa apenas com sessões IA | Aparece no canal IA; lead serializado corretamente | Em execução |
| **BE-03** | Empresa com ambos os canais | Lista mista unificada ordenada por atividade mais recente | Em execução |
| **BE-04** | Isolamento Multi-Tenancy | Usuário com múltiplas empresas só vê dados da empresa passada em `company_id` | Em execução |
| **BE-05** | Proteção contra IDOR / Não autorizados | Usuário sem membership recebe 403 Forbidden | Em execução |
| **BE-06** | Consistência de Policy Pundit | `ChatSessionPolicy` aceita membro ativo mesmo que `user.company_id` seja nulo/diferente | Em execução |
| **BE-07** | Entitlements segregados | Bloqueio de IA não bloqueia P2P e vice-versa | Em execução |
| **BE-08** | Paginação estável | Cursor baseado em timestamp/id sem saltos ou duplicatas | Em execução |
| **BE-09** | Contagem não lida | Contador reflete soma de `company_unread_count` das conversas ativas | Em execução |
| **BE-10** | Vínculos N:N com Propostas | `linked_proposals` serializa todas as propostas vinculadas autorizadas | Em execução |

---

## 2. Testes de Unidade e Componentes no Frontend (Jest / RTL)

| ID | Cenário | Expectativa | Status |
| :--- | :--- | :--- | :--- |
| **FE-01** | Renderização com itens dos dois canais | Renderiza badges de `P2P` e `IA` com detalhes do interlocutor | Em execução |
| **FE-02** | Tratamento de estados de erro | 403 e 500 exibem mensagens de erro seguras e não "lista vazia" | Em execução |
| **FE-03** | Alternância de Empresa | Limpa conversas da empresa anterior e resubscreve realtime | Em execução |
| **FE-04** | Filtro "Não lidas" | Filtra exclusivamente conversas com `unread_count > 0` | Em execução |
| **FE-05** | Envio Otimista e Rollback | Insere mensagem temporária `sending` e trata falha com retry | Em execução |
| **FE-06** | Preservação de Deep Links | Acesso com `conversation_id` ou `session_id` seleciona a thread correta | Em execução |

---

## 3. Testes End-to-End (E2E / Playwright / Responsividade)

| ID | Breakpoint | Foco de Validação | Status |
| :--- | :--- | :--- | :--- |
| **E2E-01**| Desktop 1440px / 1280px | 3 colunas, scroll independente, sem overflow horizontal | Em execução |
| **E2E-02**| Tablet 1024px / 768px | 2 colunas, gaveta lateral para ficha do lead, sidebar compacta | Em execução |
| **E2E-03**| Mobile 375px / 390px / 430px | Navegação em tela cheia (Lista -> Thread), botão voltar, composer visível acima da safe area | Em execução |
