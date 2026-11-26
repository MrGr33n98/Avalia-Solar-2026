# GA4 Deep Audit — Avalia Solar 2026
**Propriedade:** `properties/424024013` (Display Name: `plush-8310b`)  
**Data da Auditoria:** 26 de Novembro de 2026  
**Períodos Analisados:** 7 dias, 28 dias e 90 dias (Data API v1beta)  
**Metodologia:** Extração direta via MCP `google-analytics` sem amostragem (0% sampling)  

---

## 1. Visão Geral Comparativa de Desempenho (7d, 28d e 90d)

| Métrica | Últimos 7 Dias | Últimos 28 Dias | Últimos 90 Dias |
|---|---:|---:|---:|
| **Usuários Ativos (Active Users)** | 44 | 76 | 141 |
| **Novos Usuários (New Users)** | 35 | 67 | 128 |
| **Sessões (Sessions)** | 129 | 504 | 1.404 |
| **Visualizações de Página (Screen Page Views)** | 1.633 | 8.270 | 28.985 |
| **Total de Eventos (Event Count)** | 2.502 | 12.938 | 44.520 |
| **Taxa de Engajamento Média** | 71,3% | 74,8% | 76,4% |
| **Duração Média da Sessão** | 382s (~6,3 min) | 425s (~7,1 min) | 450s (~7,5 min) |
| **Eventos-Chave Registrados (Key Events)** | **0** | **0** | **0** |

> **Diagnóstico:** O engajamento por sessão é elevado (~7 minutos e ~20 visualizações de página por sessão engajada), indicando tráfego com perfil qualificado ou de equipe/operações navegando intensamente nos dashboards e catálogo. Contudo, a conversão é reportada como **ZERO** devido à ausência de configuração de eventos-chave de negócio.

---

## 2. Aquisição de Tráfego: Origem, Mídia e Canais

### 2.1 Distribuição por Agrupamento Padrão de Canais (Default Channel Group) — 90 Dias

| Canal Principal | Usuários Ativos | Sessões | Page Views | Eventos | Taxa de Engajamento |
|---|---:|---:|---:|---:|---:|
| **Referral** | 14 | **639** | 10.431 | 15.065 | 81,8% |
| **Direct** | 76 | **310** | 3.118 | 4.996 | 76,1% |
| **Organic Search** | 48 | **164** | 1.613 | 2.424 | 73,8% |
| **Organic Social** | 15 | **70** | 344 | 506 | 55,7% |
| **Unassigned** | 17 | **42** | 717 | 1.125 | 38,1% |

### 2.2 Análise Forense de Origens e Mídias (Session Source / Medium) — 28 Dias

A auditoria profunda da dimensão `sessionSource / sessionMedium` revelou uma grave distorção na atribuição:

| Origem / Mídia | Sessões | Usuários Ativos | Taxa de Engajamento | Classificação / Diagnóstico |
|---|---:|---:|---:|---|
| `accounts.google.com / referral` | **219** | 6 | 78,5% | **FALHA DE ATRIBUIÇÃO P0:** Loop de autenticação OAuth do Google. |
| `google / organic` | **73** | 20 | 75,3% | Busca orgânica real Google. |
| `(direct) / (none)` | **55** | 36 | 49,1% | Tráfego direto e links sem UTMs. |
| `avaliasolar_ads / banner` | **55** | 4 | 78,2% | Banners internos e campanhas próprias. |
| `ig / social` | **25** | 2 | 52,0% | Tráfego orgânico do Instagram. |
| `accounts.zoho.com / referral` | **24** | 1 | 83,3% | **FALHA DE ATRIBUIÇÃO P0:** Redirecionamento de login do Zoho CRM. |
| `(not set) / (not set)` | **17** | 9 | 47,1% | Sessões órfãs sem parâmetros de campanha. |
| `search.google.com / referral` | **14** | 1 | 78,6% | Acessos do painel do Google Search Console. |
| `chatgpt.com / internal` | **7** | 1 | 100,0% | **TRÁFEGO IA (AEO):** Navegador/agente interno da OpenAI. |
| `m.facebook.com / referral` | **6** | 6 | 83,3% | Facebook Mobile orgânico. |
| `chatgpt.com / ai-assistant` | **5** | 4 | 60,0% | **TRÁFEGO IA (AEO):** Usuários indicados por respostas do ChatGPT. |
| `l.instagram.com / referral` | **2** | 1 | 100,0% | Link in bio / Direct Instagram. |
| `br.search.yahoo.com / referral`| **1** | 1 | 100,0% | Busca orgânica Yahoo. |
| `perplexity / (not set)` | **1** | 1 | 100,0% | **TRÁFEGO IA (GEO):** Usuário vindo do Perplexity AI. |

---

## 3. Identificação e Quantificação dos Gaps Históricos

### GAP 1: Moeda da Propriedade em USD (P0)
* **Status:** **CONFIRMADO COM EVIDÊNCIA REAL.**
* **Evidência:** `get_property_details` retornou `currency_code: "USD"`.
* **Causa Raiz:** A propriedade foi criada com o template padrão do Firebase sem customização regional.
* **Impacto:** Todas as métricas de valor monetário, valor de lead e relatórios de e-commerce mostram `$` em vez de `R$`.

