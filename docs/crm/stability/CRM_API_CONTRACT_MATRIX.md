# CRM Avalia Solar — API Contract Matrix

> Complete contract mapping between Frontend API Clients, REST Endpoints, Rails Controllers, Authorization Policies, and DB Models.

| Endpoint | Method | Request Payload | Response Schema | HTTP Statuses | Auth Required | Pundit Policy | Frontend Consumer | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/api/v1/sales/accounts` | GET | `q`, `segment`, `owner_id`, `page`, `per_page` | `{ accounts: Account[], meta: Meta }` | 200, 401, 403 | Yes | `Sales::AccountPolicy#index?` | `CompaniesPage.tsx` | PASS |
| `/api/v1/sales/accounts` | POST | `{ account: AccountParams }` | `{ account: Account }` | 201, 401, 403, 422 | Yes | `Sales::AccountPolicy#create?` | `CreateCompanyModal.tsx` | PASS |
| `/api/v1/sales/accounts/:id` | GET | None | `{ account: Account360Detail }` | 200, 401, 403, 404 | Yes | `Sales::AccountPolicy#show?` | `Account360FullView.tsx` | PASS |
| `/api/v1/sales/accounts/:id` | PATCH | `{ account: PartialAccountParams }` | `{ account: Account }` | 200, 401, 403, 422 | Yes | `Sales::AccountPolicy#update?` | `EditCompanyModal.tsx` | PASS |
| `/api/v1/sales/contacts` | GET | `q`, `account_id`, `page`, `per_page` | `{ contacts: Contact[], meta: Meta }` | 200, 401, 403 | Yes | `Sales::ContactPolicy#index?` | `PeoplePage.tsx` | PASS |
| `/api/v1/sales/contacts` | POST | `{ contact: ContactParams }` | `{ contact: Contact }` | 201, 401, 403, 422 | Yes | `Sales::ContactPolicy#create?` | `CreateContactModal.tsx` | PASS |
| `/api/v1/sales/contacts/:id` | GET | None | `{ contact: Person360Detail }` | 200, 401, 403, 404 | Yes | `Sales::ContactPolicy#show?` | `Person360FullView.tsx` | PASS |
| `/api/v1/sales/contacts/:id/timeline` | GET | `limit`, `offset` | `{ timeline: ActivityItem[] }` | 200, 401, 403, 404 | Yes | `Sales::ContactPolicy#show?` | `Person360Timeline.tsx` | PASS |
| `/api/v1/sales/leads` | GET | `status`, `owner_id`, `page` | `{ leads: Lead[], meta: Meta }` | 200, 401, 403 | Yes | `Sales::LeadPolicy#index?` | `LeadsPage.tsx` | PASS |
| `/api/v1/sales/opportunities` | GET | `pipeline_id`, `stage_id` | `{ opportunities: Opportunity[] }` | 200, 401, 403 | Yes | `Sales::OpportunityPolicy#index?` | `OpportunityBoard.tsx` | PASS |
| `/api/v1/sales/opportunities/:id` | PATCH | `{ opportunity: OpportunityParams }` | `{ opportunity: Opportunity }` | 200, 401, 403, 422 | Yes | `Sales::OpportunityPolicy#update?` | `OpportunityBoard.tsx` | PASS |
| `/api/v1/sales/emails` | POST | `{ email: EmailParams }` | `{ email: EmailMessage }` | 201, 401, 403, 422 | Yes | `Sales::EmailMessagePolicy#create?` | `EmailComposerModal.tsx` | PASS |
| `/api/v1/sales/ses_webhooks` | POST | SNS Webhook Envelope | `{ status: 'processed' \| 'ignored' }` | 200, 400, 401 | Webhook Token | Signature Check | AWS SNS Webhook Receiver | PASS |
| `/api/v1/sales/email_sequences` | GET | `active_only` | `{ email_sequences: EmailSequence[] }` | 200, 401, 403 | Yes | `Sales::EmailSequencePolicy#index?` | `EmailComposerModal.tsx` | PASS |
| `/api/v1/sales/email_suppressions` | GET | `email` | `{ email_suppressions: EmailSuppression[] }` | 200, 401, 403 | Yes | `Sales::EmailSuppressionPolicy#index?` | `SuppressionChecker.rb` | PASS |
| `/api/v1/sales/tasks` | GET | `status`, `assigned_to_id` | `{ tasks: Task[] }` | 200, 401, 403 | Yes | `Sales::TaskPolicy#index?` | `TasksPage.tsx` | PASS |
| `/api/v1/sales/tasks` | POST | `{ task: TaskParams }` | `{ task: Task }` | 201, 401, 403, 422 | Yes | `Sales::TaskPolicy#create?` | `CreateTaskModal.tsx` | PASS |
