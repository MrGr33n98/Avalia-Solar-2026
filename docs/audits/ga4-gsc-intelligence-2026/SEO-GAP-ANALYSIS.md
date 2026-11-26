# SEO Gap Analysis — Avalia Solar 2026
**Auditoria On-Page, Técnica, Estruturada e Core Web Vitals**  
**Data:** 26 de Novembro de 2026  

---

## 1. Matriz de Gaps Técnicos de SEO

| Área Auditada | Status Observado | Boas Práticas (Google Search) | Severidade | Esforço | Prioridade |
|---|---|---|:---:|:---:|:---:|
| **Sitemap de Empresas** | **Retorna 503 Service Unavailable** | Sitemap deve responder 200 OK com XML válido | **Alta** | Baixo | **P0** |
| **Cobertura de Serviços no Sitemap** | **Apenas 1 URL** mapeada | Todos os serviços ativos devem ser indexados | **Média** | Baixo | **P0** |
| **Meta Titles** | Títulos adequados na Home e Empresas; algumas categorias possuem títulos curtos (< 30 chars) | 50 a 60 caracteres com palavra-chave primária e branding | Média | Baixo | **P1** |
| **Meta Descriptions** | Presente na maioria; algumas páginas de nicho sem meta description única | 140 a 160 caracteres com CTA persuasivo e valor único | Média | Baixo | **P1** |
| **Hierarquia H1** | Um único H1 por página na maioria das rotas; corrigido recentemente no fluxo de empresas | Exatamente 1 tag `<h1>` descritiva por página | Baixa | Mínimo | **P2** |
| **Schema.org Product** | Ausente nas páginas de detalhe de produto (apenas Organization em empresas) | Schema `Product` com `offers`, `brand`, `aggregateRating` | Alta | Médio | **P1** |
| **Schema.org FAQPage** | Ausente na Homepage e categorias | Schema `FAQPage` estruturado para Answer Engines e Google | Média | Baixo | **P1** |
| **Alt Text em Imagens** | Módulos e logos possuem alt; banners de campanha ocasionalmente vazios | 100% das imagens informativas com `alt` descritivo | Baixa | Baixo | **P2** |
| **Apex e Protocolo** | Redirecionamento 308 permanente com preservação de query | 301/308 permanente direto para canonical HTTPS | **Conforme** | Zero | OK |
| **Core Web Vitals (TTFB)** | TTFB medido entre 600ms e 900ms em produção | TTFB < 600ms para 75% dos usuários (Good) | Média | Médio | **P1** |

---

## 2. Auditoria de Dados Estruturados (JSON-LD / Schema.org)

### 2.1 Schemas Encontrados Atualmente em Produção:
* `Organization` (Homepage e Brand Pages)
* `LocalBusiness` (Páginas de integradores locais)
* `BreadcrumbList` (Categorias e navegação)

### 2.2 Schemas Ausentes Críticos:
1. **`Product` / `IndividualProduct`:**
   * Essencial para que páginas de módulos solares (ex: Canadian Solar 550W, WEG 450W) e inversores exibam rich snippets no Google com especificações técnicas e reviews.
2. **`AggregateRating`:**
   * Deve ser incorporado dentro das Brand Pages e páginas de produtos para exibir estrelas de avaliação diretamente nos resultados de busca orgânica, aumentando o CTR em até 30%.
3. **`FAQPage`:**
   * Seções de perguntas frequentes na Homepage ("Como escolher um integrador solar?", "O que é energia solar por assinatura?") precisam de marcação JSON-LD para qualificação em Snippets de Resposta.

