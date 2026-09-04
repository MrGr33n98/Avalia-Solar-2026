# Avalia Solar CRM — Tenant Ownership & Security Model

## 1. Overview & Canonical Tenant Identifier

In the Avalia Solar Sales Operating System, tenant isolation ensures that data from one organization is never exposed to another organization.

### Canonical Tenant Key Definition
- **CRM Tenant Ownership** is determined canonically by **`User.company_id`** (or `owner.company_id`).
- **`Sales::Account.company_id`** is an **optional one-to-one link** connecting a CRM Account to a public Marketplace Company record (indexed via partial unique index `index_sales_accounts_on_company_id`).
- **`Sales::Account.company_id` MUST NOT** be overloaded as the generic multi-tenant workspace identifier.

---

## 2. Resource Ownership Rules

### Account Ownership (`Sales::Account`)
- **Primary Owner**: `owner_id` (references `users.id`).
- **Tenant Scope**: All accounts owned by users belonging to `current_user.company_id` (or `owner_id = current_user.id` when `company_id` is null).
- **Marketplace Link**: Optional `company_id` pointing to the public Marketplace `Company`.

### Contact Ownership (`Sales::Contact`)
- **Primary Owner**: `owner_id` (references `users.id`) and optional `sales_account_id`.
- **Tenant Scope**: Direct resolution through `Sales::TenantScope.for(current_user).contacts`.
- **IDOR Protection**: Any query requesting contacts for an account MUST verify that the account belongs to `TenantScope.accounts`.

### Opportunity Ownership (`Sales::Opportunity`)
- **Primary Owner**: `owner_id` (references `users.id`) and linked `sales_account_id`.
- **Tenant Scope**: Direct resolution through `Sales::TenantScope.for(current_user).opportunities`.

---

## 3. User Roles & Edge Cases

### Admin Users (`role == 'admin'`)
- Admin users can view all records across tenants for platform maintenance and support.

### Users Without Company (`company_id == nil`)
- Users not associated with a marketplace company are scoped strictly by their own records (`owner_id = current_user.id`).

---

## 4. Tenant Scope Helper Interface

`Sales::TenantScope.for(user)` exposes scoped Active Record relations for all private Sales entities:
- `accounts`
- `contacts`
- `opportunities`
- `tasks`
- `activities`
- `notes`
- `email_messages`
- `email_events`
- `quotes`
- `quote_items`
- `tags`
- `saved_views`
- `sequences`
- `campaigns`
- `custom_field_definitions`
