# Product Decision Record (PDR) — Search & Analytics Intelligence
**Status:** APROVADO / READ-ONLY AUDIT BASELINE  
**Data:** 26 de Novembro de 2026  
**Decisores:** Time de Produto, Analytics Engineering e Engenharia de Growth  

---

## 1. Contexto e Motivação

O Avalia Solar consolidou-se como o marketplace e diretório de referência no setor de energia solar fotovoltaica no Brasil. No entanto, o diagnóstico integrado de Google Analytics 4, Google Search Console, PostHog e telemetria de Buyer Intent identificou que a infraestrutura de medição possuía lacunas fundamentais:
1. Moeda reportada em USD gerando inconsistência com relatórios financeiros em BRL.
2. Contaminação por `localhost` e redirecionamentos OAuth do Google/Zoho distorcendo a atribuição de aquisição.
3. Sitemap de empresas respondendo em 503, bloqueando o rastreamento orgânico do principal ativo da plataforma (Brand Pages).
4. Desconexão entre os eventos de negócio do frontend e a camada de conversão do GA4.

---

## 2. Decisões Arquiteturais Aprovadas

### DECISÃO 1: Unificação da Camada de Disparo de Analytics (Single Dispatcher)
* **Decisão:** Manter o `AB0-1-front/lib/analytics/index.ts` como o dispatcher canônico, mas garantir que todo evento autorizado pelo Consent Mode seja simultaneamente enviado ao **PostHog** e ao **GA4** (`gtagEvent`), mapeado para os Recommended Events.
* **Trade-off:** Manter PostHog e GA4 em paralelo consome alguns kilobytes a mais no bundle, mas garante resiliência: o GA4 serve para métricas de mídia, SEO e atribuição agregada, enquanto o PostHog provê session replay, funis de produto e análise qualitativa.

### DECISÃO 2: Particionamento e Cache de Sitemaps (Sitemap Sharding)
* **Decisão:** Dividir o sitemap de empresas em múltiplos arquivos de até 1.000 URLs (`/sitemaps/companies/[page]/sitemap.xml`) e servir com cache ISR de 24 horas (`revalidate = 86400`).
* **Trade-off:** O sitemap não refletirá alterações de empresas em tempo real (delay de até 24h), mas eliminará 100% dos erros 503 e garantirá resposta p95 < 500ms para os crawlers.

### DECISÃO 3: Neutralização de Referrals OAuth
* **Decisão:** Adicionar `accounts.google.com` e `accounts.zoho.com` na lista de exclusão de referências do GA4 imediatamente.
* **Impacto:** Restauração imediata da atribuição de tráfego orgânico, direto e pago, sem necessidade de alterações no código-fonte.

### DECISÃO 4: Preparação para AI Visibility e Agentic Storefront (SPEC 026)
* **Decisão:** Publicar `/llms.txt` na raiz e preparar telemetria com dimensão customizada `ai_agent_type` para monitorar tráfego proveniente de assistentes generativos.

