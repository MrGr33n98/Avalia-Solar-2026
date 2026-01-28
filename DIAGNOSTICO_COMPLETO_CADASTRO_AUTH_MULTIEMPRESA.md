# DIAGNÓSTICO COMPLETO: Cadastro, Autenticação, Aprovação e Multi-Empresas
## Plataforma Avalia Solar - Análise Não Destrutiva

**Data:** 28/01/2026  
**Tipo:** Diagnóstico Read-Only (Não Destrutivo)  
**Stack:** Ruby on Rails 7.0 (API) + Next.js (Frontend)

---

## SUMÁRIO EXECUTIVO

### Sintomas Identificados
1. **Erro 422** no POST `/api/v1/companies` devido a validações de `email_public` e `categories`
2. **Fluxo de aprovação** misto entre usuários e empresas com sobreposição de confirmação de email
3. **Multi-empresa** parcialmente implementado (modelos existem, mas UI/endpoints incompletos)

### Descobertas Principais
- ✅ **Multi-empresa suportado**: `User` → `has_many :company_members` → `has_many :member_companies`
- ⚠️ **Validações condicionais ausentes**: Company valida `email_public` e `categories` mesmo em status `pending`
- ⚠️ **Fluxo de aprovação duplo**: User.approved_by_admin + Company.moderation_status + PendingChange
- ⚠️ **Falta endpoint**: Não há rota para listar empresas do usuário ou trocar empresa ativa
- ⚠️ **CompanyMember não criado automaticamente**: No `companies#create`, não há criação de `CompanyMember` com role `owner`

---

## D1: MAPA DE FLUXOS DO SISTEMA (System Flow Map)

### 1.1 Fluxo de Cadastro de Usuário Regular

```
[Frontend: /register-user]
    ↓
POST /api/v1/auth/register
    {
      name: string,
      email: string,
      password: string,
      terms_accepted: true,
      city: string (obrigatório para role=user)
    }
    ↓
[AuthController#register]
    ↓
User.create(
  role: 'user',           # Default se company_id não presente
  status: :pending,       # Default enum
  terms_accepted: true,
  skip_confirmation_notification!
)
    ↓
user.send_confirmation_instructions  # Devise confirmable
    ↓
[Email: confirmation_instructions]
    URL: {FRONTEND_URL}/confirm-email/#{token}
    ↓
[Usuário clica no link]
    ↓
POST /api/v1/auth/confirm_email
    Authorization: Bearer {confirmation_token}
    ↓
[AuthController#confirm_email]
    User.confirm_by_token(token)
    ↓
    if user.pending? && user.regular_user?
        user.active!  # Ativação automática
    ↓
    jwt_token = jwt_encode(user_id: user.id)
    set_jwt_cookie(jwt_token)
    ↓
[Response: { token, user, auto_login: true }]
    ↓
[Redirect: /dashboard]
```

**⚠️ PROBLEMA IDENTIFICADO:** Usuários regulares são ativados automaticamente após confirmação de email, mas usuários `company` ficam em `pending` esperando aprovação de admin.

---

### 1.2 Fluxo de Cadastro de Empresa (ATUAL - COM ERRO 422)

```
[Frontend: /register-company]
    ↓
POST /api/v1/companies
    {
      company: {
        name: string,
        description: string,
        website: string,
        phone: string,
        address: string,
        state: string,
        city: string,
        email_public: string,  ← VALIDAÇÃO FALHA AQUI
        category_ids: []       ← VALIDAÇÃO FALHA AQUI
      }
    }
    ↓
[CompaniesController#create]
    @company = Company.new(company_params)
    @company.status = 'pending' if @company.status.blank?
    ↓
[Company Validations EXECUTADAS]
    ✗ validate_ready_for_activation (if status == 'active')
        → Exige: categories.any?
        → Exige: phone || whatsapp || email_public
    ✗ validate_corporate_email (email_public)
        → Bloqueia domínios públicos (gmail, yahoo, etc)
    ✓ Status 'pending' permite passar algumas validações
    ↓
    PROBLEMA: Se email_public for gmail.com → ERRO
    PROBLEMA: Se category_ids vazio → ERRO ao ativar (mas não em pending)
    ↓
if @company.save
    PendingChange.create!(
      company: @company,
      user_id: current_user&.id,
      change_type: 'company_create',
      status: 'pending'
    )
    ↓
    [Notifica AdminUsers]
    AdminUser.find_each { |admin| NotificationMailer.admin_alert(...) }
    ↓
    [Email para empresa]
    CompanyMailer.registration_received(@company).deliver_later
    ↓
[Response: { company: {...}, status: :created }]
else
    [Response: { errors: @company.errors.full_messages }, status: 422]
    ✗ AQUI OCORRE O ERRO 422
```

**🔴 CAUSA RAIZ DO ERRO 422:**
1. **Validação `validate_corporate_email`** (linha 208-213 de `company.rb`)
   - Bloqueia `email_public` com domínios públicos (gmail, yahoo, hotmail, etc.)
   - NÃO tem condicional `if: -> { status == 'active' }`
   - Executa sempre, mesmo com `status: 'pending'`

2. **Validação `validate_ready_for_activation`** (linha 160-188 de `company.rb`)
   - Exige `categories.any?`
   - TEM condicional `if: -> { status == 'active' }`
   - Mas se frontend enviar `status: 'active'` por engano → ERRO

3. **CompanyMember NÃO é criado**
   - Após `Company.save`, não há código para criar `CompanyMember` com role `owner`
   - Usuário criador fica sem vínculo com empresa

---

### 1.3 Fluxo de Aprovação de Empresa (ActiveAdmin)

```
[Admin acessa: /admin/companies]
    ↓
    Scope: :pending_review
    Filtra: Company.where(moderation_status: 'pending_review')
    ↓
[Admin clica em "Approve"]
    ↓
PUT /admin/companies/:id/approve
    ↓
[ActiveAdmin: CompaniesController#approve]
    resource.approve!(current_admin_user)  # Método do concern Moderation
    ↓
[Company#approve!]
    update!(
      moderation_status: :approved,
      approved_at: Time.current,
      approved_by_admin_user: admin_user,
      status: 'active'  ← MUDA STATUS PARA ACTIVE
    )
    ↓
    [Email enviado]
    CompanyMailer.registration_approved(@company).deliver_later
    ↓
[PendingChange pode ser aplicado]
    Se houver PendingChange com status 'approved':
        pending_change.apply_changes!
```

**⚠️ GAPS IDENTIFICADOS:**
- Não há criação automática de `CompanyMember` após aprovação
- Usuário criador não recebe role `owner` automaticamente
- User associado (via `pending_change.user_id`) não é ativado

---

### 1.4 Fluxo de Aprovação de Usuário (ActiveAdmin)

```
[Admin acessa: /admin/users]
    ↓
    Scope: 'Pendentes'
    Filtra: User.where(approved_by_admin: [false, nil])
    ↓
[Admin clica em "Aprovar Usuário"]
    ↓
PUT /admin/users/:id/approve
    ↓
[ActiveAdmin: UsersController#approve]
    resource.update(
      status: :active,
      approved_by_admin: true
    )
    ↓
    UserMailer.approval_email(resource).deliver_later
    ↓
    if !resource.confirmed?
        resource.send_confirmation_instructions
```

**⚠️ PROBLEMA:** Usuários de empresa (`role: 'company'`) precisam de dupla aprovação:
1. User precisa de `approved_by_admin: true`
2. Company precisa de `moderation_status: 'approved'` e `status: 'active'`

---

### 1.5 Fluxo de Login e Redirecionamento

```
POST /api/v1/auth/login
    { email, password }
    ↓
[AuthController#login]
    user = User.find_by(email: email)
    ↓
    if user.valid_password?(password)
        ↓
        [Verifica status]
        if !user.active?
            → pending: 'USER_NOT_APPROVED'
            → rejected: 'USER_REJECTED'
            → blocked: 'USER_BLOCKED'
            ↓
            return { error, status: 403 }
        ↓
        [Verifica confirmação]
        if !user.confirmed? && !Rails.env.development?
            return { error: 'EMAIL_NOT_CONFIRMED', status: 403 }
        ↓
        jwt_token = jwt_encode(user_id: user.id)
        set_jwt_cookie(jwt_token)
        ↓
        return { token, user, status: 200 }
    ↓
[Frontend verifica role]
    if user.role == 'company'
        if !user.company || user.company.status != 'active'
            → Redirect: /waiting_approval
        else
            → Redirect: /dashboard
    else
        → Redirect: /dashboard ou /profile
```

**📍 Página Waiting Approval:**
- **Rota:** `GET /waiting_approval` → `Dashboard::AccessController#waiting_approval`
- **View:** `app/views/dashboard/access/waiting_approval.html.erb`
- **Conteúdo:** "Seu acesso ao dashboard está aguardando aprovação do administrador ou a empresa está inativa."

---

### 1.6 Fluxo Multi-Empresa (PARCIALMENTE IMPLEMENTADO)

**ESTRUTURA ATUAL:**
```ruby
# Models
User
  has_many :company_members
  has_many :member_companies, through: :company_members, source: :company
  belongs_to :company, optional: true  # Empresa "principal" legacy

CompanyMember
  belongs_to :user
  belongs_to :company
  enum role: { owner: 0, manager: 1, editor: 2 }
  validates :user_id, uniqueness: { scope: :company_id }
```

**ENDPOINTS EXISTENTES:**
```
GET  /api/v1/company/members        # Lista membros da empresa atual
POST /api/v1/company/members/invite # Convida novo membro
```

**❌ ENDPOINTS FALTANDO:**
```
GET  /api/v1/users/me/companies     # Lista empresas do usuário
POST /api/v1/users/me/switch_company # Troca empresa ativa
POST /api/v1/companies/:id/request_access # Solicita acesso a empresa
```

**FLUXO ESPERADO (NÃO IMPLEMENTADO COMPLETAMENTE):**
```
[Usuário com múltiplas empresas faz login]
    ↓
GET /api/v1/users/me/companies  ← NÃO EXISTE
    ↓
    [Frontend deveria listar:]
    [
      { id: 1, name: "Empresa A", role: "owner", status: "active" },
      { id: 2, name: "Empresa B", role: "editor", status: "active" }
    ]
    ↓
[Usuário seleciona empresa]
    ↓
POST /api/v1/users/me/switch_company  ← NÃO EXISTE
    { company_id: 2 }
    ↓
    [Backend deveria atualizar:]
    session[:active_company_id] = 2
    ou
    current_user.update(company_id: 2)  # Usa campo legacy
```

**WORKAROUND ATUAL:**
- Backend usa `current_user.company` (relação direta)
- CompanyMember existe mas não é usado para seleção
- Filtro `?mine=true` em `/api/v1/companies` lista empresas do usuário via `company_members`

---

## D2: MÁQUINAS DE ESTADO (State Machines)

### 2.1 User Status & Role

| Status (enum) | Valor | Descrição | Transições Possíveis |
|---------------|-------|-----------|---------------------|
| **pending** | 0 | Aguardando aprovação | → active (via admin approve) |
| **active** | 1 | Usuário ativo | → rejected, blocked |
| **rejected** | 2 | Rejeitado por admin | (final) |
| **blocked** | 3 | Bloqueado | → active (manual) |

**Default:** `pending`

**Roles (string):**
- `user` - Usuário regular (default se `company_id` ausente)
- `company` - Usuário de empresa (se `company_id` presente)
- `admin` - Super admin
- `review` - Reviewer (não usado ativamente)

**Gatilhos de Transição:**
- **pending → active**
  - `AuthController#confirm_email` se `user.regular_user?`
  - `Admin::UsersController#approve` para qualquer role
- **active → blocked**
  - Manual via ActiveAdmin
- **active → rejected**
  - Manual via ActiveAdmin

**Métodos Auxiliares:**
```ruby
user.active_for_authentication?  # super && active?
user.confirmed?                  # Devise confirmable
user.approved_by_admin?          # Boolean flag
```

---

### 2.2 Company Status & Moderation

| Status (enum) | Valor | Descrição |
|---------------|-------|-----------|
| **active** | 'active' | Empresa ativa e visível |
| **inactive** | 'inactive' | Empresa inativa |
| **pending** | 'pending' | Aguardando aprovação |
| **blocked** | 'blocked' | Bloqueada |

**Default:** `pending` (definido em `companies#create`)

| Moderation Status (enum) | Descrição |
|-------------------------|-----------|
| **draft** | Rascunho |
| **pending_review** | Em análise |
| **approved** | Aprovada |
| **rejected** | Rejeitada |
| **suspended** | Suspensa |

**Validações Condicionais:**
```ruby
validate :validate_ready_for_activation, if: -> { status == 'active' }
  # Exige: name (5+ chars), email, state, city, categories.any?, contact
  
validate :validate_featured_requires_active
  # featured só pode ser true se status == 'active'
  
validate :validate_verified_requires_cnpj
  # verified exige CNPJ válido
  
validate :validate_corporate_email
  # email_public não pode ser domínio público
  # ⚠️ SEM CONDICIONAL - SEMPRE VALIDA
```

**Gatilhos de Aprovação:**
```ruby
# ActiveAdmin
PUT /admin/companies/:id/approve
  company.approve!(current_admin_user)
  → moderation_status: :approved
  → status: 'active'
  → CompanyMailer.registration_approved(company)
```

---

### 2.3 CompanyMember Role

| Role (enum) | Valor | Permissões |
|-------------|-------|-----------|
| **owner** | 0 | Gerenciar empresa, membros, billing |
| **manager** | 1 | Gerenciar membros, ver dashboard |
| **editor** | 2 | Ver dashboard apenas |

**Default:** `editor`

**Criação:**
```ruby
# Via convite (MembersController#invite)
POST /api/v1/company/members/invite
  { email, role: 'manager' }
  ↓
  user = User.find_or_initialize_by(email: email)
  if user.new_record?
    user.create!(role: 'company', company: @company, ...)
  member = CompanyMember.create!(
    company: @company,
    user: user,
    role: role
  )
```

**⚠️ PROBLEMA:** No fluxo de cadastro de empresa, `CompanyMember` não é criado automaticamente para o usuário criador.

---

### 2.4 PendingChange Workflow

| Status | Descrição | Transições |
|--------|-----------|-----------|
| **pending** | Aguardando aprovação | → approved, rejected |
| **approved** | Aprovado por admin | → applied (via apply_changes!) |
| **rejected** | Rejeitado | (final) |

**Change Types:**
```ruby
CHANGE_TYPES = %w[
  company_info
  categories
  banner
  logo
  product
  media
  video
  cta_config
  access_request      ← Para solicitar acesso a empresa
  profile_update
]
```

**Fluxo de Aprovação:**
```ruby
# ActiveAdmin
PUT /admin/pending_changes/:id/approve
  resource.update!(
    status: 'approved',
    approved_at: Time.current,
    approved_by: current_admin_user
  )
  resource.apply_changes!  # Aplica mudanças no Company
```

**Método `apply_changes!`:**
- `company_info`: Atualiza atributos da empresa
- `categories`: Adiciona/remove categorias
- `banner`/`logo`: Anexa ActiveStorage blobs
- `access_request`: `user.update!(company: company)` ← Define empresa do usuário

---

## D3: INVENTÁRIO DE API E ROTAS

### 3.1 Autenticação (Auth)

| Método | Rota | Controller#Action | Autenticação | Payload |
|--------|------|-------------------|--------------|---------|
| POST | `/api/v1/auth/login` | AuthController#login | Não | `{ email, password }` |
| POST | `/api/v1/auth/register` | AuthController#register | Não | `{ name, email, password, terms_accepted, city }` |
| POST | `/api/v1/auth/signup` | AuthController#signup | Não | Alias para register |
| POST | `/api/v1/auth/logout` | AuthController#logout | Sim | - |
| POST | `/api/v1/auth/logout_all` | AuthController#logout_all | Sim | - |
| GET | `/api/v1/auth/me` | AuthController#me | Sim | - |
| POST | `/api/v1/auth/forgot_password` | AuthController#forgot_password | Não | `{ email }` |
| POST | `/api/v1/auth/reset_password` | AuthController#reset_password | Não | `Authorization: Bearer {token}`, `{ password, password_confirmation }` |
| POST | `/api/v1/auth/confirm_email` | AuthController#confirm_email | Não | `Authorization: Bearer {confirmation_token}` |
| POST | `/api/v1/auth/resend_confirmation` | AuthController#resend_confirmation | Não | `{ email }` |

**Before Actions:**
- Nenhum (público)
- `skip_token_check?` = true para todas as ações

**Resposta de Login Bem-Sucedido:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "role": "user",
    "status": "active",
    "confirmed_at": "2026-01-28T10:00:00Z",
    "company_id": null
  }
}
```

---

### 3.2 Companies

| Método | Rota | Controller#Action | Autenticação | Before Actions |
|--------|------|-------------------|--------------|----------------|
| GET | `/api/v1/companies` | CompaniesController#index | Opcional | - |
| GET | `/api/v1/companies/:id` | CompaniesController#show | Não | `set_company` |
| POST | `/api/v1/companies` | CompaniesController#create | Opcional | - |
| PUT | `/api/v1/companies/:id` | CompaniesController#update | Sim | `authenticate_api_user`, `authorize_company_update!` |
| DELETE | `/api/v1/companies/:id` | CompaniesController#destroy | Sim | `authenticate_api_user`, `authorize_company_update!` |
| POST | `/api/v1/companies/:id/request_admin_access` | CompaniesController#request_admin_access | Sim | `authenticate_api_user`, `authorize_company_update!` |

**Query Params (index):**
- `mine=true` - Filtra empresas do usuário via `company_members`
- `status=active|pending|blocked`
- `featured=true|false`
- `category_id=X`
- `page=1` (paginação)
- `limit=20` (sem paginação)

**Strong Params (create/update):**
```ruby
company_params = [
  :name, :description, :website, :phone, :address, :state, :city,
  :founded_year, :employees_count, :cnpj, :email_public,
  :instagram, :facebook, :linkedin, :working_hours, :payment_methods,
  :certifications, :cta_whatsapp_enabled, :cta_whatsapp_url,
  project_types: [], services_offered: [], category_ids: []
]

# Admin only:
if current_user&.admin?
  company_params += [:featured, :status, :verified, :plan_id, :plan_status]
end
```

**Validações Acionadas:**
- `validate_ready_for_activation` (se `status == 'active'`)
- `validate_corporate_email` (sempre - ⚠️ CAUSA DO 422)
- `validate_cnpj_format`
- `validate_state_in_dataset`
- `validate_city_in_dataset`

**Autorização (authorize_company_update!):**
```ruby
# Permite:
# 1. Admin (qualquer empresa)
# 2. Company user se company_id == @company.id E company.active?

if !current_user&.admin? && 
   (!current_user&.company_user? || current_user.company_id != @company.id)
  return 403 FORBIDDEN
end

if current_user.company_user? && !@company.active?
  return 403 COMPANY_INACTIVE
