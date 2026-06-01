# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Agents::CompanyRecommendationAgent, type: :service do
  let(:session) { create(:chat_session) }
  let(:router_state) { { intent: 'company_recommendation', next_agent: 'company_recommendation' } }

  describe '.process' do
    before do
      allow(session).to receive(:chat_messages).and_return(
        double('chat_messages', user_messages: double('user_messages', count: 1))
      )
    end

    context 'quando a busca retorna empresas' do
      before do
        allow(Chat::Mobivolt::CompanyContextBuilderService).to receive(:build_for)
          .and_return({ empresas_encontradas: [{ id: 1, name: 'Empresa Teste Solar' }] })
      end

      it 'retorna uma mensagem curta de sucesso sem inventar dados e inclui as empresas no metadata' do
        result = described_class.process(
          session: session,
          user_message: 'Quero um orçamento de painel solar',
          router_state: router_state
        )

        expect(result[:success]).to be true
        expect(result[:metadata]['companies'].length).to eq(1)
        expect(result[:metadata]['companies'].first[:name]).to eq('Empresa Teste Solar')
        expect(result[:should_trigger_lead]).to be false
        expect(result[:content]).to match(/Encontrei.*opções ativas/)
      end
    end

    context 'quando a busca retorna vazio' do
      before do
        allow(Chat::Mobivolt::CompanyContextBuilderService).to receive(:build_for)
          .and_return({ empresas_encontradas: [] })
      end

      it 'retorna fallback seguro sem quebrar o componente e should_trigger_lead false se for apenas dúvida' do
        result = described_class.process(
          session: session,
          user_message: 'Quais instaladores tem aqui?',
          router_state: router_state
        )

        expect(result[:success]).to be true
        expect(result[:metadata]['companies']).to be_empty
        expect(result[:should_trigger_lead]).to be false
        expect(result[:content]).to match(/Não encontrei instaladores ativos/)
      end

      it 'mantém qualificação centralizada mesmo se a mensagem indicar urgência ou orçamento' do
        result = described_class.process(
          session: session,
          user_message: 'Preciso de orçamento urgente',
          router_state: router_state
        )

        expect(result[:should_trigger_lead]).to be false
      end
    end

    context 'quando ocorre uma exception no serviço construtor' do
      before do
        allow(Chat::Mobivolt::CompanyContextBuilderService).to receive(:build_for)
          .and_raise(StandardError.new('DB Timeout'))
      end

      it 'engole o erro e retorna o payload padronizado de fallback' do
        result = described_class.process(
          session: session,
          user_message: 'Orçamento',
          router_state: router_state
        )

        expect(result[:success]).to be false
        expect(result[:fallback_triggered]).to be true
        expect(result[:intent]).to eq('fallback')
        expect(result[:metadata]).to eq({})
        expect(result[:content]).to match(/consegui buscar/)
      end
    end
  end
end
