# STORY-2026-02-28: Corrigir índice BTREE em tabela particionada de platform events

## Contexto
Depois do ajuste anterior da camada derived, o deploy passou a falhar na migration `20260227193000_add_btree_index_to_platform_events_occurred_at.rb`. O erro de produção mostrou `PG::FeatureNotSupported: cannot create index on partitioned table "platform_events" concurrently`, porque a migration tentava criar um índice `CONCURRENTLY` no parent particionado.

## Requisito
Garantir que o índice BTREE de `platform_events.occurred_at` seja criado de forma compatível com Postgres para tabelas particionadas, sem bloquear o deploy em `db:prepare`.

## Acceptance Criteria
- [x] A migration não usa `CONCURRENTLY` ao criar índice no parent particionado `platform_events`.
- [x] O rollback da migration também usa sintaxe compatível com índice de tabela particionada.
- [x] A migration continua restrita ao adapter Postgres.

## Checklist de Implementação
- [x] Ajustar `up` para criar o índice sem `CONCURRENTLY`.
- [x] Ajustar `down` para remover o índice sem `CONCURRENTLY`.
- [x] Rodar validação sintática do arquivo Ruby alterado.
- [x] Rodar `npm run lint` na raiz (falhou: script `lint` inexistente no `package.json` da raiz).
- [x] Rodar `npm run typecheck` na raiz (falhou: script `typecheck` inexistente no `package.json` da raiz).
- [x] Rodar `npm test` na raiz (falhou: script `test` inexistente no `package.json` da raiz).

## File List
- [x] `db/migrate/20260227193000_add_btree_index_to_platform_events_occurred_at.rb`
- [x] `docs/stories/STORY-2026-02-28-platform-events-partitioned-index-fix.md`

## Validation
- [x] `ruby -c db/migrate/20260227193000_add_btree_index_to_platform_events_occurred_at.rb`
