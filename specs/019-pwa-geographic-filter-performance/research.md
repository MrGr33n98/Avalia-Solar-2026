# Research | evidência inicial e lacunas

Fonte: auditoria forense A+++ enviada pelo usuário em 24/11/2026. Relata branch `feat/018-mcp-interactive-ui`, HEAD `db3b51e28`, imagem frontend local `dd578e8` divergente. Confirmar novamente; não tomar como estado atual.

| Gap | Evidência fornecida | Ação |
|---|---|---|
| G01 | debounce 300ms antes do cache | T010–T013 |
| G02 | throttle 500ms descarta seleção | T010–T013 |
| G03 | sem cancelamento/guard | T010–T013 |
| G04 | Rails frio 3,826s vs 47–92ms quente | T020 |
| G05 | Rails private e proxy no-store, ETag removido no HEAD | T021,T030–T033 |
| G06 | três hooks, drawer desmontado | T010–T016 |
| G07 | count 404 local, 3 retries | T017,T022 |
| G08 | rota /states/:id/cities não existe | T013–T014 |
| G09 | 645 SP / 853 MG, componente inline | T040–T043 |
| G10 | funções SQL e strings de cobertura sem índices ideais | T050–T053 |
| G11 | locations inclui inativas; 1,436s frio local | T023,T033 |
| G12 | SW desabilitado por padrão | T034–T035 |
| G13 | feedback de erro insuficiente | T016,T043 |
| G14 | asserts antigos, handle aberto, hooks sem testes | T004–T007 |

Dados: JSON bruto 136.728 B, gzip 31.113 B, 27 UFs, 5.569 municípios. SC 295, MT 141, SP 645, MG 853 conforme auditoria. `count` 404 e `/states/42/cities` 404 locais; SSR local 500 por ausência de `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`; banco dev vazio; vhost www não localizado no repo. Nenhum dado de borda ou EXPLAIN representativo medido. Três suites/13 testes passaram com forceExit, duas assertions falharam em LocationFilters, outro teste travou.

Alternativa C escolhida: cache-first compartilhado + HTTP/edge + warmup Rails; API versionada via digest como caminho inicial. Asset estático por UF é alternativa posterior, não uma segunda fonte de verdade. Rejeitar catálogo inteiro no JS inicial e correção apenas de CDN sem resolver concorrência.
