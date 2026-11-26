# KPI Targets — Search & Analytics Intelligence
**Metas Estratégicas e Técnicas (2026 / 2027)**  
**Data:** 26 de Novembro de 2026  

---

## 1. Metas de Qualidade de Dados (Analytics Engineering)

| Métrica / Dimensão | Situação Atual (Baseline) | Meta Curto Prazo (30d) | Meta Médio Prazo (90d) | Método de Validação |
|---|:---:|:---:|:---:|---|
| **Cobertura de Eventos-Chave** | 0% (Apenas `purchase` vazio) | 100% de Leads, WhatsApp e Contato configurados | Funil ponta a ponta com receita atribuída | Relatórios de conversão GA4 |
| **Integridade da Moeda** | USD | BRL (R$) | BRL (R$) | `get_property_details` |
| **Contaminação por Localhost** | 24 sessões / mês | 0 sessões de dev em prod | 0 sessões de dev em prod | Relatório de `hostName` no GA4 |
| **Atribuição Distorcida por OAuth** | 43,4% das sessões marcadas como Google OAuth | < 1% de referrals residuais | 0% de interferência de login na atribuição | Relatório de `sessionSource` |
| **Discrepância PostHog × GA4** | 100% (GA4 não recebia eventos de negócio) | < 5% de tolerância entre eventos autorizados | < 3% de discrepância | Comparação diária de volume |

---

## 2. Metas de Desempenho e SEO Técnico

| Métrica / Dimensão | Situação Atual (Baseline) | Meta Curto Prazo (30d) | Meta Médio Prazo (90d) | Método de Validação |
|---|:---:|:---:|:---:|---|
| **Disponibilidade do Sitemap de Empresas** | 0% (Erro 503) | 100% (200 OK com XML válido) | 100% (200 OK) | `post-deploy-audit.py` |
| **URLs Mapeadas em Sitemaps** | 200 URLs | > 1.500 URLs (Empresas + Produtos) | > 5.000 URLs (Todas as praças) | Contagem total de `<loc>` |
| **Latência p95 de Resposta dos Sitemaps** | 6.856ms (Falha) | < 1.000ms | < 500ms | 10 amostras sequenciais |
| **Rich Snippets em Resultados de Busca** | Baixa cobertura (Apenas Organization) | Product + AggregateRating em 100% das páginas de marcas | FAQPage nos principais artigos e home | Teste de Resultados Ricos Google |
| **Tráfego Orgânico Mensal** | 164 sessões / 90d | > 1.000 sessões / mês | > 5.000 sessões / mês | Relatório de canais GA4 |

---

## 3. Metas de AI Visibility e Descoberta Generativa

| Métrica / Dimensão | Situação Atual (Baseline) | Meta Curto Prazo (30d) | Meta Médio Prazo (90d) | Método de Validação |
|---|:---:|:---:|:---:|---|
| **Sessões Identificadas de Agentes de IA** | 13 sessões / 90d | > 100 sessões / mês | > 500 sessões / mês | Origens ChatGPT, Perplexity, Claude |
| **Disponibilidade de `/llms.txt`** | Inexistente (404) | Publicado e validado | Atualizado semanalmente | HTTP 200 na raiz |
| **Consultas Gated ao MCP de Empresas** | Ativo internamente (#246) | Integrado ao Agentic Storefront (SPEC 026) | Telemetria completa com atribuição comercial | Logs de invocação MCP |

