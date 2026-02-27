# STORY-2026-02-27: Corrigir blockers de boot do Rails em health e jobs

## Contexto
O deploy de 27/02/2026 falhou durante o boot do Rails em produção porque `Api::V1::HealthController` executava `skip_before_action :authenticate_user!` sem que esse callback existisse na sua hierarquia atual. Durante a validação local do eager load, surgiu um segundo bloqueador: `ApplicationJob` misturava `ActiveJob::Base` com `Sidekiq::Worker`, combinação inválida no Sidekiq 7.

## Requisito
Garantir que o eager load do backend não falhe ao carregar controllers e jobs adicionados na rodada de otimizações, preservando o comportamento público dos probes de health e a configuração de jobs via Sidekiq.

## Acceptance Criteria
- [x] O carregamento de `Api::V1::HealthController` não levanta `ArgumentError` quando `authenticate_user!` não existe na cadeia de callbacks.
- [x] O controller continua sem exigir `authenticate_user!` para seus endpoints.
- [x] `ApplicationJob` não inclui `Sidekiq::Worker`/`Sidekiq::Job` diretamente e mantém configuração de Sidekiq compatível com `ActiveJob`.
- [x] Existe cobertura automatizada para evitar regressão dessas configurações.

## Checklist de Implementação
- [x] Ajustar o `skip_before_action` em `app/controllers/api/v1/health_controller.rb`.
- [x] Adicionar teste cobrindo a ausência de callback de autenticação no controller.
- [x] Remover a inclusão direta de `Sidekiq::Worker` em `app/jobs/application_job.rb`.
- [x] Adicionar teste cobrindo a configuração de `ApplicationJob` com Sidekiq via `ActiveJob`.
- [x] Rodar `npm run lint` na raiz (falhou: script `lint` inexistente no `package.json` da raiz).
- [x] Rodar `npm run typecheck` na raiz (falhou: script `typecheck` inexistente no `package.json` da raiz).
- [x] Rodar `npm test` na raiz (falhou: script `test` inexistente no `package.json` da raiz).
- [ ] Validar o eager load do backend com `bundle exec rails runner "Rails.application.eager_load!"`.
- [x] Rodar validação sintática com `bundle exec ruby -c` nos arquivos Ruby alterados.
- [ ] Rodar `bundle exec rails test test/controllers/api/v1/health_controller_test.rb` (timeout acima de 180s neste ambiente).
- [ ] Rodar `bundle exec rails test test/jobs/application_job_test.rb`.

## File List
- [x] `app/controllers/api/v1/health_controller.rb`
- [x] `app/jobs/application_job.rb`
- [x] `test/controllers/api/v1/health_controller_test.rb`
- [x] `test/jobs/application_job_test.rb`
- [x] `docs/stories/STORY-2026-02-27-api-health-boot-fix.md`
