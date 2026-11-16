# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BrandHero::Eligibility do
  let(:company) { instance_double(Company) }

  before do
    allow(company).to receive(:has_paid_plan?).and_return(true)
    allow(company).to receive(:entitled?).with(:brand_hero_carousel).and_return(true)
    allow(company).to receive(:entitlement_limit).with(:brand_hero_slides_limit).and_return(3)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('BRAND_HERO_CAROUSEL_ENABLED').and_return(nil)
  end

  it 'lets eligible paid companies prepare three drafts with public rollout disabled' do
    expect(described_class.limit(company)).to eq(3)
    expect(described_class.manageable?(company)).to be(true)
    expect(described_class.allowed?(company)).to be(false)
    expect(described_class.reason(company)).to eq('rollout_disabled')
  end

  it 'never grants a free plan even when a feature is mistakenly enabled' do
    allow(company).to receive(:has_paid_plan?).and_return(false)
    allow(ENV).to receive(:[]).with('BRAND_HERO_CAROUSEL_ENABLED').and_return('true')
    expect(described_class.limit(company)).to eq(0)
    expect(described_class.manageable?(company)).to be(false)
    expect(described_class.allowed?(company)).to be(false)
    expect(described_class.reason(company)).to eq('paid_plan_required')
  end

  it 'requires the separate institutional entitlement, not promo_banner' do
    allow(company).to receive(:entitled?).with(:brand_hero_carousel).and_return(false)
    expect(described_class.limit(company)).to eq(0)
    expect(described_class.reason(company)).to eq('feature_locked')
  end

  it 'enforces numeric quota 0..3 independently of the rollout flag' do
    allow(company).to receive(:entitlement_limit).with(:brand_hero_slides_limit).and_return(2)
    expect(described_class.limit(company)).to eq(2)
    allow(company).to receive(:entitlement_limit).with(:brand_hero_slides_limit).and_return(0)
    expect(described_class.limit(company)).to eq(0)
    expect(described_class.reason(company)).to eq('quota_zero')
  end

  it 'caps incorrectly stored limits at the physical three-slot maximum' do
    allow(company).to receive(:entitlement_limit).with(:brand_hero_slides_limit).and_return(10)
    expect(described_class.limit(company)).to eq(3)
  end

  it 'requires the rollout flag to make approved slides public' do
    allow(ENV).to receive(:[]).with('BRAND_HERO_CAROUSEL_ENABLED').and_return('true')
    expect(described_class.manageable?(company)).to be(true)
    expect(described_class.allowed?(company)).to be(true)
    expect(described_class.reason(company)).to eq('ready')
  end
end
