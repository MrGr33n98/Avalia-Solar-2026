# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Banners::BannerDeliveryQuery do
  let(:primary) { 'company_access_sidebar' }
  let(:existing_sidebar) { 'company_profile_sidebar_sponsored' }

  it 'serves a primary access-banner before the explicitly allowed existing sidebar inventory' do
    campaign = create(:banner, :approved, active: true, sponsored: false,
                      position: primary, width: 300, height: 250)
    create(:banner, :approved, active: true, sponsored: false,
           position: existing_sidebar, width: 300, height: 600)

    result = described_class.call(
      position: primary, fallback_positions: [existing_sidebar], limit: 1
    )

    expect(result.map(&:id)).to eq([campaign.id])
  end

  it 'reuses the registered 300x600 sidebar creative only when the 300x250 slot is empty' do
    campaign = create(:banner, :approved, active: true, sponsored: false,
                      position: existing_sidebar, width: 300, height: 600)

    result = described_class.call(
      position: primary, fallback_positions: [existing_sidebar], limit: 1
    )

    expect(result.map(&:id)).to eq([campaign.id])
  end

  it 'never bypasses state eligibility when reusing registered sidebar campaigns' do
    create(:banner, :approved, active: true, sponsored: false,
           position: existing_sidebar, target_states: ['SP'])
    eligible = create(:banner, :approved, active: true, sponsored: false,
                      position: existing_sidebar, target_states: ['SC'])

    result = described_class.call(
      position: primary, fallback_positions: [existing_sidebar], limit: 1, state: 'SC'
    )

    expect(result.map(&:id)).to eq([eligible.id])
  end

  it 'does not deliver an expired registered campaign as a fallback' do
    create(:banner, :approved, active: true, sponsored: false,
           position: existing_sidebar, end_date: 1.day.ago)

    result = described_class.call(
      position: primary, fallback_positions: [existing_sidebar], limit: 1
    )

    expect(result).to be_empty
  end
end
