# STORY-2026-02-27: Corrigir boot do Rails no Api::V1::HealthController

## Contexto
O deploy de 27/02/2026 falhou durante o boot do Rails em produção porque `Api::V1::HealthController` executava `skip_before_action :authenticate_user!` sem que esse callback existisse na sua hierarquia atual.

## Requisito
Garantir que o eager load do backend não falhe ao carregar `Api::V1::HealthController`, preservando o comportamento público dos probes de health.

## Acceptance Criteria
- [x] O carregamento de `Api::V1::HealthController` não levanta `ArgumentError` quando `authenticate_user!` não existe na cadeia de callbacks.
- [x] O controller continua sem exigir `authenticate_user!` para seus endpoints.
- [x] Existe cobertura automatizada para evitar regressão dessa configuração.

## Checklist de Implementação
- [x] Ajustar o `skip_before_action` em `app/controllers/api/v1/health_controller.rb`.
- [x] Adicionar teste cobrindo a ausência de callback de autenticação no controller.
- [ ] Rodar `npm run lint` na raiz.
- [ ] Rodar `npm run typecheck` na raiz.
- [ ] Rodar `npm test` na raiz.
- [ ] Rodar validação direcionada do backend para o teste adicionado.

## File List
- [x] `app/controllers/api/v1/health_controller.rb`
- [x] `test/controllers/api/v1/health_controller_test.rb`
- [x] `docs/stories/STORY-2026-02-27-api-health-boot-fix.md`