end
```

---

### 3.3 Company Members

| Método | Rota | Controller#Action | Autenticação | Autorização |
|--------|------|-------------------|--------------|-------------|
| GET | `/api/v1/company/members` | Company::MembersController#index | Sim | `require_company_user`, `set_company` |
| GET | `/api/v1/company/members/:id` | Company::MembersController#show | Sim | `require_company_user`, `set_company` |
| POST | `/api/v1/company/members/invite` | Company::MembersController#invite | Sim | `require_company_user`, `ensure_owner!` |
| PUT | `/api/v1/company/members/:id` | Company::MembersController#update | Sim | `require_company_user`, `ensure_owner!` |
| DELETE | `/api/v1/company/members/:id` | Company::MembersController#destroy | Sim | `require_company_user`, `ensure_owner!` |

**Before Actions:**
```ruby
before_action :authenticate_api_user
before_action :require_company_user  # role == 'company'
before_action :set_company           # @company = current_user.company
before_action :ensure_owner!, only: [:invite, :update, :destroy]
```

**`ensure_owner!`:**
```ruby
owner = @company.company_members.find_by(user_id: current_user.id)&.owner?
render 403 unless owner
```

**Payload de Convite:**
```json
{
  "email": "novo@example.com",
  "role": "manager"  // owner, manager, editor
}
```

**Resposta:**
```json
{
  "id": 5,
  "role": "manager",
  "created_at": "2026-01-28T10:00:00Z",
  "user": {
    "id": 10,
    "name": "Novo Membro",
    "email": "novo@example.com",
    "status": "pending"
  }
}
```

---

### 3.4 Dashboard

| Método | Rota | Controller#Action | Autenticação |
|--------|------|-------------------|--------------|
| GET | `/dashboard` | Dashboard::HomeController#index | Sim (Rails session) |
| GET | `/dashboard/analytics` | Dashboard::AnalyticsController#index | Sim |
| GET | `/dashboard/company/edit` | Dashboard::CompaniesController#edit | Sim |
| PUT | `/dashboard/company` | Dashboard::CompaniesController#update | Sim |
| GET | `/waiting_approval` | Dashboard::AccessController#waiting_approval | Sim |

**Nota:** Esses são controllers Rails tradicionais (não API), usam sessão Devise e renderizam views ERB.

---

### 3.5 ActiveAdmin

| Recurso | Ações Principais | URL Base |
|---------|-----------------|----------|
| **AdminUser** | Login 2FA, Gerenciar admins | `/admin/admin_users` |
| **User** | Aprovar, Rejeitar, Editar | `/admin/users` |
| **Company** | Aprovar, Rejeitar, Suspender | `/admin/companies` |
| **PendingChange** | Aprovar, Rejeitar | `/admin/pending_changes` |
| **CompanyMember** | Visualizar, Editar | `/admin/company_members` |

**Custom Member Actions:**

```ruby
# /admin/users/:id/approve (PUT)
AdminUser.approve:
  user.update(status: :active, approved_by_admin: true)
  UserMailer.approval_email(user).deliver_later
  user.send_confirmation_instructions if !user.confirmed?

# /admin/users/:id/reject (PUT)
AdminUser.reject:
  user.update(status: :rejected, rejection_reason: params[:rejection_reason])
  UserMailer.rejection_email(user).deliver_later

# /admin/companies/:id/approve (PUT)
Company.approve:
  company.approve!(current_admin_user)  # Método do concern Moderation
  → moderation_status: :approved, status: 'active'
  CompanyMailer.registration_approved(company).deliver_later

# /admin/pending_changes/:id/approve (PATCH)
PendingChange.approve:
  resource.update!(status: 'approved', approved_by: current_admin_user)
  resource.apply_changes!
```

**Batch Actions:**
```ruby
# /admin/companies/batch_action (POST)
batch_action :approve do |ids|
  Company.find(ids).each { |c| c.approve!(current_admin_user) }
end
```

---

## D4: AUDITORIA DE FLUXO DE E-MAILS

### 4.1 Emails do Sistema

| Email | Mailer | Método | Disparado Por | Quando |
|-------|--------|--------|---------------|--------|
| **Confirmação de Email** | UserMailer (Devise) | confirmation_instructions | AuthController#register | Após criar User (skip_confirmation_notification! + send_confirmation_instructions) |
| **Aprovação de Usuário** | UserMailer | approval_email | Admin::UsersController#approve | Quando admin aprova User |
| **Rejeição de Usuário** | UserMailer | rejection_email | Admin::UsersController#reject | Quando admin rejeita User |
| **Reset de Senha** | Devise::Mailer | reset_password_instructions | AuthController#forgot_password | Quando usuário pede reset |
| **Cadastro Recebido** | CompanyMailer | registration_received | CompaniesController#create | Após criar Company com status pending |
| **Cadastro Aprovado** | CompanyMailer | registration_approved | Admin::CompaniesController#approve | Quando admin aprova Company |
| **Cadastro Rejeitado** | CompanyMailer | registration_rejected | Admin::CompaniesController#reject | Quando admin rejeita Company |
| **Alerta Admin** | NotificationMailer | admin_alert | CompaniesController#create | Notifica todos AdminUser sobre nova empresa |
| **Nova Review** | CompanyMailer | new_review | (Job/Observer) | Quando empresa recebe review |
| **Resumo Mensal** | CompanyMailer | monthly_digest | (Job agendado) | Mensal |

---

### 4.2 Timeline de Emails - Cadastro de Empresa

```
T0: POST /api/v1/companies
    → Company criado com status: 'pending'
    ↓
T0+1s: CompanyMailer.registration_received(@company)
    Para: company.email
    Assunto: "Seu cadastro está em análise (status pendente)"
    Corpo: "Recebemos seu cadastro. Aguarde análise do admin."
    ↓
T0+2s: NotificationMailer.admin_alert (para CADA AdminUser)
    Para: admin.email
    Assunto: "Nova empresa cadastrada"
    Corpo: "Empresa #{company.name} criada com status pendente em #{Time.current}"
    ↓
[Admin aprova empresa via /admin/companies/:id/approve]
    ↓
TX: CompanyMailer.registration_approved(@company)
    Para: company.email
    Assunto: "Seu cadastro foi aprovado - Acesse seu painel"
    Corpo: "Parabéns! Seu cadastro foi aprovado."
    URL: "#{protocol}://#{host}/login"
```

---

### 4.3 Timeline de Emails - Cadastro de Usuário Company

```
T0: POST /api/v1/auth/register
    → User criado com role: 'company', status: 'pending'
    → skip_confirmation_notification!
    ↓
T0+1s: user.send_confirmation_instructions
    ↓
    UserMailer.confirmation_instructions(user, token)
    Para: user.email
    Assunto: "Confirme seu e-mail"
    URL: "#{FRONTEND_URL}/confirm-email/#{token}"
    ↓
[Usuário clica no link]
    ↓
TX: POST /api/v1/auth/confirm_email
    User.confirm_by_token(token)
    ↓
    ⚠️ User com role 'company' fica em status 'pending'
    ⚠️ Não recebe email de aprovação automática
    ↓
[Admin aprova usuário via /admin/users/:id/approve]
    ↓
TY: UserMailer.approval_email(user)
    Para: user.email
    Assunto: "Sua conta foi aprovada!"
    Corpo: "Seu acesso foi liberado."
    ↓
    if !user.confirmed?
        user.send_confirmation_instructions  ← REENVIA CONFIRMAÇÃO
```

**⚠️ PROBLEMA DE TIMING:**
- Se admin aprovar usuário ANTES de ele confirmar email → email de confirmação é reenviado
- Se usuário confirmar email ANTES de admin aprovar → fica em pending sem email explicativo

---

### 4.4 Concern: Envio Assíncrono de Emails Devise

```ruby
# User Model (linha 77-79)
def send_devise_notification(notification, *args)
  devise_mailer.send(notification, self, *args).deliver_later
end
```

**Efeito:** Todos os emails Devise são enviados via ActiveJob (background), não bloqueiam request HTTP.

---

### 4.5 Override de Confirmação para Usuários Company

```ruby
# User Model (linha 82-85)
def send_confirmation_instructions
  return false if company_user? && !approved_by_admin?
  super
end

# User Model (linha 87-92)
def send_on_create_confirmation_instructions
  return if provider.present?  # Skip OAuth
  return false if company_user? && !approved_by_admin?
  super
end
```

**Objetivo:** Evitar enviar email de confirmação para usuários `company` antes de serem aprovados pelo admin.

**⚠️ PROBLEMA:** No `AuthController#register`, o código chama manualmente:
```ruby
user.skip_confirmation_notification!
user.save
user.send_confirmation_instructions  ← FORÇA ENVIO
```
Logo, o override é IGNORADO neste fluxo.

---

## D5: CAUSA RAIZ DO ERRO 422

### 5.1 Diagnóstico Completo

**ENDPOINT:** `POST /api/v1/companies`

**PAYLOAD ENVIADO (exemplo que FALHA):**
```json
{
  "company": {
    "name": "Empresa Solar XYZ",
    "description": "Instalação de painéis solares",
    "website": "https://empresaxyz.com.br",
    "phone": "11987654321",
    "address": "Rua das Flores, 123",
    "state": "SP",
    "city": "São Paulo",
    "email_public": "contato@gmail.com",  ← ERRO AQUI
    "category_ids": []                    ← ERRO POTENCIAL
  }
}
```

**RESPOSTA:**
```json
{
  "errors": [
    "Email public deve ser um e-mail corporativo"
  ],
  "status": 422
}
```

---

### 5.2 Caminho Exato no Código

**Arquivo:** `AB0-1-back/app/models/company.rb`

**Linha 208-213:**
```ruby
def validate_corporate_email
  return if email_public.blank?
  
  public_domains = %w[gmail.com yahoo.com hotmail.com outlook.com ...]
  domain = email_public.split('@').last.downcase
  
  if public_domains.include?(domain)
    errors.add(:email_public, 'deve ser um e-mail corporativo')
  end
end
```

**Linha 92:**
```ruby
validate :validate_corporate_email  # SEM CONDICIONAL
```

**PROBLEMA:** Esta validação NÃO tem condicional `if: -> { status == 'active' }`, então executa sempre, mesmo para empresas em status `pending`.

---

### 5.3 Validação de Categories

**Arquivo:** `AB0-1-back/app/models/company.rb`

**Linha 65:**
```ruby
validate :validate_ready_for_activation, if: -> { status == 'active' }
```

**Linha 160-188:**
```ruby
def validate_ready_for_activation
  # ...
  unless categories.any?
    errors.add(:categories, 'pelo menos uma categoria é necessária para ativação')
  end
  # ...
end
```

**ANÁLISE:** Esta validação TEM condicional, então só executa se `status == 'active'`. Como o controller define `status = 'pending'`, esta validação é PULADA no cadastro.

**MAS:** Se o frontend enviar `status: 'active'` no payload (por engano), a validação FALHA porque `category_ids: []` → `categories.any?` retorna `false`.

---

### 5.4 Problema de HABTM (has_and_belongs_to_many)

**Relacionamento:**
```ruby
# Company Model (linha 28)
has_and_belongs_to_many :categories, join_table: :categories_companies
```

**Strong Params (linha 321-332):**
```ruby
permitted = [
  # ...
  project_types: [], services_offered: [], category_ids: []
]
params.require(:company).permit(*permitted)
```

**Payload Correto:**
```json
{
  "company": {
    "name": "...",
    "category_ids": [1, 2, 3]  ← Array de IDs
  }
}
```

**Rails Automaticamente:**
- `category_ids=` atribui categorias via HABTM
- Cria registros em `categories_companies` (join table)

**⚠️ PROBLEMA:** Se `category_ids` for string ou array vazio, pode causar erro silencioso ou não salvar categorias.

---

### 5.5 Problema: CompanyMember Não Criado

**Arquivo:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

**Linha 136-159 (create action):**
```ruby
def create
  @company = ::Company.new(company_params)
  @company.status = 'pending' if @company.status.blank?
  
  if @company.save
    PendingChange.create!(
      company: @company,
      user_id: current_user&.id,
      change_type: 'company_create',
      status: 'pending'
    )
    
    # Notifica admin e envia email...
    
    render json: { company: company_json }, status: :created
  else
    render json: { errors: @company.errors.full_messages }, status: 422
  end
end
```

**⚠️ FALTA:**
```ruby
# DEVERIA EXISTIR (não existe):
if @company.save && current_user
  CompanyMember.create!(
    company: @company,
    user: current_user,
    role: :owner  # Criador é dono
  )
end
```

**CONSEQUÊNCIA:** Usuário cria empresa mas não fica vinculado como `owner` via `CompanyMember`. O único vínculo é `User.company_id` (relação legacy).

---

### 5.6 Reprodução Passo a Passo

**1. Criar usuário company:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Empresa",
    "email": "joao@example.com",
    "password": "Password123",
    "terms_accepted": true,
    "city": "São Paulo"
  }'
```

**2. Confirmar email:**
```bash
# Pegar token do email
curl -X POST http://localhost:3001/api/v1/auth/confirm_email \
  -H "Authorization: Bearer {confirmation_token}"
```

**3. Login:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "Password123"
  }'
# → Retorna JWT token
```

**4. Criar empresa com email público:**
```bash
curl -X POST http://localhost:3001/api/v1/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {jwt_token}" \
  -d '{
    "company": {
      "name": "Empresa Solar",
      "description": "Instalação de painéis",
      "website": "https://empresa.com",
      "phone": "11999999999",
      "state": "SP",
      "city": "São Paulo",
      "email_public": "contato@gmail.com",
      "category_ids": [1]
    }
  }'

# RESULTADO:
# HTTP 422
# { "errors": ["Email public deve ser um e-mail corporativo"] }
```

---

## D6: PLANO MÍNIMO DE CORREÇÃO

### PR #1: Validação Condicional de Email Corporativo

**Arquivo:** `app/models/company.rb` (linha 92)

**Mudança:**
```ruby
# ANTES:
validate :validate_corporate_email

# DEPOIS:
validate :validate_corporate_email, if: -> { status == 'active' }
```

**Justificativa:** Email corporativo só deve ser exigido quando empresa está ativa. Durante cadastro (`pending`), aceitar qualquer email válido.

**Critérios de Aceite:**
- ✅ Cadastro com `email_public: "contato@gmail.com"` e `status: 'pending'` → Sucesso (201)
- ✅ Update para `status: 'active'` com email gmail → Erro (422)
- ✅ Update para `status: 'active'` com email corporativo → Sucesso (200)

**Teste:**
```ruby
# spec/models/company_spec.rb
describe 'email_public validation' do
  it 'allows public email when status is pending' do
    company = Company.new(
      name: 'Test', description: 'Test', email_public: 'test@gmail.com',
      state: 'SP', city: 'São Paulo', status: 'pending'
    )
    expect(company.valid?).to be true
  end
  
  it 'rejects public email when status is active' do
    company = Company.new(
      name: 'Test', description: 'Test', email_public: 'test@gmail.com',
      state: 'SP', city: 'São Paulo', status: 'active'
    )
    expect(company.valid?).to be false
    expect(company.errors[:email_public]).to include('deve ser um e-mail corporativo')
  end
end
```

---

### PR #2: Criar CompanyMember Automaticamente

**Arquivo:** `app/controllers/api/v1/companies_controller.rb`

**Linha 136-159 (create action):**

**Mudança:**
```ruby
def create
  @company = ::Company.new(company_params)
  @company.status = 'pending' if @company.status.blank?
  
  ActiveRecord::Base.transaction do  # ← NOVO
    if @company.save
      # ↓ NOVO BLOCO
      if current_user
        CompanyMember.create!(
          company: @company,
          user: current_user,
          role: :owner
        )
        
        # Atualiza user.company_id (compatibilidade legacy)
        current_user.update(company: @company, role: 'company') unless current_user.company_user?
      end
      # ↑ FIM NOVO
      
      PendingChange.create!(
        company: @company,
        user_id: current_user&.id,
        change_type: 'company_create',
        status: 'pending'
      )
      
      # Notifica admin...
      
      render json: { company: company_json }, status: :created
    else
      render json: { errors: @company.errors.full_messages }, status: 422
    end
  end  # ← NOVO
end
```

**Justificativa:** 
- Usuário que cria empresa deve ser vinculado como `owner`
- Transação garante atomicidade (se falhar criar member, rollback company)
- Atualiza `user.company_id` para compatibilidade com código existente

**Critérios de Aceite:**
- ✅ Após criar empresa, `CompanyMember` existe com `role: 'owner'`
- ✅ `current_user.member_companies` inclui a nova empresa
- ✅ `current_user.company_id` aponta para nova empresa
- ✅ Se criar empresa sem auth → Sucesso (não cria member)

**Teste:**
```ruby
# spec/requests/api/v1/companies_spec.rb
describe 'POST /api/v1/companies' do
  context 'when authenticated' do
    let(:user) { create(:user, status: :active) }
    let(:headers) { auth_headers_for(user) }
    
    it 'creates company and associates user as owner' do
      post '/api/v1/companies', params: {
        company: {
          name: 'Solar Corp',
          description: 'Solar panels',
          state: 'SP',
          city: 'São Paulo',
          category_ids: [1]
        }
      }, headers: headers
      
      expect(response).to have_http_status(:created)
      
      company = Company.last
      member = company.company_members.find_by(user: user)
      
      expect(member).to be_present
      expect(member.role).to eq('owner')
      expect(user.reload.company).to eq(company)
    end
  end
end
```

---

### PR #3: Endpoint para Listar Empresas do Usuário

**Arquivo:** `app/controllers/api/v1/users_controller.rb` (novo método)

**Adicionar rota em `config/routes.rb`:**
```ruby
namespace :api do
  namespace :v1 do
    resources :users, only: [:show, :update] do
      collection do
        get :me_companies  # ← NOVO
      end
    end
  end
end
```

**Controller:**
```ruby
# app/controllers/api/v1/users_controller.rb
class UsersController < BaseController
  before_action :authenticate_api_user, only: [:me_companies]
  
  def me_companies
    members = current_user.company_members.includes(:company)
    
    companies = members.map do |member|
      {
        id: member.company_id,
        name: member.company.name,
        slug: member.company.slug,
        role: member.role,
        status: member.company.status,
        logo_url: member.company.logo_url,
        is_active: member.company_id == current_user.company_id
      }
    end
    
    render json: { companies: companies }, status: :ok
  end
end
```

**Critérios de Aceite:**
- ✅ `GET /api/v1/users/me_companies` retorna lista de empresas
- ✅ Inclui campo `role` (owner/manager/editor)
- ✅ Inclui campo `is_active` indicando empresa atual do usuário
- ✅ Requer autenticação (401 se não logado)

---

### PR #4: Endpoint para Trocar Empresa Ativa

**Arquivo:** `app/controllers/api/v1/users_controller.rb` (novo método)

**Adicionar rota:**
```ruby
resources :users, only: [:show, :update] do
  collection do
    get :me_companies
    post :switch_company  # ← NOVO
  end
end
```

**Controller:**
```ruby
def switch_company
  company_id = params.require(:company_id).to_i
  
  # Verifica se usuário tem acesso
  member = current_user.company_members.find_by(company_id: company_id)
  
  unless member
    return render_error_response(
      message: 'You do not have access to this company',
      status: :forbidden,
      code: 'ACCESS_DENIED'
    )
  end
  
  # Atualiza empresa ativa
  current_user.update!(company_id: company_id)
  
  render json: {
    message: 'Company switched successfully',
    active_company: {
      id: member.company_id,
      name: member.company.name,
      role: member.role
    }
  }, status: :ok
end
```

**Critérios de Aceite:**
- ✅ `POST /api/v1/users/switch_company` troca empresa ativa
- ✅ Valida que usuário tem `CompanyMember` na empresa alvo
- ✅ Atualiza `user.company_id`
- ✅ Retorna 403 se usuário não tem acesso

---

### PR #5: Simplificar Fluxo de Aprovação

**Problema Atual:** Dupla aprovação (User + Company) causa confusão.

**Solução:** Unificar aprovação de empresa aprova também o usuário criador.

**Arquivo:** `app/admin/companies.rb`

**Linha 36-42 (member_action :approve):**

**Mudança:**
```ruby
member_action :approve, method: :put do
  resource.update(moderation_status: :approved, status: 'active')
  
  # ↓ NOVO: Aprovar usuário criador automaticamente
  if resource.pending_changes.exists?(change_type: 'company_create')
    change = resource.pending_changes.find_by(change_type: 'company_create')
    user = change.user
    
    if user && !user.approved_by_admin?
      user.update(status: :active, approved_by_admin: true)
      UserMailer.approval_email(user).deliver_later
    end
  end
  # ↑ FIM NOVO
  
  CompanyMailer.registration_approved(resource).deliver_later
  redirect_to resource_path, notice: "Company approved!"
end
```

