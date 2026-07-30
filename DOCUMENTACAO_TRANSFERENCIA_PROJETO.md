# Dossiê de transferência — Avalia Solar 2026

> Documento de continuidade para operar o projeto em outro computador. Não contém
> senhas, tokens, chaves privadas ou dados pessoais. Transfira esses itens por um
> cofre de segredos; nunca por Git, e-mail, print ou este arquivo.

| Campo | Estado observado |
| --- | --- |
| Repositório | Avalia-Solar-2026 / monorepo local AB0-1-main |
| Branch de referência | main |
| Commit de referência | 59aab97cd291fcd0749f8fe6f39a3daff6f8656b |
| Data do commit | 30/07/2026 06:51:54 -03:00 |
| Último assunto | Substituição do mapa fictício no popover de localização por iframe interativo do Google Maps |
| Data deste levantamento | 30/07/2026 |
| Escopo | Portal web, API, banco, filas, app mobile, deploy, automações e documentação |
| Validação | Inspeção estática do checkout. Containers e testes não foram iniciados nesta máquina. |

## 1. Leitura correta do estado

Este é o mapa operacional do projeto. Quando houver conflito, siga esta ordem:

1. Código e configurações no commit de referência;
2. Migrations e AB0-1-back/db/schema.rb para estrutura de dados;
3. Workflows em .github/workflows para CI/CD;
4. Este dossiê;
5. Relatórios históricos em docs.

O repositório tem centenas de documentos de auditoria, planejamento, PRD e
relatórios. Parte deles descreve proposta ou uma fotografia antiga. São contexto
valioso, mas não devem ser executados como instrução sem comparar com o código.

## 2. Produto e regras de negócio

Avalia Solar é um marketplace brasileiro de energia solar e mobilidade elétrica.
Ele reúne descoberta e comparação de empresas, perfis públicos, avaliações,
solicitação/distribuição de leads e orçamentos, catálogo de produtos,
financiamento, conteúdo/SEO, chat, dashboards de empresas e monetização por
planos e banners.

| Público | Capacidades |
| --- | --- |
| Consumidor/B2C | Busca por solução/local, comparação, orçamento, chat, avaliações, favoritos e notificações. |
| Empresa/integrador/B2B | Reivindicação de perfil, catálogo/conteúdo, resposta a avaliações, leads, dashboard, plano e banners. |
| Admin/moderação | ActiveAdmin, reviews, categorias, planos, badges, billing e mudanças pendentes. |
| Growth/RevOps | Analytics, atribuição UTM, PostHog/GA4, CRM, Slack e automações Hermes. |

Regra comercial crítica: CTAs de orçamento ou contato dependem de habilitação de
recurso pago da empresa. O método Company#quote_feature_enabled? é a regra
central, e o modelo Lead valida a condição na criação. Alterações em perfil,
card, CTA ou endpoint de lead não podem contornar esse gate.

## 3. Mapa do repositório

~~~
AB0-1-main/
├── AB0-1-back/             API Rails, PostgreSQL, Redis, Sidekiq e ActiveAdmin
├── AB0-1-front/            Portal web Next.js (App Router)
├── AB0-1-mobile/           Aplicativo Expo/React Native
├── hermes-agent/           Automação de growth, outbound e RevOps
├── docs/                   253+ documentos de produto, arquitetura, auditoria e operação
├── infra/                  Vhosts Nginx e configuração MCP
├── scripts/                Setup, desenvolvimento, deploy, teste e diagnóstico
├── marketing/              Páginas HTML e ativos de marketing
├── .github/workflows/      CI/CD web, backend e mobile
├── docker-compose.yml      Topologia semelhante à produção
├── docker-compose.test.yml Ambiente E2E
├── Dockerfile.backend      Imagem Rails de produção
├── Dockerfile.frontend     Imagem Next.js de produção
└── DOCUMENTACAO_TRANSFERENCIA_PROJETO.md  Este documento
~~~

Arquivos em archive, backups e scripts antigos devem ser preservados até uma
decisão explícita de limpeza. Não são fonte de verdade para desenvolvimento novo.

Dimensão observada: 669 arquivos Ruby no app do backend, 242 arquivos de spec
backend, mais de 4 mil arquivos TS/TSX no checkout e mais de 253 Markdown em docs.

## 4. Arquitetura

~~~mermaid
flowchart LR
  browser["Usuário web\nNext.js :3000"]
  mobile["Aplicativo mobile\nExpo / React Native"]
  nginx["Nginx / domínios públicos"]
  api["Rails API :3001\nREST, GraphQL, ActionCable"]
  db[("PostgreSQL")]
  redis[("Redis")]
  sidekiq["Sidekiq + Scheduler"]
  storage["DigitalOcean Spaces\nActive Storage"]
  ext["Stripe · OAuth · GA4 · PostHog\nSentry · Slack · Brevo · OpenRouter"]
  hermes["Hermes Agent\nGrowth / RevOps"]

  browser --> nginx --> api
  browser --> nginx
  mobile --> api
  api --> db
  api --> redis
  sidekiq --> redis
  sidekiq --> db
  api --> storage
  api --> ext
  sidekiq --> ext
  hermes --> ext
  hermes --> api
