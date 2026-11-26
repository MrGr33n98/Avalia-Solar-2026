# Performance Baseline — Avalia Solar 2026
**Medições Reais de Latência, TTFB e Tempos de Resposta em Produção**  
**Data:** 26 de Novembro de 2026  
**Ambiente de Teste:** Produção (`https://www.avaliasolar.com.br`)  

---

## 1. Medições de TTFB (Time to First Byte)

Medições realizadas via `curl` sequencial público:

| Rota / Endpoint | Amostra 1 (ms) | Amostra 2 (ms) | Amostra 3 (ms) | Média Observada (ms) | Meta Google CWV | Status |
|---|---:|---:|---:|---:|---:|:---:|
| `/` (Homepage) | 3.306ms (Cold) | 580ms | 490ms | 535ms (Warm) | < 800ms | **PASS** |
| `/companies` (Diretório) | 780ms | 460ms | 440ms | 450ms (Warm) | < 800ms | **PASS** |
| `/companies/weg` (Brand Page) | 680ms | 480ms | 450ms | 465ms (Warm) | < 800ms | **PASS** |
| `/categories/energia-solar` | 620ms | 410ms | 390ms | 400ms (Warm) | < 800ms | **PASS** |
| `/robots.txt` | 210ms | 180ms | 170ms | 175ms | < 300ms | **PASS** |

---

## 2. Latência dos Sitemaps Públicos

Teste rigoroso de 10 requisições consecutivas no endpoint `sitemaps/local-solar/sitemap.xml`:

| Métrica | Valor Observado | Limite de Aceitação (SLA) | Veredito |
|---|---:|---:|:---:|
| **Cold Request (Requisição 1)** | **788,18ms** | < 5.000ms | **PASS** |
| **Warm Request (Mínima)** | **634,69ms** | < 2.000ms | **PASS** |
| **Warm Request (Máxima)** | **1.009,71ms** | < 2.000ms | **PASS** |
| **Latência Percentil 95 (Warm p95)** | **1.009,71ms** | < 2.000ms | **PASS** |

### O Gargalo Crítico: `sitemaps/companies/sitemap.xml`
* **Latência:** **6.856,42ms** (Excede o timeout de 6.000ms).
* **HTTP:** **503 Service Unavailable**.
* **Impacto de Performance:** Essa falha impede a indexação do acervo de empresas sem afetar a performance das páginas que já estão em cache.

