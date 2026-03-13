# Event Dictionary

## Version
- Version: `2.0 (PostHog Unified)`
- Status: `active`
- Date: `2026-03-13`
- Owner: `Product Analytics + Platform Engineering`

## Taxonomy V2: Unified Analytics Governance
This version consolidates frontend and backend tracking into a single source of truth (PostHog), separating business logic from journey and diagnostic telemetry.

---

## 1. Core Business Events (Conversion Funnel)
*Events that drive the North Star Metric and primary business KPIs.*

| Event | Description | Required Properties | Producer | Owner |
| --- | --- | --- | --- | --- |
| `landing_viewed` | Visitor views any landing page | `source`, `utm_campaign` | Frontend | Growth |
| `category_selected` | User selects a vertical/category | `category_id`, `category_slug` | Frontend | Product |
| `company_profile_viewed`| Company profile detail exposure | `company_id`, `plan_tier` | Frontend | Product |
| `company_cta_clicked` | Click on primary conversion CTA | `company_id`, `cta_type` | Frontend | Product |
| `wizard_started` | User enters the lead wizard | `category_id`, `entry_point` | Frontend | Product |
| `wizard_contact_submitted`| Contact info provided (pre-OTP) | `category_id`, `session_id` | Frontend | Product |
| `otp_verified` | OTP code successfully validated | `user_id`, `auth_method` | Backend | Platform |
| `lead_created` | Lead record persisted in DB | `lead_id`, `company_id` | Backend | Platform |
| `lead_dispatched` | Lead sent to integration/email | `lead_id`, `recipient_id` | Backend | Platform |
| `review_created` | Review successfully published | `company_id`, `rating` | Backend | Product |
| `upgrade_completed` | Subscription/Plan upgrade success | `plan_id`, `revenue` | Backend | Growth |

---

## 2. Journey Events (UX & Engagement)
*Events used to analyze drop-off, usability, and secondary interactions.*

| Event | Description | Required Properties | Producer |
| --- | --- | --- | --- |
| `wizard_step_viewed` | Exposure to a specific wizard step | `step_index`, `step_name` | Frontend |
| `wizard_step_completed` | Success move to next step | `step_index`, `duration_ms` | Frontend |
| `wizard_abandoned` | User leaves the wizard flow | `last_step_index` | Frontend |
| `search_performed` | Search query executed | `query`, `results_count` | Frontend |
| `search_no_results` | Search with zero results | `query` | Frontend |
| `faq_interaction` | FAQ expand/helpfulness vote | `faq_id`, `action` | Frontend |
| `dashboard_viewed` | Company dashboard exposure | `company_id`, `tab` | Frontend |

---

## 3. Diagnostic Events (Reliability & Performance)
*Engineering-focused events for system health monitoring.*

| Event | Description | Required Properties | Producer |
| --- | --- | --- | --- |
| `page_view` | Technical page load | `path`, `referrer` | Frontend |
| `web_vital` | LCP, FID, CLS metrics | `metric_name`, `value` | Frontend |
| `micro_interaction` | Low-level UI telemetry | `element_id`, `action` | Frontend |
| `error_boundary_triggered` | Frontend JS error caught | `component`, `message` | Frontend |
| `analytics_validation_failed`| Invalid event payload detected | `event_name`, `error` | Backend |

---

## Global Required Properties
Every event MUST include these properties for cross-platform reconciliation:

- `distinct_id`: Unique identifier (UUID or User ID)
- `session_id`: Unique session identifier
- `tracked_at`: ISO 8601 timestamp
- `platform`: `web` | `ios` | `android`
- `environment`: `production` | `staging` | `development`
- `version`: App/API version (e.g., `1.2.0`)

---

## Governance Rules
1. **Schema First:** No core event can be implemented without an entry in this dictionary.
2. **Naming Convention:** All events use `snake_case`.
3. **No PII:** Never send email, phone, or raw names in event properties. Use `distinct_id` or hashed identifiers.
4. **Owner Review:** Any change to a Core Business event requires approval from its documented Owner.
5. **Deduplication:** Events triggered by both front/back (e.g., `lead_created`) must share a `correlation_id`.
