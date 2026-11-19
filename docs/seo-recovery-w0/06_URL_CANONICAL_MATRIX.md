# Matriz de URL/canonical

| Template | Canonical | Sitemap W0 | Política |
|---|---|---|---|
| Empresa | `/companies/{slug}` via `buildCompanyPath` | `companies` | ativa e pública |
| Categoria | `/categories/{slug}` | `categories` | política CategoryDiscovery |
| Local | `/companies/energia-solar/{uf}/{cidade}` | `local-solar` | decisão Rails |
| Ranking | `/melhores-empresas/...` | `local-rankings` | feed Rails |
| Busca/comparação | utilitária | não | noindex/bloqueio atual |

A URL de empresa agora usa o mesmo construtor `AB0-1-front/lib/slug.ts:20-25` da Brand Page.
