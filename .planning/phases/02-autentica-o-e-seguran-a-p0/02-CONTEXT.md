# Phase 02: Autenticação e Segurança (P0) - Context

**Gathered:** 16 de junho de 2026
**Status:** Ready for planning
**Source:** PRD Express Path (mobile-task.md)

<domain>
## Phase Boundary

Esta fase foca na implementação da infraestrutura de segurança e no fluxo de autenticação do aplicativo. O objetivo central é estabelecer o login real, a persistência segura de tokens e o gerenciamento da sessão do usuário, garantindo que as chamadas à API sejam autenticadas adequadamente.

</domain>

<decisions>
## Implementation Decisions

### Security & State
- **SecureStore:** Utilizar o `expo-secure-store` para armazenamento seguro de tokens JWT. Não usar AsyncStorage para dados sensíveis.
- **State Management:** Implementar Zustand ou Apollo Client (como cache reidratável) para gerenciar o estado global de autenticação (`isAuthenticated`, `user`, etc).

### Features (Task P0.3)
- **Login Real:** Conectar os formulários de login à rota real do backend (`/api/v1/auth/login`).
- **Persistência de Sessão:** O usuário não deve precisar fazer login toda vez que abre o aplicativo.
- **Login Gate:** Telas ou ações protegidas (ex: Ver telefone da empresa, Orçamentos, Reviews, Favoritos) devem exibir um modal ou redirecionar para o login se o usuário não estiver autenticado.
- **Logout:** Funcionalidade de desconectar o usuário e limpar o armazenamento local.
- **Sessão Expirada:** Interceptar erros 401 na API (`fetchApi` e `apolloClient`) e forçar o logout automático/redirecionamento de forma amigável.

### Mocks
- **Limpeza de Usuário Mock:** Remover qualquer `user` falso do estado global que esteja mascarando a falta de autenticação real.

### the agent's Discretion
- Abordagem exata para interceptadores de token (GraphQL vs REST) na camada de rede.
- Fluxo de recuperação de senha (UI), caso a API suporte, senão manter uma mensagem informando que deve ser feito via web.
- Estrutura exata da store de estado (Zustand auth slice).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Visão geral e stack.
- `.planning/codebase/STACK.md` — Bibliotecas disponíveis (SecureStore, Zustand confirmados).
- `AB0-1-mobile/src/lib/api.ts` — Utilitários de REST API, headers e interceptadores atuais.
- `AB0-1-mobile/src/lib/apolloClient.ts` — Cliente GraphQL e injeção de tokens.
- `AB0-1-mobile/src/lib/authStorage.ts` — Gerenciamento atual de persistência.

</canonical_refs>

<specifics>
## Specific Ideas
- Garantir que o `authLink` no `apolloClient.ts` consiga buscar o token do `SecureStore` dinamicamente ou receba o token via estado reativo.
- O formulário de login deve tratar erros de validação da API de forma explícita (senhas incorretas, conta inativa).

</specifics>

<deferred>
## Deferred Ideas
- Fluxos avançados de onboarding e edição de perfil (serão focados apenas no login/gate por enquanto).
- Diferenciação visual intensa entre perfil de Empresa vs Consumidor (o básico de Auth resolve o acesso, dashboards avançados ficam para a Fase 4+).

</deferred>

---

*Phase: 02-autentica-o-e-seguran-a-p0*
*Context gathered: 16 de junho de 2026 via PRD Express Path*
