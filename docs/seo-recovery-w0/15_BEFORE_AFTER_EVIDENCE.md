# Evidências antes/depois

## Antes confirmado no código

- Empresas: `companies?status=active&per_page=100` em uma chamada.
- Erros: `fetchRecords()` retornava `[]` em não-2xx/exceção.
- Robots: dois sitemaps.
- Local: default frontend 3 empresas.
- `project_types`: `strip` apenas.

## Depois no código

- Empresas paginadas por `meta.pagination`/lote curto.
- Erros viram `SitemapUpstreamError`/503.
- Robots anuncia índice único.
- Local usa decisão Rails por padrão.
- Controle interno é convertido em espaço e reconciliado ao catálogo.

## Não medido

GSC, contagem de produção, indexação, impressões, latência real e XML publicado. Não há empresas no banco local usado no dry-run.
