# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Banners::BannerDeliveryQuery do
  it 'does not deliver sponsored company banner without active subscription' do
    company = create(:company)
    banner = create(:banner, :approved, active: true, company: company, sponsored: true)

    result = described_class.call(position: banner.position).to_a

    expect(result).not_to include(banner)
  end

  it 'delivers sponsored company banner with active subscription' do
    company = create(:company)
    offer = create(:banner_offer)
    create(:banner_subscription, :active, company: company, banner_offer: offer)
    banner = create(:banner, :approved, active: true, company: company, sponsored: true)

    result = described_class.call(position: banner.position).to_a

    expect(result).to include(banner)
  end
end
