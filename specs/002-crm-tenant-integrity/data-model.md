# Data Model & Integrity Contract: CRM Tenant Isolation & Referential Integrity

**Spec**: `specs/002-crm-tenant-integrity/spec.md`
**Plan**: `specs/002-crm-tenant-integrity/plan.md`

## Entity Tenant Derivation Hierarchy

```
Company (company_id) [Canonical Tenant Anchor]
  └── Sales::Account (company_id OR owner.company_id fallback)
        ├── Sales::Contact (sales_account_id)
        │     ├── Sales::ContactEmployment (contact_id + account_id)
        │     └── Sales::Consent (contact_id)
        ├── Sales::Opportunity / Lead (account_id)
        │     ├── Sales::Qualification (opportunity_id)
        │     └── Sales::OpportunityContact (opportunity_id + contact_id)
        ├── Sales::Task (account_id, owner_id)
        ├── Sales::Activity (account_id, actor_id)
        └── Sales::EmailMessage (company_id, account_id, contact_id, opportunity_id)
```

## Referential Integrity Matrix

| Entity | Primary FK | Secondary FKs | Validation Rule |
| :--- | :--- | :--- | :--- |
| **Task** | `account_id` | `contact_id`, `opportunity_id` | Must belong to authorized Account; contact & opportunity must belong to same Account. Owner must be current_user. |
| **Activity** | `account_id` | `contact_id`, `opportunity_id` | Must belong to authorized Account; contact & opportunity must belong to same Account. Actor is authenticated user. |
| **Qualification**| `opportunity_id` | N/A | Must be resolved via authorized Opportunity. |
| **Consent** | `contact_id` | N/A | Must be resolved via authorized Contact. |
| **Employment** | `contact_id` | `account_id` | Contact and Account must belong to the same tenant. |
| **EmailMessage** | `company_id` | `account_id`, `contact_id`, `opportunity_id` | `company_id` must match tenant derived from account/contact/opportunity. |
| **Lead / Opp** | `account_id` | `primary_contact_id`, `contact_ids`, `stage_id` | Account must be authorized; contacts must have employment in Account; stage must belong to selected pipeline. |
