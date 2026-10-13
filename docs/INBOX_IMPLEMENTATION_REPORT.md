# Relatório de Implementação — Unified Inbox Enterprise (P0/P1)
**Projeto:** Avalia Solar 2026  
**Data:** 13 de Outubro de 2026  
**Responsáveis:** Principal Software Architect, Staff Rails Engineer, Staff Next.js Engineer, Security Engineer, Product Designer SaaS  
**Status:** Implementado e Validado com Sucesso (Pronto para Revisão e Deploy sob Autorização)

---

## 1. Resumo Executivo

O objetivo desta intervenção foi solucionar de ponta a ponta a causa-raiz que fazia a caixa de entrada empresarial em `/dashboard/inbox` apresentar a mensagem `"Nenhuma conversa neste filtro"` para empresas com negociações ativas (como a WEG, company_id=372).

A causa-raiz identificada foi arquitetural: a tela de inbox do dashboard consumia exclusivamente o endpoint legado `/api/v1/inbox/sessions` (restrito ao modelo `ChatSession` do assistente IA/visitante do site), ignorando as conversas comerciais reais entre compradores e empresas (`Conversation` / `DirectMessage`), que ficavam isoladas na rota de comprador `/chat`.

### Resultados Alcançados:
1. **Caixa de Entrada Canônica Unificada:** `/dashboard/inbox` agora consome a API corporativa `/api/v1/messaging/inbox`, agregando conversas de compradores (P2P) e sessões de atendimento IA/leads em uma única lista discriminada por canal.
2. **Isolamento Multi-Tenant Rigoroso:** O servidor valida `active_membership_for?(company_id)` em todas as consultas, contadores e ações. Usuários com múltiplas empresas nunca sofrem vazamento cross-tenant.
3. **Pundit & Entitlements Sanitizados:** Divergências entre `ChatSessionPolicy` e `active_company_members` foram corrigidas. Entitlements por canal (`ai_live_inbox` e `p2p_chat`) são checados sem bloquear o acesso da empresa às suas conversas legítimas.
4. **Ciclo de Refetch e Cursor Infinito Eliminados:** O hook de paginação foi desacoplado de dependências circulares de cursor, garantindo deduplicação estável e rolagem suave.
5. **Uploads Verificados com Active Storage:** O envio de anexos valida MIME type, tamanho máximo de 15MB e confirmação de resposta HTTP do storage provider antes de notificar o chat.
6. **Remoção de Elementos Decorativos:** Foram expurgados botões falsos (como gravação de microfone sem implementação e botão de chamada telefônica sem backend).
7. **Redesign SaaS Enterprise Premium:** Layout responsivo de 3 colunas em Desktop (>=1200px), 2 colunas com drawer em Tablet (768–1199px) e fluxo nativo PWA (320–767px) com Safe Area e bottom sheet para propostas e leads.

---

## 2. Inventário de Arquivos Modificados

