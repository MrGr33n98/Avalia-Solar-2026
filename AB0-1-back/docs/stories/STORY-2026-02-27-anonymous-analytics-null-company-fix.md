# STORY-2026-02-27: Evitar erro de analytics anônimo sem company_id

## Contexto
Depois da migration de integridade de dados de 27/02/2026, `analytics_events.company_id` passou a ser `NOT NULL`. O endpoint público de analytics continua aceitando eventos anônimos como `page_view`, então o `TrackEventService` passou a gerar `PG::NotNullViolation` ao tentar persistir esses eventos sem empresa associada.

## Requisito
Garantir que eventos globais/anônimos aceitos pelo fluxo público não derrubem o tracking nem poluam os logs quando `company_id` estiver ausente.

## Acceptance Criteria
- [x] `TrackEventService` não tenta persistir eventos globais aceitos sem `company_id`.
- [x] `page_view` anônimo retorna sucesso sem criar registro inválido em `analytics_events`.
- [x] A cobertura de teste cobre o comportamento de eventos anônimos sem empresa.

## Checklist de Implementação
- [x] Alinhar a regra de eventos globais do serviço com os eventos anônimos aceitos pelo fluxo público.
- [x] Curto-circuitar a persistência para eventos globais sem `company_id`.
- [x] Adicionar spec de regressão para o serviço.
- [x] Rodar validação automatizada relevante no backend ou documentar bloqueio do ambiente.

## File List
- [x] `app/services/analytics/track_event_service.rb`
- [x] `spec/services/analytics/track_event_service_spec.rb`
- [x] `docs/stories/STORY-2026-02-27-anonymous-analytics-null-company-fix.md`

## Validation
- [x] `bundle exec ruby -c app/services/analytics/track_event_service.rb`
- [x] `bundle exec ruby -c spec/services/analytics/track_event_service_spec.rb`
- [ ] `ruby bin/rspec spec/services/analytics/track_event_service_spec.rb --format documentation` (bloqueado por migrations pendentes no `RAILS_ENV=test`)
