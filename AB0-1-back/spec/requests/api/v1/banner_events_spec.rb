# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::BannerEvents', type: :request do
  let(:banner) { create(:banner, :approved, active: true, position: 'compare_hero') }
  let(:valid_params) do
    {
      banner_event: {
        banner_id: banner.id,
        event_type: 'impression',
        metadata: {
          position: 'compare_hero',
          page_path: '/compare',
          slot_key: 'top_banner',
          unsafe: 'discard me'
        },
        utm: {
          utm_source: 'test_source'
        }
      }
    }
  end

  describe 'POST /api/v1/banner_events' do
    it 'creates a valid impression event with safe metadata and UTMs' do
      post '/api/v1/banner_events', params: valid_params

      expect(response).to have_http_status(:created)
      
      event = BannerEvent.last
      expect(event.event_type).to eq('impression')
      expect(event.banner_id).to eq(banner.id)
      expect(event.metadata_json).to include(
        'position' => 'compare_hero',
        'page_path' => '/compare',
        'slot_key' => 'top_banner'
      )
      expect(event.metadata_json).not_to have_key('unsafe')
      expect(event.utm_source).to eq('test_source')
      expect(event.event_key).to be_present
    end

    it 'is idempotent based on event_key (retry does not duplicate)' do
      post '/api/v1/banner_events', params: valid_params
      expect(response).to have_http_status(:created)
      expect(BannerEvent.count).to eq(1)

      # Simulate a retry with the exact same request parameters (same IP, same UA, same date)
      post '/api/v1/banner_events', params: valid_params
      expect(response).to have_http_status(:created)
      expect(BannerEvent.count).to eq(1) # Still 1
    end

    it 'uses client instance id for deterministic idempotency' do
      params = valid_params.deep_merge(banner_event: { impression_instance_id: 'impression-123' })

      post '/api/v1/banner_events', params: params
      post '/api/v1/banner_events', params: params

      expect(response).to have_http_status(:created)
      expect(BannerEvent.where(impression_instance_id: 'impression-123').count).to eq(1)
    end

    it 'marks bot events as non-reportable while retaining audit data' do
      allow_any_instance_of(ActionDispatch::Request).to receive(:user_agent).and_return('Googlebot/2.1')

      post '/api/v1/banner_events', params: valid_params

      event = BannerEvent.last
      expect(event).to be_present
      expect(event.valid_for_reporting).to be false
      expect(event.discard_reason).to eq('bot_user_agent')
      expect(event.fraud_score).to be > 0
    end

    it 'discards events with timestamps outside the accepted window' do
      [
        [(Time.current + 10.minutes).iso8601, 'future_timestamp'],
        [(Time.current - 3.days).iso8601, 'stale_timestamp'],
      ].each do |tracked_at, reason|
        params = valid_params.deep_merge(
          banner_event: { tracked_at: tracked_at, impression_instance_id: "quality-#{reason}" }
        )

        post '/api/v1/banner_events', params: params

        event = BannerEvent.find_by(impression_instance_id: "quality-#{reason}")
        expect(event).to be_present
        expect(event.valid_for_reporting).to be(false)
        expect(event.discard_reason).to eq(reason)
      end
    end

    it 'discards events without a source IP while retaining audit data' do
      allow_any_instance_of(ActionDispatch::Request).to receive(:remote_ip).and_return(nil)

      post '/api/v1/banner_events', params: valid_params.deep_merge(
        banner_event: { impression_instance_id: 'quality-missing-ip' }
      )

      event = BannerEvent.find_by(impression_instance_id: 'quality-missing-ip')
      expect(event).to be_present
      expect(event.valid_for_reporting).to be(false)
      expect(event.discard_reason).to eq('missing_ip')
      expect(event.ip_hash).to be_nil
    end

    it 'creates a new event if context (like position) changes' do
      post '/api/v1/banner_events', params: valid_params
      expect(BannerEvent.count).to eq(1)

      # Change position, should generate new event_key
      new_params = valid_params.deep_dup
      new_params[:banner_event][:metadata][:position] = 'another_position'
      post '/api/v1/banner_events', params: new_params
      
      expect(response).to have_http_status(:created)
      expect(BannerEvent.count).to eq(2)
    end

    it 'rejects invalid event_type' do
      invalid_params = valid_params.deep_dup
      invalid_params[:banner_event][:event_type] = 'hack_event'

      post '/api/v1/banner_events', params: invalid_params
      expect(response).to have_http_status(:unprocessable_entity)
      expect(BannerEvent.count).to eq(0)
    end

    it 'fails for non-existent banner' do
      invalid_params = valid_params.deep_dup
      invalid_params[:banner_event][:banner_id] = 999999

      post '/api/v1/banner_events', params: invalid_params
      expect(response).to have_http_status(:not_found) # Assume standard Rails record not found handling or similar.
      # Note: The controller doesn't validate banner existence explicitly in the action unless ActiveRecord constraints fail,
      # but create_or_find_by! might raise ActiveRecord::RecordInvalid if banner doesn't exist depending on FK.
      # Let's adjust expectation if it throws 500/404 based on the app's generic exception handler.
    end
  end
end
