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

  it 'entrega banner patrocinado com assinatura ativa de add-on' do
    company = create(:company)
    banner = create(:banner, :approved, active: true, company: company, sponsored: true)
    create(:banner_addon_subscription, banner: banner, company: company, status: 'active')

    result = described_class.call(position: banner.position).to_a

    expect(result).to include(banner)
  end

  it 'aplica frequency cap por audience_key' do
    company = create(:company)
    banner = create(:banner, :approved, active: true, company: company, sponsored: false)
    create(:banner_event, banner: banner, event_type: 'impression', tracked_at: 1.hour.ago,
           metadata_json: { 'audience_key' => 'session-1' }, valid_for_reporting: true)

    result = described_class.call(company_id: company.id, audience_key: 'session-1').to_a

    expect(result).not_to include(banner)
  end


  it 'não entrega banner de placement ainda planejado' do
    banner = create(:banner, :approved, active: true, position: 'navbar')
    allow(BannerPlacements::Catalog).to receive(:all).and_return([
      BannerPlacements::Catalog::Entry.new('navbar', ['/*'], [960, 100], 'premium', 'planned')
    ])

    expect(described_class.call(position: 'navbar')).not_to include(banner)
  end

  it 'não entrega banner expirado' do
    banner = create(:banner, :approved, active: true, end_date: 1.hour.ago)

    expect(described_class.call(position: banner.position)).not_to include(banner)
  end

end
