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
    reviewer = create(:user, role: 'review', status: :active)
    token = JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')

    expect do
      post '/api/v1/reviewer/publications', params: { publication: { title: 'Não criar' } },
                                            headers: { 'Authorization' => "Bearer #{token}" }
    end.not_to change(ReviewerPublication, :count)
    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)['code']).to eq('FEATURE_TEMPORARILY_DISABLED')
  end
end
