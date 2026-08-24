# Creator Ecosystem — Fase 7

## Escopo

Preparar ranking determinístico do feed sem ML prematuro.

## Alterações

- Criado `Feed::Ranker`.
- `Feed::Query` aplica ranking centralizado.
- View `recent` preserva ordem cronológica.
- View `for_you` prioriza score de engajamento persistido e usa data/id como desempate.
- Score usa:
  - reactions
  - comments ativos
  - saved items
- Somente subjects suportados pelo feed entram nas views públicas.
- `following` exige `visibility = public`.
- Paginação por cursor preservada.

## Decisões

- Nenhum modelo ML ou serviço externo introduzido.
- Nenhum score gravado em banco.
- Ranking continua determinístico e explicável.
- Engajamento é agregado em consulta SQL.
- `recent` permanece referência para comparação e debugging.

## Testes

- Criado `spec/services/feed/ranker_spec.rb`.
- Criado `spec/services/feed/query_spec.rb`.
- Casos cobertos:
  - ordem cronológica
  - prioridade por engajamento
  - filtro público
  - cursor
  - ausência de duplicação entre páginas
- `npm run typecheck`: passou.
- `git diff --check`: passou.

## Pendências

- Executar specs Ruby dentro Docker.
- Medir plano SQL em PostgreSQL de produção.
- Adicionar sinais de follow, categoria e localização somente após fonte confiável.
- Avaliar materialized view ou cache se volume exigir.
- Ranking ML permanece fora do escopo atual.
