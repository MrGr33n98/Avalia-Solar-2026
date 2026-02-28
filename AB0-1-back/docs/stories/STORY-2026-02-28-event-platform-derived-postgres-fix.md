# STORY-2026-02-28: Corrigir migration de derived analytics para deploy em Postgres

## Contexto
A migration `20260227190000_create_event_platform_derived_tables.rb` foi publicada com `INSERT OR IGNORE` para popular `analytics_processing_state`. Essa sintaxe funciona em SQLite, mas quebra no Postgres usado no deploy, fazendo o backend falhar ainda no `db:prepare` do `entrypoint.sh` e impedindo o container de ficar healthy.

## Requisito
Garantir que a migration de tabelas derivadas de analytics seja idempotente e compatível com Postgres no ambiente de deploy, sem regredir o comportamento em SQLite/desenvolvimento.

## Acceptance Criteria
- [x] A migration não usa `INSERT OR IGNORE` quando o adapter é Postgres.
- [x] A inicialização de `analytics_processing_state` continua idempotente para execuções repetidas.
- [x] O comportamento compatível com SQLite permanece preservado.

## Checklist de Implementação
- [x] Ajustar a inserção inicial dos pipelines para usar SQL específica por adapter.
- [x] Preservar `do nothing` em reexecuções da migration.
- [x] Rodar validação sintática do arquivo Ruby alterado.
- [x] Rodar `npm run lint` na raiz (falhou: script `lint` inexistente no `package.json` da raiz).
- [x] Rodar `npm run typecheck` na raiz (falhou: script `typecheck` inexistente no `package.json` da raiz).
- [x] Rodar `npm test` na raiz (falhou: script `test` inexistente no `package.json` da raiz).

## File List
- [x] `db/migrate/20260227190000_create_event_platform_derived_tables.rb`
- [x] `docs/stories/STORY-2026-02-28-event-platform-derived-postgres-fix.md`

## Validation
- [x] `ruby -c db/migrate/20260227190000_create_event_platform_derived_tables.rb`
