# Creator Ecosystem — Fase 6

## Escopo

Evolução de Creator Analytics com métricas reais já persistidas no backend.

## Backend

`Reviewer::AnalyticsSummaryService` agora retorna:

- `views`
- `followers`
- `clicks`
- `publications`
- `publication_views`
- `publication_reactions`
- `publication_comments`
- `publication_shares`
- `tree_views`
- `tree_clicks`
- `whatsapp_clicks`
- `leads`
- `daily_views`

Fontes usadas:

- `ReviewerPublicationEvent`
- `ReviewerPublicationLike`
- `ReviewerProfile.tree_views_count`
- `CreatorTreeBlock.clicks_count`
- `AnalyticsEvent` para `whatsapp_click`
- `ReviewerPublication.published`

## Frontend

`app/creator-studio/analytics/page.tsx` agora apresenta:

- KPI de publicações.
- Métricas de publicação:
  - visualizações
  - reações
  - comentários
  - compartilhamentos
- Métricas de conversão:
  - Tree views
  - cliques Tree
  - WhatsApp
  - leads

Nenhum dado fictício foi criado.

## Decisões

- Não foi criado novo endpoint.
- Não foi criada tabela nova.
- Métricas ausentes usam zero somente quando API não retorna valor, sem `Math.random` ou estimativas.
- Analytics de WhatsApp consulta `AnalyticsEvent`, fonte já existente.
- Gráfico diário continua limitado aos dados persistidos de visualização dos últimos 7 dias.

## Testes

- Spec existente de `Reviewer::AnalyticsSummaryService` ampliado.
- `npm run typecheck`: passou.
- ShareModal e templates sociais: 5 testes passaram.

## Pendências

- Rodar spec backend dentro Docker, pois host não possui `bundle`.
- Adicionar séries temporais de reações, comentários, shares e leads quando houver necessidade de produto.
- Fase 7: avaliar ranking do feed sem introduzir ML prematuro.
