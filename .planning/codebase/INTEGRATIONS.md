# Integrations

## Analytics
- **PostHog:** Product analytics and event tracking (`posthog-js`, `posthog-node`). Used for page views, user interaction intents, profile viewing.
- **Sentry:** Error tracking (`@sentry/nextjs`).

## Authentication
- **Backend API:** Connects via `$process.env.NEXT_PUBLIC_API_URL` endpoints for fetching `company`, `products`, `reviews`, and custom trust scores (TaaS marketplace).
- **Better Auth:** Authentication handling library.

## Lead Engine
- Resolves lead categories with internal API paths utilizing Apollo.io intent models or general pipeline tracking (`app/services/*`).
