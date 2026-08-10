# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Prometheus metrics exporter', type: :request do
  it 'exposes the Banner Ads metric contract used by alert rules' do
    get '/metrics'

    expect(response).to have_http_status(:ok)
    expect(response.headers['Content-Type']).to include('text/plain')
    expect(response.body).to include('ab0_banner_deliveries_total')
    expect(response.body).to include('ab0_banner_events_total')
    expect(response.body).to include('ab0_banner_attributions_total')
    expect(response.body).to include('ab0_banner_reconciliation_total')
    expect(response.body).to include('ab0_banner_operational_health_duration')
    expect(response.body).to include('ab0_banner_audit_retention_candidates')
    expect(response.body).to include('ab0_banner_audit_retention_oldest_age_days')
  end
end
