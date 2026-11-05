require 'rails_helper'

RSpec.describe 'Reviews-only MVP social freeze', type: :request do
  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('REVIEWS_ONLY_MVP', 'true').and_return('true')
  end

  it 'blocks public feed while paused' do
    get '/api/v1/feed'
    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)['code']).to eq('FEATURE_TEMPORARILY_DISABLED')
  end

  it 'blocks direct social mutations without touching review endpoints' do
    post '/api/v1/reviewer/publications', params: { publication: { title: 'Não criar' } }
    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)['code']).to eq('FEATURE_TEMPORARILY_DISABLED')
  end
end
