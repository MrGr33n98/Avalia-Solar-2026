# Go-live checklist

Status values: `PASS` only with evidence, `PARTIAL`, `BLOCKED`, `FAIL`. Initial state: all gates `BLOCKED` pending implementation and runtime proof.

| Gate | Evidence required | Status |
|---|---|---|
| G0 Tenant integrity | adversarial A/B request/channel tests | BLOCKED |
| G1 Tracking host | backend+worker config, DNS, TLS, no fallback | BLOCKED |
| G2 Pixel | real response headers, unknown token safe, cache behavior | BLOCKED |
| G3 SES delivery | synthetic staging send + authenticated SNS delivery | BLOCKED |
| G4 Click | safe redirect, unique/raw, scanner distinction | BLOCKED |
| G5 Reply | inbound provider E2E, thread/contact/opportunity association | BLOCKED |
| G6 Suppression | bounce/complaint/unsubscribe prevent future sends and stop cadence | BLOCKED |
| G7 Timeline V2 | typed DTO, no duplicates, preview and actor | BLOCKED |
| G8 Realtime | authorized `/cable` subscription and latency measurement | BLOCKED |
| G9 Recovery | outage/reconnect cursor recovers every persisted event | BLOCKED |
| G10 Notifications | dedupe, recipient scope and preferences | BLOCKED |
| G11 E2E | synthetic mailbox lifecycle without refresh | BLOCKED |
| G12 Observability | PII-free metrics/readiness and actionable alert path | BLOCKED |
| G13 Production smoke | applied Nginx/env verified on actual host | BLOCKED |

Do not mark `CRM EMAIL TRACKING + REALTIME READY` until every required gate is evidenced and reviewed.
