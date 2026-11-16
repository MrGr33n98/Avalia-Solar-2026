# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BrandHero::Eligibility do
  let(:company) { instance_double(Company) }

  it 'fails closed while the rollout flag is OFF' do
    allow(company).to receive(:has_paid_plan?).and_return(true)
    allow(company).to receive(:entitled?).with(:brand_hero_carousel).and_return(true)
    allow(ENV).to receive(:[]).with('BRAND_HERO_CAROUSEL_ENABLED').and_return(nil)
    expect(described_class.allowed?(company)).to be(false)
  end

  it 'never grants a free plan even when an override mistakenly enables the feature' do
    allow(company).to receive(:has_paid_plan?).and_return(false)
    allow(ENV).to receive(:[]).with('BRAND_HERO_CAROUSEL_ENABLED').and_return('true')
    expect(described_class.allowed?(company)).to be(false)
  end

  it 'requires both a paid plan and the new entitlement' do
    allow(company).to receive(:has_paid_plan?).and_return(true)
    allow(company).to receive(:entitled?).with(:brand_hero_carousel).and_return(true)
    allow(ENV).to receive(:[]).with('BRAND_HERO_CAROUSEL_ENABLED').and_return('true')
    expect(described_class.allowed?(company)).to be(true)
  end
end
