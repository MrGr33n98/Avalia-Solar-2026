# Change Impact Matrix (Q4 2026)

**Rule:** classify the diff as a set of changed areas. Combine tests by **union / maximum risk**, never by intersection. Any unknown path, rename/delete, broken diff, invalid SHA or unsupported GitHub event means a conservative full policy. The shadow report is not a deployment authority.

| Class | Representative paths | Risk | Suggested backend RSpec | Suggested frontend testing | CD classification (informational) |
|---|---|---|---|---|---|
| Docs only | `docs/**`, `README.md` | low | none | none | none |
| Isolated frontend styles | co-located non-sensitive `*.module.css` | low | none | lint + typecheck + affected components + visual | frontend_only |
| Global CSS / shared styles | `app/globals.css`, `styles/**` | high | none | global smoke + typecheck + critical frontend E2E | frontend_only |
| Frontend component | `AB0-1-front/components/**`, `app/**` | medium | none | lint + typecheck + affected Jest/E2E | frontend_only |
| Frontend sensitive | auth/login/claim/payment/checkout/WhatsApp/lead | high | depends on cross-service contracts | auth/claim/payment-critical E2E + security + typecheck | frontend_only only if no backend changes |
| Frontend shared | providers/hooks/contexts/lib/lockfile/Next config | high | depends on change | full critical frontend tests | frontend_only only if isolated |
| Rails spec only | `AB0-1-back/spec/**/*_spec.rb` | medium | changed / existing resolver | existing critical E2E | full |
| Rails administration | `AB0-1-back/app/admin/**` | medium | **full until coverage map validated** | admin authorization and CSRF | full |
| Rails API | controllers, application services and serializers | medium | full until impact map validated | consumer contracts and critical E2E | full |
| Rails critical | models, callbacks, policies, claims decision, migrations/schema | high | full | migration/schema + critical E2E | full |
| CI / Infra | `.github/**`, `infra/**`, Dockerfile, Gemfile | high | full | release-gate contracts + supply chain | full |
| Unknown/mixed | new path, invalid status, rename, delete, multiple areas | high | full | all relevant gates / conservative full | full |

## Sensitive surface exceptions

Even apparently cosmetic changes to login, signup, claim, payment, plan gating, WhatsApp commercial CTA, security/invites, or shared auth providers must never be placed on a visual-only fast lane without explicit tests.

## Examples and acceptance

1. CSS card only ⇒ `frontend_style`, backend RSpec advisory `none`, frontend typecheck `true`.
2. AuthModal font change ⇒ `frontend_sensitive`, E2E `critical`.
3. ClaimPageClient change ⇒ `frontend_sensitive`, E2E `critical`.
4. `app/admin/usuarios_acesso.rb` ⇒ `backend_admin`, RSpec full initially.
5. Rails migration ⇒ `backend_critical`, full.
6. CSS + Rails controller ⇒ mixed, full with frontend typecheck.
7. README + unknown binary ⇒ unknown, full.
8. Rename from frontend to Rails ⇒ unknown full.
9. Deleted route component ⇒ unknown full.
10. Manual/scheduled/no diff ⇒ full.

`release_scope` is advisory only in this iteration. Release decisions still come from the independent `verify-release-ci.sh` gate, using deployed baseline semantics.
