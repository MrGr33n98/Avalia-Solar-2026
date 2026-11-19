# Arquitetura de sitemaps

`robots.txt` anuncia apenas `/sitemap-index.xml`. O índice referencia as seções existentes em `SITEMAP_SECTIONS`.

O builder de empresas pagina `page/per_page`, respeita `meta.pagination`, possui limite de segurança e falha explicitamente se uma seção ultrapassar 50.000 URLs. Fragmentação por partição deve ser implementada antes do catálogo exceder esse limite.
