# Tasklist — Search & Analytics Intelligence
**Plano de Execução e Correção P0 / P1 / P2**  
**Data:** 26 de Novembro de 2026  

---

## 1. Fase P0 — Quick Wins Críticos e Correções Estruturais

| ID | Prioridade | Tarefa | Arquivos / Painel | Critério de Aceite | Status |
|---|:---:|---|---|---|:---:|
| **T-P0-01** | **P0** | Alterar moeda da propriedade GA4 para `BRL` | Console Admin GA4 | `get_property_details` retorna `currency_code: "BRL"`. | **CONCLUÍDO (Validado via API)** |
| **T-P0-02** | **P0** | Cadastrar exclusões de referência OAuth (`accounts.google.com`, `accounts.zoho.com`) | Console Admin GA4 (*Fluxos de Dados*) | Novas sessões de login preservam a origem original no GA4. | **CONCLUÍDO (Configurado no GA4)** |
| **T-P0-03** | **P0** | Cadastrar Key Events no GA4 (`generate_lead`, `contact`, `whatsapp_click`, `quote_requested`, `lead_form_submitted`) | GA4 Admin API via MCP | Eventos de conversão ativos na propriedade `424024013`. | **CONCLUÍDO (MCP API)** |
| **T-P0-04** | **P0** | Registrar as 20 dimensões personalizadas essenciais no GA4 | GA4 Admin API via MCP | `get_custom_dimensions_and_metrics` retorna as 20 dimensões criadas. | **CONCLUÍDO (MCP API)** |
| **T-P0-05** | **P0** | Bloquear disparo de GA4 sob hostname `localhost` no frontend | `AB0-1-front/lib/analytics/gtag.ts` | Teste Jest valida que `gtag` não é chamado quando `location.hostname === 'localhost'`. | **CONCLUÍDO (Testes Verdes)** |
| **T-P0-06** | **P0** | Corrigir timeout do sitemap de empresas (`companies/sitemap.xml`) via paginação assíncrona | `AB0-1-front/lib/seo/sitemap-builders.ts` | Feed paginado consome páginas sem timeout e passa nos testes de resiliência. | **CONCLUÍDO (PR #252)** |
| **T-P0-07** | **P0** | Injetar `GA4_API_SECRET` e `GA4_MEASUREMENT_ID` nos containers backend e worker | `docker-compose.yml`, `.env.example` | Variáveis mapeadas para `backend` e `worker` Sidekiq. | **CONCLUÍDO** |

---

## 2. Fase P1 — Enriquecimento de Dados, AEO/GEO e Atribuição

| ID | Prioridade | Tarefa | Arquivos / Painel | Critério de Aceite | Status |
|---|:---:|---|---|---|:---:|
| **T-P1-01** | **P1** | Conectar dispatcher do frontend ao GA4 (`gtagEvent` dentro de `track()`) | `AB0-1-front/lib/analytics/index.ts` | Cliques de WhatsApp, comparador e leads disparam eventos no GA4. | **CONCLUÍDO** |
| **T-P1-02** | **P1** | Conceder permissão de usuário no Google Search Console para a credencial ADC | Console Google Search Console | Chamada à Search Analytics API retorna HTTP 200 OK. | **CONCLUÍDO (HTTP 200 via API)** |
| **T-P1-03** | **P1** | Publicar `/llms.txt` com inventário semântico para agentes de IA | `AB0-1-front/public/llms.txt` | `https://www.avaliasolar.com.br/llms.txt` responde HTTP 200 OK em formato Markdown limpo. | **CONCLUÍDO** |
| **T-P1-04** | **P1** | Adicionar Schema.org `Product` e `AggregateRating` nas páginas de produtos | `AB0-1-front/app/products/[slug]/page.tsx` | Validador de dados estruturados do Google acusa 0 erros. | **CONCLUÍDO** |
| **T-P1-05** | **P1** | Adicionar Schema.org `FAQPage` na Homepage e páginas de categorias | `AB0-1-front/app/page.tsx` | Schema FAQPage detectado no teste de Rich Results. | **CONCLUÍDO** |
| **T-P1-06** | **P1** | Garantir disparo de `gtag('consent', 'default')` síncrono antes do script do GA4 | `AB0-1-front/app/layout.tsx` | Nenhum cookie analítico é gravado antes do consentimento do usuário. | **CONCLUÍDO** |

---

## 3. Fase P2 — Inteligência Contínua e Integrações Avançadas

| ID | Prioridade | Tarefa | Arquivos / Painel | Critério de Aceite | Status |
|---|:---:|---|---|---|:---:|
| **T-P2-01** | **P2** | Exportação contínua de eventos do GA4 para o BigQuery | Console Google Cloud / GA4 Admin | Dataset `analytics_424024013` criado no BigQuery com streaming diário. | Pendente (Configuração Cloud) |
| **T-P2-02** | **P2** | Unificação de telemetria MCP Agentic Storefront (SPEC 026) com GA4 | `packages/mcp-ui`, `hermes-agent` | Consultas autônomas geram eventos no GA4 com dimensão `ai_agent_type`. | **CONCLUÍDO (PR #252)** |
| **T-P2-03** | **P2** | Automação semanal de detecção de anomalias de indexação (Sitemaps CI) | `.github/workflows/seo-post-deploy-audit.yml` | Pipeline com disparo agendado toda segunda-feira às 06:00 UTC. | **CONCLUÍDO** |
