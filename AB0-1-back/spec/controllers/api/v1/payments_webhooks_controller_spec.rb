require 'rails_helper'

RSpec.describe Api::V1::PaymentsWebhooksController, type: :controller do
  describe 'POST #create' do
    let(:valid_provider) { 'stripe' }
    let(:invalid_provider) { 'unknown_provider' }
    let(:checkout_session_id) { 'cs_test_123' }
    
    let!(:banner_offer) { create(:banner_offer) }
    let!(:banner_subscription) { create(:banner_subscription, checkout_session_id: checkout_session_id, banner_offer: banner_offer) }

    context 'with valid provider' do
      it 'processes webhook successfully' do
        post :create, params: { 
          provider: valid_provider, 
          status: 'paid',
          checkout_session_id: checkout_session_id 
        }
        
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include('ok' => true)
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

    context 'with mock provider (for testing)' do
      it 'accepts mock provider' do
        post :create, params: { 
          provider: 'mock', 
          status: 'paid',
          checkout_session_id: checkout_session_id 
        }
        
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include('ok' => true)
      end
    end

    context 'with allowed providers' do
      %w[stripe mercadopago pagarme mock].each do |provider|
        it "accepts #{provider} provider" do
          post :create, params: { 
            provider: provider, 
            status: 'paid',
            checkout_session_id: checkout_session_id 
          }
          
          expect(response).to have_http_status(:ok)
          expect(JSON.parse(response.body)).to include('ok' => true)
        end
      end
    end

    context 'with subscription not found' do
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