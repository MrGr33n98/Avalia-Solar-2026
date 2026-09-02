# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Quotes API', type: :request do
  describe 'GET /api/v1/sales/quotes' do
    context 'when unauthenticated' do
      it 'returns 401 Unauthorized' do
        get '/api/v1/sales/quotes'
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
