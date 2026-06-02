# LGPD PostHog Historical Cleanup

## Internal database preview

Run the audit first. The default mode does not change rows:

```bash
bundle exec rake analytics:sanitize_historical_pii
```

After reviewing the counts and taking a database backup:

```bash
DRY_RUN=false bundle exec rake analytics:sanitize_historical_pii
```

The task sanitizes JSON payloads in `analytics_events`, `platform_events`, and
`event_ingest_errors`. It is intentionally not executed during deploy.

## PostHog cleanup

1. Export events and persons containing blocked properties such as `email`,
   `name`, `phone`, `cpf`, `cnpj`, `address`, `message`, or `search_term`.
2. Locate historical persons whose `distinct_id` is an email address.
3. Use the PostHog data deletion workflow to remove those persons and events.
4. Record the export date, deletion request ID, operator, and completion date.
5. Verify new events use `user_<id>`, `lead_<id>`, `company_<id>`, or anonymous
   technical identifiers only.

## Rollback

Use `G4_ANALYTICS_ENABLED=false` as the ingestion kill switch if contract
rejections or unexpected payloads appear after rollout.
