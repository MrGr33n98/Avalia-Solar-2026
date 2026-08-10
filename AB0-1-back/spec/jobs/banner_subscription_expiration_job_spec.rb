# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BannerSubscriptionExpirationJob, type: :job do
  it 'expires only active subscriptions whose end date passed' do
    offer = create(:banner_offer)
    expired = create(:banner_subscription, :active, banner_offer: offer)
    expired.update_columns(created_at: 2.hours.ago, starts_at: 2.hours.ago, activated_at: 2.hours.ago, ends_at: 1.hour.ago)
    current = create(:banner_subscription, :active, banner_offer: offer, ends_at: 1.hour.from_now)
    pending = create(:banner_subscription, banner_offer: offer, status: 'pending_payment')
    pending.update_columns(created_at: 2.hours.ago, ends_at: 1.hour.ago)

    expect(described_class.perform_now).to eq(1)
    expect(expired.reload.status).to eq('expired')
    expect(current.reload.status).to eq('active')
    expect(pending.reload.status).to eq('pending_payment')
  end
end
