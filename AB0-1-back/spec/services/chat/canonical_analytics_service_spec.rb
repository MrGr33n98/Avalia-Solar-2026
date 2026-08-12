# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::CanonicalAnalyticsService do
  it 'mapeia evento legado' do
    expect(Chat::PosthogTrackingService).to receive(:track).with(hash_including(event: 'ai_session_started'))
    described_class.track(event: 'chat_session_started', properties: { session_id: 1 })
  end
end
