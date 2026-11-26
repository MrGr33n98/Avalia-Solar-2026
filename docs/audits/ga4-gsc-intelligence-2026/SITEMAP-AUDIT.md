# Sitemap Audit — Avalia Solar 2026
**Auditoria de Estrutura, Integridade XML e Latência de Sitemaps**  
**Data:** 26 de Novembro de 2026  
**URL do Índice:** `https://www.avaliasolar.com.br/sitemap-index.xml`  

---

## 1. Inventário Geral do Índice de Sitemaps

| # | Seção do Sitemap | URL Canônica | HTTP Status | Duração (ms) | URLs Mapeadas | Status de Saúde |
|---|---|---|:---:|---:|---:|:---:|
| 1 | `static` | `https://www.avaliasolar.com.br/sitemaps/static/sitemap.xml` | 200 OK | 1.498ms | 18 | ✅ Saudável |
| 2 | `blog` | `https://www.avaliasolar.com.br/sitemaps/blog/sitemap.xml` | 200 OK | 1.856ms | 4 | ✅ Saudável |
| 3 | `categories` | `https://www.avaliasolar.com.br/sitemaps/categories/sitemap.xml` | 200 OK | 1.054ms | 55 | ✅ Saudável |
| 4 | `company-categories` | `https://www.avaliasolar.com.br/sitemaps/company-categories/sitemap.xml` | 200 OK | 1.311ms | 33 | ✅ Saudável |
| 5 | `local-rankings` | `https://www.avaliasolar.com.br/sitemaps/local-rankings/sitemap.xml` | 200 OK | 929ms | 43 | ✅ Saudável |
| **6** | **`companies`** | **`https://www.avaliasolar.com.br/sitemaps/companies/sitemap.xml`** | **503** | **6.856ms** | **0** | ❌ **CRÍTICO P0** |
| 7 | `services` | `https://www.avaliasolar.com.br/sitemaps/services/sitemap.xml` | 200 OK | 1.223ms | 1 | ⚠️ Alerta (Subindexado) |
| 8 | `local-solar` | `https://www.avaliasolar.com.br/sitemaps/local-solar/sitemap.xml` | 200 OK | 1.576ms | 45 | ✅ Saudável |
| 9 | `creators` | `https://www.avaliasolar.com.br/sitemaps/creators/sitemap.xml` | 200 OK | 885ms | 0 | ℹ️ Vazio (Feature gated) |
| 10 | `groups` | `https://www.avaliasolar.com.br/sitemaps/groups/sitemap.xml` | 200 OK | 1.165ms | 1 | ✅ Saudável |
| **Total** | — | — | — | — | **200** | **Déficit Severo de Cobertura** |

---

## 2. Diagnóstico Aprofundado da Falha 503 (`companies/sitemap.xml`)

### 2.1 Causa Raiz
* **Localização do Código:** `AB0-1-front/lib/seo/sitemap-builders.ts`
* **Implementação Atual:**
  ```typescript
  const SITEMAP_FETCH_TIMEOUT_MS = 6_000;
  const COMPANY_SITEMAP_PAGE_SIZE = 100;
  const PAGINATED_SITEMAP_MAX_PAGES = 500;

  export async function getCompanySitemapEntries(): Promise<MetadataRoute.Sitemap> {
    const companies = await fetchPaginatedRecords(
      'companies?status=active',
      COMPANY_SITEMAP_PAGE_SIZE,
      900
    );
    ...
  }
  ```
* **Mecanismo da Falha:**
  1. A função `fetchPaginatedRecords` executa requisições HTTP síncronas sequenciais para cada página: `página 1` -> aguarda resposta -> `página 2` -> aguarda resposta -> `página 3`...
  2. Como existem centenas de empresas ativas cadastradas, a consulta sequencial ultrapassa a janela de tolerância de 6.000ms (`SITEMAP_FETCH_TIMEOUT_MS`).
  3. O `AbortController` cancela a requisição e lança `SitemapUpstreamError('companies', ...)`.
  4. O route handler de `sitemaps/[section]/sitemap.xml` intercepta o erro e retorna `503 Service Unavailable`.

### 2.2 Latência e Performance de Sitemaps Saudáveis
Teste de carga sequencial de 10 requisições em `sitemaps/local-solar/sitemap.xml`:
* **Amostra 1 (Cold):** 788,18ms (Meta: < 5.000ms — **PASS**)
* **Amostras 2 a 10 (Warm):** 801ms, 987ms, 724ms, 831ms, 898ms, 1.009ms, 735ms, 672ms, 634ms
* **Latência p95 Warm:** 1.009,71ms (Meta: < 2.000ms — **PASS**)

---

## 3. Arquitetura de Remediação Proposta (Sem Regressões)

1. **Particionamento em Lotes (Sitemap Index Sharding):**
   * Em vez de um único `companies/sitemap.xml` monolítico, particionar em:
     * `/sitemaps/companies/1/sitemap.xml`
     * `/sitemaps/companies/2/sitemap.xml`
   * Cada lote contendo no máximo 1.000 empresas, resolvido em uma única requisição ao banco/API.
2. **Endpoint Otimizado de Sitemap no Backend Rails:**
   * Criar endpoint leve `/api/v1/sitemaps/companies?page=X&per_page=1000` que retorne apenas `id`, `slug` e `updated_at` (evitando carregar associações pesadas de reviews, banners e categorias).
3. **Cache ISR (Incremental Static Regeneration):**
   * Configurar `export const revalidate = 86400;` (24 horas) para que os sitemaps sejam cacheados no edge/CDN do Next.js e nunca gerem chamadas sob demanda ao backend durante o crawl do Googlebot.