~~~

O browser usa, por padrão, proxy same-origin /api/v1. Em SSR ou containers, o
frontend usa API_URL_INTERNAL ou API_PROXY_TARGET. O app mobile fala diretamente
com a API e usa bearer token em expo-secure-store.

## 5. Backend — AB0-1-back

### 5.1 Stack e execução

| Item | Implementação |
| --- | --- |
| Linguagem/runtime | Ruby 3.2.2, definido em .ruby-version |
| Framework | Rails 7.0.x; a versão instalada fica travada em Gemfile.lock |
| Persistência | PostgreSQL 14 no compose raiz; PostgreSQL 15 Alpine no compose dev do backend |
| Cache/fila | Redis 7, Sidekiq e Sidekiq Scheduler |
| Realtime | ActionCable em /cable, com Redis |
| Arquivos | Active Storage local ou DigitalOcean Spaces/S3 compatível |
| Administração | ActiveAdmin, Devise e 2FA de AdminUser |
| API | REST /api/v1, GraphQL /graphql, métricas /metrics |
| API docs | Rswag em /api-docs quando as engines estiverem disponíveis |

A API escuta na porta 3001. Health checks configurados:

~~~
GET /health
GET /health/readiness
GET /health/liveness
GET /health/details
~~~

O entrypoint de produção espera PostgreSQL e remove tmp/pids/server.pid. Ele não
roda migrations: elas devem ser aplicadas uma única vez pelo processo de release,
antes da troca de containers.

### 5.2 Organização de código

| Caminho | Responsabilidade |
| --- | --- |
| app/controllers/api/v1 | API versionada e namespaces de admin, billing, chat, dashboard, company e inbox. |
| app/models | Entidades ActiveRecord, validações, callbacks e associações. |
| app/services | Regras de negócio, integrações e cálculos; prefira para lógica complexa. |
| app/jobs e app/workers | Processamento assíncrono ActiveJob/Sidekiq. |
| app/channels | ActionCable: chat, inbox, conversas e dashboard. |
| app/policies | Autorização, sobretudo recursos empresariais e billing. |
| config/routes.rb | Fonte de verdade das rotas. |
| db/migrate | Evolução incremental do banco. |
| db/seeds.rb e db/seed_data | Dados iniciais e importações. |

### 5.3 Domínios de dados

| Domínio | Modelos/tabelas | Nota |
| --- | --- | --- |
| Identidade/acesso | User, AdminUser, CompanyMember, CompanyAccessRequest, PushToken | Devise, JWT, OAuth e empresa ativa/múltiplas memberships. |
| Empresas | Company, services/areas, badges, buttons, vídeos, documents | Perfil, cobertura, mídia, selo, CTA e moderação. |
| Taxonomia | Category, RatingCriterion, joins companies/products/banners | Categoria é hierárquica: main/sub. |
| Catálogo | Product, Brand, CompanyProduct, offers, specs, price history | Catálogo híbrido e relações empresa-produto. |
| Reputação | Review, aggregates, criteria, forms, votes e audit logs | Moderado, com anonimização/consentimento e NPS. |
| Leads | Lead, distributions, lead wizard versions/campos | Wizard, OTP, consentimento, UTM e distribuição. |
| Chat | ChatSession, ChatMessage, ChatLead, Conversation, DirectMessage | Chat IA/MobiVolt e P2P são domínios distintos. |
| Conteúdo | Article, Content, lead forms, projects/materials, assets | Conteúdo/SEO e captura de intenção. |
| Monetização | Plan, feature groups, subscriptions Stripe, banners | Plano, feature gating, billing e auditoria. |
| Analytics | AnalyticsEvent, AnonymousSession, intent/trust/ranking snapshots | Eventos, identidade anônima e dados derivados. |
| Financiamento | Institutions, options, profiles, partners, offers | Comparação e propostas financeiras. |
| Comunicação | Notifications, preferences, consent logs, webhooks | Notificações, consentimento e integrações. |

O PostgreSQL usa extensões btree_gin, pg_trgm, pgcrypto, unaccent e plpgsql. A
role usada para restaurar ambiente precisa poder habilitá-las.

### 5.4 API e controllers

Base pública: https://api.avaliasolar.com.br/api/v1.
Base local: http://localhost:3001/api/v1.

