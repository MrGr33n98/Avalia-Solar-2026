require 'rails_helper'

RSpec.describe 'Company dashboard stats and notifications', type: :request do
  let(:company) { create(:company) }
  let(:user) do
    create(
      :user,
      role: 'company',
      status: :active,
      approved_by_admin: true,
      company: nil,
      confirmed_at: Time.current
    )
  end

  before do
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
  end

  describe 'GET /api/v1/company_dashboard/stats' do
    it 'returns dashboard stats for an active company member' do
      get '/api/v1/company_dashboard/stats', params: { company_id: company.id }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['stats']).to be_a(Hash)
      expect(body).to have_key('plan_features')
      expect(body).to have_key('feature_access')
    end
  end

  describe 'GET /api/v1/company_dashboard/notifications' do
    it 'returns notifications for an active company member' do
      get '/api/v1/company_dashboard/notifications', params: { company_id: company.id }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['notifications']).to be_an(Array)
    end
  end
end
