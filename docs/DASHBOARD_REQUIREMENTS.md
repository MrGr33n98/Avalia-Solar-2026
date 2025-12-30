# Avalia-Solar — Requisitos completos para implementação do Dashboard (Frontend + Backend)

> Nota: você pediu “usar o MCP contex7”, mas este ambiente não possui essa ferramenta integrada. A análise abaixo foi feita diretamente pelo código existente nas pastas indicadas.

Data: 2025-12-29

---

## 0) Objetivo
Implementar um dashboard **com dados reais (sem mocks)**, com **sincronização/atualização em tempo real** e **suporte a histórico temporal**, respeitando **tipos de usuários e permissões** (Super Admin, Review User, Company User) e garantindo **performance, observabilidade, segurança e rollback**.

---

## 1) Estrutura atual do projeto (encontrada no repositório)

### 1.1 Frontend
Local: `AB0-1-front\app\dashboard`

Principais entradas:
- `app\dashboard\page.tsx`
  - Hoje usa **stats mockados** e “Demo User”.
- `app\dashboard\company\page.tsx`
  - Usa `AuthContext` para obter `company_id` do usuário e renderiza `EnterpriseDashboard`.
- `app\dashboard\components\EnterpriseDashboard.tsx`
  - Já faz chamadas reais para:
    - `GET /api/v1/company_dashboard/stats`
    - `GET /api/v1/company_dashboard/notifications`
    - `GET /api/v1/companies/:id`
  - Ainda contém **valores de “change/trend” mockados** (linhas de tendência percentuais).
- `hooks\useDashboard.ts`
  - Hook pronto para buscar `dashboardApi.getStats()`.

Documentação existente:
- `AB0-1-front\app\dashboard\README.md`
  - Descreve fluxo de `PendingChange` e endpoints do Company Dashboard.


### 1.2 Backend
Local: `AB0-1-back`

Rotas relevantes:
- `GET /api/v1/dashboard/stats` → `Api::V1::DashboardController#stats`
- `scope /api/v1/company_dashboard/*` → `Api::V1::CompanyDashboardController`
- `GET /api/v1/companies/:id/analytics/historical` → `CompaniesController#analytics_historical` (**gera dados random hoje**)
- `GET /api/v1/companies/:id/analytics/traffic` → `CompaniesController#analytics_traffic` (**fontes hardcoded hoje**)
- `GET /api/v1/companies/:id/analytics/reviews` → `CompaniesController#analytics_reviews` (real, baseado em `reviews`)
- `GET /api/v1/companies/:id/analytics/competitors` → `CompaniesController#analytics_competitors` (real, usa rating/reviews_count)
- `POST /api/v1/analytics/track` → `Api::V1::AnalyticsController#track`
  - Para eventos gerais (`view/click/lead/whatsapp_click`) hoje **só loga**.
  - Tem código para banner tracking (`BannerEvent`, `BannerDailyStat`), mas **não há tabelas no schema atual** (gap).

Auth (API):
- `Api::V1::BaseController` lê JWT do header `Authorization: Bearer <token>`.
- `AuthController` tem fallback de desenvolvimento (cria “Usuário Demo”).

Papéis (roles) atuais:
- `User::ROLES = %w[user admin company]`.
- Não existe `review` no enum/validação hoje.

---

## 2) Requisitos de dados (dados reais + tempo real + histórico)

### 2.1 Dados reais (sem mocks) — requisito geral
Todas as visualizações do dashboard devem ser alimentadas por:
- Consultas em banco (Postgres),
- ou agregações pré-calculadas (tabelas de métricas),
- ou cache (Redis/Rails.cache),
- e nunca por `rand()` / listas hardcoded / “Demo User”.

**Estado atual (gaps):**
- `AB0-1-front\app\dashboard\page.tsx` usa stats mockados.
- `CompaniesController#generate_historical_data` usa `rand()`.
- `CompaniesController#generate_traffic_sources` é hardcoded.
- `CompanyDashboard::StatsService` tenta ler contadores em `Company` (`profile_views_count`, `cta_clicks_count`, `whatsapp_clicks_count`), mas esses campos **não existem no schema** → sempre 0.


### 2.2 Modelo de métricas: eventos brutos + agregação (recomendado)
Para habilitar histórico, filtros e tempo real de forma consistente:

