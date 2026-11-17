# ADR — Reviewer Dashboard como experiência canônica do avaliador

- **Data:** 2026-11-17
- **Status:** Implementado em branch de integração, aguardando CI e revisão
- **Origem:** PR #164 (componentes G2-inspired de User Profile)
- **Escopo:** Apenas experiência de contas reviewer no Review Dashboard
- **Não altera:** MCP/Doorkeeper, Rails Auth, Pundit, empresa/CRM, Brand Page

## Problema e causa raiz

A PR #164 disponibilizou o perfil em `/user/profile` com uma sidebar própria,
enquanto `/review-dashboard` já possui um shell canônico com sidebar e bottom nav.

`REVIEWS_ONLY_MVP` também ocultava a navegação de identidade e equipamentos, mesmo
essas funcionalidades possuindo rotas e contratos owner-scoped já existentes.

O resultado era uma experiência desconectada: landing de avaliações intacta,
novo perfil difícil de descobrir e múltiplos menus com destinos divergentes.

## Decisão

1. `/review-dashboard` continua a visão geral, sem substituição por perfil.
2. `/review-dashboard/profile` é a rota canônica da identidade do avaliador;
   reaproveita `UserProfileContent`, seus mapeadores, chamadas de API e salvamento.
3. `/user/profile` é alias de compatibilidade, com redirecionamento e preservação
   apenas de parâmetros de aba conhecidos.
4. `ReviewerDashboardShell` é o **único** shell com sidebar principal. O conteúdo
   de perfil não renderiza outra sidebar.
5. `reviewerNavigation.ts` fornece destinos para sidebar, menu do avatar e
   mobile. Em Reviews-only MVP, são liberados apenas overview, avaliações,
   soluções e perfil. Creator/social/comercial continuam bloqueados.
6. A sidebar exibe um cartão de identidade compacto com dados do `useAuth` e
   `reviewerProfile`, sem carregar dados adicionais e sem inventar badges.
7. O `UserAvatarDropdown` já presente no header é reaproveitado **somente no
   contexto de `role === 'review'` e `/review-dashboard`**; outros papéis
   preservam seu menu atual. Mobile exibe o avatar contextual e três destinos
   prioritários no bottom nav; soluções permanecem no drawer.
8. A aba de privacidade continua somente leitura até existir contrato de
   persistência e aplicação efetiva das preferências no backend.
9. A autorização real permanece nos endpoints Rails. Elementos de UI não
   substituem policies ou checks de ownership.

## Contratos reutilizados

- `GET/PATCH /api/v1/reviewer/profile` (dados e profissão).
- API de upload do avatar existente.
- `reviewerSolutionsApi` (listar/adicionar/remover somente recursos do usuário).
- `reviewDashboardApi.getSummary()` (indicadores autorizados).
- `usersApi.update()` para nome, com tratamento de sucesso parcial.
- `useAuth()` para identidade, papel e sessão.

## UX / Design

- Desktop: sidebar 232px, 72px recolhida, identidade com avatar 64px,
  menu de funções no mesmo trilho.
- Perfil: conteúdo responsivo com abas horizontais acessíveis, sem segunda
  coluna de navegação; rolagem horizontal limitada às abas.
- Mobile/PWA: bottom nav com três destinos e drawer para soluções; avatar
  contextual no header com menu limitado à viewport.
- Paleta, tipografia e estados ativos seguem tokens existentes do
  `components/review-dashboard/tokens.ts`.
- Referências do G2 servem somente para padrões de interação, sem copiar
  branding ou textos proprietários.

## Matriz de compatibilidade

| Origem | Destino | Resultado |
| --- | --- | --- |
| `/review-dashboard` | mesma rota | Overview preservada |
| `/review-dashboard/reviews` | mesma rota | Avaliações preservadas |
| `/review-dashboard/solutions` | mesma rota | Equipamentos persistentes |
| `/review-dashboard/profile` | mesma rota | Perfil da PR #164 incorporado |
| `/user/profile` | `/review-dashboard/profile` | Alias com tabs permitidas |
| `/profile` | alias legado /user/profile | Cadeia de redirecionamento compatível |

## Critérios de aceite verificáveis

- Sidebar e avatar reviewer compartilham a mesma lista de rotas.
- Nenhuma sidebar de perfil duplicada dentro do Review Dashboard.
- Dados de usuário nunca usam nome, empresa, data, verificação ou score fictícios.
- Empresa sem papel reviewer não recebe cartão nem menu reviewer contextual.
- Rota de perfil requer `review` ou `admin`, como antes, e Rails continua
  responsável por autorizar leitura e mutações.
- Mobile: Início, Minhas avaliações e Perfil; Soluções no drawer.
- Deep link de aba conhecido sobrevive à compatibilidade `/user/profile`.
- Build Next.js, testes Jest relevantes, Playwright de navegação e regressões
  de review dashboard devem passar antes de merge.

## Riscos e limitações

- A aba de privacidade é deliberadamente **read-only**; não prometer alteração
  de privacidade sem endpoint real.
- Verificação LinkedIn/Trust Score individual não têm backend auditável e
  devem permanecer ausentes/indisponíveis.
- Outras telas legadas de `/review-dashboard` podem ter funcionalidades em
  evolução e continuam fora deste redesign.
- Ações no Github Actions e deploy não substituem testes funcionais com uma
  sessão reviewer real após a publicação.

## Rollback

Reverter exclusivamente a PR de integração reviewer. Não alterar tabelas,
segredos, OAuth, flags MCP nem dados persistidos. A PR #164 anterior permanece
no histórico para recuperação pontual de componentes.
