require 'rails_helper'

RSpec.describe 'Company webhooks API', type: :request do
  let(:headers) do
    {
      'ACCEPT' => 'application/json',
      'CONTENT_TYPE' => 'application/json'
    }
  end
  let(:company) { create(:company, intent_tier: 'enterprise') }
  let(:user) do
    create(
      :user,
      role: 'company',
      status: :active,
      approved_by_admin: true,
      company: nil,
      confirmed_at: Time.current,
      city: 'Sao Paulo',
      state: 'SP'
    )
  end

  before do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyWebhooksController).to receive(:current_user).and_return(user)
  end

  describe 'POST /api/v1/company_webhooks' do
    it 'registers an enterprise webhook endpoint and returns the generated secret' do
      expect do
        post '/api/v1/company_webhooks',
             params: {
               company_webhook: {
                 url: 'https://hooks.example.com/crm',
                 events: ['intent.hot', 'intent.immediate']
               }
             }.to_json,
             headers: headers
      end.to change(CompanyWebhook, :count).by(1)

      expect(response).to have_http_status(:created)

      body = JSON.parse(response.body)
      expect(body.dig('webhook', 'url')).to eq('https://hooks.example.com/crm')
      expect(body.dig('webhook', 'events')).to eq(['intent.hot', 'intent.immediate'])
      expect(body.dig('webhook', 'secret_key')).to be_present
    end

    it 'blocks webhook registration for non-enterprise companies' do
      company.update!(intent_tier: 'pro')

      expect do
        post '/api/v1/company_webhooks',
             params: {
               company_webhook: {
                 url: 'https://hooks.example.com/crm',
                 events: ['intent.hot']
               }
             }.to_json,
             headers: headers
      end.not_to change(CompanyWebhook, :count)

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['code']).to eq('WEBHOOKS_NOT_AVAILABLE')
    end
  end

  describe 'GET /api/v1/company_webhooks' do
    it 'lists webhooks without exposing secret keys' do
      create(:company_webhook, company: company, secret_key: 'sensitive-secret-value-for-testing')

      get '/api/v1/company_webhooks', headers: headers

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['webhooks'].length).to eq(1)
      expect(body['webhooks'][0]['url']).to be_present
      expect(body['webhooks'][0]['secret_key']).to be_nil
    end

    it 'uses the company selected by an active membership' do
      other_company = create(:company, intent_tier: 'enterprise')
      create(:company_member, company: other_company, user: user, role: :owner, status: 'active')
      create(:company_webhook, company: company)
      selected_webhook = create(:company_webhook, company: other_company)

      get "/api/v1/company_webhooks?company_id=#{other_company.id}", headers: headers

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('webhooks', 0, 'id')).to eq(selected_webhook.id)
    end

    it 'does not fall back to another company when the requested company is unauthorized' do
      other_company = create(:company, intent_tier: 'enterprise')

      get "/api/v1/company_webhooks?company_id=#{other_company.id}", headers: headers

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['code']).to eq('COMPANY_NOT_FOUND')
    end
  end
end
