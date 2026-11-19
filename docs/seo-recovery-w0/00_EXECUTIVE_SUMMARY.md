# SEO Recovery W0 — Resumo executivo

## Estado

Implementação P0 parcial concluída em branch dedicada. Foram corrigidos os contratos de sitemap de empresas, falhas upstream, robots, paridade local Rails/Next e entrada de `project_types`.

## Três gargalos confirmados

1. `AB0-1-front/lib/seo/sitemap-builders.ts:480-510` lia apenas uma página, enquanto `AB0-1-back/app/controllers/concerns/paginatable.rb:8-12` limita cada página a 100.
2. `AB0-1-front/lib/seo/sitemap-builders.ts:147-178` ocultava HTTP 5xx, timeout e payload inválido como lista vazia.
3. `AB0-1-back/app/domain/category_discovery/local_page_policy.rb:3-45` e `AB0-1-front/lib/seo/local-page-quality.ts:1-75` aplicavam limites diferentes.

## Resultado esperado

Mais descoberta técnica das URLs elegíveis, menos sitemaps incompletos e menor risco de desindexação causada por falhas silenciosas. Indexação e recuperação de impressões continuam dependentes do Google e precisam de medição pós-deploy.
