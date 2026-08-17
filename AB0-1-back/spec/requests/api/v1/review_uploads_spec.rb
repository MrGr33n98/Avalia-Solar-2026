require 'rails_helper'

RSpec.describe 'Review upload sessions API', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json', 'Accept' => 'application/json' } }
  let(:user) do
    create(:user, role: 'review', status: :active, company: nil,
           city: 'Sao Paulo', state: 'SP', confirmed_at: Time.current)
  end

  def auth_headers
    post '/api/v1/auth/login',
         params: { email: user.email, password: 'Password123' }.to_json,
         headers: headers
    headers.merge('Authorization' => "Bearer #{JSON.parse(response.body)['token']}")
  end

  it 'creates a session owned by current user' do
    post '/api/v1/review_uploads', headers: auth_headers

    expect(response).to have_http_status(:created)
    payload = JSON.parse(response.body)
    expect(payload['id']).to be_present
    expect(ReviewUploadSession.last.user_id).to eq(user.id)
  end

  it 'does not expose another user session' do
    other_session = create(:review_upload_session)

    get "/api/v1/review_uploads/#{other_session.uuid}", headers: auth_headers

    expect(response).to have_http_status(:not_found)
  end

  it 'rejects expired sessions' do
    session = create(:review_upload_session, user: user, expires_at: 1.minute.ago)

    post "/api/v1/review_uploads/#{session.uuid}/media", params: {}.to_json, headers: auth_headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['code']).to eq('REVIEW_MEDIA_INVALID')
  end
end