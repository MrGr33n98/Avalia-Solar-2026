# CRM Avalia Solar — Production Stability & Architecture Audit

> **HEAD Auditado:** `b4aee886d04097433c70782dbed431112c716b91`  
> **Data:** 2026-09-04  
> **Target:** `https://crm.avaliasolar.com.br`  
> **Status:** AUDITED & HARDENED

---

## 1. System Inventory

| Component | Technology | Version | Location / Path |
| --- | --- | --- | --- |
| Frontend Workspace | Next.js App Router | 14.2.34 / React 18 | `AB0-1-front/` |
| Backend API | Ruby on Rails 7 (API Mode) | 7.0.8 / Ruby 3.2.2 | `AB0-1-back/` |
| Database | PostgreSQL | 14+ | `AB0-1-back/db/` |
| Caching & Queues | Redis 7 + Sidekiq 7 | 7.0 | `AB0-1-back/config/initializers/sidekiq.rb` |
| Email Service | AWS SES V2 + SNS Webhooks | V2 | `app/services/sales/messaging/` |
| Auth & Authorization | Devise + Custom JWT + Pundit | 4.9 / Pundit 2.3 | `app/policies/sales/` |

---

## 2. Environment Dependencies & Feature Flags

- `JWT_SECRET` — Session validation on edge middleware and Rails controllers.
- `AWS_SES_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — Production transactional emails.
- `NEXT_PUBLIC_API_URL` — Proxy endpoint for `/api/v1/*`.
- `SEARCH_ENABLED=false` — Fallback to PostgreSQL multi-column ILIKE / tsvector queries when OpenSearch is offline.

---

## 3. Core Architecture Rules & Canonical Routes

1. **Canonical Operational Route:** `/dashboard/sales/leads` (All pipeline views use query parameters e.g., `/dashboard/sales/leads?view=kanban`).
2. **Canonical Account Route:** `/dashboard/sales/accounts` (Rendering `CompaniesPage`).
3. **Data Scoping:** All queries enforce `where(company_id: current_user.company_id)` or Pundit scopes to eliminate IDOR and multi-tenant data leakage.
4. **Post-F5 Guarantee:** Every CRUD operation is committed synchronously to PostgreSQL; no transient UI state relies exclusively on React state without backend persistence.
