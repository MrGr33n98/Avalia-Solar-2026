# Especificação — Navbar e navegação mobile PWA

## Objetivo

Entregar navegação PWA compacta para visitante e usuário autenticado, com drawer lateral, submenu de categorias e logout real.

## Escopo

- Navbar mobile/PWA.
- Drawer visitante.
- Drawer autenticado.
- Submenu de categorias com dados reais.
- Estados loading, erro, vazio e sucesso.
- Acessibilidade e touch targets.
- Desktop permanece com o comportamento atual.

## Regras funcionais

1. Visitante vê logo e hamburger.
2. Drawer visitante exibe autenticação uma única vez.
3. Entrar e Criar conta usam as rotas reais existentes.
4. Usuário autenticado vê avatar como trigger do drawer.
5. Drawer autenticado exibe identidade da sessão real.
6. Recursos de conta só aparecem para rotas comprovadas.
7. Sair usa o logout real e restaura o estado visitante.
8. Categorias abre submenu interno; voltar retorna ao menu principal.
9. Categorias usam o hook e rotas existentes.
10. Consórcio não aparece.

## Contratos comprovados

- Sessão: `useAuth` em `AB0-1-front/contexts/AuthContext.tsx`.
- Usuário: tipo `User` em `AB0-1-front/lib/api.ts`.
- Categorias: `useCategoriesTree` em `AB0-1-front/hooks/useCategoriesTree.ts`.
- Login: `/login`.
- Cadastro: `/register`.
- Logout: `AuthContext.logout`.

## Critérios de aceite

- Navbar visitante tem touch target de 44px.
- Navbar autenticada tem somente avatar no trigger PWA.
- Drawer tem largura máxima de 320px e proteção de viewport.
- Escape, foco, overlay e retorno de foco continuam providos pelo Sheet Radix.
- Typecheck, lint focal, teste de Navbar e build passam.
