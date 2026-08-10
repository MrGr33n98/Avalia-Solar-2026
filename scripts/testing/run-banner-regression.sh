#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd "$script_dir/../.." && pwd)
cd "$repo_root/AB0-1-back"

# Suíte funcional de Banner Ads. Mantém factories/fixtures fora da descoberta.
specs=(
  spec/jobs/banner_addon_expiration_job_spec.rb
  spec/jobs/banner_subscription_expiration_job_spec.rb
  spec/requests/api/v1/banner_addon_checkout_spec.rb
  spec/requests/api/v1/banner_ads_lifecycle_spec.rb
  spec/requests/api/v1/banner_clicks_spec.rb
  spec/requests/api/v1/banner_events_spec.rb
  spec/requests/api/v1/banner_lead_attribution_spec.rb
  spec/requests/api/v1/banner_payment_webhook_spec.rb
  spec/requests/api/v1/banners_spec.rb
  spec/requests/api/v1/company_dashboard_banners_spec.rb
  spec/requests/graphql_banners_spec.rb
  spec/requests/metrics_spec.rb
  spec/services/analytics/banner_attribution_service_spec.rb
  spec/services/banner_analytics/aggregate_daily_stats_spec.rb
  spec/services/banner_analytics/operational_health_spec.rb
  spec/services/banner_analytics/performance_service_spec.rb
  spec/services/banner_analytics/reconciliation_service_spec.rb
  spec/services/banner_placements/catalog_spec.rb
  spec/services/banners/banner_delivery_query_spec.rb
  spec/services/webhooks/banner_addon_payment_spec.rb
)

exec bundle exec rspec "${specs[@]}"
