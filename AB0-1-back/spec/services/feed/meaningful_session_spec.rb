# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Feed::MeaningfulSession, type: :service do
  it 'conta sessões com sinal significativo sem expor dados pessoais' do
    company_id = create(:company).id
    create_event(company_id, 'feed_item_dwell_10s', 10)
    create_event(company_id, 'feed_item_saved', 10)
    create_event(company_id, 'feed_view', 11)

    result = described_class.call

    expect(result[:meaningful_sessions]).to eq(1)
    expect(result[:signals]).to eq('feed_item_dwell_10s' => 1, 'feed_item_saved' => 1)
  end

  def create_event(company_id, event_type, user_id)
    AnalyticsEvent.create!(company_id: company_id, event_type: event_type, user_id: user_id, tracked_at: Time.current)
  end
end
