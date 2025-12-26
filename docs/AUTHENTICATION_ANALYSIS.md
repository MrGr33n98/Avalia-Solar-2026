# Análise técnica do sistema de autenticação (estado atual)

> Baseado na inspeção do repositório `Avalia-Solar-2026` (backend em `AB0-1-back`).

## 1) Tipos de usuários e permissões

### 1.1 “Usuários Revisores”

**Estado atual:** não existe um tipo/role explícito de “revisor” no backend.

- `User` (modelo `AB0-1-back\app\models\user.rb`) possui `role` limitado a: `user | admin | company`.
- A função de “review/moderação” está concentrada no **ActiveAdmin**, via `AdminUser`.

**Ações de review/moderação existentes (na prática, executadas por `AdminUser` no ActiveAdmin):**
- Aprovar/Rejeitar usuários: `AB0-1-back\app\admin\users.rb` (`member_action :approve` / `:reject`).
- Aprovar/Rejeitar banners: `AB0-1-back\app\admin\banners.rb` (`approve!`/`reject!` com `current_admin_user`).
- Aprovar/Rejeitar alterações pendentes: `PendingChange` com `approved_by: AdminUser` e painel em `AB0-1-back\app\admin\pending_changes.rb`.

**Dados acessíveis:** como não existe role “revisor”, qualquer `AdminUser` autenticado no ActiveAdmin tende a ter acesso amplo aos recursos.

**Restrição/segurança:** o ActiveAdmin usa Devise session para `AdminUser` e `ActiveAdmin::PunditAdapter`.

### 1.2 Usuários “Company” por plano (Starter / Professional / Growth)

**Estado atual:** existe mecanismo de planos e features (`Plan.features_json`), mas **não há** no código uma definição fixa de “Starter / Professional / Growth”. Logo, não é possível listar “exatamente” esses planos apenas via repositório — isso depende do conteúdo da tabela `plans` no banco (produção/staging).

**Como o gating funciona hoje:**
- `Company belongs_to :plan` (`AB0-1-back\app\models\company.rb`).
- Features vêm de `plan.features_json` via `Company#plan_features` e `Company#feature_enabled?`.

**Features que realmente controlam acesso no código (exemplos):**
- **Analytics (dashboard)**: `GET /api/v1/dashboard/analytics` bloqueia via `authorize_feature!('analytics')`.
  - Arquivos: `AB0-1-back\app\controllers\api\v1\dashboard\analytics_controller.rb` + `dashboard\base_controller.rb`.
- **Banners (company dashboard)**: endpoints `/api/v1/company_dashboard/banners` bloqueiam via `authorize_feature!('banners')`.
  - Arquivo: `AB0-1-back\app\controllers\api\v1\company_dashboard_banners_controller.rb`.
- **Limite de produtos**: controlador usa `company.max_products_limit` (lido de `features_json['max_products']`).

**Observação:** `Company#effective_plan_features` injeta `banners=true` caso existam `banner_subscriptions.active` (add-on).

### 1.3 Super Admin no ActiveAdmin

**Estado atual:** não há “Super Admin” separado. Qualquer `AdminUser` é tratado como admin pela `ApplicationPolicy`.

- Pundit default policy: `AB0-1-back\app\policies\application_policy.rb`.
- ActiveAdmin config: `AB0-1-back\config\initializers\active_admin.rb`.

## 2) Implementação dos módulos de autenticação

### 2.1 Login social

**Google OAuth2 (parcialmente implementado):**
- Config do provider: `AB0-1-back\config\initializers\devise.rb` (`config.omniauth :google_oauth2 ...`).
- Callback: `AB0-1-back\app\controllers\users\omniauth_callbacks_controller.rb`.
- Criação/atualização: `User.from_omniauth` em `AB0-1-back\app\models\user.rb`.

**Gap relevante:** o callback do OmniAuth usa `sign_in_and_redirect` (fluxo HTML/session). Já o frontend/API principal usa **JWT** (`/api/v1/auth/login`). Falta um “bridge” para retornar JWT após OAuth.

**LinkedIn:** não implementado.

### 2.2 Verificação por e-mail

- `User` tem `:confirmable` (`AB0-1-back\app\models\user.rb`).
- Rotas de confirmação: `POST /api/v1/auth/confirm_email` (`AB0-1-back\config\routes.rb`).
- Implementação: `User.confirm_by_token(token)` em `AB0-1-back\app\controllers\api\v1\auth_controller.rb`.

**Problema crítico identificado:**
- `EmailConfirmationJob` chama `UserMailer.email_confirmation(user, token)`, mas `UserMailer` não define `email_confirmation` (apenas `approval_email`/`rejection_email`).
  - Arquivos: `AB0-1-back\app\jobs\email_confirmation_job.rb` e `AB0-1-back\app\mailers\user_mailer.rb`.

### 2.3 Cadastro

- Endpoint: `POST /api/v1/auth/register` (também `signup` chama `register`).
- Regras: exige `terms_accepted`, valida complexidade de senha e maioridade (`User#password_complexity`, `adult_birthdate`).
- Aprovação: existe um “segundo gate” no dashboard: `approved_for_dashboard?` + `ensure_approved_user` no `Dashboard::BaseController`.

Documentação existente: `AB0-1-back\docs\authentication_flow.md`.

### 2.4 Redefinição de senha

- `POST /api/v1/auth/forgot_password` → `send_reset_password_instructions`.
- `POST /api/v1/auth/reset_password` → `User.reset_password_by_token`.
- Complexidade: validação custom em `User`.

**Proteção brute force:** Rack::Attack limita tentativas de login por IP/email.

### 2.5 2FA

**Não existe 2FA para `User`/`AdminUser`.**

Existe OTP apenas para o wizard de **Leads** (não é autenticação do usuário), com digest via BCrypt e TTL/tentativas.

## 3) Infraestrutura e segurança

### 3.1 Duas pilhas de autenticação em paralelo (complexidade)

1) **Devise session (cookies)**
- ActiveAdmin com `AdminUser`.
- Devise/OmniAuth para `User` (fluxos HTML).

2) **JWT para API**
- `Api::V1::BaseController` decodifica `Authorization: Bearer <jwt>` usando `Rails.application.secret_key_base`.
- `Api::V1::Dashboard::BaseController` tem lógica similar (duplicada).

### 3.2 Rate limiting e observabilidade

- Rack::Attack habilitado com throttles de login (`/api/v1/auth/login`) e logs de throttling.
  - Arquivo: `AB0-1-back\config\initializers\rack_attack.rb`.

**Inconsistência importante:** Rack::Attack decodifica JWT com `ENV['JWT_SECRET']`, mas a API emite/decodifica com `Rails.application.secret_key_base`. Isso pode quebrar o throttle “por usuário” autenticado.

### 3.3 LGPD (pontos observáveis no código)

- Leads possuem campos de consentimento (`consent_at`, `consent_ip`).
- Não há rotinas explícitas de retenção/expurgo/exportação no código analisado.

## 4) Checklist (MVP) recomendado

- Consolidar fluxo de login (Devise/OmniAuth vs JWT) e padronizar “fonte de verdade” do token.
- Definir roles do backoffice (ex.: revisor vs super admin) e aplicar policies granularmente.
- Corrigir confirmação de e-mail (job + mailer + templates) e definir TTL (`confirm_within`).
- Revisar inconsistências de roles (`company_admin` citado em controller, mas não existe no enum).
- Implementar trilhas de auditoria para eventos de auth (login fail/success, reset, confirm, admin approvals).