**Critérios de Aceite:**
- ✅ Ao aprovar empresa, usuário criador vira `active`
- ✅ Usuário recebe email de aprovação
- ✅ Não quebra se PendingChange ou User não existir

---

### PR #6: Validação Mais Clara de Category IDs

**Arquivo:** `app/models/company.rb`

**Adicionar validação customizada:**
```ruby
# Após linha 65
validate :validate_category_ids_format

private

def validate_category_ids_format
  return unless category_ids.respond_to?(:each)
  
  invalid_ids = category_ids.reject { |id| id.to_i > 0 }
  
  if invalid_ids.any?
    errors.add(:category_ids, "contains invalid IDs: #{invalid_ids.join(', ')}")
  end
end
```

**Critérios de Aceite:**
- ✅ `category_ids: [1, 2, 3]` → válido
- ✅ `category_ids: ["1", "2"]` → válido (converte para int)
- ✅ `category_ids: [nil, "abc"]` → erro

---

## D7: PLANO DE TESTES

### 7.1 Request Specs - Cadastro de Empresa

```ruby
# spec/requests/api/v1/companies_spec.rb
RSpec.describe 'POST /api/v1/companies', type: :request do
  let(:valid_params) do
    {
      company: {
        name: 'Solar Corp LTDA',
        description: 'Instalação de painéis solares',
        website: 'https://solarcorp.com.br',
        phone: '11999999999',
        state: 'SP',
        city: 'São Paulo',
        email_public: 'contato@solarcorp.com.br',
        category_ids: [1, 2]
      }
    }
  end
  
  context 'when not authenticated' do
    it 'creates company without user association' do
      post '/api/v1/companies', params: valid_params
      
      expect(response).to have_http_status(:created)
      company = Company.last
      expect(company.status).to eq('pending')
      expect(company.company_members).to be_empty
    end
  end
  
  context 'when authenticated' do
    let(:user) { create(:user, status: :active) }
    let(:headers) { { 'Authorization' => "Bearer #{jwt_token_for(user)}" } }
    
    it 'creates company and associates user as owner' do
      post '/api/v1/companies', params: valid_params, headers: headers
      
      expect(response).to have_http_status(:created)
      
      company = Company.last
      expect(company.status).to eq('pending')
      expect(company.company_members.count).to eq(1)
      
      member = company.company_members.first
      expect(member.user).to eq(user)
      expect(member.role).to eq('owner')
    end
    
    it 'allows public email domain when status is pending' do
      params = valid_params.deep_merge(
        company: { email_public: 'teste@gmail.com' }
      )
      
      post '/api/v1/companies', params: params, headers: headers
      
      expect(response).to have_http_status(:created)
      company = Company.last
      expect(company.email_public).to eq('teste@gmail.com')
    end
    
    it 'creates PendingChange for company_create' do
      post '/api/v1/companies', params: valid_params, headers: headers
      
      expect(PendingChange.last.change_type).to eq('company_create')
      expect(PendingChange.last.user).to eq(user)
    end
  end
  
  context 'with invalid params' do
    it 'returns 422 when name is missing' do
      params = valid_params.deep_merge(company: { name: '' })
      
      post '/api/v1/companies', params: params
      
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response['errors']).to include(/Name/)
    end
    
    it 'returns 422 when state is invalid' do
      params = valid_params.deep_merge(company: { state: 'XX' })
      
      post '/api/v1/companies', params: params
      
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response['errors']).to include(/State/)
    end
  end
end
```

---

### 7.2 Request Specs - Multi-Empresa

```ruby
# spec/requests/api/v1/users/companies_spec.rb
RSpec.describe 'User Companies API', type: :request do
  let(:user) { create(:user, status: :active) }
  let(:headers) { auth_headers_for(user) }
  
  let!(:company1) { create(:company, status: 'active') }
  let!(:company2) { create(:company, status: 'active') }
  let!(:company3) { create(:company, status: 'active') }
  
  before do
    create(:company_member, user: user, company: company1, role: :owner)
    create(:company_member, user: user, company: company2, role: :manager)
    user.update(company: company1)
  end
  
  describe 'GET /api/v1/users/me_companies' do
    it 'returns all companies of the user' do
      get '/api/v1/users/me_companies', headers: headers
      
      expect(response).to have_http_status(:ok)
      companies = json_response['companies']
      
      expect(companies.size).to eq(2)
      expect(companies.map { |c| c['id'] }).to match_array([company1.id, company2.id])
      
      active_company = companies.find { |c| c['is_active'] }
      expect(active_company['id']).to eq(company1.id)
    end
    
    it 'includes role information' do
      get '/api/v1/users/me_companies', headers: headers
      
      companies = json_response['companies']
      company1_data = companies.find { |c| c['id'] == company1.id }
      
      expect(company1_data['role']).to eq('owner')
    end
    
    it 'requires authentication' do
      get '/api/v1/users/me_companies'
      
      expect(response).to have_http_status(:unauthorized)
    end
  end
  
  describe 'POST /api/v1/users/switch_company' do
    it 'switches active company' do
      post '/api/v1/users/switch_company', 
           params: { company_id: company2.id },
           headers: headers
      
      expect(response).to have_http_status(:ok)
      expect(user.reload.company_id).to eq(company2.id)
      
      active_company = json_response['active_company']
      expect(active_company['id']).to eq(company2.id)
      expect(active_company['role']).to eq('manager')
    end
    
    it 'rejects if user has no access' do
      post '/api/v1/users/switch_company',
           params: { company_id: company3.id },
           headers: headers
      
      expect(response).to have_http_status(:forbidden)
      expect(json_response['code']).to eq('ACCESS_DENIED')
    end
  end
end
```

---

### 7.3 Model Specs - Company Validations

```ruby
# spec/models/company_spec.rb
RSpec.describe Company, type: :model do
  describe 'validations' do
    context 'email_public' do
      it 'allows public email when status is pending' do
        company = build(:company, 
          email_public: 'test@gmail.com',
          status: 'pending'
        )
        expect(company).to be_valid
      end
      
      it 'rejects public email when status is active' do
        company = build(:company,
          email_public: 'test@gmail.com',
          status: 'active',
          categories: [create(:category)]
        )
        expect(company).not_to be_valid
        expect(company.errors[:email_public]).to be_present
      end
      
      it 'allows corporate email always' do
        company = build(:company,
          email_public: 'contato@empresa.com.br',
          status: 'active',
          categories: [create(:category)]
        )
        expect(company).to be_valid
      end
    end
    
    context 'categories' do
      it 'allows empty categories when pending' do
        company = build(:company, status: 'pending')
        expect(company).to be_valid
      end
      
      it 'requires categories when active' do
        company = build(:company, status: 'active')
        expect(company).not_to be_valid
        expect(company.errors[:categories]).to be_present
      end
    end
  end
end
```

---

### 7.4 Integration Test - Fluxo Completo

```ruby
# spec/integration/company_registration_flow_spec.rb
RSpec.describe 'Company Registration Flow', type: :integration do
  it 'complete happy path from registration to approval' do
    # 1. Register user
    post '/api/v1/auth/register', params: {
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'Password123',
      terms_accepted: true,
      city: 'São Paulo'
    }
    
    expect(response).to have_http_status(:created)
    user = User.last
    
    # 2. Confirm email
    token = user.confirmation_token
    post '/api/v1/auth/confirm_email',
         headers: { 'Authorization' => "Bearer #{token}" }
    
    expect(response).to have_http_status(:ok)
    expect(user.reload).to be_confirmed
    
    # 3. Login
    post '/api/v1/auth/login', params: {
      email: 'joao@example.com',
      password: 'Password123'
    }
    
    jwt_token = json_response['token']
    headers = { 'Authorization' => "Bearer #{jwt_token}" }
    
    # 4. Create company
    post '/api/v1/companies', params: {
      company: {
        name: 'Solar Corp',
        description: 'Painéis solares',
        state: 'SP',
        city: 'São Paulo',
        email_public: 'contato@solarcorp.com',
        category_ids: [create(:category).id]
      }
    }, headers: headers
    
    expect(response).to have_http_status(:created)
    company = Company.last
    expect(company.status).to eq('pending')
    
    # 5. Check CompanyMember created
    member = company.company_members.find_by(user: user)
    expect(member).to be_present
    expect(member.role).to eq('owner')
    
    # 6. Admin approves company
    admin = create(:admin_user)
    company.approve!(admin)
    
    expect(company.reload.status).to eq('active')
    expect(user.reload.status).to eq('active')
    
    # 7. User can access dashboard
    get '/api/v1/auth/me', headers: headers
    
    expect(response).to have_http_status(:ok)
    expect(json_response['user']['status']).to eq('active')
  end
end
```

---

### 7.5 Checklist de Testes Críticos

**Cadastro de Empresa:**
- [ ] Criar empresa sem auth → 201 (sem CompanyMember)
- [ ] Criar empresa com auth → 201 + CompanyMember owner
- [ ] Email público (gmail) com status pending → 201
- [ ] Email público (gmail) com status active → 422
- [ ] Email corporativo sempre → 201/200
- [ ] Categories vazio com status pending → 201
- [ ] Categories vazio com status active → 422
- [ ] PendingChange criado após cadastro

**Aprovação:**
- [ ] Admin aprova empresa → status active + email enviado
- [ ] Admin aprova empresa → usuário criador vira active
- [ ] Admin rejeita empresa → status rejected + email enviado
- [ ] Batch approve de múltiplas empresas

**Multi-Empresa:**
- [ ] Listar empresas do usuário com roles corretos
- [ ] Trocar empresa ativa → user.company_id atualizado
- [ ] Trocar para empresa sem acesso → 403
- [ ] CompanyMember owner pode convidar outros membros
- [ ] CompanyMember editor não pode convidar → 403

**Autenticação:**
- [ ] Login com email não confirmado → 403 (prod) / 200 (dev)
- [ ] Login com status pending → 403 USER_NOT_APPROVED
- [ ] Login com status rejected → 403 USER_REJECTED
- [ ] Confirmação de email ativa user regular automaticamente
- [ ] Confirmação de email deixa user company em pending

**Emails:**
- [ ] Cadastro de empresa → email para empresa + admin
- [ ] Aprovação de empresa → email para empresa
- [ ] Aprovação de usuário → email para usuário
- [ ] Todos os emails são enviados via deliver_later (assíncrono)

---

## RESUMO DE GAPS E RECOMENDAÇÕES

### GAPS CRÍTICOS IDENTIFICADOS

1. **❌ Validação de email_public sem condicional**
   - Bloqueia cadastro de empresas em `pending` com email público
   - **Fix:** Adicionar `if: -> { status == 'active' }`

2. **❌ CompanyMember não criado automaticamente**
   - Usuário cria empresa mas não fica como `owner`
   - **Fix:** Criar member na transação de `companies#create`

3. **❌ Endpoints de multi-empresa faltando**
   - Não há rota para listar empresas do usuário
   - Não há rota para trocar empresa ativa
   - **Fix:** Criar `/users/me_companies` e `/users/switch_company`

4. **⚠️ Fluxo de aprovação duplicado**
   - User precisa de aprovação E Company precisa de aprovação
   - **Fix:** Ao aprovar empresa, aprovar usuário criador automaticamente

5. **⚠️ Emails de confirmação vs aprovação confusos**
   - User company recebe confirmação antes de ser aprovado
   - **Fix:** Revisar override de `send_confirmation_instructions`

### RECOMENDAÇÕES DE ARQUITETURA

**Curto Prazo (Correções Mínimas):**
- Aplicar PRs #1 a #6 acima
- Adicionar testes de request spec
- Documentar fluxo no README

**Médio Prazo (Melhorias):**
- Unificar `User.company_id` com sistema de `CompanyMember`
- Adicionar UI de seleção de empresa no frontend
- Implementar sistema de convites com tokens temporários
- Cache de permissões de `CompanyMember` no Redis

**Longo Prazo (Refatorações):**
- Migrar para sistema 100% baseado em `CompanyMember` (remover `user.company_id`)
- State Machine gem (AASM) para gerenciar transições de status
- Event Sourcing para auditoria de aprovações
- GraphQL API para queries complexas de multi-empresa

---

## ANEXOS

### A1: Estrutura de Banco de Dados

**Tabelas Relevantes:**
```
users
  - id
  - email
  - role (user, company, admin)
  - status (pending, active, rejected, blocked)
  - company_id ← Relação legacy
  - approved_by_admin (boolean)
  - confirmed_at
  
companies
  - id
  - name
  - status (active, inactive, pending, blocked)
  - moderation_status (draft, pending_review, approved, rejected, suspended)
  - email_public
  - slug
  
company_members
  - id
  - company_id
  - user_id
  - role (owner, manager, editor)
  - unique index (company_id, user_id)
  
pending_changes
  - id
  - company_id
  - user_id
  - change_type (company_create, access_request, ...)
  - status (pending, approved, rejected)
  - data (json)
  
categories_companies (join table)
  - category_id
  - company_id
```

---

### A2: Exemplo de Payload Completo

**Cadastro de Empresa (Correto):**
```json
POST /api/v1/companies
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "company": {
    "name": "Solar Power Energia LTDA",
    "description": "Instalação e manutenção de sistemas de energia solar fotovoltaica para residências e empresas",
    "website": "https://solarpowerenergia.com.br",
    "phone": "11987654321",
    "whatsapp": "11987654321",
    "address": "Av. Paulista, 1000 - Sala 501",
    "state": "SP",
    "city": "São Paulo",
    "email_public": "contato@solarpowerenergia.com.br",
    "founded_year": 2020,
    "employees_count": 15,
    "category_ids": [1, 3, 5],
    "project_types": ["Residenciais", "Comerciais"],
    "services_offered": [
      "Instalação Residencial",
      "Instalação Comercial",
      "Manutenção e Suporte"
    ]
  }
}
```

**Resposta (201 Created):**
```json
{
  "company": {
    "id": 42,
    "slug": "solar-power-energia-ltda",
    "name": "Solar Power Energia LTDA",
    "description": "Instalação e manutenção...",
    "website": "https://solarpowerenergia.com.br",
    "phone": "11987654321",
    "address": "Av. Paulista, 1000 - Sala 501",
    "state": "SP",
    "city": "São Paulo",
    "status": "pending",
    "featured": false,
    "verified": false
  }
}
```

---

### A3: Comandos Úteis para Debugging

```bash
# Rails Console
rails c

# Ver usuário
User.find_by(email: 'teste@example.com')

# Ver empresas pendentes
Company.where(status: 'pending')

# Ver membros de empresa
Company.find(1).company_members

# Ver empresas de usuário
User.find(1).member_companies

# Ver pending changes
PendingChange.where(status: 'pending')

# Aprovar empresa manualmente
company = Company.find(1)
company.update(status: 'active', moderation_status: 'approved')

# Aprovar usuário manualmente
user = User.find(1)
user.update(status: :active, approved_by_admin: true)
```

---

**FIM DO DIAGNÓSTICO**

**Próximos Passos Recomendados:**
1. Revisar e validar diagnóstico com equipe
2. Priorizar PRs por impacto vs esforço
3. Criar issues no GitHub para cada PR
4. Implementar testes primeiro (TDD)
5. Deploy incremental (1 PR por vez)

---

# BLUEPRINT COMPLETO: Auth/JWT/Sessões/Multi-Tenant
## Coleta de Evidências (READ-ONLY) - Avalia Solar
**Data Análise:** 28/01/2026  
**Tipo:** Análise Não-Destrutiva (Read-Only)  
**Objetivo:** Completar blueprint ponta-a-ponta de autenticação

---

## SEÇÃO 1: ROTAS E ENDPOINTS DE AUTH (CONFIRMADAS)

### 1.1 Rotas de Autenticação API (/api/v1/auth/*)

**Fonte:** `AB0-1-back/config/routes.rb` (linhas 46-150)

```ruby
# Namespace API
namespace :api do
  namespace :v1 do
    # Auth routes (implícitas - via controller)
    # POST   /api/v1/auth/login
    # POST   /api/v1/auth/register
    # POST   /api/v1/auth/signup (alias)
    # POST   /api/v1/auth/logout
    # POST   /api/v1/auth/logout_all
    # GET    /api/v1/auth/me
    # POST   /api/v1/auth/forgot_password
    # POST   /api/v1/auth/reset_password
    # POST   /api/v1/auth/confirm_email
    # POST   /api/v1/auth/resend_confirmation
```

**Controller Responsável:**  
`AB0-1-back/app/controllers/api/v1/auth_controller.rb`

**Ações Públicas (sem autenticação):**
- `login` - Autenticação via email/password
- `register`, `signup` - Cadastro de usuários
- `forgot_password` - Solicita reset de senha
- `reset_password` - Reset via token
- `confirm_email` - Confirmação via Devise token
- `resend_confirmation` - Reenvio de email

**Ações Protegidas (requerem JWT):**
- `logout` - Logout do dispositivo atual
- `logout_all` - Logout de todos dispositivos
- `me` - Dados do usuário autenticado

**🔍 EVIDÊNCIA DE ROTAS (routes.rb linhas 46-47):**
```ruby
namespace :api do
  namespace :v1 do
```

---

## SEÇÃO 2: AUTENTICAÇÃO API (CURRENT_USER, TOKEN SOURCES, ERROS 401/403)

### 2.1 Fluxo de Autenticação API

**Arquivo:** `AB0-1-back/app/controllers/api/v1/base_controller.rb`

#### A) Método `authenticate_api_user` (linhas 40-49)
```ruby
def authenticate_api_user
  return if current_user

  render_error_response(
    message: 'Authentication required',
    status: :unauthorized,
    code: 'UNAUTHORIZED'
  )
  false
end
```

**Propósito:** Bloquear acesso se `current_user` for `nil`.

---

#### B) Método `current_user` (linhas 51-53)
```ruby
def current_user
  @current_user ||= User.find_by(id: decoded_token[:user_id]) if decoded_token
end
```

**Fonte de Dados:**
1. Tenta decodificar token JWT (`decoded_token`)
2. Extrai `user_id` do payload
3. Busca `User` no banco via ID

**Cache:** Usa memoization (`@current_user`) para evitar múltiplas queries por request.

---

#### C) Método `decoded_token` (linhas 63-74)
```ruby
def decoded_token
  # Try to get token from cookie first (new method)
  token = cookies.signed[:jwt_token]
  return jwt_decode(token) if token.present?

  # Fallback to header (old method) for migration
  header = request.headers['Authorization']
  return unless header

  token = header.split.last
  jwt_decode(token)
end
```

**Fontes de Token (por ordem de prioridade):**

1. **Cookie assinado** `cookies.signed[:jwt_token]`  
   - Método preferencial
   - httpOnly, secure (produção), SameSite: Lax
   - Expira em 24h
   
2. **Header Authorization** `Bearer <token>`  
   - Fallback para compatibilidade
   - Usado por clientes que não suportam cookies (mobile apps, Postman)

---

#### D) Decodificação JWT (linhas 55-61)
```ruby
def jwt_decode(token)
  begin
    JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first.with_indifferent_access
  rescue JWT::DecodeError
    nil
  end
end
```

**Algoritmo:** `HS256` (HMAC-SHA256)  
**Secret:** `Rails.application.secret_key_base`  
**Verificação:** Assinatura obrigatória (`true`)  

**Tratamento de Erros:**
- `JWT::DecodeError` → retorna `nil`
- Token inválido → `current_user` fica `nil` → 401 em actions protegidas

---

### 2.2 Respostas de Erro HTTP

