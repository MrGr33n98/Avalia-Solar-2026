# CRM Avalia Solar — AWS SES & Email Engine Release Matrix

> Audit of AWS SES V2 transactional email integration, SNS Webhooks, Email Sequences, and Suppression enforcement.

---

## 1. Transactional Email Flow Audit

```text
CRM Composer (EmailComposerModal.tsx)
  │
  ▼
Rails API (POST /api/v1/sales/emails)
  │
  ▼
EmailMessage Model (status: 'queued', company_id scoped)
  │
  ▼
SendEmailJob (Sidekiq Worker)
  │
  ▼
AWS SES V2 API (SendEmailCommand)
  │
  ▼
Provider Message ID Attached (status: 'sent')
  │
  ▼
AWS SNS Topic Notification (Delivery / Bounce / Complaint / Open / Click)
  │
  ▼
SesWebhooksController (POST /api/v1/sales/ses_webhooks)
  │
  ▼
EmailMessage Event Persistence (status: 'delivered' | 'bounced' | 'complained')
  │
  ▼
UI Realtime Refresh / Person360 Timeline Sync
```

---

## 2. Test Verification Matrix

| Scenario | Component | Expected Outcome | Verification | Status |
| --- | --- | --- | --- | --- |
| Successful Send | `EmailComposerModal` -> `SendEmailJob` | Email sent via SES V2; `message_id` stored; status `sent`. | RSpec `spec/requests/api/v1/sales/emails_spec.rb` | PASS |
| Delivery SNS Event | `SesWebhooksController` | Event `delivery` recorded; status updated to `delivered`. | RSpec `spec/requests/api/v1/sales/ses_webhooks_spec.rb` | PASS |
| Bounce SNS Event | `SesWebhooksController` | Event `bounce` recorded; email added to `EmailSuppression`. | RSpec `spec/requests/api/v1/sales/ses_webhooks_spec.rb` | PASS |
| Complaint SNS Event | `SesWebhooksController` | Event `complaint` recorded; email added to `EmailSuppression`. | RSpec `spec/requests/api/v1/sales/ses_webhooks_spec.rb` | PASS |
| Open SNS Event | `EmailTrackingController` / Webhook | Event `open` recorded; `open_count` incremented. | RSpec `spec/requests/api/v1/sales/ses_webhooks_spec.rb` | PASS |
| Click SNS Event | `EmailTrackingController` / Webhook | Event `click` recorded; `click_count` incremented. | RSpec `spec/requests/api/v1/sales/ses_webhooks_spec.rb` | PASS |
| Suppressed Recipient | `SuppressionChecker` | Attempt to send to suppressed email throws `SuppressionError` (409). | RSpec `spec/services/sales/messaging/suppression_checker_spec.rb` | PASS |
| Sequence Step Delay | `EmailSequenceStep` | `SendSequenceStepJob` scheduled at `delay_days` interval. | RSpec `spec/models/sales/email_sequence_spec.rb` | PASS |
| Unsubscribe / Cancel | `EmailSequenceEnrollment` | Sequence canceled immediately upon contact unsubscribe. | RSpec `spec/models/sales/email_sequence_spec.rb` | PASS |
