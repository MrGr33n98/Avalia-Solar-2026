require 'rails_helper'

RSpec.describe 'Stripe Webhook Security & Idempotency', type: :request do
  let(:webhook_secret) { 'whsec_test_secret_123' }

  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
    # Stub da variável de ambiente usada pelo handler
    stub_const('ENV', ENV.to_h.merge('STRIPE_BILLING_WEBHOOK_SECRET' => webhook_secret))

    allow(Billing::SlackNotifier).to receive(:notify_webhook_failed)
    allow(Billing::SlackNotifier).to receive(:notify_new_subscription)
    allow(Billing::SlackNotifier).to receive(:notify_invalid_webhook)
  end

  describe 'POST /api/v1/billing/webhooks/stripe' do
    # Usa um event_type que está na lista HANDLED_EVENTS do handler
    let(:event_type) { 'customer.subscription.created' }
    let(:event_id)   { 'evt_test_123' }

    let(:payload) do
      {
        id: event_id,
        object: 'event',
        type: event_type,
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
            items: { data: [{ price: { id: 'price_pro123' } }] },
            current_period_start: Time.current.to_i,
            current_period_end: 30.days.from_now.to_i
          }
        }
      }.to_json
    end

    context 'with invalid signature' do
      it 'rejects the request and returns bad request status' do
        # Envia com assinatura aleatória inválida — não mockamos construct_event,
        # então o Stripe SDK vai rejeitar a assinatura
        post '/api/v1/billing/webhooks/stripe',
             params: payload,
             headers: { 'HTTP_STRIPE_SIGNATURE' => 't=123,v1=invalid_sig' }

        expect(response).to have_http_status(:bad_request)
      end
    end

    context 'with valid signature' do
      let(:mock_event) do
        double('Stripe::Event',
          id: event_id,
          type: event_type,
          data: double('data', object: double('subscription',
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
            items: double('items', data: [double('item', price: double('price', id: 'price_pro123'))]),
            current_period_start: Time.current.to_i,
            current_period_end: 30.days.from_now.to_i,
            trial_start: nil,
            trial_end: nil,
            cancel_at_period_end: false
          )),
          to_h: { id: event_id, type: event_type }
        )
      end

      before do
        allow(Stripe::Webhook).to receive(:construct_event).and_return(mock_event)
      end

      it 'accepts the request and processes the event' do
        # Stub do SubscriptionSyncService para evitar dependências externas
        allow_any_instance_of(Billing::SubscriptionSyncService).to receive(:call).and_return(true)

        post '/api/v1/billing/webhooks/stripe',
             params: payload,
             headers: { 'HTTP_STRIPE_SIGNATURE' => 't=123,v1=valid_sig' }

        expect(response).to have_http_status(:ok)
      end

      it 'enforces idempotency using billing_stripe_events table' do
        # Simula o registro prévio do evento de forma a forçar a rejeição por duplicidade
        Billing::StripeEvent.create!(
          stripe_event_id: event_id,
          event_type: event_type,
          processing_status: 'success',
          processed_at: Time.current
        )

        post '/api/v1/billing/webhooks/stripe',
             params: payload,
             headers: { 'HTTP_STRIPE_SIGNATURE' => 't=123,v1=valid_sig' }

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response['message']).to include('already processed')
      end
    end
  end
end