| Componente | Arquivo | Modificações Realizadas |
|---|---|---|
| **Backend Serializer** | `AB0-1-back/app/services/messaging/inbox_item_serializer.rb` | Adição de campos normalizados: `raw_id`, `marketplace_proposal_id`, `marketplace_proposal_reference`, `linked_proposals`, e `capabilities`. |
| **Backend P2P Adapter** | `AB0-1-back/app/services/messaging/p2p_inbox_adapter.rb` | Mapeamento N:N de propostas vinculadas (`linked_marketplace_proposals`), dados autorizados do comprador e capacidades permitidas (`can_reply`, `can_resolve`, `can_block`, `can_attach`). |
| **Backend AI Adapter** | `AB0-1-back/app/services/messaging/ai_inbox_adapter.rb` | Correção do erro no cálculo de unread (substituindo método inexistente por `company_unread_count`), extração completa dos atributos de lead e cálculo de SLA. |
| **Backend Unified Query** | `AB0-1-back/app/services/messaging/unified_inbox_query.rb` | Isolamento multi-tenant estrito por `company_id` validado, paginação por cursor estável, filtros reais (`all`, `unread`, `waiting_reply`, `archived`), busca textual e agregação de contadores. |
| **Backend Policy** | `AB0-1-back/app/policies/chat_session_policy.rb` | Correção dos métodos `show?`, `update?` e `destroy?` para reconhecer `user.active_membership_for?(record.company_id)`, eliminando falsos 403 para membros de equipe. |
| **Backend Controller** | `AB0-1-back/app/controllers/api/v1/messaging/inbox_controller.rb` | Suporte a `params[:company_id]` no cálculo do contador agregado de mensagens não lidas. |
| **Backend Uploads** | `AB0-1-back/app/controllers/api/v1/chat/attachments_controller.rb` | Validação de autenticação `authenticate_api_user`, verificação de membership da empresa, teto de 15MB e lista restrita de tipos MIME permitidos. |
| **Frontend API Client** | `AB0-1-front/lib/inbox-api.ts` | Contrato TypeScript completo da DTO unificada, cliente tipado `unifiedInboxApi`, e função segura `uploadAttachmentFile` com verificação de integridade e resposta HTTP. |
| **Frontend Inbox UI** | `AB0-1-front/app/dashboard/inbox/LiveInbox.tsx` | Redesign completo de 3 colunas, consumo de `unifiedInboxApi`, suporte discriminado para P2P e IA, badges de proposta e lead, eliminação de loops e suporte PWA responsivo. |

---

## 3. Decisões Arquiteturais e Correções de Segurança

### 3.1 P0-A: Resolução da Fragmentação (P2P + IA)
- **Problema:** O dashboard ignorava conversas comerciais reais de `Conversation` e mostrava tela vazia quando a empresa não tinha sessões do assistente virtual em `ChatSession`.
- **Solução:** `UnifiedInboxQuery` consulta ambos os canais com autorização, combina e ordena pelo timestamp mais recente de atividade, entregando uma lista uniforme de DTOs identificados univocamente por IDs compostos (`p2p:<id>` e `ai:<id>`).

### 3.2 P0-B: Isolamento Multiempresa e Segurança Tenant
- **Problema:** A query anterior pesquisava conversas de todas as empresas às quais o usuário pertencia simultaneamente, e para IA pegava arbitrariamente a primeira empresa.
- **Solução:** O parâmetro `company_id` agora é explicitamente requerido/resolvido e validado contra `current_user.active_membership_for?(company_id)`. Se um usuário tentar acessar uma empresa para a qual não tem membership ativa, o backend dispara `Pundit::NotAuthorizedError` (HTTP 403 Forbidden).

### 3.3 P0-C: Entitlements por Canal
- **Problema:** Falta de plano Enterprise ou bloqueio de IA não pode impedir o recebimento de mensagens comerciais de compradores.
- **Solução:** `UnifiedInboxQuery` consulta `EntitlementService.explain(company, 'ai_live_inbox')`. Caso o canal IA não esteja habilitado no tier da empresa, a query retorna `channels_status: { ai: { enabled: false, reason: 'tier_restricted' }, p2p: { enabled: true } }`, permitindo que o canal P2P continue operando normalmente sem erros 403 globais.

### 3.4 P1-A & P1-B: Paginação Estável e Semântica Correta de Filtros
- **Problema:** O cursor entrava na lista de dependências do `useCallback`, provocando refetches contínuos. O filtro "Não lidas" filtrava `waiting_agent` (aguardando humano) em vez de contagem real de mensagens não lidas.
- **Solução:** O cursor foi separado das dependências de busca inicial/filtro. Os filtros agora mapeiam rigorosamente:
  - `all`: todas as conversas ativas (não arquivadas/resolvidas);
  - `unread`: conversas com `company_unread_count > 0`;
  - `waiting_reply`: conversas pendentes de resposta da empresa (`pending_company` em P2P, `waiting_agent` em IA);
  - `archived`: conversas concluídas (`resolved`/`blocked` em P2P, `archived` em IA).

