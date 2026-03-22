# Integrations

## Frontend (AB0-1-front)
- **PostHog:** Product analytics and event tracking (`posthog-js`, `posthog-node`).
- **Sentry:** Error tracking (`@sentry/nextjs`).
- **Authentication:** Better Auth for generic sessions, connects via `$process.env.NEXT_PUBLIC_API_URL`.

## Backend (AB0-1-back)
- **ActiveStorage Services:** AWS S3 or Local disk.
- **Sidekiq + Redis:** Background jobs queueing system for processing leads, computing `TrustScore`, or caching.
- **Intent Models:** Works potentially alongside Apollo.io intent models, webhook receiving integrations, or API routes exposed via `app/controllers/api/v1/`.
- **Admin Interface:** Active Admin (Ruby Gem) interacting heavily with internal models.
