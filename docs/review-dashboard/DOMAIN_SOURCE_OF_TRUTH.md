# Source of Truth — Review Dashboard

## Domínios conectados

| Domínio | Fonte | Mutations |
|---|---|---|
| Summary, Green Score, ranking | Rails ReviewDashboardController e serviços existentes | Rails |
| Reviews | Rails GET /api/v1/reviews/mine | endpoints existentes |
| Leads | Rails GET /api/v1/leads/mine | endpoints existentes |
| Reviewer solutions | PostgreSQL reviewer_solutions | GET/POST/DELETE /api/v1/reviewer_solutions |
| Reviewer profile | PostgreSQL reviewer_profiles + User | GET/PATCH /api/v1/reviewer/profile |
| Avatar | Active Storage de User | POST/DELETE /api/v1/reviewer/profile/avatar |
| Profile completion | `Reviewer::ProfileCompletionService` | summary/profile API |
| Solution audit | `ReviewerSolutionEvent` | ActiveAdmin + solution mutations |
| Notifications | PostgreSQL Notification/NotificationPreference | controllers existentes |
| Achievements | `Reviewer::AchievementService` + summary | Rails |

## Explicitamente indisponíveis

- Publications reviewer CRUD não existe; interface informa disponibilidade futura.
- Rewards/redemptions não possuem ledger auditável; interface não apresenta recompensa real.
- XP não é calculado no frontend.
- Impacto ambiental não é estimado pela quantidade de soluções.

## Regras

- localStorage não é fonte de verdade de domínio; restante serve apenas preferência visual da sidebar.
- Dados indisponíveis aparecem como indisponíveis, nunca como valores fictícios.
- Endpoints reviewer exigem JWT e role review ou admin.
- Recursos privados são escopados por current_user.

- Reviewer solutions usam soft-delete (`status=disabled`) para preservar trilha operacional.
- Rewards permanecem indisponíveis até existir ledger de pontos/resgates.
