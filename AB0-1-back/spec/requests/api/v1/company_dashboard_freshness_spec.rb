# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Dashboard Freshness Metadata', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }

  before do
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
    
    # Setup freshness state
    ActiveRecord::Base.connection.execute(
      "DELETE FROM analytics_processing_state WHERE pipeline_name = 'main_aggregation'"
    )
    ActiveRecord::Base.connection.execute(
      "INSERT INTO analytics_processing_state (pipeline_name, last_processed_at, updated_at) " \
      "VALUES ('main_aggregation', '#{1.hour.ago.iso8601}', '#{Time.current.iso8601}')"
    )
  end

  describe 'GET /api/v1/company_dashboard/analytics/overview' do
    it 'includes freshness metadata' do
      get '/api/v1/company_dashboard/analytics/overview'
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key('last_aggregated_at')
      expect(json).to have_key('data_freshness_seconds')
      expect(json['data_freshness_seconds']).to be >= 3600
    end
  end

  describe 'GET /api/v1/company_dashboard/analytics/timeseries' do
    it 'includes freshness metadata' do
      get '/api/v1/company_dashboard/analytics/timeseries'
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key('last_aggregated_at')
      expect(json).to have_key('data_freshness_seconds')
    end
  end

  describe 'GET /api/v1/company_dashboard/stats' do
    it 'includes freshness metadata in stats object' do
      get '/api/v1/company_dashboard/stats'
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['stats']).to have_key('last_aggregated_at')
      expect(json['stats']).to have_key('data_freshness_seconds')
    end
  end
end
