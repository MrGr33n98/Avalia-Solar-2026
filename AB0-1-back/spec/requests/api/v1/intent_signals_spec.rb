require 'rails_helper'

RSpec.describe 'Intent signals API', type: :request do
  include ActiveJob::TestHelper

  let(:company) { create(:company) }
  let(:headers) do
    {
      'ACCEPT' => 'application/json',
      'CONTENT_TYPE' => 'application/json',
      'REMOTE_ADDR' => '203.0.113.10',
      'HTTP_USER_AGENT' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    }
  end
  let(:payload) do
    {
      company_id: company.id,
      anonymous_id: 'anon-123',
      session_id: 'session-123',
      signal_type: 'whatsapp_hover',
      signal_category: 'contact_intent',
      page_path: '/companies/empresa-teste',
      element_type: 'whatsapp',
      tracked_at: Time.current.iso8601
    }
  end

  before do
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
    Rack::Attack.cache.store.clear if defined?(Rack::Attack)
  end

  after do
    clear_enqueued_jobs
  end

  it 'creates a buyer intent activity with hashed IP metadata' do
    expect do
      post '/api/v1/intent_signals', params: payload.to_json, headers: headers
    end.to change(BuyerIntentActivity, :count).by(1)

    expect(response).to have_http_status(:created)

    activity = BuyerIntentActivity.order(:created_at).last
    expect(activity.ip_hash).to eq(Digest::SHA256.hexdigest('203.0.113.10'))
    expect(activity.device_type).to eq('mobile')
    expect(enqueued_jobs.map { |job| job[:job] }).to include(CalculateBuyerIntentJob)
  end

  it 'returns 422 for invalid payloads' do
    post '/api/v1/intent_signals',
         params: payload.merge(signal_type: 'invalid').to_json,
         headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['errors']).to be_present
  end

  it 'throttles after 120 requests per minute from the same IP' do
    120.times do
      post '/api/v1/intent_signals', params: payload.to_json, headers: headers
    end

    post '/api/v1/intent_signals', params: payload.to_json, headers: headers

    expect(response).to have_http_status(:too_many_requests)
    expect(response.headers['Retry-After']).to be_present
  end
end
