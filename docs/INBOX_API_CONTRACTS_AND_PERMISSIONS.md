# Contratos de API, Permissões e DTO — Unified Inbox Enterprise

> **Documento:** Especificação de Contratos de API, Tipos e Políticas de Segurança  
> **Sistema:** Avalia Solar 2026 (`AB0-1-back` + `AB0-1-front`)  
> **Status:** Especificação Estável  

---

## 1. DTO Unificado com Discriminated Union

A rota `GET /api/v1/messaging/inbox` adota o padrão de união discriminada pelo campo `channel`:

```typescript
export type InboxChannel = 'p2p' | 'ai';

export interface BaseInboxItem {
  id: string; // Ex: "p2p:12" ou "ai:34"
  raw_id: number; // ID numérico do registro de origem
  channel: InboxChannel;
  company_id: number;
  status: string; // Ex: 'open' | 'pending_company' | 'waiting_agent' | 'archived'
  unread_count: number;
  updated_at: string;
  last_message: {
    id: number;
    body: string;
    sender_type: 'User' | 'Company' | 'Visitor' | 'Bot' | 'Agent';
    created_at: string;
    read_at?: string | null;
  } | null;
}

export interface P2pInboxItem extends BaseInboxItem {
  channel: 'p2p';
  participant: {
    type: 'buyer';
    id: number;
    name: string;
    email?: string | null;
    avatar_url?: string | null;
  };
  sla?: {
    due_at: string;
    breached: boolean;
  } | null;
  marketplace_proposal_id?: number | null;
  marketplace_proposal_reference?: string | null;
  linked_proposals?: Array<{
    id: number;
    reference: string;
    status: string;
    has_published_version: boolean;
  }>;
}

export interface AiInboxItem extends BaseInboxItem {
  channel: 'ai';
  participant: {
    type: 'visitor';
    id: string; // visitor_id
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  lead?: {
    id: number;
    score?: number;
    temperature?: string;
    city?: string;
    state?: string;
    solution_type?: string;
  } | null;
}

export type UnifiedInboxItem = P2pInboxItem | AiInboxItem;
```

---

## 2. Parâmetros de Requisição da Lista

### `GET /api/v1/messaging/inbox`

| Parâmetro | Tipo | Obrigatório | Descrição |
| :--- | :--- | :--- | :--- |
| `company_id` | `integer` | **Sim** (para empresas) | ID da empresa em contexto. O servidor valida se o usuário possui membership ativa. |
| `channel` | `string` | Não (`'all'`, `'p2p'`, `'ai'`) | Canal a filtrar. Padrão: `'all'`. |
| `filter` | `string` | Não (`'all'`, `'unread'`, `'waiting_reply'`, `'archived'`) | Filtro semântico de status. |
| `q` | `string` | Não | Termo de busca textual por nome do interlocutor, e-mail ou conteúdo da última mensagem. |
| `cursor` | `string` | Não | Cursor ISO8601 da última mensagem para paginação estável. |
| `limit` | `integer` | Não | Limite por página (padrão: 30, máx: 100). |

---

## 3. Matriz de Erros e Códigos de Retorno

| Código HTTP | Código Interno | Situação | Comportamento Esperado no Frontend |
| :--- | :--- | :--- | :--- |
| **401 Unauthorized** | `AUTH_REQUIRED` | Sessão expirada ou token ausente. | Redirecionamento para login com `return_to`. |
| **403 Forbidden** | `COMPANY_ACCESS_DENIED` | Usuário não é membro ativo da `company_id`. | Tela de acesso negado com botão "Alternar Empresa". |
| **403 Forbidden** | `FEATURE_LOCKED` | Canal específico não disponível no plano (ex: IA no plano Free). | O canal P2P continua funcionando; exibe badge/banner explicativo de upgrade apenas na aba IA. |
| **404 Not Found** | `RECORD_NOT_FOUND` | Conversa ou empresa não existe. | Estado de conversa não encontrada com fallback para a primeira da lista. |
| **422 Unprocessable**| `VALIDATION_FAILED` | Erro de validação de formulário ou mensagem vazia. | Feedback inline no composer sem perda do rascunho. |
| **500 Server Error** | `INTERNAL_ERROR` | Falha temporária no servidor. | Toast de erro com botão "Tentar novamente"; preserva estado anterior. |

---

## 4. Políticas de Autorização (Pundit)

1. **`ChatSessionPolicy`:**
   ```ruby
   def show?
     user.admin? || user.active_membership_for?(record.company_id)
   end

   def update?
     user.admin? || user.active_membership_for?(record.company_id)
   end
   ```

2. **`Conversation` (`Conversation#accessible_by?`):**
   ```ruby
   def accessible_by?(viewer)
     return true if viewer&.admin?
     return true if viewer&.id == user_id && viewer.review_user?
     return true if viewer&.company_user? && viewer.active_membership_for?(company_id)
     false
   end
   ```
