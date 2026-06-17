# Phase 02: Autenticação e Segurança (P0) - Research

**Researched:** 2026-06-16
**Domain:** Mobile Authentication, Secure Storage, State Management (React Native / Expo)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **SecureStore:** Utilizar o `expo-secure-store` para armazenamento seguro de tokens JWT. Não usar AsyncStorage para dados sensíveis.
- **State Management:** Implementar Zustand ou Apollo Client (como cache reidratável) para gerenciar o estado global de autenticação (`isAuthenticated`, `user`, etc).
- **Features (Task P0.3):**
  - **Login Real:** Conectar os formulários de login à rota real do backend (`/api/v1/auth/login`).
  - **Persistência de Sessão:** O usuário não deve precisar fazer login toda vez que abre o aplicativo.
  - **Login Gate:** Telas ou ações protegidas (ex: Ver telefone da empresa, Orçamentos, Reviews, Favoritos) devem exibir um modal ou redirecionar para o login se o usuário não estiver autenticado.
  - **Logout:** Funcionalidade de desconectar o usuário e limpar o armazenamento local.
  - **Sessão Expirada:** Interceptar erros 401 na API (`fetchApi` e `apolloClient`) e forçar o logout automático/redirecionamento de forma amigável.
- **Mocks:**
  - **Limpeza de Usuário Mock:** Remover qualquer `user` falso do estado global que esteja mascarando a falta de autenticação real.

### the agent's Discretion
- Abordagem exata para interceptadores de token (GraphQL vs REST) na camada de rede.
- Fluxo de recuperação de senha (UI), caso a API suporte, senão manter uma mensagem informando que deve ser feito via web.
- Estrutura exata da store de estado (Zustand auth slice).

### Deferred Ideas (OUT OF SCOPE)
- Fluxos avançados de onboarding e edição de perfil (serão focados apenas no login/gate por enquanto).
- Diferenciação visual intensa entre perfil de Empresa vs Consumidor (o básico de Auth resolve o acesso, dashboards avançados ficam para a Fase 4+).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Implementar autenticação real com persistência de tokens JWT via Expo SecureStore. | Validado uso atual de `expo-secure-store` em `authStorage.ts` e `auth.ts` |
</phase_requirements>

## Summary

O aplicativo possui uma fundação de autenticação estruturada utilizando `expo-secure-store` e `zustand`, porém precisa de refinamentos cruciais para completar a Phase 02. Atualmente as funções de persistência já estão no arquivo `authStorage.ts` e a store do zustand está implementada em `auth.ts`. 

**Primary recommendation:** Implementar interceptadores globais de erro 401 (Unauthorized) no `fetchApi` (REST) e no `apolloClient` (GraphQL) integrados à store do Zustand para forçar o logout e redirecionamento automáticos de usuários com token expirado. Adicionar HOC ou Hooks para o Login Gate.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-secure-store` | Current | Armazenamento de JWT | Criptografado nativamente (Keychain/Keystore), evita exposição no AsyncStorage. |
| `zustand` | Current | Gerenciamento de estado de Auth | Simples, leve, fácil de integrar fora de componentes React (ex: interceptors). |
| `@apollo/client` | Current | Integração com GraphQL | Possui link `@apollo/client/link/error` ideal para tratar `401 Unauthorized` e tokens. |

## Architecture Patterns

### Pattern 1: Interceptadores Globais de 401
**What:** Tratar erros 401 (Unauthorized) diretamente na camada de rede (REST e GraphQL) para realizar o logout automático, ao invés de tratar em cada componente.
**When to use:** Para lidar com expiração de token ou revogação de sessão de forma centralizada.
**Example:**
No Apollo Client, usamos `onError`:
```typescript
import { onError } from '@apollo/client/link/error';
import { useAuthStore } from '../store/auth';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ extensions }) => {
      if (extensions?.code === 'UNAUTHENTICATED') {
         useAuthStore.getState().logout();
      }
    });
  }
  if (networkError && 'statusCode' in networkError && networkError.statusCode === 401) {
    useAuthStore.getState().logout();
  }
});
```
No `fetchApi`, capturar 401 e chamar `useAuthStore.getState().logout()`.

### Pattern 2: Login Gate Hook/Component
**What:** Um hook (ex: `useProtectedAction`) ou wrapper que intercepta ações de UI e exige que o usuário esteja logado. Se não estiver, abre um Modal de Login ou redireciona para a tela de Auth.

### Anti-Patterns to Avoid
- **Salvar JWT em AsyncStorage:** Nunca, deve-se usar `expo-secure-store` como já configurado no projeto.
- **Checagem de token sem validação:** Confiar apenas na presença da string no SecureStore sem chamar a rota `me` (já bem evitado pelo `initialize` atual do Zustand).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Persistência Segura | Criptografia própria c/ AsyncStorage | `expo-secure-store` | Já trata Keychain no iOS e Keystore no Android transparentemente. |
| Tratamento de Erros GraphQL | Hooks manuais para capturar expirados | `@apollo/client/link/error` | Garante que toda query/mutation seja interceptada antes de chegar no cache/componente. |

## Common Pitfalls

### Pitfall 1: Zustand Store não acessível nos Interceptors
**What goes wrong:** Tentar usar o hook `useAuthStore()` dentro de arquivos como `api.ts` e acabar gerando erros do React de "Hook call outside component".
**Why it happens:** Arquivos fora de componentes React não podem usar hooks convencionais.
**How to avoid:** Chamar `useAuthStore.getState().logout()` diretamente, que é uma feature nativa do Zustand para acesso ao estado fora do React.

### Pitfall 2: Circular Dependency
**What goes wrong:** `api.ts` importa `auth.ts` que importa `api.ts`.
**Why it happens:** Ambos tentam chamar um ao outro (Zustand chamando API de login, e API chamando Zustand para logout).
**How to avoid:** Injetar a dependência no momento da execução, ou colocar a store em um arquivo separado das definições da API, extraindo os tipos para um arquivo `types.ts` se necessário.

## Code Examples

### Interceptando 401 no REST (fetchApi)
```typescript
// em src/lib/api.ts
import { useAuthStore } from '../store/auth';

if (!response.ok) {
  if (response.status === 401) {
     useAuthStore.getState().logout();
  }
  // throw ...
}
```

## Step 2.6: SKIPPED (no external dependencies identified)
O projeto sendo um app Expo já possui as dependências principais instaladas e não requer serviços externos ou containers específicos para a execução da task de Auth mobile, além da API que já está mapeada e funcional.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (Expo) |
| Config file | `jest.config.js` (ou default Expo) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test -- --watchAll=false` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Valida que erro 401 remove o token e desloga usuário | unit/integration | `npm run test` | ❌ Wave 0 |
| AUTH-01 | Login Gate impede ação sem autenticação | unit | `npm run test` | ❌ Wave 0 |

## Sources

### Primary (HIGH confidence)
- `src/lib/authStorage.ts` - Confirma uso do Expo SecureStore.
- `src/store/auth.ts` - Confirma existência de Zustand com funções básicas.
- `src/lib/api.ts` e `src/lib/apolloClient.ts` - Demonstram necessidade atual de injeção de tratativas 401.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Bibliotecas já estão ativas e parciais no repositório.
- Architecture: HIGH - Zustand já implementado, precisamos de pequenos tweaks para Interceptors de rede.
- Pitfalls: HIGH - Importações cíclicas entre Zustand e `api.ts` são comuns.

**Research date:** 2026-06-16
**Valid until:** 2026-07-16