# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::FeatureGate do
  let(:company) do
    instance_double(Company, status: 'active', has_paid_plan?: true,
                    feature_enabled_from_plan?: true)
  end

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('COMPANY_AI_ENABLED', 'false').and_return('true')
  end

  it 'requires an explicit global rollout flag' do
    allow(ENV).to receive(:fetch).with('COMPANY_AI_ENABLED', 'false').and_return('false')
    expect(described_class.call(company: company).reason).to eq('FEATURE_DISABLED')
  end

  it 'denies unowned and inactive company contexts' do
    expect(described_class.call(company: nil).reason).to eq('COMPANY_NOT_FOUND')
    allow(company).to receive(:status).and_return('inactive')
    expect(described_class.call(company: company).allowed?).to eq(false)
  end

  it 'denies free companies regardless of a manipulated plan preference' do
    allow(company).to receive(:has_paid_plan?).and_return(false)
    expect(described_class.call(company: company).reason).to eq('PAID_PLAN_REQUIRED')
  end

  it 'requires the server-side entitlement, never a frontend claim' do
    allow(company).to receive(:feature_enabled_from_plan?).with('company_ai_assistant').and_return(false)
    expect(described_class.call(company: company).reason).to eq('ENTITLEMENT_REQUIRED')
  end

  it 'permits active paid companies with an entitlement and rollout' do
    expect(described_class.call(company: company).allowed?).to eq(true)
  end
end
