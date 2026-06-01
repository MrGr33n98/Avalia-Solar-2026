require 'rails_helper'

RSpec.describe Chat::Agents::CRMHandoffAgent do
  let(:session) { double('ChatSession', id: 1) }
  let(:user_message) { "Olá, quero saber o preço" }
  let(:router_state) { { intent: 'solar_quote', next_agent: 'company_recommendation' } }
  let(:lead_qualification_result) do
    {
      should_trigger_lead: true,
      lead_score: 50,
      lead_temperature: 'warm',
      lead_reason: 'commercial_intent_detected'
    }
  end

  before do
    allow(Chat::PosthogTrackingService).to receive(:track)
  end

  describe '.process' do
    context 'quando não existe lead criado (usuário não preencheu form)' do
      before do
        allow(ChatLead).to receive(:find_by).with(chat_session_id: session.id).and_return(nil)
      end

      it 'retorna pending_contact_info' do
        result = described_class.process(
          session: session,
          user_message: user_message,
          router_state: router_state,
          lead_qualification_result: lead_qualification_result
        )

        expect(result[:success]).to be true
        expect(result[:lead_status]).to eq('pending_contact_info')
        expect(result[:handoff_triggered]).to be false
        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          hash_including(event: 'mobivolt_crm_handoff_evaluated')
        )
      end

      context 'quando should_trigger_lead é false' do
        before do
          lead_qualification_result[:should_trigger_lead] = false
        end

        it 'retorna ignored' do
          result = described_class.process(
            session: session,
            user_message: user_message,
            router_state: router_state,
            lead_qualification_result: lead_qualification_result
          )
          expect(result[:lead_status]).to eq('ignored')
        end
      end
    end

    context 'quando o lead já existe (usuário preencheu o form)' do
      let(:existing_lead) do
        double('ChatLead', id: 10, lead_score: 30, lead_temperature: 'cold', chat_session_id: session.id)
      end

      before do
        allow(ChatLead).to receive(:find_by).with(chat_session_id: session.id).and_return(existing_lead)
        allow(existing_lead).to receive(:update!)
      end

      it 'atualiza o lead e previne duplicidade se o score for maior' do
        result = described_class.process(
          session: session,
          user_message: user_message,
          router_state: router_state,
          lead_qualification_result: lead_qualification_result
        )

        expect(existing_lead).to have_received(:update!).with(
          lead_score: 50,
          lead_temperature: 'warm',
          intent: 'solar_quote'
        )
        expect(result[:lead_status]).to eq('updated')
        expect(result[:handoff_triggered]).to be true
        expect(result[:duplicate_prevented]).to be true
        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          hash_including(event: 'mobivolt_crm_handoff_updated')
        )
      end

      it 'impede degradação de score se o novo score for menor' do
        lead_qualification_result[:lead_score] = 10 # Novo score menor
        
        result = described_class.process(
          session: session,
          user_message: user_message,
          router_state: router_state,
          lead_qualification_result: lead_qualification_result
        )

        expect(existing_lead).not_to have_received(:update!)
        expect(result[:lead_status]).to eq('duplicate_prevented')
        expect(result[:lead_score]).to eq(30) # Mantém o antigo
        expect(result[:duplicate_prevented]).to be true
        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          hash_including(event: 'mobivolt_crm_handoff_duplicate_prevented')
        )
      end
    end

    context 'em caso de falha' do
      before do
        allow(ChatLead).to receive(:find_by).and_raise(StandardError, 'DB Error')
        allow(described_class).to receive(:log_error)
      end

      it 'retorna fallback seguro' do
        result = described_class.process(
          session: session,
          user_message: user_message,
          router_state: router_state,
          lead_qualification_result: lead_qualification_result
        )

        expect(result[:success]).to be false
        expect(result[:fallback_triggered]).to be true
        expect(result[:lead_status]).to eq('error')
        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          hash_including(event: 'mobivolt_crm_handoff_fallback')
        )
      end
    end
  end
end
