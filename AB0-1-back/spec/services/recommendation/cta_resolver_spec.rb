# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Recommendation::CtaResolver do
  let(:company) { build(:company, segment: 'installer', slug: 'solar-fit') }

  before do
    allow(company).to receive(:quote_feature_enabled?).and_return(false)
    allow(company).to receive(:quote_cta_enabled?).and_return(true)
  end

  describe '.call' do
    it 'never grants a Free installer a quote action just because of segment' do
      result = described_class.call(company)
      expect(result[:primary]).to include(type: 'view_profile', label: 'Ver perfil', action: 'navigate_profile')
    end

    it 'does not grant a sponsored or verified Free installer a quote action' do
      allow(company).to receive(:sponsored?).and_return(true)
      allow(company).to receive(:verified?).and_return(true)
      expect(described_class.call(company)[:primary][:type]).to eq('view_profile')
    end

    it 'uses an actual quote wizard action and company target when entitled' do
      allow(company).to receive(:quote_feature_enabled?).and_return(true)
      result = described_class.call(company)
      expect(result[:primary]).to include(
        type: 'request_quote', label: 'Solicitar orçamento',
        action: 'open_quote_wizard', preferred_company_id: company.id
      )
    end

    it 'honours the independent OFF preference for an otherwise entitled company' do
      allow(company).to receive(:quote_feature_enabled?).and_return(true)
      allow(company).to receive(:quote_cta_enabled?).and_return(false)
      expect(described_class.call(company)[:primary][:type]).to eq('view_profile')
    end

    it 'preserves a safe secondary review action' do
      result = described_class.call(company)
      expect(result[:secondary][:type]).to eq('rate_company')
      expect(result[:secondary][:url]).to eq('/companies/solar-fit')
    end
  end
end
