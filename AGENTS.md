# Avalia Solar 2026 — Guia para Agentes de Código

> **Público-alvo:** agentes de IA que vão ler ou modificar código deste repositório.  
> **Idioma do projeto:** a documentação, comentários e comunicação técnica são predominantemente em **português (Brasil)**. Artifacts do repositório devem seguir esse padrão.

---

## 1. Visão Geral do Projeto

O **Avalia Solar 2026** é uma plataforma de avaliação e consultoria de energia solar. O repositório é um **monorepo** profissional que integra:

- **Backend (`AB0-1-back/`)**: API em Ruby on Rails 7, servindo REST (`/api/v1`), GraphQL (`/graphql`), ActiveAdmin (`/admin`) e o subdomínio B2B (`app.avaliasolar.com.br`).
- **Frontend (`AB0-1-front/`)**: aplicação Next.js 14 (App Router, React 18, TypeScript), com foco em performance, SEO e experiência mobile (PWA-first).
- **Mobile (`AB0-1-mobile/`)**: aplicativo nativo em Expo SDK 56 / React Native 0.85, com `expo-router` e arquivo-base de rotas.
- **Vídeos (`videos/`)**: composições de marketing geradas com Remotion 4.
- **Agente de Growth (`hermes-agent/`)**: motor de automação de outbound/growth (Node/TypeScript).
- **Infraestrutura (`infra/`)**: configurações Nginx, Docker Compose e workflows GitHub Actions.
- **Documentação (`docs/`)**: decisões arquiteturais (MADR), guias de desenvolvimento e auditorias.

O deploy de produção roda em containers Docker na DigitalOcean, orquestrados via Docker Compose, com imagens publicadas no GitHub Container Registry (GHCR).

---

## 2. Estrutura do Repositório

```
Avalia-Solar-2026/
├── AB0-1-back/              # Ruby on Rails 7 (API + Admin + GraphQL)
├── AB0-1-front/             # Next.js 14 (App Router)
├── AB0-1-mobile/            # Expo SDK 56 / React Native
├── docs/                    # Documentação técnica, guias e auditorias
├── hermes-agent/            # Automação de growth/outbound
├── infra/                   # Nginx, MCP_CONFIG.json
├── marketing/               # Assets e páginas HTML de marketing
├── scripts/                 # Scripts utilitários de dev, deploy, testes e diagnóstico
├── tests/                   # Testes ad-hoc
├── videos/                  # Remotion (vídeos de marketing)
├── .github/workflows/       # CI/CD GitHub Actions
├── docker-compose.yml       # Stack de produção
├── docker-compose.test.yml  # Stack para testes E2E
├── Dockerfile.backend       # Imagem Rails
├── Dockerfile.frontend      # Imagem Next.js (standalone)
├── Dockerfile               # Dockerfile legado do backend
└── .env.example             # Contrato completo de variáveis de ambiente
```

---

## 3. Stack Tecnológica

### 3.1 Backend (`AB0-1-back/`)

| Camada | Tecnologia |
| --- | --- |
| Linguagem | Ruby 3.2.2 |
| Framework | Rails 7.0.8 |
| Servidor | Puma 5 |
| Banco de dados | PostgreSQL 14+ |
| Cache / Filas | Redis 7 + Sidekiq 7 |
| Autenticação | Devise + JWT customizado + OmniAuth (Google/LinkedIn/Facebook) |
| Autorização | Pundit |
| Admin | ActiveAdmin 3.2 |
| API | REST (`/api/v1`) + GraphQL (`/graphql`) |
| Serialização | ActiveModelSerializers |
| Paginação | Kaminari |
| Busca | Searchkick / Elasticsearch 7 (OpenSearch) — desativado por padrão |
| Pagamentos | Stripe + MercadoPago |
| Observabilidade | Sentry, New Relic, Scout APM, Yabeda → Prometheus (`/metrics`) |
| Analytics | PostHog, Mixpanel |
| Notificações | `noticed` 2.2 |
| Testes | RSpec 6 + FactoryBot + Capybara/Selenium + SimpleCov |
| Qualidade | RuboCop, Brakeman, Bullet, bundler-audit |