| Grupo | Recursos |
| --- | --- |
| Infraestrutura | Health, GraphQL, Prometheus, Cable e Rswag. |
| Autenticação | Login, signup/register, refresh/logout, usuário atual, senha/confirmação e OAuth. |
| Empresas públicas | Companies, slug, featured, estados/cidades, categorias, catálogo, badges, social proof, views, projetos, materiais, ratings, financiamento e analytics. |
| Descoberta | Categories (árvore/destaque/slug), search, sugestões, páginas solares locais e sitemap. |
| Conteúdo | Artigos, produtos, FAQs, feed e páginas SEO. |
| Reviews/confiança | Reviews, votos, campaign reviews, forms públicos, trust widgets e dashboard. |
| Leads/intenção | Leads, wizard, OTP, downloads gateados, analytics, identity stitch, consentimento e scores. |
| Empresa autenticada | Access/members, mudanças pendentes, dashboard, mídia, CTAs, banners, forms, projetos, materiais e financing. |
| Chat/inbox | Sessões/mensagens/leads/recomendações IA, inbox, conversas e mensagens diretas. |
| Dashboard | Stats, charts, activity/export, ICP, leads, catálogo privado, notificações e intent. |
| Billing | Planos, subscription, checkout, portal, enterprise leads e webhook Stripe. |
| Administração | ActiveAdmin e endpoints de review/categoria. |
| Integrações | PostHog webhook, MCP tools, company webhooks e banner events. |

As rotas completas, verbos, parâmetros e proteção estão em config/routes.rb;
não mantenha contratos manuais duplicados.

Existe aplicação HTML/Hotwire para app.avaliasolar.com.br: expo pública, painel
/painel, control center e admin. O vhost correspondente aponta esse subdomínio
para Rails na porta 3001.

### 5.5 Serviços, filas e segurança

| Área | Referências |
| --- | --- |
| Busca/geo | Search, Geo e Locations namespaces |
| Feature gating | CompanyFeatureAccessResolver, FeatureGateService, PlanFeatureCatalog |
| Leads | LeadWizard, LeadDistributionService, Leads::PriorityDistributor |
| Chat IA | Chat::OrchestratorService, LLMGateway, agentes, retrieval e Chat::MobiVolt |
| Recomendações | Recommendation::Engine, contexto, elegibilidade, scorer, CTA e placement |
| Reputação | Reviews, TrustScore e CompanyDashboard namespaces |
| Analytics | Analytics, IntentScoringService, exportadores e revalidação pública |
| Billing | Billing, Payment e handlers Stripe/Mercado Pago |
| Integrações | Slack, GA4, e-mail, financiamento e webhooks |

Sidekiq usa filas critical, mailers, default, analytics e low. A agenda em
config/sidekiq_schedule.yml inclui cache cleanup, atualização de ratings, limpeza
de sessão, retenção de rastros de review, digest mensal e pipeline de analytics:
agregação a cada 15 minutos; feature store, trust, ranking/anomalia diariamente;
retenção e reconciliação diária.

Segurança implementada: Rack::Attack, CORS/host authorization por ambiente, 2FA
admin, anonimização de reviews, assinatura Stripe/HMAC quando aplicável, Active
Storage e logs/APM. Não exponha Sidekiq Web em produção sem autenticação.

## 6. Frontend — AB0-1-front

### 6.1 Stack

| Item | Implementação |
| --- | --- |
| Runtime | Node 20 no Docker/CI |
| Framework | Next.js 14, React 18, App Router e TypeScript |
| Dados/estado | TanStack Query, Apollo/GraphQL, hooks e contexts próprios |
| UI | Radix UI, Framer Motion, Lucide, CSS/Tailwind e componentes locais |
| Observabilidade | Sentry, PostHog, GA4/GTM, Web Vitals e New Relic Browser opcional |
| Testes | Jest, Playwright, Cypress e Lighthouse CI |
| Distribuição | Build standalone em Node 20 Alpine |

Scripts relevantes:

~~~bash
npm run dev
npm run dev:clean
npm run build
npm run start
npm run typecheck
npm run lint
npm run test
npm run test:ci
npm run format:check
npm run perf:lhci
npm run seo:audit
~~~

### 6.2 Navegação e código

| Área | Páginas |
| --- | --- |
| Descoberta | /, /search, /categories, /categories/[slug], /companies, /companies/[id], rankings locais. |
| Conversão | /quote-wizard, orçamento de empresa, /compare, favoritos, login/registro. |
| Confiança/conteúdo | Reviews, review dashboard, blog, metodologia, ranking e empresas verificadas. |
| Produtos/finanças | Produtos, comparação, pricing/plans/prices e billing empresarial. |
| Painéis | /dashboard, inbox, ICP, intent, notificações, reviewer e /company-dashboard. |
| Institucional | Contato, ajuda, termos, privacidade, cookies, DMCA, imprensa, carreira e status. |
| Endpoints Next | Proxy /api/v1/[...path], health, revalidate ISR, Better Auth, sitemaps e SEO image. |

