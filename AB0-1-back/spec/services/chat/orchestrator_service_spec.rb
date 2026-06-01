require 'rails_helper'

RSpec.describe Chat::OrchestratorService do
  # Mock basico para evitar dependências pesadas de DB se o projeto não estiver preparado
  let(:chat_messages) { double('chat_messages', create!: double(id: 1, content: 'msg', role: 'user', created_at: Time.current, intent_detected: 'solar_quote', metadata: {}), chronological: double(last: [])) }
  let(:session) { double('session', id: 1, chat_messages: chat_messages, metadata: {}, update!: true, increment_message_count!: true, message_count: 1, source_page: '/', vertical: 'solar', page_url: '/') }
  
  let(:user_message) { "quero instalar um painel solar urgente" }
  let(:service) { described_class.new(session: session) }

  before do
    allow(chat_messages).to receive(:user_messages).and_return(double(count: 1))
    allow(session).to receive(:chat_messages).and_return(chat_messages)
    
    allow(Chat::SafetyService).to receive(:sanitize).and_return(user_message)
    allow(Chat::RetrievalService).to receive(:context_for).and_return("context")
    allow(Chat::LlmGateway).to receive(:call).and_return({ content: "Resposta LLM", model: "gpt-4", token_count: 10, latency_ms: 100, success: true })
    allow(Chat::PosthogTrackingService).to receive(:track)
  end

  describe '#process' do
    context 'when MOBIVOLT_INTENT_ROUTER_ENABLED is false (legacy behavior)' do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with('MOBIVOLT_INTENT_ROUTER_ENABLED', 'false').and_return('false')
        allow(ENV).to receive(:fetch).with('MOBIVOLT_INTENT_ROUTER_SHADOW_ENABLED', 'false').and_return('false')
      end

      it 'uses the old detect_intent logic' do
        result = service.process(user_message)
        expect(result[:response][:intent_detected]).to eq('solar_quote')
        expect(result[:should_trigger_lead]).to be true
      end
    end

    context 'when MOBIVOLT_INTENT_ROUTER_SHADOW_ENABLED is true' do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with('MOBIVOLT_INTENT_ROUTER_ENABLED', 'false').and_return('false')
        allow(ENV).to receive(:fetch).with('MOBIVOLT_INTENT_ROUTER_SHADOW_ENABLED', 'false').and_return('true')
      end

      it 'uses old logic but tracks shadow events' do
        expect(Chat::PosthogTrackingService).to receive(:track).with(hash_including(event: 'mobivolt_intent_router_evaluated')).at_least(:once)
        result = service.process(user_message)
        
        # Old detect_intent evaluates it to solar_quote
        expect(result[:response][:intent_detected]).to eq('solar_quote')
      end
    end

    context 'when MOBIVOLT_INTENT_ROUTER_ENABLED is true' do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with('MOBIVOLT_INTENT_ROUTER_ENABLED', 'false').and_return('true')
        allow(ENV).to receive(:fetch).with('MOBIVOLT_INTENT_ROUTER_SHADOW_ENABLED', 'false').and_return('false')
      end

      it 'uses the new IntentRouterService' do
        expect(Chat::PosthogTrackingService).to receive(:track).with(hash_including(event: 'mobivolt_intent_router_evaluated')).at_least(:once)
        result = service.process(user_message)
        
        # New router evaluates "quero instalar" to 'lead_qualification'
        expect(result[:response][:intent_detected]).to eq('lead_qualification')
        expect(result[:should_trigger_lead]).to be true
      end
    end
  end
end
