'# Auditoria Técnica e Inventário Read-Only (Fase Zero)
## Avalia Solar — Instagram Autonomous Content Engine

**Data da Auditoria:** 10 de Novembro de 2026  
**Ambiente:** Produção e Repositório `MrGr33n98/Avalia-Solar-2026`  
**Escopo:** n8n, Rails API, Next.js Social Templates, Meta Graph API, PostHog  
**Status:** Auditado e Validado  

---

## 1. TASK-001 — Investigação da Infraestrutura n8n

### 1.1 Estado do Host e Conectividade
* **Instância n8n:** `https://n8n.avaliasolar.com.br`
* **Healthcheck HTTP:** `GET https://n8n.avaliasolar.com.br/healthz`
  * Status: `HTTP/1.1 200 OK`
  * Resposta: `{"status":"ok"}`
  * Servidor reverso: OpenResty / Nginx com terminação TLS e HSTS.
* **API REST Administrativa:**
  * Endpoint: `https://n8n.avaliasolar.com.br/api/v1/`
  * Autenticação exigida: Header `X-N8N-API-KEY`.
  * Verificação em runtime: `curl https://n8n.avaliasolar.com.br/api/v1/workflows` retornou `{"message":"'X-N8N-API-KEY' header required"}`.
* **Webhooks existentes no contrato de ambiente (`.env.example` / `.env`):**
  * `N8N_WEBHOOK_URL=https://n8n.avaliasolar.com.br/webhook/posthog-event`
  * `N8N_WEBHOOK_SECRET`: segredo HMAC para autenticação de payloads de entrada.
* **Configuração MCP (`infra/MCP_CONFIG.json`):**
  * Gateway: `supergateway --streamableHttp https://n8n.avaliasolar.com.br/mcp-server/http`.
  * Credencial local `N8N_API_KEY` vazia no repositório por design de segurança (tokens mantidos no cofre seguro do servidor/n8n).

### 1.2 Diretrizes de Arquitetura n8n
* Os workflows devem ser entregues como **JSONs modulares, válidos, testáveis e importáveis** para a versão n8n v1.x+.
* Fuso horário operacional fixado: `America/Sao_Paulo` (UTC-3).
* IDs de credenciais devem utilizar placeholders canônicos (`meta_instagram_api`, `openai_api`, `rails_api_secret`), sem chaves expostas no repositório.

---

## 2. TASK-002 — Inventário de Automações Existentes

### 2.1 Análise de Workflows e Agentes no Repositório
* **Hermes Agent (`hermes-agent/`):**
  * Focado em outbound B2B e prospecção corporativa (LinkedIn, monitoramento de concorrentes, triagem de caixas de entrada).
  * **Não compete** com o motor editorial de redes sociais.
* **Social Core Interno (`docs/social/` e `app/models/group_post.rb`):**
  * Plataforma interna de comunidade (`GroupPost`, `FeedItem`, `Comment`, `Reaction`).
  * Utiliza padrão Outbox com `Social::ProcessOutboxEventsJob` no Sidekiq.
* **Lacuna Identificada:**
  * Não existia no repositório nenhum motor de publicação e agendamento para canais sociais externos (Instagram / Meta API).
  * O ecossistema carecia de pipeline para transformar artigos publicados do blog em carrosséis e posts de feed formatados.

---

## 3. TASK-003 — Investigação do Sistema Editorial (Rails 7 Backend)

### 3.1 Modelo `Article` (`AB0-1-back/app/models/article.rb`)
* **Estrutura de Dados:**
  * `title`: string obrigatória com validação de comprimento para publicação.
  * `slug`: friendly_id obrigatório e único.
  * `content`: HTML rico com sanitização de títulos H2/H3.
  * `excerpt`: resumo editorial.
  * `status`: enum `draft` ou `published`.
  * `published_at`: datetime com escopo `scope :published, -> { where(status: 'published').where('published_at <= ?', Time.current) }`.
  * `category_id`: associação com `Category` (`belongs_to :category`).
  * `author_id`: associação com `AdminUser` (`belongs_to :author`).
  * `banner`: ActiveStorage attachment validado (JPEG, PNG, GIF, máximo 5MB, dimensões mínimas 200px).
  * `views_count`: contador de visualizações.
  * `seo_title`, `seo_description`, `meta_title`, `meta_description`, `seo_keywords`.