### GAP 2: Apenas um Evento-Chave Configurado (`purchase`) (P0)
* **Status:** **CONFIRMADO COM EVIDÊNCIA REAL.**
* **Evidência:** `list_key_events` retornou unicamente o evento `purchase` (0 ocorrências em 90 dias).
* **Causa Raiz:** Ausência de configuração dos eventos de conversão de marketplace no painel Admin do GA4.
* **Impacto:** A taxa de conversão oficial da propriedade é 0,00%, cegando algoritmos de Smart Bidding e dashboards de ROI.

### GAP 3: Tráfego de Localhost Contaminando Relatórios (P0)
* **Status:** **CONFIRMADO COM EVIDÊNCIA REAL.**
* **Evidência:** `run_report` com dimensão `hostName` retornou **24 sessões e 72 eventos** com hostname literal `localhost`.
* **Causa Raiz:** A variável `NEXT_PUBLIC_GA_MEASUREMENT_ID` é carregada em ambientes locais sem um filtro de tráfego interno no GA4 ou condicional de `process.env.NODE_ENV !== 'production'`.
* **Impacto:** Poluição de dados de comportamento, distorção de bounce rate e taxa de engajamento inflada por desenvolvedores.

### GAP 4: Referências de Autenticação Poluindo Atribuição (P0)
* **Status:** **CONFIRMADO COM EVIDÊNCIA REAL.**
* **Evidência:** `accounts.google.com / referral` respondeu por **219 sessões** (43,4% das sessões dos últimos 28 dias!) e `accounts.zoho.com` por **24 sessões**.
* **Causa Raiz:** Falta de inclusão dos domínios `accounts.google.com` e `accounts.zoho.com` na lista de **Exclusões de Referência Inesperada (List Unwanted Referrals)** nas configurações de fluxo de dados do GA4.
* **Impacto:** Sempre que um usuário acessa o sistema via busca orgânica ou campanha e clica em "Entrar com Google", o GA4 encerra a sessão anterior e cria uma nova sessão atribuída ao Google OAuth, roubando 100% da atribuição de receita do canal original.

### GAP 5: Zero Eventos de Negócio no GA4 (WhatsApp, Comparador, Orçamentos, Buyer Intent) (P0)
* **Status:** **CONFIRMADO COM EVIDÊNCIA REAL.**
* **Evidência:** A lista de eventos dos últimos 28 dias possui **apenas 11 eventos**, todos nativos do Enhanced Measurement (`page_view`, `user_engagement`, `scroll`, `session_start`, `form_submit`, `form_start`, `first_visit`, `click`, `view_search_results`, `search`, `select_promotion`).
* **Causa Raiz:**
  1. O frontend despacha eventos para o `dataLayer` e para o PostHog, mas não dispara `gtag('event', ...)` para os eventos de conversão de negócio.
  2. O backend possui o `Ga4Service` implementado, mas `ga4_measurement_enabled?` retorna falso porque `GA4_API_SECRET` não está configurado no ambiente de produção.
* **Impacto:** Cliques no botão de WhatsApp, propostas solicitadas e comparativos não alimentam o GA4.

---

## 4. Auditoria de Landing Pages (Portas de Entrada)

Relatório de `landingPagePlusQueryString` (últimos 90 dias):

| Landing Page | Sessões | Usuários Ativos | Taxa de Rejeição (Bounce Rate) |
|---|---:|---:|---:|
| `/` (Homepage) | 482 | 84 | 23,0% |
| `(not set)` | 74 | 17 | 94,6% |
| `/login?return_to=%2F` | 50 | 12 | 18,0% |
| `/companies` (Diretório) | 36 | 10 | 19,4% |
| `/login` | 34 | 11 | 2,9% |
| `/companies/weg` (Brand Page WEG) | 31 | 6 | 25,8% |
| `/dashboard/sales/leads` | 25 | 6 | 4,0% |
| `/auth/callback?status=success` | 18 | 7 | 5,5% |
| `/companies/goodwe-brasil` | 16 | 6 | 18,8% |
| `/founder` | 14 | 4 | 7,1% |
| `/categories/baterias-armazenamento` | 13 | 4 | 23,1% |
| `/search` | 12 | 4 | 41,7% |
| `/companies/sungrow-brasil` | 11 | 4 | 36,4% |
| `/review-dashboard/proposals` | 10 | 4 | 10,0% |
| `/companies/canadian-solar-brasil` | 9 | 5 | 11,1% |
| `/compare` | 8 | 1 | 25,0% |

> **Achado Relevante:** As Brand Pages de fabricantes líderes (`weg`, `goodwe-brasil`, `sungrow-brasil`, `canadian-solar-brasil`) estão entre as principais portas de entrada orgânica do site, reforçando que a falha 503 no sitemap de empresas está prejudicando diretamente o principal motor de SEO da plataforma.

---

## 5. Distribuição Tecnológica e Dispositivos

* **Desktop:** 88 usuários ativos (57,5%), 812 sessões, taxa de engajamento de **81,4%**.
* **Mobile:** 65 usuários ativos (42,5%), 592 sessões, taxa de engajamento de **72,5%**.
* **Conclusão:** Embora o projeto adote filosofia PWA-first e mobile-first, 57% dos usuários qualificados acessam via desktop, correspondendo a integradores solares e clientes corporativos avaliando propostas e equipamentos.

