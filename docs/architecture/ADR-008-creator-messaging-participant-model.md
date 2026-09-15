# MADR 008 — Creator Messaging Participant Model Architecture

- **Status:** Aceito / Proposto
- **Decisores:** Time de Arquitetura Avalia Solar, Lead Eng
- **Data:** 19/08/2026

## Contexto e Problema

O Avalia Solar evoluiu um ecossistema robusto de **Creators / Reviewers Especialistas em Energia Solar** que publicam conteúdo, avaliações, artigos e análises técnicas (`creator profile`, `creator publications`, `creator leads`).

Atualmente existem dois domínios de mensageria:
1. **Marketplace P2P:** `Buyer ↔ Company` (via `Conversation` / `DirectMessage`)
2. **AI Live Inbox:** `Visitor/Lead ↔ AI Bot / Agent` (via `ChatSession` / `ChatMessage`)

Com a expansão da funcionalidade Creator, surge a necessidade de permitir comunicação privada entre seguidores/compradores e Creators (`Follower/Buyer ↔ Creator`), sem contudo criar um terceiro silo de tabelas ou duplicar a infraestrutura de ActionCable, Push, Realtime e Unread.

## Decisão

Adotar a arquitetura **Participant Model & Adapters** para a Messaging Platform 1.0.

### Princípios da Arquitetura:

1. **Camada de Abstração via DTO e Adapters (Fase 3-4):**
   - Não migrar destrutivamente nem alterar as tabelas `conversations` e `chat_sessions` no rollout inicial.
   - Tratar a Unified Inbox como uma camada agregadora (`Messaging::P2pInboxAdapter`, `Messaging::AiInboxAdapter`, `Messaging::CreatorInboxAdapter`).

2. **Modelo Alvo de Participante Polimórfico (Fase 5+):**
   ```text
   Conversation (unificado)
      ├── id
      ├── channel_type ('p2p', 'ai', 'creator_private')
      └── ConversationParticipant (join table polimórfica)
            ├── participant_type ('User', 'Company', 'CreatorProfile', 'AiAgent')
            ├── participant_id
            └── role ('owner', 'member', 'buyer', 'creator', 'agent')
   ```

3. **Políticas de Anti-Spam e Monetização (Creator Entitlements):**
   - Apenas usuários autenticados podem enviar DMs para Creators.
   - Opt-in ativo no perfil do Creator (`creator.messaging_enabled`).
   - Rate-limiting estrito (máximo 10 conversas iniciadas por dia por usuário não-Pro).
   - Monetização via `creator_messaging` entitlement (Creator Free: limite de conversas simultâneas / Creator Pro: sem limite, anexos completos, respostas rápidas e CRM capture).

## Consequências

### Positivas:
- **Zero fragmentação:** Evita a criação de `CreatorConversation`, `CreatorMessageChannel`, `CreatorInboxController`.
- **Reuso de infraestrutura:** Reusa ActionCable (`ConversationChannel`), Push Notifications (`P2pChatPushNotificationJob`), ActiveStorage e audit events.
- **Unified Inbox nativa:** Permite que o painel do Creator veja todas as mensagens em uma única interface padronizada.

### Riscos & Mitigações:
- **Segurança e Moderação:** Risco de spam ou conteúdo inadequado enviado a Creators. Mitigação: rate limits por IP/User ID, suporte a bloqueio/denúncia (`ConversationReport`) e filtros de moderação automatizados.
