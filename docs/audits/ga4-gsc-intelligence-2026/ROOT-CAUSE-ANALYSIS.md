# Root Cause Analysis — Avalia Solar 2026
**Metodologia:** Systematic Debugging + 5 Whys + Evidence-First  
**Data:** 26 de Novembro de 2026  

---

## 1. Causa Raiz 1: Moeda da Propriedade GA4 em USD em vez de BRL (P0)

* **Sintoma:** Valores monetários no GA4 reportam moeda americana (`USD`), distorcendo valores de receita e CPC.
* **Evidência:** Chamada `get_property_details(property_id: "424024013")` retornou `currency_code: "USD"`.
* **Causa Raiz Técnica:** A propriedade foi criada com o nome genérico `plush-8310b` atrelada à conta `Default Account for Firebase` (`accounts/299534722`), herdando a configuração padrão de moeda dos Estados Unidos sem ajuste no momento do provisionamento.
* **Mitigação:** No Google Analytics Admin, navegar em *Configurações da Propriedade > Detalhes da Propriedade* e alterar a Moeda para `Real brasileiro (R$)` e fuso horário para `(GMT-03:00) Horário de Brasília`.

---

## 2. Causa Raiz 2: Tráfego de Localhost Contaminando Relatórios de Produção (P0)

* **Sintoma:** O GA4 registra sessões, usuários e eventos sob o hostname `localhost` (24 sessões e 72 eventos em 28 dias).
* **Evidência:** `run_report` com dimensão `hostName` retornou `localhost` com 24 sessões.
* **Causa Raiz Técnica:**
  1. A variável `NEXT_PUBLIC_GA_MEASUREMENT_ID` foi compartilhada ou copiada para arquivos `.env.local` em ambientes de desenvolvimento local.
  2. A biblioteca `lib/analytics/gtag.ts` inicializa o GA4 sem verificar se o ambiente é de desenvolvimento (`process.env.NODE_ENV === 'development'`).
  3. No painel do GA4, não há filtro de exclusão de tráfego interno ou filtro por hostname permitido (`www.avaliasolar.com.br`, `app.avaliasolar.com.br`, `crm.avaliasolar.com.br`).
* **Mitigação:**
  * No código: adicionar checagem em `gtag.ts`: não inicializar GA4 se `typeof window !== 'undefined' && window.location.hostname === 'localhost'`.
  * No GA4: Criar filtro de dados para excluir tráfego onde `Hostname` não pertença aos domínios autorizados.

---

## 3. Causa Raiz 3: Poluição de Atribuição por Redirecionamentos OAuth (Google e Zoho) (P0)

* **Sintoma:** `accounts.google.com` é a principal origem de referência do site (219 sessões), e `accounts.zoho.com` soma 24 sessões, destruindo a atribuição da mídia de aquisição inicial.
* **Evidência:** `run_report` com `sessionSource / sessionMedium` revelou `accounts.google.com / referral` com 219 sessões.
* **Causa Raiz Técnica:**
  1. O usuário entra no site via Google Orgânico, redes sociais ou anúncio.
  2. Ao clicar em "Entrar com Google" (OAuth) ou autenticar no CRM Zoho, o navegador navega para `accounts.google.com`.
  3. Ao retornar com o token para `https://www.avaliasolar.com.br/auth/callback`, o `document.referrer` é `https://accounts.google.com/`.
  4. Como esses domínios não constam na lista de "Exclusões de Referência" (List Unwanted Referrals) do fluxo da Web no GA4, o algoritmo do GA4 inicia uma nova sessão e atribui a conversão à referência do Google OAuth.
* **Mitigação:** No Admin do GA4 > Fluxo de Dados > Configurações de tags > Listar referências indesejadas, cadastrar `accounts.google.com`, `accounts.zoho.com` e `avaliasolar.com.br`.

---

## 4. Causa Raiz 4: Apenas um Evento-Chave Configurado e Zero Conversões de Negócio (P0)

* **Sintoma:** O GA4 registra zero conversões de negócio.
* **Evidência:** `list_key_events` retornou unicamente o evento padrão `purchase` (0 ocorrências em 90 dias).
* **Causa Raiz Técnica:**
  * O marketplace não realizou a marcação de eventos-chave de geração de leads no console do GA4.
  * O evento `generate_lead` e `contact` sequer chegam ao GA4 porque o `lib/analytics/index.ts` não os despacha via `gtagEvent()`.
* **Mitigação:**
  * Atualizar o dispatcher do frontend para chamar `gtagEvent` em todos os eventos de conversão autorizados pelo consentimento LGPD.
  * Configurar `generate_lead`, `contact`, `quote_requested` e `whatsapp_click` como eventos-chave no console do GA4.

---

## 5. Causa Raiz 5: Falha 503 no Sitemap de Empresas (`companies/sitemap.xml`) (P0)

* **Sintoma:** `https://www.avaliasolar.com.br/sitemaps/companies/sitemap.xml` responde com HTTP 503 Service Unavailable após ~6,8 segundos.
* **Evidência:** Execução de `scripts/seo/post-deploy-audit.py` registrou HTTP 503 e duração de 6.856ms.
* **Causa Raiz Técnica:**
  * `AB0-1-front/lib/seo/sitemap-builders.ts` define `SITEMAP_FETCH_TIMEOUT_MS = 6_000`.
  * A função `getCompanySitemapEntries()` chama `fetchPaginatedRecords()` de forma sequencial síncrona.
  * A consulta de centenas de registros excede a janela de 6 segundos, abortando a requisição com `SitemapUpstreamError`.
* **Mitigação:**
  * Particionar o sitemap em lotes (`/sitemaps/companies/1/sitemap.xml`, etc.).
  * Criar endpoint Rails otimizado específico para sitemap sem carregar joins pesados.
  * Habilitar ISR (Incremental Static Regeneration) de 24 horas.

---

## 6. Causa Raiz 6: Inacessibilidade da Search Console API no Runner (P1)

* **Sintoma:** As chamadas à API Search Analytics retornam HTTP 404 e 403.
* **Evidência:** Resposta da API: `"'sc-domain:avaliasolar.com.br' is not a verified Search Console site in this account."`
* **Causa Raiz Técnica:** A conta Google vinculada nas Application Default Credentials locais possui permissão no projeto Firebase/GA4, mas não foi adicionada no Google Search Console da propriedade `sc-domain:avaliasolar.com.br`.
* **Mitigação:** O administrador do Search Console deve convidar o e-mail da credencial como usuário com permissão total.

