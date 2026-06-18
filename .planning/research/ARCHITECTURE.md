# Padrões de Arquitetura: AB0-1 Mobile

**Domínio:** Mobile (Expo/React Native)
**Pesquisado em:** 17/06/2026

## Arquitetura Recomendada

O aplicativo segue um padrão de **Feature-based Architecture** combinado com o sistema de rotas do **Expo Router**. A lógica de negócio é separada entre stores do Zustand (estado global síncrono) e cache do Apollo/React Query (estado assíncrono).

### Limites de Componentes

| Componente | Responsabilidade | Comunica-se com |
|-----------|---------------|-------------------|
| `src/app` | Definição de rotas e composição de telas. | Hooks, Stores, APIs. |
| `src/features` | Componentes complexos e específicos de uma funcionalidade (ex: Carrossel da Home). | `src/lib/queries` (GraphQL). |
| `src/store` | Estado global (Auth, Compare). | `src/lib/api` (REST). |
| `src/lib` | Configuração de clientes de rede (Apollo, Fetch, ActionCable). | Backend API. |
| `src/components/ui` | Componentes visuais atômicos e reutilizáveis (Botões, Skeletons). | Ninguém (Stateless). |

### Fluxo de Dados

1. **Acesso a Dados:**
   - **Queries Complexas:** Utilizam Apollo Client (GraphQL) com cache persistido via AsyncStorage.
   - **Operações Simples/Formulários:** Utilizam TanStack Query (REST) para mutações rápidas e fetching simples.
   - **Tempo Real:** ActionCable gerencia a entrada de novas mensagens no chat e atualizações de estado do Dashboard.

2. **Gerenciamento de Estado:**
   - O `useAuthStore` (Zustand) centraliza o estado de sessão, permitindo que componentes reajam instantaneamente ao logout ou login.

## Padrões a Seguir

### Padrão 1: Networking Híbrido
**O que:** Usar REST para escritas (POST/PUT) e GraphQL para leituras complexas.
**Quando:** Sempre, exceto quando a funcionalidade exigir tempo real (WebSockets).
**Exemplo:**
```typescript
// REST para login
const res = await authApi.login(credentials);

// GraphQL para dados do usuário logado
const { data } = await client.query({ query: GET_ME });
```

### Padrão 2: Optimistic Updates no Chat
**O que:** Atualizar a UI antes da confirmação do servidor.
**Implementação:** Visto em `src/app/chat/[id].tsx` usando TanStack Query.

## Anti-Padrões a Evitar

### Anti-Padrão 1: Duplicação de Implementação de Chat
**O que:** Ter `/chat` e `/p2p_chat` com tecnologias diferentes.
**Por que é ruim:** Causa bugs onde mensagens enviadas em um lugar não aparecem no outro se o cache não for invalidado corretamente, além de dobrar o custo de manutenção.
**Em vez disso:** Usar apenas o componente baseado em ActionCable para todos os fluxos de chat.

## Considerações de Escalabilidade

| Preocupação | Com 100 usuários | Com 10K usuários | Com 1M usuários |
|-------------|--------------|--------------|-------------|
| Conexões WS | Gerenciável via Puma/ActionCable padrão. | Necessário Redis para ActionCable e possível scaling horizontal. | Necessário infra dedicada (AnyCable) para gerenciar conexões. |
| Cache Apollo | LocalStorage simples basta. | Cache persistido com expiração agressiva (staleTime). | Estratégia de paginação rígida (Relay-style) e prefetching preditivo. |

## Fontes
- `src/lib/apolloClient.ts`
- `src/app/_layout.tsx`
- `src/components/app-tabs.tsx`
