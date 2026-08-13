# Auditoria AS-IS — Review Dashboard

Data: 2026-08-13  
Escopo: inventário inicial antes da implementação do domínio Review Dashboard.

## Rotas e estado atual

| Rota | Componente | Fonte de dados | API | Mutation | Mock? | localStorage? | Botões/ações | Admin | Testes | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `/review-dashboard` | `app/review-dashboard/page.tsx` | `DashboardDataProvider`/summary | `GET /api/v1/review_dashboard/summary` | parcial | não identificado no shell | sidebar | navegação, ações de home | parcial | Playwright | funcional, revisar estados de erro |
| `/review-dashboard/reviews` | `reviews/page.tsx` | provider/summary | summary | não | não | não | filtro, detalhes ainda incompletos | reviews admin | Playwright | parcialmente funcional |
| `/review-dashboard/profile` | `profile/page.tsx` | usuário/provider | usuário existente | não conectado | não | não | salvar/avatar com ações incompletas; `href="#"` | users/reviews | parcial | protótipo |
| `/review-dashboard/solutions` | `solutions/page.tsx` | `DashboardLayoutClient` | não | localStorage | não | sim | adicionar/remover sem persistência Rails | inexistente | parcial | protótipo |
| `/review-dashboard/publications` | `publications/page.tsx` | local | não | não | KPIs `0` | não | publicar sem domínio | inexistente | não | placeholder |
| `/review-dashboard/achievements` | `achievements/page.tsx` | `mockAchievements` | não | não | sim | não | filtros | achievement service backend existe | não | fictício |
| `/review-dashboard/rewards` | `rewards/page.tsx` | `mockRewards` | não | não | sim | não | filtros/ações sem domínio | inexistente | não | fictício |
| `/review-dashboard/notifications` | `notifications/page.tsx` | `mockNotifications` | store real existe, não usado | não | sim | store usa persistência local | marcar/abrir incompletos | endpoint existente | não | protótipo |
| `/review-dashboard/settings` | `settings/page.tsx` | usuário/provider | preferences endpoint existente | não | não | não | toggles/excluir conta incompletos | inexistente | não | protótipo |
| `/review-dashboard/help` | `help/page.tsx` | conteúdo estático | não | não | não | busca/WhatsApp/chamado incompletos | inexistente | não | protótipo |

## Achados técnicos

- Mocks explícitos: `achievements/page.tsx`, `notifications/page.tsx`, `rewards/page.tsx`.
- Persistência de domínio em `localStorage`: soluções e privacidade em `DashboardLayoutClient.tsx`; estado de sidebar em `ReviewerSidebar.tsx`.
- KPIs placeholder: quatro `value={0}` em `publications/page.tsx` e rewards.
- Links mortos: dois `href="#"` em `profile/page.tsx`.
- API existente: summary, dashboard reviewer, notifications e notification preferences.
- Backend já possui `Reviewer::AchievementService`, `Notification`, `NotificationPreference` e controllers de notificações.
- Não foi localizado domínio `ReviewerSolution`, `Publication` ou `Reward` no inventário inicial.
- Active Admin de reviews existe; cobertura específica de soluções/perfil reviewer não foi localizada.
- Playwright atual intercepta summary e usa fixtures; precisa refletir contratos reais após mutations.

## Critérios de implementação derivados

1. Summary nunca deve retornar score/ranking fictícios em exceção.
2. Frontend deve representar indisponibilidade explicitamente.
3. Soluções devem migrar para Rails/PostgreSQL.
4. Notificações devem consumir API/store real já existente.
5. Achievements e rewards devem parar de apresentar dados fictícios.
6. Cada ação visual deve ter handler real, link válido ou ser removida/desabilitada.

