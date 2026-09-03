# Email Platform Release Gate Checklist

- [x] **Real AWS SES Integration**: Provider dispatches real requests via AWS SES / config client and records `provider_message_id`.
- [x] **Fail-Closed Renderer**: Empty bodies or invalid recipient emails halt dispatch before reaching provider.
- [x] **Server-side Variable Engine**: Resolves `person.*`, `company.*`, `lead.*`, `owner.*`, `solar.*`, `custom_field.*`.
- [x] **Multi-Participant & Thread Support**: Supports `from`, `to`, `cc`, `bcc` and relates threads via `In-Reply-To`.
- [x] **SES Event Ingestion**: Webhooks receive `delivered`, `bounce`, `complaint` idempotently.
- [x] **Engagement Tracking**: Pixel `/t/email/open/:token.gif` and link click `/t/email/click/:token`.
- [x] **Unified 3-Pane Inbox UI**: Complete responsive frontend workspace at `/dashboard/sales/emails`.
- [x] **Automated Tests**: RSpec specs, `npm run typecheck` (0 errors), and Playwright E2E.