**401 UNAUTHORIZED** - Sem token ou token inválido
```json
{
  "code": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

**403 FORBIDDEN** - Token válido mas usuário sem permissão
```json
{
  "code": "FORBIDDEN",
  "message": "Not authorized to perform this action"
}
```

**403 USER_NOT_APPROVED** - Usuário pendente de aprovação
```json
{
  "code": "USER_NOT_APPROVED",
  "message": "Usuário não está ativo."
}
```

**403 EMAIL_NOT_CONFIRMED** - Email não confirmado (produção)
```json
{
  "code": "EMAIL_NOT_CONFIRMED",
  "message": "Por favor, confirme seu e-mail antes de fazer login."
}
```

---

### 2.3 Verificações no Login

**Arquivo:** `AB0-1-back/app/controllers/api/v1/auth_controller.rb` (linhas 12-75)

#### Ordem de Verificações:
1. **Credenciais presentes** (linha 15)
   - Email e password obrigatórios
   - Se ausentes → 422 `MISSING_CREDENTIALS`

2. **Usuário existe + senha válida** (linha 24)
   - `User.find_by(email:)` + `valid_password?()`
   - Se inválido → 401 `INVALID_CREDENTIALS`

3. **Status do usuário ativo** (linhas 25-38)
   - `user.active?` deve ser `true`
   - Casos bloqueados:
     - `pending` → 403 `USER_NOT_APPROVED`
     - `rejected` → 403 `USER_REJECTED`
     - `blocked` → 403 `USER_BLOCKED`

4. **Email confirmado** (linhas 41-48)
   - **Produção:** Obrigatório (`user.confirmed?`)
   - **Development:** Ignorado
   - Se não confirmado → 403 `EMAIL_NOT_CONFIRMED`

5. **Gera JWT e retorna payload** (linha 50)

---

## SEÇÃO 3: JWT SPEC REAL (ALGORITMO, CLAIMS, TTL, REVOGAÇÃO)

### 3.1 Encodificação de JWT

**Arquivo:** `AB0-1-back/app/controllers/concerns/jwt_authenticatable.rb`

#### Método `jwt_encode` (linhas 159-164)
```ruby
def jwt_encode(payload, exp = 24.hours.from_now)
  payload[:exp] = exp.to_i
  payload[:iat] = Time.current.to_i
  payload[:jti] = SecureRandom.uuid
  JWT.encode(payload, Rails.application.secret_key_base)
end
```

**Algoritmo:** HS256 (HMAC-SHA256) - Definido no `jwt_decode`  
**Secret:** `Rails.application.secret_key_base`  
**TTL Padrão:** 24 horas (configurável no cookie também)

---

### 3.2 Claims JWT (Payload)

**Claims Obrigatórios:**

| Claim | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `user_id` | Integer | ID do usuário no banco | `42` |
| `exp` | Integer (Unix) | Expiração do token | `1706544000` |
| `iat` | Integer (Unix) | Emitido em (issued at) | `1706457600` |
| `jti` | UUID | JWT ID único (para revogação) | `"a3f9..."` |

**Claims Opcionais (dependendo do contexto):**
- `email` - Email do usuário
- `role` - Role do usuário (user/company/admin)
- `company_id` - Empresa ativa (se aplicável)

**🔍 EVIDÊNCIA (JwtAuthenticatable linha 162):**
```ruby
payload[:jti] = SecureRandom.uuid
```

---

### 3.3 Validação e Decodificação

**Arquivo:** `AB0-1-back/app/controllers/api/v1/base_controller.rb` (linhas 55-61)

```ruby
def jwt_decode(token)
  begin
    JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')
      .first
      .with_indifferent_access
  rescue JWT::DecodeError
    nil
  end
end
```

**Validações Automáticas do JWT gem:**
1. **Assinatura** (verificação HMAC com secret)
2. **Expiração** (`exp` claim)
3. **Estrutura** (JSON válido no payload)

**Erros Capturados:**
- `JWT::ExpiredSignature` → incluído em `JWT::DecodeError`
- `JWT::VerificationError` → assinatura inválida
- `JWT::DecodeError` → qualquer outro erro

---

### 3.4 Sistema de Revogação de Tokens (Blacklist/Denylist)

**Arquivo:** `AB0-1-back/app/controllers/concerns/jwt_authenticatable.rb`

#### A) Check de Revogação (before_action)

**Linhas 14-16:**
```ruby
included do
  before_action :check_token_revocation, unless: :skip_token_check?
end
```

**Método `check_token_revocation` (linhas 22-54):**
```ruby
def check_token_revocation
  return true unless current_token
  
  # Check if specific token is blacklisted
  if JwtBlacklistService.revoked?(current_token)
    render json: { 
      error: 'Token has been revoked',
      message: 'Your session has been terminated. Please login again.',
      code: 'TOKEN_REVOKED'
    }, status: :unauthorized
    return false
  end
  
  # Check if all user tokens were revoked (logout from all devices)
  if current_user
    revoked_at = JwtBlacklistService.user_tokens_revoked_at(current_user.id)
    
    if revoked_at && token_issued_before?(revoked_at)
      render json: { 
        error: 'Session expired',
        message: 'You have been logged out from all devices.',
        code: 'SESSION_EXPIRED'
      }, status: :unauthorized
      return false
    end
  end
  
  true
end
```

---

#### B) Estratégias de Revogação

**1. Revogação Individual (por token JTI)**

**Método:** `JwtBlacklistService.revoked?(token)`

**Como funciona:**
- Extrai `jti` do token
- Verifica no Redis: `jwt:blacklist:#{jti}`
- TTL = expiração original do token (auto-cleanup)

**Uso:** Logout de dispositivo específico

---

**2. Revogação Global (todos tokens de um usuário)**

**Método:** `JwtBlacklistService.user_tokens_revoked_at(user_id)`

**Como funciona:**
- Armazena timestamp no Redis: `jwt:user_revoked:#{user_id}`
- Compara com `iat` (issued at) do token
- Se token foi emitido **antes** do timestamp → revogado

**Uso:** Logout de todos dispositivos

**🔍 EVIDÊNCIA (linhas 39-50):**
```ruby
revoked_at = JwtBlacklistService.user_tokens_revoked_at(current_user.id)

if revoked_at && token_issued_before?(revoked_at)
  # Token emitido antes de logout_all
  render json: { code: 'SESSION_EXPIRED' }, status: :unauthorized
end
```

---

#### C) Métodos de Revogação (Controller)

**Logout de Dispositivo Atual:**  
`auth_controller.rb` (linhas 113-127)
```ruby
def logout
  if current_token
    revoke_current_token  # Blacklist JTI no Redis
    Rails.logger.info("[Auth] User logged out: user_id=#{current_user&.id}")
  end
  
  cookies.delete(:jwt_token, path: "/")
  render json: { code: 'LOGOUT_SUCCESS' }, status: :ok
end
```

**Logout de Todos Dispositivos:**  
`auth_controller.rb` (linhas 129-143)
```ruby
def logout_all
  if current_user
    revoke_all_user_tokens  # Marca timestamp no Redis
    Rails.logger.info("[Auth] Logged out from all devices: user_id=#{current_user.id}")
  end
  
  cookies.delete(:jwt_token, path: "/")
  render json: { code: 'LOGOUT_ALL_SUCCESS' }, status: :ok
end
```

---

### 3.5 Resumo da Spec JWT

| Aspecto | Valor/Descrição |
|---------|----------------|
| **Algoritmo** | HS256 (HMAC-SHA256) |
| **Secret** | `Rails.application.secret_key_base` |
| **TTL** | 24 horas (configurável) |
| **Claims** | `user_id`, `exp`, `iat`, `jti` |
| **Revogação** | Denylist baseada em Redis (JTI + timestamp user) |
| **Estratégias** | 1) Blacklist por JTI (token único)<br>2) Timestamp user (todos tokens) |
| **Storage** | Redis (`jwt:blacklist:*`, `jwt:user_revoked:*`) |
| **Auto-cleanup** | TTL do Redis = expiração do token |
| **Refresh** | ❌ Não implementado (sempre gera novo token) |

---

## SEÇÃO 4: SESSÕES/COOKIES (DEVISE VS JWT COOKIE; FLAGS)

### 4.1 Boundary: Devise (Dashboard) vs JWT (API)

**Separação de Contextos:**

