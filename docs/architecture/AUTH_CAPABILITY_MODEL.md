# Modelo Canônico de Identidade e Capabilities de Autorização

**Projeto:** Avalia Solar 2026
**Status:** CANONICAL CAPABILITY MODEL (WAVE 1C)

---

## 1. Segregação de Identidade e Superfícies

O sistema implementa 3 superfícies de autorização distintas que não se misturam implicitamente:

```
                                      USER
                                       │
         ┌─────────────────────────────┼──────────────────────────────┐
         ▼                             ▼                              ▼
   1. Marketplace B2B/B2C        2. Internal Staff              3. Platform Admin
   - Role: 'company'/'review'    - UserRole -> Sales::Role      - Model: AdminUser / User(admin: true)
   - Membership: CompanyMember   - Permissions: sales.*         - Devise Scope: :admin_user
   - Superfície: /companies      - Superfície: /dashboard/sales - Superfície: /admin
```

---

## 2. Fluxo Canônico de Autorização de Requisição

```
REQUEST (HTTP Header Authorization: Bearer JWT)
   ↓
[Level 1 — Authentication]
BaseController#current_user (Verifica assinatura, exp, typ=access, e blacklist Redis)
   ↓
[Level 2 — Surface Access]
Sales::BaseController#require_sales_surface_access! (Sales::AuthorizationService.sales_access?)
   ↓
[Level 3 — Action Capability]
Sales::BaseController#require_sales_permission!(resource, action) (Sales::AuthorizationService.can?)
   ↓
[Policy & Scope Enforcement]
Pundit Policy (ex: Sales::OpportunityPolicy / CompanyDashboardPolicy)
   ↓
Policy Scope (Filtra apenas registros autorizados pelo ator)
   ↓
JSON Response
```

---

## 3. Segurança no Frontend e Contrato de Sessão

- O Frontend Next.js **NÃO** determina autorização por suposições de domínio de e-mail (`@avaliasolar.com.br`).
- A autorização é controlada pelo backend Rails via campos serializados no payload do usuário (`crm_access` e `sales_capabilities` em `UserSerializer` / `/api/v1/users/profile`).
- O `AuthContext` do Next.js consome exclusivamente essas propriedades backend-derived.
- Caso o usuário tente forçar navegação direta para `/dashboard/sales`, o backend retorna `403 SALES_FORBIDDEN` e barra o acesso aos dados independentemente da camada de apresentação.
