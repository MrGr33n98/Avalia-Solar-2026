# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::IntentParserService, type: :service do
  describe '.parse' do
    it 'reconhece São Paulo/SP adequadamente' do
      res = described_class.parse('Quero instalador em São Paulo SP')
      expect(res[:city]).to eq('São Paulo')
      expect(res[:state]).to eq('SP')
    end

    it 'reconhece Rio Branco/AC' do
      res = described_class.parse('Procurando empresa em Rio Branco AC')
      expect(res[:city]).to eq('Rio Branco')
      expect(res[:state]).to eq('AC')
    end

    it 'reconhece Santa Maria/RS' do
      res = described_class.parse('Instalação em Santa Maria RS')
      expect(res[:city]).to eq('Santa Maria')
      expect(res[:state]).to eq('RS')
    end

    it 'reconhece Registro/SP' do
      res = described_class.parse('Preciso em Registro SP')
      expect(res[:city]).to eq('Registro')
      expect(res[:state]).to eq('SP')
    end

    it 'reconhece Formosa/GO' do
      res = described_class.parse('Carregador em Formosa GO')
      expect(res[:city]).to eq('Formosa')
      expect(res[:state]).to eq('GO')
    end

    it 'trata texto sem localização identificada' do
      res = described_class.parse('Como funciona o financiamento solar?')
      expect(res[:city]).to be_nil
      expect(res[:state]).to be_nil
    end
  end
end
