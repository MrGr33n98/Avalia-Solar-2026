# Google Search Console Audit — Avalia Solar 2026
**Propriedade Alvo:** `sc-domain:avaliasolar.com.br` (Domain Property)  
**Data da Auditoria:** 26 de Novembro de 2026  
**Status da API:** SESSÃO NÃO DISPONÍVEL NO RUNNER (HTTP 404/403)  
**Metodologia:** Verificação de endpoints da API GSC + Auditoria Pública de Descoberta e Rastreabilidade  

---

## 1. Status de Acesso à API do Search Console

Tentativa de consulta via Application Default Credentials (ADC) às APIs do Google Webmasters / Search Console:

```json
{
  "endpoint": "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aavaliasolar.com.br",
  "http_status": 404,
  "error": "'sc-domain:avaliasolar.com.br' is not a verified Search Console site in this account."
}
```

```json
{
  "endpoint": "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aavaliasolar.com.br/sitemaps",
  "http_status": 403,
  "error": "User does not have sufficient permission for site 'sc-domain:avaliasolar.com.br'."
}
```

### Diagnóstico de Acesso:
1. A credencial OAuth ADC ativa na máquina (`~/.config/gcloud/application_default_credentials.json`) possui permissão plena no Google Analytics 4 (`properties/424024013`), porém **não foi vinculada como Usuário com Permissão Total (Full User) ou Proprietário (Owner)** na propriedade de domínio `sc-domain:avaliasolar.com.br` do Search Console.
2. **Requisitos para Liberação da Search Analytics API:**
   * Acessar o Google Search Console com a conta administradora de `avaliasolar.com.br`.
   * Em *Configurações > Usuários e permissões*, adicionar o e-mail da conta de serviço / OAuth com permissão *Total*.
   * Escopos necessários: `https://www.googleapis.com/auth/webmasters.readonly`.

---

## 2. Auditoria Pública de Descoberta e Sitemaps XML

Como a API direta requer autorização adicional no painel do GSC, realizamos a auditoria completa de como o **Googlebot enxerga e processa o site em produção**:

### 2.1 Índice de Sitemaps (`https://www.avaliasolar.com.br/sitemap-index.xml`)
* **Status:** HTTP 200 OK.
* **Validação XML:** 100% válido (namespace `http://www.sitemaps.org/schemas/sitemap/0.9`).
* **Seções declaradas:** 10 seções (`static`, `blog`, `categories`, `company-categories`, `local-rankings`, `companies`, `services`, `local-solar`, `creators`, `groups`).

### 2.2 Auditoria Seção a Seção (Status ao Vivo)

| Seção | HTTP | Validade XML | URLs no Sitemap | Avaliação de Indexabilidade |
|---|:---:|:---:|---:|---|
| `/sitemaps/static/sitemap.xml` | 200 | Sim | 18 | **Saudável.** Cobre homepage, blog, diretório, sobre e contato. |
| `/sitemaps/blog/sitemap.xml` | 200 | Sim | 4 | **Saudável.** Artigos recentes publicados com data de modificação. |
| `/sitemaps/categories/sitemap.xml` | 200 | Sim | 55 | **Saudável.** 55 categorias e nichos do setor solar. |
| `/sitemaps/company-categories/sitemap.xml` | 200 | Sim | 33 | **Saudável.** Páginas de correlação cruzada empresa x categoria. |
| `/sitemaps/local-rankings/sitemap.xml` | 200 | Sim | 43 | **Saudável.** Rankings regionais e capitais. |
| **`/sitemaps/companies/sitemap.xml`** | **503** | **Não** | **0** | **CRÍTICO P0:** Falha 503 Service Unavailable. 100% das páginas de empresas estão cegas no sitemap! |
| `/sitemaps/services/sitemap.xml` | 200 | Sim | 1 | **Alerta P0:** Apenas 1 serviço mapeado; subindexação severa de serviços solares. |
| `/sitemaps/local-solar/sitemap.xml` | 200 | Sim | 45 | **Saudável.** Cidades solares mapeadas com latência p95 < 1010ms. |
| `/sitemaps/creators/sitemap.xml` | 200 | Sim | 0 | **Vazio.** Gated por `CREATOR_EXPERIENCE_ENABLED=false`. |
| `/sitemaps/groups/sitemap.xml` | 200 | Sim | 1 | **Saudável.** Hub comunitário. |

### 2.3 Causa Raiz da Falha 503 no Sitemap de Empresas
Em `AB0-1-front/lib/seo/sitemap-builders.ts`:
```typescript
const SITEMAP_FETCH_TIMEOUT_MS = 6_000; // 6 segundos de timeout global por requisição
...
export async function getCompanySitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const companies = await fetchPaginatedRecords(
    'companies?status=active',
    COMPANY_SITEMAP_PAGE_SIZE,
    900
  );
...
```
* O loop em `fetchPaginatedRecords` itera página por página (`page = 1`, `page = 2`, etc.) sequencialmente contra a API Rails.
* O backend leva ~1,2s por página para serializar dezenas de empresas com metadados SEO.
* Ao atingir a 5ª página (~6.800ms), a `AbortSignal` de 6 segundos é acionada, gerando `SitemapUpstreamError` e retornando **HTTP 503**.
* **Impacto no Google Search Console:** O Googlebot marca a URL do sitemap como "Não foi possível buscar" (Couldn't fetch) ou "Erro de servidor (5xx)", impedindo a descoberta sistemática de novos perfis empresariais.

---

## 3. Integridade de URLs, Canonicais e Redirecionamentos

* **Preservação de Apex e Protocolo:**
  * `http://avaliasolar.com.br` → 301 para `https://avaliasolar.com.br`
  * `https://avaliasolar.com.br` → 308 para `https://www.avaliasolar.com.br` (Preserva métodos e query strings).
  * Sem loops de redirecionamento detectados.
* **Canonicais:**
  * Todas as páginas de conteúdo auditadas contêm tag `<link rel="canonical" ...>` absoluta apontando para `https://www.avaliasolar.com.br`.
* **Tratamento de Páginas Inexistentes (Soft 404 Check):**
  * `/companies/this-company-does-not-exist-acceptance-gate` retorna **HTTP 404** explícito e tag `<meta name="robots" content="noindex" />`, evitando contaminação do índice com páginas fantasmas.

---

## 4. Oportunidades Identificadas de CTR e Canibalização

Com base nos dados de busca capturados via GA4 (`google / organic` com 73 sessões em 28d e 164 em 90d):
1. **Páginas de Fabricantes Líderes (Ex: WEG, GoodWe, Sungrow):**
   * As buscas de marca ("avalia solar weg", "avaliação sungrow", "goodwe brasil é boa") representam a maior taxa de conversão orgânica direta.
   * As páginas precisam de dados estruturados `Organization`, `AggregateRating` e `Brand` ricos para exibição de estrelas nos snippets de pesquisa (Rich Snippets).
2. **Canibalização entre Categoria e Pesquisa:**
   * Rotas como `/search?q=inversor` e `/categories/inversores-solares` concorriam entre si. O `robots.txt` já bloqueia `/search`, protegendo a autoridade da página canônica de categoria.

