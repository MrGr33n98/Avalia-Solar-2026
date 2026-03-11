# Event Dictionary

## Version
- Version: `2026-03-11`
- Status: `active`
- Owner: `Data + Backend + Frontend`

## Measurement Readiness
- Score: `78/100`
- Verdict: `Usable with Gaps`

## Gaps Driving This Version
- Legacy aliases still reach `/api/v1/analytics/track`
- Some frontend surfaces still used deprecated analytics wrappers before this migration
- Backend contract validation depends on registry coverage in `event_definitions`

## Core Events
| Event | Description | Required Context | Primary Producer | Primary Consumers | Aggregation Rule |
| --- | --- | --- | --- | --- | --- |
| `page_view` | Global page exposure for anonymous or logged-in traffic | `path`, `session_id` | Frontend analytics layer | tracking quality, page analytics | event count by path/day |
| `profile_view` | Company profile view | `company_id`, `session_id`, `page` | Frontend analytics layer | `company_dashboard`, `analytics/conversions`, reconciliation jobs | `company_daily_stats.profile_views` |
| `cta_click` | Primary CTA interaction on company surfaces | `company_id`, `session_id` | Frontend analytics layer | `company_dashboard`, `analytics/conversions` | `company_daily_stats.cta_clicks` |
| `whatsapp_click` | WhatsApp CTA interaction | `company_id`, `session_id` | Frontend analytics layer | `company_dashboard`, `analytics/conversions`, buyer-intent scoring | `company_daily_stats.whatsapp_clicks` |
| `lead_created` | Lead successfully created | `company_id` | Lead wizard / backend | `company_dashboard`, `analytics/conversions`, reconciliation jobs | `company_daily_stats.leads` + `leads` table |
| `review_created` | Review submission created | `company_id`, `review_id` | Review flows / backend | reputation and review telemetry | direct event count |

## Supporting Events
| Event | Description | Producer | Notes |
| --- | --- | --- | --- |
| `search_performance` | Search term + results volume | Frontend consolidated analytics | used for search quality |
| `search_no_results` | Search with zero hits | Frontend consolidated analytics | derivative event from `search_performance` |
| `faq_interaction` | FAQ expand/helpfulness interaction | Frontend consolidated analytics | non-core engagement event |
| `micro_interaction` | UI micro-interaction telemetry | Frontend/backend validators | validated by `MicroInteractionValidator` |
| `web_vital` | Core web vitals / frontend perf | Frontend analytics layer | anonymous-safe global event |
| `badge_cta_click` | Badge CTA click | Frontend/backend | stays in `analytics_events` |
| `badge_cta_view` | Badge CTA exposure | Frontend/backend | stays in `analytics_events` |
| `company_card_click` | Company card result click | Frontend analytics layer | intent signal, not core conversion |
| `category_selected` | Category selection from search/navigation | Frontend analytics layer | discovery telemetry |
| `blog_article_click` | Blog article click from internal surfaces | Frontend analytics layer | content telemetry |

## Deprecated Aliases
| Alias | Canonical Event | Status | Notes |
| --- | --- | --- | --- |
| `view` | `profile_view` | deprecated | still accepted by backend |
| `Company Profile Viewed` | `profile_view` | deprecated | legacy frontend/vendor name |
| `click` | `cta_click` | deprecated | legacy generic click |
| `CTA Clicked` | `cta_click` | deprecated | legacy vendor mapping |
| `WhatsApp CTA Clicked` | `whatsapp_click` | deprecated | legacy vendor mapping |
| `lead` | `lead_created` | deprecated | legacy short alias |
| `Lead Form Submitted` | `lead_created` | deprecated | legacy vendor mapping |
| `Quote Request CTA Clicked` | `lead_created` | deprecated | legacy vendor mapping |
| `badge_click` | `badge_cta_click` | deprecated | temporary alias kept for compatibility |
| `badges_cta_click` | `badge_cta_click` | deprecated | temporary alias kept for compatibility |
| `badges_cta_view` | `badge_cta_view` | deprecated | temporary alias kept for compatibility |

## Endpoint Consumers
| Endpoint | Canonical Source | Events Used |
| --- | --- | --- |
| `POST /api/v1/analytics/track` | ingestion | accepts canonical events + deprecated aliases |
| `POST /api/v1/events/track` | ingestion | normalized to `Analytics::TrackEventService` |
| `GET /api/v1/company_dashboard/analytics/overview` | `company_daily_stats` | `profile_view`, `cta_click`, `whatsapp_click`, `lead_created` |
| `GET /api/v1/company_dashboard/analytics/timeseries` | `company_daily_stats` | `profile_view`, `cta_click`, `whatsapp_click`, `lead_created` |
| `GET /api/v1/company_dashboard/stats` | `company_daily_stats` + `leads` | `profile_view`, `cta_click`, `whatsapp_click`, `lead_created` |
| `GET /api/v1/analytics/conversions` | `company_daily_stats` + `analytics_events` | core events + non-core residual events |

## Governance Rules
1. New business-critical events must be added here before rollout.
2. Deprecated aliases can be accepted temporarily, but must log deprecation telemetry on ingestion.
3. Core conversion events must preserve `event_id`, `tracked_at`, and `session_id` through the ingestion path.
4. Frontend app code must not import `@/lib/dataLayer`; use `@/lib/analytics/consolidated`.
