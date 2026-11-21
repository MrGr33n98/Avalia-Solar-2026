# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::SessionStarter do
  it 'denies a session when the global runtime feature is disabled' do
    company = instance_double(Company, status: 'active')
    allow(CompanyAi::FeatureGate).to receive(:call)
      .with(company: company).and_return(CompanyAi::FeatureGate::Result.new(allowed: false, reason: 'FEATURE_DISABLED'))
    expect { described_class.call(company: company) }.to raise_error(described_class::Unavailable, 'FEATURE_DISABLED')
  end

  it 'cannot initialize a company session without a published, enabled workflow' do
    company = create(:company, status: 'active')
    allow(CompanyAi::FeatureGate).to receive(:call)
      .with(company: company).and_return(CompanyAi::FeatureGate::Result.new(allowed: true, reason: 'AVAILABLE'))
    expect { described_class.call(company: company) }.to raise_error(described_class::Unavailable, 'ASSISTANT_UNAVAILABLE')
  end
end
