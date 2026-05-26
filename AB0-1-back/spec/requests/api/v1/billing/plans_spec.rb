require 'rails_helper'

RSpec.describe 'Api::V1::Billing::Plans', type: :request do
  describe 'GET /api/v1/billing/plans' do
    let!(:public_plan_1) do
      Plan.create!(
        name: 'Plano Pro Solar',
        price: 199.90,
        description: 'Plano para integradores Pro',
        is_public: true,
        display_order: 2,
        stripe_product_id: 'prod_pro123',
        stripe_price_id_monthly: 'price_pro123',
        features_json: { 'custom_ctas' => true, 'advanced_analytics' => true }
      )
    end

    let!(:public_plan_2) do
      Plan.create!(
        name: 'Plano Basic Solar',
        price: 99.90,
        description: 'Plano de entrada',
        is_public: true,
        display_order: 1,
        stripe_product_id: 'prod_basic123',
        stripe_price_id_monthly: 'price_basic123',
        features_json: { 'custom_ctas' => false, 'advanced_analytics' => false }
      )
    end

    let!(:private_plan) do
      Plan.create!(
        name: 'Plano Custom Enterprise',
        price: 999.90,
        description: 'Plano secreto comercial',
        is_public: false,
        display_order: 3,
        stripe_product_id: 'prod_enterprise123',
        stripe_price_id_monthly: 'price_enterprise123',
        features_json: { 'custom_ctas' => true, 'advanced_analytics' => true }
      )
    end

    it 'retorna status 200 com a lista de planos públicos' do
      get '/api/v1/billing/plans'

      expect(response).to have_http_status(:ok)
      
      json_response = JSON.parse(response.body)
      expect(json_response).to be_an(Array)
      # Deve retornar apenas os 2 planos públicos
      expect(json_response.size).to eq(2)
    end

    it 'retorna os planos ordenados por display_order' do
      get '/api/v1/billing/plans'

      json_response = JSON.parse(response.body)
      # display_order de public_plan_2 é 1, e public_plan_1 é 2
      expect(json_response.first['id']).to eq(public_plan_2.id)
      expect(json_response.last['id']).to eq(public_plan_1.id)
    end

    it 'exibe os campos públicos e feature flags e não expõe Stripe IDs' do
      get '/api/v1/billing/plans'

      json_response = JSON.parse(response.body)
      first_plan_payload = json_response.first

      expect(first_plan_payload.keys).to contain_exactly(
        'id', 'name', 'description', 'price', 'display_order', 'plan_tier', 'feature_flags'
      )

      # Valores corretos
      expect(first_plan_payload['id']).to eq(public_plan_2.id)
      expect(first_plan_payload['name']).to eq('Plano Basic Solar')
      expect(first_plan_payload['price'].to_f).to eq(99.90)
      expect(first_plan_payload['display_order']).to eq(1)
      expect(first_plan_payload['plan_tier']).to eq(public_plan_2.plan_tier)
      expect(first_plan_payload['feature_flags']).to eq(public_plan_2.feature_flags)

      # Não pode expor IDs do Stripe
      expect(first_plan_payload).not_to have_key('stripe_product_id')
      expect(first_plan_payload).not_to have_key('stripe_price_id_monthly')
      expect(first_plan_payload).not_to have_key('stripe_price_id_yearly')
    end
  end
end
