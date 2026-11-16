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
  it 'limits Free to zero slots and gives paid tiers three slots by default' do
    expect(PlanFeatureCatalog.defaults_for_tier('free')['brand_hero_slides_limit']).to eq(0)
    %w[essential pro enterprise].each do |tier|
      expect(PlanFeatureCatalog.defaults_for_tier(tier)['brand_hero_slides_limit']).to eq(3)
    end
  end

  it 'declares the two hero controls as distinct, properly typed plan features' do
    expect(PlanFeatureCatalog.feature_definition('brand_hero_carousel')).to include(
      type: :boolean, group: 'brand_hero'
    )
    expect(PlanFeatureCatalog.feature_definition('brand_hero_slides_limit')).to include(
      type: :integer, group: 'brand_hero'
    )
  end

  it 'rejects quotas over three at plan model validation' do
    plan = build(:plan, name: 'Hero Pro', price: 1500,
                features_json: PlanFeatureCatalog.defaults_for_tier('pro').merge('brand_hero_slides_limit' => 4))
    expect(plan).not_to be_valid
    expect(plan.errors[:features_json].join).to include('0 e 3')
  end

end
