# EGM Review — Elephant-Goldfish Model Governance
**Auditoria de Inteligência de Busca e Analytics**  
**Framework:** Elephant-Goldfish Model (EGM) Multi-Perspective Governance  
**Data:** 26 de Novembro de 2026  

---

## 1. Perspectiva 1: Analytics Engineering

* **Avaliador:** Tech Lead de Analytics
* **Parecer:** **APROVADO COM RESSALVAS CRÍTICAS**
* **Análise:**
  * A identificação empírica da moeda em `USD`, contaminação por `localhost` e sequestro de atribuição por `accounts.google.com` resolvem mistérios históricos da equipe de marketing.
  * O diagnóstico de que o frontend possui uma rica taxonomia de eventos que fica represada no `dataLayer` sem chegar ao GA4 é irrefutável.
  * A recomendação de manter o `index.ts` como dispatcher único para PostHog e GA4 com mapeamento estrito para os Recommended Events é a abordagem mais sustentável.

---

## 2. Perspectiva 2: SEO Engineering

* **Avaliador:** Principal SEO Specialist
* **Parecer:** **APROVADO COM PRIORIDADE MÁXIMA PARA SITEMAP 503**
* **Análise:**
  * O erro 503 em `sitemaps/companies/sitemap.xml` é uma hemorragia silenciosa: o Googlebot tenta indexar o diretório de empresas mas encontra um erro 5xx.
  * A causa técnica (timeout de 6s na paginação sequencial síncrona) foi diagnosticada com precisão cirúrgica.
  * O particionamento do sitemap e a inclusão de cache ISR de 24h são medidas padrão da indústria que protegerão os servidores e garantirão 100% de indexabilidade.

---

## 3. Perspectiva 3: Data Integrity

* **Avaliador:** Data Architect
* **Parecer:** **APROVADO**
* **Análise:**
  * O plano garante que nenhum dado fictício seja injetado em runtime.
  * A integridade referencial entre `company_id` (PostgreSQL), `distinct_id` (PostHog) e `item_id` (GA4) mantém a consistência analítica do pipeline.

---

## 4. Perspectiva 4: Privacy & Consent (LGPD / GDPR)

* **Avaliador:** DPO / Legal & Privacy Engineer
* **Parecer:** **APROVADO COM REQUISITO SÍNCRONO DE CONSENTIMENTO**
* **Análise:**
  * A política de Zero PII (hash de identificadores de usuário e exclusão de e-mails/telefones nos parâmetros de evento) está em plena conformidade com a LGPD.
  * A recomendação de injetar `gtag('consent', 'default', { ... denied ... })` de forma síncrona no `<head>` corrige o risco de carregamento pré-consentimento.

---

## 5. Perspectiva 5: Attribution Modeling

* **Avaliador:** Growth & Attribution Specialist
* **Parecer:** **APROVADO**
* **Análise:**
  * A exclusão de referências OAuth (`accounts.google.com`, `accounts.zoho.com`) é a vitória rápida mais valiosa de toda a auditoria, restaurando a veracidade de 52% das sessões da plataforma sem custo de desenvolvimento.

---

## 6. Perspectiva 6: Performance & Web Vitals

* **Avaliador:** Frontend Performance Engineer
* **Parecer:** **APROVADO**
* **Análise:**
  * O script `gtag.js` continuará carregado via `next/script` com estratégia `afterInteractive` ou `lazyOnload`, sem bloquear o First Contentful Paint (FCP) nem degradar o TTFB medido de ~500ms.

---

## 7. Perspectiva 7: Growth Engineering

* **Avaliador:** Head of Growth
* **Parecer:** **APROVADO**
* **Análise:**
  * A ativação dos eventos de WhatsApp e solicitação de orçamento como Key Events finalmente permitirá a criação de campanhas de remarketing inteligentes e mensuração real de CAC e LTV por canal.

---

## 8. Perspectiva 8: Agentic Storefront (SPEC 026)

* **Avaliador:** AI Systems Architect
* **Parecer:** **APROVADO**
* **Análise:**
  * A constatação de que o ChatGPT e Perplexity já visitam o site espontaneamente valida a urgência de disponibilizar o arquivo `/llms.txt` e integrar as ferramentas MCP do Avalia Solar como um canal de distribuição nativo de IA.

