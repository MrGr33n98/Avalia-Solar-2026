# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::BrandHeroSnapshot do
  it 'does not expose drafts or images for an ineligible company' do
    company = create(:company, status: :active)
    company.company_hero_slides.create!(slot: 1, display_position: 1, revision: 1, status: 'draft')
    allow(BrandHero::Eligibility).to receive(:allowed?).with(company).and_return(false)

    expect(described_class.call(company)).to eq(version: 1, enabled: false, slides: [])
  end
end
