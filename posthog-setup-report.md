<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog Analytics into the Ruby on Rails backend (`AB0-1-back/`). All captures use the `posthog-ruby` + `posthog-rails` gems with API keys stored exclusively in environment variables. Existing `Analytics::TrackEventService` calls were preserved; PostHog calls were added alongside them. No hardcoded secrets were introduced.

**Files modified:**

| File | Change |
|------|--------|
| `AB0-1-back/.env` | Added `POSTHOG_API_KEY` and `POSTHOG_HOST` |
| `AB0-1-back/config/initializers/posthog.rb` | Fixed hardcoded keys → ENV vars; enabled `auto_capture_exceptions`, `report_rescued_exceptions`, `auto_instrument_active_job`, `capture_user_context` |
| `AB0-1-back/app/models/user.rb` | Added `posthog_distinct_id` and `posthog_properties` methods |
| `AB0-1-back/app/controllers/api/v1/auth_controller.rb` | Added `user_logged_in`, `user_registered`, `email_confirmed` captures + `identify` calls |
| `AB0-1-back/app/controllers/api/v1/leads_controller.rb` | Added `lead_submitted` and `lead_otp_verified` captures |
| `AB0-1-back/app/controllers/api/v1/reviews_controller.rb` | Added `review_submitted` capture |
| `AB0-1-back/app/controllers/api/v1/companies_controller.rb` | Added `company_registered` capture |
| `AB0-1-back/app/controllers/api/v1/financing_proposals_controller.rb` | Added `financing_proposal_submitted` capture |
| `AB0-1-back/app/controllers/api/v1/payments_webhooks_controller.rb` | Added `banner_subscription_activated` capture |
| `AB0-1-back/app/controllers/api/v1/consent_controller.rb` | Added `consent_given` and `consent_revoked` captures |
| `AB0-1-back/app/controllers/users/omniauth_callbacks_controller.rb` | Added `social_login_completed` capture + `identify` call |

**Events instrumented:**

| Event | Description | File |
|-------|-------------|------|
| `user_logged_in` | Fired when a user successfully logs in with email/password credentials | `api/v1/auth_controller.rb` |
| `user_registered` | Fired when a new user completes registration and account is created | `api/v1/auth_controller.rb` |
| `email_confirmed` | Fired when a user confirms their email address via the confirmation link | `api/v1/auth_controller.rb` |
| `lead_submitted` | Fired when a user successfully submits a lead through the wizard flow | `api/v1/leads_controller.rb` |
| `lead_otp_verified` | Fired when a lead verifies their email via OTP code — top-of-funnel confirmation | `api/v1/leads_controller.rb` |
| `review_submitted` | Fired when a user submits a review for a company — key conversion event | `api/v1/reviews_controller.rb` |
| `company_registered` | Fired when a new company is successfully registered on the platform | `api/v1/companies_controller.rb` |
| `financing_proposal_submitted` | Fired when a user submits a financing proposal request to a company | `api/v1/financing_proposals_controller.rb` |
| `banner_subscription_activated` | Fired when a payment webhook confirms a banner subscription as paid/active | `api/v1/payments_webhooks_controller.rb` |
| `consent_given` | Fired when a user gives consent (analytics/marketing) via the consent banner | `api/v1/consent_controller.rb` |
| `consent_revoked` | Fired when a user revokes previously given consent | `api/v1/consent_controller.rb` |
| `social_login_completed` | Fired when a user authenticates via OAuth provider (Google or LinkedIn) | `users/omniauth_callbacks_controller.rb` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

**Dashboard:**
- [Analytics basics](https://us.posthog.com/project/336078/dashboard/1343013)

**Insights:**
- [Funil de ativação de usuários](https://us.posthog.com/project/336078/insights/O8Bdau0F) — Funil completo: cadastro → email confirmado → login → avaliação enviada (30 dias)
- [Cadastros e logins diários](https://us.posthog.com/project/336078/insights/fCpv9Ypw) — Volume diário de novos cadastros, logins por email e logins sociais
- [Eventos de negócio críticos](https://us.posthog.com/project/336078/insights/24GetoVa) — Tendência semanal de avaliações, propostas de financiamento, subscrições e empresas
- [Consentimento dado vs revogado](https://us.posthog.com/project/336078/insights/hfru4rVF) — Comparação diária entre consentimentos dados e revogados

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
