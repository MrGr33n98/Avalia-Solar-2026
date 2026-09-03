# Email Platform Release Gate Checklist

- [ ] **Real AWS SES Integration:** Provider dispatches real requests via AWS SES / config client and records `provider_message_id`.
- [x] **Fail-Closed Renderer**: Empty bodies or invalid recipient emails halt dispatch before reaching provider.
- [x] **Server-side Variable Engine**: Resolves `person.*`, `company.*`, `lead.*`, `owner.*`, `solar.*`, `custom_field.*`.
- [x] **Multi-Participant & Thread Support**: Supports `from`, `to`, `cc`, `bcc` and relates threads via `In-Reply-To`.
- [ ] **SES Event Ingestion:** SNS verification requires production secret/topic validation; Webhooks receive `delivered`, `bounce`, `complaint` idempotently.
- [x] **Engagement Tracking**: Pixel `/t/email/open/:token.gif` and link click `/t/email/click/:token`.
- [x] **Unified 3-Pane Inbox UI**: Complete responsive frontend workspace at `/dashboard/sales/emails`.
- [x] **Automated Tests**: RSpec specs, `npm run typecheck` (0 errors), and Playwright E2E.

- [ ] Google provider: MISSING (stub fails closed).
- [ ] Microsoft provider: MISSING (stub fails closed).

## Recursos AWS obrigatórios

1. Identity SES verificada para o remetente e, enquanto a conta estiver em sandbox, para o destinatário.
2. Configuration Set com Event Destination SNS habilitado para `SEND`, `DELIVERY`, `BOUNCE`, `COMPLAINT` e `REJECT`.
3. SNS Topic com assinatura HTTP(S) para `/api/v1/sales/ses_webhooks`; defina o ARN em `AWS_SNS_TOPIC_ARN`.
4. Backend com `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` e `AWS_SES_CONFIGURATION_SET`.
5. Confirme a Subscription SNS pelo `SubscribeURL`; o controller valida o certificado e o tópico antes de aceitar eventos.

## Smoke test SES real

Em staging, com AWS SES e SNS configurados, execute:

```bash
RAILS_ENV=staging AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
  SMOKE_USER_ID=1 SMOKE_ACCOUNT_ID=1 SMOKE_TO_EMAIL=destino@staging.test \
  bundle exec ruby scripts/sales/ses_smoke_test.rb
```

O script falha fechado sem credenciais ou se não encontrar `provider_message_id` AWS; sem `SMOKE_EMAIL_MESSAGE_ID`, ele cria contato/thread/mensagem CRM, evento `sent` e atividade `email_sent`. Ele não cria dados falsos nem trata erro como sucesso.
