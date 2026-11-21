# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company AI capability', type: :request do
  it 'never exposes an enabled paid assistant while global flag is off' do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('COMPANY_AI_ENABLED', 'false').and_return('false')

    get '/api/v1/companies/99999999/ai_capability'
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include('enabled' => false, 'mode' => 'general')
    expect(response.headers['Cache-Control']).to include('no-store')
  end
end
