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
      create(:company_webhook, company: company, secret_key: 'sensitive-secret')

      get '/api/v1/company_webhooks', headers: headers

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['webhooks'].length).to eq(1)
      expect(body['webhooks'][0]['url']).to be_present
      expect(body['webhooks'][0]['secret_key']).to be_nil
    end
  end
end
