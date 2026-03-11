require 'rails_helper'

RSpec.describe 'Identity stitch API', type: :request do
  include ActiveJob::TestHelper

  let(:user) { create(:user) }

  before do
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
  end

  after do
    clear_enqueued_jobs
  end

  it 'queues the stitching job' do
    expect do
      post '/api/v1/identity/stitch', params: { user_id: user.id, anonymous_id: 'anon-123' }
    end.to have_enqueued_job(StitchIdentityJob).with(user.id, 'anon-123')

    expect(response).to have_http_status(:ok)
  end

  it 'returns 400 when required params are missing' do
    post '/api/v1/identity/stitch', params: { user_id: user.id }

    expect(response).to have_http_status(:bad_request)
  end
end
