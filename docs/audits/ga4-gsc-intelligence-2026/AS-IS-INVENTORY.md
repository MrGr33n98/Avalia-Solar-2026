# AS-IS Inventory — Avalia Solar 2026
**Auditoria:** Google Analytics 4, Search Console, SEO, AEO/GEO & Intelligence  
**Data:** 26 de Novembro de 2026  
**Status da Auditoria:** READ-ONLY / EVIDENCE-FIRST  
**Propriedade GA4:** `properties/424024013` (Display Name: `plush-8310b`, Account: `accounts/299534722`)  
**Propriedade GSC:** `sc-domain:avaliasolar.com.br`  

---

## 1. Inventário de MCPs e Conexões de Dados

| MCP Server | Ferramentas Ativas | Status de Conexão | Propósito no Diagnóstico |
|---|---|---|---|
| `google-analytics` | `get_property_details`, `list_key_events`, `get_custom_dimensions_and_metrics`, `run_report`, `run_realtime_report`, `get_account_summaries` | **ATIVO & AUTENTICADO** (ADC via OAuth2) | Leitura em tempo real e histórica de métricas, dimensões, eventos e configurações do GA4. |
| `GitHub` | `get_file_contents`, `list_commits`, `search_code`, etc. | **ATIVO** | Inspeção de histórico, PRs e conformidade de repositório. |
| `Playwright` | `playwright_navigate`, `playwright_screenshot`, `playwright_evaluate` | **ATIVO** | Auditoria sintética de renderização client/server e execução de scripts de analytics. |
| `Context7` | `resolve-library-id`, `query-docs` | **ATIVO** | Consulta a documentações de frameworks e bibliotecas. |
| `openings` | Ferramentas de jobs/processamento | **ATIVO** | Análise de concorrência e processamento de dados. |
| `rea` | Engenharia reversa e análise estática | **ATIVO** | Auditoria profunda de fluxos nativos e binários. |
| `shadcn-ui` / `StitchMCP` | Design systems e UI components | **ATIVO** | Validação de consistência visual e padrões de componentes. |

---

## 2. APIs Habilitadas e Status de Credenciais

> **Nota de Segurança:** Nenhum segredo, chave privada ou token é exposto neste inventário.

| API / Serviço | Credencial Utilizada | Status Observado | Evidência / Diagnóstico |
|---|---|---|---|
| **Google Analytics Data API (v1beta)** | Application Default Credentials (`~/.config/gcloud/application_default_credentials.json`) | **200 OK** | Consultas bem-sucedidas em períodos de 7d, 28d e 90d via MCP. |
| **Google Analytics Admin API (v1beta/v1alpha)** | Application Default Credentials | **200 OK** | Inspeção detalhada de metadados da propriedade, eventos-chave e dimensões. |
| **Google Search Console API (webmasters v3)** | Application Default Credentials | **404/403 Desconectado** | Usuário autenticado na ADC não possui a propriedade `sc-domain:avaliasolar.com.br` vinculada como Verified Owner ou Full User. |
| **GA4 Measurement Protocol (Backend Rails)** | `ENV['GA4_MEASUREMENT_ID']`, `ENV['GA4_API_SECRET']` | **Inativo / Bloqueado** | `Ga4Service` aborta o envio silenciosamente caso `GA4_API_SECRET` não esteja configurado no backend. |
| **PostHog Analytics** | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | **Ativo no Frontend** | Provider ativo em `components/PostHogProvider.tsx` com captura de sessões e eventos customizados. |

---

## 3. Propriedades e Configurações GA4 (`properties/424024013`)

| Parâmetro | Valor Configurado no GA4 | Valor Esperado / Correção Necessária | Severidade |
|---|---|---|---|
| **Property ID** | `424024013` | `424024013` | Info |
| **Conta Pai** | `accounts/299534722` ("Default Account for Firebase") | Conta corporativa oficial Avalia Solar | P1 |
| **Nome de Exibição** | `plush-8310b` (Default Firebase auto-gerado) | `Avalia Solar - Produção` | P1 |
| **Moeda da Propriedade** | **`USD`** | **`BRL` (R$)** | **P0** (Valores monetários e transações reportados em dólar) |
| **Fuso Horário** | `Etc/GMT+3` (Horário de Brasília) | `America/Sao_Paulo` (`GMT-3`) | OK |
| **Nível de Serviço** | `GOOGLE_ANALYTICS_STANDARD` | Standard | OK |
| **Google Ads Links** | `[]` (Nenhum vinculado) | Vincular caso haja campanhas de mídia paga | P2 |
| **Anotações de Relatório** | 1 anotação de sistema ("Source Platform dimension update", 2026-06-09) | Registrar marcos de deploy e campanhas | P2 |

---

## 4. Eventos e Dimensões Customizadas no GA4

### 4.1 Eventos-Chave (Key Events / Conversões)
* **Eventos-chave configurados:** Apenas **1** evento (`purchase`, criado em 2026-01-24, counting_method: `ONCE_PER_EVENT`).
* **Volume registrado de `purchase` (últimos 90 dias):** **0 (ZERO)**.
* **Gaps Críticos:**
  * Nenhuma conversão de Lead (`generate_lead`, `lead_submitted`, `quote_requested`) está marcada como evento-chave.
  * Nenhum clique de WhatsApp (`whatsapp_click`, `contact`) está configurado como evento-chave.
  * Nenhuma solicitação de proposta no comparador está registrada como evento-chave.

