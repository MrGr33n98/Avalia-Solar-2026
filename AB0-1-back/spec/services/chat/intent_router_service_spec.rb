require 'rails_helper'

RSpec.describe Chat::IntentRouterService do
  describe '.route' do
    context 'with known intents' do
      it 'identifies greeting' do
        result = described_class.route("olá, tudo bem?")
        expect(result[:intent]).to eq('greeting')
        expect(result[:should_trigger_lead]).to be false
      end

      it 'identifies lead_qualification and triggers lead' do
        result = described_class.route("quero fazer um orçamento para minha casa")
        expect(result[:intent]).to eq('lead_qualification')
        expect(result[:should_trigger_lead]).to be true
      end

      it 'identifies company_recommendation without urgency' do
        result = described_class.route("qual a melhor empresa de energia solar?")
        expect(result[:intent]).to eq('company_recommendation')
        expect(result[:should_trigger_lead]).to be false
      end

      it 'identifies company_recommendation with high urgency' do
        result = described_class.route("preciso de um instalador rápido pra ontem")
        expect(result[:intent]).to eq('company_recommendation')
        expect(result[:urgency]).to eq('high')
        expect(result[:should_trigger_lead]).to be true
      end

      it 'identifies company_recommendation with quote keyword' do
        result = described_class.route("me indica uma empresa pra fazer cotação")
        expect(result[:intent]).to eq('company_recommendation')
        expect(result[:should_trigger_lead]).to be true
      end

      it 'identifies explicit commercial installation request' do
        result = described_class.route("quero instalar energia solar")
        expect(result[:intent]).to eq('lead_qualification')
        expect(result[:should_trigger_lead]).to be true
      end

      it 'does not treat isolated price question as commercial intent' do
        result = described_class.route("qual o preço do microinversor?")
        expect(result[:intent]).to eq('solar_support')
        expect(result[:should_trigger_lead]).to be false
      end

      {
        'o que é microinversor?' => 'solar_support',
        'qual a diferença entre inversor vs microinversor?' => 'solar_support',
        'o que é energia injetada?' => 'solar_support',
        'como funcionam os créditos de energia?' => 'solar_support',
        'qual a diferença entre recarga AC/DC?' => 'ev_charger_question',
        'o que é bateria solar?' => 'solar_support',
        'o que é carport solar?' => 'solar_support',
        'o que é wallbox?' => 'ev_charger_question',
        'posso instalar carregador em condomínio?' => 'ev_charger_question'
      }.each do |message, expected_intent|
        it "routes '#{message}' to #{expected_intent}" do
          expect(described_class.route(message)[:intent]).to eq(expected_intent)
        end
      end
    end

    context 'with location extraction' do
      it 'extracts city' do
        result = described_class.route("quero instalar painel em belo horizonte")
        expect(result[:location][:city]).to eq('Belo Horizonte')
      end

      it 'extracts state' do
        result = described_class.route("empresas em SP")
        expect(result[:location][:state]).to eq('SP')
      end
    end

    context 'fallback and error handling' do
      it 'returns fallback for gibberish' do
        result = described_class.route("aslkdjalskdj")
        expect(result[:intent]).to eq('fallback')
        expect(result[:confidence_score]).to be < 0.5
        expect(result[:fallback_triggered]).to be true
      end

      it 'never raises an exception, always returns fallback gracefully' do
        # Força um erro no método match?
        allow_any_instance_of(String).to receive(:match?).and_raise(StandardError, "Boom")
        
        expect {
          result = described_class.route("hello")
          expect(result[:intent]).to eq('fallback')
          expect(result[:fallback_triggered]).to be true
        }.not_to raise_error
      end
    end
  end
end
