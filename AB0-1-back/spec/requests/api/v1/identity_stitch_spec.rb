# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Identity stitch API', type: :request do
  include ActiveJob::TestHelper

  let!(:user) { create(:user) }
  let(:token) do
    JWT.encode(
      { user_id: user.id, typ: 'access', iat: Time.current.to_i, exp: 1.hour.from_now.to_i },
      Rails.application.secret_key_base, 'HS256'
    )
  end
  let(:request_headers) do
    { 'Authorization' => "Bearer #{token}",
      'REMOTE_ADDR' => '203.0.113.10',
      'HTTP_USER_AGENT' => 'Mozilla/5.0 intent-test' }
  end

  before do
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
  end

  after { clear_enqueued_jobs }

  it 'rejects an unauthenticated attempt to attach a user to a session' do
    post '/api/v1/identity/stitch', params: { user_id: user.id, anonymous_id: 'anon-x' }
    expect(response).to have_http_status(:unauthorized)
    expect(enqueued_jobs.select { |j| j[:job] == StitchIdentityJob }).to be_empty
  end

  it 'stitches only a previously recorded session with matching request proof' do
    post '/api/v1/identity/track_session', params: { anonymous_id: 'anon-123' }, headers: request_headers
    expect(response).to have_http_status(:ok)

    expect do
      post '/api/v1/identity/stitch',
           params: { user_id: 'user_999999', anonymous_id: 'anon-123' },
           headers: request_headers
    end.to have_enqueued_job(StitchIdentityJob).with(user.id, 'anon-123')
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['user_id']).to eq("user_#{user.id}")
  end

  it 'rejects anonymous IDs that were never registered' do
    post '/api/v1/identity/stitch',
         params: { user_id: user.id, anonymous_id: 'missing' },
         headers: request_headers

    expect(response).to have_http_status(:forbidden)
    expect(enqueued_jobs.select { |j| j[:job] == StitchIdentityJob }).to be_empty
  end

  it 'rejects session theft across client fingerprints' do
    post '/api/v1/identity/track_session', params: { anonymous_id: 'anon-123' }, headers: request_headers
    post '/api/v1/identity/stitch',
         params: { anonymous_id: 'anon-123' },
         headers: request_headers.merge('REMOTE_ADDR' => '198.51.100.55')

    expect(response).to have_http_status(:forbidden)
    expect(enqueued_jobs.select { |j| j[:job] == StitchIdentityJob }).to be_empty
  end
end
