# Sales Email Module — Current State Audit

## Backend Inventory (`AB0-1-back/`)

### 1. Existing Models
- `Sales::EmailMessage` (`app/models/sales/email_message.rb`): Represents individual outbound/inbound email records.
- `Sales::EmailEvent` (`app/models/sales/email_event.rb`): Stores lifecycle events (queued, sent, delivered, open, click, replied, bounce, complaint, reject, delivery_delay, failed), com escopo tenant.

### 2. Existing Controllers
- `Api::V1::Sales::EmailsController` (`app/controllers/api/v1/sales/emails_controller.rb`): Handles list, show, create, and send actions.
- `Api::V1::Sales::EmailEventsController` (`app/controllers/api/v1/sales/email_events_controller.rb`): Handles webhook event ingestion.

### 3. Existing Jobs & Background Infrastructure
- `Sales::SendEmailJob` (`app/jobs/sales/send_email_job.rb`): Sidekiq background job orchestrating email dispatch.
- **SES Provider**: Envio fail-closed via AWS SES V2; credenciais ausentes, erro AWS ou resposta sem `message_id` marcam falha e nunca geram ID sintético.

### 4. Infrastructure & Storage
- Sidekiq 7 + Redis 7 for queue management.
- ActiveStorage with DigitalOcean Spaces / S3 for email attachment persistence.
- PostgreSQL 14+ for tenant-scoped email storage.