Arquivos prioritários:

- app/layout.tsx: providers, metadados e composição global;
- app/page.tsx: home;
- lib/api-config.ts: URL em browser, SSR e Docker;
- lib/api-client.ts e lib/api.ts: HTTP, cache, retry e contratos;
- contexts/AuthContext.tsx: sessão, OAuth, empresa ativa, Sentry/PostHog;
- components, hooks e lib/analytics: UI e regras por domínio.

### 6.3 Comunicação, segurança e SEO

O resolvedor de API segue esta prioridade:

| Contexto | Origem |
| --- | --- |
| Browser | Proxy /api/v1 por padrão; variável browser específica ou API direta alteram isso. |
| SSR | API_URL_INTERNAL, depois API_PROXY_TARGET, depois URL/fallback configurado. |
| Desenvolvimento | http://localhost:3001. |
| Produção em container | http://ab0-backend:3001 internamente. |

O cliente API tem retry, deduplicação de GET em andamento, cache público e
tratamento de rate limit. Use-o em vez de novas chamadas diretas sem padrão.

next.config.js define standalone, cache de estáticos/imagens, imagens WebP/AVIF,
rewrites para API/Cable/PostHog, CSP/HSTS/headers de segurança, limite de 2 MB
de Server Actions e build id por SHA. Nova integração externa pode exigir
alteração mínima em CSP e remotePatterns, com teste correspondente.

Há SEO local, sitemaps, JSON-LD, canonical, cache SWR/fallback da home e base
offline/PWA. Flags de maior impacto incluem perfil premium, hero experimental,
offline, chat, realtime, analytics e API direta. Flags NEXT_PUBLIC entram no
bundle no build e exigem nova imagem/deploy.

## 7. Mobile — AB0-1-mobile

| Item | Implementação |
| --- | --- |
| Framework | Expo SDK 56, Expo Router e React Native 0.85 |
| Estado | Zustand, React Query e Apollo disponível |
| Sessão | JWT em expo-secure-store |
| Realtime | ActionCable e updates otimistas |
| Recursos | Localização, notificações, fotos/câmera, documentos, mapas e safe area |
| Telemetria | PostHog React Native |
| Testes | Jest/Testing Library e Maestro |

Telas: home, explorar/buscar, comparação, calculadora, orçamento, checkout,
notificações, perfil, solicitações, scanner, guias e onboarding.

~~~bash
npm run start
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
npm run test
npm run maestro
npm run ui-audit
npm run audit
~~~

src/lib/api.ts usa EXPO_PUBLIC_API_BASE_URL quando existe. Sem ela, usa produção
em release e http://10.0.2.2:3001/api/v1 no emulador Android local. Em
dispositivo físico use IP LAN/túnel alcançável; 10.0.2.2 não funciona fora do
emulador.

**Bloqueio para publicação:** app.json ainda contém placeholders de projeto EAS
e identificadores genéricos. Antes de publicar, preencha IDs reais da conta da
empresa para EAS, Android e iOS. O workflow mobile precisa de EXPO_TOKEN.

## 8. Banco, seeds e migrações

Para mudar dados: crie migration, avalie índice/constraint, atualize API/UI/teste,
valide em banco descartável e staging, faça backup e só então aplique em
produção. Nunca edite db/schema.rb diretamente.

Alerta temporal: o schema declara versão 2026_08_02_100003 e há migrations de
01–03/08/2026, enquanto o commit/data deste levantamento são 30/07/2026. Antes
de qualquer deploy, compare cada ambiente:

~~~bash
cd AB0-1-back
bundle exec rails db:migrate:status
bundle exec rails db:version
~~~

Não aplique migrations futuras por suposição.

Seeds/importação: db/seeds.rb, db/seeds_rating_criteria.rb, db/seed_data,
db/SEED_MOBILIDADE_ELETRICA.md, modelo_import_empresas.csv,
scripts/dev/import_companies.rb, docs/GUIA_IMPORTACAO_EMPRESAS_DATASET.md e
docs/GUIA_SEED_MOBILIDADE.md. Faça importação em cópia do banco e valide slugs,
CNPJ, cidade/UF, duplicidade, categoria, geocoding, anexos e empresa ativa.

## 9. Observabilidade, analytics e LGPD

| Sistema | Uso |
| --- | --- |
| PostHog | Product analytics, flags, sessão/intenção e webhook de growth. |
| GA4/GTM | Analytics e marketing tags. |
| Sentry | Erros frontend/backend e correlação de identidade. |
| New Relic Browser | RUM opcional. |
| Scout APM | APM Rails. |
| Yabeda/Prometheus | Métricas em /metrics. |
| Rails/Sidekiq logs | Diagnóstico de aplicação e filas. |