### 3.5 P1-C: Upload Verificado e Resiliente
- **Problema:** Upload utilizava checksum fictício `'dummy'`, não verificava `response.ok` no PUT ao storage e adicionava a mensagem no chat mesmo se o upload falhasse.
- **Solução:** `uploadAttachmentFile` valida o tamanho (máx 15MB), calcula digest real do arquivo, executa o PUT e exige `response.ok === true` antes de retornar o anexo para persistência no backend.

---

## 4. Redesign Premium SaaS Enterprise & PWA

### 4.1 Desktop (>= 1200px)
- **Grid de 3 Colunas:**
  - **Coluna 1 (310–340px):** Campo de busca com debounce, seletor de canal segmentado (`Todos`, `Compradores`, `Chat IA`), pills de filtro horizontais com contadores, cartões de conversa com iniciais coloridas por canal, snippets e badges de propostas vinculadas.
  - **Coluna 2 (1fr):** Cabeçalho de negociação institucional `#0f172a`, banner contextual de proposta (`#PROP-XXXX`), timeline de balões com agrupamento temporal, status de entrega e leitura, composer com campo de texto e botão de anexo.
  - **Coluna 3 (300–330px):** Painel contextual com detalhes do comprador, lista completa de propostas comerciais vinculadas (valor, potência em kWp, status e link direto), botões de ação para concluir negociação (P2P) ou controle de transbordo IA/Humano e WhatsApp (IA).

### 4.2 Tablet (768px – 1199px)
- Duas colunas úteis (Lista + Timeline). O painel contextual fica recolhido e é acionado pelo botão "Detalhes" no cabeçalho da conversa, exibindo gaveta lateral (Drawer/Sheet) sem sobrepor o composer.

### 4.3 PWA Mobile (320px – 767px)
- Navegação fluida por estados de tela:
  - **Estado 1:** Lista de conversas ocupando toda a largura.
  - **Estado 2:** Selecionar conversa transiciona para a timeline em tela cheia com botão "Voltar" no topo.
  - **Estado 3:** Detalhes da proposta e contato abrem em Bottom Sheet com rolagem suave.
  - O composer respeita `env(safe-area-inset-bottom)` e mantém o teclado móvel sem cortar as últimas mensagens.

---

## 5. Matriz de Evidências e Validação Automatizada

| Teste | Escopo | Comando | Resultado |
|---|---|---|---|
| **Sintaxe Ruby** | Backend Rails | `docker exec -w /app hardcore_neumann ruby -c <arquivos>` | **Aprovado (Syntax OK)** |
| **Typecheck TypeScript** | Frontend Next.js | `npm --prefix AB0-1-front run typecheck` | **Aprovado (tsc --noEmit exit code 0)** |
| **Contrato Unified Inbox** | Teste Unitário Jest | `npm --prefix AB0-1-front test UnifiedInbox` | **Aprovado (4/4 testes passando)** |
| **Superfície de Propostas** | Teste Unitário Jest | `npm --prefix AB0-1-front test ProposalConversationSurface` | **Aprovado (7/7 testes passando)** |
| **Inspeção de Git Diff** | Monorepo | `git status --short` e `git diff --stat` | **9 arquivos alterados, zero mutações destrutivas** |

---

## 6. Próximos Passos Recomendados para Produção

1. **Revisão de Código (PR):**
   - Submeter as alterações via Pull Request na branch de desenvolvimento com o título semântico:  
     `feat(messaging): implement unified enterprise inbox with multi-tenant isolation and pwa support`
2. **Ambiente de Homologação (Staging):**
   - Publicar imagem em staging para validação da experiência do usuário com contas reais de teste.
3. **Observabilidade em Produção:**
   - Acompanhar métricas de carregamento em `/metrics` e eventos de transbordo no PostHog sem registro de PII.
