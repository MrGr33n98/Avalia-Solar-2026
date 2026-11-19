# Validação pós-deploy

1. `GET /robots.txt`: apenas índice principal.
2. `GET /sitemap-index.xml`: XML válido e todas as seções.
3. `GET /sitemaps/companies/sitemap.xml`: 200, URLs únicas e canônicas.
4. Simular upstream indisponível em staging: seção 503, `no-store`, sem XML vazio cacheado.
5. Conferir uma Brand Page, filtros, local page e ranking.
6. Enviar/revalidar sitemap no GSC e aguardar coleta.
7. Medir D+7/D+14/D+30/D+60/D+90 por seção, sem atribuir causalidade automática.
