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
    Rack::Attack.enabled = true
    Rack::Attack.reset! if Rack::Attack.respond_to?(:reset!)
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

  it 'accepts the frontend and G2 signal catalog without a 422' do
    %w[profile_view category_view alternatives_view reference_project_view
       competitive_view quote_submission blog_cta_click photo_gallery_5plus].each do |kind|
      post '/api/v1/intent_signals',
           params: payload.merge(signal_type: kind, event_id: SecureRandom.uuid).to_json,
           headers: headers

      expect(response).to have_http_status(:created)
    end
  end

  it 'deduplicates replayed events by event_id and company' do
    event = payload.merge(event_id: SecureRandom.uuid)
    expect do
      2.times { post '/api/v1/intent_signals', params: event.to_json, headers: headers }
    end.to change(BuyerIntentActivity, :count).by(1)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['duplicate']).to be(true)
  end

  it 'ignores a forged user, score weight and client clock' do
    forged = payload.merge(
      user_id: 99_999_999, intent_weight: 10,
      tracked_at: '2001-01-01T00:00:00Z', signal_type: 'hover_intent'
    )
    post '/api/v1/intent_signals', params: forged.to_json, headers: headers

    expect(response).to have_http_status(:created)
    activity = BuyerIntentActivity.order(:created_at).last
    expect(activity.user_id).to be_nil
    expect(activity.intent_weight).to eq(2)
    expect(activity.tracked_at).to be > 2.minutes.ago
  end

  it 'queues scoring even for non-hot events' do
    post '/api/v1/intent_signals',
         params: payload.merge(signal_type: 'profile_view').to_json, headers: headers

    expect(response).to have_http_status(:created)
    expect(enqueued_jobs.map { |job| job[:job] }).to include(CalculateBuyerIntentJob)
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
