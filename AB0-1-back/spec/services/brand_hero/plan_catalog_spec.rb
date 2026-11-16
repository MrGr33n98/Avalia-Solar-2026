# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Brand hero plan catalog' do
  it 'enables hero branding but not ad inventory in Essential' do
    essential = PlanFeatureCatalog.defaults_for_tier('essential')
    expect(essential['brand_hero_carousel']).to eq(true)
    expect(essential['promo_banner']).to eq(false)
  end

  it 'keeps Free locked and supports Pro and Enterprise' do
    expect(PlanFeatureCatalog.defaults_for_tier('free')['brand_hero_carousel']).to eq(false)
    expect(PlanFeatureCatalog.defaults_for_tier('pro')['brand_hero_carousel']).to eq(true)
    expect(PlanFeatureCatalog.defaults_for_tier('enterprise')['brand_hero_carousel']).to eq(true)
  end
end