### 3.2 Frontend (`AB0-1-front/`)

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 14.2.34 (App Router) |
| React | 18.2.0 / TypeScript 5.2.2 |
| Estilo | Tailwind CSS 3.3 + design tokens AS-EDS/Claymorphism |
| UI | Radix UI + shadcn/ui-like (`components/ui/`) |
| Estado | Zustand 5 + TanStack Query 5 |
| GraphQL | Apollo Client 4 |
| Auth | Contexto JWT legado + Better Auth (handler preparado) |
| Analytics | PostHog, GA4/GTM, Sentry, New Relic Browser |
| Mapas | Leaflet + react-leaflet |
| Testes | Jest 30 + React Testing Library + Playwright E2E |
| Qualidade | ESLint (Next.js), Prettier, Knip, Lighthouse CI |

### 3.3 Mobile (`AB0-1-mobile/`)

| Camada | Tecnologia |
| --- | --- |
| Framework | Expo SDK 56 |
| React Native | 0.85.3 com React 19.2.3 |
| Router | expo-router (file-based) |
| Estado | Zustand 5 |
| GraphQL | Apollo Client 4 |
| REST caching | TanStack Query 5 |
| Mapas | react-native-maps |
| Animação | react-native-reanimated + react-native-worklets |
| Storage seguro | expo-secure-store |
| Notificações | expo-notifications |
| Analytics | PostHog React Native |
| Testes | Jest 29 + React Native Testing Library + Maestro E2E |
| Build | EAS (Expo Application Services) |

### 3.4 Infraestrutura

- **Docker + Docker Compose** para produção, testes e desenvolvimento.
- **Nginx** como proxy reverso (`infra/nginx/`).
- **GitHub Actions** para CI/CD.
- **GitHub Container Registry (GHCR)** para imagens Docker.
- **DigitalOcean Spaces** (S3-compatible) para Active Storage em produção.

---

## 4. Configuração e Desenvolvimento Local

### 4.1 Pré-requisitos

- Docker + Docker Compose
- Node.js 20+ (para rodar frontend/mobile fora do Docker)
- Ruby 3.2.2 + Bundler 2.4.22 (para backend fora do Docker)

### 4.2 Subindo a stack completa (recomendado)

```bash
# Na raiz do repositório
docker compose up -d

# Preparar banco do backend
docker compose exec backend bundle exec rails db:migrate
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health backend:** http://localhost:3001/health/liveness

### 4.3 Desenvolvimento do backend (Docker dedicado)

Dentro de `AB0-1-back/` existe um `Makefile` e um `docker-compose.dev.yml`:

```bash
cd AB0-1-back
make setup    # primeira vez
make up       # iniciar serviços
make console  # Rails console
make test     # testes (Minitest)
make migrate  # rodar migrations
make routes   # listar rotas
```

Serviços adicionais do dev backend:
- Adminer: http://localhost:8080
- MailCatcher: http://localhost:1080
- Redis Commander: http://localhost:8081

### 4.4 Desenvolvimento do frontend

```bash
cd AB0-1-front
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção
npm run lint       # ESLint
npm run typecheck  # TypeScript --noEmit
npm run test       # Jest
```

### 4.5 Desenvolvimento do mobile

```bash
cd AB0-1-mobile
npm install
npm start          # Expo dev server
npm run android    # expo run:android
npm run ios        # expo run:ios
npm run web        # expo start --web
```

---

## 5. Comandos de Build, Teste e Qualidade

### 5.1 Backend

```bash
# Testes
cd AB0-1-back
bundle exec rspec              # suite principal (RSpec)
bundle exec rails test         # Minitest (legado, ainda presente)
bundle exec rails test:system  # testes de sistema