AB0-1-front/lib/analytics contém eventos, consentimento, atribuição e
sanitização. O backend persiste/agrega AnalyticsEvent e dados derivados.

Leads e reviews têm PII. Não envie nome, e-mail, telefone, endereço ou orçamento
a analytics sem necessidade, consentimento e sanitização. Há consent endpoints,
identity stitch e job de retenção de hashes de review. Consulte docs/analytics e
docs/validation antes de alterar o fluxo.

## 10. Billing, pagamentos e webhooks

Billing empresarial usa Stripe para planos, checkout, customer portal,
assinaturas e eventos persistidos. Também há código para banners e providers
legados/multi-provider, portanto identifique controller/serviço correto antes de
mexer em pagamento.

~~~mermaid
sequenceDiagram
  participant Empresa
  participant Web as Next.js
  participant API as Rails
  participant Stripe
  participant DB as PostgreSQL
  Empresa->>Web: escolhe plano
  Web->>API: POST /api/v1/billing/checkout
  API->>DB: valida empresa/plano/autorização
  API->>Stripe: cria Checkout Session
  API-->>Web: checkout_url
  Web->>Stripe: pagamento
  Stripe->>API: webhook assinado
  API->>DB: deduplica e atualiza assinatura/auditoria
~~~

Antes de mudar billing: valide chaves e webhook secret no cofre, IDs de preço,
hosts permitidos, URLs de retorno, checkout/portal em test mode, eventos
duplicados, logs de auditoria, feature gates e alertas Slack. Não confie em
redirecionamento do frontend para ativar plano.


## 11. Hermes Agent — automação de Growth e RevOps

A pasta hermes-agent é um conjunto separado de scripts, skills e documentação
para aquisição B2B, social selling, CRM e RevOps. Não é parte do boot do
portal/API; a execução é explícita e deve ter owner responsável.

Integrações indicadas: Nutshell CRM, Gmail, Slack, Instagram, Stripe e fontes de
prospecção. Os documentos centrais são hermes-agent/INDEX.md,
docs/PROCESS_INVENTORY.md, docs/AUTOMATION_BACKLOG.md,
docs/COMPANY_PROCESS_MASTER_FLOW.md e docs/HUMAN_APPROVAL_MATRIX.md.

Regras de governança que precisam permanecer:

- prospecção geográfica limitada às cidades brasileiras homologadas com 500 mil+
  habitantes;
- mensagens frias, resposta de lead quente, mudanças de perfil, reversões
  financeiras, reclamações e temas jurídicos exigem revisão humana;
- opt-out/LGPD deve ser imediato, auditável e não pode aguardar aprovação;
- comece scripts em modo leitura/rascunho e valide as credenciais antes de ações
  externas.

Antes de executar Hermes no computador novo, recupere a configuração em cofre,
confirme autorização para os serviços externos e siga a matriz humana. Não
automatize novas mensagens comerciais só porque o script consegue fazê-lo.

## 12. Variáveis de ambiente, acesso e segredos

### 12.1 Onde cada configuração vive

| Local | Uso | Regra |
| --- | --- | --- |
| /.env | Ferramentas AIOS/Hermes e compose raiz; arquivo local ignorado. | Transferir por cofre, nunca commitar. |
| /.env.example | Modelo de ferramentas/integrações. | Referência; não basta para iniciar toda a stack. |
| AB0-1-back/.env | Ambiente local Rails; ignorado. | Copiar do exemplo e completar por cofre. |
| AB0-1-back/.env.*.example | Modelos development, staging, production e secrets. | Fonte de nomes e descrições. |
| AB0-1-front/.env ou .env.local | Variáveis Next locais; ignoradas. | Criar localmente. Variáveis NEXT_PUBLIC são visíveis no bundle. |
| AB0-1-front/.env.example | Modelo do portal. | Revisar/sanitizar antes de usar. |
| AB0-1-mobile/.env | Configuração Expo local; ignorada. | Usar somente URL de API e chaves públicas permitidas. |
| GitHub Actions secrets/variables | Build e deploy. | Configurados no GitHub, não no checkout. |

### 12.2 Grupos de configuração

| Grupo | Variáveis típicas |
| --- | --- |
| Rails/autenticação | RAILS_MASTER_KEY, SECRET_KEY_BASE, JWT_SECRET, URLs/origens e OAuth. |
| PostgreSQL/Redis | POSTGRES_*, DATABASE_URL, REDIS_URL e limites de concorrência. |
| Storage | ACTIVE_STORAGE_SERVICE, endpoint, bucket e credenciais Spaces. |
| E-mail | SMTP/Brevo e remetente. |
| Billing | Chave Stripe privada, webhook secret, IDs de preço e eventual Mercado Pago. |
| IA/chat | Provider, modelo, URL e API key. |
| Frontend público | URLs, GA/GTM, PostHog, Sentry Browser e feature flags. |
| Observabilidade | Sentry server, Scout/New Relic e analytics server-side. |
| Revalidação | NEXT_REVALIDATE_URL e NEXT_REVALIDATE_SECRET nos lados Rails e Next. |
| Mobile | EXPO_PUBLIC_API_BASE_URL, chaves públicas autorizadas e EXPO_TOKEN no GitHub. |
| Hermes | CRM, e-mail, Slack, social, prospecção e automação; somente no cofre. |

