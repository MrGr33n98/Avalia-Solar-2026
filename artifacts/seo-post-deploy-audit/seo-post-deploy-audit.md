# Auditoria SEO pós-deploy

- Base: https://www.avaliasolar.com.br
- Gerado em: 2026-11-26T13:09:14Z
- Resultado: **FAIL**

## Checks

| Check | Status | Evidência |
|---|---|---|
| apex_tls_redirect | pass | status_code=308, location=https://www.avaliasolar.com.br/seo-w0-redirect-probe?source=github-actions, expected_location=https://www.avaliasolar.com.br/seo-w0-redirect-probe?source=github-actions, duration_ms=985.56, error=None |
| www_homepage | pass | status_code=200, duration_ms=3306.18, canonical=https://www.avaliasolar.com.br |
| homepage_canonical | pass | canonical=https://www.avaliasolar.com.br |
| robots | pass | status_code=200, sitemap_reference=True |
| sitemap_index_xml | pass | status_code=200, sitemap_count=10, duration_ms=1011.83 |
| sitemap_sections | fail | section_count=10, failed_sections=['https://www.avaliasolar.com.br/sitemaps/companies/sitemap.xml'] |
| sitemap_url_integrity | pass | total_urls=200, duplicate_count=0, invalid_host_count=0, duplicate_examples=[], invalid_examples=[] |
| sitemap_local_solar_performance | pass | url=https://www.avaliasolar.com.br/sitemaps/local-solar/sitemap.xml, sample_count=10, samples_ms=[788.18, 801.47, 987.34, 724.83, 831.14, 898.81, 1009.71, 735.96, 672.94, 634.69], cold_observed_ms=788.18, warm_p95_ms=1009.71, cold_target_ms=5000, warm_target_ms=2000, methodology=10 requisições sequenciais públicas; a primeira é cold observado e as nove seguintes são warm observado. |
| missing_company_404 | pass | status_code=404, noindex=True, canonical=None |

## Sitemaps

| URL | HTTP | XML | URLs | Duração (ms) |
|---|---:|---|---:|---:|
| https://www.avaliasolar.com.br/sitemaps/static/sitemap.xml | 200 | True | 18 | 1498.43 |
| https://www.avaliasolar.com.br/sitemaps/blog/sitemap.xml | 200 | True | 4 | 1856.33 |
| https://www.avaliasolar.com.br/sitemaps/categories/sitemap.xml | 200 | True | 55 | 1054.09 |
| https://www.avaliasolar.com.br/sitemaps/company-categories/sitemap.xml | 200 | True | 33 | 1311.53 |
| https://www.avaliasolar.com.br/sitemaps/local-rankings/sitemap.xml | 200 | True | 43 | 929.36 |
| https://www.avaliasolar.com.br/sitemaps/companies/sitemap.xml | 503 | False | 0 | 6856.42 |
| https://www.avaliasolar.com.br/sitemaps/services/sitemap.xml | 200 | True | 1 | 1223.53 |
| https://www.avaliasolar.com.br/sitemaps/local-solar/sitemap.xml | 200 | True | 45 | 1576.31 |
| https://www.avaliasolar.com.br/sitemaps/creators/sitemap.xml | 200 | True | 0 | 885.65 |
| https://www.avaliasolar.com.br/sitemaps/groups/sitemap.xml | 200 | True | 1 | 1165.96 |

## GSC

Nenhuma sessão autenticada do Google Search Console está disponível no runner.

Permissões necessárias: Usuário Owner ou Full User na propriedade sc-domain:avaliasolar.com.br; Acesso de leitura a Performance, Indexação/Páginas e Sitemaps; Permissão para consultar os períodos de 7 e 28 dias e exportar métricas

Os dados JSON completos permanecem no artifact seo-post-deploy-audit.
