# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::IntentParserService, type: :service do
  describe '.parse' do
    it 'extrai cidade e define recommendation_intent como true para "recomende instalador em Cuiabá"' do
      result = described_class.parse('recomende instalador em Cuiabá')
      expect(result[:recommendation_intent]).to be true
      expect(result[:city]).to eq('Cuiabá')
    end

    it 'extrai keyword de marca para "tem empresa que trabalha com Intelbras?"' do
      result = described_class.parse('tem empresa que trabalha com Intelbras?')
      expect(result[:keyword]).to eq('Intelbras')
    end

    it 'extrai keyword de servico para "quem trabalha com carregador?"' do
      result = described_class.parse('quem trabalha com carregador?')
      expect(result[:keyword]).to eq('carregador')
    end
  end
end
