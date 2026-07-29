require 'rails_helper'

RSpec.describe ChatLead, type: :model do
  describe 'contrato atual de score e temperatura' do
    it 'criação persiste temperatura em português' do
      lead = create(:chat_lead, consent_given: true, consent_given_at: Time.current)
      expect(lead.lead_temperature).to be_in(%w[frio morno quente muito_quente])
    end

    it 'permanece válido após persistência e reload' do
      lead = create(:chat_lead, consent_given: true, consent_given_at: Time.current)
      lead.reload
      expect(lead).to be_valid
      expect(lead.lead_temperature).to be_in(%w[frio morno quente muito_quente])
    end

    it 'permite atualizações posteriores' do
      lead = create(:chat_lead, consent_given: true, consent_given_at: Time.current)
      expect do
        lead.update!(utm_campaign: 'temperature-contract-fixed')
      end.not_to raise_error
    end

    it 'mudança de campo de scoring recalcula score e temperatura' do
      lead = create(
        :chat_lead,
        vertical: nil,
        city: nil,
        state: nil,
        monthly_bill: nil,
        decision_timeline: nil,
        consent_given: true,
        consent_given_at: Time.current
      )
      original_score = lead.lead_score
      original_temperature = lead.lead_temperature

      lead.update!(
        vertical: 'solar',
        city: 'São Paulo',
        monthly_bill: 'above_1000',
        decision_timeline: 'immediate'
      )

      expect(lead.lead_score).not_to eq(original_score)
      expect(lead.lead_temperature).not_to eq(original_temperature)
    end

    it 'recalcula o score quando metadata de conversão muda' do
      lead = create(
        :chat_lead,
        metadata: {},
        consent_given: true,
        consent_given_at: Time.current
      )

      original_score = lead.lead_score

      lead.update!(
        metadata: (lead.metadata || {}).merge(
          'quote_requested_company_id' => 123
        )
      )

      expect(lead.lead_score).to eq(original_score + 40)
    end

    it 'recalcula o score quando decision_timeline muda' do
      lead = create(
        :chat_lead,
        vertical: 'solar',
        urgency: nil,
        decision_timeline: nil,
        consent_given: true,
        consent_given_at: Time.current
      )

      original_score = lead.lead_score

      lead.update!(decision_timeline: 'immediate')

      expect(lead.lead_score).to eq(original_score + 50)
    end

    it 'mudança de campo não relacionado não recalcula score' do
      lead = create(:chat_lead)
      original_score = lead.lead_score

      expect(Chat::LeadScoringService).not_to receive(:calculate)
      lead.update!(utm_source: 'google')
      expect(lead.lead_score).to eq(original_score)
    end

    it 'nenhum valor cold/warm/hot é persistido' do
      lead = create(:chat_lead)
      expect(lead.lead_temperature).not_to be_in(%w[cold warm hot])
    end
  end

  describe 'Chat::LeadTemperature normalizer' do
    it 'aceita os quatro valores portugueses' do
      %w[frio morno quente muito_quente].each do |temp|
        expect(Chat::LeadTemperature.normalize(temp)).to eq(temp)
      end
    end

    it 'converte cold/warm/hot' do
      expect(Chat::LeadTemperature.normalize('cold')).to eq('frio')
      expect(Chat::LeadTemperature.normalize('warm')).to eq('morno')
      expect(Chat::LeadTemperature.normalize('hot')).to eq('quente')
    end

    it 'rejeita valor desconhecido' do
      expect do
        Chat::LeadTemperature.normalize('freezing')
      end.to raise_error(ArgumentError, /Temperatura de lead inválida/)
    end
  end
end
