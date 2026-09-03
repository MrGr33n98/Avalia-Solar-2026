# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Email Events Webhook API', type: :request do
  describe 'POST /api/v1/sales/email_events/provider' do
    context 'when anonymous (SES webhook ingestion)' do
      it 'rejects requests without SNS authenticity proof' do
        post '/api/v1/sales/email_events/provider', params: { provider_message_id: 'unknown-id', event_type: 'delivered' }
        expect(response).to have_http_status(:unauthorized)
      end

      it 'rejects malformed payloads as bad request' do
        post '/api/v1/sales/email_events/provider', params: '{invalid-json', headers: { 'CONTENT_TYPE' => 'application/json' }
        expect(response).to have_http_status(:bad_request)
      end
    end
  end

  describe 'Sales BaseController Callbacks' do
    it 'registers authenticate_api_user before_action callback' do
      callbacks = Api::V1::Sales::BaseController._process_action_callbacks.map(&:filter)
      expect(callbacks).to include(:authenticate_api_user)
      expect(callbacks).to include(:require_internal_sales)
    end
  end
end