**Camada A — eventos brutos (append-only):**
- Criar tabela (exemplo): `analytics_events`
  - `id`
  - `company_id` (nullable, mas recomendado sempre que possível)
  - `user_id` (nullable)
  - `event_type` (enum/string): `profile_view`, `cta_click`, `whatsapp_click`, `lead_created`, `review_created`, `banner_view`, `banner_click`, etc.
  - `tracked_at` (datetime)
  - `metadata_json` (jsonb)
  - `ip_hash`, `user_agent_hash` (para dedupe e privacidade)
  - índices por `(company_id, tracked_at)`, `(event_type, tracked_at)`.

**Camada B — agregados diários/horários (para dashboards):**
- Criar tabela: `company_daily_stats`
  - `company_id`, `day`
  - `profile_views`, `cta_clicks`, `whatsapp_clicks`, `leads`, `reviews`
  - `unique_visitors` (opcional)
  - índices por `(company_id, day)`.

**Camada C — contadores “quentes” (opcional, para cards rápidos):**
- Adicionar colunas em `companies` (se fizer sentido):
  - `profile_views_count`, `cta_clicks_count`, `whatsapp_clicks_count`
- Atualizar via job/trigger/serviço de tracking.


### 2.3 Atualização e sincronização em tempo real
Opções suportadas pelo stack:
- **ActionCable (WebSocket)** com Redis (recomendado no Rails):
  - Criar `CompanyDashboardChannel` e autenticar via JWT.
  - Streams por empresa: `stream_from "company:#{company_id}:dashboard"`.
  - Eventos que disparam broadcast:
    - novo lead,
    - nova review,
    - aprovação/rejeição de `PendingChange`,
    - mudança de status de banners/campanhas.

- Alternativa: **SSE** (menos comum no Rails aqui).

No frontend:
- `EnterpriseDashboard` deve se inscrever no canal e atualizar:
  - cards (stats),
  - lista de notificações,
  - badges de “pendentes”.

**Estado atual (gaps):**
- `AB0-1-back\app\channels\application_cable\connection.rb` está vazio (sem identificação do usuário).
- Não há canais específicos nem broadcasts.
- Notificações são montadas “on the fly” no controller e não têm estado “read/unread” persistido.


### 2.4 Histórico para análises temporais
Requisitos mínimos:
- `GET /companies/:id/analytics/historical?days=30` retornar série temporal **real** (por dia) de:
  - `views`, `clicks`, `leads`, `conversion`.
- `GET /companies/:id/analytics/traffic?days=30` retornar origens reais (direct/referral/social/organic) com:
  - `visits`, `percentage`, `conversion_rate`.

Fontes de verdade:
- Eventos `analytics_events` + agregação diária.
- Leads já existem (`leads` table) e podem compor o histórico.
- Reviews já existem (`reviews` table) e podem compor tendências.

**Estado atual (gaps):**
- Histórico e traffic são mockados.
- Não existe tracking persistido para `profile_view/cta_click/whatsapp_click`.

---

## 3) Tipos de usuários e permissões

### 3.1 Super Admin (Rails)
Definição:
- Usuário do ActiveAdmin (`AdminUser`) com acesso total ao backoffice.

Requisitos:
- Gestão completa: aprovar/rejeitar `PendingChange`, gerenciar empresas, categorias, conteúdos, banners, leads e planos.
- Acesso a relatórios globais.

Gap atual:
- O dashboard “admin” da API (`/api/v1/dashboard/stats`) exige `User.role == 'admin'` (não `AdminUser`).
  - Decisão necessária: 
    1) manter Super Admin via ActiveAdmin (AdminUser) e separar do dashboard Next,
    2) ou criar bridge para AdminUser acessar endpoints API do dashboard Next,
    3) ou adotar `User` admin como “Admin do dashboard” e `AdminUser` como “Super Admin” apenas do backoffice.


### 3.2 Review User (novo)
Definição:
- Usuário com permissões focadas em **análise e revisão** (ex.: moderação de reviews, auditoria de pending changes, qualidade de conteúdo).

Requisitos:
- Adicionar role `review` em `User::ROLES`.
- Permissões típicas:
  - listar e revisar `reviews` (ex.: marcar `verified`, contestar/ocultar quando aplicável),
  - aprovar/rejeitar pending changes sob escopo definido,
  - acesso a dashboards de qualidade (ex.: distribuição de ratings, suspeitas).

Gaps atuais:
- `review` não existe na enum/validação de roles.
- Políticas (Pundit) atuais são majoritariamente “admin-only”.


