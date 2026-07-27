# Public profile media publication

## Required production configuration

Configure these values in the two deployments before enabling the workflow:

```text
# Rails
APP_HOST=https://api.avaliasolar.com.br
ACTIVE_STORAGE_HOST=https://api.avaliasolar.com.br
NEXT_REVALIDATE_URL=https://www.avaliasolar.com.br/api/revalidate
NEXT_REVALIDATE_SECRET=<shared-random-secret>

# Next.js
NEXT_REVALIDATE_SECRET=<the-same-shared-random-secret>
```

`ACTIVE_STORAGE_HOST` must be the Rails/API host. Otherwise serialized Active
Storage proxy URLs can point to the frontend and images will return 404.

## Release order

1. Deploy Rails and run `rails db:migrate`.
2. Confirm Sidekiq is consuming the `default` and `low` queues.
3. Deploy Next.js with the revalidation route and shared secret.
4. Upload one image and one YouTube video in staging.
5. Approve both changes in ActiveAdmin.
6. Verify `GET /api/v1/companies/:slug` returns `media_urls` and one published video.
7. Verify `/companies/:slug` displays them within one minute without a manual cache clear.

## Failure checks

- `pending_changes.applied_at` empty after approval: inspect the approval error;
  the transaction deliberately rolls back instead of falsely marking it applied.
- `media_urls` empty: confirm the approved change attached an Active Storage
  record to `Company#media_assets`.
- URL opens a frontend 404: correct `ACTIVE_STORAGE_HOST`.
- API is correct but page is stale: inspect `PublicProfileRevalidationJob` and
  its HTTP response in Rails logs.
