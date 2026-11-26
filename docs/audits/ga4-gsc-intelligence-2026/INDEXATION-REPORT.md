# Indexation Report — Avalia Solar 2026
**Auditoria de Indexabilidade e Cobertura de Busca**  
**Data:** 26 de Novembro de 2026  
**Ambiente Auditado:** `https://www.avaliasolar.com.br`  

---

## 1. Status de Indexabilidade por Tipo de Página

| Tipo de Página | Rota / Padrão de URL | Renderização | Status HTTP | Canonical | Status de Indexabilidade | Observação / Risco |
|---|---|:---:|:---:|:---:|:---:|---|
| **Homepage** | `/` | SSR (Next.js 14) | 200 OK | Auto-referencial | **100% Indexável** | Principal receptora de autoridade e backlinks. |
| **Diretório Geral** | `/companies` | SSR | 200 OK | Auto-referencial | **100% Indexável** | Lista paginada de empresas. |
| **Brand Pages** | `/companies/[slug]` | SSR + ISR | 200 OK | Auto-referencial | **PARCIAL / EM RISCO P0** | Páginas são indexáveis individualmente, mas o sitemap de empresas está fora do ar (503), prejudicando a descoberta pelo Googlebot. |
| **Categorias de Produtos** | `/categories/[slug]` | SSR + ISR | 200 OK | Auto-referencial | **100% Indexável** | 55 categorias mapeadas no sitemap. |
| **Matriz Empresa x Categoria** | `/companies/[category]/[slug]` | SSR | 200 OK | Auto-referencial | **100% Indexável** | 33 rotas indexadas no sitemap específico. |
| **Rankings Locais** | `/rankings/[uf]/[city]` | SSR | 200 OK | Auto-referencial | **100% Indexável** | 43 rotas locais mapeadas. |
| **Páginas Locais de Energia** | `/companies/energia-solar/[uf]/[city]` | SSR | 200 OK | Auto-referencial | **100% Indexável** | 45 rotas de capitais e grandes polos solares. |
| **Catálogo de Produtos (PDP)** | `/products/[slug]` | SSR | 200 OK | Auto-referencial | **SUBINDEXADO P1** | Produtos existem no banco, mas não possuem sitemap dedicado de produtos. |
| **Serviços Solares** | `/services/[slug]` | SSR | 200 OK | Auto-referencial | **CRÍTICO P0** | Apenas 1 serviço mapeado no sitemap (`/services/sitemap.xml`). |
| **Artigos do Blog** | `/blog/[slug]` | SSR | 200 OK | Auto-referencial | **100% Indexável** | 4 artigos ativos indexados. |
| **Busca Interna** | `/search?q=...` | Client/SSR | 200 OK | Não aplicável | **Corretamente Bloqueado** | Bloqueado via `robots.txt` para evitar indexação de páginas de baixa qualidade. |
| **Comparador** | `/compare` | Client-side | 200 OK | Não aplicável | **Corretamente Bloqueado** | Bloqueado via `robots.txt`. |
| **Painéis / Dashboards** | `/dashboard/*`, `/review-dashboard/*` | Autenticado | 302/401 | Não indexável | **Corretamente Protegido** | Bloqueado via `robots.txt` e middleware. |

---

## 2. Auditoria Amostral de Brand Pages Reais

Amostragem realizada contra os maiores fabricantes e integradores:

| Empresa / URL | HTTP Status | TTFB Observado | Canonical Tag | JSON-LD Encontrado | Veredito |
|---|:---:|---:|:---:|:---:|:---:|
| `https://www.avaliasolar.com.br/companies/weg` | 200 | 480ms | Presente e correto | `Organization`, `LocalBusiness` | **Aprovado** |
| `https://www.avaliasolar.com.br/companies/goodwe-brasil` | 200 | 510ms | Presente e correto | `Organization`, `LocalBusiness` | **Aprovado** |
| `https://www.avaliasolar.com.br/companies/sungrow-brasil` | 200 | 530ms | Presente e correto | `Organization`, `LocalBusiness` | **Aprovado** |
| `https://www.avaliasolar.com.br/companies/trends-solar-energy` | 200 | 495ms | Presente e correto | `Organization`, `LocalBusiness` | **Aprovado** |
| `https://www.avaliasolar.com.br/companies/empresa-inexistente-gate` | 404 | 320ms | Ausente | Nenhum (`noindex`) | **Aprovado** |

> **Conclusão:** As páginas públicas individuais atendem plenamente aos critérios de renderização Server-First (HTML gerado no servidor), possuem canonical tags consistentes e tratam erros 404 de forma segura. O único obstáculo para indexação massiva é o **gargalo de descoberta (Sitemap 503)**.

