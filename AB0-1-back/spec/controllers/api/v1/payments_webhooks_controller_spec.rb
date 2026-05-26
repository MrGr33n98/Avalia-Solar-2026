require 'rails_helper'

RSpec.describe Api::V1::PaymentsWebhooksController, type: :controller do
  let(:valid_provider) { 'mock' }
  let(:invalid_provider) { 'unknown_provider' }
  let(:checkout_session_id) { 'cs_test_123' }
  
  let!(:banner_offer) { create(:banner_offer) }
  let!(:banner_subscription) { create(:banner_subscription, checkout_session_id: checkout_session_id, banner_offer: banner_offer) }

  let(:payload) { { checkout_session_id: checkout_session_id, status: 'paid' }.to_json }
  let(:secret) { 'test_secret_key_for_development_only' }
  let(:valid_signature) { OpenSSL::HMAC.hexdigest('SHA256', secret, payload) }
  let(:current_timestamp) { Time.current.to_i.to_s }
  let(:stripe_signature) { 't=1234567890,v1=valid_signature' }

  let(:stripe_session) do
    double(
      'StripeCheckoutSession',
      client_reference_id: checkout_session_id,
      payment_intent: 'pi_test_123'
    )
  end
  let(:stripe_event) do
    double(
      'StripeEvent',
      type: 'checkout.session.completed',
      data: double('StripeEventData', object: stripe_session)
    )
  end

  describe 'POST #create' do
    context 'with valid signature and provider' do
      before do
        request.headers['X-Webhook-Signature'] = valid_signature
        request.headers['X-Webhook-Timestamp'] = current_timestamp
      end

      it 'processes webhook successfully' do
        post :create, params: { provider: valid_provider }, body: payload
        
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include('ok' => true)
        expect(banner_subscription.reload.status).to eq('active')
      end
    end

    context 'with valid Stripe signature' do
      before do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('STRIPE_WEBHOOK_SECRET').and_return('whsec_test')
        allow(Stripe::Webhook).to receive(:construct_event).and_return(stripe_event)
        request.headers['Stripe-Signature'] = stripe_signature
      end

      it 'verifies with Stripe SDK and processes checkout.session.completed' do
        post :create, params: { provider: 'stripe' }, body: payload

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include('ok' => true)
        expect(Stripe::Webhook).to have_received(:construct_event).with(
          payload,
          stripe_signature,
          'whsec_test'
        )
        expect(banner_subscription.reload.status).to eq('active')
        expect(banner_subscription.provider).to eq('stripe')
        expect(banner_subscription.payment_reference).to eq('pi_test_123')
      end
    end

    context 'with missing Stripe signature' do
      before do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('STRIPE_WEBHOOK_SECRET').and_return('whsec_test')
      end

      it 'rejects webhook with 401' do
        post :create, params: { provider: 'stripe' }, body: payload

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)).to include('error' => 'Invalid signature')
      end
    end

    context 'with invalid Stripe signature' do
      before do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('STRIPE_WEBHOOK_SECRET').and_return('whsec_test')
        allow(Stripe::Webhook).to receive(:construct_event).and_raise(
          Stripe::SignatureVerificationError.new('bad signature', stripe_signature)
        )
        request.headers['Stripe-Signature'] = stripe_signature
      end

      it 'rejects webhook with 401' do
        post :create, params: { provider: 'stripe' }, body: payload

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)).to include('error' => 'Invalid signature')
      end
    end

    context 'with missing Stripe webhook secret' do
      before do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('STRIPE_WEBHOOK_SECRET').and_return(nil)
        request.headers['Stripe-Signature'] = stripe_signature
      end

      it 'returns configuration error' do
        post :create, params: { provider: 'stripe' }, body: payload

        expect(response).to have_http_status(:internal_server_error)
        expect(JSON.parse(response.body)).to include('error' => 'Configuration error')
      end
    end

    context 'with invalid signature' do
      before do
        request.headers['X-Webhook-Signature'] = 'invalid_signature_hash'
        request.headers['X-Webhook-Timestamp'] = current_timestamp
      end

      it 'rejects webhook with 401' do
        post :create, params: { provider: valid_provider }, body: payload
        
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)).to include('error' => 'Invalid signature')
        expect(banner_subscription.reload.status).to eq('pending_payment')
      end
    end

    context 'with missing signature' do
      it 'rejects webhook with 401' do
        post :create, params: { provider: valid_provider }, body: payload

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)).to include('error' => 'Missing signature')
      end
    end

    context 'with expired timestamp' do
      before do
        old_timestamp = (Time.current - 10.minutes).to_i.to_s
        request.headers['X-Webhook-Signature'] = valid_signature
        request.headers['X-Webhook-Timestamp'] = old_timestamp
      end

      it 'rejects webhook with 401' do
        post :create, params: { provider: valid_provider }, body: payload

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)).to include('error' => 'Timestamp expired')
      end
    end

    context 'with invalid provider' do
      it 'rejects request with 422' do
        post :create, params: { 
          provider: invalid_provider, 
          status: 'paid',
          checkout_session_id: checkout_session_id 
        }
        
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)).to include('error' => 'Invalid provider')
      end
    end

    context 'with allowed providers' do
      %w[mercadopago pagarme mock].each do |provider|
        it "accepts #{provider} provider with valid HMAC signature" do
          provider_secret = provider == 'mock' ? secret : "#{provider}_secret"
          provider_signature = OpenSSL::HMAC.hexdigest('SHA256', provider_secret, payload)
          env_key = "#{provider.upcase}_WEBHOOK_SECRET"

          allow(ENV).to receive(:[]).and_call_original
          allow(ENV).to receive(:[]).with(env_key).and_return(provider_secret) unless provider == 'mock'
          request.headers['X-Webhook-Signature'] = provider_signature
          request.headers['X-Webhook-Timestamp'] = current_timestamp

          post :create, params: { provider: provider }, body: payload
          
          expect(response).to have_http_status(:ok)
        end
      end
    end

    context 'with subscription not found' do
      before do
        request.headers['X-Webhook-Signature'] = valid_signature
        request.headers['X-Webhook-Timestamp'] = current_timestamp
      end

      it 'returns not found error' do
        missing_payload = { checkout_session_id: 'non_existent_session', status: 'paid' }.to_json
        missing_signature = OpenSSL::HMAC.hexdigest('SHA256', secret, missing_payload)
        request.headers['X-Webhook-Signature'] = missing_signature

        post :create, params: { provider: valid_provider }, body: missing_payload
        
        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)).to include('error' => 'subscription_not_found')
      end
    end
  end
end
