# Matriz de contratos da jornada reviewer

> Documento vivo. `ACTIVE` identifica o contrato usado em produção; `LEGACY_COMPAT`
> identifica superfícies mantidas durante a migração. Valores ausentes devem ser
> representados como `null`/indisponíveis, nunca como zero fabricado.

| Status | Rota frontend | API | Auth / role | Fonte de verdade | Mutação | Erro | Vazio | Testes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACTIVE | `/review-dashboard` | `GET /api/v1/review_dashboard/summary` + `GET /reviews/mine` + `GET /reviewer_solutions` | JWT; `review\|admin` | SummaryService futuro; `Review`; `ReviewerSolution` | refresh | envelope reviewer; parcial por bloco | sem reviews/conquistas/atividade | `tests/e2e/reviewer-dashboard-viewport.spec.ts`, `review-dashboard-domain.spec.ts` |
| ACTIVE | `/review-dashboard/profile` | `GET/PATCH /api/v1/reviewer/profile` | JWT; `review\|admin`; usuário atual | `User` + `ReviewerProfile` | perfil agregado planejado; uploads separados | validação de campos/upload | perfil incompleto | `AB0-1-back/spec/requests/api/v1/reviewer/profile_spec.rb` |
| ACTIVE | `/review-dashboard/reviews` | `GET /api/v1/reviews/mine` | JWT; usuário atual | `Review` | criação fora da Home | status/erro de listagem | primeira avaliação | `AB0-1-front/tests/e2e/review-dashboard-domain.spec.ts` |
| ACTIVE | `/review-dashboard/solutions` | `GET/POST/DELETE /api/v1/reviewer_solutions` | JWT; `review\|admin`; usuário atual | `ReviewerSolution` | add/remove soft-delete | validação/ownership | nenhuma solução ativa | `AB0-1-back/spec/requests/api/v1/reviewer/solutions_spec.rb` |
| ACTIVE | `/review-dashboard/achievements` | via summary atual | JWT; `review\|admin` | `AchievementService` derivado de reviews aprovadas | nenhuma persistente | indisponível se summary falhar | nenhuma conquista | dashboard request specs |
| ACTIVE | `/review-dashboard/notifications` | `/api/v1/notifications*` | JWT; usuário atual | `Notification` customizada (canônica) | mark-read/archive/preferences | envelope reviewer | sem notificações | notifications request specs |
| ACTIVE | `/review-dashboard/favorites` | `/api/v1/favorites*` | JWT; usuário atual | `Favorite` persistido | add/remove/status | ownership/validation | nenhum favorito | favorites request/page specs |
| ACTIVE | `/creator-studio/publications` | `/api/v1/reviewer/publications*` | JWT; `review\|admin`; owner | `ReviewerPublication` | create/update/publish/archive/delete | validation/ownership | nenhuma publicação | publications request specs |
| ACTIVE | `/creator-studio/leads` | `/api/v1/reviewer/creator_leads*` | JWT; `review\|admin`; creator owner | `CreatorLead` | status | ownership/status | nenhum lead | request coverage necessária |
| LEGACY_COMPAT | `/review-dashboard/proposals` | `/api/v1/leads/mine` | JWT; identidade atual por email | `Lead` legado | nenhuma na Home | identidade por email | nenhuma proposta | leads access specs |
| ACTIVE | upload reviewer | `/api/v1/reviewer/profile/avatar`, `/public_banner`, review upload APIs | JWT; owner | Active Storage | attach/remove | MIME, tamanho, storage | sem mídia | upload request specs |

## Regras transversais

- `0`: valor conhecido e realmente igual a zero.
- `null`: ausência de valor no domínio.
- `unavailable`: sistema não conseguiu determinar o valor.
- `loading`: resposta ainda não chegou.
- `error`: falha conhecida; preservar último dado válido quando existir.
- Green Score, conquistas e primeira avaliação do profile completion usam reviews `approved`.
- Profile completion conta somente soluções `active`.
- Recomendações atuais são empresas verificadas em destaque; não prometem proximidade regional.
- `Lead` baseado somente em email permanece dívida técnica: `TECH-DEBT: LEAD_IDENTITY_LINK`.
- O endpoint `/api/v1/reviewer/dashboard` permanece `LEGACY_COMPAT` até existir paridade formal com o summary canônico.