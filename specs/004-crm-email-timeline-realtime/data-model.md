# Data model — Email Tracking + Timeline

## Entidades existentes a reutilizar

- `Sales::EmailMessage`: aggregate root de destinatário, remetente, thread, account/contact/opportunity, campaign/cadence e status legado.
- `Sales::EmailEvent`: evento bruto ligado à mensagem, com provider ID, payload, timestamp e UA/URL existentes.
- `Sales::EmailLink`: destino validado e contador de clique existente.
- `Sales::EmailThread`: agrupamento outbound atual; inbound ainda depende de provider/adapter.
- `Sales::EmailSuppression`: bloqueio tenant-scoped existente.

## Extensão proposta (migration aditiva)

`EmailEvent`: `source` (`aws_ses_sns`, `avalia_pixel`, `avalia_link`, `inbound_email`, `legacy`), `received_at`, `dedupe_key`, `signal_class` (`human_likely`, `proxy`, `bot`, `scanner`, `unknown`), `classification_reasons` JSON limitado/allowlisted e `schema_version`. Índice único parcial `(company_id, dedupe_key)` quando dedupe_key não nulo; preservar índice único atual de provider event.

`EmailMessage`: dimensão `delivery_status` e `engagement_status` mais timestamps `delayed_at`, `rejected_at`, `replied_at`; manter `status` legado durante compatibilidade. Contadores raw/unique só serão materializados se volume e consistência o justificarem; raw events são fonte auditável. Histórico legado de `open_count`/`click_count` não será reclassificado como humano nem unique.

## Invariantes

- Todo evento recebe `company_id` da mensagem e a FK não pode atravessar tenant.
- `provider_event_id` e `dedupe_key` idempotentes dentro do escopo acordado.
- Persistir raw event antes de broadcast; broadcast ocorre after-commit.
- Supression nunca é removida automaticamente por delivery/open/click.
- Timeline deriva lifecycle do aggregate root, não duplica Activity de email.

Antes da migration: conferir schema, nullability, collations, índices e dados legados; migration reversível e rollback ensaiado em banco descartável.
