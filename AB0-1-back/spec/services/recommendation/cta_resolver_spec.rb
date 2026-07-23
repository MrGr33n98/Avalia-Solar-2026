# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Recommendation::CtaResolver do
  let(:company) { build(:company, segment: 'installer', slug: 'solar-fit') }

  describe '.call' do
    it 'returns "Solicitar orçamento" for installer segment' do
      result = described_class.call(company)

      expect(result[:primary][:label]).to eq('Solicitar orçamento')
      expect(result[:primary][:type]).to eq('request_quote')
    end

    it 'returns "Simular financiamento" for finance segment' do
      company.segment = 'finance'
      result = described_class.call(company)

      expect(result[:primary][:label]).to eq('Simular financiamento')
      expect(result[:primary][:type]).to eq('simulate_financing')
    end

    it 'returns "Encontrar integradores" for supplier segment' do
      company.segment = 'supplier'
      result = described_class.call(company)

      expect(result[:primary][:label]).to eq('Encontrar integradores')
      expect(result[:primary][:type]).to eq('find_installers')
    end
  end
end