### 12.3 Regras inegociáveis

1. Nunca coloque segredo em NEXT_PUBLIC ou EXPO_PUBLIC.
2. Nunca copie .env para commit, ticket, mensagem ou documentação.
3. Preserve RAILS_MASTER_KEY, chave de Server Actions e BETTER_AUTH_SECRET.
   Gerar valores novos sem plano pode invalidar sessões/credenciais.
4. O segredo de revalidação precisa ser o mesmo nos dois lados.
5. Após a mudança de computador, revise acessos pessoais a GitHub, DigitalOcean,
   Stripe, Expo, domínio/DNS, e-mail e observabilidade.

### 12.4 Alertas de segurança já visíveis

- docs/security/SECRETS_SECURITY_ROTATION.md relata uma exposição histórica de
  token e checklist de remediação incompleto. Trate como risco aberto até
  confirmar revogação, limpeza de histórico e Gitleaks.
- Um arquivo de exemplo versionado aparenta carregar uma credencial que deveria
  ser secreta. Não replique o valor; remova/rotacione-o em tarefa de segurança.
- O compose de produção do backend contém fallback fixo para chave criptográfica
  do frontend. Antes de novo deploy, converta-a em variável obrigatória sem
  default e rotacione a chave.
- Esta inspeção não prova comprometimento da produção. É necessário inventário
  no cofre e GitHub, seguido de rotação controlada.

## 13. Subir no computador novo

### 13.1 Pré-requisitos

- Git e acesso ao repositório GitHub;
- Docker Desktop/Engine e Docker Compose v2;
- Node.js 20.x e npm para portal/mobile fora de Docker;
- Ruby 3.2.2 e Bundler para Rails fora de Docker, opcional se usar containers;
- Android Studio/emulador para Android; Xcode em macOS para iOS;
- acesso autorizado ao cofre e aos serviços que a pessoa irá operar.

Nesta máquina de origem, Node e Ruby globais não estavam no PATH. Use Docker
para o backend e instale Node 20 explicitamente no computador novo.

### 13.2 Transferência segura

1. Faça push de tudo que for definitivo em branch/PR, ou gere patch versionado.
   Não dependa apenas da pasta da área de trabalho.
2. Faça backup testável de PostgreSQL de produção e dos volumes locais que forem
   necessários. Guarde backup criptografado fora do Git.
3. Registre no cofre os .env locais necessários, sem sobrescrever produção.
4. Confirme organização GitHub, Actions secrets/variables e GHCR.
5. Transfira os acessos a DigitalOcean/VPS/Spaces, Stripe, Expo/EAS, domínio/DNS,
   e-mail, Sentry/PostHog e CRM.
6. Registre owner da operação e aprovadores humanos do Hermes.

### 13.3 Clone limpo

~~~bash
git clone https://github.com/MrGr33n98/Avalia-Solar-2026.git AB0-1-main
cd AB0-1-main
git checkout main
git pull --ff-only origin main
~~~

Não copie node_modules, .next, tmp, log, coverage, .expo, bancos locais ou
volumes Docker entre máquinas. São reconstruíveis e podem causar incompatibilidade.
Copie somente backups de dados planejados.

### 13.4 Backend Docker: caminho recomendado

O compose de desenvolvimento mais completo está em AB0-1-back e inclui Rails,
Sidekiq, PostgreSQL, Redis, MailCatcher, Adminer, Redis Commander e OpenSearch.

~~~bash
cd AB0-1-back
cp .env.development.example .env.development
# Crie/complemente AB0-1-back/.env usando somente o cofre.
make setup
make ps
make health
~~~

| Serviço | URL/porta esperada |
| --- | --- |
| Rails API | http://localhost:3001 |
| Health | http://localhost:3001/health |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| MailCatcher | http://localhost:1080 e SMTP 1025 |
| Adminer | http://localhost:8080 |
| Redis Commander | http://localhost:8081 |
| OpenSearch | http://localhost:9200 |

~~~bash
make logs
make console
make migrate-status
make migrate
make seed
make routes
~~~

make reset e make clean são destrutivos: removem dados/volumes. Use somente em
ambiente descartável e com confirmação consciente.

### 13.5 Frontend local

Em outro terminal, depois de API/banco saudáveis:

~~~bash
cd AB0-1-front
# Crie .env.local por cofre; não replique segredos do exemplo.
npm ci --legacy-peer-deps
npm run dev
~~~

