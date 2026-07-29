# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Agents::LeadQualifierAgent, type: :service do
  let(:session) { create(:chat_session) }

  describe '.process' do
    context 'quando há intenção comercial' do
      it 'calcula o score com bônus comercial' do
        result = described_class.process(
          session: session,
          user_message: 'Quero um orçamento para instalação solar em São Paulo',
          router_state: { intent: 'solar_quote' }
        )

        expect(result[:commercial_intent]).to be true
        expect(result[:should_trigger_lead]).to be true
        expect(result[:lead_score]).to be >= 40
      end
    end

    context 'quando detecta urgência' do
      it 'adiciona pontuação de urgência (+20)' do
        result = described_class.process(
          session: session,
          user_message: 'Preciso urgente de cotação para ontem',
          router_state: { intent: 'solar_quote' }
        )

        expect(result[:lead_score]).to be >= 60
      end
    end

    context 'na terceira mensagem da sessão' do
      it 'adiciona pontuação de engajamento sessional (+10)' do
        3.times { create(:chat_message, chat_session: session, role: 'user') }

        result = described_class.process(
          session: session,
          user_message: 'Quais as marcas disponíveis?',
          router_state: { intent: 'company_recommendation' }
        )

        expect(result[:should_trigger_lead]).to be true
        expect(result[:lead_reason]).to eq('engagement_count')
      end
    end

    context 'com detecção de localização no texto' do
      it 'pontua a presença de palavras de localização (+10)' do
        result = described_class.process(
          session: session,
          user_message: 'Orçamento no Rio de Janeiro',
          router_state: { intent: 'solar_quote' }
        )

        expect(result[:lead_score]).to eq(50)
      end
    end

    context 'limites de temperatura (cold/warm/hot)' do
      it 'retorna temperatura baseada na faixa de score' do
        res_hot = described_class.process(
          session: session,
          user_message: 'Quero orçamento urgente no Rio de Janeiro comparativo',
          router_state: { intent: 'compare_companies' }
        )
        expect(res_hot[:lead_temperature]).to eq('hot')
      end
    end

    context 'quando ocorre uma exceção interna' do
      it 'retorna um hash de fallback seguro com erro documentado' do
        allow(described_class).to receive(:normalize_text).and_raise(StandardError.new('Falha de banco'))

        result = described_class.process(
          session: session,
          user_message: 'Qualquer texto',
          router_state: { intent: 'general_question' }
        )

        expect(result[:fallback_triggered]).to be true
        expect(result[:error]).to eq('Falha de banco')
        expect(result[:should_trigger_lead]).to be false
        expect(result[:lead_score]).to eq(0)
        expect(result[:lead_temperature]).to eq('cold')
      end
    end
  end
end
