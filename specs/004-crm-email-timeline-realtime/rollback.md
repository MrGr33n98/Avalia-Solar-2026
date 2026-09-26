# Rollback plan

- Keep additive schema and legacy email `status`/timeline contract during rollout.
- Disable frontend realtime flag to return to REST refresh path; keep delta API compatible.
- Stop broadcasting without dropping persisted EmailEvents; clients continue manual/fallback fetch.
- Revert host generation only through an explicit validated configuration change; never silently fall back to CRM host in production.
- If new status projection fails, retain raw events and use legacy status read adapter while repairing projection.
- Roll back migrations only after deploy rollback and confirming no writes require new columns; otherwise forward-fix. Validate migration rollback on disposable DB first.
- Suppression is safety state: rollback must not delete or automatically clear suppression records.
