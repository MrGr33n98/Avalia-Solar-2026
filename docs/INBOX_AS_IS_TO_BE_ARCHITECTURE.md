# Arquitetura AS-IS vs. TO-BE — Unified Inbox Enterprise (P0/P1)

> **Documento:** Especificação Arquitetural e Fluxos de Dados  
> **Sistema:** Avalia Solar 2026 (`AB0-1-back` + `AB0-1-front`)  
> **Status:** Arquitetura Aprovada  

---

## 1. Visão Geral da Arquitetura

A plataforma de atendimento corporativo do Avalia Solar opera sob o conceito de **Uma UX Unificada, Dois Domínios de Mensageria**:

```
                       EMPRESA AUTENTICADA
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
      Canal P2P (Direto)                  Canal Atendimento IA
  (Comprador <-> Empresa)             (Visitante / Lead IA / Handoff)
            │                                     │
    Tabela: conversations                 Tabela: chat_sessions
    Tabela: direct_messages               Tabela: chat_messages
    Tabela: conversation_proposal_links   Tabela: chat_leads
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
               Messaging::UnifiedInboxQuery
               GET /api/v1/messaging/inbox
                               ▼
        ┌───────────────────────────────────────────┐
        │       Contrato DTO com Discriminated      │
        │             Union por Canal               │
        │        - id: "p2p:<id>" | "ai:<id>"       │
        │        - channel: "p2p" | "ai"            │
        │        - participant, last_message, sla   │
        │        - linked_proposals, lead_details   │
        └───────────────────────────────────────────┘
                               │
                               ▼
                    FRONTEND CANÔNICO ENTERPRISE
                  /dashboard/inbox (Desktop & PWA)
```

---

## 2. Comparativo Detalhado: Fluxos AS-IS vs. TO-BE

### 2.1 Fluxo AS-IS (Atual / Desconectado)

```
[Dashboard Sidebar: Mensagens]
              │
              ▼
    /dashboard/inbox
              │
              ▼ (LiveInbox.tsx)
    GET /api/v1/inbox/sessions?company_id=372
              │
              ▼ (Api::V1::Inbox::SessionsController)
    @company.chat_sessions
              │
              ├─ Se vazio ────────► "Nenhuma conversa neste filtro" (Bloqueio)
              │                     (IGNORA conversas comerciais reais)
              │
    [Comprador /chat] ────────────► GET /api/v1/conversations
                                    (Conversas ficam isoladas fora do Dashboard)
```

**Problemas do AS-IS:**
- Duplicidade de interfaces (`/chat` vs `/dashboard/inbox`).
- A empresa não vê as mensagens enviadas por compradores reais vinculadas a propostas quando está em seu painel principal.
- Não há isolamento multiempresa seguro em queries unificadas.
- Contratos não diferenciam canal via união discriminada confiável.

---

### 2.2 Fluxo TO-BE (Arquitetura Canônica Proposta)

```
[Dashboard Sidebar: Mensagens]
              │
              ▼
    /dashboard/inbox (Experiência Corporativa Canônica)
              │
              ▼
    GET /api/v1/messaging/inbox?company_id={active_id}&channel=all&filter={filter}
              │
              ├─ Validação Server-Side: current_user tem acesso à empresa {active_id}?
              ├─ Entitlements Server-Side:
              │    ├─ p2p_chat habilitado? Inclui conversas P2P da empresa.
              │    └─ ai_live_inbox habilitado? Inclui sessões IA da empresa.
              │       (Se IA for locked/upgrade_required, não bloqueia o P2P).
              │
              ▼
    Retorno da Lista Normalizada:
      - Itens ordenados por MAX(last_message_at, updated_at).
      - IDs compostos: `p2p:123`, `ai:456`.
      - Metadados de proposta (N:N links) preservados.
              │
              ▼
    Seleção de Thread pelo Usuário Corporativo:
      ├─ Se channel == 'p2p':
      │    ├─ Mensagens: GET /api/v1/conversations/:id/direct_messages
      │    ├─ Envio: POST /api/v1/conversations/:id/direct_messages
      │    ├─ Marcação de Leitura: POST /api/v1/conversations/:id/read
      │    └─ Stream Realtime: ConversationChannel (conversation_id: :id)
      │
      └─ Se channel == 'ai':
           ├─ Mensagens: GET /api/v1/inbox/sessions/:id/messages
           ├─ Envio (Handoff): POST /api/v1/inbox/sessions/:id/messages
           ├─ Marcação de Leitura: POST /api/v1/inbox/sessions/:id/read
           └─ Stream Realtime: ChatSessionChannel (session_id: :id)
```

---

## 3. Entidades e Modelagem de Dados

Não há criação de novas tabelas nem migrações destrutivas. O sistema utiliza a arquitetura já estabelecida e estável:

1. **`Conversation` (`conversations`):**
   - Representa o canal direto entre um comprador autenticado (`user_id`) e a empresa (`company_id`).
   - Relaciona-se com `direct_messages`.
   - Relaciona-se com `conversation_proposal_links` (suporte a múltiplos contextos de proposta N:N).

2. **`ChatSession` (`chat_sessions`):**
   - Representa atendimentos iniciados pelo assistente virtual de inteligência artificial.
   - Relaciona-se com `chat_messages` e `chat_lead`.
   - Suporta status `waiting_agent` quando o visitante solicita intervenção de atendente humano.

---

## 4. Estratégia de Realtime e WebSockets (ActionCable)

Para garantir reatividade instantânea sem cruzamento de dados de outros tenants:

- **Canal P2P:** `ConversationChannel`
  - Stream corporativo da lista: `conversation_list:company:{active_company_id}`
  - Stream da thread ativa: `conversation:{conversation_id}`
- **Canal Atendimento IA:** `CompanyInboxChannel` / `ChatSessionChannel`
  - Stream da lista: `company_inbox:{active_company_id}`
  - Stream da thread ativa: `chat_session:{session_id}`
- **Ciclo de Vida Frontend:**
  - Ao alternar a empresa ativa (`activeCompany`), todas as conexões e subscriptions da empresa anterior são canceladas (`unsubscribe`).
  - Novos listeners são abertos estritamente para o ID da nova empresa selecionada.
