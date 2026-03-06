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
      before do
        request.headers['X-Webhook-Signature'] = valid_signature
        request.headers['X-Webhook-Timestamp'] = current_timestamp
      end

      %w[stripe mercadopago pagarme mock].each do |provider|
        it "accepts #{provider} provider with valid signature" do
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
        post :create, params: { 
          provider: valid_provider, 
          status: 'paid',
          checkout_session_id: 'non_existent_session' 
        }
        
        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)).to include('error' => 'subscription_not_found')
      end
    end
  end
end