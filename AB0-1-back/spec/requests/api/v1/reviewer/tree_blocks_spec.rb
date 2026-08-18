# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer Tree blocks API', type: :request do
  let(:reviewer) { create(:user, role: 'review', status: :active, confirmed_at: Time.current) }
  let!(:profile) { create(:reviewer_profile, user: reviewer, creator_enabled: true) }
  let(:token) { JWT.encode({ user_id: reviewer.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }

  it 'requires authentication' do
    post '/api/v1/reviewer/tree/blocks', params: { block: { block_type: 'external_link', title: 'Site', url: 'https://example.com' } }.to_json,
         headers: { 'Content-Type' => 'application/json' }

    expect(response).to have_http_status(:unauthorized)
  end

  it 'creates, lists, updates and deletes a block' do
    post '/api/v1/reviewer/tree/blocks', params: {
      block: { block_type: 'external_link', title: 'Site', subtitle: 'Meu site', url: 'https://example.com', active: true }
    }.to_json, headers: headers

    expect(response).to have_http_status(:created)
    block_id = JSON.parse(response.body).fetch('id')

    get '/api/v1/reviewer/tree/blocks', headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).map { |item| item['id'] }).to include(block_id)

    patch "/api/v1/reviewer/tree/blocks/#{block_id}", params: { block: { title: 'Site atualizado' } }.to_json,
          headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch('title')).to eq('Site atualizado')

    delete "/api/v1/reviewer/tree/blocks/#{block_id}", headers: headers
    expect(response).to have_http_status(:no_content)
  end

  it 'returns structured validation errors for unsafe URLs' do
    post '/api/v1/reviewer/tree/blocks', params: {
      block: { block_type: 'external_link', title: 'Site', url: 'javascript:alert(1)', active: true }
    }.to_json, headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body).dig('error', 'code')).to eq('validation_failed')
  end
end
