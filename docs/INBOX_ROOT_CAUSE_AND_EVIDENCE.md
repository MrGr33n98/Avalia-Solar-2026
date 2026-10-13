# Diagnóstico de Causa-Raiz e Evidências — Unified Inbox Enterprise (P0/P1)

> **Documento:** Auditoria Técnica e Diagnóstico de Falha  
> **Sistema:** Avalia Solar 2026 (`AB0-1-back` + `AB0-1-front`)  
> **Rota Afetada:** `https://app.avaliasolar.com.br/dashboard/inbox`  
> **Status:** Investigado e Comprovado via CDP, AST e Inspeção de Contratos de API  

---

## 1. Resumo Executivo da Causa-Raiz

Ao acessar a rota canônica empresarial `/dashboard/inbox` (`LiveInbox.tsx`), o painel exibe:
> *"Nenhuma conversa neste filtro."*

A investigação comprovou **quatro fatores determinantes**:

1. **Fragmentação Arquitetural de Mensageria (P0-A):**
   - O componente `/dashboard/inbox` (`LiveInbox.tsx`) consome exclusivamente `GET /api/v1/inbox/sessions?company_id={id}&status={status}` via `inboxApi.sessions()`.
   - Esse endpoint consulta estritamente a tabela `chat_sessions` (`@company.chat_sessions`), que armazena atendimentos iniciados pelo robô de IA / widget público do marketplace.
   - Para a empresa ativa em contexto (ex.: WEG, `company_id=372`), o banco de dados possui **0** registros na tabela `chat_sessions` (`sessions: []`, contagens todas em `0`).
   - Por consequência, a linha 692 de `LiveInbox.tsx` cai no estado vazio e renderiza: `<p>Nenhuma conversa neste filtro.</p>`.

2. **Existência de Conversas Legítimas em Domínio Desconectado (P0-A / P0-B):**
   - As conversas reais e comerciais entre compradores e empresas — como mensagens vinculadas a propostas com SLAs e contadores não lidos — são salvas na tabela `conversations` e servidas por `GET /api/v1/conversations`.
   - Essas conversas estão totalmente ativas e funcionais na rota `/chat` (`ChatClient.tsx`).
   - No entanto, a rota `/dashboard/inbox` ignora a tabela `conversations`.

3. **Inconsistência de Navegação no Dashboard (P0-B / P1-B):**
   - No menu lateral do dashboard (`EnterpriseSidebar.tsx` / `config/navigation.ts`), o botão **"Mensagens"** (`id: 'live-inbox'`) aponta diretamente para `/dashboard/inbox`.
   - Não há atalho no menu lateral para a rota `/chat`.
   - O usuário corporativo clica em "Mensagens" esperando encontrar seus contatos e propostas recebidas, mas cai na tela que busca apenas sessões de IA.

4. **Endpoint Unificado no Backend Não Consumido pelo Frontend:**
   - O backend Rails já possui a infraestrutura moderna `Api::V1::Messaging::InboxController` (`GET /api/v1/messaging/inbox`, service `Messaging::UnifiedInboxQuery`).
   - Esse serviço combina conversas P2P (`conversations`) e sessões de atendimento (`chat_sessions`) em uma lista unificada (`p2p:<id>` e `ai:<id>`).
   - Porém, `LiveInbox.tsx` não foi integrado a esse endpoint unificado, permanecendo amarrado ao contrato legado de `chat_sessions`.

---

## 2. Matriz Comparativa: AS-IS vs. Estado Real

| Dimensão | `/dashboard/inbox` (Atual / LiveInbox) | `/chat` (Atual / ChatClient) | `/api/v1/messaging/inbox` (Unified Backend) | Alvo Proposto (`/dashboard/inbox` Unificado) |
| :--- | :--- | :--- | :--- | :--- |
| **Público / Contexto** | Dashboard Empresarial | Marketplace Geral (Comprador + Empresa) | API Unificada Multi-Canal | **Dashboard Empresarial Canônico** |
| **Origem de Dados** | Tabela `chat_sessions` | Tabela `conversations` | `conversations` + `chat_sessions` | `conversations` + `chat_sessions` autorizados |
| **Tipo de Identificador** | Inteiro puro (`session.id`) | Inteiro puro (`conversation.id`) | Composto (`p2p:id`, `ai:id`) | **Composto (`p2p:id`, `ai:id`)** |
| **Entitlements** | Bloqueia plano Free (`ai_live_inbox` 403) | Requer `p2p_chat_enabled` | Parcialmente checado | **Entitlement por canal sem travar o inbox** |
| **Multi-Tenancy** | `company_id` via URL ou cookie | Escopo via memberships | `user.company` (falha com múltiplas) | **Validação explícita de `company_id` no server** |
| **Filtro 'Não lidas'** | Traduz `waiting_agent` (semântica errada) | `unread_count > 0` (correto) | Baseado em contadores | **Semântica fiel: `unread_count > 0`** |
| **Propostas Vinculadas** | Ausente | Suporte a múltiplas propostas (`linked_proposals`) | Não exposto no DTO atual | **Totalmente integrado (N:N links)** |

---

## 3. Vulnerabilidades e Riscos Mapeados

### 3.1 P0-B: Isolamento de Múltiplas Empresas em `UnifiedInboxQuery`
- **Problema no código atual:**
  ```ruby
  # UnifiedInboxQuery.rb (linhas 14-20)
  companies = user.active_member_companies
  ::Conversation.where(company_id: companies.select(:id))
  ```
  Se o usuário gerencia a Empresa A e a Empresa B, ao filtrar a Empresa A no dashboard, a query atual retornava conversas de **todas** as empresas do usuário simultaneamente.
- **Correção mandatória:** Exigir `params[:company_id]`, validar se `current_user.active_membership_for?(company_id)` (ou admin), e limitar estritamente a query a `company_id`.

### 3.2 P0-B: Divergência entre `ChatSessionPolicy` e `active_membership_for?`
- **Problema no código atual:**
  ```ruby
  # ChatSessionPolicy.rb
  def show?
    user.admin? || record.company_id == user.company_id
  end
  ```
  O campo `user.company_id` armazena apenas a empresa primária (ou legado). Usuários convidados como gerentes/atendentes têm vínculo em `company_memberships`. Se `user.company_id != record.company_id`, a policy negava acesso com 403, enquanto os controllers utilizavam `active_membership_for?`.
- **Correção mandatória:** Alinhar `ChatSessionPolicy` para verificar `user.admin? || user.active_membership_for?(record.company_id)`.

### 3.3 P0-C: Entitlements por Canal
- Se a empresa está no plano Free (onde `ai_live_inbox` é bloqueado), o inbox não pode dar 403 para a página inteira; ele deve carregar as conversas `p2p` normalmente e desativar/ocultar a aba `ai` com explicação amigável de upgrade.

---

## 4. Evidências Coletadas

- **Teste 1:** Chamada a `/api/v1/inbox/sessions?company_id=372&status=all` retornou HTTP 200 com payload `{"sessions":[],"counts":{"all":0,"waiting_agent":0,"in_progress":0,"archived":0}}`.
- **Teste 2:** Chamada a `/api/v1/conversations` retornou 5 conversas comerciais ativas no mesmo ambiente autenticado, incluindo conversa com mensagens e SLA ativo para a empresa 372.
- **Teste 3:** Chamada a `/api/v1/messaging/inbox` no backend confirmou a existência dos itens serializados no padrão unificado `p2p:id`, comprovando a viabilidade da transição sem criação de terceiros bancos de dados.