Configuração mínima local:

~~~dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
API_PROXY_TARGET=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ANALYTICS=false
~~~

Acesse http://localhost:3000 e valide home, busca, perfil de empresa, login,
wizard de lead e rota protegida antes de desenvolver.

### 13.6 Mobile local

~~~bash
cd AB0-1-mobile
npm ci
# Defina EXPO_PUBLIC_API_BASE_URL para uma API alcançável.
npx expo start
~~~

No emulador Android use http://10.0.2.2:3001/api/v1. Em aparelho físico, use IP
ou URL da máquina na rede local; confirme firewall e CORS. Rode npm run audit e,
quando houver emulador pronto, os fluxos Maestro antes de PR mobile.

### 13.7 Compose da raiz

docker-compose.yml na raiz é orientado à topologia semelhante à produção:
PostgreSQL 14, Redis, backend, worker e frontend. Ele consome /.env, usa imagens
GHCR por padrão e URLs públicas/nomes internos. Não é a primeira escolha para
desenvolvimento sem revisão de env, imagens e volumes.

Para E2E use especificamente:

~~~bash
docker compose -f docker-compose.test.yml up --build -d
# Execute Playwright conforme seção 15.
docker compose -f docker-compose.test.yml down -v
~~~

O down com -v remove volumes de teste; nunca o aponte para dados reais.

## 14. Deploy, infraestrutura e CI/CD

### 14.1 Workflows

| Workflow | Gatilho | Efeito |
| --- | --- | --- |
| enterprise-pr-pipeline.yml | Push em main/develop/staging e PR para main/develop | Scan de qualidade/segurança, RSpec e E2E Playwright com compose de teste. |
| deploy-v1.yml | Push em main ou manual | Builda imagens backend/frontend no GHCR e faz deploy SSH em produção. |
| Workflow de staging | Arquivo de workflow existente | Build/push e deploy SSH em staging com secrets próprios. |
| mobile-ci.yml | PR que altera mobile | Lint, TypeScript e Jest mobile. |
| mobile-cd.yml | Push em main com alteração mobile ou manual | EAS Update automático; build binário manual. |

Atenção: existem checks de CI permissivos com || true. Pipeline verde não
substitui a análise do resultado de lint/auditoria.

O build/deploy usa, entre outros, segredo Rails, chave de Server Actions,
BETTER_AUTH_SECRET, chaves SSH e EXPO_TOKEN. Mantenha-os em GitHub Secrets,
nunca hardcoded em compose/workflow.

### 14.2 Produção

Arquitetura esperada:

- portal Next: www.avaliasolar.com.br, porta interna 3000;
- API Rails: api.avaliasolar.com.br, porta interna 3001;
- subdomínio B2B app.avaliasolar.com.br, Nginx para Rails 3001;
- PostgreSQL e Redis internos; portas publicadas em loopback no compose;
- arquivos em DigitalOcean Spaces quando Active Storage está em spaces;
- imagens no GHCR, marcadas latest e SHA de release.

O deploy remoto executa operações Git no host. Arquivos locais do servidor,
sobretudo .env, backups e configurações não versionadas, precisam estar fora da
árvore atualizada ou guardados antes do deploy. Faça backup antes de migration.

### 14.3 Nginx

infra/nginx/app.avaliasolar.com.br.conf faz proxy HTTP/WebSocket para
127.0.0.1:3001 e define upload máximo de 25 MB. O vhost
infra/nginx/npm.avaliasolar.com.br.conf aponta Nginx Proxy Manager para porta 81.

Após mudança de vhost no servidor correto:

~~~bash
sudo nginx -t
sudo systemctl reload nginx
~~~

Certificados são administrados por Certbot segundo comentários da configuração.

## 15. Qualidade e validação

| Escopo | Comandos mínimos |
| --- | --- |
| Backend | bundle exec rubocop, bundle exec rspec, migration status e testes do recurso. |
| Frontend | npm run typecheck, npm run lint, npm run test:ci e teste manual da rota. |
| Mobile | npm run lint, npm run typecheck, npm run test; ui-audit/Maestro quando aplicável. |
| Integrações | Sandbox/mocks de webhook, retry/idempotência e logs sem PII/secrets. |
| SEO/performance | Canonical, metadata/JSON-LD, imagem e Lighthouse/SEO audit em mudança pública. |

Use docker-compose.test.yml e Playwright para smoke E2E do portal.

Não foram executados npm, Ruby, Docker, RSpec, Jest, Playwright, migrations ou
deploy durante este handoff; os binários Node/Ruby não estavam disponíveis no
PATH desta máquina. Faça uma validação limpa no computador novo.

## 16. Estado e documentos prioritários

STATE.md é de 02/06/2026 e registra trabalho de perfil premium. Ele não cobre
com segurança o conjunto de commits/migrations posteriores. Use como histórico,
não como status atual.

