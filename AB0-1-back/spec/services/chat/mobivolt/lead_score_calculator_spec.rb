# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::LeadScoreCalculator, type: :service do
  let(:chat_lead) do
    build(:chat_lead,
      city: 'São Paulo',
      state: 'SP',
      intent: 'solar_quote',
      phone: '11988887777',
      consent_given: true,
      email: 'lead@teste.com'
    )
  end

  describe '.calculate' do
    it 'calcula o score com clamping estrito de 0 a 100' do
      score = described_class.calculate(chat_lead)
      expect(score).to be_between(0, 100)
    end
  end

  describe '.qualification_level' do
    it 'retorna os níveis de qualificação em português (quente, morno, frio)' do
      expect(described_class.qualification_level(80)).to eq('quente')
      expect(described_class.qualification_level(50)).to eq('morno')
      expect(described_class.qualification_level(20)).to eq('frio')
    end
  end
end
