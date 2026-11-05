# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviews-only MVP social API gate', type: :request do
  before do
    allow(ReviewsOnlyMvp).to receive(:creator_enabled?).and_return(false)
    allow(ReviewsOnlyMvp).to receive(:feed_enabled?).and_return(false)
  end

  it 'rejects the anonymous social feed while it is suspended' do
    get '/api/v1/feed'
    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)['code']).to eq('FEATURE_TEMPORARILY_DISABLED')
  end

  it 'rejects public creator discovery while it is suspended' do
    get '/api/v1/creators'
    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)['feature']).to eq('creator')
  end

  it 'rejects public creator submissions before any persistence' do
    expect do
      post '/api/v1/creators/example/leads', params: { lead: { name: 'Test', email: 'test@example.com' } }
    end.not_to change(CreatorLead, :count)
    expect(response).to have_http_status(:forbidden)
  end

  it 'keeps regular reviews publicly readable' do
    get '/api/v1/reviews'
    expect(response).not_to have_http_status(:forbidden)
  end
end
