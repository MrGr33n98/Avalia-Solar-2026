# Spec 015 — SEO Recovery W0

## Objetivo

Restaurar a confiabilidade técnica de descoberta, sitemap, canonical e indexabilidade das entidades públicas elegíveis do Avalia Solar, preservando Next.js 14, Rails 7, PostgreSQL, URLs e a experiência visual.

## Evidência de entrada

- `AB0-1-front/lib/seo/sitemap-builders.ts:147-178`: falhas HTTP/rede eram convertidas em `[]`.
- `AB0-1-front/lib/seo/sitemap-builders.ts:480-510`: empresas eram lidas como uma única página de 100 registros.
- `AB0-1-back/app/controllers/concerns/paginatable.rb:8-12`: API limita `per_page` a 100.
- `AB0-1-front/app/robots.ts:38`: dois sitemaps eram anunciados.
- `AB0-1-back/app/domain/category_discovery/local_page_policy.rb:3-45` e `AB0-1-front/lib/seo/local-page-quality.ts:1-75`: limites divergentes para páginas locais.
- `AB0-1-back/app/models/company.rb:713-729`: `project_types` aplicava apenas `strip`.

## Escopo W0 implementado

1. Paginação segura e determinística do sitemap de empresas.
2. Erros de upstream/payload inválido explícitos como `SitemapUpstreamError`.
3. Falhas dos feeds Rails de rankings/grupos como HTTP 503 sem cache de vazio.
4. Índice de sitemap como fonte principal no `robots`.
5. Rails como autoridade de elegibilidade local no frontend.
6. Normalização de caracteres de controle em novos valores `project_types`.
7. Testes de regressão frontend/backend.

## Fora do escopo

GSC, alterações de dados existentes, migrações, importação RFB/ANEEL/IBGE, fragmentação física de sitemaps acima de 50.000 URLs, blog/produtos/rankings W1 e deploy.

## Rastreabilidade

`RCA-01/02/03/04/05/15 → FR-W0-01..07 → TASK-W0-01..07 → testes focados → evidências em docs/seo-recovery-w0/15_BEFORE_AFTER_EVIDENCE.md`.

## Critérios de aceite

- Feed paginado lê além do primeiro lote e para conforme `meta.pagination` ou lote curto.
- HTTP 5xx, timeout e payload incompatível não geram sitemap vazio com sucesso.
- Páginas locais usam `seo.indexable` do Rails por padrão.
- Nenhum novo `project_type` com caractere de controle passa pela normalização do modelo.
- Não há alteração visual nas Brand Pages.