### 3.3 Company User
Definição:
- `User.role == 'company'` e `user.company_id` presente.

Requisitos:
- Multi-tenant: só pode acessar dados da própria empresa.
- Gating por status:
  - `User.status == active` (já existe),
  - `approved_by_admin == true` (há método `approved_for_dashboard?`, mas o fluxo precisa ser consistente).

Gaps atuais:
- Alguns endpoints ignoram `company_id` no request e assumem `current_user.company` (ok para multi-tenant), mas o frontend envia `company_id` mesmo assim.
- Falta aplicar `authorize_feature!` consistentemente em tabs/funcionalidades (ex.: mídia, analytics avançado, exportação).

---

## 4) Funcionalidades do dashboard (escopo por usuário)

### 4.1 Company User — Dashboard da Empresa (MVP)
Funcionalidades (com dados reais):
- Cards principais (já existem no layout):
  - visualizações, cliques CTA, cliques WhatsApp, leads, reviews, rating médio, pendências, conversão.
- Gestão de dados da empresa:
  - editar informações → `PendingChange` (já existe no backend).
  - categorias → `PendingChange` (já existe).
  - mídias → upload via ActiveStorage → `PendingChange` (já existe endpoint `upload_media`).
- Notificações:
  - novas reviews, novos leads, aprovações.

O que falta para “dados reais” aqui:
- Tracking real de views/clicks/whatsapp.
- Persistir notificações e “read/unread” (ou adotar estratégia de “computed notifications” + client-side read state, com tradeoffs).
- Trocar “trend/change” mockado por cálculo com base no histórico (ex.: variação vs período anterior).


### 4.2 Super Admin / Admin Dashboard (global)
Funcionalidades:
- Visão global: empresas, produtos, leads, reviews, campanhas, receita.

Gaps atuais:
- `app\dashboard\page.tsx` está mockado.
- `Api::V1::DashboardController#stats` tem `monthly_revenue = 0` (placeholder) e deve ser conectado ao modelo de faturamento real.


### 4.3 Review User — painel de revisão
Funcionalidades:
- Fila de revisão:
  - reviews recentes,
  - pending changes pendentes,
  - conteúdo/campanhas para auditoria.

Gaps:
- não existe role nem endpoints dedicados.


### 4.4 Filtros e segmentação
Requisitos:
- Date range (ex.: 7/30/90 dias),
- por categoria,
- por cidade/estado,
- por canal (traffic source),
- por campanha.

Para suportar filtros, o backend deve expor endpoints que aceitam parâmetros e retornam agregações.


### 4.5 Exportação de relatórios
Requisitos:
- Exportar CSV (mínimo) e PDF (desejável):
  - histórico,
  - leads,
  - reviews,
  - performance de campanhas/banners.
- Execução assíncrona (Sidekiq) para relatórios grandes.
- Armazenar arquivo gerado em ActiveStorage + link expira.


### 4.6 Painel administrativo para Company Users (por plano)
Requisitos:
- Tabs/funcionalidades habilitadas por `plan_features`.
- O backend já tem `authorize_feature!` (ex.: `Api::V1::Dashboard::AnalyticsController`).

Gap:
- Garantir que **todas** as áreas sensíveis também validem plano no backend (não só no frontend).

---

## 5) Requisitos técnicos

### 5.1 Integração frontend-backend
Requisitos:
- Remover mocks do frontend e usar APIs reais:
  - `DashboardPage` (admin) deve usar `useDashboard()` → `GET /api/v1/dashboard/stats`.
- Padrão de erros:
  - 401/403 tratados com redirecionamento/login.
- Token JWT:
  - padronizar armazenamento e envio (hoje usa `localStorage('auth')`).


### 5.2 Autenticação e autorização
Requisitos:
- JWT obrigatório para rotas de dashboard.
- `role` + `company_id` + `status` + `approved_by_admin` como gates.
- Adicionar role `review` e implementar guard:
  - `require_role('admin', 'review')` para endpoints de revisão.


### 5.3 Cache
Requisitos:
- Cache para agregações (ex.: 1–5 minutos) + invalidação por evento.
- Usar Redis como backend de cache em produção.

Estado atual:
- já existem usos de `Rails.cache.fetch` e inicializadores de redis.


