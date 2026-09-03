# Email Sync Architecture

## Sync Mechanisms
- **AWS SES Webhooks**: Event ingestion for delivery, bounce, complaint, and click tracking.
- **Google / Gmail Sync**: Delta history API polling with webhook push support.
- **Microsoft Graph Sync**: Subscription notifications and delta link reconciliation.

## Status Observability
Stored in `sales_email_accounts`:
- `sync_status` (`idle`, `syncing`, `failed`, `degraded`)
- `messages_imported`, `messages_failed`, `last_synced_at`, `sync_error`.


## Configuração SES de produção

Defina `AWS_SES_CONFIGURATION_SET` no backend e associe ao Configuration Set um Event Destination SNS para `delivery`, `bounce`, `complaint` e `reject`. Defina também `AWS_SNS_TOPIC_ARN`; o webhook rejeita mensagens de outro tópico e valida a assinatura oficial do SNS.

Fluxo: SES Configuration Set → SNS Topic → `POST /api/v1/sales/ses_webhooks` → `Sales::EmailEvent`, com idempotência por `provider_event_id`.
