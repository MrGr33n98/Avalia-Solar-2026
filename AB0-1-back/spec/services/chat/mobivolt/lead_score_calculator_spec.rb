# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::LeadScoreCalculator, type: :service do
  let(:chat_session) { create(:chat_session) }

  describe '.calculate' do
    it 'calcula o score com base em um lead simples (frio = 0)' do
      chat_lead = ChatLead.new(
        chat_session: chat_session,
        name: 'Cliente Frio',
        email: nil,
        phone: nil,
        city: nil,
        state: nil,
        intent: 'general_question',
        consent_given: true,
        consent_given_at: Time.current
      )

      score = described_class.calculate(chat_lead)
      expect(score).to eq(0)
    end

    it 'calcula o score incremental com vários atributos e aplica clamping exato em 100' do
      chat_lead = ChatLead.new(
        chat_session: chat_session,
        name: 'Cliente Quente',
        email: 'cliente@gmail.com',
        phone: '11999999999',
        city: 'Cuiabá',
        state: 'MT',
        intent: 'solar_quote',
        urgency: 'alta',
        consent_given: true,
        consent_given_at: Time.current,
        metadata: {
          'recommended_company_ids' => [1, 2],
          'clicked_company_id' => 1,
          'quote_requested_company_id' => 1
        }
      )

      # Pontuações brutas:
      # 1. Cidade/Estado: +15
      # 2. Intenção comercial clara: +20
      # 3. Empresa recomendada: +10
      # 4. Clicou em empresa: +15
      # 5. Pediu orçamento: +20
      # 6. Informou WhatsApp + consentimento: +20
      # 7. E-mail: +5
      # 8. Urgência: +10
      # Total Bruto: 115 -> Clamped para 100

      score = described_class.calculate(chat_lead)
      expect(score).to eq(100)
    end

    it 'aplica pontuação parcial exata igual a 40' do
      chat_lead = ChatLead.new(
        chat_session: chat_session,
        name: 'Cliente Parcial',
        email: 'cliente@gmail.com',
        phone: nil,
        city: 'Cuiabá',
        state: 'MT',
        intent: 'solar_quote',
        consent_given: true,
        consent_given_at: Time.current,
        metadata: {}
      )

      # Pontuações:
      # 1. Cidade/Estado: +15
      # 2. Intenção comercial: +20
      # 7. E-mail: +5
      # Total: 40

      score = described_class.calculate(chat_lead)
      expect(score).to eq(40)
    end
  end

  describe '.qualification_level' do
    it 'retorna quente para scores >= 70' do
      expect(described_class.qualification_level(70)).to eq('quente')
      expect(described_class.qualification_level(95)).to eq('quente')
    end

    it 'retorna morno para scores entre 40 e 69' do
      expect(described_class.qualification_level(40)).to eq('morno')
      expect(described_class.qualification_level(69)).to eq('morno')
    end

    it 'retorna frio para scores < 40' do
      expect(described_class.qualification_level(39)).to eq('frio')
      expect(described_class.qualification_level(0)).to eq('frio')
    end
  end
end
