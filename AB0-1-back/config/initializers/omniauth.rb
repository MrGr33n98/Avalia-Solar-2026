# frozen_string_literal: true

# OmniAuth configuration for SPA + API architecture.
#
# omniauth-rails_csrf_protection blocks GET requests by default to prevent
# CSRF attacks in server-rendered apps. Since our frontend (Next.js) is a
# separate SPA that initiates OAuth via window.location.href (a user-driven
# GET redirect), we allow GET requests here.
#
# The CSRF risk does not apply because:
#   1. The browser initiates the redirect directly (top-level navigation)
#   2. Cookies are SameSite=Lax — third-party iframes cannot trigger it
#   3. The OAuth provider enforces its own redirect_uri whitelist
OmniAuth.config.allowed_request_methods = %i[post get]
OmniAuth.config.silence_get_warning = true