| Necessidade | Documentos |
| --- | --- |
| Visão técnica | docs/planning/AVALIA_SOLAR_DOCUMENTACAO_TECNICA_COMPLETA.md e README.md. |
| Deploy/segredos | docs/GITHUB_SECRETS_GUIDE.md, docs/GITHUB_SECRETS_SETUP.md, docs/DEPLOY_CHECKLIST_P0.md e docs/security/SECRETS_SECURITY_ROTATION.md. |
| Mobile | docs/MOBILE_DOCUMENTATION_INDEX.md, docs/EPIC-MOBILE-001_MOBILE_FIRST_READINESS.md e AB0-1-mobile/QA_REPORT_MOBILE.md. |
| Billing | docs/billing, REVENUE_SYSTEM_ARCHITECTURE.md e WEBHOOK_SECURITY_GUIDE.md. |
| Analytics | docs/analytics, POSTHOG_ANALYTICS_AUDIT.md e docs/observability. |
| SEO | docs/SEO_GEO_AEO_* e AB0-1-front/docs/seo-companies-url-structure.md. |
| Empresas/categorias | docs/CATEGORY_PAGE_V2_* e docs/GUIA_IMPORTACAO_EMPRESAS_DATASET.md. |
| Hermes | hermes-agent/INDEX.md, processo mestre, backlog e matriz humana. |
| Segurança | SECURITY_AUDIT_INDEX.md e docs/AVALIA_SOLAR_SECURITY_AUDIT_COMPREHENSIVE.md. |

## 17. Pendências e riscos para a primeira sessão

| Prioridade | Item | Ação |
| --- | --- | --- |
| P0 | Segredos históricos e fallback criptográfico | Inventariar no cofre/GitHub, revogar se necessário, remover defaults inseguros e validar Gitleaks. |
| P0 | Migrations após a data do snapshot | Conferir status por ambiente e definir promoção deliberada. |
| P0 | Backup/restauração | Exercitar restauração Postgres e acesso a Spaces. |
| P1 | EAS mobile | Trocar placeholders e validar update/build na conta organizacional. |
| P1 | Estado do checkout | Rodar git status e git diff no novo computador antes de resetar/criar branch. |
| P1 | CI permissivo | Revisar jobs que usam || true. |
| P1 | Realtime/telemetria | Validar WebSocket HTTPS, CSP, PostHog, Sentry e health em staging. |
| P2 | Documentação antiga | Consolidar/arquivar planos ultrapassados preservando histórico. |

## 18. Checklist de retomada

### Primeiro dia

- [ ] Acessar repositório, Actions e GHCR.
- [ ] Recuperar segredos por cofre, sem colocá-los no Git.
- [ ] Instalar Docker, Node 20 e Ruby 3.2.2 quando necessário.
- [ ] Subir backend e validar health.
- [ ] Subir frontend e validar home, busca, perfil e login.
- [ ] Configurar mobile para emulador/dispositivo e validar API.
- [ ] Conferir migrations e backup de qualquer banco a alterar.
- [ ] Ler as pendências P0/P1 e os relatórios de segurança.

### Antes do primeiro deploy

- [ ] Main/staging revisados; nenhuma mudança local desconhecida.
- [ ] CI executado e resultados de checks permissivos revisados.
- [ ] Testes do recurso e smoke crítico concluídos.
- [ ] Backup, rollback e responsável de plantão definidos.
- [ ] Migrations revisadas e aplicadas primeiro em staging.
- [ ] URLs, CORS, CSP, storage, SMTP, OAuth, webhooks e revalidação conferidos.
- [ ] Stripe em modo/conta corretos, com webhook/IDs de preço validados.
- [ ] Logs/alertas ativos e sem PII ou secrets.

## 19. Diagnóstico Git observado nesta máquina

Durante o levantamento, git status e git diff no volume Windows ficaram lentos e
chegaram ao timeout de 30–40 segundos. Eles criaram index.lock temporário, que
foi removido ao encerrar somente os processos de diagnóstico iniciados para este
levantamento. Nenhum lock permaneceu no final.

No computador novo, se Git for lento em WSL sobre /mnt/c, prefira manter o clone
no filesystem Linux ou use Git nativo do Windows. Antes de remover index.lock,
confirme que não existe operação Git legítima em andamento.

## 20. Regra final de continuidade

Trabalhe por branch e PR; use commits convencionais; mantenha mudanças de schema,
API e UI compatíveis durante o deploy; e trate pagamentos, dados pessoais,
automações externas e segredos como mudanças de alto risco com revisão humana.

Atualize o cabeçalho deste arquivo em toda troca de responsável: commit/data,
infraestrutura, acessos transferidos e riscos encerrados. Ele deve ser um
registro verificável, nunca um local para credenciais.