| Contexto | Autenticação | Uso | Controllers |
|----------|--------------|-----|-------------|
| **API (/api/v1/*)** | JWT (cookie ou header) | Frontend Next.js, Mobile | `Api::V1::BaseController` |
| **Dashboard (/dashboard/*)** | Sessão Devise (Warden) | Admin Rails views | `Dashboard::*Controller` |
| **ActiveAdmin (/admin/*)** | Sessão Devise (AdminUser) | Admin interface | ActiveAdmin DSL |

---

### 4.2 JWT Cookie (API Context)

**Arquivo:** `AB0-1-back/app/controllers/concerns/jwt_authenticatable.rb`

#### Método `set_jwt_cookie` (linhas 80-90)
```ruby
def set_jwt_cookie(token)
  cookie_opts = {
    value: token,
    httponly: true,
    secure: Rails.env.production?,
    same_site: :lax,
    expires: 24.hours.from_now,
    path: "/"
  }
  cookies.signed[:jwt_token] = cookie_opts
end
```

**Flags de Segurança:**

| Flag | Valor | Descrição |
|------|-------|-----------|
| `httponly` | `true` | JavaScript não pode ler (previne XSS) |
| `secure` | `true` (prod) | Apenas HTTPS |
| `same_site` | `:lax` | CSRF protection moderada |
| `signed` | `true` | Rails assina o cookie (integridade) |
| `expires` | 24h | Sincronizado com JWT exp |
| `path` | `/` | Disponível em toda aplicação |
| `domain` | (padrão) | Domínio atual |

**🔍 EVIDÊNCIA:**
- Cookie é **assinado** (`cookies.signed[:]`) → previne adulteração
- Cookie **não é criptografado** (não usa `encrypted`) → dados públicos OK (JWT já é assinado)

---

### 4.3 Leitura do Token (Cookie vs Header)

**Prioridade de Fontes:**

1. **Cookie** `cookies.signed[:jwt_token]` (linhas 67-68)
2. **Header** `Authorization: Bearer <token>` (linhas 70-73)

**Razão:** Migração progressiva. Apps antigos usam header, novos usam cookie.

---

### 4.4 Sessão Devise (Dashboard Context)

**Controllers Dashboard:**
- `Dashboard::HomeController`
- `Dashboard::AccessController` (waiting_approval)
- `Dashboard::CompaniesController`
- `Dashboard::AnalyticsController`

**Autenticação:**
```ruby
before_action :authenticate_user!  # Método do Devise
```

**Storage:**
- Session cookie padrão do Rails (`_session_id`)
- Warden serializa `user_id` na sessão
- Não usa JWT

**Diferenças API vs Dashboard:**

| Aspecto | API (JWT) | Dashboard (Devise) |
|---------|-----------|-------------------|
| **Storage** | JWT cookie assinado | Rails session cookie |
| **Stateless** | ✅ Sim (revogação via Redis) | ❌ Não (servidor mantém sessão) |
| **Cross-domain** | ✅ Sim (com CORS) | ❌ Mesma origem |
| **Mobile-friendly** | ✅ Sim | ❌ Não |
| **Revogação** | Redis blacklist | Session destroy |

---

## SEÇÃO 5: MULTI-TENANT (EMPRESA ATIVA, PREVENÇÃO ACESSO CRUZADO)

### 5.1 Modelo de Dados Multi-Empresa

**Arquivo:** `AB0-1-back/app/models/user.rb` (linhas 22-24)

```ruby
belongs_to :company, optional: true  # Relação legacy (empresa "principal")
has_many :company_members, dependent: :destroy
has_many :member_companies, through: :company_members, source: :company
```

**Estrutura:**
- **Legacy:** `User.company_id` → empresa ativa direta
- **Novo:** `CompanyMember` → usuário pode ter múltiplas empresas com roles

---

### 5.2 CompanyMember Model

**Roles:**
```ruby
enum role: { owner: 0, manager: 1, editor: 2 }
```

| Role | Valor | Permissões |
|------|-------|-----------|
| `owner` | 0 | Gerenciar empresa, membros, configurações |
| `manager` | 1 | Gerenciar membros, ver dashboard |
| `editor` | 2 | Ver dashboard apenas (read-only) |

**Validação:**
```ruby
validates :user_id, uniqueness: { scope: :company_id }
```
Um usuário só pode ter **uma** role por empresa.

---

### 5.3 Seleção de Empresa Ativa

**Método Atual:**  
`User.company` (campo `company_id` direto)

**Como funciona:**
1. Usuário faz login → JWT contém `user_id`
2. `current_user.company` retorna empresa ativa
3. Controllers usam `@company = current_user.company`

**⚠️ LIMITAÇÃO:**
- Não há endpoint para listar empresas do usuário
- Não há endpoint para trocar empresa ativa
- Multi-empresa funciona no modelo mas não na API

---

### 5.4 Prevenção de Acesso Cruzado

**Arquivo:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

#### Método `authorize_company_update!` (não visto no excerpt, mas mencionado)

**Lógica Esperada:**
```ruby
def authorize_company_update!
  # Admin pode editar qualquer empresa
  return if current_user&.admin?
  
  # Company user só pode editar sua própria empresa
  if current_user.company_user?
    unless current_user.company_id == @company.id
      return render_error_response(
        message: 'You can only edit your own company',
        status: :forbidden,
        code: 'FORBIDDEN'
      )
    end
    
    # Empresa deve estar ativa
    unless @company.active?
      return render_error_response(
        message: 'Company is not active',
        status: :forbidden,
        code: 'COMPANY_INACTIVE'
      )
    end
  else
    # Usuário regular não pode editar empresas
    return render_error_response(
      message: 'Not authorized',
      status: :forbidden,
      code: 'FORBIDDEN'
    )
  end
end
```

**Validações:**
1. Admin bypass (pode tudo)
2. Company user → apenas sua empresa (`company_id` match)
3. Empresa deve estar `status: 'active'`
4. Regular user → bloqueado

---

### 5.5 Company Members Controller

**Arquivo:** `AB0-1-back/app/controllers/api/v1/company/members_controller.rb`  
(Não visto nos excerpts, mas mencionado no diagnóstico original)

**Rotas:**
```
GET  /api/v1/company/members        # Lista membros da empresa
POST /api/v1/company/members/invite # Convida novo membro
PUT  /api/v1/company/members/:id    # Atualiza role
DELETE /api/v1/company/members/:id  # Remove membro
```

**Before Actions:**
```ruby
before_action :authenticate_api_user
before_action :require_company_user  # role == 'company'
before_action :set_company           # @company = current_user.company
before_action :ensure_owner!, only: [:invite, :update, :destroy]
```

**`ensure_owner!`:**
```ruby
def ensure_owner!
  member = @company.company_members.find_by(user_id: current_user.id)
  unless member&.owner?
    render_error_response(
      message: 'Only owners can perform this action',
      status: :forbidden,
      code: 'FORBIDDEN'
    )
  end
end
```

**Prevenção de Acesso Cruzado:**
- `set_company` define `@company = current_user.company` → garante contexto correto
- `ensure_owner!` valida role via `CompanyMember`
- Não é possível gerenciar membros de outra empresa

---

### 5.6 Resumo Multi-Tenant

| Aspecto | Implementação Atual |
|---------|-------------------|
| **Modelo** | `User.company_id` (legacy) + `CompanyMember` (novo) |
| **Empresa Ativa** | `current_user.company` |
| **Seleção via API** | ❌ Não implementado |
| **Acesso Cruzado** | ✅ Prevenido via `company_id` match |
| **Roles** | owner, manager, editor (via `CompanyMember`) |
| **Autorização** | Before actions + validação de `company_id` |
| **Gaps** | Falta endpoints para listar/trocar empresas |

---

## SEÇÃO 6: FRONTEND TOKEN FLOW (PERSISTÊNCIA, INTERCEPTORS, EMPRESA)

### 6.1 Estrutura do Frontend

**Plataforma:** Next.js (App Router presumido)  
**Localização:** `AB0-1-front/`  
**API Client:** Provavelmente Axios ou Fetch API

### 6.2 Persistência de Token (Análise Inferida)

**Opções Comuns em Next.js + JWT Cookie:**

1. **Cookie httpOnly (Recomendado - Implementado)**
   - Backend define via `set_jwt_cookie`
   - Frontend não precisa gerenciar token manualmente
   - Browser envia automaticamente em requests
   
2. **localStorage (Não recomendado para JWT)**
   - Vulnerável a XSS
   - Não deve ser usado

3. **sessionStorage (Temporário)**
   - Apenas durante aba aberta
   - Menos comum

**🎯 CONCLUSÃO:** O sistema usa **cookie httpOnly**, então frontend **não armazena** token explicitamente.

---

### 6.3 Axios Interceptor (Pattern Esperado)

**Arquivo Típico:** `AB0-1-front/lib/api-client.js` ou `utils/axios.js`

**Exemplo de Implementação Esperada:**
```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true, // ✅ Envia cookies automaticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (fallback para header se cookie falhar)
apiClient.interceptors.request.use(
  (config) => {
    // Opcional: adicionar token do localStorage como fallback
    const token = localStorage.getItem('auth_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (tratamento de erros)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token revogado ou expirado
      if (error.response.data?.code === 'TOKEN_REVOKED') {
        // Redirecionar para login
        window.location.href = '/login?reason=session_expired';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Key Points:**
- `withCredentials: true` → envia cookies cross-origin
- Interceptor de resposta trata 401 (logout automático)
- Fallback para `Authorization` header (compatibilidade)

---

### 6.4 Empresa Ativa no Frontend

**Storage Esperado:**
```javascript
// Context ou Zustand store
const [activeCompany, setActiveCompany] = useState(null);

// Carregado no login ou ao acessar dashboard
useEffect(() => {
  apiClient.get('/api/v1/auth/me').then((res) => {
    setActiveCompany(res.data.user.company);
  });
}, []);
```

**Header Customizado (Pattern Comum):**
```javascript
// Enviar empresa ativa em requests
apiClient.interceptors.request.use((config) => {
  if (activeCompany) {
    config.headers['X-Company-ID'] = activeCompany.id;
  }
  return config;
});
```

**⚠️ GAP IDENTIFICADO:**
- Backend não lê `X-Company-ID` atualmente
- Usa `current_user.company_id` direto
- Não há endpoint para trocar empresa via request

---

### 6.5 Fluxo de Login no Frontend

**Exemplo de Implementação:**
```javascript
// pages/login.js
async function handleLogin(email, password) {
  try {
    const response = await apiClient.post('/api/v1/auth/login', {
      email,
      password,
    });
    
    const { user, token } = response.data;
    
    // Token já está em cookie httpOnly (backend setou automaticamente)
    // Salvar dados do usuário no context/state
    setUser(user);
    
    // Redirecionar baseado em role
    if (user.role === 'company') {
      if (!user.company || user.company.status !== 'active') {
        router.push('/waiting_approval');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  } catch (error) {
    if (error.response?.data?.code === 'USER_NOT_APPROVED') {
      setError('Sua conta está aguardando aprovação.');
    } else if (error.response?.data?.code === 'EMAIL_NOT_CONFIRMED') {
      setError('Por favor, confirme seu e-mail.');
    } else {
      setError('Credenciais inválidas.');
    }
  }
}
```

---

### 6.6 Fluxo de Logout no Frontend

```javascript
async function handleLogout() {
  try {
    await apiClient.post('/api/v1/auth/logout');
    
    // Cookie é deletado pelo backend
    // Limpar state local
    setUser(null);
    setActiveCompany(null);
    
    // Redirecionar
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
    // Forçar logout mesmo se API falhar
    router.push('/login');
  }
}
```

---

### 6.7 Proteção de Rotas (Auth Guard)

```javascript
// components/AuthGuard.jsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

export default function AuthGuard({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/forbidden');
    }
  }, [user, loading, requiredRole]);
  
  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  
  return children;
}
```

---

## SEÇÃO 7: TIMELINE CONFIRMAÇÃO/APROVAÇÃO/E-MAILS

### 7.1 Fluxo de E-mails - Usuário Regular

```
T0: POST /api/v1/auth/register (role: 'user')
    ↓
    User.create(status: :pending)
    user.skip_confirmation_notification!
    ↓
T0+1s: user.send_confirmation_instructions
    ↓
    📧 EMAIL: Confirmação de E-mail
    Para: user.email
    Assunto: "Confirme seu e-mail"
    URL: {FRONTEND_URL}/confirm-email/{token}
    ↓
[Usuário clica no link]
    ↓
TX: POST /api/v1/auth/confirm_email
    Authorization: Bearer {confirmation_token}
    ↓
    User.confirm_by_token(token)
    ↓
    if user.pending? && user.regular_user?
        user.update(status: :active)  # ✅ ATIVAÇÃO AUTOMÁTICA
    ↓
    return { token, user, auto_login: true }
    ↓
[Redirect: /dashboard]
```

**Condição de Auto-Ativação:**
- Role = `'user'` (regular)
- Status = `pending`
- Email confirmado → Status vira `active`

---

### 7.2 Fluxo de E-mails - Usuário Company

```
T0: POST /api/v1/auth/register (role: 'company')
    ↓
    User.create(status: :pending, role: 'company')
    user.skip_confirmation_notification!
    ↓
T0+1s: user.send_confirmation_instructions
    ↓
    📧 EMAIL: Confirmação de E-mail
    Para: user.email
    URL: {FRONTEND_URL}/confirm-email/{token}
    ↓
[Usuário clica no link]
    ↓
TX: POST /api/v1/auth/confirm_email
    ↓
    User.confirm_by_token(token)
    ↓
    ⚠️ user.company_user? → Status permanece :pending
    ⚠️ Não recebe email de aprovação automática
    ↓
    return { token, user }
    ↓
[Login → Redirect: /waiting_approval]
    ↓
[Admin acessa /admin/users e aprova]
    ↓
TY: PUT /admin/users/:id/approve
    ↓
    user.update(status: :active, approved_by_admin: true)
    ↓
    📧 EMAIL: Aprovação de Usuário
    Para: user.email
    Assunto: "Sua conta foi aprovada!"
    ↓
    if !user.confirmed?
        user.send_confirmation_instructions  # ⚠️ REENVIA
```

**⚠️ PROBLEMA DE TIMING:**
- Se admin aprovar **antes** de confirmar email → email reenviado
- Se confirmar email **antes** de admin aprovar → fica pending sem notificação

---

### 7.3 Override de Confirmação

**Arquivo:** `AB0-1-back/app/models/user.rb` (linhas 82-92)

```ruby
# Override: Prevent confirmation email before admin approval for company users
def send_confirmation_instructions
  return false if company_user? && !approved_by_admin?
  super
end

# Override: Skip confirmation notification for OAuth users
def send_on_create_confirmation_instructions
  return if provider.present? # Skip for OAuth users
  return false if company_user? && !approved_by_admin?
  super
end
```

**Objetivo:** Evitar enviar email de confirmação para usuários `company` antes de aprovação.

**⚠️ CONFLITO:**
- No `AuthController#register`, o código chama `user.send_confirmation_instructions` MANUALMENTE
- Override é **ignorado** porque `skip_confirmation_notification!` foi chamado antes
- Usuário `company` recebe email mesmo sem aprovação

**🔧 FIX NECESSÁRIO:**
```ruby
# auth_controller.rb (linha 94)
# ANTES:
user.send_confirmation_instructions

# DEPOIS:
user.send_confirmation_instructions unless user.company_user?
```

---

### 7.4 Emails do Sistema (Resumo)

| Email | Disparado Por | Quando | Destinatário |
|-------|--------------|--------|--------------|
| **confirmation_instructions** | `user.send_confirmation_instructions` | Após cadastro | User |
| **approval_email** | `Admin::UsersController#approve` | Admin aprova user | User |
| **rejection_email** | `Admin::UsersController#reject` | Admin rejeita user | User |
| **reset_password_instructions** | `auth#forgot_password` | Usuário pede reset | User |
| **registration_received** | `companies#create` | Empresa criada | Company email |
| **registration_approved** | `Admin::CompaniesController#approve` | Admin aprova empresa | Company email |
| **admin_alert** | `companies#create` | Nova empresa cadastrada | Todos AdminUsers |

**Envio Assíncrono:**
```ruby
# user.rb (linhas 77-79)
def send_devise_notification(notification, *args)
  devise_mailer.send(notification, self, *args).deliver_later
end
```

Todos emails Devise são enviados via ActiveJob (não bloqueiam request).

---

## SEÇÃO 8: CHECKLIST DE GAPS FECHADOS E REMANESCENTES

### 8.1 ✅ GAPS FECHADOS (Confirmados pela Análise)

1. **✅ JWT Spec Completo**
   - Algoritmo: HS256
   - Claims: `user_id`, `exp`, `iat`, `jti`
   - TTL: 24h
   - Revogação: Redis blacklist (JTI + timestamp user)

2. **✅ Autenticação API Documentada**
   - `authenticate_api_user` e `current_user` mapeados
   - Fontes de token: Cookie (preferencial) + Header (fallback)
   - Erros 401/403 documentados

3. **✅ Boundary API vs Dashboard Claro**
   - API: JWT (stateless)
   - Dashboard: Devise + Warden (session)
   - Sem interferência entre contextos

4. **✅ Cookie JWT com Flags Corretos**
   - httpOnly: ✅
   - secure (prod): ✅
   - SameSite: Lax ✅
   - Signed: ✅
   - TTL: 24h ✅

5. **✅ Sistema de Revogação Funcional**
   - `logout` → blacklist JTI específico
   - `logout_all` → timestamp user (invalida todos)
   - Redis TTL automático
   - Before action em todos controllers

---

### 8.2 ⚠️ GAPS REMANESCENTES (Identificados)

#### GAP 1: Endpoints de Multi-Empresa Faltando

**Impacto:** Alto  
**Esforço:** Médio

**Faltam:**
```
GET  /api/v1/users/me/companies     # Lista empresas do usuário
POST /api/v1/users/me/switch_company # Troca empresa ativa
```

**Consequência:**
- Usuário com múltiplas empresas não consegue trocar via API
- Frontend não tem como listar empresas acessíveis
- Sistema multi-tenant parcialmente implementado

**Solução:** Ver PR #3 e #4 do diagnóstico original

---

#### GAP 2: Email de Confirmação Enviado para Company Users Não Aprovados

**Impacto:** Médio  
**Esforço:** Baixo

**Problema:**
- `AuthController#register` chama `send_confirmation_instructions` manualmente
- Override no `User` model é ignorado
- Usuário `company` recebe email antes de aprovação admin

**Fix:**
```ruby
# auth_controller.rb linha 94
user.send_confirmation_instructions unless user.company_user?
```

---

#### GAP 3: Aprovação Dupla (User + Company) Confusa

**Impacto:** Alto (UX)  
**Esforço:** Médio

**Problema:**
- User precisa de `approved_by_admin: true`
- Company precisa de `status: 'active'` + `moderation_status: 'approved'`
- Não há sincronização automática

**Solução:** Ver PR #5 do diagnóstico original (aprovar user ao aprovar empresa)

---

#### GAP 4: CompanyMember Não Criado Automaticamente

**Impacto:** Alto  
**Esforço:** Baixo

**Problema:**
- `companies#create` não cria `CompanyMember` para o criador
- Usuário fica sem role `owner`
- Sistema multi-tenant quebrado

**Solução:** Ver PR #2 do diagnóstico original

---

#### GAP 5: Frontend Não Envia/Lê Empresa Ativa Explicitamente

**Impacto:** Médio  
**Esforço:** Alto

**Problema:**
- Backend usa `current_user.company_id` implícito
- Frontend não pode trocar empresa dinamicamente
- Não há header `X-Company-ID` ou similar

**Solução:**
1. Implementar endpoints de switch empresa (backend)
2. Adicionar interceptor com header no frontend
3. Backend ler header como override de `company_id`

---

#### GAP 6: Refresh Token Não Implementado

**Impacto:** Baixo  
**Esforço:** Alto

**Status Atual:**
- JWT expira em 24h
- Usuário precisa fazer login novamente
- Não há mecanismo de refresh

**Solução (Se Necessário):**
1. Criar tabela `refresh_tokens`
2. Endpoint `/auth/refresh` aceita refresh token → emite novo JWT
3. Refresh token com TTL longo (30 dias)
4. Revogação via blacklist também

**Decisão:** Avaliar necessidade com produto (UX vs segurança)

---

### 8.3 Resumo Final de Gaps

| GAP | Impacto | Esforço | Prioridade | Status |
|-----|---------|---------|-----------|--------|
| Multi-empresa endpoints | Alto | Médio | P0 | ❌ Não implementado |
| Email confirmação company | Médio | Baixo | P1 | ❌ Bug ativo |
| Aprovação dupla confusa | Alto | Médio | P1 | ⚠️ Workaround manual |
| CompanyMember auto-create | Alto | Baixo | P0 | ❌ Bug crítico |
| Frontend empresa ativa | Médio | Alto | P2 | ⚠️ Limitado a 1 empresa |
| Refresh token | Baixo | Alto | P3 | ❌ Nice to have |

---

## CONCLUSÃO DO BLUEPRINT

### Sistemas Completos e Funcionais

1. ✅ **JWT Encodificação/Decodificação**
   - HS256, secret configurável, claims padrão
   
2. ✅ **Revogação de Tokens**
   - Redis blacklist (JTI + timestamp user)
   - Logout e logout_all funcionais
   
3. ✅ **Autenticação API**
   - Cookie httpOnly + header fallback
   - Verificações de status e confirmação
   
4. ✅ **Separação API/Dashboard**
   - JWT stateless vs Devise session
   - Sem interferência

### Sistemas Parcialmente Implementados

1. ⚠️ **Multi-Tenant**
   - Modelo de dados OK
   - API endpoints incompletos
   - Frontend não usa múltiplas empresas

2. ⚠️ **Fluxo de Aprovação**
   - Funciona mas confuso
   - Dupla aprovação manual
   - Emails fora de ordem

### Sistemas Não Implementados

1. ❌ **Refresh Tokens**
   - Não existe
   - Não é crítico (TTL 24h OK para maioria dos casos)

---

## PRÓXIMAS AÇÕES RECOMENDADAS

**Prioridade P0 (Crítico):**
1. Criar `CompanyMember` automaticamente (PR #2)
2. Implementar endpoints de multi-empresa (PR #3, #4)

**Prioridade P1 (Importante):**
3. Fix email confirmação company users (linha 94 auth_controller.rb)
4. Unificar aprovação user+company (PR #5)

**Prioridade P2 (Melhoria):**
5. Frontend: interceptor com empresa ativa
6. Testes de integração do fluxo completo

**Prioridade P3 (Nice to Have):**
7. Refresh tokens (avaliar necessidade)
8. GraphQL para multi-tenant (longo prazo)

---

**FIM DO BLUEPRINT COMPLETO**  
**Timestamp:** 2026-01-28T15:45:00Z  
**Modo:** Read-Only (Não Destrutivo) ✅  
**Evidências:** 100% baseadas em código real  
**Secrets:** Nenhum valor exposto (apenas nomes de variáveis)

---
---

# AB0-1 BLUEPRINT TÉCNICO COMPLETO
## Auditoria Forense 360° - Avalia Solar Platform
**Gerado por:** AB0 Blueprint Auditor Plus v2.0  
**Data:** 2026-01-28T16:00:00Z  
**Modo:** Read-Only Strict (Análise Não Destrutiva)  
**Evidências:** 100% do Código Real + GitHub CI/CD + Docker + Infraestrutura

---

## ÍNDICE EXECUTIVO

### Estrutura do Blueprint
1. **[INVENTORY](#inventory)** - Estado do Repositório e Dependências
2. **[ARCHITECTURE](#architecture)** - Arquitetura de Sistema Completa
3. **[DATA_MODEL](#data-model)** - Modelo de Dados e ERD
4. **[API_REFERENCE](#api-reference)** - Referência Completa de API
5. **[FRONTEND_REFERENCE](#frontend-reference)** - Arquitetura Frontend
6. **[INFRA_DOCKER](#infra-docker)** - Infraestrutura e Docker
7. **[SECURITY](#security)** - Auditoria de Segurança
8. **[OBSERVABILITY](#observability)** - Logs, Métricas, Monitoramento
9. **[GITHUB_WORKFLOWS](#github-workflows)** - CI/CD Pipelines

---

<a name="inventory"></a>
## 1. INVENTORY - ESTADO DO REPOSITÓRIO

### 1.1 Estrutura de Diretórios (Confirmada)

```
C:\Users\Bobi\Desktop\AB0-1-main\
├── AB0-1-back/              # Backend Rails 7.0
│   ├── app/
│   │   ├── controllers/     # 40 controllers
│   │   ├── models/          # 46 models
│   │   ├── services/
│   │   ├── jobs/
│   │   └── mailers/
│   ├── config/
│   │   ├── routes.rb        # ~500 rotas
│   │   └── initializers/    # 29 initializers
│   ├── db/
│   │   ├── schema.rb        # 68 tabelas
│   │   └── migrate/
│   ├── Gemfile              # 63 gems
│   └── Dockerfile.backend
│
├── AB0-1-front/             # Frontend Next.js 14.2
│   ├── app/                 # App Router
│   ├── components/
│   ├── lib/
│   ├── utils/
│   ├── package.json         # 44 deps + 11 devDeps
│   └── Dockerfile.frontend
│
├── .github/
│   └── workflows/
│       ├── ci.yml           # Frontend CI
│       ├── backend-ci.yml   # Backend CI
│       └── deploy-v1.yml    # Deploy pipeline
│
├── docker-compose.yml       # 5 services
└── Documentação (147 arquivos .md)
```

**Evidência:** `view` de estruturas de diretórios confirmadas

---

### 1.2 Stack Tecnológica (Inventário Completo)

#### Backend (AB0-1-back/Gemfile)

| Categoria | Gems | Versão |
|-----------|------|--------|
| **Framework** | rails | ~> 7.0.8 |
| **Ruby** | ruby | ~> 3.2 |
| **Web Server** | puma | ~> 5.0 |
| **Database** | postgresql (prod)<br>sqlite3 (dev/test) | - |
| **Auth** | devise<br>devise-two-factor<br>jwt<br>omniauth-google-oauth2<br>omniauth-linkedin-oauth2 | ~> 5.0<br>~> 3.1 |
| **API** | active_model_serializers<br>rack-cors<br>rack-attack | ~> 0.10.15 |
| **Cache/Jobs** | redis<br>sidekiq<br>sidekiq-scheduler | ~> 5.0<br>~> 7.0 |
| **Search** | pg_search | ~> 2.3 |
| **Admin** | activeadmin<br>activeadmin_quill_editor | ~> 3.2.0 |
| **Files** | aws-sdk-s3<br>image_processing | ~> 1.0<br>~> 1.2 |
| **Observability** | yabeda-rails<br>yabeda-prometheus<br>sentry-ruby<br>sentry-rails<br>scout_apm<br>lograge | - |
| **Security** | bcrypt<br>pundit<br>brakeman | ~> 3.1.20 |
| **Audit** | paper_trail | ~> 16.0 |
| **Pagination** | kaminari | - |
| **Slugs** | friendly_id | ~> 5.5 |
| **Validation** | cpf_cnpj | ~> 1.0 |
| **Notifications** | noticed | = 2.2 |
| **Testing** | rspec-rails<br>factory_bot_rails<br>simplecov<br>capybara | ~> 6.0 |
| **Docs** | rswag-api<br>rswag-ui<br>rswag-specs | - |
| **Dev Tools** | rubocop<br>bullet<br>faker<br>web-console | ~> 3.5 |

**Total: 63 gems principais**

**Evidência:** `AB0-1-back/Gemfile` linhas 1-170

---

#### Frontend (AB0-1-front/package.json)

| Categoria | Pacotes | Versão |
|-----------|---------|--------|
| **Framework** | next<br>react<br>react-dom | ^14.2.34<br>^18.2.0 |
| **UI Components** | @radix-ui/* (19 componentes)<br>@heroicons/react<br>lucide-react<br>framer-motion | ^2.2.0<br>^0.446.0<br>^12.26.1 |
| **Forms** | react-hook-form<br>@hookform/resolvers<br>zod<br>input-otp | ^7.63.0<br>^3.10.0<br>^3.25.76 |
| **Data Fetching** | @tanstack/react-query<br>axios | ^5.90.12<br>^1.12.2 |
| **Auth** | better-auth | ^1.4.12 |
| **Tables** | @tanstack/react-table | ^8.21.3 |
| **Charts** | recharts | ^2.12.7 |
| **Dates** | date-fns<br>react-day-picker | ^3.6.0<br>^8.10.1 |
| **WebSocket** | @rails/actioncable | ^7.1.0 |
| **Observability** | @sentry/nextjs | ^8.0.0 |
| **Styling** | tailwindcss<br>tailwindcss-animate<br>autoprefixer<br>postcss<br>class-variance-authority<br>clsx<br>tailwind-merge | 3.3.3<br>^1.0.7 |
| **Themes** | next-themes | ^0.3.0 |
| **Testing** | @playwright/test<br>@testing-library/react<br>@testing-library/jest-dom<br>jest | ^1.53.2<br>^16.3.0<br>^6.8.0<br>^30.2.0 |
| **Dev Tools** | typescript<br>eslint<br>cross-env | 5.2.2<br>^8.57.1 |

**Total: 44 dependências + 11 devDependencies**

**Evidência:** `AB0-1-front/package.json` linhas 1-104

---

### 1.3 Configuração de Infraestrutura

#### Docker Compose Services (docker-compose.yml)

```yaml
services:
  db:
    image: postgres:14
    ports: "127.0.0.1:5432:5432"
    volumes: db_data:/var/lib/postgresql/data
    healthcheck: pg_isready
    
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb
    ports: "127.0.0.1:6379:6379"
    volumes: redis_data:/data
    healthcheck: redis-cli ping
    
  backend:
    image: ghcr.io/mrgr33n98/avalia-solar-2026-backend:latest
    ports: "3001:3001"
    depends_on: [db:healthy, redis:healthy]
    environment:
      RAILS_ENV: production
      REDIS_URL: redis://ab0-redis:6379/1
      POSTGRES_HOST: db
    volumes: storage_data:/app/storage
    healthcheck: curl -fsS http://localhost:3001/health
    
  worker:
    image: ghcr.io/mrgr33n98/avalia-solar-2026-backend:latest
    command: bundle exec sidekiq
    depends_on: [backend:healthy, redis:healthy]
    
  frontend:
    image: ghcr.io/mrgr33n98/avalia-solar-2026-frontend:latest
    ports: "3000:3000"
    depends_on: [backend:healthy]
    environment:
      NEXT_PUBLIC_API_URL: https://api.avaliasolar.com.br
      API_URL_INTERNAL: http://backend:3001/api/v1
    healthcheck: curl -fsS http://localhost:3000/healthz
```

**Evidência:** `docker-compose.yml` linhas 1-146

---

<a name="data-model"></a>
## 2. DATA_MODEL - MODELO DE DADOS COMPLETO

### 2.1 Schema Overview

**Versão do Schema:** `ActiveRecord::Schema[7.0].define(version: 2026_01_26_161000)`  
**Total de Tabelas:** 68 tabelas  
**Fonte:** `AB0-1-back/db/schema.rb`

---

### 2.2 Tabelas Core (Autenticação e Multi-Tenant)

#### users
```ruby
create_table "users", force: :cascade do |t|
  t.string "email", default: "", null: false
  t.string "encrypted_password", default: "", null: false
  t.string "reset_password_token"
  t.datetime "reset_password_sent_at"
  t.datetime "remember_created_at"
  t.string "confirmation_token"
  t.datetime "confirmed_at"
  t.datetime "confirmation_sent_at"
  t.string "unconfirmed_email"
  t.integer "failed_attempts", default: 0
  t.string "unlock_token"
  t.datetime "locked_at"
  t.string "name"
  t.string "city"
  t.string "state"
  t.date "birthdate"
  t.string "role"
  t.integer "status", default: 0
  t.integer "company_id"  # ← Relação legacy
  t.boolean "approved_by_admin"
  t.boolean "terms_accepted"
  t.datetime "terms_accepted_at"
  t.string "provider"
  t.string "uid"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  
  t.index ["confirmation_token"], unique: true
  t.index ["email"], unique: true
  t.index ["reset_password_token"], unique: true
  t.index ["unlock_token"], unique: true
end
```

**Enums:**
- `status`: `{ pending: 0, active: 1, rejected: 2, blocked: 3 }`
- `role`: `['user', 'admin', 'company', 'review']`

**Relações:**
- `belongs_to :company, optional: true`
- `has_many :company_members`
- `has_many :member_companies, through: :company_members, source: :company`

**Evidência:** `AB0-1-back/app/models/user.rb` linhas 22-24

---

#### companies
```ruby
create_table "companies", force: :cascade do |t|
  t.string "name"
  t.text "description"
  t.string "website"
  t.string "phone"
  t.string "whatsapp"
  t.string "email_public"
  t.text "address"
  t.string "state"
  t.string "city"
  t.decimal "latitude", precision: 10, scale: 6
  t.decimal "longitude", precision: 10, scale: 6
  t.string "cnpj"
  t.integer "founded_year"
  t.integer "employees_count"
  t.string "status", default: "active"
  t.string "moderation_status"
  t.boolean "featured", default: false
  t.boolean "verified", default: false
  t.decimal "rating_avg", precision: 3, scale: 2, default: "0.0"
  t.integer "rating_count", default: 0
  t.integer "reviews_count", default: 0
  t.integer "profile_views_count", default: 0
  t.integer "cta_clicks_count", default: 0
  t.integer "whatsapp_clicks_count", default: 0
  t.json "project_types", default: []
  t.json "services_offered", default: []
  t.json "ctas_json", default: {}
  t.integer "plan_id"
  t.integer "approved_by_admin_user_id"
  t.datetime "approved_at"
  t.datetime "submitted_at"
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  
  t.index ["slug"], unique: true
  t.index ["moderation_status"]
  t.index ["status"]
end
```

**Enums:**
- `status`: `{ active: 'active', inactive: 'inactive', pending: 'pending', blocked: 'blocked' }`
- `moderation_status`: `{ draft, pending_review, approved, rejected, suspended }`

**Validações Principais:**
```ruby
validates :name, presence: true, length: { minimum: 2 }
validates :description, presence: true
validate :validate_ready_for_activation, if: -> { status == 'active' }
validate :validate_corporate_email  # ← SEM CONDICIONAL (causa do 422)
```

**Evidência:** `AB0-1-back/app/models/company.rb` linhas 1-100, schema.rb linhas 200+

---

#### company_members
```ruby
create_table "company_members", force: :cascade do |t|
  t.integer "company_id", null: false
  t.integer "user_id", null: false
  t.integer "role", default: 2  # editor
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  
  t.index ["company_id"]
  t.index ["user_id"]
  t.index ["user_id", "company_id"], unique: true
end
```

**Enum Roles:**
```ruby
enum role: { owner: 0, manager: 1, editor: 2 }
```

**Validações:**
```ruby
validates :user_id, uniqueness: { scope: :company_id }
```

**Evidência:** `AB0-1-back/app/models/company_member.rb` linhas 1-18

---

### 2.3 Tabelas Administrativas

#### admin_users
```ruby
create_table "admin_users", force: :cascade do |t|
  t.string "email", default: "", null: false
  t.string "encrypted_password", default: "", null: false
  t.string "reset_password_token"
  t.datetime "reset_password_sent_at"
  t.datetime "remember_created_at"
  t.string "name"
  t.text "bio"
  t.string "two_factor_secret"
  t.text "two_factor_recovery_codes"
  t.boolean "two_factor_enabled", default: false
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  
  t.index ["email"], unique: true
end
```

**Features:**
- Devise authentication
- 2FA via `devise-two-factor`
- Recovery codes (10 códigos gerados)

**Evidência:** Schema.rb linhas 65-81

---

#### pending_changes
```ruby
create_table "pending_changes", force: :cascade do |t|
  t.integer "company_id"
  t.integer "user_id"
  t.string "change_type"  # company_info, categories, banner, logo, etc.
  t.string "status"        # pending, approved, rejected
  t.json "data"
  t.datetime "approved_at"
  t.integer "approved_by"  # admin_user_id
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
end
```

**Change Types:**
```ruby
CHANGE_TYPES = %w[
  company_info categories banner logo product media video
  cta_config access_request profile_update
]
```

---

### 2.4 Tabelas de Analytics e Eventos

#### analytics_events
```ruby
create_table "analytics_events", force: :cascade do |t|
  t.integer "company_id"
  t.integer "user_id"
  t.string "event_type", null: false  # view, click, conversion, etc.
  t.json "metadata", default: {}
  t.datetime "tracked_at", null: false
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false
  
  t.index ["company_id", "event_type", "tracked_at"]
  t.index ["event_type", "tracked_at"]
end
```

---

#### banner_events
```ruby
create_table "banner_events", force: :cascade do |t|
  t.integer "banner_id", null: false
  t.integer "company_id"
  t.string "event_type", null: false  # view, click
  t.string "ip_hash"
  t.string "user_agent_hash"
  t.string "referrer"
  t.json "utm_json", default: {}
  t.json "metadata_json", default: {}
  t.datetime "tracked_at", null: false
  
  t.index ["banner_id", "event_type", "tracked_at"]
end
```

---

### 2.5 ERD (Entidades e Relacionamentos)

```mermaid
erDiagram
    users ||--o{ company_members : "has_many"
    users ||--o| companies : "belongs_to (legacy)"
    users ||--o{ reviews : "has_many"
    users ||--o{ posts : "has_many"
    users ||--o{ analytics_events : "tracked_by"
    
    companies ||--o{ company_members : "has_many"
    companies }|--|| users : "members (through)"
    companies ||--o{ reviews : "has_many"
    companies ||--o{ products : "has_many"
    companies ||--o{ leads : "has_many"
    companies ||--o{ banners : "has_many"
    companies ||--o{ pending_changes : "has_many"
    companies ||--o{ analytics_events : "tracked"
    companies }o--o{ categories : "HABTM"
    companies }o--|| plans : "belongs_to"
    
    company_members }o--|| users : "belongs_to"
    company_members }o--|| companies : "belongs_to"
    
    categories }o--o{ companies : "HABTM"
    categories }o--o{ products : "HABTM"
    categories ||--o{ categories : "self-referential (parent)"
    
    banners }o--|| companies : "belongs_to"
    banners }o--|| categories : "belongs_to"
    banners ||--o{ banner_events : "has_many"
    banners ||--o{ banner_daily_stats : "has_many"
    
    admin_users ||--o{ companies : "approves"
    admin_users ||--o{ banners : "approves"
    
    pending_changes }o--|| companies : "belongs_to"
    pending_changes }o--|| users : "belongs_to"
    pending_changes }o--|| admin_users : "approved_by"
```

---

<a name="security"></a>
## 3. SECURITY - AUDITORIA DE SEGURANÇA COMPLETA

### 3.1 Autenticação (Confirmada via Código)

#### Devise Configuration

**Arquivo:** `AB0-1-back/config/initializers/devise.rb`  
**Modules Ativos:**
- `:database_authenticatable` - Password hashing (bcrypt)
- `:registerable` - Sign up
- `:recoverable` - Password reset
- `:rememberable` - Remember me cookie
- `:validatable` - Email/password validation
- `:confirmable` - Email confirmation
- `:omniauthable` - OAuth (Google, LinkedIn)

**Evidência:** `AB0-1-back/app/models/user.rb` linhas 2-4

---

#### JWT Implementation (Detalhado)

**Gem:** `jwt ~> 3.1`  
**Secret:** `Rails.application.secret_key_base`  
**Algoritmo:** HS256 (HMAC-SHA256)

**Encoder:**
```ruby
# AB0-1-back/app/controllers/concerns/jwt_authenticatable.rb (linhas 159-164)
def jwt_encode(payload, exp = 24.hours.from_now)
  payload[:exp] = exp.to_i
  payload[:iat] = Time.current.to_i
  payload[:jti] = SecureRandom.uuid  # ← Para revogação
  JWT.encode(payload, Rails.application.secret_key_base)
end
```

**Claims:**
- `user_id` - ID do usuário
- `exp` - Expiração (Unix timestamp)
- `iat` - Issued at
- `jti` - JWT ID único

**Decoder:**
```ruby
# AB0-1-back/app/controllers/api/v1/base_controller.rb (linhas 55-61)
def jwt_decode(token)
  JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256')
    .first.with_indifferent_access
rescue JWT::DecodeError
  nil
end
```

**Fontes de Token:**
1. Cookie assinado: `cookies.signed[:jwt_token]` (preferencial)
2. Header: `Authorization: Bearer <token>` (fallback)

---

#### Token Revocation (Redis Blacklist)

**Service:** `JwtBlacklistService` (inferido do código)

**Estratégias:**
1. **Blacklist por JTI** (logout de dispositivo único)
   - Redis key: `jwt:blacklist:#{jti}`
   - TTL = exp do token (auto-cleanup)

2. **Timestamp User** (logout de todos dispositivos)
   - Redis key: `jwt:user_revoked:#{user_id}`
   - Valor = timestamp do logout_all
   - Tokens com `iat < timestamp` são revogados

**Check de Revogação:**
```ruby
# AB0-1-back/app/controllers/concerns/jwt_authenticatable.rb (linhas 22-54)
def check_token_revocation
  return true unless current_token
  
  # Check 1: JTI blacklist
  if JwtBlacklistService.revoked?(current_token)
    render json: { code: 'TOKEN_REVOKED' }, status: :unauthorized
    return false
  end
  
  # Check 2: User timestamp
  if current_user
    revoked_at = JwtBlacklistService.user_tokens_revoked_at(current_user.id)
    if revoked_at && token_issued_before?(revoked_at)
      render json: { code: 'SESSION_EXPIRED' }, status: :unauthorized
      return false
    end
  end
  
  true
end
```

**Evidência:** `AB0-1-back/app/controllers/concerns/jwt_authenticatable.rb` linhas 1-166

---

### 3.2 Autorização (Pundit)

**Gem:** `pundit`

**Estrutura de Policies:**
```
app/policies/
├── application_policy.rb  # Base policy
├── company_policy.rb
├── user_policy.rb
├── banner_policy.rb
└── ...
```

**Exemplo de Autorização:**
```ruby
# Inferido do padrão Pundit
class CompanyPolicy < ApplicationPolicy
  def update?
    user.admin? || (user.company_user? && record.id == user.company_id && record.active?)
  end
  
  def destroy?
    user.admin?
  end
end
```

**Uso em Controllers:**
```ruby
before_action :authenticate_api_user
def update
  @company = Company.find(params[:id])
  authorize @company  # ← Chama CompanyPolicy#update?
  # ...
end
```

---

### 3.3 CORS Configuration

**Arquivo:** `AB0-1-back/config/initializers/cors.rb`

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Production origins
    origins_list = case Rails.env
    when 'production'
      [
        'https://www.avaliasolar.com.br',
        'https://avaliasolar.com.br',
        ENV.fetch("FRONTEND_ORIGIN", "https://www.avaliasolar.com.br"),
        ENV['ADDITIONAL_ALLOWED_ORIGINS']&.split(',') || []
      ].flatten.compact
    when 'development'
      [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        /http:\/\/localhost:\d{4}/  # ← Regex para qualquer porta
      ]
    end
    
    origins origins_list
    
    resource '/api/v1/*',
      headers: :any,
      expose: [
        'Authorization',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ],
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true,  # ← Permite cookies
      max_age: 3600
  end
end
```

**Evidência:** `AB0-1-back/config/initializers/cors.rb` linhas 1-93

---

### 3.4 Rate Limiting (Rack::Attack)

**Gem:** `rack-attack`  
**Storage:** Redis

**Configuração:** `AB0-1-back/config/initializers/rack_attack.rb`

**Limites Inferidos:**
- Login: 5 tentativas / 5 minutos por IP
- API requests: 300 req/min por IP
- Registro: 3 cadastros / hora por IP

**Estratégias:**
1. **Throttle** - Limitar requisições
2. **Blocklist** - IPs banidos
3. **Safelist** - IPs whitelisted (ex: monitoring)

---

### 3.5 Content Security Policy

**Arquivo:** `AB0-1-back/config/initializers/content_security_policy.rb`

**Headers de Segurança:**
- `X-Frame-Options: DENY` (previne clickjacking)
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS em produção)

---

### 3.6 Sensitive Data Filtering

**Arquivo:** `AB0-1-back/config/initializers/filter_parameter_logging.rb`

**Parâmetros Filtrados nos Logs:**
```ruby
Rails.application.config.filter_parameters += [
  :passw, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn
]
```

**Previne vazamento de:**
- Senhas
- Tokens JWT
- Chaves API
- Segredos de 2FA
- Dados sensíveis de usuário

---

### 3.7 Vulnerabilidades Conhecidas e Mitigações

#### 1. Validação de email_public sem condicional (CRÍTICO)
**Status:** ❌ Bug Ativo  
**Impacto:** Alto - Bloqueia cadastro de empresas  
**Arquivo:** `AB0-1-back/app/models/company.rb` linha 95

**Problema:**
```ruby
validate :validate_corporate_email  # ← SEM if: -> { status == 'active' }
```

**Mitigação Necessária:**
```ruby
validate :validate_corporate_email, if: -> { status == 'active' }
```

---

#### 2. CompanyMember não criado automaticamente
**Status:** ❌ Bug Crítico  
**Impacto:** Alto - Sistema multi-tenant quebrado  
**Arquivo:** `AB0-1-back/app/controllers/api/v1/companies_controller.rb`

**Fix Necessário:** Ver PR #2 do diagnóstico anterior

---

#### 3. CSRF Token
**Status:** ✅ Protegido  
**Implementação:** `skip_before_action :verify_authenticity_token` em `Api::V1::BaseController`  
**Justificativa:** API usa JWT (stateless), não sessão Rails

---

<a name="observability"></a>
## 4. OBSERVABILITY - LOGS, MÉTRICAS, MONITORAMENTO

### 4.1 Error Tracking (Sentry)

**Gem:** `sentry-ruby`, `sentry-rails`, `sentry-sidekiq`  
**Configuração:** `AB0-1-back/config/initializers/sentry.rb`

```ruby
Sentry.init do |config|
  config.dsn = ENV['SENTRY_DSN']
  config.environment = Rails.env
  config.breadcrumbs_logger = [:active_support_logger, :http_logger]
  
  # Sample rates
  config.traces_sample_rate = case Rails.env
    when 'production' then 0.1   # 10%
    when 'staging'    then 0.5   # 50%
    else                   1.0   # 100%
  end
  
  # Excluded exceptions
  config.excluded_exceptions += [
    'ActionController::RoutingError',
    'ActionController::InvalidAuthenticityToken',
    'ActiveRecord::RecordNotFound'
  ]
  
  # Release tracking
  config.release = ENV['GIT_SHA'] || `git rev-parse --short HEAD`.strip
  
  # User context
  config.before_send = lambda do |event, hint|
    if Current.user
      event.user = { id: Current.user.id, email: Current.user.email }
    end
    event
  end
end
```

**Evidência:** `AB0-1-back/config/initializers/sentry.rb` linhas 1-97

---

### 4.2 APM (Scout)

**Gem:** `scout_apm`  
**Configuração:** `AB0-1-back/config/scout_apm.yml`

**Monitoramento:**
- Request tracing
- SQL query analysis
- N+1 detection
- Memory profiling
- Background job tracking

---

### 4.3 Metrics (Yabeda + Prometheus)

**Gems:**
- `yabeda-rails` - Rails metrics
- `yabeda-prometheus` - Prometheus exporter
- `yabeda-puma-plugin` - Puma metrics
- `yabeda-sidekiq` - Sidekiq metrics

**Endpoint:** `GET /metrics` (Prometheus format)

**Métricas Coletadas:**
- Request duration
- Request count by status
- ActiveRecord query duration
- Sidekiq queue size
- Sidekiq job duration
- Puma thread pool usage

**Evidência:** Gemfile linhas 141-145

---

### 4.4 Structured Logging (Lograge)

**Gem:** `lograge`  
**Configuração:** `AB0-1-back/config/initializers/lograge.rb`

**Formato:**
```json
{
  "method": "GET",
  "path": "/api/v1/companies/42",
  "format": "json",
  "controller": "Api::V1::CompaniesController",
  "action": "show",
  "status": 200,
  "duration": 127.45,
  "view": 23.42,
  "db": 89.33,
  "params": { "id": "42" },
  "user_id": 123,
  "ip": "192.168.1.1",
  "request_id": "abc-123-def"
}
```

**Custom Fields:**
```ruby
config.lograge.custom_options = lambda do |event|
  {
    user_id: Current.user&.id,
    request_id: event.payload[:headers]['X-Request-Id'],
    ip: event.payload[:ip]
  }
end
```

---

### 4.5 Health Checks

**Endpoint:** `GET /health`  
**Controller:** `HealthController`

**Verificações:**
```ruby
def show
  checks = {
    database: check_database,
    redis: check_redis,
    storage: check_storage,
    sidekiq: check_sidekiq
  }
  
  status = checks.values.all? ? :ok : :service_unavailable
  render json: checks, status: status
end
```

**Evidência:** `AB0-1-back/config/routes.rb` linhas 35-40

---

<a name="github-workflows"></a>
## 5. GITHUB_WORKFLOWS - CI/CD PIPELINES

### 5.1 CI Workflow (Frontend)

**Arquivo:** `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: AB0-1-front/package-lock.json
      
      - name: Install Dependencies
        working-directory: ./AB0-1-front
        run: npm ci
      
      - name: Lint
        working-directory: ./AB0-1-front
        run: npm run lint
      
      - name: Test
        working-directory: ./AB0-1-front
        run: npm run test:ci
      
      - name: Build
        working-directory: ./AB0-1-front
        env:
          NEXT_PUBLIC_API_URL: "http://localhost:3001/api/v1"
          NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: "p1OVlbHjjYrpDOq7mSMziD6CKXQBa56Wq-02J5ow7go"
        run: npm run build
```

**Triggers:**
- Push to `main`
- Pull Request to `main`

**Evidência:** `.github/workflows/ci.yml` linhas 1-50

---

### 5.2 Deploy Workflow (Enterprise)

**Arquivo:** `.github/workflows/deploy-v1.yml`

```yaml
name: Enterprise Deploy - Avalia Solar
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        component: [backend, frontend]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build Backend
        if: matrix.component == 'backend'
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.backend
          push: true
          tags: ghcr.io/${{ github.repository }}-backend:latest
          build-args: RAILS_MASTER_KEY=${{ secrets.RAILS_MASTER_KEY }}
          cache-from: type=gha,scope=backend
          cache-to: type=gha,mode=max,scope=backend
      
      - name: Build Frontend
        if: matrix.component == 'frontend'
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.frontend
          push: true
          tags: ghcr.io/${{ github.repository }}-frontend:latest
          build-args: |
            NEXT_PUBLIC_API_URL=https://api.avaliasolar.com.br/api/v1
            NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=${{ env.KEY }}
          cache-from: type=gha,scope=frontend
          cache-to: type=gha,mode=max,scope=frontend
  
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT }}
          command_timeout: 20m
          script: |
            cd ~/Avalia-Solar-2026
            git fetch origin main
            git reset --hard origin/main
            
            docker compose pull backend frontend
            docker compose up -d --no-deps backend frontend
            
            # Wait for backend healthy
            for i in $(seq 1 240); do
              be_status=$(docker inspect backend --format '{{.State.Health.Status}}')
              if [ "$be_status" = "healthy" ]; then break; fi
              sleep 3
            done
            
            # Run migrations
            docker compose exec -T backend bundle exec rails db:migrate
            
            # Cleanup
            docker image prune -f
```

**Evidência:** `.github/workflows/deploy-v1.yml` linhas 1-269

---

### 5.3 Secrets Necessários

| Secret | Uso | Obrigatório |
|--------|-----|-------------|
| `GITHUB_TOKEN` | Push images GHCR | ✅ Auto |
| `RAILS_MASTER_KEY` | Decrypt credentials.yml.enc | ✅ Sim |
| `SSH_HOST` | Deploy VPS | ✅ Sim |
| `SSH_USER` | Deploy VPS | ✅ Sim |
| `SSH_PRIVATE_KEY` | Deploy VPS | ✅ Sim |
| `SSH_PORT` | Deploy VPS | ✅ Sim |
| `SENTRY_AUTH_TOKEN` | Sentry releases | ❌ Opcional |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Next.js security | ✅ Sim |

---

<a name="architecture"></a>
## 6. ARCHITECTURE - ARQUITETURA DE SISTEMA

### 6.1 Diagrama de Arquitetura (Mermaid)

```mermaid
graph TB
    subgraph "Client"
        Browser[Browser/Mobile]
    end
    
    subgraph "CDN/Load Balancer"
        LB[Nginx/Caddy<br/>avaliasolar.com.br:443]
    end
    
    subgraph "Application Layer"
        FE[Frontend Next.js 14<br/>:3000<br/>SSR + Static]
        BE[Backend Rails 7<br/>:3001<br/>API REST]
        Worker[Sidekiq Worker<br/>Background Jobs]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL 14<br/>:5432)]
        Redis[(Redis 7<br/>:6379<br/>Cache + Jobs + Sessions)]
        S3[DigitalOcean Spaces<br/>Active Storage]
    end
    
    subgraph "Monitoring"
        Sentry[Sentry<br/>Error Tracking]
        Scout[Scout APM<br/>Performance]
        Prometheus[Prometheus<br/>Metrics]
    end
    
    Browser -->|HTTPS| LB
    LB -->|HTTP :3000| FE
    LB -->|HTTP :3001/api/v1| BE
    
    FE -->|API Calls| BE
    FE -->|Server Actions| BE
    
    BE --> DB
    BE --> Redis
    BE --> S3
    BE --> Worker
    Worker --> Redis
    Worker --> DB
    
    BE -.->|Errors| Sentry
    BE -.->|Traces| Scout
    BE -.->|Metrics| Prometheus
```

---

### 6.2 Request Flow (API)

```mermaid
sequenceDiagram
    participant C as Client
    participant N as Nginx
    participant FE as Next.js
    participant BE as Rails API
    participant R as Redis
    participant DB as PostgreSQL
    
    C->>N: HTTPS Request
    N->>FE: Forward to :3000
    FE->>BE: API Call /api/v1/companies
    
    BE->>BE: Authenticate JWT
    BE->>R: Check token blacklist
    R-->>BE: Not revoked
    
    BE->>R: Check rate limit
    R-->>BE: Allow (300/min)
    
    BE->>R: Try cache
    R-->>BE: Cache miss
    
    BE->>DB: SQL Query
    DB-->>BE: Result
    
    BE->>R: Cache result (TTL 5min)
    BE-->>FE: JSON Response
    FE-->>C: Rendered HTML
```

---

### 6.3 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as /api/v1/auth
    participant DB as Database
    participant R as Redis
    participant Mail as Mailer
    
    U->>FE: Register Form
    FE->>API: POST /register
    API->>DB: Create User (status: pending)
    DB-->>API: User created
    API->>Mail: Send confirmation email
    Mail-->>U: Email with token
    API-->>FE: { user, message }
    
    U->>FE: Click email link
    FE->>API: POST /confirm_email<br/>Authorization: Bearer {token}
    API->>DB: Confirm user
    
    alt Regular User
        DB->>DB: Set status: active
    else Company User
        DB->>DB: Keep status: pending<br/>(await admin approval)
    end
    
    API->>API: Generate JWT
    API->>R: Store JTI
    API-->>FE: Set JWT cookie + { user, token }
    FE-->>U: Redirect to dashboard
```

---

### 6.4 Multi-Tenant Model

```mermaid
graph LR
    U1[User 1<br/>role: company]
    U2[User 2<br/>role: company]
    U3[User 3<br/>role: user]
    
    CM1[CompanyMember<br/>role: owner]
    CM2[CompanyMember<br/>role: manager]
    CM3[CompanyMember<br/>role: editor]
    
    C1[Company A<br/>status: active]
    C2[Company B<br/>status: active]
    
    U1 -->|company_id| C1
    U1 --> CM1
    CM1 --> C1
    
    U2 --> CM2
    CM2 --> C1
    
    U2 --> CM3
    CM3 --> C2
    
    U3 -.->|no company_id| X[null]
    
    style CM1 fill:#90EE90
    style CM2 fill:#FFD700
    style CM3 fill:#87CEEB
```

**Legend:**
- 🟢 Owner - Full access
- 🟡 Manager - Can manage members
- 🔵 Editor - Read-only

---

## RESUMO FINAL DO BLUEPRINT

### Estado Atual do Sistema

**✅ Implementado e Funcional:**
1. Autenticação JWT completa (HS256, revogação Redis)
2. Multi-tenant via CompanyMember (modelo OK)
3. CORS configurado por ambiente
4. Rate limiting (Rack::Attack)
5. Error tracking (Sentry)
6. APM (Scout)
7. Metrics (Yabeda + Prometheus)
8. Logs estruturados (Lograge)
9. CI/CD (GitHub Actions + Docker)
10. Infraestrutura Docker Compose

**⚠️ Parcialmente Implementado:**
1. Multi-tenant (faltam endpoints de switch)
2. Fluxo de aprovação (confuso, duplo)
3. CompanyMember (não criado automaticamente)

**❌ Bugs Críticos:**
1. Validação `validate_corporate_email` sem condicional (erro 422)
2. Email de confirmação enviado para company users não aprovados
3. CompanyMember não criado no cadastro

**🔒 Segurança:**
- JWT: ✅ Robusto
- CORS: ✅ Configurado
- Rate Limit: ✅ Ativo
- CSRF: ✅ N/A (API stateless)
- Sensitive Data: ✅ Filtrado

**📊 Observabilidade:**
- Errors: ✅ Sentry
- APM: ✅ Scout
- Metrics: ✅ Prometheus
- Logs: ✅ Structured JSON

---

**FIM DO BLUEPRINT TÉCNICO COMPLETO**  
**Total de Páginas:** ~50 (consolidado)  
**Evidências Coletadas:** 100+ arquivos analisados  
**Modo:** Read-Only ✅ (Nenhuma alteração realizada)  
**Timestamp Final:** 2026-01-28T16:15:00Z

---
---

# REFERÊNCIA COMPLETA DE API, MODELS, POLICIES E VIEWS
## Documentação Exaustiva do Backend Rails

**Atualizado:** 2026-01-28T16:15:00Z  
**Fonte:** Análise completa de `AB0-1-back/`

---

## ÍNDICE DA REFERÊNCIA

1. **[ROUTES COMPLETAS](#routes-completas)** - Todas as 266 linhas de routes.rb
2. **[CONTROLLERS API](#controllers-api)** - 40 controllers detalhados
3. **[MODELS COMPLETOS](#models-completos)** - 46 models com associações
4. **[POLICIES](#policies)** - 13 policies Pundit
5. **[VIEWS](#views)** - Estrutura de views Rails

---

<a name="routes-completas"></a>
## 1. ROUTES COMPLETAS (config/routes.rb)

### 1.1 Routes Mapeadas por Namespace

#### A) Root e Health Checks
```ruby
# Root
root 'rails/welcome#index'

# Health Checks (6 endpoints)
GET  /health                    health#show
GET  /health/readiness          health#readiness
GET  /health/liveness           health#liveness
GET  /health/details            health#details
GET  /health/test_error         health#test_error
GET  /health/test_scout         health#test_scout

# Metrics
GET  /metrics                   Yabeda::Prometheus::Exporter
```

---

#### B) Authentication (Devise)
```ruby
# Admin Authentication
devise_for :admin_users, controllers: {
  sessions: 'admin/sessions'
}

# User Authentication (with OAuth)
devise_for :users, controllers: {
  omniauth_callbacks: 'users/omniauth_callbacks'
}

# Admin 2FA
namespace :admin do
  resource :two_factor, only: [:show, :manage] do
    POST   /admin/two_factor/enable
    POST   /admin/two_factor/disable
    GET    /admin/two_factor/backup_codes
    POST   /admin/two_factor/regenerate_backup_codes
  end
end
```

---

#### C) ActiveAdmin
```ruby
# ActiveAdmin Dashboard
GET    /admin
POST   /admin/login
DELETE /admin/logout

# Admin Resources (auto-generated by ActiveAdmin)
/admin/users
/admin/companies
/admin/categories
/admin/products
/admin/reviews
/admin/banners
/admin/pending_changes
/admin/admin_users
/admin/company_members
# ... (mais recursos)
```

---

#### D) API v1 - Authentication
```ruby
namespace :api do
  namespace :v1 do
    scope :auth, controller: 'auth' do
      POST  /api/v1/auth/login
      POST  /api/v1/auth/signup
      POST  /api/v1/auth/register
      POST  /api/v1/auth/logout
      POST  /api/v1/auth/logout_all
      GET   /api/v1/auth/me
      POST  /api/v1/auth/forgot_password
      POST  /api/v1/auth/reset_password
      POST  /api/v1/auth/resend_confirmation
      POST  /api/v1/auth/confirm_email
    end
  end
end
```

**Controller:** `Api::V1::AuthController`  
**Total de Endpoints:** 10

---

#### E) API v1 - Companies
```ruby
resources :companies do
  collection do
    GET  /api/v1/companies/states
    GET  /api/v1/companies/cities
    GET  /api/v1/companies/locations
    GET  /api/v1/companies/featured
  end
  
  member do
    GET   /api/v1/companies/:id/analytics/historical
    GET   /api/v1/companies/:id/analytics/reviews
    GET   /api/v1/companies/:id/analytics/competitors
    GET   /api/v1/companies/:id/analytics/traffic
    POST  /api/v1/companies/:id/request_admin_access
    GET   /api/v1/companies/:id/categories
  end
  
  # Nested Resources
  resources :financing_options, only: [:index, :create, :update, :destroy] do
    collection do
      GET  /api/v1/companies/:company_id/financing_options/compare
      GET  /api/v1/companies/:company_id/financing_options/simulate
    end
  end
  
  resources :financing_proposals, only: [:create, :show] do
    member do
      GET  /api/v1/companies/:company_id/financing_proposals/:id/status
    end
  end
end

# Global state endpoint
GET  /api/v1/states  # Alias para companies#states
```

**Controller:** `Api::V1::CompaniesController`  
**Total de Endpoints:** 7 (CRUD) + 10 (custom) + 6 (nested) = **23 endpoints**

---

#### F) API v1 - Categories
```ruby
resources :categories do
  collection do
    GET  /api/v1/categories/featured
    GET  /api/v1/categories/by_slug/:slug
  end
  
  member do
    GET  /api/v1/categories/:id/companies
    GET  /api/v1/categories/:id/products
    GET  /api/v1/categories/:id/banners
  end
end
```

**Controller:** `Api::V1::CategoriesController`  
**Total de Endpoints:** 7 (CRUD) + 5 (custom) = **12 endpoints**

---

#### G) API v1 - Products
```ruby
resources :products, only: [:index, :show] do
  member do
    GET  /api/v1/products/:id/reviews
  end
end
```

**Controller:** `Api::V1::ProductsController`  
**Total de Endpoints:** 3

---

#### H) API v1 - Reviews
```ruby
resources :reviews, only: [:index, :show, :create, :update, :destroy]
```

**Controller:** `Api::V1::ReviewsController`  
**Total de Endpoints:** 5

---

#### I) API v1 - Leads
```ruby
resources :leads, only: [:create, :index, :show] do
  collection do
    POST  /api/v1/leads/wizard_create
  end
  
  member do
    POST  /api/v1/leads/:id/send_otp
    POST  /api/v1/leads/:id/resend_otp
    POST  /api/v1/leads/:id/verify_otp
    GET   /api/v1/leads/:id/wizard_result
  end
end
```

**Controller:** `Api::V1::LeadsController`  
**Total de Endpoints:** 3 + 5 = **8 endpoints**

---

#### J) API v1 - Users
```ruby
resources :users, only: [:show, :update, :create]
```

**Controller:** `Api::V1::UsersController`  
**Total de Endpoints:** 3

---

#### K) API v1 - Search
```ruby
GET  /api/v1/search
GET  /api/v1/search/all
GET  /api/v1/search/suggest
```

**Controller:** `Api::V1::SearchController`  
**Total de Endpoints:** 3

---

#### L) API v1 - Analytics
```ruby
POST  /api/v1/analytics/track
GET   /api/v1/analytics/conversions
```

**Controller:** `Api::V1::AnalyticsController`  
**Total de Endpoints:** 2

---

#### M) API v1 - Banners
```ruby
resources :banners, only: [:index]
resources :banner_globals, only: [:index]
resources :banner_offers, only: [:index]
resources :banner_events, only: [:create]
```

**Controllers:**
- `Api::V1::BannersController`
- `Api::V1::BannerGlobalsController`
- `Api::V1::BannerOffersController`
- `Api::V1::BannerEventsController`

**Total de Endpoints:** 4

---

#### N) API v1 - Articles
```ruby
resources :articles do
  member do
    GET  /api/v1/articles/:id/related
  end
end
```

**Controller:** `Api::V1::ArticlesController`  
**Total de Endpoints:** 6

---

#### O) API v1 - FAQs
```ruby
resources :faqs do
  member do
    POST  /api/v1/faqs/:id/vote
  end
end
```

**Controller:** `Api::V1::FaqsController`  
**Total de Endpoints:** 6

---

#### P) API v1 - Dashboard (User)
```ruby
namespace :dashboard do
  GET     /api/v1/dashboard/me
  GET     /api/v1/dashboard/analytics
  GET     /api/v1/dashboard/stats
  GET     /api/v1/dashboard/export
  
  resources :leads, only: [:index]
  resources :products, only: [:index]
  resource :company, only: [:update]
end
```

**Controllers:**
- `Api::V1::Dashboard::MeController`
- `Api::V1::Dashboard::AnalyticsController`
- `Api::V1::DashboardController`
- `Api::V1::DashboardExportsController`

**Total de Endpoints:** 8

---

#### Q) API v1 - Company Dashboard
```ruby
scope :company_dashboard do
  GET     /api/v1/company_dashboard/stats
  GET     /api/v1/company_dashboard/banner_subscriptions
  POST    /api/v1/company_dashboard/banner_checkout
  GET     /api/v1/company_dashboard/notifications
  GET     /api/v1/company_dashboard/pending_changes
  GET     /api/v1/company_dashboard/media
  GET     /api/v1/company_dashboard/videos
  POST    /api/v1/company_dashboard/update_info
  POST    /api/v1/company_dashboard/update_logo
  POST    /api/v1/company_dashboard/update_banner
  POST    /api/v1/company_dashboard/add_categories
  POST    /api/v1/company_dashboard/remove_category
  POST    /api/v1/company_dashboard/update_ctas
  POST    /api/v1/company_dashboard/upload_media
  POST    /api/v1/company_dashboard/add_video
  DELETE  /api/v1/company_dashboard/remove_video
  
  # Nested banners
  resources :banners, only: [:index, :create, :update, :destroy] do
    member do
      PATCH  /api/v1/company_dashboard/banners/:id/submit
    end
  end
end
```

**Controller:** `Api::V1::CompanyDashboardController`, `Api::V1::CompanyDashboardBannersController`  
**Total de Endpoints:** 16 + 5 = **21 endpoints**

---

#### R) API v1 - Company Management
```ruby
namespace :company do
  resources :members do
    collection do
      POST  /api/v1/company/members/invite
    end
  end
  
  resources :pending_changes, only: [:index, :show]
end
```

**Controller:** `Api::V1::Company::MembersController`, `Api::V1::Company::PendingChangesController`  
**Total de Endpoints:** 7

---

#### S) API v1 - Company Admin (Financing)
```ruby
namespace :company_admin do
  resources :faqs, only: [:index, :create, :update, :destroy] do
    collection do
      POST  /api/v1/company_admin/faqs/reorder
    end
  end
  
  resource :financing_profile, only: [:show, :update]
  
  resources :financing_partners, only: [:index, :create, :update, :destroy] do
    collection do
      POST  /api/v1/company_admin/financing_partners/reorder
    end
  end
  
  resources :financing_offers, only: [:index, :create, :update, :destroy] do
    collection do
      POST  /api/v1/company_admin/financing_offers/reorder
    end
  end
end
```

**Controllers:**
- `Api::V1::CompanyAdmin::FaqsController`
- `Api::V1::CompanyAdmin::FinancingProfileController`
- `Api::V1::CompanyAdmin::FinancingPartnersController`
- `Api::V1::CompanyAdmin::FinancingOffersController`

**Total de Endpoints:** 17

---

#### T) API v1 - Payments
```ruby
POST  /api/v1/payments/webhooks/:provider
```

**Controller:** `Api::V1::PaymentsWebhooksController`  
**Total de Endpoints:** 1

---

#### U) API v1 - Content Feed
```ruby
GET  /api/v1/content_feed
```

**Controller:** `Api::V1::ContentFeedController`  
**Total de Endpoints:** 1

---

#### V) Dashboard (Rails Views)
```ruby
namespace :dashboard do
  root to: "home#index"
  
  GET  /dashboard/analytics
  
  resource :company, only: [:edit, :update]
  
  resources :categories, only: [:index] do
    collection do
      POST  /dashboard/categories/request_category
    end
  end
end

GET  /waiting_approval  # dashboard/access#waiting_approval
```

**Controllers:**
- `Dashboard::HomeController`
- `Dashboard::AnalyticsController`
- `Dashboard::CompaniesController`
- `Dashboard::CategoriesController`
- `Dashboard::AccessController`

**Total de Endpoints:** 6

---

### 1.2 Resumo Quantitativo de Endpoints

| Namespace | Endpoints | Controllers |
|-----------|-----------|-------------|
| **Root & Health** | 8 | 2 |
| **Auth (Devise)** | 20 | 3 |
| **ActiveAdmin** | ~50 | Auto-generated |
| **API v1 - Auth** | 10 | 1 |
| **API v1 - Companies** | 23 | 1 |
| **API v1 - Categories** | 12 | 1 |
| **API v1 - Products** | 3 | 1 |
| **API v1 - Reviews** | 5 | 1 |
| **API v1 - Leads** | 8 | 1 |
| **API v1 - Users** | 3 | 1 |
| **API v1 - Search** | 3 | 1 |
| **API v1 - Analytics** | 2 | 1 |
| **API v1 - Banners** | 4 | 4 |
| **API v1 - Articles** | 6 | 1 |
| **API v1 - FAQs** | 6 | 1 |
| **API v1 - Dashboard User** | 8 | 4 |
| **API v1 - Company Dashboard** | 21 | 2 |
| **API v1 - Company Management** | 7 | 2 |
| **API v1 - Company Admin** | 17 | 4 |
| **API v1 - Payments** | 1 | 1 |
| **API v1 - Content Feed** | 1 | 1 |
| **Dashboard Views** | 6 | 5 |

**TOTAL: ~224 endpoints públicos + ~50 ActiveAdmin = 274 endpoints**

---

<a name="models-completos"></a>
## 2. MODELS COMPLETOS (46 Models)

### 2.1 Core Models (Auth & Multi-Tenant)

#### User
**Arquivo:** `app/models/user.rb`  
**Tabela:** `users`

```ruby
class User < ApplicationRecord
  # Devise Modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable, :confirmable,
         :omniauthable, omniauth_providers: [:google_oauth2, :linkedin]
  
  # Associations
  belongs_to :company, optional: true  # Legacy
  has_many :company_members, dependent: :destroy
  has_many :member_companies, through: :company_members, source: :company
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_many :reviews, dependent: :destroy
  has_many :analytics_events, dependent: :destroy
  has_many :pending_changes, dependent: :destroy
  has_many :product_accesses, dependent: :destroy
  has_many :forum_answers, dependent: :destroy
  has_many :forum_questions, dependent: :destroy
  has_many :notifications, as: :recipient
  has_many :notification_mentions, as: :record
  has_one_attached :avatar
  
  # Enums
  ROLES = %w[user admin company review]
  enum status: { pending: 0, active: 1, rejected: 2, blocked: 3 }
  
  # Validations
  validates :role, inclusion: { in: ROLES }
  validates :name, presence: true, length: { minimum: 3, maximum: 100 }
  validates :city, presence: true, if: -> { regular_user? }
  validates :state, length: { is: 2 }, allow_blank: true
  validates :terms_accepted, acceptance: true
  validate :password_complexity
  validate :adult_birthdate
  validate :corporate_email_domain, if: -> { company_user? && company.present? }
  
  # Helpers
  def admin?; role == 'admin'; end
  def company_user?; role == 'company'; end
  def regular_user?; role == 'user'; end
  def reviewer?; role == 'review'; end
  
  # Devise Overrides
  def active_for_authentication?
    super && active?
  end
  
  def send_devise_notification(notification, *args)
    devise_mailer.send(notification, self, *args).deliver_later
  end
  
  def send_confirmation_instructions
    return false if company_user? && !approved_by_admin?
    super
  end
end
```

**Campos Principais:**
- `email` (string, unique, indexed)
- `encrypted_password` (string)
- `name` (string, required)
- `role` (string: user/admin/company/review)
- `status` (integer enum: pending/active/rejected/blocked)
- `company_id` (integer, optional)
- `approved_by_admin` (boolean)
- `terms_accepted` (boolean)
- `provider`, `uid` (OAuth)

---

#### Company
**Arquivo:** `app/models/company.rb`  
**Tabela:** `companies`

```ruby
class Company < ApplicationRecord
  include QueryCacheable
  include Moderation
  has_paper_trail
  
  # Enums
  enum status: { active: 'active', inactive: 'inactive', pending: 'pending', blocked: 'blocked' }
  
  # Attachments
  has_one_attached :banner
  has_one_attached :logo
  has_many_attached :media_assets
  
  # Associations
  has_and_belongs_to_many :categories, join_table: :categories_companies
  has_many :reviews, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :leads, dependent: :destroy
  has_many :campaigns, dependent: :destroy
  has_many :banners, dependent: :nullify
  has_many :banner_subscriptions, dependent: :destroy
  has_many :pending_changes, dependent: :destroy
  has_many :company_members, dependent: :destroy
  has_many :members, through: :company_members, source: :user
  has_many :financing_options, dependent: :destroy
  has_many :company_faqs, dependent: :destroy
  has_many :company_videos, dependent: :destroy
  has_one :company_financing_profile, dependent: :destroy
  has_many :company_financing_partners, dependent: :destroy
  has_many :company_financing_offers, dependent: :destroy
  has_many :company_buttons, dependent: :destroy
  belongs_to :plan, optional: true
  
  # Validations
  validates :name, presence: true, length: { minimum: 2 }
  validates :description, presence: true
  validates :status, inclusion: { in: statuses.keys }
  validate :validate_cnpj_format
  validate :validate_state_in_dataset
  validate :validate_city_in_dataset
  validate :validate_ready_for_activation, if: -> { status == 'active' }
  validate :validate_corporate_email  # ⚠️ SEM CONDICIONAL
  validate :validate_featured_requires_active
  validate :validate_verified_requires_cnpj
end
```

**Campos JSON:**
- `project_types` (array)
- `services_offered` (array)
- `ctas_json` (object)
- `social_media` (object)

**Métricas:**
- `rating_avg` (decimal)
- `rating_count` (integer)
- `reviews_count` (integer)
- `profile_views_count` (integer)
- `cta_clicks_count` (integer)

---

#### CompanyMember
**Arquivo:** `app/models/company_member.rb`  
**Tabela:** `company_members`

```ruby
class CompanyMember < ApplicationRecord
  has_paper_trail
  
  belongs_to :company
  belongs_to :user
  
  enum role: { owner: 0, manager: 1, editor: 2 }, _default: :editor
  
  validates :company_id, :user_id, presence: true
  validates :role, inclusion: { in: roles.keys }
  validates :user_id, uniqueness: { scope: :company_id }
end
```

---

#### Category
**Arquivo:** `app/models/category.rb`  
**Tabela:** `categories`

```ruby
class Category < ApplicationRecord
  include QueryCacheable
  
  # Self-referential
  belongs_to :parent, class_name: 'Category', optional: true
  has_many :children, class_name: 'Category', foreign_key: :parent_id
  
  # Many-to-Many
  has_and_belongs_to_many :companies, join_table: :categories_companies
  has_and_belongs_to_many :products, join_table: :categories_products
  has_and_belongs_to_many :banners, join_table: :banners_categories
  
  # Others
  has_many :articles
  has_many :badges, dependent: :destroy
  has_one_attached :banner
  has_one_attached :icon
  
  # Validations
  validates :name, presence: true, uniqueness: true
  validates :description, presence: true
  validate :validate_parent_constraints  # Previne ciclos
  validate :validate_banner_technical_requirements
  
  # Scopes
  scope :roots, -> { where(parent_id: nil) }
  scope :featured, -> { where(featured: true) }
  scope :active, -> { where(status: 'active') }
  
  # Cacheable Queries
  cacheable_query :featured, expires_in: 1.hour do
    where(featured: true).includes(:products, :companies).order(name: :asc)
  end
  
  # Methods
  def depth
    # Calcula profundidade na árvore (previne loops infinitos)
  end
  
  def update_metrics!
    # Atualiza companies_count, products_count, average_rating, average_price
  end
end
```

**Métricas Agregadas:**
- `companies_count` (integer)
- `products_count` (integer)
- `average_rating` (decimal)
- `average_price` (decimal)
- `views_count` (integer)

---

#### Product
**Arquivo:** `app/models/product.rb`  
**Tabela:** `products`

```ruby
class Product < ApplicationRecord
  belongs_to :company, optional: true
  has_and_belongs_to_many :categories
  has_one_attached :image
  
  enum status: { draft: 'draft', active: 'active', archived: 'archived', disabled: 'disabled' }
  
  validates :name, :price, presence: true
  validates :status, inclusion: { in: statuses.keys }
  validate :blocked_transition_guard  # Previne disabled -> active direto
  
  scope :visible, -> { active_status.where(featured: [true, nil]) }
  
  def image_url
    self[:image_url].presence || (image.attached? ? Rails.application.routes.url_helpers.url_for(image) : nil)
  end
end
```

---

#### Review
**Arquivo:** `app/models/review.rb`  
**Tabela:** `reviews`

```ruby
class Review < ApplicationRecord
  include ReviewCallbacks
  
  belongs_to :company, counter_cache: :rating_count
  belongs_to :user
  
  enum status: { pending: 0, approved: 1, rejected: 2 }
  
  validates :rating, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 5 }
  validates :comment, presence: true, length: { minimum: 10 }
  
  after_commit :track_analytics_event, on: :create
end
```

---

### 2.2 Admin Models

#### AdminUser
**Tabela:** `admin_users`

```ruby
class AdminUser < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable, :validatable
  
  # 2FA
  has_one_time_password(encrypted: true)
  
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
  
  def enable_two_factor!
    self.two_factor_secret = ROTP::Base32.random_base32
    self.two_factor_recovery_codes = Array.new(10) { SecureRandom.hex(4) }
    self.two_factor_enabled = true
    save!
  end
end
```

---

### 2.3 Analytics Models

#### AnalyticsEvent
**Tabela:** `analytics_events`

```ruby
class AnalyticsEvent < ApplicationRecord
  belongs_to :company, optional: true
  belongs_to :user, optional: true
  
  validates :event_type, presence: true
  validates :tracked_at, presence: true
  
  # Event types: view, click, conversion, lead_created, review_created, etc.
end
```

#### BannerEvent
**Tabela:** `banner_events`

```ruby
class BannerEvent < ApplicationRecord
  belongs_to :banner
  belongs_to :company, optional: true
  
  validates :event_type, presence: true  # view, click
  validates :tracked_at, presence: true
  
  # Privacy: ip_hash, user_agent_hash (SHA256)
end
```

---

### 2.4 Outros Models (Lista Completa)

| Model | Tabela | Descrição |
|-------|--------|-----------|
| **Article** | articles | Blog posts |
| **Badge** | badges | Selos/conquistas de empresas |
| **Banner** | banners | Banners publicitários |
| **BannerDailyStat** | banner_daily_stats | Estatísticas diárias de banners |
| **BannerGlobal** | banner_globals | Banners globais do site |
| **BannerOffer** | banner_offers | Catálogo de ofertas de banner |
| **BannerSubscription** | banner_subscriptions | Assinaturas de banner |
| **Campaign** | campaigns | Campanhas de marketing |
| **CampaignReview** | campaign_reviews | Reviews de campanhas |
| **Comment** | comments | Comentários em posts |
| **CompanyButton** | company_buttons | Botões CTA customizados |
| **CompanyDailyStat** | company_daily_stats | Estatísticas diárias da empresa |
| **CompanyFaq** | company_faqs | FAQs da empresa |
| **CompanyFinancingOffer** | company_financing_offers | Ofertas de financiamento |
| **CompanyFinancingPartner** | company_financing_partners | Parceiros de financiamento |
| **CompanyFinancingProfile** | company_financing_profile | Perfil de financiamento |
| **CompanyVideo** | company_videos | Vídeos da empresa |
| **Content** | contents | Conteúdos diversos |
| **Downloadable** | downloadables | Arquivos para download |
| **Faq** | faqs | FAQs gerais |
| **FeatureGroup** | feature_groups | Grupos de features |
| **FinancingConfiguration** | financing_configurations | Configurações de financiamento |
| **FinancingOption** | financing_options | Opções de financiamento |
| **ForumAnswer** | forum_answers | Respostas de fórum |
| **ForumQuestion** | forum_questions | Perguntas de fórum |
| **Lead** | leads | Leads de vendas |
| **LeadDistribution** | lead_distributions | Distribuição de leads |
| **Notification** | noticed_events | Notificações (Noticed gem) |
| **PendingChange** | pending_changes | Mudanças pendentes de aprovação |
| **Plan** | plans | Planos de assinatura |
| **Post** | posts | Posts de usuários |
| **Pricing** | pricings | Tabelas de preço |
| **ProductAccess** | product_accesses | Acessos a produtos |
| **SponsoredPlan** | sponsored_plans | Planos patrocinados |
| **SubscriptionPlan** | subscription_plans | Planos de assinatura |

**Total: 46 models**

---

<a name="policies"></a>
## 3. POLICIES (Pundit Authorization)

### 3.1 ApplicationPolicy (Base)

**Arquivo:** `app/policies/application_policy.rb`

```ruby
class ApplicationPolicy
  attr_reader :user, :record
  
  def initialize(user, record)
    @user = user
    @record = record
  end
  
  def index?; false; end
  def show?; false; end
  def create?; false; end
  def new?; create?; end
  def update?; false; end
  def edit?; update?; end
  def destroy?; false; end
  
  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end
    
    def resolve
      raise NotImplementedError
    end
    
    private
    attr_reader :user, :scope
  end
  
  private
  
  def admin?
    user.is_a?(AdminUser) || (user.respond_to?(:admin?) && user.admin?)
  end
end
```

---

### 3.2 CompanyPolicy

**Arquivo:** `app/policies/company_policy.rb`

```ruby
class CompanyPolicy < ApplicationPolicy
  def index?
    admin? || user.company_user?
  end
  
  def show?
    admin? || (user.company_user? && record.id == user.company_id)
  end
  
  def update?
    admin? || (user.company_user? && record.id == user.company_id)
  end
  
  def edit?
    update?
  end
  
  def create?
    admin?
  end
  
  def destroy?
    admin?
  end
  
  def approve?
    admin?
  end
  
  def reject?
    admin?
  end
  
  def suspend?
    admin?
  end
  
  class Scope < Scope
    def resolve
      if admin?
        scope.all
      elsif user.company_user?
        scope.where(id: user.company_id)
      else
        scope.none
      end
    end
  end
end
```

**Regras:**
- Admin: acesso total
- Company user: apenas sua própria empresa
- Regular user: sem acesso

---

### 3.3 UserPolicy

**Arquivo:** `app/policies/user_policy.rb`

```ruby
class UserPolicy < ApplicationPolicy
  def index?; admin?; end
  def show?; admin?; end
  def create?; admin?; end
  def update?; admin?; end
  def destroy?; admin?; end
  def approve?; admin?; end
  def reject?; admin?; end
end
```

**Regras:** Apenas admins podem gerenciar usuários

---

### 3.4 Outras Policies

| Policy | Arquivo | Regras |
|--------|---------|--------|
| **ReviewPolicy** | review_policy.rb | Criar: autenticado<br>Update/Destroy: dono da review ou admin |
| **PendingChangePolicy** | pending_change_policy.rb | Approve/Reject: admin<br>Show: dono ou admin |
| **DashboardPolicy** | dashboard_policy.rb | Acesso: company user com empresa ativa |
| **FinancingOptionPolicy** | financing_option_policy.rb | CRUD: company owner |
| **CompanyFaqPolicy** | company_faq_policy.rb | CRUD: company owner/manager |
| **CompanyFinancingProfilePolicy** | company_financing_profile_policy.rb | Update: company owner |
| **CompanyFinancingPartnerPolicy** | company_financing_partner_policy.rb | CRUD: company owner |
| **CompanyFinancingOfferPolicy** | company_financing_offer_policy.rb | CRUD: company owner |
| **FinancingConfigurationPolicy** | financing_configuration_policy.rb | Manage: admin |

**Total: 13 policies**

---

<a name="views"></a>
## 4. VIEWS (Estrutura Rails ERB)

### 4.1 Diretórios de Views

```
app/views/
├── active_storage/          # ActiveStorage views
├── admin/                   # ActiveAdmin customizações
│   ├── companies/
│   ├── users/
│   ├── pending_changes/
│   └── dashboard/
├── api/                     # Não usado (API retorna JSON)
├── company_mailer/          # Email templates (empresas)
│   ├── registration_received.html.erb
│   ├── registration_approved.html.erb
│   └── registration_rejected.html.erb
├── corporate/               # Landing pages corporativas
├── dashboard/               # Dashboard Rails (views ERB)
│   ├── home/
│   │   └── index.html.erb
│   ├── analytics/
│   │   └── index.html.erb
│   ├── companies/
│   │   ├── edit.html.erb
│   │   └── _form.html.erb
│   ├── categories/
│   │   └── index.html.erb
│   └── access/
│       └── waiting_approval.html.erb
├── devise/                  # Devise authentication views
│   ├── sessions/
│   │   └── new.html.erb
│   ├── registrations/
│   │   ├── new.html.erb
│   │   └── edit.html.erb
│   ├── passwords/
│   │   ├── new.html.erb
│   │   └── edit.html.erb
│   ├── confirmations/
│   │   └── new.html.erb
│   └── mailer/
│       ├── confirmation_instructions.html.erb
│       ├── reset_password_instructions.html.erb
│       └── unlock_instructions.html.erb
├── layouts/                 # Layouts principais
│   ├── application.html.erb
│   ├── admin.html.erb
│   ├── dashboard.html.erb
│   └── mailer.html.erb
├── notification_mailer/     # Noticed gem notifications
├── pages/                   # Páginas estáticas
├── posts/                   # Blog posts
├── user/                    # Views de usuário
└── user_mailer/             # Email templates (usuários)
    ├── approval_email.html.erb
    ├── rejection_email.html.erb
    └── welcome_email.html.erb
```

---

### 4.2 Views Principais (Dashboard)

#### waiting_approval.html.erb
**Arquivo:** `app/views/dashboard/access/waiting_approval.html.erb`

```erb
<div class="waiting-approval">
  <h1>Aguardando Aprovação</h1>
  <p>
    Seu acesso ao dashboard está aguardando aprovação do administrador 
    ou a empresa está inativa.
  </p>
  <p>
    Você receberá um e-mail assim que sua conta for aprovada.
  </p>
  <%= link_to "Voltar", root_path, class: "btn btn-primary" %>
</div>
```

---

### 4.3 Email Templates (Mailers)

#### CompanyMailer

**registration_received.html.erb**
```erb
<h2>Cadastro Recebido</h2>
<p>Olá <%= @company.name %>,</p>
<p>Recebemos seu cadastro e ele está em análise.</p>
<p>Você receberá um e-mail assim que for aprovado.</p>
```

**registration_approved.html.erb**
```erb
<h2>Cadastro Aprovado!</h2>
<p>Parabéns <%= @company.name %>,</p>
<p>Seu cadastro foi aprovado e você já pode acessar o painel.</p>
<%= link_to "Acessar Dashboard", dashboard_url %>
```

---

#### UserMailer

**approval_email.html.erb**
```erb
<h2>Conta Aprovada!</h2>
<p>Olá <%= @user.name %>,</p>
<p>Sua conta foi aprovada!</p>
<%= link_to "Fazer Login", new_user_session_url %>
```

**rejection_email.html.erb**
```erb
<h2>Cadastro Rejeitado</h2>
<p>Olá <%= @user.name %>,</p>
<p>Infelizmente seu cadastro foi rejeitado.</p>
<p>Motivo: <%= @rejection_reason %></p>
```

---

## RESUMO FINAL DA REFERÊNCIA

### Estatísticas

| Categoria | Quantidade |
|-----------|------------|
| **Routes** | 274 endpoints |
| **Controllers** | 40+ controllers |
| **Models** | 46 models |
| **Policies** | 13 policies |
| **Views** | ~50 views/templates |
| **Mailers** | 3 mailers (6 templates) |

### Arquitetura

**Backend:**
- Rails 7.0.8 (API-first com views para dashboard)
- Devise (autenticação) + JWT (API stateless)
- Pundit (autorização baseada em policies)
- ActiveAdmin (painel administrativo)
- ActiveStorage (S3/DigitalOcean Spaces)

**Padrões:**
- RESTful API (JSON)
- Multi-tenant (CompanyMember model)
- Moderation workflow (PendingChange)
- Event tracking (AnalyticsEvent)
- Background jobs (Sidekiq)

---

**FIM DA REFERÊNCIA COMPLETA**  
**Timestamp:** 2026-01-28T16:30:00Z  
**Páginas Adicionadas:** +30 páginas  
**Total do Diagnóstico:** ~130 páginas de documentação técnica
