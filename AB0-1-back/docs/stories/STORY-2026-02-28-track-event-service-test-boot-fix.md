# STORY-2026-02-28: Corrigir boot de test e deduplicacao SQLite do TrackEventService

## Contexto
O `TrackEventService` estava com duas regressões no ambiente de teste. O boot do `RAILS_ENV=test` travava por depender de Redis por padrão, e o branch SQLite da deduplicação usava `affected_rows`, método inexistente no adapter atual. Isso fazia a spec do serviço falhar com `analytics_processing_error` no caminho feliz.

## Requisito
Garantir que o ambiente de teste suba sem depender de Redis local e que a deduplicação do `TrackEventService` funcione corretamente em SQLite e PostgreSQL.

## Acceptance Criteria
- [x] `RAILS_ENV=test` sobe sem exigir Redis manualmente.
- [x] O branch SQLite da deduplicação detecta insert ignorado sem usar API inexistente.
- [x] A spec de `TrackEventService` executa verde no backend local.

## Checklist de Implementacao
- [x] Desligar Redis por padrao no ambiente `test`.
- [x] Corrigir a deteccao de duplicata SQLite para usar a API real do adapter.
- [x] Atualizar a spec para validar o comportamento correto do branch SQLite.
- [x] Rodar a suite do `TrackEventService` no backend local.

## File List
- [x] `app/services/analytics/track_event_service.rb`
- [x] `config/environments/test.rb`
- [x] `spec/services/analytics/track_event_service_spec.rb`
- [x] `docs/stories/STORY-2026-02-28-track-event-service-test-boot-fix.md`

## Validation
- [x] `bundle exec ruby -c app/services/analytics/track_event_service.rb`
- [x] `bundle exec ruby -c config/environments/test.rb`
- [x] `bundle exec ruby -c spec/services/analytics/track_event_service_spec.rb`
- [x] `RAILS_ENV=test bundle exec rails runner "puts Rails.env; puts ENV['REDIS_ENABLED']; puts ActiveRecord::Base.connection.adapter_name"`
- [x] `RAILS_ENV=test bin/rspec spec/services/analytics/track_event_service_spec.rb --format progress --no-color`