# Qualidade
bundle exec rubocop
bundle exec brakeman -q -w2
bin/quality                    # rubocop + brakeman + rspec

# API docs (Swagger/Rswag)
bundle exec rswag:specs:swaggerize
```

### 5.2 Frontend

```bash
cd AB0-1-front
npm run dev
npm run build
npm run build:clean
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run typecheck
npm run test
npm run test:coverage
npm run test:ci
npm run analyze          # bundle analyzer
npm run knip             # detectar código morto
npm run perf:lhci        # Lighthouse CI
npm run seo:audit        # auditoria de sitemap
```

### 5.3 Mobile

```bash
cd AB0-1-mobile
npm start
npm run lint
npm run lint:fix
npm run typecheck
npm run test
npm run test:ci
npm run maestro          # E2E Maestro
npm run ui-audit         # verificar cores hardcoded
npm run audit            # lint + typecheck + test:ci + ui-audit
```

### 5.4 Scripts úteis na raiz

- `scripts/check-code-quality.sh` — quality gate local (RuboCop, ESLint, build, Brakeman, bundler-audit).
- `scripts/diagnostico-seo-aeo-geo.sh` — gera relatório de SEO/AEO/GEO.
- `scripts/deploy/fix-production-server-actions.sh` — remediação de build cache do Next.js em produção.

---

## 6. Organização do Código

### 6.1 Backend

```
AB0-1-back/
├── app/
│   ├── controllers/
│   │   ├── api/v1/            # REST API
│   │   ├── admin/             # Sessões Devise/ActiveAdmin
│   │   ├── app/               # Subdomínio B2B (Hotwire)
│   │   ├── dashboard/         # Dashboards HTML
│   │   └── graphql_controller.rb
│   ├── models/                # ~100 models (Company, User, Review, Lead, Product, Category, Banner, Campaign...)
│   ├── models/concerns/       # SeoStandardizable, Moderation, QueryCacheable, Notifiable, etc.
│   ├── services/              # Objetos de serviço (analytics, billing, chat, reviews, trust_score, etc.)
│   ├── jobs/                  # Background jobs (Sidekiq)
│   ├── workers/               # Workers adicionais (trust score, lead scoring, analytics)
│   ├── mailers/               # E-mails
│   ├── notifiers/             # Notificações com `noticed`
│   ├── policies/              # Pundit
│   ├── serializers/           # AMS
│   ├── admin/                 # Registros ActiveAdmin
│   ├── graphql/               # Schema, types, mutations, loaders
│   └── assets/                # Sprockets + importmap + Hotwire
├── config/                    # Rotas, initializers, sidekiq, cable, storage
├── db/                        # 150+ migrations, schema.rb, seeds
├── spec/                      # RSpec (~270 specs)
├── test/                      # Minitest (~87 tests)
├── lib/                       # Middlewares, otimização de queries, scripts
└── Makefile                   # Comandos Docker de dev
```

**Pontos de atenção:**
- `config/routes.rb` é grande (~577 linhas). Há namespaces separados para API, admin, GraphQL e subdomínio B2B.
- `Company` é o modelo central (~1300 linhas).
- Searchkick tem callbacks assíncronos, mas só são habilitados quando `SEARCH_ENABLED=true`.
- `config/initializers/00_redis_disable.rb` permite subir o app sem Redis quando `REDIS_ENABLED=false`.

### 6.2 Frontend

```
AB0-1-front/
├── app/                       # App Router
│   ├── page.tsx               # Home
│   ├── layout.tsx             # Root layout
│   ├── api/                   # Route handlers (proxy /api/v1, auth Better Auth, analytics, revalidate)
│   ├── (auth)/                # Grupo de rotas de autenticação
│   ├── dashboard/             # Dashboard
│   ├── companies/             # Catálogo de empresas
│   └── ...
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── layout/                # Navbar, footer, navegação mobile
│   └── landing/, home/, company/, search/, pricing/, seo/
├── lib/                       # API clients, utilitários, caches server-side, analytics, SEO
├── contexts/                  # AuthContext (JWT)
├── context/                   # CompanyContext (TanStack Query)
├── hooks/                     # Hooks customizados
├── store/                     # Zustand stores
├── script/                    # Scripts de build/performance/SEO
├── __tests__/                 # Jest
├── tests/e2e/                 # Playwright
└── cypress/e2e/               # Legado (Cypress não está nas dependências)
```

**Pontos de atenção:**
- O frontend proxyia chamadas `/api/v1/*` e `/cable` para o backend via `app/api/v1/[...path]/route.ts`.
- Server Components usam `unstable_cache` com tags (`home-data`, `home-hero`) para ISR.
- `middleware.ts` protege rotas autenticadas e redireciona query params de categoria para slugs canônicos.

### 6.3 Mobile

```
AB0-1-mobile/
├── src/app/                   # Rotas expo-router
│   ├── _layout.tsx            # Root providers
│   ├── index.tsx              # Home
│   ├── explore.tsx            # Radar/busca
│   ├── profile.tsx            # Perfil/auth
│   ├── calculadora.tsx        # Calculadora solar
│   ├── compare.tsx            # Comparador
│   ├── request-quote.tsx
│   ├── chat/, p2p_chat/       # Chat
│   ├── company/               # Perfil da empresa
│   └── dashboard/             # Dashboard da empresa
├── src/components/
│   ├── app-tabs.tsx           # Bottom tabs (native)
│   ├── app-tabs.web.tsx       # Tabs web
│   └── ui/                    # Estados vazio/erro/offline/esqueleto
├── src/lib/                   # Apollo client, REST wrapper, queries GraphQL
├── src/store/                 # Zustand (auth, compare)
├── src/constants/theme.ts     # Tokens de cores, raio, sombras, fontes, espaçamento
├── scripts/                   # check-premium-ui.js, fix-premium-ui.js
├── .maestro/                  # E2E Maestro
└── __mocks__/                 # Mocks Jest
```

**Pontos de atenção:**
- Path alias `@/*` → `./src/*`.
- Apollo Client faz cache persistido em `AsyncStorage` e auto-logout em 401.
- O app usa `expo-router` com navegação por tabs.

---

## 7. Diretrizes de Estilo de Código

### 7.1 Geral

- **Idioma:** comentários, nomes de commits, documentação e mensagens de erro em **português do Brasil**, salvo quando a convenção da tecnologia exigir inglês (nomes de classes, métodos, variáveis e tabelas do banco).
- **Mínimo de mudanças:** faça apenas as alterações necessárias para a tarefa. Evite refatorações oportunistas.
- **Não invente padrões:** siga o estilo e as convenções já presentes no arquivo e no módulo.

### 7.2 Ruby / Rails

- RuboCop está configurado em `.rubocop.yml`.
- Comprimento de linha: 120 caracteres.
- Tamanho máximo de método: 20 linhas; classe: 300 linhas; ABC size: 30.
- `Style/Documentation` e `Style/FrozenStringLiteralComment` estão desabilitados.
- Exclui `db/`, `config/`, `bin/`, `vendor/`, `tmp/`, `script/`.
- Prefira **service objects** para lógica de negócio complexa em vez de engordar models/controllers.
- Policies do Pundit são obrigatórias para novos recursos.
- N+1: use `includes`/`preload`; Bullet está ativo em dev/test.
- Migrations: mantenhas reversíveis e teste `db:migrate` e `db:rollback`.

### 7.3 TypeScript / Next.js / React Native

- Prettier: `printWidth: 100`, `singleQuote: true`, `trailingComma: es5`, `tabWidth: 2`.
- ESLint: `next/core-web-vitals` + `next/typescript`.
- Use o path alias `@/*` para imports internos.
- Não use `<img>` direto no Next.js; use `next/image`.
- `no-console`: warning (permitido `console.warn` e `console.error`).
- No mobile, **nunca use cores hardcoded**; use sempre os tokens de `src/constants/theme.ts`. Rode `npm run ui-audit` para verificar.

### 7.4 Mobile / Safe-Area

- A estratégia oficial é **PWA-first**, mas o app nativo existe e deve respeitar safe-areas.
- Use `SafeAreaView` e as variáveis/utility classes de safe-area documentadas em `docs/guides/safe-area-guide.md`.
- Elementos fixos na tela devem respeitar `--safe-area-inset-*`.

---

## 8. Instruções de Teste

### 8.1 Backend

- **Suite principal:** RSpec.
- Roda com Postgres + Redis nos workflows de CI.
- FactoryBot disponível; fixtures legados podem existir.
- Testes de sistema usam Capybara + Selenium.
- SimpleCov é carregado no `test/test_helper.rb` do Minitest; a suite CI roda RSpec, então cobertura pode precisar de atenção.

### 8.2 Frontend

- **Jest** para unidade/integração com jsdom.
- **Playwright** para E2E (`tests/e2e/`).
- Thresholds de cobertura: 80% branches/functions/lines/statements.
- Lighthouse CI exige performance ≥ 0.8, acessibilidade/best-practices/SEO ≥ 0.9.
- Os arquivos Cypress em `cypress/e2e/` são legados.

### 8.3 Mobile

- **Jest + jest-expo** para testes unitários/integração.
- Testes convivem com o código em `__tests__/` ou sob `src/__tests__/`.
- **Maestro** para E2E (`.maestro/`).

### 8.4 CI/CD

Os workflows garantem qualidade em PR/push para `main`, `develop`, `staging`:

| Workflow | Gatilho | O que faz |
| --- | --- | --- |
| `deploy-v1.yml` | push `main` / manual | Build e deploy de produção com rollback automático |
| `deploy-staging.yml` | manual | Deploy em staging |
| `enterprise-pr-pipeline.yml` | PR/push `main`/`develop`/`staging` | RuboCop, Brakeman, bundler-audit, ESLint, npm audit, Gitleaks, RSpec, Playwright E2E |
| `backend-regression-smoke.yml` | alterações em `AB0-1-back/**` | RSpec regressão com Postgres/Redis |
| `mobile-ci.yml` | PR com alterações mobile | lint, typecheck, testes mobile |
| `mobile-cd.yml` | push `main` em mobile / manual | EAS Update OTA; build de binários sob demanda |

---

## 9. Considerações de Segurança

O projeto passou por auditorias de segurança recentes (arquivos `SECURITY_AUDIT_*`, `AUDIT_*`, `IMPLEMENTATION_GUIDE.md`, `CRITICAL_FIXES_IMPLEMENTATION.md`). Conheça os principais pontos:

- **Autorização no backend:** não confie apenas em gates no frontend. Use Pundit policies no Rails para todo recurso sensível.
- **IDOR:** verifique que endpoints de empresas/leads/reviews só exponham dados do tenant/usuário correto.
- **JWT:** tokens são usados via header `Authorization` ou cookie `jwt_token`. Há verificação de assinatura de edge location (`verify_edge_signature`) na API.
- **Rack::Attack:** throttling configurado para login, GraphQL, MCP tools, downloads, API de trust e endpoints públicos.
- **CORS:** configurado por ambiente; endpoints `trust` públicos permitem `*`.
- **Segredos em build:** `RAILS_MASTER_KEY`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` e `BETTER_AUTH_SECRET` são injetados como Docker secrets no CI.
- **GraphQL:** introspecção desabilitada em produção; limites de depth (7) e complexity (5000).
- **Active Storage:** produção usa DigitalOcean Spaces; fallback local quando credenciais ausentes.
- **Não commit secrets:** `.env` e `config/master.key` devem ficar fora do Git. O repositório já inclui Gitleaks no CI.
- **Dependências:** `bundler-audit` e `npm audit` rodam no CI.

Antes de alterar código em áreas sensíveis (auth, billing, leads, reviews, company dashboard), consulte `IMPLEMENTATION_GUIDE.md` e `SECURITY_AUDIT_DEEP_FINDINGS.md`.

---

## 10. Arquitetura de Deploy

### 10.1 Produção

```
[Nginx] → [Next.js frontend :3000]
            ↓ proxy /api/v1, /cable, /graphql
        [Rails backend :3001]
            ↓ jobs
        [Sidekiq worker]
            ↓
        [PostgreSQL]  [Redis]  [OpenSearch - opcional/desativado]
```

- Imagens: `ghcr.io/<repo>-backend` e `ghcr.io/<repo>-frontend`.
- Migrations rodam **uma única vez** com a nova imagem backend antes de trocar os containers.
- Deploy faz rollback automático se healthcheck falhar.
- Worker é parado durante o deploy para drenar jobs e liberar memória.

### 10.2 Variáveis Críticas

Veja `.env.example` para a lista completa. As mais críticas:

- `RAILS_MASTER_KEY`
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
- `BETTER_AUTH_SECRET`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `SPACES_ACCESS_KEY_ID`, `SPACES_SECRET_ACCESS_KEY`
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_BILLING_WEBHOOK_SECRET`

---

## 11. Integrações Externas

- **PostHog:** analytics, feature flags, session replay.
- **Sentry:** error tracking e performance.
- **New Relic / Scout:** APM.
- **Stripe / MercadoPago:** pagamentos e assinaturas.
- **Google Analytics 4 / GTM:** marketing analytics.
- **DigitalOcean Spaces:** armazenamento de arquivos.
- **n8n:** orquestração de automações de growth/vendas.
- **Nutshell CRM:** CRM.
- **Evolution API:** WhatsApp.
- **n8n / MCP:** o arquivo `infra/MCP_CONFIG.json` define servidores MCP (PostHog, n8n, Figma, GitHub, Firecrawl, Playwright, Context7).

---

## 12. Convenções para Agentes de IA

1. **Leia antes de escrever:** consulte `AGENTS.md`, o `README.md` e, quando relevante, os MADR/ADR em `docs/architecture/`.
2. **Mantenha consistência:** siga o estilo, idioma e padrões do arquivo que está editando.
3. **Execute os testes:** após alterações no backend, rode `bundle exec rspec`. No frontend, `npm run lint && npm run typecheck && npm run test`. No mobile, `npm run lint && npm run typecheck && npm run test`.
4. **Não altere lógica de testes existentes** para fazer a suite passar; corrija a implementação.
5. **Mudanças mínimas:** evite refatorações fora do escopo.
6. **Documentação:** se introduzir uma nova convenção de build, deploy ou arquitetura, atualize este `AGENTS.md` e os documentos relevantes em `docs/`.
7. **Segurança:** quando tocar em auth, autorização, billing ou expor dados, valide com Brakeman/RuboCop/ESLint e revise `IMPLEMENTATION_GUIDE.md`.
8. **Mobile:** consulte `AB0-1-mobile/AGENTS.md` e `docs/guides/safe-area-guide.md`. Antes de finalizar UI mobile, rode `npm run ui-audit`.

---

## 13. Leituras Recomendadas

- `README.md` — visão geral e onboarding rápido.
- `docs/00_LEIA-ME_PRIMEIRO.md` — ponto de partida da documentação técnica.
- `docs/architecture/MADR-001-mobile-platform.md` — decisão mobile (PWA-first).
- `docs/guides/safe-area-guide.md` — guia de safe-area.
- `IMPLEMENTATION_GUIDE.md` — correções de segurança críticas.
- `SECURITY_AUDIT_DEEP_FINDINGS.md` — achados profundos de segurança.
- `REVENUE_SYSTEM_ARCHITECTURE.md` — arquitetura de faturamento.
- `DOCUMENTACAO_TRANSFERENCIA_PROJETO.md` — dossiê de transferência do projeto.