### 5.4 Monitoramento de uso e performance
Requisitos:
- Métricas:
  - tempo de resposta dos endpoints do dashboard,
  - volume de eventos de analytics,
  - jobs (Sidekiq) e filas.
- O projeto já tem `/metrics` (Yabeda Prometheus) e config de Scout APM.


### 5.5 Documentação técnica e do usuário
Requisitos:
- Doc técnica:
  - contratos de API (payloads),
  - modelo de dados de analytics,
  - fluxo de tempo real.
- Doc usuário:
  - como interpretar métricas,
  - como exportar,
  - como funciona aprovação (PendingChange).

---

## 6) O que falta (checklist objetivo para “ter isso de fato implementado”)

### 6.1 Remover mocks e plugar API real
- [ ] Frontend `app/dashboard/page.tsx`: remover `stats` mock, `Demo User`, e consumir `GET /api/v1/dashboard/stats`.
- [ ] Frontend: remover percentuais/tendências mockadas ou recalcular com base no histórico.

### 6.2 Tracking real de eventos (base para tempo real e histórico)
- [ ] Persistir eventos de `profile_view/cta_click/whatsapp_click/lead/review`.
  - Hoje: só banners têm tentativa de persistência, mas as tabelas não existem.
- [ ] Definir e implementar `analytics_events` + agregação `company_daily_stats`.

### 6.3 Substituir histórico/traffic mockados
- [ ] `CompaniesController#analytics_historical`: remover `rand()` e usar dados agregados reais.
- [ ] `CompaniesController#analytics_traffic`: remover hardcode e calcular com base em referrer/utm/events.

### 6.4 Tempo real (ActionCable)
- [ ] Implementar autenticação em `ApplicationCable::Connection` (JWT → current_user).
- [ ] Criar channel(s) e broadcasts para eventos relevantes.
- [ ] Frontend: client de websocket e update de state.

### 6.5 Usuários e permissões
- [ ] Adicionar role `review` e definir permissões/escopo.
- [ ] Decidir e documentar relação entre `AdminUser` (Super Admin) e `User.admin` (Admin via API).

### 6.6 Exportação
- [ ] Endpoints + jobs para geração de relatórios (CSV/PDF) com controle de acesso.

### 6.7 Testes e confiabilidade
- [ ] Testes unitários: services de stats/aggregations.
- [ ] Testes de integração: auth + autorização + multi-tenant.
- [ ] Teste de aceitação: fluxo Company User (cadastro → pending → aprovado → dashboard).

---

## 7) Plano de implementação (fases)

### Fase 1 — MVP Company Dashboard (dados reais básicos)
1) Tracking mínimo:
- armazenar `lead_created` (já existe lead) e `review_created`.
- implementar contadores/aggregations para `profile_view` e `cta_click`.
2) Substituir mocks em `analytics_historical` e `traffic` por dados reais (mesmo que inicialmente “best-effort”).
3) Garantir gates (active + approved).

Entrega: cards e gráficos com dados reais (7/30 dias), sem tempo real.


### Fase 2 — Tempo real + notificações consistentes
1) ActionCable + Redis.
2) Broadcast em criação de lead/review e aprovação de pending changes.
3) UI atualiza sem refresh.


### Fase 3 — Admin + Review User
1) Conectar `DashboardPage` (admin) ao endpoint real.
2) Implementar role `review` e endpoints/telas.


### Fase 4 — Exportação + observabilidade completa
1) CSV/PDF com jobs.
2) Métricas de performance/uso.

---

## 8) Cronograma sugerido (estimativa)
- Fase 1: 1–2 semanas
- Fase 2: 1 semana
- Fase 3: 1 semana
- Fase 4: 1 semana

Total: ~4–5 semanas (dependendo do nível de detalhe dos relatórios e do desenho de analytics).

---

## 9) Plano de testes
- Unit:
  - agregação diária,
  - cálculo de conversão,
  - políticas por role.
- Integração:
  - JWT,
  - multi-tenant (Company User não acessa outra empresa),
  - gates de status/aprovação.
- Aceitação:
  - fluxo end-to-end Company User.

---

## 10) Plano de rollback
- Feature flags por área (ex.: `analytics_v2`, `realtime_dashboard`).
- Deploy com migrações compatíveis (expand/contract):
  - adicionar tabelas/colunas sem quebrar leitura antiga,
  - depois mudar código,
  - depois remover legado.
- Possibilidade de desligar websockets (ActionCable) sem derrubar dashboard (fallback para polling).
