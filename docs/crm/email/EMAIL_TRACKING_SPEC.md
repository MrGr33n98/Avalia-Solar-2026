# Email Engagement Tracking Specification

## Open Tracking
- Endpoint: `GET /t/email/open/:token.gif`
- Returns: 1x1 transparent GIF (`image/gif`)
- Effect: Creates `Sales::EmailEvent` with `event_type = 'opened'`, timestamps, IP, and User-Agent.

## Click Tracking
- Endpoint: `GET /t/email/click/:token?url=...`
- Returns: HTTP 302 Redirect to sanitized destination URL.
- Effect: Creates `Sales::EmailEvent` with `event_type = 'clicked'`, target URL, and timestamp.
