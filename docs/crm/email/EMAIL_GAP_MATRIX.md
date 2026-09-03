# Email Platform Gap Matrix

| Component / Feature | State | Description / Plan |
| --- | --- | --- |
| `Sales::EmailMessage` & `EmailEvent` | REAL | Fully persisted in DB with relationships to Account, Contact, Opportunity. |
| AWS SES Provider Integration | REAL | Real `Aws::SESV2::Client` / `Aws::SES::Client` provider with fallback to config client. |
| Fail-Closed Email Renderer | REAL | TipTap `body_json` schema to HTML/text with strict URL sanitization & validation. |
| Server-side Variable Resolver | REAL | Resolves `person.*`, `company.*`, `lead.*`, `owner.*`, `solar.*`, `custom_field.*`. |
| Email Threads & Participants | REAL | Multi-participant support (`from`, `to`, `cc`, `bcc`) and thread grouping by `In-Reply-To`. |
| Open & Click Tracking | REAL | `/t/email/open/:token.gif` pixel and `/t/email/click/:token` redirect handler. |
| Webhook SES Ingestion | REAL | Authenticated, idempotent endpoint for `delivered`, `bounce`, `complaint`. |
| Unified 3-Pane Inbox UI | REAL | High-density 3-pane layout (`/dashboard/sales/emails`) with folder navigation and thread viewer. |