### 4.2 Dimensões e Métricas Customizadas
* **Custom Dimensions:** `[]` (ZERO dimensões customizadas registradas na propriedade).
* **Custom Metrics:** `[]` (ZERO métricas customizadas registradas).
* **Impacto:** Embora o código frontend envie parâmetros customizados (`company_id`, `company_name`, `cta_type`, `placement`, `search_term`), o GA4 **descarta** esses parâmetros nos relatórios padrão e explorações por falta de registro de dimensões personalizadas de escopo de evento.

---

## 5. Domínios e Hostnames Observados no Tráfego Real

Relatório consolidado de `hostName` (últimos 28 dias):

| Hostname Observado | Sessões | Usuários Ativos | Total de Eventos | Status / Avaliação |
|---|---:|---:|---:|---|
| `www.avaliasolar.com.br` | 429 | 50 | 7.794 | Domínio canônico principal (Público/Marketplace). |
| `app.avaliasolar.com.br` | 90 | 14 | 2.783 | Subdomínio B2B (Painel de Empresas / Hotwire). |
| `crm.avaliasolar.com.br` | 61 | 7 | 1.299 | Subdomínio CRM comercial. |
| **`localhost`** | **24** | **24** | **72** | **CONTAMINAÇÃO CRÍTICA P0:** Ambientes de desenvolvimento/teste locais enviando eventos para a propriedade de produção. |

---

## 6. Configuração de Consentimento e LGPD

* **Implementação Frontend:** `AB0-1-front/lib/analytics/consent.ts` e `components/CookieConsent.tsx`.
* **Mapeamento de Consent Mode V2:**
  * `ad_storage`: controlado por `consent.marketing`.
  * `analytics_storage`: controlado por `consent.analytics`.
  * `ad_user_data`: controlado por `consent.marketing`.
  * `ad_personalization`: controlado por `consent.marketing`.
* **Gap de Implementação Identificado:** O comando `gtag('consent', 'default', { ... denied ... })` não é executado de forma síncrona no `<head>` antes do carregamento do `gtag.js`. Isso permite que hits automáticos de Enhanced Measurement sejam disparados antes de o usuário conceder consentimento explícito.
* **Audit Trail Backend:** Endpoint `/api/v1/consent/log` implementado via `setConsentWithAudit`.

---

## 7. Sitemaps e Rotas Públicas (Auditoria ao Vivo)

Execução pública pós-deploy via `scripts/seo/post-deploy-audit.py`:

| Seção do Sitemap | HTTP Status | Válido XML | URLs Mapeadas | Observação |
|---|---:|:---:|---:|---|
| `sitemaps/static/sitemap.xml` | 200 | Sim | 18 | Páginas estáticas institucionais. |
| `sitemaps/blog/sitemap.xml` | 200 | Sim | 4 | Artigos de blog publicados. |
| `sitemaps/categories/sitemap.xml` | 200 | Sim | 55 | Categorias de produtos/serviços. |
| `sitemaps/company-categories/sitemap.xml` | 200 | Sim | 33 | Matriz empresa x categoria. |
| `sitemaps/local-rankings/sitemap.xml` | 200 | Sim | 43 | Rankings por praça geográfica. |
| **`sitemaps/companies/sitemap.xml`** | **503** | **Não** | **0** | **FALHA CRÍTICA P0:** Timeout (>6s) por paginação sequencial de centenas de empresas ativas. O Googlebot não consegue ler o sitemap das Brand Pages! |
| `sitemaps/services/sitemap.xml` | 200 | Sim | 1 | Cobertura insuficiente (apenas 1 URL indexada). |
| `sitemaps/local-solar/sitemap.xml` | 200 | Sim | 45 | Páginas de cidades e capitais. |
| `sitemaps/creators/sitemap.xml` | 200 | Sim | 0 | Gated por feature flag `CREATOR_EXPERIENCE_ENABLED=false`. |
| `sitemaps/groups/sitemap.xml` | 200 | Sim | 1 | Hub de grupos. |
| **Total de URLs indexadas nos sitemaps** | — | — | **200** | Volume subdimensionado frente ao potencial do catálogo. |

---

## 8. Robots.txt, Canonicals e Infraestrutura SEO

* **Robots.txt (`https://www.avaliasolar.com.br/robots.txt`):**
  * HTTP Status: 200 OK.
  * Referência ao índice: `Sitemap: https://www.avaliasolar.com.br/sitemap-index.xml` (Presente).
  * Regras: Bloqueia rotas autenticadas e operacionais (`/admin`, `/api/`, `/dashboard`, `/search`, `/compare`, `/select-company`).
* **Redirecionamento Apex:** `https://avaliasolar.com.br` redireciona via HTTP 308 permanente com preservação de query params para `https://www.avaliasolar.com.br` (PASS).
* **Canonical da Homepage:** `https://www.avaliasolar.com.br` (Correto, auto-referencial).
* **Tratamento de 404:** Páginas de empresas inexistentes retornam HTTP 404 e tag `noindex` (PASS).

