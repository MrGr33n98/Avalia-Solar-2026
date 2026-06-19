# DISCOVERY: Central de Reputação Sustentável

**Data:** 2026-06-19
**Status:** Discovery inicial + entrega front-end sem migrations
**Escopo:** Dashboard do usuário/reviewer em `/review-dashboard`

---

## 1. Decisão Técnica

A Central deve evoluir a rota canônica existente `/review-dashboard`, não criar uma experiência paralela. O login de usuários com `role: review` já redireciona para essa rota em `contexts/AuthContext.tsx`, e `/dashboard` também redireciona reviewers para `/review-dashboard`.

Nesta etapa não foi criada migration. A implementação usa dados reais já disponíveis e fallbacks derivados no front para os domínios que ainda não têm tabela/API.

## 2. Componentes shadcn Disponíveis

O front já possui `components.json` e componentes shadcn em `AB0-1-front/components/ui`.

Componentes aproveitados nesta entrega:
- `Card`
- `Button`
- `Badge`
- `Avatar`
- `Tooltip`
- `Dialog`
- `Sheet` como drawer mobile
- `Tabs`
- `Accordion`
- `DropdownMenu`
- `Progress`
- `Table`
- `Carousel`
- `Skeleton`
- `Toast/Sonner`
- `Command`
- `Popover`
- `Separator`
- `ScrollArea`

## 3. Banco de Dados Atual

Tabelas do escopo já encontradas no schema:
- `users`
- `reviews`
- `companies`
- `notifications`

Tabelas citadas no produto, mas ainda ausentes no schema atual:
- `profiles`
- `review_votes`
- `review_comments`
- `company_replies`
- `achievements`
- `user_achievements`
- `green_house_profiles`
- `green_house_progress`
- `leaderboards`
- `activity_feed`
- `recommendations`
- `impact_metrics`
- `user_scores`

Observação importante: respostas de empresas já existem de forma legada dentro de `reviews.reply` e `reviews.replied_at`. Isso permite entregar a feature estratégica de respostas antes de criar `company_replies`.

## 4. APIs Existentes Aproveitadas

Frontend:
- `reviewDashboardApi.getSummary()` chama `/api/v1/review_dashboard/summary`
- `reviewsApi.listMine()` busca avaliações do usuário
- `leadsApi.mine()` busca leads/orçamentos do usuário

Backend:
- `Api::V1::ReviewDashboardController#summary`
- `ReviewDashboard::ActivityService`

O summary atual retorna:
- `kpis.quotes_total`
- `kpis.quotes_open`
- `kpis.quotes_replied`
- `kpis.reviews_published`
- `charts.activity_30d`
- `profile.completion_percent`

## 5. Lacunas Para Modelagem Futura

Próximas migrations devem ser feitas somente após fechar contrato de dados. Candidatas:
- `company_replies` para respostas versionadas, leitura, avaliação da resposta e conversa.
- `user_scores` para persistir Green Score e ranking.
- `achievements` / `user_achievements` para conquistas reais.
- `green_house_profiles` e `green_house_progress` para jornada sustentável.
- `activity_feed` para feed estilo LinkedIn.
- `recommendations` para recomendações por IA auditáveis.
- `impact_metrics` para métricas ambientais e comunitárias persistidas.

## 6. Entrega Realizada Nesta Etapa

Foi criada a Central de Reputação Sustentável em `/review-dashboard` usando a arquitetura atual:
- Sidebar desktop fixa de 280px.
- Drawer mobile via `Sheet`.
- Navegação inferior mobile própria.
- Header com saudação dinâmica.
- 6 KPI cards responsivos.
- Hero profile com reputação, badges e CTA de respostas.
- Tabela/card mobile de empresas avaliadas.
- Feature de respostas das empresas com badge, contador e animação.
- Jornada sustentável gamificada.
- Conquistas em grid desktop e carousel mobile.
- Feed de atividades.
- Impacto na comunidade.
- Métricas ambientais.
- Green House Certification.
- Recomendações por IA com dados derivados.

## 7. Risco e Próxima Etapa

Os blocos de sustentabilidade, conquistas, ranking, recomendações e impacto ainda usam dados derivados dos reviews/leads quando não há fonte persistida. A próxima etapa recomendada é definir o contrato de API para `company_replies`, `user_scores`, `achievements` e `green_house_progress` antes de criar migrations.
