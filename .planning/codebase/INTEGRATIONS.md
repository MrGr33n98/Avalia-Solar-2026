# Integrações e Serviços Externos - Avalia Solar

Este documento mapeia todas as conexões externas, provedores de serviços, gateways de pagamento, analíticos, autenticação social e as configurações de webhooks do ecossistema **Avalia Solar**.

---

## 💳 Gateways de Pagamento (Trust as a Service / Banners)

O Avalia Solar oferece recursos B2B cobrados, como assinaturas de banners publicitários de empresas em categorias específicas e planos de TaaS (Trust as a Service). O sistema suporta dois principais gateways de pagamento:

### 1. Stripe
*   **Finalidade:** Faturamento de assinaturas recorrentes B2B, planos de anúncios e portal do cliente para gestão financeira.
*   **Arquivos Chave:**
    *   **Backend:** [Gemfile:L180](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/Gemfile#L180) (`stripe` gem), `Api::V1::Billing::CheckoutController`, `Api::V1::Billing::WebhooksController`.
    *   **Endpoints de Webhook:** [config/routes.rb:L348](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/routes.rb#L348) (`post 'webhooks/stripe', to: 'webhooks#stripe'`).
*   **Fluxo:** O frontend solicita uma sessão de checkout via `/api/v1/billing/checkout`. O backend Rails gera a sessão do Stripe Checkout e retorna a URL. O webhook do Stripe avisa o backend sobre a confirmação da assinatura (`invoice.payment_succeeded`, `customer.subscription.deleted`), que atualiza o status de acesso no banco de dados.

### 2. Mercado Pago
*   **Finalidade:** Integração alternativa para pagamentos na América Latina.
*   **Arquivos Chave:**
    *   **Backend:** [Gemfile:L181](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/Gemfile#L181) (`mercadopago-sdk` gem).

---

## 🔐 Autenticação Social e Identidade (SSO)

O ecossistema utiliza autenticação federada para simplificar o login de integradores e parceiros B2B.

### Provedores OAuth2 (Backend Rails)
*   **Gems Utilizadas:** `omniauth-google-oauth2`, `omniauth-linkedin-oauth2`, `omniauth-facebook` e `omniauth-rails_csrf_protection` (para proteção contra CSRF em fluxos de login federado).
*   **Fluxo de Login:** O usuário faz login via Google/LinkedIn/Facebook, a requisição passa pelo OmniAuth Callbacks Controller, que cria ou associa o usuário no banco de dados e emite um JWT (`jwt` gem) para o frontend ou inicia a sessão na aplicação do subdomínio `app.`.

### Better Auth (Frontend)
*   **Finalidade:** Biblioteca moderna de autenticação para o Next.js, configurada em [package.json:L55](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/package.json#L55) para integração transparente com o fluxo de identidade.

---

## 📈 Analytics e Eventos de Crescimento

A plataforma monitora funis de conversão, engajamento e métricas de servidores.

### 1. PostHog
*   **Finalidade:** Analytics de produto, gravação de sessões de usuário, testes A/B e flags de recursos para o ecossistema.
*   **Integração Frontend:** `posthog-js` v1.359.1 e `posthog-node` para rastreamento server-side.
*   **Integração Backend:** `posthog-rails` gem.
*   **Webhook Dedicado:** Webhook de entrada configurado em `Api::V1::PosthogWebhooksController` para ingestão e processamento de eventos do PostHog de forma integrada.

### 2. Mixpanel
*   **Finalidade:** Rastreamento avançado de comportamento e funis de marketing.
*   **Backend:** `mixpanel-ruby` gem.

### 3. Prometheus & Yabeda
*   **Finalidade:** Coleta de métricas operacionais e de performance das aplicações.
*   **Backend:** `yabeda-prometheus`, `yabeda-puma-plugin`, `yabeda-rails` e `yabeda-sidekiq`.
*   **Endpoint de Coleta:** `/metrics` mapeado na raiz de rotas do backend Rails para raspagem pelo servidor Prometheus.

---

## 🚨 Rastreamento de Erros e Observabilidade (APM)

### 1. Sentry
*   **Finalidade:** Captura em tempo real de exceções e monitoramento de performance na web e nos jobs em segundo plano.
*   **Frontend Next.js:** `@sentry/nextjs` configurado nos arquivos [sentry.client.config.ts](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/sentry.client.config.ts), [sentry.server.config.ts](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/sentry.server.config.ts) e [sentry.edge.config.ts](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/sentry.edge.config.ts).
*   **Backend Rails:** `sentry-rails`, `sentry-ruby` e `sentry-sidekiq` para capturar falhas automáticas de jobs na fila do Redis.

### 2. Scout APM
*   **Finalidade:** Application Performance Monitoring (APM) detalhado para gargalos em banco de dados ActiveRecord, chamadas HTTP e alocação de memória no Ruby.
*   **Backend:** `scout_apm` gem configurado em [config/scout_apm.yml](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/scout_apm.yml).

---

## ☁️ Armazenamento de Arquivos e Assets Estáticos

### AWS S3 / DigitalOcean Spaces
*   **Finalidade:** Hospedagem de fotos de perfil de usuários, logotipos de empresas parceiras, banners publicitários de alta resolução e arquivos compartilhados.
*   **Tecnologia:** Active Storage utilizando a gem `aws-sdk-s3` com chaves configuradas em variáveis de ambiente carregadas pelo Rails em `config/storage.yml`.
