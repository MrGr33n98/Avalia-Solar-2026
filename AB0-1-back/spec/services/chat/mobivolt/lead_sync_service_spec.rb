# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::LeadSyncService, type: :service do
  let!(:chat_session) { create(:chat_session) }
  let!(:company) { create(:company, status: 'active') }

  let(:chat_lead_valid) do
    # Criamos um ChatLead válido com consentimento dado
    ChatLead.create!(
      chat_session: chat_session,
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11988888888',
      city: 'São Paulo',
      state: 'SP',
      intent: 'solar_quote',
      consent_given: true,
      consent_given_at: Time.current,
      metadata: {
        'recommended_company_ids' => [company.id],
        'quote_requested_company_id' => company.id,
        'lgpd_consent_version' => 'v1',
        'lgpd_consent_text' => 'Aceito compartilhar meus dados.',
        'qualification_answers' => {
          'need' => 'new_installation',
          'profile' => 'residential'
        }
      }
    )
  end

  let(:chat_lead_without_consent) do
    # ChatLead criado sem consentimento (forçamos skip na validação se houver)
    chat_lead = ChatLead.new(
      chat_session: chat_session,
      name: 'Sem Consentimento',
      email: 'sem@example.com',
      phone: '11977777777',
      consent_given: false
    )
    chat_lead.save(validate: false)
    chat_lead
  end

  before do
    allow(Chat::PosthogTrackingService).to receive(:track)
    allow(EventDispatcher).to receive(:dispatch)
  end

  describe '.sync!' do
    context 'quando o consentimento da LGPD não foi dado' do
      it 'não cria o lead principal e retorna nil' do
        expect do
          result = described_class.sync!(chat_lead_without_consent)
          expect(result).to be_nil
        end.not_to change(Lead, :count)
      end
    end

    context 'quando o lead é válido' do
      it 'sincroniza o ChatLead criando um Lead principal com source mobivolt_ai' do
        expect do
          lead = described_class.sync!(chat_lead_valid)
          expect(lead).to be_a(Lead)
          expect(lead.name).to eq('João Silva')
          expect(lead.email).to eq('joao@example.com')
          expect(lead.phone).to eq('11988888888')
          expect(lead.source).to eq('mobivolt_ai')
          expect(lead.lead_score).to be_present
          expect(lead.qualification_level).to be_present
          expect(lead.chat_lead_id).to eq(chat_lead_valid.id)
          expect(lead.chat_session_id).to eq(chat_session.id)
          expect(lead.quote_requested_company_id).to eq(company.id)
          expect(lead.wizard_answers).to include(
            'need' => 'new_installation',
            'profile' => 'residential'
          )
        end.to change(Lead, :count).by(1)
      end

      it 'rastreia o evento no Posthog' do
        described_class.sync!(chat_lead_valid)
        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          event: 'mobivolt_lead_synced_to_leads',
          distinct_id: chat_session.visitor_id,
          properties: anything
        )
      end
    end

    context 'quando ocorre uma tentativa de duplicidade (idempotência)' do
      it 'atualiza o lead existente em vez de criar um novo dentro da janela de 5 minutos' do
        # Cria primeiro lead
        lead1 = described_class.sync!(chat_lead_valid)

        # Tenta sincronizar novamente o mesmo chat lead
        expect do
          lead2 = described_class.sync!(chat_lead_valid)
          expect(lead2.id).to eq(lead1.id)
        end.not_to change(Lead, :count)
      end

      it 'permite criar um novo lead se passar da janela de 5 minutos' do
        lead1 = described_class.sync!(chat_lead_valid)

        # Retrocede a data de criação do Lead criado
        lead1.update_columns(created_at: 10.minutes.ago)

        # Nova tentativa de sync
        expect do
          described_class.sync!(chat_lead_valid)
        end.to change(Lead, :count).by(1)
      end
    end

    context 'quando a criação do lead principal falha' do
      before do
        allow(Lead).to receive(:create!).and_raise(ActiveRecord::RecordInvalid.new(Lead.new))
      end

      it 'não apaga o ChatLead original e propaga o erro' do
        lead_to_sync = chat_lead_valid # Avalia aqui para criar no banco antes do expect
        # ChatLead não é apagado
        expect do
          expect do
            described_class.sync!(lead_to_sync)
          end.to raise_error(ActiveRecord::RecordInvalid)
        end.not_to change(ChatLead, :count)
      end
    end
  end
end
