require 'rails_helper'

RSpec.describe ChatLead, type: :model do
  describe 'contrato atual de score e temperatura' do
    it 'persiste uma temperatura em inglês após a validação em português' do
      lead = build(
        :chat_lead,
        lead_temperature: 'frio',
        consent_given: true,
        consent_given_at: Time.current
      )

      lead.save!
      lead.reload

      expect(lead.lead_temperature).to eq(
        Chat::LeadScoringService.temperature_for(lead.lead_score)
      )

      expect(lead.lead_temperature).to be_in(%w[cold warm hot])
    end

    it 'torna o registro inválido após persistir a temperatura em inglês' do
      lead = create(
        :chat_lead,
        lead_temperature: 'frio',
        consent_given: true,
        consent_given_at: Time.current
      )

      lead.reload

      expect(lead).not_to be_valid
      expect(lead.errors[:lead_temperature]).to be_present
    end

    it 'bloqueia atualizações posteriores por causa do contrato divergente' do
      lead = create(
        :chat_lead,
        lead_temperature: 'frio',
        consent_given: true,
        consent_given_at: Time.current
      )

      lead.reload

      expect do
        lead.update!(utm_campaign: 'characterization-test')
      end.to raise_error(
        ActiveRecord::RecordInvalid,
        /Lead temperature/
      )
    end
  end
end