### 3.2 Endpoints REST (`AB0-1-back/app/controllers/api/v1/articles_controller.rb`)
* **Listagem Pública:** `GET /api/v1/articles`
  * Suporta paginação (`page`, `per_page`), filtro por categoria (`category_id` ou `category` slug), busca textual (`q`), e ordenação (`sort`).
  * Cache HTTP em Redis com expiração de 15 minutos e invalidação em `after_commit`.
  * Retorno serializado via `ArticleSerializer` com URLs completas de banners via ActiveStorage proxy (`cover_image_url`).
  * **Teste em Produção:** `GET https://api.avaliasolar.com.br/api/v1/articles?per_page=3` respondeu `200 OK` com dados estruturados reais.
* **Detalhes do Artigo:** `GET /api/v1/articles/:id` (aceita ID ou slug).
* **Artigos em Destaque:** `GET /api/v1/articles/featured?limit=3`.
* **URL Canônica Pública:** `https://www.avaliasolar.com.br/blog/:slug`.

---

## 4. TASK-004 — Investigação dos Templates Sociais e Design System

### 4.1 Componentes Existentes (`AB0-1-front/components/social-templates/`)
* **`InstagramFeedTemplate.tsx`:**
  * Formato nativo: **1080 × 1350 px** (proporção vertical 4:5 otimizada para o feed do Instagram).
  * Renderiza `SocialCardBase` com `formatLabel="Instagram Feed"`.
* **`SocialCardBase.tsx`:**
  * Estética: **AS-EDS Claymorphism / Precision Clay**.
  * Fundo: `#071a3b` com gradiente radial ciano/azul (`rgba(30, 94, 255, 0.45)`).
  * Tipografia: Inter Bold com hierarquia proporcional em porcentagens.
  * Elementos de marca: Selo "Avalia Solar", indicador de categoria, badge de autor e URL canônica `avaliasolar.com.br`.
* **Mídia Kit Oficial (`docs/marketing/MEDIA_KIT_REDES_SOCIAIS.md`):**
  * Define átomos visuais, cores primárias (`#020617`, `#0056D2`, `#10B981`, `#FFC82C`) e padrões de templates (Educacional, Vendas, Manifesto).
* **Capacidade de Renderização:**
  * Next.js possui `@vercel/og` (`next/og` `ImageResponse`) instalado e configurado em `app/opengraph-image.tsx`.
  * Pode ser estendido para um endpoint de renderização server-side `/api/social/render-post` gerando JPEGs/PNGs nativos de 1080×1350 px com performance extrema e sem custos externos.

---

## 5. Matriz de Reutilização e GAPs

| Componente | Existente? | Reutilizável? | Ação Necessária |
|---|---|---|---|
| Instância n8n | Sim (`n8n.avaliasolar.com.br`) | Sim | Criar e importar workflows modulares |
| API de Artigos | Sim (`/api/v1/articles`) | Sim (100%) | Integrar como fonte de conteúdo no WF-IG-01 |
| Templates Visuais | Sim (`InstagramFeedTemplate.tsx`) | Sim (100%) | Expor via route handler de renderização em alta resolução |
| Meta Instagram App | Sim (`Avalia Solar Social`) | Sim | Configurar credencial segura e validar no WF-IG-00 |
| Fila e Agendamento | Não | Novo | Implementar via n8n Schedule + Webhook de Aprovação |
| Idempotência e Bloqueio | Não | Novo | Implementar chave de idempotência determinística |
| Tracking PostHog | Sim (`lib/analytics`) | Sim | Adicionar taxonomia de eventos sociais no n8n |

---

## 6. Riscos e Mitigações

1. **Risco de Publicação Acidental sem Revisão:**
   * *Mitigação:* Kill-switch padrão (`INSTAGRAM_AUTOPUBLISH_ENABLED=false`) e aprovação humana obrigatória em canal seguro (Webhook/E-mail) antes de qualquer chamada a `media_publish`.
2. **Risco de Rate Limiting da Meta API:**
   * *Mitigação:* Polling com backoff exponencial no status do contêiner (`GET /{creation-id}`), limitando a 3 publicações semanais no MVP.
3. **Risco de Exposição de Tokens:**
   * *Mitigação:* Segredos mantidos estritamente nas credenciais seguras do n8n; zero tokens versionados no Git ou trafegados em logs.
