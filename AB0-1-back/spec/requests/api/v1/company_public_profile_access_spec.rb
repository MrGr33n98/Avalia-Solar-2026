require 'rails_helper'

RSpec.describe 'Company public profile access contract', type: :request do
  describe 'GET /api/v1/companies/:id' do
    let(:plan) do
      create(
        :plan,
        name: 'Plano Pro',
        price: 149.0,
        features_json: {
          custom_ctas: true,
          faq_block: true
        }
      )
    end
    let(:company) { create(:company, plan: plan, active_admin: false, status: :active) }
    let!(:faq) do
      create(
        :company_faq,
        company: company,
        question: 'Qual o prazo de instalacao?',
        answer: 'Em media, 45 dias.',
        status: :published
      )
    end

    it 'returns canonical plan_features and feature_access' do
      get "/api/v1/companies/#{company.id}"

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      payload = body.fetch('company')

      expect(payload['plan_features']).to be_a(Hash)
      expect(payload['plan_features']['custom_ctas']).to be(true)
      expect(payload['feature_access']).to be_a(Hash)
      expect(payload.dig('feature_access', 'custom_ctas', 'state')).to eq('enabled')
      expect(payload.dig('feature_access', 'faq_block', 'state')).to eq('enabled')
      expect(payload['faqs']).to be_an(Array)
      expect(payload['faqs'].first['question']).to eq(faq.question)
    end

    it 'returns feature_access on card payloads for public listings' do
      get '/api/v1/companies', params: { fields: 'card', limit: 1 }

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body).find { |item| item['id'] == company.id }

      expect(payload).to be_present
      expect(payload['feature_access']).to be_a(Hash)
      expect(payload.dig('feature_access', 'custom_ctas', 'state')).to eq('enabled')
    end
  end

  describe 'GET /api/v1/companies/:id with locked FAQ block' do
    let(:plan) do
      create(
        :plan,
        name: 'Gratuito',
        price: 0,
        features_json: {
          custom_ctas: false,
          faq_block: false
        }
      )
    end
    let(:company) { create(:company, plan: plan, active_admin: false, status: :active) }

    before do
      create(
        :company_faq,
        company: company,
        question: 'Pergunta oculta',
        answer: 'Resposta oculta',
        status: :published
      )
    end

    it 'omits FAQs from the public payload' do
      get "/api/v1/companies/#{company.id}"

      expect(response).to have_http_status(:ok)

      payload = JSON.parse(response.body).fetch('company')
      expect(payload.dig('feature_access', 'faq_block', 'state')).to eq('locked')
      expect(payload['faqs']).to eq([])
    end
  end
end
