# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Agents::SupportAgent, type: :service do
  let(:session) { create(:chat_session) }
  let(:router_state) { { intent: 'solar_support', next_agent: 'support' } }

  describe '.process' do
    let(:article) { double('KnowledgeArticle', title: 'O que é wallbox?', slug: 'o-que-e-wallbox', content: 'Wallbox é um carregador residencial rápido.', category: double('Category', name: 'Carregadores')) }

    before do
      allow(Chat::PosthogTrackingService).to receive(:track)
    end

    context 'quando a base de conhecimento possui artigos relevantes' do
      before do
        allow(Chat::KnowledgeBaseSearchService).to receive(:call)
          .with(query: 'como funciona wallbox')
          .and_return([article])

        allow(Chat::LlmGateway).to receive(:call)
          .and_return({ success: true, content: 'O wallbox carrega seu carro elétrico de forma rápida e segura.', model: 'gpt-4o-mini', token_count: 50, latency_ms: 100 })
      end

      it 'chama o LlmGateway com contexto controlado e retorna a resposta com metadata correto' do
        result = described_class.process(
          session: session,
          user_message: 'como funciona wallbox',
          router_state: router_state
        )

        expect(result[:success]).to be true
        expect(result[:intent]).to eq('solar_support')
        expect(result[:should_trigger_lead]).to be false
        expect(result[:metadata]['type']).to eq('support_answer')
        expect(result[:metadata]['sources'].first['title']).to eq('O que é wallbox?')
        expect(result[:metadata]['sources'].first['slug']).to eq('o-que-e-wallbox')
        expect(result[:metadata]['knowledge_category']).to eq('Carregadores')
        expect(result[:metadata]['confidence_score']).to eq(1.0)
        expect(result[:content]).to eq('O wallbox carrega seu carro elétrico de forma rápida e segura.')
      end

      it 'dispara eventos do PostHog de sucesso sem vazar PII' do
        described_class.process(
          session: session,
          user_message: 'como funciona wallbox',
          router_state: router_state
        )

        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          event: 'mobivolt_support_agent_invoked',
          properties: hash_including(session_id: session.id, intent: 'solar_support'),
          distinct_id: session.visitor_id
        )

        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          event: 'mobivolt_support_answer_success',
          properties: hash_including(
            session_id: session.id,
            intent: 'solar_support',
            knowledge_category: 'Carregadores',
            confidence_score: 1.0,
            sources_count: 1,
            fallback_triggered: false
          ),
          distinct_id: session.visitor_id
        )
      end
    end

    context 'quando a base de conhecimento não possui artigos relevantes' do
      before do
        allow(Chat::KnowledgeBaseSearchService).to receive(:call).and_return([])
      end

      it 'retorna um fallback honesto sem chamar o LlmGateway' do
        expect(Chat::LlmGateway).not_to receive(:call)

        result = described_class.process(
          session: session,
          user_message: 'qual o preço da batata',
          router_state: router_state
        )

        expect(result[:success]).to be false
        expect(result[:fallback_triggered]).to be true
        expect(result[:should_trigger_lead]).to be false
        expect(result[:metadata]['type']).to eq('support_answer')
        expect(result[:metadata]['sources']).to be_empty
        expect(result[:content]).to match(/Não encontrei uma resposta confiável/)
      end

      it 'dispara evento de busca vazia no PostHog sem PII' do
        described_class.process(
          session: session,
          user_message: 'qual o preço da batata',
          router_state: router_state
        )

        expect(Chat::PosthogTrackingService).to have_received(:track).with(
          event: 'mobivolt_support_answer_empty',
          properties: hash_including(
            session_id: session.id,
            intent: 'solar_support',
            knowledge_category: nil,
            confidence_score: 0.0,
            sources_count: 0,
            fallback_triggered: true
          ),
          distinct_id: session.visitor_id
        )
      end
    end

    context 'quando ocorre uma falha catastrófica' do
      before do
        allow(Chat::KnowledgeBaseSearchService).to receive(:call).and_raise(StandardError.new('DB connection lost'))
      end

      it 'captura a exceção de forma segura e retorna o fallback padrão' do
        result = described_class.process(
          session: session,
          user_message: 'erro',
          router_state: router_state
        )

        expect(result[:success]).to be false
        expect(result[:fallback_triggered]).to be true
        expect(result[:should_trigger_lead]).to be false
        expect(result[:error]).to eq('DB connection lost')
        expect(result[:content]).to match(/Não encontrei uma resposta confiável/)
      end
    end
  end
end
