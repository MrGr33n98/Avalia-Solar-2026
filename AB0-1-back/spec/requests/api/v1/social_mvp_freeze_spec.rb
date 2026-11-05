require 'rails_helper'

RSpec.describe 'Reviews-only MVP social guards', type: :request do
  before do
    allow(ReviewsOnlyMvp).to receive(:feed_enabled?).and_return(false)
    allow(ReviewsOnlyMvp).to receive(:creator_enabled?).and_return(false)
  end

  it 'blocks the social feed while reviews remain independent' do
    get '/api/v1/feed'
    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)['code']).to eq('FEATURE_TEMPORARILY_DISABLED')
  end

  it 'blocks publication mutations without affecting regular reviews' do
    post '/api/v1/reviewer/publications', params: { publication: { title: 'Não criar' } }
    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)['code']).to eq('FEATURE_TEMPORARILY_DISABLED')
  end
end
