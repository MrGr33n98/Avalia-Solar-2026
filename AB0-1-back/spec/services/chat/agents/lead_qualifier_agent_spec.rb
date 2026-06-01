require 'rails_helper'

RSpec.describe Chat::Agents::LeadQualifierAgent do
  let(:session) { double('ChatSession', id: 1, chat_messages: double('chat_messages', user_messages: double('user_messages', count: user_messages_count))) }
  let(:user_messages_count) { 1 }

  before do
    allow(Chat::PosthogTrackingService).to receive(:track)
    allow(Chat::LeadScoringService).to receive(:temperature_for).and_return('warm')
  end

  describe '.process' do
    context 'com intenção comercial explícita' do
      let(:user_message) { "Gostaria de um orçamento para instalar painel solar" }
      let(:router_state) { { intent: 'solar_quote' } }

      it 'dispara lead' do
        result = described_class.process(session: session, user_message: user_message, router_state: router_state)
        
        expect(result[:should_trigger_lead]).to be true
        expect(result[:commercial_intent]).to be true
        expect(result[:lead_score]).to be > 0
        expect(result[:lead_temperature]).to eq('warm')
      end
    end

    context 'na 3ª mensagem' do
      let(:user_messages_count) { 3 }

      context 'com intent company_recommendation (sem empresas)' do
        let(:user_message) { "Quais empresas existem?" }
        let(:router_state) { { intent: 'company_recommendation' } }
        let(:agent_result) { { metadata: { 'companies' => [] } } }

        it 'NÃO dispara lead se não tiver intenção comercial' do
          result = described_class.process(session: session, user_message: user_message, router_state: router_state, agent_result: agent_result)
          
          expect(result[:should_trigger_lead]).to be false
          expect(result[:commercial_intent]).to be false
          expect(result[:lead_reason]).to eq('empty_search_no_commercial')
        end
      end

      context 'com intent fallback' do
        let(:user_message) { "Eita, legal." }
        let(:router_state) { { intent: 'fallback' } }

        it 'NÃO dispara lead se não tiver intenção comercial' do
          result = described_class.process(session: session, user_message: user_message, router_state: router_state)
          
          expect(result[:should_trigger_lead]).to be false
          expect(result[:commercial_intent]).to be false
          expect(result[:lead_reason]).to eq('informative_intent')
        end
      end

      context 'com intent padrão (ex: comparar)' do
        let(:user_message) { "Pode listar as diferenças?" }
        let(:router_state) { { intent: 'compare_companies' } }

        it 'dispara lead' do
          result = described_class.process(session: session, user_message: user_message, router_state: router_state)
          
          expect(result[:should_trigger_lead]).to be true
          expect(result[:lead_reason]).to eq('engagement_count')
        end
      end
    end

    context 'com erro interno' do
      let(:user_message) { "Orçamento" }
      let(:router_state) { { intent: 'solar_quote' } }

      before do
        allow(described_class).to receive(:normalize_text).and_raise(StandardError, 'Ops')
      end

      it 'retorna fallback seguro' do
        result = described_class.process(session: session, user_message: user_message, router_state: router_state)
        
        expect(result[:should_trigger_lead]).to be false
        expect(result[:fallback_triggered]).to be true
        expect(result[:error]).to eq('Ops')
      end
    end
  end
end
