require 'rails_helper'

RSpec.describe 'Company analytics endpoints', type: :request do
  let(:company) { create(:company, status: 'active') }
  let(:inactive_company) { create(:company, status: 'inactive') }

  let(:admin) { create(:user, role: 'admin', status: :active, company: nil) }
  let(:reviewer) { create(:user, role: 'review', status: :active, company: nil) }
  let(:owner) { create(:user, role: 'company', status: :active, company:) }
  let(:other_company_user) { create(:user, role: 'company', status: :active) }

  shared_examples 'denied access' do
    it 'returns forbidden' do
      send(http_method, path)
      expect(response).to have_http_status(:forbidden).or have_http_status(:unauthorized)
    end
  end

  def stub_auth(user)
    allow_any_instance_of(Api::V1::CompaniesController).to receive(:authenticate_api_user).and_return(true)
    allow_any_instance_of(Api::V1::CompaniesController).to receive(:current_user).and_return(user)
  end

  describe 'GET /api/v1/companies/:id/analytics/reviews' do
    let(:path) { "/api/v1/companies/#{company.id}/analytics/reviews" }
    let(:http_method) { :get }

    it 'allows admin' do
      stub_auth(admin)
      get path
      expect(response).to have_http_status(:ok)
    end

    it 'allows reviewer' do
      stub_auth(reviewer)
      get path
      expect(response).to have_http_status(:ok)
    end

    it 'allows active company owner' do
      stub_auth(owner)
      get path
      expect(response).to have_http_status(:ok)
    end

    it 'denies inactive company owner' do
      stub_auth(create(:user, role: 'company', status: :active, company: inactive_company))
      get "/api/v1/companies/#{inactive_company.id}/analytics/reviews"
      expect(response).to have_http_status(:forbidden)
    end

    it 'denies other company user' do
      stub_auth(other_company_user)
      get path
      expect(response).to have_http_status(:forbidden)
    end

    it 'requires auth' do
      get path
      expect(response).to have_http_status(:unauthorized)
    end

    it 'supports slug-style id' do
      stub_auth(admin)
      get "/api/v1/companies/#{company.id}-slug/analytics/reviews"
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'GET /api/v1/companies/:id/analytics/traffic' do
    it 'allows admin' do
      stub_auth(admin)
      get "/api/v1/companies/#{company.id}/analytics/traffic"
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'GET /api/v1/companies/:id/analytics/historical' do
    it 'allows admin' do
      stub_auth(admin)
      get "/api/v1/companies/#{company.id}/analytics/historical"
      expect(response).to have_http_status(:ok)
    end
  end
end
