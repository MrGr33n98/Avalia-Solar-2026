# STORY-2026-02-28: Corrigir schema load do Postgres para companies.niche_tags

## Contexto
O workflow `Backend Regression Smoke` passou a falhar em `db:schema:load` no Postgres com `data type json has no default operator class for access method "btree"`. O dump atual de `db/schema.rb` descrevia `companies.niche_tags` como `json` com índice padrão B-tree, embora a migration original tivesse sido pensada para `jsonb` com GIN no Postgres.

## Requisito
Garantir que o schema carregado em ambientes Postgres represente `companies.niche_tags` como `jsonb` com índice GIN, evitando falha em `db:schema:load` no smoke test e em bancos novos.

## Acceptance Criteria
- [x] `db/schema.rb` descreve `companies.niche_tags` como `jsonb` no Postgres.
- [x] O índice `index_companies_on_niche_tags` usa `GIN`, não `B-tree`.
- [x] A migration original de `niche_tags` fica adapter-safe para evitar regressão em dumps futuros.

## Checklist de Implementação
- [x] Ajustar a migration `20260226225502_add_niche_tags_to_companies.rb` para diferenciar Postgres de SQLite.
- [x] Corrigir `db/schema.rb` para refletir `jsonb` + `GIN` em `companies.niche_tags`.
- [x] Rodar validação sintática nos arquivos Ruby alterados.
- [x] Rodar `npm run lint` na raiz (falhou: script `lint` inexistente no `package.json` da raiz).
- [x] Rodar `npm run typecheck` na raiz (falhou: script `typecheck` inexistente no `package.json` da raiz).
- [x] Rodar `npm test` na raiz (falhou: script `test` inexistente no `package.json` da raiz).

## File List
- [x] `db/migrate/20260226225502_add_niche_tags_to_companies.rb`
- [x] `db/schema.rb`
- [x] `docs/stories/STORY-2026-02-28-backend-regression-smoke-niche-tags-schema-fix.md`

## Validation
- [x] `ruby -c db/migrate/20260226225502_add_niche_tags_to_companies.rb`
- [x] `ruby -c db/schema.rb`
