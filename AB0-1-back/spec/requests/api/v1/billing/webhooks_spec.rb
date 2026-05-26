# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Billing Webhooks API', type: :request do
  let(:plan) { Plan.find_by(name: 'Integration Plan') || create(:plan, name: 'Integration Plan', stripe_price_id_monthly: 'price_integration') }
  let(:company) { create(:company) }

  before do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
    allow(Billing::SlackNotifier).to receive(:alerts_enabled?).and_return(true)
  end

  describe 'POST /api/v1/billing/webhooks/stripe' do
    let(:payload) do
      {
        id: 'evt_web_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cust_test_123',
            status: 'active',
            current_period_start: Time.current.to_i,
            current_period_end: 1.month.from_now.to_i,
            cancel_at_period_end: false,
            trial_start: nil,
            trial_end: nil,
            canceled_at: nil,
            metadata: { 'company_id' => company.id.to_s },
            items: {
              data: [
                { price: { id: 'price_integration' } }
              ]
            }
          }
        }
      }.to_json
    end

    let(:headers) do
      {
        'HTTP_STRIPE_SIGNATURE' => 'mock_sig',
        'Content-Type' => 'application/json'
      }
    end

    context 'quando o evento é processado com sucesso' do
      it 'retorna status 200 ok' do
        post '/api/v1/billing/webhooks/stripe', params: payload, headers: headers

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['message']).to eq('Success')
      end
    end

    context 'quando a assinatura é inválida' do
      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_raise(Stripe::SignatureVerificationError.new('Bad signature', 'sig'))
      end

      it 'retorna status 400 bad_request' do
        post '/api/v1/billing/webhooks/stripe', params: payload, headers: { 'HTTP_STRIPE_SIGNATURE' => 'bad', 'Content-Type' => 'application/json' }

        expect(response).to have_http_status(:bad_request)
      end
    end

    context 'quando ocorre um erro inesperado no processamento' do
      before do
        allow_any_instance_of(Billing::StripeWebhookHandler).to receive(:call).and_raise(StandardError.new('Unexpected DB error'))
      end

      it 'retorna status 422 unprocessable_entity' do
        post '/api/v1/billing/webhooks/stripe', params: payload, headers: headers

        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)['error']).to eq('Unexpected DB error')
      end
    end
  end
end
