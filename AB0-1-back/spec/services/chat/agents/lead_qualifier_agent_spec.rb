# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Agents::LeadQualifierAgent do
  let(:user_msgs) { double('user_messages', count: user_messages_count) }
  let(:chat_msgs) { double('chat_messages', user_messages: user_msgs) }
  let(:session) { double('ChatSession', id: 1, chat_messages: chat_msgs) }
  let(:user_messages_count) { 1 }

  before do
    allow(Chat::PosthogTrackingService).to receive(:track)
    allow(Chat::LeadScoringService).to receive(:temperature_for).and_return('warm')
  end

  describe '.process' do
    context 'com intenção comercial explícita' do
      let(:user_message) { 'Gostaria de um orçamento para instalar painel solar' }
      let(:router_state) { { intent: 'solar_quote' } }

      it 'dispara lead' do
        result = described_class.process(session: session, user_message: user_message, router_state: router_state)

        expect(result[:should_trigger_lead]).to be true
        expect(result[:commercial_intent]).to be true
        expect(result[:lead_score]).to eq(40) # 40 por intenção comercial
        expect(result[:lead_temperature]).to eq('warm')
      end
    end

    context 'com urgência isolada e localização' do
      let(:user_message) { 'Preciso urgente de cotação em São Paulo' }
      let(:router_state) { { intent: 'solar_quote' } }

      it 'calcula o score exato combinando comercial (40), urgência (20) e localização (10)' do
        result = described_class.process(session: session, user_message: user_message, router_state: router_state)

        expect(result[:lead_score]).to eq(70) # 40 (comercial) + 20 (urgente) + 10 (em São Paulo)
      end
    end

    context 'na 3ª mensagem' do
      let(:user_messages_count) { 3 }

      context 'com intent company_recommendation (sem empresas)' do
        let(:user_message) { 'Quais empresas existem?' }
        let(:router_state) { { intent: 'company_recommendation' } }
        let(:agent_result) { { metadata: { 'companies' => [] } } }

        it 'NÃO dispara lead se não tiver intenção comercial' do
          result = described_class.process(session: session, user_message: user_message, router_state: router_state,
                                           agent_result: agent_result)

          expect(result[:should_trigger_lead]).to be false
          expect(result[:commercial_intent]).to be false
          expect(result[:lead_reason]).to eq('empty_search_no_commercial')
        end
      end

      context 'com intent fallback' do
        let(:user_message) { 'Eita, legal.' }
        let(:router_state) { { intent: 'fallback' } }

        it 'NÃO dispara lead se não tiver intenção comercial' do
          result = described_class.process(session: session, user_message: user_message, router_state: router_state)

          expect(result[:should_trigger_lead]).to be false
          expect(result[:commercial_intent]).to be false
          expect(result[:lead_reason]).to eq('informative_intent')
        end
      end

      context 'com intent padrão (ex: comparar)' do
        let(:user_message) { 'Pode listar as diferenças?' }
        let(:router_state) { { intent: 'compare_companies' } }

        it 'dispara lead por contagem de engajamento' do
          result = described_class.process(session: session, user_message: user_message, router_state: router_state)

          expect(result[:should_trigger_lead]).to be true
          expect(result[:lead_reason]).to eq('engagement_count')
        end
      end

      %w[solar_support financing_question ev_charger_question solar_assessment].each do |technical_intent|
        context "com intent técnica #{technical_intent}" do
          let(:user_message) { 'Preciso de ajuda urgente agora' }
          let(:router_state) { { intent: technical_intent } }

          it 'NÃO dispara lead por engajamento ou urgência isolada' do
            result = described_class.process(session: session, user_message: user_message, router_state: router_state)

            expect(result[:should_trigger_lead]).to be false
            expect(result[:commercial_intent]).to be false
            expect(result[:lead_reason]).to eq('informative_intent')
          end
        end
      end
    end

    context 'com pergunta técnica sobre preço isolado' do
      let(:user_message) { 'Qual o preço do wallbox?' }
      let(:router_state) { { intent: 'ev_charger_question' } }

      it 'NÃO dispara lead sem ação comercial explícita' do
        result = described_class.process(session: session, user_message: user_message, router_state: router_state)

        expect(result[:should_trigger_lead]).to be false
        expect(result[:commercial_intent]).to be false
      end
    end

    context 'com pergunta técnica e ação comercial explícita' do
      let(:user_message) { 'Quero instalar um wallbox e solicitar orçamento' }
      let(:router_state) { { intent: 'ev_charger_question' } }

      it 'dispara lead' do
        result = described_class.process(session: session, user_message: user_message, router_state: router_state)

        expect(result[:should_trigger_lead]).to be true
        expect(result[:commercial_intent]).to be true
        expect(result[:lead_reason]).to eq('technical_commercial_override')
      end
    end

    context 'com rastreamento PostHog' do
      let(:user_message) { 'Quero cotação solar' }
      let(:router_state) { { intent: 'solar_quote', next_agent: 'lead_qualifier' } }

      it 'chama o Chat::PosthogTrackingService.track com propriedades corretas' do
        described_class.process(session: session, user_message: user_message, router_state: router_state)

        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          event: 'mobivolt_lead_qualification_evaluated',
          properties: hash_including(
            session_id: 1,
            intent: 'solar_quote',
            should_trigger_lead: true
          )
        )
      end
    end

    context 'com erro interno' do
      let(:user_message) { 'Orçamento' }
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
