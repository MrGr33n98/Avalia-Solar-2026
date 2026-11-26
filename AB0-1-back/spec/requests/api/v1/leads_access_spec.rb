require 'rails_helper'

RSpec.describe 'Leads RBAC', type: :request do
  let(:leads_plan) do
    create(
      :plan,
      name: 'Pro Leads',
      price: 99.0,
      features_json: PlanFeatureCatalog.defaults_for_tier('enterprise')
    )
  end
  let(:company) { create(:company, status: 'active', plan: leads_plan) }
  let(:other_company) { create(:company, status: 'active', plan: leads_plan) }
  let(:inactive_company) { create(:company, status: 'inactive', plan: leads_plan) }

  let!(:lead_owned) { create(:lead, company: company) }
  let!(:lead_other) { create(:lead, company: other_company) }

  let(:admin) { create(:user, role: 'admin', status: :active, company: nil) }
  let(:company_user) { create(:user, role: 'company', status: :active, company: company) }
  let(:other_company_user) { create(:user, role: 'company', status: :active, company: other_company) }
  let(:inactive_company_user) { create(:user, role: 'company', status: :active, company: inactive_company) }
  let(:reviewer) { create(:user, role: 'review', status: :active, company: nil) }
  let(:regular_user) { create(:user, role: 'user', status: :active, company: nil) }

  def stub_auth(user)
    if user.company_user? && user.company_id.present?
      create(:company_member, user: user, company: Company.find(user.company_id), status: :active)
    end
    allow_any_instance_of(Api::V1::LeadsController).to receive(:authenticate_api_user).and_return(true)
    allow_any_instance_of(Api::V1::LeadsController).to receive(:current_user).and_return(user)
  end

  before do
    allow(RoiCalculationWorker).to receive(:perform_async)
    allow(LeadScoringWorker).to receive(:perform_async)
  end

  describe 'GET /api/v1/leads' do
    it 'allows admin to list all leads' do
      stub_auth(admin)
      get '/api/v1/leads'
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body.size).to eq(2)
    end

    it 'allows company user to list only own leads' do
      stub_auth(company_user)
      get '/api/v1/leads'
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body.map { |l| l['id'] }).to contain_exactly(lead_owned.id)
    end

    context 'com limit' do
      let!(:older_owned) { create(:lead, company: company, created_at: 2.days.ago) }
      let!(:newest_owned) { create(:lead, company: company, created_at: 1.minute.from_now) }

      it 'retorna só os N leads mais recentes do próprio tenant' do
        stub_auth(company_user)
        get '/api/v1/leads', params: { limit: 2 }
        expect(response).to have_http_status(:ok)
        ids = JSON.parse(response.body).map { |l| l['id'] }
        expect(ids).to eq([newest_owned.id, lead_owned.id])
        expect(ids).not_to include(lead_other.id)
      end

      it 'ignora limit inválido e devolve a lista completa' do
        stub_auth(company_user)
        get '/api/v1/leads', params: { limit: 'abc' }
        ids = JSON.parse(response.body).map { |l| l['id'] }
        expect(ids).to contain_exactly(lead_owned.id, older_owned.id, newest_owned.id)
      end

      it 'aplica o teto INDEX_MAX_LIMIT a limites maiores' do
        stub_const('Api::V1::LeadsController::INDEX_MAX_LIMIT', 2)
        stub_auth(company_user)
        get '/api/v1/leads', params: { limit: 10_000 }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body).size).to eq(2)
      end
    end

    it 'denies company user with inactive company' do
      stub_auth(inactive_company_user)
      get '/api/v1/leads'
      expect(response).to have_http_status(:forbidden)
    end

    it 'scopes other company users to their own leads only' do
      stub_auth(other_company_user)
      get '/api/v1/leads'
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body.map { |l| l['id'] }).to contain_exactly(lead_other.id)
    end

    it 'denies reviewer role' do
      stub_auth(reviewer)
      get '/api/v1/leads'
      expect(response).to have_http_status(:forbidden)
    end

    it 'denies regular user role' do
      stub_auth(regular_user)
      get '/api/v1/leads'
      expect(response).to have_http_status(:forbidden)
    end

    it 'requires authentication' do
      get '/api/v1/leads'
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'GET /api/v1/leads/:id' do
    it 'allows admin' do
      stub_auth(admin)
      get "/api/v1/leads/#{lead_owned.id}"
      expect(response).to have_http_status(:ok)
    end

    it 'allows company owner of lead' do
      stub_auth(company_user)
      get "/api/v1/leads/#{lead_owned.id}"
      expect(response).to have_http_status(:ok)
    end

    it 'forbids other company user' do
      stub_auth(other_company_user)
      get "/api/v1/leads/#{lead_owned.id}"
      expect(response).to have_http_status(:forbidden)
    end

    it 'requires auth' do
      get "/api/v1/leads/#{lead_owned.id}"
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
