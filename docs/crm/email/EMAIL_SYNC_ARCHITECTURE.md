# Email Sync Architecture

## Sync Mechanisms
- **AWS SES Webhooks**: Event ingestion for delivery, bounce, complaint, and click tracking.
- **Google / Gmail Sync**: Delta history API polling with webhook push support.
- **Microsoft Graph Sync**: Subscription notifications and delta link reconciliation.

## Status Observability
Stored in `sales_email_accounts`:
- `sync_status` (`idle`, `syncing`, `failed`, `degraded`)
- `messages_imported`, `messages_failed`, `last_synced_at`, `sync_error`.
